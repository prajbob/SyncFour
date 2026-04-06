"""Email integration wrapper."""

from __future__ import annotations

from typing import Dict


def send_email_alert(to_email: str, subject: str, body: str) -> Dict:
    # Stub implementation for hackathon demo environments.
    return {
        "channel": "email",
        "recipient": to_email,
        "subject": subject,
        "status": "queued",
        "body_preview": body[:120],
    }

