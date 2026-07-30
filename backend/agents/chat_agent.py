"""
Chat Agent
Act as the "receptionist" and unified routing interface of StudyLoop.
"""
import json
import re
from datetime import date
from utils.gemini_client import ask_gemini
from scheduler.slot_mapper import load_slot_timings

# Sub-agents imports
from agents.planner_agent import generate_daily_plan
from agents.deadline_agent import analyze_deadlines
from agents.study_agent import (
    answer_question, generate_quiz, generate_smart_summary
)

SYSTEM_PROMPT = """
You are StudyLoop AI — a friendly, intelligent academic assistant for college students.
You help students plan their day, understand subjects, track deadlines, and manage their timetable.

Rules:
- Be concise, friendly, and helpful. Use bullet points and emojis where appropriate.
- When formatting timetables, planners, or lists, make them look extremely readable, clean, and professional.
- Do NOT make up timetable or deadline data you don't have.
- Always end your response with a section labeled:
  "💡 What would you like to do next?" followed by 2-3 logical next actions matching the context (e.g. "1. Create a daily planner", "2. Upload study notes").
"""


def chat(message: str, history: list = None, session_context: dict = None) -> dict:
    """
    Main chat function. Uses Gemini to route to correct sub-agents or answer contextual follow-ups.
    """
    if not session_context:
        session_context = {}

    student = session_context.get("student", {})
    
    # Load chosen timetable; fallback to first generated option if not saved
    timetable = session_context.get("chosen_timetable", {}).get("schedule", [])
    if not timetable and session_context.get("timetable_options"):
        options = session_context.get("timetable_options", [])
        if options and isinstance(options, list):
            timetable = options[0].get("schedule", [])

    lifestyle = session_context.get("lifestyle", {
        "wake_up_time": "07:00",
        "sleep_time": "23:00",
        "study_hours": 4,
        "meal_timings": ["08:00", "13:00", "20:00"],
        "gym_preference": True,
        "club_activities": [],
        "travel_time": 30
    })

    deadlines = session_context.get("deadlines", [])
    notes_text = session_context.get("notes_text", "")
    notes_filename = session_context.get("notes_filename", "")

    # Format conversation history
    history_text = ""
    if history:
        for msg in history[-8:]:
            role = "Student" if msg.get("role") == "user" else "Assistant"
            history_text += f"{role}: {msg.get('text', '')}\n"

    current_date_str = date.today().strftime("%A, %Y-%m-%d")

    router_prompt = f"""
Identify the student's intent and extract any structured details.
Today's Date: {current_date_str}

Conversation History:
{history_text}

Student's Message: {message}

You must respond with ONLY a valid JSON block containing these exact keys:
- "intent": "planner" | "study" | "deadline" | "timetable" | "general"
- "refined_message": "Self-contained student query resolved against context/history."
- "extracted_info": {{
    "course": string or null,
    "due_date": "YYYY-MM-DD" or null (parse terms like "tomorrow", "next Friday", "Friday" relative to today: {current_date_str}),
    "description": string or null,
    "estimated_hours": integer or null,
    "slide_number": integer or null,
    "page_number": integer or null,
    "adjustment": string or null
  }}
"""
    
    router_sys = """
You are the intent router for StudyLoop. Categories:
- 'planner': planning/schedule/routine, adjustments ("practice", "busy", "gym", "couldn't study").
- 'study': academic Q&A, explain, summarize, quiz, study uploaded files.
- 'deadline': due dates, exams, assignments, tracking tasks.
- 'timetable': class slots, free time lookup.
- 'general': greeting/chit-chat.
Output JSON only. Do not wrap in markdown quotes.
"""

    raw_router_response = ask_gemini(router_prompt, system=router_sys)
    
    # Strip potential markdown backticks from Gemini
    clean_router = re.sub(r'```(json)?', '', raw_router_response).strip()
    try:
        routing_data = json.loads(clean_router)
    except Exception:
        routing_data = {
            "intent": "general",
            "refined_message": message,
            "extracted_info": {}
        }

    intent = routing_data.get("intent", "general")
    refined_message = routing_data.get("refined_message", message)
    extracted = routing_data.get("extracted_info", {})

    response_text = ""
    action = None

    if intent == "planner":
        action = "navigate:/planner"
        if not timetable:
            response_text = "I'd love to help you plan your day, but you haven't generated your timetable yet! 📅 Please generate your timetable first before planning your day."
            action = "navigate:/slot-selection"
        else:
            adjustment = extracted.get("adjustment") or None
            if not adjustment and any(kw in message.lower() for kw in ["practice", "gym", "football", "match", "busy", "missed", "couldn't"]):
                adjustment = message
                
            plan = generate_daily_plan(
                timetable=timetable,
                lifestyle=lifestyle,
                student=student,
                deadlines=deadlines,
                adjustment=adjustment
            )
            session_context["daily_plan"] = plan
            
            format_prompt = f"""
Convert this structured daily schedule list into a clean, friendly, emoji-rich, natural language schedule update for the student.
If there was a special adjustment request ({adjustment}), highlight how it was incorporated (e.g. shifted study blocks, accounted for practice).

Schedule list:
{plan}
"""
            response_text = ask_gemini(format_prompt, system=SYSTEM_PROMPT)

    elif intent == "deadline":
        action = "navigate:/deadlines"
        due_date = extracted.get("due_date")
        course = extracted.get("course") or extracted.get("description")
        is_completion = any(kw in message.lower() for kw in ["done", "complete", "completed", "finish", "finished", "remove", "delete"])

        if is_completion and course:
            if "deadlines" in session_context:
                session_context["deadlines"] = [
                    d for d in session_context["deadlines"]
                    if d.get("course", "").lower() != course.lower()
                ]
            
            analysis = analyze_deadlines(session_context.get("deadlines", []))
            
            plan_note = ""
            if timetable:
                plan = generate_daily_plan(
                    timetable=timetable,
                    lifestyle=lifestyle,
                    student=student,
                    deadlines=session_context.get("deadlines", [])
                )
                session_context["daily_plan"] = plan
                plan_note = "Your planner has been updated successfully."

            response_text = f"✅ Marked **{course.upper()}** as completed! {plan_note}"
        elif due_date and course:
            new_dl = {
                "course": course.upper(),
                "type": "Exam" if "exam" in message.lower() or "test" in message.lower() else "Assignment",
                "due_date": due_date,
                "estimated_study_hours": extracted.get("estimated_hours") or 3
            }
            if "deadlines" not in session_context:
                session_context["deadlines"] = []
            session_context["deadlines"].append(new_dl)
            
            analysis = analyze_deadlines(session_context["deadlines"])
            
            plan_note = ""
            if timetable:
                plan = generate_daily_plan(
                    timetable=timetable,
                    lifestyle=lifestyle,
                    student=student,
                    deadlines=session_context["deadlines"]
                )
                session_context["daily_plan"] = plan
                plan_note = "Your planner has been updated successfully."
                
            try:
                days_left = (date.fromisoformat(due_date) - date.today()).days
                days_str = f"{days_left} days" if days_left > 0 else "0 days"
            except Exception:
                days_str = "upcoming"
                
            response_text = f"Added {new_dl['course']} assignment due on Friday. {plan_note} You have a {new_dl['course']} assignment due in {days_str}."
        else:
            if not deadlines:
                response_text = "You don't have any deadlines tracked yet! 📋 Would you like to add one? Just tell me: *\"I have a DBMS assignment due next Friday\"*."
            else:
                analysis = analyze_deadlines(deadlines)
                response_text = f"Here are your upcoming deadlines:\n\n{analysis.get('raw_analysis', '')}"

    elif intent == "study":
        action = "navigate:/study"
        is_quiz = any(kw in message.lower() for kw in ["quiz", "mcq", "question", "test me", "self-assessment"])
        is_summary = any(kw in message.lower() for kw in ["summarize", "summary", "cheat-sheet", "revision sheet"])
        
        if is_quiz:
            if not notes_text:
                response_text = "I couldn't find any uploaded notes. Please upload your PPT or PDF first, or ask a general question."
            else:
                quiz = generate_quiz(notes_text)
                quiz_prompt = f"Convert this quiz JSON structure into a clean, interactive text-based quiz for the student. Do not show answers immediately; ask them to try replying with their choices.\nQuiz data: {quiz}"
                response_text = ask_gemini(quiz_prompt, system=SYSTEM_PROMPT)
        elif is_summary:
            if not notes_text:
                response_text = "I couldn't find any uploaded notes. Please upload your PPT or PDF first, or ask a general question."
            else:
                style = "revision" if "cheat" in message.lower() or "revision" in message.lower() else "bullet"
                summary = generate_smart_summary(notes_text, style=style)
                response_text = f"Here is the summary of your uploaded notes:\n\n{summary}"
        else:
            student_branch = student.get("branch", "")
            response_text = answer_question(
                query=refined_message,
                mode="notes" if notes_text else "general",
                notes_text=notes_text,
                student_branch=student_branch
            )

    elif intent == "timetable":
        action = "navigate:/timetable"
        if not timetable:
            response_text = "You haven't generated a timetable yet! 📅 Go to the **Slot Selection** page to choose your slots and generate clash-free combinations."
            action = "navigate:/slot-selection"
        else:
            is_wednesday_slots = any(kw in message.lower() for kw in ["wednesday", "wed"])
            if is_wednesday_slots:
                timings = load_slot_timings()
                wed_classes = [s for s in timetable if s.get("day") == "Wednesday"]
                wed_slots = ["A12", "B12", "C12", "A22", "B22"]
                busy_slots = [s.get("slot_code") for s in wed_classes if s.get("slot_code") in wed_slots]
                free_slots = [s for s in wed_slots if s not in busy_slots]
                
                wed_classes_str = ", ".join([f"{c.get('course')} ({c.get('slot_code')} at {c.get('time')})" for c in wed_classes]) if wed_classes else "No classes"
                free_slots_str = ", ".join([f"{slot} ({timings.get(slot, {}).get('time', '')})" for slot in free_slots])
                
                response_text = f"🗓️ **Wednesday Schedule Overview:**\n- **Classes:** {wed_classes_str}\n- **Free Slots:** {free_slots_str}"
            else:
                timetable_prompt = f"The student has this timetable schedule: {timetable}. Generate a beautiful, friendly text summary of their weekly timetable, highlighting which days are busy and which have morning or afternoon blocks."
                response_text = ask_gemini(timetable_prompt, system=SYSTEM_PROMPT)

    else:
        gen_prompt = f"Student says: {message}\nRespond warmly and guide them to StudyLoop features (timetables, planning, deadlines, studying/tutoring)."
        response_text = ask_gemini(gen_prompt, system=SYSTEM_PROMPT)

    # Add suggestions if they aren't present
    if "💡 What would you like to do next?" not in response_text:
        if intent == "planner":
            sugs = "\n\n💡 **What would you like to do next?**\n1. Modify study hours preferences\n2. Add upcoming assignment deadlines\n3. Ask questions about your courses"
        elif intent == "deadline":
            sugs = "\n\n💡 **What would you like to do next?**\n1. Adjust today's study plan around these deadlines\n2. Ask for study recommendations for an assignment topic\n3. View your full calendar schedule"
        elif intent == "study":
            sugs = "\n\n💡 **What would you like to do next?**\n1. Generate flashcards or revision cheat-sheet\n2. Create self-assessment MCQs\n3. Update your planner to focus on this subject"
        elif intent == "timetable":
            sugs = "\n\n💡 **What would you like to do next?**\n1. Generate daily plan from this timetable\n2. Check free slots for other days\n3. Go to Course Selection to modify courses"
        else:
            sugs = "\n\n💡 **What would you like to do next?**\n1. Plan my day\n2. Check upcoming deadlines\n3. Upload course lecture notes"
        response_text += sugs

    return {
        "response": response_text,
        "intent": intent,
        "action": action
    }
