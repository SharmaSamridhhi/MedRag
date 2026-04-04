import os
import re
import json
from openai import OpenAI


def build_prompt(query: str, chunks: list) -> list:
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

    user_message = (
        f"Context:\n{context_text}\n\n"
        f"Question: {query}"
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]


def parse_response(answer_text: str, chunks: list) -> dict:
    pattern = r"\[Source (\d+),\s*p\.(\d+)\]"
    matches = re.findall(pattern, answer_text)

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
            })

    return {
        "answer": answer_text,
        "citations": citations,
    }


def generate_answer(query: str, chunks: list) -> dict:
    """Non-streaming version — kept for reference/testing."""
    if not chunks:
        return {
            "answer": "I could not find relevant information in the uploaded documents.",
            "citations": [],
            "chunks_used": 0,
        }

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    messages = build_prompt(query, chunks)

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


def stream_answer(query: str, chunks: list):
    """
    Generator function that yields SSE-formatted strings.
    
    SSE format is:
        data: <json string>\n\n
    
    We send two types of events:
      1. token events  → {"type": "token", "content": "some text"}
      2. citations event → {"type": "citations", "citations": [...], "chunks_used": N}
    
    The frontend listens for these and renders accordingly.
    """
    if not chunks:
        fallback = "I could not find relevant information in the uploaded documents."
        yield f"data: {json.dumps({'type': 'token', 'content': fallback})}\n\n"
        yield f"data: {json.dumps({'type': 'citations', 'citations': [], 'chunks_used': 0})}\n\n"
        return

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    messages = build_prompt(query, chunks)

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