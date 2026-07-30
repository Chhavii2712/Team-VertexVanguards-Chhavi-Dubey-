import easyocr
import re

# Load OCR
reader = easyocr.Reader(['en'])

# Read image
result = reader.readtext("uploads/sample.jpeg")

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
    if re.match(r"\d{2}[A-Z]{3}\d{5}", t):
        registration = t

# Find Hosteller / Day Scholar
for t in text:
    if "HOSTELLER" in t.upper():
        residence = "Hosteller"
    elif "DAY SCHOLAR" in t.upper():
        residence = "Day Scholar"

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

# Final Output
print("Name          :", name)
print("Registration  :", registration)
print("Joining Year  :", joining_year)
print("Residence     :", residence)
print("Branch        :", branch)
