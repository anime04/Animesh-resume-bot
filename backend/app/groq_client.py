import json
import logging
from typing import AsyncGenerator, List, Dict
import httpx
from app.config import GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger("hireme_ai.groq")

GROQ_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"

class GroqClient:
    def __init__(self, api_key: str = GROQ_API_KEY, model: str = GROQ_MODEL):
        self.api_key = api_key.strip()
        self.model = model.strip()
        self._validate_api_key()

    def _validate_api_key(self) -> None:
        if not self.api_key or self.api_key in ("your_groq_api_key_here", "your_api_key_here"):
            error_msg = (
                "FATAL: GROQ_API_KEY is not set, is empty, or is still using placeholder value. "
                "Please configure a valid GROQ_API_KEY in your .env file or environment variables before starting the backend."
            )
            logger.critical(error_msg)
            # Fail fast at startup / instantiation
            raise ValueError(error_msg)

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3   # Day 2 — temperature control, default 0.3
    ) -> AsyncGenerator[str, None]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,   # Day 2 — dynamically set per query type
            "max_tokens": 1024,
            "stream": True,              # Day 9 — streaming enabled
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
            try:
                async with client.stream(
                    "POST",
                    GROQ_COMPLETIONS_URL,
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        logger.error(f"Groq API error: status {response.status_code}, response: {error_body.decode('utf-8', errors='replace')}")
                        raise RuntimeError(f"Groq API returned status {response.status_code}")

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        line = line.strip()
                        if line.startswith("data:"):
                            data_str = line[len("data:"):].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data_str)
                                choices = chunk.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                logger.warning(f"Failed to decode Groq SSE chunk: {data_str}")
                                continue

            except httpx.RequestError as exc:
                logger.error(f"Network error contacting Groq API: {str(exc)}")
                raise RuntimeError(f"Could not reach the AI provider: {str(exc)}") from exc

groq_client: GroqClient | None = None

def get_groq_client() -> GroqClient:
    global groq_client
    if groq_client is None:
        groq_client = GroqClient()
    return groq_client
