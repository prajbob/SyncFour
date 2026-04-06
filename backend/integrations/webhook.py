"""Webhook integration wrapper."""

from __future__ import annotations

from typing import Dict


def send_webhook_alert(webhook_url: str, payload: Dict) -> Dict:
    # Stub implementation for hackathon demo environments.
    return {
        "channel": "webhook",
        "endpoint": webhook_url,
        "status": "queued",
        "payload_keys": sorted(payload.keys()),
    }

