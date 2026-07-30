"""
Shared Gemini AI client.
All agents import from here so the model is initialized once.
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY", "")

if _api_key and _api_key != "your_gemini_api_key_here":
    genai.configure(api_key=_api_key)
    _model = genai.GenerativeModel("gemini-1.5-flash")
    AI_ENABLED = True
else:
    _model = None
    AI_ENABLED = False
    print("⚠️  GEMINI_API_KEY not set. AI agents will return placeholder responses.")


def ask_gemini(prompt: str, system: str = "") -> str:
    """
    Send a prompt to Gemini and return the text response.
    Falls back to a helpful message if no API key is configured.
    """
    if not AI_ENABLED or _model is None:
        return (
            "🔑 AI features are not active. "
            "Please add your GEMINI_API_KEY to backend/.env and restart the server.\n"
            "Get a free key at: https://aistudio.google.com/app/apikey"
        )
    try:
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        response = _model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        return f"⚠️ Gemini error: {str(e)}"
