import easyocr
import re

# Initialize the reader once so it doesn't reload the model on every request
# Note: EasyOCR will download models on first run if they aren't cached.
reader = easyocr.Reader(['en'])

def extract_id_details(image_bytes: bytes) -> dict:
    """
    Extracts student details from ID card image bytes using EasyOCR.
    """
    # Read image from bytes
    result = reader.readtext(image_bytes)
    
    # Extract only the detected text
    text = [item[1] for item in result]

    # Variables
    name = ""
    registration = ""
    residence = ""
    branch = ""
    joining_year = ""

    # Branch Mapping
    branch_map = {
        "BAI": "B.Tech CSE (AI & ML)",
        "BSA": "B.Tech CSE (Cloud Computing)",
        "BCY": "B.Tech CSE (Cyber Security)",
        "BCE": "B.Tech CSE (Core)",
        "BCG": "B.Tech CSE (Gaming)",
        "BEY": "B.Tech CSE (E-commerce)",
    }

    # Find Registration Number
    for t in text:
        # Looking for pattern like 24BAI12345
        if re.match(r"\d{2}[A-Z]{3}\d{5}", t):
            registration = t
            break

    # Find Hosteller / Day Scholar
    for t in text:
        if "HOSTELLER" in t.upper():
            residence = "Hosteller"
            break
        elif "DAY SCHOLAR" in t.upper():
            residence = "Day Scholar"
            break

    # Find Name (assumes name is before registration number)
    if registration in text:
        index = text.index(registration)
        if index > 0:
            name = text[index - 1]

    # Extract Branch and Joining Year from Registration Number
    if registration:
        joining_year = "20" + registration[:2]      # Example: 24 -> 2024
        branch_code = registration[2:5]             # Example: BAI, BSA, BCY
        branch = branch_map.get(branch_code, "Unknown Branch")

    return {
        "name": name,
        "registration": registration,
        "joiningYear": joining_year,
        "residence": residence,
        "branch": branch,
        "raw_text": text # Useful for debugging
    }
