from .slot_mapper import map_slots_to_times
from .clash_detector import check_for_clashes
import itertools

def load_course_details(course_code: str, data_dir: str):
    import json
    import os
    path = os.path.join(data_dir, 'slot_combinations', f'{course_code}.json')
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"course": course_code, "name": course_code, "credits": 0, "slotOptions": []}

def generate_timetables(selected_courses: list[str], selected_options: dict, preferences: dict = None) -> list[dict]:
    """
    selected_courses: list of course codes e.g. ["CSE3015", "CSE2004"]
    selected_options: dict mapping course code to a list of chosen slot combinations 
                      (if the user picked one option, it's a list of 1. If they left it open, it could be all options)
                      e.g. {"CSE3015": [ ["B11", "B12", "B13"] ], "CSE2004": [ ["D11", "D12", "E11"], ["F11", "F12", "C11"] ]}
    """
    
    # Generate all possible combinations using itertools.product
    courses = []
    options_list = []
    
    for course in selected_courses:
        options = selected_options.get(course, [])
        if not options:
            continue
        courses.append(course)
        options_list.append(options)
        
    all_combinations = list(itertools.product(*options_list))
    
    valid_timetables = []
    
    for combination in all_combinations:
        # combination is a tuple of slot lists, e.g., (["B11", "B12", "B13"], ["D11", "D12", "E11"])
        tentative_schedule = []
        
        for i, course_slots in enumerate(combination):
            course_code = courses[i]
            mapped_slots = map_slots_to_times(course_slots)
            # Add course metadata to each slot
            for slot in mapped_slots:
                slot['course'] = course_code
                tentative_schedule.append(slot)
                
        if not check_for_clashes(tentative_schedule):
            valid_timetables.append({
                "schedule": tentative_schedule,
                "score": rank_timetable(tentative_schedule, preferences)
            })
            
    # Sort by score descending
    valid_timetables.sort(key=lambda x: x["score"], reverse=True)
    return valid_timetables

def rank_timetable(timetable: list[dict], preferences: dict) -> int:
    """
    Ranks the timetable based on user preferences.
    Example preferences: 'morning_classes', 'no_friday'
    Returns a score. Higher is better.
    """
    score = 0
    if not preferences:
        return score
        
    for slot in timetable:
        # Prefer morning classes
        if preferences.get('morning_classes'):
            if "08" in slot['time'] or "09" in slot['time'] or "10" in slot['time']:
                score += 1
                
        # Prefer no friday classes
        if preferences.get('no_friday'):
            if slot['day'] == 'Friday':
                score -= 2 # Penalize Friday classes
                
    return score
