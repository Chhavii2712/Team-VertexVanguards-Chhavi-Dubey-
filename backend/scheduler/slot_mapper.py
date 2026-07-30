import json
import os

def load_slot_timings():
    """Loads the master mapping of slot codes to days and times."""
    base_dir = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(base_dir, 'data', 'slot_timings.json')
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def map_slots_to_times(slots: list[str]) -> list[dict]:
    """
    Given a list of slot codes (e.g., ['A11', 'A12']),
    returns a list of their mapped dictionary blocks (day and time).
    """
    timings = load_slot_timings()
    mapped = []
    
    for slot in slots:
        if slot in timings:
            mapped_slot = timings[slot].copy()
            mapped_slot['slot_code'] = slot
            mapped.append(mapped_slot)
        else:
            # Handle unknown slots by mapping them generically or raising an error
            mapped.append({
                'slot_code': slot,
                'day': 'Unknown',
                'time': 'Unknown'
            })
            
    return mapped
