"""
Study Agent — Advanced Academic Tutor & Learning Resource Engine
─────────────────────────────────────────────────────────────────
Supports 18 comprehensive study features:
1. Multi-format text extraction (PDF, PPT/PPTX, DOCX, TXT)
2. AI-Based Content Taxonomy & Understanding
3. Smart Summarization (Short, Detailed, Bullet Notes)
4. Concept Explanations with Simplicity Controls (Standard, Beginner/ELI5, Exam Focused)
5. Page / Slide Specific Retrieval & Explanation
6. Important Exam Topics Extraction (CAT / FAT prep)
7. MCQ Quiz Generator
8. Interactive Flashcards (Front/Back)
9. Condensed Revision Cheat-sheet Generator
10. Dual Mode RAG (Notes first with fallback to General AI)
11. General Academic Tutor
12. Curriculum & Branch Personalization
13. Resource Recommendations (YouTube topics, docs, practice questions)
14. Integration with Planner & Deadline Agent
"""

import io
import re
import zipfile
import xml.etree.ElementTree as ET
from utils.gemini_client import ask_gemini, AI_ENABLED

# PyMuPDF support
try:
    import fitz  # PyMuPDF
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False


def _extract_pdf_text(file_bytes: bytes) -> str:
    """Extract page-indexed text from PDF."""
    if not PDF_SUPPORT:
        return ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages_text = []
        for i, page in enumerate(doc):
            p_text = page.get_text()
            if p_text.strip():
                pages_text.append(f"--- Page {i+1} ---\n{p_text}")
        doc.close()
        return "\n\n".join(pages_text)[:60000]
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return ""


def _extract_docx_text(file_bytes: bytes) -> str:
    """Extract text from DOCX file using built-in zipfile & xml parsing."""
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            texts = []
            for node in tree.iter():
                if node.tag.endswith('}t'):
                    if node.text:
                        texts.append(node.text)
            return " ".join(texts)[:60000]
    except Exception as e:
        print(f"Error parsing DOCX: {e}")
        return ""


def _extract_pptx_text(file_bytes: bytes) -> str:
    """Extract slide-indexed text from PPTX file using built-in zipfile & xml parsing."""
    try:
        slides_text = []
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            slide_files = [f for f in z.namelist() if f.startswith("ppt/slides/slide") and f.endswith(".xml")]
            # Sort slides numerically slide1.xml, slide2.xml...
            slide_files.sort(key=lambda x: int(re.search(r'\d+', x.split('/')[-1]).group()))
            for idx, slide_file in enumerate(slide_files):
                xml_content = z.read(slide_file)
                tree = ET.fromstring(xml_content)
                slide_texts = []
                for node in tree.iter():
                    if node.tag.endswith('}t'):
                        if node.text:
                            slide_texts.append(node.text)
                if slide_texts:
                    slides_text.append(f"--- Slide {idx+1} ---\n" + " ".join(slide_texts))
        return "\n\n".join(slides_text)[:60000]
    except Exception as e:
        print(f"Error parsing PPTX: {e}")
        return ""


def extract_file_content(file_bytes: bytes, filename: str) -> str:
    """Extract text from PDF, PPTX, DOCX, or TXT."""
    fn = filename.lower()
    if fn.endswith(".pdf"):
        return _extract_pdf_text(file_bytes)
    elif fn.endswith(".docx") or fn.endswith(".doc"):
        return _extract_docx_text(file_bytes)
    elif fn.endswith(".pptx") or fn.endswith(".ppt"):
        return _extract_pptx_text(file_bytes)
    else:
        try:
            return file_bytes.decode("utf-8", errors="ignore")[:60000]
        except Exception:
            return ""


# ── System Prompts ─────────────────────────────────────────────────────────────

