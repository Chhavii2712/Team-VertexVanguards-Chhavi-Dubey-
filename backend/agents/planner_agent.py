"""
Planner Agent
─────────────
Receives: timetable + lifestyle preferences + student profile
Returns:  A structured 24-hour daily schedule

This agent uses Gemini to intelligently fill the free slots between
fixed events (classes, sleep, meals) with study blocks, gym, and travel.
"""
from utils.gemini_client import ask_gemini

SYSTEM_PROMPT = """
You are a smart academic daily planner for a college student in India.
Your job is to generate a realistic, detailed 24-hour schedule.

Rules:
- Respect fixed class timings from the timetable.
- Insert wake-up, breakfast, lunch, dinner, and sleep at sensible times.
- If the student is a Day Scholar, add travel time (before first class and after last class).
- If the student is a Hosteller, no travel time needed.
- Insert gym if the student requested it (usually 5-7 PM).
- Distribute study hours across available free slots. Prioritize high-deadline subjects.
- Keep the schedule realistic — no back-to-back 3-hour study sessions.
- Return ONLY a structured list in this format (one item per line):
  HH:MM | ACTIVITY | TYPE
  Example:
  06:30 | Wake Up | sleep
  07:00 | Breakfast | meal
  08:30 | Java - CSE1010 | class
  ...
- TYPE must be one of: class, study, meal, gym, travel, sleep
"""


def generate_daily_plan(
    timetable: list,
    lifestyle: dict,
    student: dict,
    deadlines: list = None
) -> list:
    """
    Generate a structured daily plan using Gemini AI.

    Args:
        timetable: List of today's class slots [{course, time, day}]
        lifestyle: {wake_up_time, sleep_time, study_hours, gym_preference, travel_time}
        student: {name, branch, residence, current_year_of_study}
        deadlines: Optional list of upcoming deadlines for priority study scheduling

    Returns:
        List of schedule blocks [{"time": "06:30", "label": "...", "type": "..."}]
    """
    student_type = student.get("residence", "Hosteller")
    travel_note = (
        f"Student is a Day Scholar with {lifestyle.get('travel_time', 30)} minutes one-way travel."
        if student_type == "Day Scholar"
        else "Student is a Hosteller (no travel needed)."
    )

    today_classes = "\n".join(
        [f"  - {s.get('course')} at {s.get('time')} on {s.get('day')}" for s in timetable]
    ) if timetable else "  - No classes today"

    deadline_note = ""
    if deadlines:
        urgent = sorted(deadlines, key=lambda d: d.get("daysLeft", 99))[:3]
        deadline_note = "Priority subjects for study (most urgent first):\n" + "\n".join(
            [f"  - {d.get('course')} ({d.get('type')}) — {d.get('daysLeft', '?')} days left" for d in urgent]
        )

    prompt = f"""
Student Profile:
- Name: {student.get('name', 'Student')}
- Branch: {student.get('branch', 'CSE')}
- Year: {student.get('current_year_of_study', 1)}
- {travel_note}

Today's classes:
{today_classes}

Lifestyle preferences:
- Wake up: {lifestyle.get('wake_up_time', '06:30')}
- Sleep: {lifestyle.get('sleep_time', '23:00')}
- Daily study hours needed: {lifestyle.get('study_hours', 3)}
- Gym: {'Yes, in the evening' if lifestyle.get('gym_preference') else 'No'}

{deadline_note}

Generate a complete 24-hour schedule for today.
"""

    raw_response = ask_gemini(prompt, system=SYSTEM_PROMPT)

    # Parse the response into structured blocks
    return _parse_schedule(raw_response)


def _parse_schedule(raw: str) -> list:
    """Parse 'HH:MM | ACTIVITY | TYPE' lines into a list of dicts."""
    blocks = []
    for line in raw.strip().split("\n"):
        line = line.strip()
        if "|" not in line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 3:
            blocks.append({
                "time": parts[0],
                "label": parts[1],
                "type": parts[2].lower(),
            })
        elif len(parts) == 2:
            blocks.append({
                "time": parts[0],
                "label": parts[1],
                "type": "other",
            })
    return blocks
