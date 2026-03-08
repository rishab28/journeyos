#!/usr/bin/env python3
"""
JourneyOS — NotebookLM Intelligence Bridge v3
Robust PDF + URL ingestion with local text extraction fallback.
"""

import asyncio
import argparse
import json
import os
import sys
import traceback

from notebooklm import NotebookLMClient

EXTRACTION_PROMPT = """Generate exactly 10 high-quality UPSC-exam-level flashcard questions from the source material.

For EACH question, provide:
1. A clear, exam-style question (the "front" of the flashcard)
2. A precise, factual answer (the "back" of the flashcard)

IMPORTANT: Return ONLY a valid JSON array with this exact structure:
[
  {"question": "What is...?", "answer": "It is..."},
  {"question": "Who established...?", "answer": "...was established by..."}
]

Do NOT add any text before or after the JSON array. Only output the JSON."""


def extract_text_from_pdf(file_path):
    """Extract text from a PDF file using PyPDF2."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n\n".join(text_parts)
    except Exception as e:
        return None


def extract_text_from_url(url):
    """Synchronously fetch and extract text from a URL."""
    import httpx
    import re
    try:
        with httpx.Client(follow_redirects=True, timeout=30) as http:
            resp = http.get(url)
            resp.raise_for_status()
            text = re.sub(r'<[^>]+>', ' ', resp.text)
            text = re.sub(r'\s+', ' ', text).strip()
            return text if len(text) > 200 else None
    except Exception:
        return None


async def ingest_source(source_input, is_file=False):
    """
    Ingests a source into NotebookLM, uses chat to extract Q&A, returns JSON.
    Has multi-level fallback for robust operation.
    """
    try:
        async with await NotebookLMClient.from_storage() as client:
            # 1. Create a dedicated notebook
            basename = os.path.basename(source_input)[:30] if is_file else source_input[:30]
            notebook_name = f"JOS_{basename}"
            nb = await client.notebooks.create(notebook_name)

            source_added = False

            # 2. Try primary source addition
            try:
                if is_file:
                    if not os.path.exists(source_input):
                        return {"success": False, "error": f"File not found: {source_input}"}
                    source = await client.sources.add_file(
                        nb.id, source_input, wait=True, wait_timeout=180
                    )
                else:
                    source = await client.sources.add_url(
                        nb.id, source_input, wait=True, wait_timeout=180
                    )
                source_added = True
            except Exception as primary_err:
                primary_error = str(primary_err)
                # Primary method failed — try fallback with local text extraction

            # 3. Fallback: extract text locally and add as text source
            if not source_added:
                extracted_text = None

                if is_file:
                    # Extract text from PDF locally
                    extracted_text = extract_text_from_pdf(source_input)
                    if not extracted_text or len(extracted_text) < 100:
                        return {
                            "success": False,
                            "error": f"NotebookLM couldn't process this PDF, and local text extraction also failed. The PDF might be scanned/image-based. Original: {primary_error}"
                        }
                else:
                    # Extract text from URL
                    extracted_text = extract_text_from_url(source_input)
                    if not extracted_text:
                        return {
                            "success": False,
                            "error": f"NotebookLM couldn't process this URL, and fetching content also failed. Original: {primary_error}"
                        }

                # Add the extracted text as a pasted-text source
                try:
                    title = os.path.basename(source_input) if is_file else source_input[:80]
                    # Limit to 50k chars to avoid API limits
                    source = await client.sources.add_text(
                        nb.id,
                        title=title,
                        content=extracted_text[:50000],
                        wait=True,
                        wait_timeout=120
                    )
                    source_added = True
                except Exception as text_err:
                    return {
                        "success": False,
                        "error": f"All ingestion methods failed. Primary: {primary_error}. Text fallback: {str(text_err)}"
                    }

            # 4. Use chat to extract structured Q&A
            try:
                result = await client.chat.ask(nb.id, EXTRACTION_PROMPT)
                answer = result.answer
            except Exception as chat_err:
                return {"success": False, "error": f"Chat extraction failed: {str(chat_err)}"}

            # 5. Parse the JSON from the chat response
            try:
                cleaned = answer.strip()
                # Remove markdown code fences
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    cleaned = "\n".join(lines[1:-1]) if len(lines) > 2 else cleaned
                    cleaned = cleaned.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:].strip()
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3].strip()

                qa_pairs = json.loads(cleaned)

                if not isinstance(qa_pairs, list) or len(qa_pairs) == 0:
                    return {"success": False, "error": "AI returned empty or non-list response", "raw": answer[:500]}

                return {
                    "success": True,
                    "notebook_id": nb.id,
                    "data": qa_pairs
                }

            except json.JSONDecodeError as je:
                return {
                    "success": False,
                    "error": f"Failed to parse AI response as JSON: {str(je)}",
                    "raw": answer[:500]
                }

    except Exception as e:
        return {"success": False, "error": str(e), "trace": traceback.format_exc()}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JourneyOS NotebookLM Bridge v3")
    parser.add_argument("input", help="URL or file path to ingest")
    parser.add_argument("--file", action="store_true", help="Treat input as a file path")
    args = parser.parse_args()

    result = asyncio.run(ingest_source(args.input, args.file))
    print(json.dumps(result))
