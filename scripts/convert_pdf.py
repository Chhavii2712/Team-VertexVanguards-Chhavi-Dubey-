import fitz
import re
import json
import os

# -----------------------------
# Configuration
# -----------------------------
PDF_FILE = "curriculum/BCE.pdf"
OUTPUT_FILE = "data/BCE.json"

BRANCH_CODE = "BCE"
BRANCH_NAME = "B.Tech CSE (Core)"

# -----------------------------
# Read PDF
# -----------------------------
doc = fitz.open(PDF_FILE)

text = ""

for page in doc:
    text += page.get_text()

lines = [line.strip() for line in text.split("\n") if line.strip()]

# -----------------------------
# Detect Course Codes
# -----------------------------
course_pattern = r"^[A-Z]{2,4}\d{4}$"

courses = []

i = 0

while i < len(lines):

    line = lines[i]

    if re.match(course_pattern, line):

        course_code = line

        course_name = ""

        if i + 1 < len(lines):
            course_name = lines[i + 1]

        course = {
            "course_code": course_code,
            "course_name": course_name
        }

        courses.append(course)

    i += 1

# -----------------------------
# Final JSON
# -----------------------------
curriculum = {
    "branch_code": BRANCH_CODE,
    "branch_name": BRANCH_NAME,
    "curriculum": courses
}

# -----------------------------
# Save JSON
# -----------------------------
os.makedirs("data", exist_ok=True)

with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
    json.dump(curriculum, file, indent=4)

print("JSON Created Successfully")
print("Total Courses:", len(courses))