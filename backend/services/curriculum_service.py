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

def is_valid_branch(branch_code: str) -> bool:
    """Checks if the given branch code is known."""
    return branch_code.upper() in BRANCH_MAP

def get_branch_name(branch_code: str) -> str:
    """Returns the full name for a branch code."""
    return BRANCH_MAP.get(branch_code.upper(), "Unknown Branch")

def load_curriculum(branch_code: str) -> dict:
    """
    Loads the curriculum JSON for the given branch.
    Returns a dict with courses grouped by category, or an error dict.
    """
    branch_code = branch_code.upper()
    
    if not is_valid_branch(branch_code):
        return {"error": f"Branch '{branch_code}' not found.", "courses": []}
    
    file_path = os.path.join(CURRICULUM_DIR, f"{branch_code}.json")
    
    if not os.path.exists(file_path):
        # Return a sensible default if the JSON hasn't been created yet
        return {
            "branch_code": branch_code,
            "branch_name": get_branch_name(branch_code),
            "total_credits": 0,
            "categories": [],
            "all_courses": []
        }
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # Also flatten all courses into a single list for easy frontend display
    all_courses = []
    for category in data.get("categories", []):
        for course in category.get("courses", []):
            course["category"] = category["name"]
            all_courses.append(course)
    
    data["all_courses"] = all_courses
    return data
