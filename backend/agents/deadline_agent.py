"""
Deadline Agent
──────────────
Receives: list of deadlines (course, due_date, estimated_hours)
Returns:  Prioritized study plan with daily hour allocation per subject

Without AI: pure Python math (hours ÷ days = daily hours)
With AI:    Gemini understands relative importance and gives smarter advice
"""
from datetime import date
from utils.gemini_client import ask_gemini

SYSTEM_PROMPT = """
You are an academic deadline manager for a college student.
Given a list of upcoming deadlines, you must:
1. Rank them by urgency (days left × difficulty).
2. Suggest a daily study split (e.g., "DBMS: 1.5h, Java: 1h today").
3. Give ONE motivational tip.

Respond in this exact format:
PRIORITY LIST:
1. [Course] - [Type] - [Days Left] days - [Suggested daily hours]h/day
2. ...

TODAY'S FOCUS:
- [Course]: [hours]h — [brief reason]

TIP: [one-sentence motivational tip]
"""


def analyze_deadlines(deadlines: list) -> dict:
    """
    Analyzes deadlines and returns a prioritized study breakdown.

    Args:
        deadlines: [{"course": str, "type": str, "due_date": "YYYY-MM-DD", "estimated_study_hours": int}]

    Returns:
        {"raw_analysis": str, "deadlines_with_days": list, "priority_order": list}
    """
    today = date.today()

    # Enrich each deadline with days_left calculation (pure Python, no AI needed)
    enriched = []
    for d in deadlines:
        try:
            due = date.fromisoformat(d.get("due_date", ""))
            days_left = max(0, (due - today).days)
        except Exception:
            days_left = 99
        hours = d.get("estimated_study_hours", 3)
        daily_hours = round(hours / max(days_left, 1), 1)
        enriched.append({
            **d,
            "days_left": days_left,
            "daily_hours_needed": daily_hours,
            "urgency_score": round(hours / max(days_left, 1), 2),
        })

    # Sort by urgency (most urgent first)
    enriched.sort(key=lambda x: -x["urgency_score"])

    if not enriched:
        return {"raw_analysis": "No deadlines found.", "deadlines_with_days": [], "priority_order": []}

    # Build AI prompt
    deadline_list = "\n".join([
        f"- {d['course']} ({d['type']}): due in {d['days_left']} days, needs ~{d['estimated_study_hours']}h total"
        for d in enriched
    ])

    prompt = f"""
The student has the following upcoming deadlines:
{deadline_list}

Today is {today.strftime('%A, %d %B %Y')}.
Analyze and prioritize them.
"""

    ai_analysis = ask_gemini(prompt, system=SYSTEM_PROMPT)

    return {
        "raw_analysis": ai_analysis,
        "deadlines_with_days": enriched,
        "priority_order": [d["course"] for d in enriched],
    }
