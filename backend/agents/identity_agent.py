from datetime import datetime
from pydantic import BaseModel

class StudentIdentity(BaseModel):
    name: str
    registration: str
    joining_year: int
    residence: str
    branch: str
    current_year_of_study: int
    profile_summary: str

class IdentityAgent:
    """
    The Identity Agent is responsible for taking raw data (like from the OCR reader) 
    and building a structured, intelligent profile of the student. 
    This profile is then used by the Planner and Study agents to personalize their output.
    """
    
    def process_ocr_data(self, ocr_data: dict) -> dict:
        """
        Processes raw OCR data to deduce additional information (like current year of study)
        and creates a contextual summary for the AI.
        """
        joining_year_str = ocr_data.get("joiningYear", "")
        joining_year = int(joining_year_str) if joining_year_str.isdigit() else datetime.now().year
        
        # Estimate the student's current year of study
        current_year = datetime.now().year
        current_month = datetime.now().month
        
        # Assuming academic year starts in August
        years_completed = current_year - joining_year
        if current_month >= 8:
            current_year_of_study = years_completed + 1
        else:
            current_year_of_study = max(1, years_completed)
            
        # Cap between year 1 and 4 (assuming standard B.Tech)
        current_year_of_study = max(1, min(current_year_of_study, 4))
        
        residence = ocr_data.get("residence", "Day Scholar")
        branch = ocr_data.get("branch", "Unknown Branch")
        name = ocr_data.get("name", "Student").title()
        registration = ocr_data.get("registration", "Unknown")

        # The profile summary is a prompt piece that will be fed to the LLM (StudyAgent/ChatAgent)
        profile_summary = (
            f"The user is {name}, a Year {current_year_of_study} student pursuing {branch}. "
            f"Registration number: {registration}. "
            f"They are a {residence}."
        )

        identity = StudentIdentity(
            name=name,
            registration=registration,
            joining_year=joining_year,
            residence=residence,
            branch=branch,
            current_year_of_study=current_year_of_study,
            profile_summary=profile_summary
        )

        return identity.dict()

# Create a singleton instance to be used across the app
identity_agent = IdentityAgent()
