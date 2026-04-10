import os
import re
import json
from openai import OpenAI


def build_prompt(query: str, chunks: list, history: list = None) -> list:
    context_blocks = []
    for i, chunk in enumerate(chunks, start=1):
        block = (
            f"[Source {i}, p.{chunk['pageNumber']}]:\n"
            f"{chunk['text']}"
        )
        context_blocks.append(block)

    context_text = "\n\n".join(context_blocks)

    system_prompt = (
        "You are a medical assistant helping healthcare professionals. "
        "Answer ONLY using the provided context. "
        "For every claim you make, cite the source using the format [Source N, p.X]. "
        "If the context does not contain enough information to answer, respond with: "
        "'I could not find relevant information in the uploaded documents.' "
        "Do not hallucinate or use outside knowledge."
    )

    messages = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history)

    user_message = (
        f"Context:\n{context_text}\n\n"
        f"Question: {query}"
    )
    messages.append({"role": "user", "content": user_message})

    return messages


def parse_response(answer_text: str, chunks: list) -> dict:

    bracket_groups = re.findall(r"\[([^\]]+)\]", answer_text)
    raw_pairs = []
    for group in bracket_groups:
        parts = [p.strip() for p in group.split(";")]
        for part in parts:
            m = re.match(r"Source\s+(\d+),\s*p\.(\d+)", part.strip())
            if m:
                raw_pairs.append((m.group(1), m.group(2)))
    matches = raw_pairs

    seen = set()
    citations = []

    for source_num_str, page_num_str in matches:
        source_num = int(source_num_str)
        page_num = int(page_num_str)

        key = (source_num, page_num)
        if key in seen:
            continue
        seen.add(key)

        chunk_index = source_num - 1
        if chunk_index < len(chunks):
            citations.append({
                "sourceNumber": source_num,
                "pageNumber": page_num,
                "documentId": chunks[chunk_index]["documentId"],
                "chunkText": chunks[chunk_index]["text"],
            })

    return {
        "answer": answer_text,
        "citations": citations,
    }


def generate_answer(query: str, chunks: list, history: list = None) -> dict:
    if not chunks:
        return {
            "answer": "I could not find relevant information in the uploaded documents.",
            "citations": [],
            "chunks_used": 0,
        }

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    messages = build_prompt(query, chunks, history=history)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.2,
        max_tokens=1024,
    )

    answer_text = response.choices[0].message.content
    parsed = parse_response(answer_text, chunks)

    return {
        "answer": parsed["answer"],
        "citations": parsed["citations"],
        "chunks_used": len(chunks),
    }


def stream_answer(query: str, chunks: list, history: list = None):
    if not chunks:
        fallback = "I could not find relevant information in the uploaded documents."
        yield f"data: {json.dumps({'type': 'token', 'content': fallback})}\n\n"
        yield f"data: {json.dumps({'type': 'citations', 'citations': [], 'chunks_used': 0})}\n\n"
        return

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    messages = build_prompt(query, chunks, history=history)

    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.2,
        max_tokens=1024,
        stream=True,
    )

    full_answer = ""

    for chunk in stream:
        delta = chunk.choices[0].delta
        token = delta.content

        if token is not None:
            full_answer += token
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

    parsed = parse_response(full_answer, chunks)

    yield f"data: {json.dumps({'type': 'citations', 'citations': parsed['citations'], 'chunks_used': len(chunks)})}\n\n"