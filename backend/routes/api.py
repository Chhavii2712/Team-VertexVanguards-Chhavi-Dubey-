from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any

# ── Core modules ──────────────────────────────────────────────────────────────
from ocr.id_reader import extract_id_details
from agents.identity_agent import identity_agent
from services.curriculum_service import load_curriculum
from services.api_key_manager import GeminiKeyManager
from scheduler import generate_timetables

# ── AI Agents ─────────────────────────────────────────────────────────────────
from agents.planner_agent import generate_daily_plan
from agents.deadline_agent import analyze_deadlines
from agents.study_agent import (
    answer_question, process_uploaded_notes, generate_quiz,
    generate_smart_summary, extract_important_topics, generate_flashcards,
    generate_resource_recommendations
)
from agents.chat_agent import chat as chat_agent

router = APIRouter()

# ── In-memory session store (per-server, good enough for hackathon) ────────────
_session: dict = {}


# ═══════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════

@router.get("/health")
async def health_check():
    """
    Returns backend status and the number of active Gemini keys.
    Never exposes key values.
    """
    GeminiKeyManager.initialize()
    return {
        "status": "ok",
        "ai_enabled": GeminiKeyManager.is_ready,
        "active_keys_count": len(GeminiKeyManager._keys),
        "active_key_index": GeminiKeyManager._current_index + 1 if GeminiKeyManager.is_ready else None,
        "message": (
            f"✅ {len(GeminiKeyManager._keys)} Gemini key(s) loaded."
            if GeminiKeyManager.is_ready
            else "⚠️ No Gemini keys configured. Add keys to backend/.env"
        )
    }



# ═══════════════════════════════════════════════════════════
# REQUEST MODELS
# ═══════════════════════════════════════════════════════════

class TimetableRequest(BaseModel):
    selected_courses: List[str]
    slot_combinations: dict
    preferences: dict

class LifestyleRequest(BaseModel):
    # Core schedule
    wake_up_time: str = "07:00"
    sleep_time: str = "23:00"
    study_hours: int = 3
    meal_timings: List[str] = []
    gym_preference: bool = False
    club_activities: List[str] = []
    travel_time: Optional[int] = 30
    # Personality quiz fields
    sleep_type: Optional[str] = None           # early_bird | night_owl | snoozer
    morning_energy: Optional[str] = None       # ready | coffee | loading
    study_style: Optional[str] = None          # focused | pomodoro | last_minute | mood
    study_environment: Optional[str] = None    # music | silence | rain | cafe
    peak_productivity: Optional[str] = None    # morning | afternoon | evening | late_night
    exercise_type: Optional[str] = None        # gym | sports | walk | none
    meal_preference: Optional[str] = None      # three_meals | skip_breakfast
    phone_usage_hours: Optional[Any] = 1       # 0.5 | 1 | 2 | 3+
    relaxation_style: Optional[str] = None     # music | walk | coffee | nap | netflix
    semester_goal: Optional[str] = None        # cgpa | internship | projects | skills | survive
    deadline_personality: Optional[str] = None # early | on_time | one_day_before | procrastinator
    motivation_style: Optional[str] = None     # encourage | roast | progress | achievements

class DeadlineRequest(BaseModel):
    course: str
    type: str
    due_date: str
    estimated_study_hours: int

class PlannerRequest(BaseModel):
    timetable: List[dict] = []
    lifestyle: dict = {}
    student: dict = {}
    deadlines: List[dict] = []

class StudyRequest(BaseModel):
    query: str
    mode: str = "general"  # "general" | "notes"
    level: str = "standard"  # "standard" | "beginner" | "exam"

class SummarizeRequest(BaseModel):
    style: str = "bullet"  # "short" | "detailed" | "bullet" | "revision"

class TopicRequest(BaseModel):
    topic: Optional[str] = None

class FlashcardRequest(BaseModel):
    count: int = 6

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

class QuizRequest(BaseModel):
    num_questions: int = 5


# ═══════════════════════════════════════════════════════════
# MODULE 1 — OCR + Identity Agent
# ═══════════════════════════════════════════════════════════

@router.post("/scan-id")
async def scan_id(file: UploadFile = File(...)):
    """Upload an ID card image → returns structured student profile."""
    try:
        image_bytes = await file.read()
        raw_data = extract_id_details(image_bytes)
        student_profile = identity_agent.process_ocr_data(raw_data)
        # Store in session
        _session["student"] = student_profile
        return student_profile
    except Exception as e:
        # Instead of 500 Internal Server Error, return JSON so the frontend can display the message
        return {"error": f"Failed to scan ID: {str(e)}"}


# ═══════════════════════════════════════════════════════════
# MODULE 2 — Curriculum Service
# ═══════════════════════════════════════════════════════════

