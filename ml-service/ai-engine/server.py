from __future__ import annotations

import json
import os
import sqlite3
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import cv2
from flask import Flask, jsonify, request
from flask_cors import CORS

from behavior_analysis import BehaviorAnalyzer
from camera_stream import CameraStream
from emotion_detection import EmotionDetector
from metrics_engine import compute_behavior_metrics

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DB_PATH = BASE_DIR / "doctor_cases.db"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
CORS(app)

camera = CameraStream(0)
behavior = BehaviorAnalyzer()
emotion = EmotionDetector(interval_sec=1.0)

last_inference_at = 0.0
last_metrics: Dict[str, object] = {
    "eye_contact": 0,
    "attention_level": 0,
    "movement": 0,
    "emotion": "neutral",
    "risk_score": "low",
    "risk_value": 0,
    "policy": "Behavioral indicators only. Not a medical diagnosis.",
    "face_detected": False,
    "landmarks": [],
}


def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS doctor_cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                child_name TEXT NOT NULL,
                session_date TEXT NOT NULL,
                risk_score TEXT NOT NULL,
                metrics_json TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_case(child_name: str, metrics: Dict[str, object]) -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO doctor_cases (child_name, session_date, risk_score, metrics_json) VALUES (?, ?, ?, ?)",
            (
                child_name,
                datetime.utcnow().isoformat(timespec="seconds") + "Z",
                str(metrics.get("risk_score", "low")),
                json.dumps(metrics),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def analyze_single_frame(frame_bgr, frame_rgb) -> Dict[str, object]:
    face = behavior.analyze_face(frame_rgb)

    if not face["face_detected"]:
        output = {
            **last_metrics,
            "face_detected": False,
            "landmarks": [],
            "message": "No face detected in frame.",
        }
        return output

    emotion_result = emotion.analyze(frame_bgr)
    metrics = compute_behavior_metrics(
        eye_contact=face["eye_contact_score"],
        attention_level=face["attention_score"],
        movement_score=face["movement_score"],
        emotion=str(emotion_result["emotion"]),
    )

    return {
        **metrics,
        "face_detected": True,
        "landmarks": face["landmarks"],
        "bbox": face["bbox"],
        "emotion_confidence": emotion_result["confidence"],
        "timestamp": datetime.utcnow().isoformat(timespec="seconds") + "Z",
    }


def process_video_file(video_path: Path) -> Dict[str, object]:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError("Unable to open uploaded video.")

    fps = cap.get(cv2.CAP_PROP_FPS)
    fps = fps if fps and fps > 0 else 24.0
    step = max(1, int(round(fps)))  # ~1 frame per second

    frames_processed = 0
    metrics_batch: List[Dict[str, object]] = []
    frame_idx = 0

    try:
        while True:
            ok, frame_bgr = cap.read()
            if not ok:
                break

            if frame_idx % step == 0:
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                result = analyze_single_frame(frame_bgr, frame_rgb)
                metrics_batch.append(result)
                frames_processed += 1

            frame_idx += 1
    finally:
        cap.release()

    if not metrics_batch:
        raise RuntimeError("No valid frames were processed.")

    def mean_of(key: str) -> int:
        vals = [float(item.get(key, 0)) for item in metrics_batch]
        return int(round(sum(vals) / max(len(vals), 1)))

    avg_eye = mean_of("eye_contact")
    avg_attention = mean_of("attention_level")
    avg_movement = mean_of("movement")

    emotion_votes: Dict[str, int] = {}
    for item in metrics_batch:
        emo = str(item.get("emotion", "neutral"))
        emotion_votes[emo] = emotion_votes.get(emo, 0) + 1
    dominant_emotion = max(emotion_votes, key=emotion_votes.get)

    summary = compute_behavior_metrics(
        eye_contact=avg_eye,
        attention_level=avg_attention,
        movement_score=avg_movement,
        emotion=dominant_emotion,
    )

    summary.update(
        {
            "frames_processed": frames_processed,
            "samples": metrics_batch,
        }
    )
    return summary


@app.get("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "service": "manassaathi-ai-engine",
            "timestamp": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        }
    )


@app.get("/analyze-frame")
def analyze_frame():
    global last_inference_at, last_metrics

    now = time.time()
    if now - last_inference_at < 1.0:
        return jsonify(last_metrics)

    frame_bgr, frame_rgb = camera.read_frame()
    if frame_bgr is None or frame_rgb is None:
        return jsonify({"error": "Unable to capture frame from webcam."}), 500

    result = analyze_single_frame(frame_bgr, frame_rgb)
    last_metrics = result
    last_inference_at = now
    return jsonify(result)


@app.post("/upload-video")
def upload_video():
    if "video" not in request.files:
        return jsonify({"error": "Missing video file field 'video'."}), 400

    file = request.files["video"]
    child_name = request.form.get("child_name", "Unknown Child").strip() or "Unknown Child"

    if not file.filename:
        return jsonify({"error": "Empty filename."}), 400

    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    filename = f"{timestamp}-{file.filename}"
    safe_path = UPLOAD_DIR / filename
    file.save(str(safe_path))

    try:
        summary = process_video_file(safe_path)
        save_case(child_name, summary)
        return jsonify(
            {
                "success": True,
                "child_name": child_name,
                "file": filename,
                "metrics": summary,
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/doctor/cases")
def doctor_cases():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            "SELECT id, child_name, session_date, risk_score, metrics_json FROM doctor_cases ORDER BY id DESC"
        ).fetchall()
    finally:
        conn.close()

    cases = []
    for row in rows:
        cases.append(
            {
                "id": row["id"],
                "child_name": row["child_name"],
                "session_date": row["session_date"],
                "risk_score": row["risk_score"],
                "metrics": json.loads(row["metrics_json"]),
            }
        )

    return jsonify(cases)


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
