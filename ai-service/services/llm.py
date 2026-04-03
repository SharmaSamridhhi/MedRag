import os
import re
from openai import OpenAI


def build_prompt(query: str, chunks: list) -> list:
    """
    Takes the user query and retrieved chunks.
    Returns the messages array to send to GPT-4o.
    """
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
    """
    Parses the raw LLM answer to extract:
    - answer: the full answer text
    - citations: a structured list of {sourceNumber, pageNumber, documentId}
    """
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
    """
    Main function:
    1. If no chunks → return fallback message
    2. Build prompt → call GPT-4o → parse response
    3. Return {answer, citations, chunks_used}
    """

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