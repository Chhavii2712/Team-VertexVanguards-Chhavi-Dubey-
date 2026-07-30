"""
Planner Agent
─────────────
Receives: timetable + lifestyle preferences + student profile + personality quiz answers
Returns:  A structured 24-hour daily schedule

This agent uses Gemini to intelligently fill the free slots between
fixed events (classes, sleep, meals) with study blocks, gym, and travel.
It incorporates the student's personality (sleep type, study style, peak
productivity time, deadline personality, motivation style) for a truly
personalized plan.
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
- Place gym/exercise at the correct time based on exercise_type preference.
- Distribute study hours across available free slots. Prioritize high-deadline subjects.
- Schedule the hardest/most important study during the student's peak productivity time.
- Keep the schedule realistic — no back-to-back 3-hour study sessions without breaks.
- Add short relaxation breaks matching the student's relaxation_style.
- Adjust tone and encouragement to the student's motivation_style.
- Return ONLY a structured list in this format (one item per line):
  HH:MM | ACTIVITY | TYPE
  Example:
  06:30 | Wake Up | sleep
  07:00 | Breakfast | meal
  08:30 | Java - CSE1010 | class
  ...
- TYPE must be one of: class, study, meal, gym, travel, sleep, break
"""


def generate_daily_plan(
    timetable: list,
    lifestyle: dict,
    student: dict,
    deadlines: list = None,
    adjustment: str = None
) -> list:
    """
    Generate a structured daily plan using Gemini AI.

    Args:
        timetable: List of today's class slots [{course, time, day}]
        lifestyle: Full lifestyle + personality dict:
            {wake_up_time, sleep_time, study_hours, gym_preference, travel_time,
             sleep_type, morning_energy, study_style, study_environment,
             peak_productivity, exercise_type, meal_preference, club_activities,
             phone_usage_hours, relaxation_style, semester_goal,
             deadline_personality, motivation_style}
        student: {name, branch, residence, current_year_of_study}
        deadlines: Optional list of upcoming deadlines for priority study scheduling
        adjustment: Optional temporary schedule updates or constraints

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
        urgent = sorted(deadlines, key=lambda d: d.get("days_left", d.get("daysLeft", 99)))[:4]
        deadline_note = "Priority subjects for study (most urgent first):\n" + "\n".join(
            [
                f"  - {d.get('course')} ({d.get('type', 'Task')}) — "
                f"{d.get('days_left', d.get('daysLeft', '?'))} days left, "
                f"needs ~{d.get('daily_hours_needed', d.get('estimated_study_hours', 2))}h today"
                for d in urgent
            ]
        )

    adjustment_note = ""
    if adjustment:
        adjustment_note = f"\nSpecial adjustment request/notes for today:\n- {adjustment}\n"

    # Personality-driven instructions
    personality_note = _build_personality_note(lifestyle)

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
- Gym: {'Yes' if lifestyle.get('gym_preference') or lifestyle.get('exercise_type') in ['gym', 'sports'] else 'No'}
- Club activities: {', '.join(lifestyle.get('club_activities', [])) or 'None'}

Student Personality Profile:
{personality_note}

{deadline_note}
{adjustment_note}
Generate a complete 24-hour schedule for today.
"""

    raw_response = ask_gemini(prompt, system=SYSTEM_PROMPT)
    return _parse_schedule(raw_response)


def _build_personality_note(lifestyle: dict) -> str:
    """Translate quiz answers into actionable planner instructions."""
    notes = []

    sleep_type = lifestyle.get("sleep_type", "")
    if sleep_type == "early_bird":
        notes.append("Student is an Early Bird — schedule important tasks in the morning.")
    elif sleep_type == "night_owl":
        notes.append("Student is a Night Owl — schedule important study blocks in late evening.")
    elif sleep_type == "snoozer":
        notes.append("Student is a Professional Snoozer — add a gradual morning warm-up before any demanding tasks.")

    study_style = lifestyle.get("study_style", "")
    if study_style == "pomodoro":
        notes.append("Student uses Pomodoro technique — break study blocks into 25-min sessions with 5-min breaks.")
    elif study_style == "last_minute":
        notes.append("Student tends to study last-minute — front-load critical deadline subjects in the schedule.")
    elif study_style == "focused":
        notes.append("Student prefers long focused sessions — allocate 1.5-2h uninterrupted blocks for study.")

    peak = lifestyle.get("peak_productivity", "")
    if peak == "morning":
        notes.append("Peak productivity: Morning — place hardest subject study before noon.")
    elif peak == "afternoon":
        notes.append("Peak productivity: Afternoon — schedule difficult subjects between 2-5 PM.")
    elif peak == "evening":
        notes.append("Peak productivity: Evening — place major study sessions between 6-9 PM.")
    elif peak == "late_night":
        notes.append("Peak productivity: Late Night — place primary study after 9 PM (but before sleep time).")

    deadline_personality = lifestyle.get("deadline_personality", "")
    if deadline_personality == "procrastinator":
        notes.append("Student procrastinates — schedule assignment work 2 days earlier than the actual deadline.")
    elif deadline_personality == "one_day_before":
        notes.append("Student works one day before deadline — add dedicated focus blocks the day before due dates.")

    motivation_style = lifestyle.get("motivation_style", "")
    if motivation_style == "roast":
        notes.append("Motivation style: Roast — add humorous but motivating labels like 'No excuses — DBMS time!' to study blocks.")
    elif motivation_style == "encourage":
        notes.append("Motivation style: Encouragement — add warm encouraging labels like 'You've got this! 💪' to study blocks.")
    elif motivation_style == "progress":
        notes.append("Motivation style: Progress tracking — label blocks with progress checkpoints.")

    relaxation = lifestyle.get("relaxation_style", "")
    if relaxation:
        notes.append(f"Relaxation preference: {relaxation} — add one {relaxation} break in the evening.")

    phone_usage = lifestyle.get("phone_usage_hours", 0)
    if isinstance(phone_usage, (int, float)) and phone_usage >= 2:
        notes.append(f"Student uses phone ~{phone_usage}h/day — schedule study BEFORE leisure/phone time to ensure productivity.")

    semester_goal = lifestyle.get("semester_goal", "")
    if semester_goal:
        notes.append(f"Semester goal: {semester_goal} — prioritize tasks that align with this goal.")

    return "\n".join(f"  - {n}" for n in notes) if notes else "  - Standard balanced schedule."


def _parse_schedule(raw: str) -> list:
    """Parse 'HH:MM | ACTIVITY | TYPE' lines into a list of dicts."""
    import re
    blocks = []
    for line in raw.strip().split("\n"):
        line = line.strip()
        if "|" not in line:
            continue
        # Remove leading numbers, dashes, asterisks
        line = re.sub(r'^[\d\.\-\*\•]+\s*', '', line).strip()
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 3:
            blocks.append({
                "time": parts[0],
                "label": parts[1],
                "type": parts[2].lower().strip(),
            })
        elif len(parts) == 2:
            blocks.append({
                "time": parts[0],
                "label": parts[1],
                "type": "other",
            })
    return blocks
