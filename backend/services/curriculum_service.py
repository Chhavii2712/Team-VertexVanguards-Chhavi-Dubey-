import json
import os

# Location of curriculum JSON files
CURRICULUM_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'curriculum')

# Branch code to full name mapping
BRANCH_MAP = {
    "BAI": "B.Tech CSE (AI & ML)",
    "BSA": "B.Tech CSE (Cloud Computing)",
    "BCY": "B.Tech CSE (Cyber Security)",
    "BCE": "B.Tech CSE (Core)",
    "BCG": "B.Tech CSE (Gaming)",
    "BEY": "B.Tech CSE (E-commerce)",
    "BIT": "B.Tech IT",
    "BEC": "B.Tech ECE",
    "BME": "B.Tech Mechanical",
    "BCE": "B.Tech Civil",
}

def normalize_branch_code(branch_input: str) -> str:
    if not branch_input:
        return "BAI"
    code = str(branch_input).strip()
    code_upper = code.upper()
    if code_upper in BRANCH_MAP:
        return code_upper
    
    # Reverse search by full name
    for k, v in BRANCH_MAP.items():
        if v.upper() == code_upper or v.upper() in code_upper or code_upper in v.upper():
            return k
            
    return "BAI"

def is_valid_branch(branch_code: str) -> bool:
    """Checks if the given branch code is known."""
    normalized = normalize_branch_code(branch_code)
    return normalized in BRANCH_MAP

def get_branch_name(branch_code: str) -> str:
    """Returns the full name for a branch code."""
    normalized = normalize_branch_code(branch_code)
    return BRANCH_MAP.get(normalized, "B.Tech CSE (AI & ML)")

def load_curriculum(branch_code: str) -> dict:
    """
    Loads the curriculum JSON for the given branch.
    Returns a dict with courses grouped by category, or fallback dict.
    """
    normalized_code = normalize_branch_code(branch_code)
    
    # Try multiple potential paths for curriculum JSON files
    possible_paths = [
        os.path.join(CURRICULUM_DIR, f"{normalized_code}.json"),
        os.path.join(os.path.dirname(__file__), '..', '..', 'data', f"{normalized_code}.json"),
        os.path.join(os.path.dirname(__file__), '..', 'data', f"{normalized_code}.json"),
    ]
    
    file_path = None
    for p in possible_paths:
        if os.path.exists(p):
            file_path = p
            break
            
    if not file_path:
        # Fallback to default curriculum (BAI.json)
        file_path = os.path.join(CURRICULUM_DIR, "BAI.json")
        if not os.path.exists(file_path):
            file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', "BAI.json")

    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except Exception:
        # Emergency fallback if file reading fails
        data = {"categories": []}
    
    data["branch_code"] = normalized_code
    data["branch_name"] = get_branch_name(normalized_code)
    
    # Also flatten all courses into a single list for easy frontend display
    all_courses = []
    for category in data.get("categories", []):
        for course in category.get("courses", []):
            course["category"] = category["name"]
            all_courses.append(course)
    
    data["all_courses"] = all_courses
    return data
