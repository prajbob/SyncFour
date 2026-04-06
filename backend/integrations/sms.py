"""SMS integration wrapper."""

from __future__ import annotations

from typing import Dict


def send_sms_alert(to_phone: str, message: str) -> Dict:
    # Stub implementation for hackathon demo environments.
    return {
        "channel": "sms",
        "recipient": to_phone,
        "status": "queued",
        "message_preview": message[:120],
    }

