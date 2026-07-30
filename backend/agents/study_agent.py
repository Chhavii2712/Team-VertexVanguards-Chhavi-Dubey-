"""
Study Agent
───────────
Two modes:
  1. General AI  — student asks any academic question, Gemini answers
  2. From Notes  — student uploads a PDF, Gemini reads it and answers based on it

Also generates: Summaries, Flashcards, Quizzes, Important Questions
"""
import io
from utils.gemini_client import ask_gemini, AI_ENABLED, _model

# Try importing PyMuPDF for PDF text extraction
try:
    import fitz  # PyMuPDF
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("⚠️  PyMuPDF not installed. PDF uploads will not be parsed. Run: pip install PyMuPDF")

SYSTEM_GENERAL = """
You are StudyLoop's Study Assistant — an expert academic tutor for engineering students.
You explain concepts clearly with examples, analogies, and step-by-step reasoning.
Keep answers structured with headers and bullet points where appropriate.
After explaining, always add: "💡 Quick Tip:" with one practical exam tip.
"""

SYSTEM_NOTES = """
You are StudyLoop's personalized study assistant.
You have been provided with the student's own notes/lecture slides as context.
Answer ONLY based on the provided notes. If the answer is not in the notes, say so clearly.
Quote relevant sections when helpful.
"""


def _extract_pdf_text(file_bytes: bytes) -> str:
    """Extract all text from a PDF using PyMuPDF."""
    if not PDF_SUPPORT:
        return ""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text[:50000]  # Limit to 50k chars to fit in Gemini's context window


def answer_question(query: str, mode: str = "general", notes_text: str = "") -> str:
    """
    Answer a student's academic question.

    Args:
        query:      The student's question
        mode:       "general" or "notes"
        notes_text: Extracted text from uploaded notes (used in "notes" mode)

    Returns:
        AI-generated answer as a string
    """
    if mode == "notes" and notes_text:
        prompt = f"""
Student's Notes:
────────────────
{notes_text}
────────────────

Student's Question:
{query}
"""
        return ask_gemini(prompt, system=SYSTEM_NOTES)
    else:
        return ask_gemini(query, system=SYSTEM_GENERAL)


def summarize_notes(notes_text: str) -> str:
    """Generate a structured summary of the uploaded notes."""
    prompt = f"""
Here are a student's notes:
────────────────
{notes_text[:30000]}
────────────────

Create a comprehensive study summary with:
1. **Key Concepts** (bullet points)
2. **Important Definitions**
3. **Formulas / Rules** (if any)
4. **5 Most Likely Exam Questions**
5. **Quick Revision Flashcards** (Q: ... A: ... format, at least 5)
"""
    return ask_gemini(prompt, system=SYSTEM_GENERAL)


def generate_quiz(notes_text: str, num_questions: int = 5) -> str:
    """Generate a multiple-choice quiz from the notes."""
    prompt = f"""
Based on these notes:
────────────────
{notes_text[:20000]}
────────────────

Generate {num_questions} multiple-choice questions.
Format each as:
Q1. [Question]
A) Option 1
B) Option 2
C) Option 3
D) Option 4
✅ Answer: [Correct option letter]
[Brief explanation]
"""
    return ask_gemini(prompt, system=SYSTEM_GENERAL)


def process_uploaded_notes(file_bytes: bytes, filename: str) -> dict:
    """
    Main function called by the API when a student uploads notes.
    Extracts text and returns a summary.
    """
    if filename.lower().endswith(".pdf"):
        text = _extract_pdf_text(file_bytes)
    else:
        # Plain text file
        try:
            text = file_bytes.decode("utf-8")[:50000]
        except Exception:
            text = ""

    if not text.strip():
        return {
            "status": "error",
            "message": "Could not extract text from file. Please upload a text-based PDF or .txt file.",
            "summary": "",
            "extracted_chars": 0,
        }

    summary = summarize_notes(text)

    return {
        "status": "success",
        "summary": summary,
        "extracted_chars": len(text),
        "notes_text": text,  # stored temporarily for follow-up Q&A
    }
