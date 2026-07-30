"""
backend/utils/gemini_client.py
──────────────────────────────
Thin compatibility shim used by all AI agents.

All calls are forwarded to GeminiKeyManager which handles:
  • Multi-key rotation
  • Automatic failover
  • Thread safety
  • Logging (without exposing key values)

Agents should import and call:
    from utils.gemini_client import ask_gemini
"""

from services.api_key_manager import GeminiKeyManager


def ask_gemini(prompt: str, system: str = "") -> str:
    """
    Send a prompt (with optional system instruction) to Gemini and
    return the response text.

    Automatically handles key rotation and failover via GeminiKeyManager.

    Args:
        prompt: The user/task prompt.
        system: Optional system instruction prepended to the prompt.

    Returns:
        The model's text response, or a graceful error message.
    """
    full_prompt = f"{system.strip()}\n\n{prompt.strip()}" if system else prompt.strip()

    try:
        return GeminiKeyManager.generate(full_prompt)
    except Exception as exc:
        # Return a friendly message rather than crashing the API endpoint
        return f"⚠️ AI is temporarily unavailable: {type(exc).__name__}. Please try again shortly."


# Expose manager state for health checks / startup validation
AI_ENABLED: bool = GeminiKeyManager.is_ready
