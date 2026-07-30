import re

# Lazy/optional import so the backend can start even before torch/easyocr/opencv
# finish installing. Only the OCR endpoint will fail until they're ready.
try:
    import numpy as np
    import cv2
    import easyocr
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

reader = None

def get_reader():
    global reader
    if reader is None and OCR_AVAILABLE:
        reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    return reader


# Branch code -> full program name
BRANCH_MAP = {
    "BAI": "B.Tech CSE (AI & ML)",
    "BSA": "B.Tech CSE (Cloud Computing)",
    "BCY": "B.Tech CSE (Cyber Security)",
    "BCE": "B.Tech CSE (Core)",
    "BCG": "B.Tech CSE (Gaming)",
    "BEY": "B.Tech CSE (E-commerce)",
}

REG_PATTERN = re.compile(r"\d{2}[A-Z]{3}\d{5}")


def extract_id_details(image_bytes: bytes) -> dict:
    """
    Extracts student details from ID card image bytes using EasyOCR.
    Returns a dict with parsed fields plus raw OCR text for debugging.
    Raises RuntimeError if OCR deps aren't installed, or ValueError if the
    image itself can't be decoded.
    """
    if not OCR_AVAILABLE:
        raise RuntimeError(
            "OCR dependencies not installed yet — install torch/easyocr/opencv-python first."
        )

    # Decode raw bytes (e.g. from an uploaded file) into an OpenCV image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image — file may be corrupted or an unsupported format.")

    ocr_reader = get_reader()
    if ocr_reader is None:
        raise RuntimeError("EasyOCR reader could not be initialized.")
    result = ocr_reader.readtext(img)
    text_items = [item[1].strip() for item in result if item[1].strip()]

    name = ""
    registration = ""
    residence = ""
    branch = "Unknown Branch"
    joining_year = ""
    reg_index = -1

    # --- Find registration number (search substrings, since OCR may merge it with other text) ---
    for i, t in enumerate(text_items):
        match = REG_PATTERN.search(t)
        if match:
            registration = match.group(0)
            reg_index = i
            break

    # --- Find Hosteller / Day Scholar ---
    for t in text_items:
        upper = t.upper()
        if "HOSTELLER" in upper:
            residence = "Hosteller"
            break
        elif "DAY SCHOLAR" in upper:
            residence = "Day Scholar"
            break

    # --- Find Name (assume it's the line immediately before the registration number) ---
    if reg_index > 0:
        candidate = text_items[reg_index - 1]
        # Guard against picking up a label like "Reg No:" instead of an actual name
        if not any(char.isdigit() for char in candidate):
            name = candidate

    # --- Derive branch + joining year from registration number ---
    if registration:
        joining_year = "20" + registration[:2]           # e.g. "24" -> "2024"
        branch_code = registration[2:5]                  # e.g. "BAI"
        branch = BRANCH_MAP.get(branch_code, "Unknown Branch")

    return {
        "name": name,
        "registration": registration,
        "joiningYear": joining_year,
        "residence": residence,
        "branch": branch,
        "raw_text": text_items,  # useful for debugging OCR quality
    }
