"""
backend/services/api_key_manager.py
─────────────────────────────────────────────────────────────────────────────
Centralized Gemini API Key Manager for StudyLoop.

Features:
  • Reads up to 4 numbered keys from .env (GEMINI_API_KEY_1 … _4)
  • Validates that at least one key is present on startup
  • Automatic round-robin failover: if a request fails, transparently
    switches to the next key and retries — no caller changes needed
  • Thread-safe key switching via threading.Lock
  • Logs key index transitions but NEVER logs the actual key value
  • Single entry point: GeminiKeyManager.generate(prompt)

Usage (in any agent):
    from services.api_key_manager import GeminiKeyManager
    response = GeminiKeyManager.generate(prompt)
"""

import logging
import os
import threading
from typing import Optional

import google.generativeai as genai
from dotenv import load_dotenv

# ─── Logging ──────────────────────────────────────────────────────────────────
logger = logging.getLogger("studyloop.api_key_manager")

# ─── Load environment variables ───────────────────────────────────────────────
load_dotenv()

# ─── Exceptions ───────────────────────────────────────────────────────────────

class NoAPIKeysConfigured(RuntimeError):
    """Raised during startup if no Gemini API keys are found in .env"""

class AllKeysExhausted(RuntimeError):
    """Raised when every configured key has failed for a single request."""


# ─── Retryable error signals ──────────────────────────────────────────────────
# These substrings in an exception message indicate a key/quota/network issue
# that may succeed on a different key. Non-retryable errors (bad prompt, etc.)
# are re-raised immediately.
_RETRYABLE_SIGNALS = (
    "invalid api key",
    "api key expired",
    "permission denied",
    "quota exceeded",
    "resource exhausted",
    "rate limit",
    "429",
    "503",
    "500",
    "internal server error",
    "service unavailable",
    "deadline exceeded",
    "timed out",
    "connection",
    "network",
)


def _is_retryable(exc: Exception) -> bool:
    """Return True if the exception looks like a key / quota / network problem."""
    msg = str(exc).lower()
    return any(signal in msg for signal in _RETRYABLE_SIGNALS)


# ─── Key Manager ──────────────────────────────────────────────────────────────

class _GeminiKeyManager:
    """
    Internal singleton class. Do not instantiate directly.
    Use the module-level ``GeminiKeyManager`` instance instead.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._keys: list[str] = []
        self._current_index: int = 0
        self._clients: list[Optional[genai.GenerativeModel]] = []
        self._initialized: bool = False

    # ── Startup ───────────────────────────────────────────────────────────────

    def initialize(self) -> None:
        """
        Load all configured Gemini keys from .env and create one SDK client
        per key.  Called once at application startup (via app lifespan or
        module import).

        Raises:
            NoAPIKeysConfigured: if no valid keys are found.
        """
        raw_keys = []
        for i in range(1, 5):          # Keys 1 – 4
            val = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
            # Accept non-empty values that are not placeholder text
            if val and "your_key" not in val.lower():
                raw_keys.append(val)

        if not raw_keys:
            logger.warning(
                "⚠️  No Gemini API keys found. "
                "Add GEMINI_API_KEY_1 … _4 to backend/.env"
            )
            self._initialized = False
            return

        # Build one SDK client per key
        clients = []
        for key in raw_keys:
            genai.configure(api_key=key)
            clients.append(genai.GenerativeModel("gemini-1.5-flash"))

        with self._lock:
            self._keys = raw_keys
            self._clients = clients
            self._current_index = 0
            self._initialized = True

        logger.info(
            f"✅ GeminiKeyManager initialized with {len(self._keys)} key(s). "
            f"Starting on Key #1."
        )

    # ── Public API ────────────────────────────────────────────────────────────

    @property
    def is_ready(self) -> bool:
        """True when at least one valid key has been loaded."""
        return self._initialized and len(self._keys) > 0

    def get_current_client(self) -> genai.GenerativeModel:
        """
        Return the active GenerativeModel client.

        Raises:
            NoAPIKeysConfigured: if manager has not been initialized or has no keys.
        """
        if not self.is_ready:
            raise NoAPIKeysConfigured(
                "No Gemini API keys are configured. "
                "Add at least GEMINI_API_KEY_1 to backend/.env"
            )
        with self._lock:
            return self._clients[self._current_index]

    def switch_key(self) -> bool:
        """
        Rotate to the next available key in a thread-safe manner.

        Returns:
            True  — a new key is now active.
            False — we have cycled through all keys; back to the start.
        """
        with self._lock:
            next_index = (self._current_index + 1) % len(self._keys)
            wrapped = next_index <= self._current_index  # we looped around
            self._current_index = next_index

            # Reconfigure the SDK for the new active key
            genai.configure(api_key=self._keys[self._current_index])

        logger.info(f"🔄 Switching to Gemini Key #{self._current_index + 1}")
        return not wrapped

    def generate(self, prompt: str) -> str:
        """
        Send *prompt* to Gemini and return the response text.

        Automatically retries with the next configured key on any retryable
        failure.  Raises ``AllKeysExhausted`` if every key fails.

        Args:
            prompt: The full text prompt to send to the model.

        Returns:
            The model's text response.

        Raises:
            NoAPIKeysConfigured: if no keys are loaded.
            AllKeysExhausted:    if every key fails for this request.
        """
        if not self.is_ready:
            # Graceful degradation: return a helpful message instead of crashing
            return (
                "🔑 AI features are not active. "
                "Please add your Gemini API key to backend/.env "
                "(see .env.example) and restart the server.\n"
                "Get a free key at: https://aistudio.google.com/app/apikey"
            )

        num_keys = len(self._keys)
        start_index: int

        with self._lock:
            start_index = self._current_index

        # Try every key at most once per request
        for attempt in range(num_keys):
            with self._lock:
                current_index = self._current_index

            logger.info(f"🤖 Using Gemini Key #{current_index + 1}")

            try:
                client = self._clients[current_index]
                response = client.generate_content(prompt)
                logger.info(f"✅ Gemini Key #{current_index + 1} succeeded.")
                return response.text

            except Exception as exc:
                logger.warning(
                    f"⚠️  Gemini Key #{current_index + 1} failed: {type(exc).__name__}: {exc}"
                )

                if not _is_retryable(exc):
                    # Non-retryable error (bad prompt, content policy, etc.)
                    # Re-raise immediately; switching keys won't help.
                    raise

                # Check if we have more keys to try
                if attempt < num_keys - 1:
                    self.switch_key()
                else:
                    # All keys exhausted for this request
                    raise AllKeysExhausted(
                        f"All {num_keys} configured Gemini key(s) failed for this request. "
                        f"Last error: {exc}"
                    ) from exc

        # Should never reach here, but satisfy the type checker
        raise AllKeysExhausted("Unexpected exhaustion of key rotation loop.")


# ─── Module-level singleton ───────────────────────────────────────────────────
# Every module imports and uses this single instance.

GeminiKeyManager = _GeminiKeyManager()
GeminiKeyManager.initialize()   # Load keys immediately on import
