"""
Chat Agent
──────────
Acts as the "receptionist" of StudyLoop.
It receives any message from the student and:
  1. Detects the INTENT (planner / study / deadline / timetable / general)
  2. Routes to the correct agent OR answers directly

This is NOT ChatGPT — it is a smart router with conversational capability.
"""
from utils.gemini_client import ask_gemini

# Intent routing keywords (fast path before calling AI)
_INTENT_KEYWORDS = {
    "planner": ["plan my day", "schedule", "daily routine", "what should i do today", "organize my day"],
    "study": ["explain", "what is", "how does", "define", "difference between", "example of", "teach me", "summarize"],
    "deadline": ["deadline", "assignment", "due", "exam", "test", "submission", "how many days"],
    "timetable": ["timetable", "class", "slot", "when is", "my schedule"],
}

SYSTEM_PROMPT = """
You are StudyLoop AI — a friendly, intelligent academic assistant for college students.
You help students plan their day, understand subjects, track deadlines, and manage their timetable.

Rules:
- Be concise and friendly. Use bullet points and emojis where appropriate.
- If the student asks about planning, give a brief schedule suggestion.
- If asked about a subject topic, explain it simply.
- If asked about deadlines, give urgency advice.
- Do NOT make up timetable or deadline data you don't have. Ask the student to provide it.
- Always end with a helpful follow-up question or action.
"""


def detect_intent(message: str) -> str:
    """
    Fast intent detection using keyword matching.
    Returns: 'planner' | 'study' | 'deadline' | 'timetable' | 'general'
    """
    msg_lower = message.lower()
    for intent, keywords in _INTENT_KEYWORDS.items():
        if any(kw in msg_lower for kw in keywords):
            return intent
    return "general"


def chat(message: str, history: list = None, session_context: dict = None) -> dict:
    """
    Main chat function. Detects intent and responds appropriately.

    Args:
        message:         The student's message
        history:         Previous messages [{"role": "user"|"assistant", "text": str}]
        session_context: Optional student session data (profile, timetable, deadlines)

    Returns:
        {"response": str, "intent": str, "action": str | None}
    """
    intent = detect_intent(message)

    # Build context from session if available
    context_block = ""
    if session_context:
        student = session_context.get("student", {})
        if student:
            context_block = f"""
Student context:
- Name: {student.get('name', 'Student')}
- Branch: {student.get('branch', 'CSE')}
- Type: {student.get('residence', 'Hosteller')}
"""

    # Build conversation history for Gemini
    history_text = ""
    if history:
        for msg in history[-6:]:  # Last 3 turns
            role = "Student" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['text']}\n"

    prompt = f"""
{context_block}
{history_text}
Student: {message}

Respond as StudyLoop AI. Intent detected: {intent}.
"""

    response = ask_gemini(prompt, system=SYSTEM_PROMPT)

    # Determine if a frontend action should be triggered
    action = None
    if intent == "planner":
        action = "navigate:/planner"
    elif intent == "timetable":
        action = "navigate:/timetable"
    elif intent == "deadline":
        action = "navigate:/deadlines"
    elif intent == "study":
        action = "navigate:/study"

    return {
        "response": response,
        "intent": intent,
        "action": action,
    }