SYSTEM_STUDY_TUTOR = """
You are StudyLoop's Study Assistant — an expert academic tutor for engineering students.
Always structure your responses cleanly using Markdown headers, bullet points, code blocks (if relevant), and highlight key terms in **bold**.
End explanations with a "💡 Exam Tip" box.
"""

# ── Service Methods ────────────────────────────────────────────────────────────

def process_uploaded_notes(file_bytes: bytes, filename: str) -> dict:
    """Extract content, compute topic taxonomy, and generate initial quick summary."""
    text = extract_file_content(file_bytes, filename)
    if not text.strip():
        return {
            "status": "error",
            "message": f"Could not extract text from {filename}. Supported formats: PDF, PPTX, DOCX, TXT.",
            "extracted_chars": 0
        }
    
    # Topic taxonomy extraction prompt
    tax_prompt = f"""
Analyze the following course material ({filename}) and provide a quick overview:
1. **Core Subject & Title**
2. **Main Topics / Units Covered** (list 4-6 topics)
3. **5-Line Executive Summary**

Material Content Snippet:
────────────────────────
{text[:15000]}
────────────────────────
"""
    summary = ask_gemini(tax_prompt, system=SYSTEM_STUDY_TUTOR)
    return {
        "status": "success",
        "filename": filename,
        "summary": summary,
        "extracted_chars": len(text),
        "notes_text": text
    }


def generate_smart_summary(notes_text: str, style: str = "bullet") -> str:
    """
    Generate summary in requested style:
    - 'short' (5-10 lines)
    - 'detailed' (chapter-wise)
    - 'bullet' (key points & definitions)
    - 'revision' (2-3 page cheat-sheet)
    """
    if style == "short":
        prompt = f"Provide a concise 5 to 10 line high-level executive summary of these notes:\n\n{notes_text[:25000]}"
    elif style == "detailed":
        prompt = f"Provide a detailed chapter-by-chapter / section-by-section breakdown of these study notes with key subtopics and explanations:\n\n{notes_text[:35000]}"
    elif style == "revision":
        prompt = f"Create a comprehensive 2-page Revision Cheat-Sheet from these notes. Include crucial formulas, definitions, key algorithms, and memory triggers:\n\n{notes_text[:35000]}"
    else:  # bullet
        prompt = f"Extract all key points, important definitions, and bullet notes from these study notes:\n\n{notes_text[:25000]}"

    return ask_gemini(prompt, system=SYSTEM_STUDY_TUTOR)


def answer_question(query: str, mode: str = "general", notes_text: str = "", level: str = "standard", student_branch: str = "") -> str:
    """
    Answer question with dual-mode RAG, simplicity level controls (Standard, ELI5 / Beginner, Exam-Focused),
    and curriculum branch personalization.
    """
    level_instruction = ""
    if level == "beginner":
        level_instruction = "Explain in extremely simple language with intuitive analogies like I am a complete beginner."
    elif level == "exam":
        level_instruction = "Focus strictly on exam relevance: key definitions, standard diagrams/steps, expected marks distribution, and common pitfalls."

    branch_context = f"\nStudent Specialization / Branch: {student_branch}" if student_branch else ""

    if mode == "notes" and notes_text.strip():
        # Check if query asks for specific slide or page
        page_slide_match = re.search(r'(slide|page)\s*(\d+)', query, re.IGNORECASE)
        context_chunk = notes_text
        if page_slide_match:
            target_num = page_slide_match.group(2)
            pattern = re.compile(rf'---\s*(Slide|Page)\s*{target_num}\s*---(.*?)(?=---\s*(Slide|Page)|\Z)', re.DOTALL | re.IGNORECASE)
            match = pattern.search(notes_text)
            if match:
                context_chunk = f"Target {page_slide_match.group(1)} {target_num} Content:\n" + match.group(0)

        prompt = f"""
You are answering based ONLY on the student's uploaded course material.
{level_instruction}
{branch_context}

Course Material:
────────────────
{context_chunk[:30000]}
────────────────

Student Question:
{query}

If the topic is NOT covered in the material, state clearly: "⚠️ Note: This specific detail is not found in your uploaded file. Here is the general explanation:" and then provide the accurate answer.
"""
    else:
        prompt = f"""
{level_instruction}
{branch_context}

Question:
{query}
"""

    return ask_gemini(prompt, system=SYSTEM_STUDY_TUTOR)


