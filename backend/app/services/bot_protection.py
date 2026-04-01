import json
import urllib.error
import urllib.parse
import urllib.request

from fastapi import HTTPException

from app.core.config import settings


def validate_registration(bot_field: str = "", turnstile_token: str | None = None) -> None:
    if bot_field.strip():
        raise HTTPException(status_code=400, detail="Registration rejected")

    if not settings.TURNSTILE_SECRET_KEY:
        return

    if not turnstile_token:
        raise HTTPException(status_code=400, detail="Complete the anti-bot check")

    payload = urllib.parse.urlencode(
        {
            "secret": settings.TURNSTILE_SECRET_KEY,
            "response": turnstile_token,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=payload,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError):
        raise HTTPException(status_code=503, detail="Unable to verify anti-bot check")

    if not data.get("success"):
        raise HTTPException(status_code=400, detail="Anti-bot verification failed")
