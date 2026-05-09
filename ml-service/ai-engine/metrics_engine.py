from __future__ import annotations

from typing import Dict


def _risk_label(score: int) -> str:
    if score >= 65:
        return "high"
    if score >= 35:
        return "medium"
    return "low"


def _emotion_instability(emotion: str) -> int:
    if emotion in {"fear", "angry", "sad"}:
        return 18
    if emotion == "neutral":
        return 8
    return 4


def compute_behavior_metrics(
    eye_contact: float,
    attention_level: float,
    movement_score: float,
    emotion: str,
) -> Dict[str, object]:
    risk = 0

    if eye_contact < 40:
        risk += 28
    elif eye_contact < 60:
        risk += 15

    if attention_level < 50:
        risk += 25
    elif attention_level < 70:
        risk += 12

    if movement_score > 65:
        risk += 14
    elif movement_score > 40:
        risk += 8

    risk += _emotion_instability(emotion)
    risk = max(0, min(100, risk))

    return {
        "eye_contact": int(round(max(0, min(100, eye_contact)))),
        "attention_level": int(round(max(0, min(100, attention_level)))),
        "movement": int(round(max(0, min(100, movement_score)))),
        "emotion": emotion,
        "risk_score": _risk_label(risk),
        "risk_value": risk,
        "policy": "Behavioral indicators only. Not a medical diagnosis.",
    }