@router.get("/curriculum/{branch_code}")
async def get_curriculum(branch_code: str):
    """Returns the curriculum JSON for the given branch code."""
    return load_curriculum(branch_code)


# ═══════════════════════════════════════════════════════════
# MODULE 3 — FFCS Generator
# ═══════════════════════════════════════════════════════════

@router.post("/generate-timetable")
async def generate_timetable(request: TimetableRequest):
    """Generates all clash-free timetables and returns them ranked."""
    valid = generate_timetables(
        selected_courses=request.selected_courses,
        selected_options=request.slot_combinations,
        preferences=request.preferences,
    )
    if not valid:
        return {"message": "No valid clash-free timetables found.", "options": []}
    _session["timetable_options"] = valid
    return {"message": f"Generated {len(valid)} valid timetable(s).", "options": valid}


# ═══════════════════════════════════════════════════════════
# MODULE 4 — Lifestyle Setup
# ═══════════════════════════════════════════════════════════

@router.post("/save-lifestyle")
async def save_lifestyle(request: LifestyleRequest):
    """Saves the student's full lifestyle + personality quiz data to session."""
    data = request.dict(exclude_none=False)
    _session["lifestyle"] = data
    return {"message": "Lifestyle saved successfully.", "data": data}


# ═══════════════════════════════════════════════════════════
# MODULE 5 — Planner Agent (AI)
# ═══════════════════════════════════════════════════════════

@router.post("/generate-daily-plan")
async def generate_daily_plan_endpoint(request: PlannerRequest):
    """
    Calls the Planner Agent to generate a 24-hour schedule.
    Uses session data if request fields are empty.
    """
    timetable  = request.timetable  or _session.get("chosen_timetable", {}).get("schedule", [])
    lifestyle  = request.lifestyle  or _session.get("lifestyle", {})
    student    = request.student    or _session.get("student", {})
    deadlines  = request.deadlines  or _session.get("deadlines", [])

    plan = generate_daily_plan(
        timetable=timetable,
        lifestyle=lifestyle,
        student=student,
        deadlines=deadlines,
    )
    _session["daily_plan"] = plan
    return {"message": "Daily plan generated.", "plan": plan}


# ═══════════════════════════════════════════════════════════
# MODULE 6 — Deadline Agent (AI-enhanced)
# ═══════════════════════════════════════════════════════════

@router.post("/deadlines")
async def add_deadline(request: DeadlineRequest):
    """Add a deadline to the session and return updated analysis."""
    if "deadlines" not in _session:
        _session["deadlines"] = []
    _session["deadlines"].append(request.dict())
    analysis = analyze_deadlines(_session["deadlines"])
    return {"message": "Deadline added.", "analysis": analysis}

@router.get("/deadlines")
async def get_deadlines():
    """Get all deadlines with AI-powered priority analysis."""
    deadlines = _session.get("deadlines", [])
    analysis = analyze_deadlines(deadlines) if deadlines else {"raw_analysis": "No deadlines yet.", "deadlines_with_days": [], "priority_order": []}
    return {"deadlines": deadlines, "analysis": analysis}


# ═══════════════════════════════════════════════════════════
# MODULE 7 — Adaptive Replanner
# ═══════════════════════════════════════════════════════════

@router.post("/replan")
async def replan():
    """Re-run the Planner Agent with updated deadlines."""
    plan = generate_daily_plan(
        timetable=_session.get("chosen_timetable", {}).get("schedule", []),
        lifestyle=_session.get("lifestyle", {}),
        student=_session.get("student", {}),
        deadlines=_session.get("deadlines", []),
    )
    _session["daily_plan"] = plan
    return {"message": "Replanned successfully.", "plan": plan}


# ═══════════════════════════════════════════════════════════
# MODULE 8 — Study Agent (AI)
# ═══════════════════════════════════════════════════════════

@router.post("/upload-notes")
async def upload_notes(file: UploadFile = File(...)):
    """Upload lecture notes (PDF/PPT/DOCX/TXT). Agent summarizes and indexes them."""
    file_bytes = await file.read()
    result = process_uploaded_notes(file_bytes, file.filename)
    if result["status"] == "success":
        _session["notes_text"] = result["notes_text"]
        _session["notes_filename"] = file.filename
    return {"message": "Notes processed.", "summary": result["summary"], "extracted_chars": result.get("extracted_chars", 0), "filename": file.filename}

@router.post("/study-assistant")
async def study_assistant(request: StudyRequest):
    """Answer an academic question (general or based on uploaded notes) with simplicity level & branch personalization."""
    notes_text = _session.get("notes_text", "") if request.mode == "notes" else ""
    student_branch = _session.get("student", {}).get("branch_code", "")
    response = answer_question(
        query=request.query,
        mode=request.mode,
        notes_text=notes_text,
        level=request.level,
        student_branch=student_branch,
    )
    return {"response": response}