def extract_important_topics(notes_text: str) -> str:
    """Extract top 5-10 exam topics (CAT / FAT preparation)."""
    prompt = f"""
Based on the following course material, identify the top 5 to 10 MOST IMPORTANT Exam Topics for CAT / FAT assessments.
For each topic, include:
- **Topic Name**
- **Likely Question Pattern** (e.g. 5-mark numerical, 10-mark architectural diagram)
- **Core Key Concept to Remember**

Material:
─────────
{notes_text[:30000]}
"""
    return ask_gemini(prompt, system=SYSTEM_STUDY_TUTOR)


def generate_flashcards(notes_text: str, count: int = 6) -> list:
    """Generate key concept flashcards in [{front, back}] format."""
    prompt = f"""
Based on the notes below, generate exactly {count} revision flashcards.
Format strictly as JSON array of objects with "front" and "back" keys:
[
  {{"front": "Concept or Question", "back": "Clear concise explanation or answer"}},
  ...
]

Notes:
──────
{notes_text[:20000]}
"""
    raw = ask_gemini(prompt, system="Output valid JSON only. Do not add markdown backticks if possible.")
    try:
        # Strip code blocks if present
        clean = re.sub(r'```(json)?', '', raw).strip()
        import json
        return json.loads(clean)
    except Exception:
        # Fallback flashcards
        return [
            {"front": "Key Term / Concept", "back": raw[:200]}
        ]


def generate_resource_recommendations(topic: str) -> str:
    """Suggest YouTube topics, official docs, and practice question sets."""
    prompt = f"""
For the topic/subject: "{topic}", provide structured study recommendations:
1. 🎥 **Recommended YouTube Search Topics & Channels**
2. 📖 **Official Documentation / Standard Textbooks**
3. 📝 **Practice Question Focus Areas**
4. 💡 **Self-Assessment Checkpoints**
"""
    return ask_gemini(prompt, system=SYSTEM_STUDY_TUTOR)


def generate_quiz(notes_text: str, num_questions: int = 5) -> list:
    """Generate multiple-choice quiz questions (MCQs) with options, correct answer, and explanation."""
    prompt = f"""
Based on the following notes, generate exactly {num_questions} Multiple Choice Questions (MCQs) for self-assessment.
Return ONLY a valid JSON array of objects with the following keys:
- "question": string
- "options": list of 4 strings (e.g. ["A. ...", "B. ...", "C. ...", "D. ..."])
- "answer": string (must match one of the option letters like "A", "B", "C", or "D")
- "explanation": string (brief explanation of why this answer is correct)

Example structure:
[
  {{
    "question": "Which Normal Form removes partial dependencies?",
    "options": ["A. 1NF", "B. 2NF", "C. 3NF", "D. BCNF"],
    "answer": "B",
    "explanation": "2NF eliminates partial dependency by ensuring all non-key attributes are fully dependent on the primary key."
  }}
]

Notes:
──────
{notes_text[:25000]}
"""
    raw = ask_gemini(prompt, system="Output valid JSON array only. Do not wrap in markdown quotes if possible.")
    try:
        clean = re.sub(r'```(json)?', '', raw).strip()
        import json
        parsed = json.loads(clean)
        if isinstance(parsed, list):
            return parsed
        return []
    except Exception as e:
        print(f"Error parsing quiz JSON: {e}")
        return [
            {{
                "question": "Sample Assessment Question from Uploaded Notes",
                "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
                "answer": "A",
                "explanation": "Sample explanation."
            }}
        ]

