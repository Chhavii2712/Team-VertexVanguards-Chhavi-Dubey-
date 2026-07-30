from datetime import datetime

def parse_time(time_str: str):
    """Parses a time string like '08:30-10:00' into start and end datetime objects (dummy date)."""
    start_str, end_str = time_str.split('-')
    start_time = datetime.strptime(start_str.strip(), '%H:%M')
    end_time = datetime.strptime(end_str.strip(), '%H:%M')
    return start_time, end_time

def check_for_clashes(classes: list[dict]) -> bool:
    """
    Checks if there is any clash in the provided list of classes.
    Returns True if a clash is found, False otherwise.
    Each class should have 'day' and 'time' keys.
    """
    # Group classes by day
    schedule_by_day = {}
    for cls in classes:
        day = cls.get('day')
        if day == 'Unknown':
            continue
            
        if day not in schedule_by_day:
            schedule_by_day[day] = []
        schedule_by_day[day].append(cls)
        
    # Check for overlaps within each day
    for day, day_classes in schedule_by_day.items():
        # Sort classes by start time
        try:
            day_classes.sort(key=lambda x: parse_time(x['time'])[0])
        except Exception:
            # If time parsing fails, skip overlap check for this day or fall back to simple equality
            pass
            
        for i in range(len(day_classes) - 1):
            try:
                _, end_time_1 = parse_time(day_classes[i]['time'])
                start_time_2, _ = parse_time(day_classes[i+1]['time'])
                
                # If the first class ends AFTER the second class starts, it's a clash
                if end_time_1 > start_time_2:
                    return True # Clash found
            except Exception:
                # Fallback to string exact match
                if day_classes[i]['time'] == day_classes[i+1]['time']:
                    return True

    return False