@router.post("/study-summarize")
async def study_summarize(request: SummarizeRequest):
    """Generate smart summary (short, detailed, bullet, or revision cheat-sheet)."""
    notes_text = _session.get("notes_text", "")
    if not notes_text:
        raise HTTPException(status_code=400, detail="No notes uploaded yet. Please upload notes first.")
    summary = generate_smart_summary(notes_text, request.style)
    return {"summary": summary, "style": request.style}

@router.post("/study-topics")
async def study_topics():
    """Extract top 5-10 exam topics (CAT / FAT preparation)."""
    notes_text = _session.get("notes_text", "")
    if not notes_text:
        raise HTTPException(status_code=400, detail="No notes uploaded yet. Please upload notes first.")
    topics = extract_important_topics(notes_text)
    return {"topics": topics}

@router.post("/generate-quiz")
async def generate_quiz_endpoint(request: QuizRequest):
    """Generate an MCQ quiz from uploaded notes."""
    notes_text = _session.get("notes_text", "")
    if not notes_text:
        raise HTTPException(status_code=400, detail="No notes uploaded yet. Please upload notes first.")
    quiz = generate_quiz(notes_text, request.num_questions)
    return {"quiz": quiz}

@router.post("/generate-flashcards")
async def generate_flashcards_endpoint(request: FlashcardRequest):
    """Generate interactive revision flashcards."""
    notes_text = _session.get("notes_text", "")
    if not notes_text:
        raise HTTPException(status_code=400, detail="No notes uploaded yet. Please upload notes first.")
    flashcards = generate_flashcards(notes_text, request.count)
    return {"flashcards": flashcards}

@router.post("/recommendations")
async def recommendations_endpoint(request: TopicRequest):
    """Generate YouTube, documentation, and practice recommendations for a topic."""
    topic = request.topic or _session.get("notes_filename", "Current Subject")
    recommendations = generate_resource_recommendations(topic)
    return {"recommendations": recommendations, "topic": topic}

@router.get("/study-context")
async def study_context():
    """Get active session context for Study Agent (uploaded note details, branch, deadlines, active plan)."""
    return {
        "has_notes": bool(_session.get("notes_text")),
        "filename": _session.get("notes_filename", None),
        "student": _session.get("student", {}),
        "deadlines": _session.get("deadlines", []),
        "daily_plan": _session.get("daily_plan", [])
    }



# ═══════════════════════════════════════════════════════════
# MODULE 9 — Chat Agent (AI Router)
# ═══════════════════════════════════════════════════════════

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    The chat router. Detects intent and responds using the right agent.
    Returns an action hint so the frontend can navigate automatically.
    """
    if "chat_history" not in _session:
        _session["chat_history"] = []

    history = request.history if request.history else _session["chat_history"]

    result = chat_agent(
        message=request.message,
        history=history,
        session_context=_session,
    )

    # Save interaction to history
    _session["chat_history"].append({"role": "user", "text": request.message})
    _session["chat_history"].append({"role": "assistant", "text": result.get("response", "")})
    _session["chat_history"] = _session["chat_history"][-20:]

    return result


# ═══════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════

@router.get("/dashboard")
async def get_dashboard():
    """Returns the student's full dashboard data from session."""
    return {
        "student": _session.get("student", {}),
        "daily_plan": _session.get("daily_plan", []),
        "upcoming_deadlines": _session.get("deadlines", []),
        "timetable": _session.get("chosen_timetable", {}),
        "lifestyle": _session.get("lifestyle", {}),
    }

@router.post("/save-timetable")
async def save_timetable(body: dict):
    """Save the student's chosen timetable to session."""
    _session["chosen_timetable"] = body
    return {"message": "Timetable saved."}

@router.delete("/deadlines/{course_name}")
async def delete_deadline(course_name: str):
    """Mark a deadline as completed and remove from session."""
    if "deadlines" in _session:
        _session["deadlines"] = [
            d for d in _session["deadlines"]
            if d.get("course", "").lower() != course_name.lower()
        ]
    
    # Regenerate planner automatically if timetable is set
    timetable = _session.get("chosen_timetable", {}).get("schedule", [])
    if timetable:
        plan = generate_daily_plan(
            timetable=timetable,
            lifestyle=_session.get("lifestyle", {}),
            student=_session.get("student", {}),
            deadlines=_session.get("deadlines", [])
        )
        _session["daily_plan"] = plan

    return {"message": f"Deadline for {course_name} marked as completed."}
