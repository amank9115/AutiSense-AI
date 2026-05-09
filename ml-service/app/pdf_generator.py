"""
ManasSaathi — PDF Report Generator
====================================
Generates a professional PDF screening report for parents/doctors.
Uses ReportLab — pure Python, no browser, no Chromium needed.
"""

from __future__ import annotations

import io
import math
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        HRFlowable,
        Image,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
    from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Line
    from reportlab.graphics import renderPDF
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


# ── Color palette matching the ManasSaathi UI ────────────────────────────────
COLOR_BRAND_BLUE   = colors.HexColor("#0ea5e9")   # sky-500
COLOR_BRAND_GREEN  = colors.HexColor("#10b981")   # emerald-500
COLOR_DANGER       = colors.HexColor("#f43f5e")   # rose-500
COLOR_WARN         = colors.HexColor("#f59e0b")   # amber-500
COLOR_DARK         = colors.HexColor("#0f172a")   # slate-900
COLOR_MUTED        = colors.HexColor("#64748b")   # slate-500
COLOR_LIGHT_BG     = colors.HexColor("#f8fafc")   # slate-50
COLOR_BORDER       = colors.HexColor("#e2e8f0")   # slate-200
COLOR_WHITE        = colors.white


def _risk_color(risk_label: str) -> Any:
    return {
        "high": COLOR_DANGER,
        "moderate": COLOR_WARN,
        "low": COLOR_BRAND_GREEN,
    }.get(risk_label.lower(), COLOR_MUTED)


def _risk_text(risk_label: str) -> str:
    return {
        "high": "HIGH RISK — Immediate Professional Consultation Advised",
        "moderate": "MODERATE RISK — Further Evaluation Recommended",
        "low": "LOW RISK — Continue Routine Developmental Monitoring",
    }.get(risk_label.lower(), "UNKNOWN")


def _draw_metric_bar(drawing: Any, label: str, value: int, y_pos: float, width: float) -> None:
    """Draws a labeled progress bar inside a ReportLab Drawing."""
    bar_x = 95
    bar_w = width - bar_x - 10
    bar_h = 10
    fill_w = max(0, min(bar_w, (value / 100.0) * bar_w))

    # Background track
    bg = Rect(bar_x, y_pos, bar_w, bar_h, fillColor=COLOR_BORDER, strokeColor=None)
    drawing.add(bg)

    # Fill bar
    bar_color = (
        COLOR_BRAND_GREEN if value >= 65
        else COLOR_WARN if value >= 40
        else COLOR_DANGER
    )
    fill = Rect(bar_x, y_pos, fill_w, bar_h, fillColor=bar_color, strokeColor=None)
    drawing.add(fill)

    # Label
    lbl = String(0, y_pos + 1, label, fontSize=8, fillColor=COLOR_DARK)
    drawing.add(lbl)

    # Value text
    val_str = String(bar_x + fill_w + 4, y_pos + 1, f"{value}%", fontSize=8, fillColor=COLOR_MUTED)
    drawing.add(val_str)


def _draw_risk_gauge(risk_score: int, risk_label: str) -> Any:
    """Draws a semicircular risk gauge."""
    d = Drawing(200, 110)
    cx, cy = 100, 15
    r = 70

    # Background arc segments (low, moderate, high zones)
    for i in range(180):
        angle_rad = math.radians(180 - i)
        x1 = cx + r * math.cos(angle_rad)
        y1 = cy + r * math.sin(angle_rad)
        x2 = cx + (r - 18) * math.cos(angle_rad)
        y2 = cy + (r - 18) * math.sin(angle_rad)
        seg_color = (
            COLOR_BRAND_GREEN if i < 55
            else COLOR_WARN if i < 115
            else COLOR_DANGER
        )
        line = Line(x1, y1, x2, y2, strokeColor=seg_color, strokeWidth=2)
        d.add(line)

    # Needle
    needle_angle = math.radians(180 - (risk_score / 100.0) * 180)
    nx = cx + (r - 10) * math.cos(needle_angle)
    ny = cy + (r - 10) * math.sin(needle_angle)
    needle = Line(cx, cy, nx, ny, strokeColor=COLOR_DARK, strokeWidth=2.5)
    d.add(needle)

    # Center dot
    dot = Circle(cx, cy, 5, fillColor=COLOR_DARK, strokeColor=COLOR_WHITE, strokeWidth=1)
    d.add(dot)

    # Score text
    score_txt = String(cx - 15, cy - 25, f"{risk_score}%", fontSize=16, fillColor=COLOR_DARK)
    d.add(score_txt)

    label_txt = String(cx - 55, cy - 42, _risk_text(risk_label)[:22], fontSize=6, fillColor=_risk_color(risk_label))
    d.add(label_txt)

    # Range labels
    d.add(String(10, cy - 5, "Low", fontSize=7, fillColor=COLOR_BRAND_GREEN))
    d.add(String(cx - 15, cy + r - 5, "Mod", fontSize=7, fillColor=COLOR_WARN))
    d.add(String(cx + r - 25, cy - 5, "High", fontSize=7, fillColor=COLOR_DANGER))

    return d


def generate_pdf_report(session_data: Dict[str, Any]) -> bytes:
    """
    Generates a PDF screening report and returns it as bytes.

    session_data keys:
        child_name, parent_name, parent_email, parent_phone,
        city, state, session_id, session_date,
        risk_score (int 0-100), risk_label (low/moderate/high),
        feature_averages (dict: eye_contact, attention_span, emotion_signals, gesture_analysis),
        recommendations (list of str),
        model_version (str),
        aq_scores (dict: A1-A10, optional)
    """
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("reportlab is not installed. Run: pip install reportlab")

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story: List[Any] = []

    # ── Helpers ────────────────────────────────────────────────────────────────
    def h(name: str, size: int, color=COLOR_DARK, bold: bool = True, align=TA_LEFT) -> ParagraphStyle:
        return ParagraphStyle(
            name, fontSize=size, textColor=color,
            fontName="Helvetica-Bold" if bold else "Helvetica",
            alignment=align, spaceAfter=4,
        )

    title_style    = h("Title",    20, COLOR_BRAND_BLUE, align=TA_CENTER)
    subtitle_style = h("Sub",      10, COLOR_MUTED,      bold=False, align=TA_CENTER)
    section_style  = h("Section",  12, COLOR_DARK)
    label_style    = h("Label",    9,  COLOR_MUTED,      bold=False)
    body_style     = h("Body",     9,  COLOR_DARK,       bold=False)
    disclaimer_s   = h("Disc",     7,  COLOR_MUTED,      bold=False)
    risk_high_s    = h("RiskH",   11,  COLOR_DANGER,     align=TA_CENTER)
    risk_mod_s     = h("RiskM",   11,  COLOR_WARN,       align=TA_CENTER)
    risk_low_s     = h("RiskL",   11,  COLOR_BRAND_GREEN,align=TA_CENTER)

    def risk_style(label: str) -> ParagraphStyle:
        return {"high": risk_high_s, "moderate": risk_mod_s, "low": risk_low_s}.get(label.lower(), risk_high_s)

    # ── Unpack data ────────────────────────────────────────────────────────────
    child_name   = session_data.get("child_name", "Unknown")
    parent_name  = session_data.get("parent_name", "—")
    parent_email = session_data.get("parent_email", "—")
    parent_phone = session_data.get("parent_phone", "—")
    city         = session_data.get("city", "—")
    state        = session_data.get("state", "—")
    session_id   = session_data.get("session_id", "—")
    session_date = session_data.get("session_date", datetime.now().strftime("%d %B %Y, %I:%M %p"))
    risk_score   = int(session_data.get("risk_score", 0))
    risk_label   = session_data.get("risk_label", "low")
    feat         = session_data.get("feature_averages", {})
    recs         = session_data.get("recommendations", [])
    model_ver    = session_data.get("model_version", "python-rf-asd-v1")
    aq_scores    = session_data.get("aq_scores", {})

    # ══════════════════════════════════════════════════════════════════════════
    # HEADER
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("ManasSaathi", title_style))
    story.append(Paragraph("AI-Enabled Autism Screening Platform", subtitle_style))
    story.append(Spacer(1, 3 * mm))
    story.append(HRFlowable(width="100%", thickness=2, color=COLOR_BRAND_BLUE))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Behavioral Screening Report", h("RepTitle", 14, COLOR_DARK, align=TA_CENTER)))
    story.append(Spacer(1, 6 * mm))

    # ══════════════════════════════════════════════════════════════════════════
    # CHILD + PARENT INFO
    # ══════════════════════════════════════════════════════════════════════════
    info_data = [
        [
            Paragraph("Child Information", section_style),
            Paragraph("Session Details", section_style),
        ],
        [
            Table(
                [
                    [Paragraph("Name:", label_style), Paragraph(child_name, body_style)],
                    [Paragraph("Parent:", label_style), Paragraph(parent_name, body_style)],
                    [Paragraph("Phone:", label_style), Paragraph(parent_phone, body_style)],
                    [Paragraph("Email:", label_style), Paragraph(parent_email, body_style)],
                    [Paragraph("Location:", label_style), Paragraph(f"{city}, {state}", body_style)],
                ],
                colWidths=[2.5 * cm, 5.5 * cm],
                style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]),
            ),
            Table(
                [
                    [Paragraph("Session ID:", label_style), Paragraph(session_id, body_style)],
                    [Paragraph("Date:", label_style), Paragraph(session_date, body_style)],
                    [Paragraph("Model:", label_style), Paragraph(model_ver, body_style)],
                    [Paragraph("Dataset:", label_style), Paragraph("UCI ASD Children (ID:419)", body_style)],
                    [Paragraph("Status:", label_style), Paragraph("Completed", body_style)],
                ],
                colWidths=[2.5 * cm, 5.5 * cm],
                style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]),
            ),
        ],
    ]

    info_table = Table(
        info_data,
        colWidths=[8.5 * cm, 8.5 * cm],
        style=TableStyle([
            ("BOX",         (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("INNERGRID",   (0, 0), (-1, -1), 0.25, COLOR_BORDER),
            ("BACKGROUND",  (0, 0), (-1, 0),  1,    COLOR_LIGHT_BG),
            ("VALIGN",      (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING",  (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]),
    )
    story.append(info_table)
    story.append(Spacer(1, 6 * mm))

    # ══════════════════════════════════════════════════════════════════════════
    # RISK SCORE SECTION
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("Screening Risk Assessment", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER))
    story.append(Spacer(1, 3 * mm))

    gauge_drawing = _draw_risk_gauge(risk_score, risk_label)
    risk_table = Table(
        [[gauge_drawing, Paragraph(_risk_text(risk_label), risk_style(risk_label))]],
        colWidths=[7 * cm, 10 * cm],
        style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ]),
    )
    story.append(risk_table)
    story.append(Spacer(1, 6 * mm))

    # ══════════════════════════════════════════════════════════════════════════
    # BEHAVIORAL METRICS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("Behavioral Feature Analysis (MediaPipe CV)", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER))
    story.append(Spacer(1, 3 * mm))

    eye        = int(feat.get("eye_contact", feat.get("eyeContact", 0)))
    attention  = int(feat.get("attention_span", feat.get("attentionSpan", 0)))
    emotion    = int(feat.get("emotion_signals", feat.get("emotionSignals", 0)))
    gesture    = int(feat.get("gesture_analysis", feat.get("gestureAnalysis", 0)))

    metric_drawing = Drawing(460, 80)
    _draw_metric_bar(metric_drawing, "Eye Contact", eye,       58, 440)
    _draw_metric_bar(metric_drawing, "Attention Span", attention,  38, 440)
    _draw_metric_bar(metric_drawing, "Emotion Signals", emotion,  18, 440)
    _draw_metric_bar(metric_drawing, "Gesture Analysis", gesture,  -2, 440)
    story.append(metric_drawing)
    story.append(Spacer(1, 2 * mm))

    metrics_legend = [
        ["Feature", "Score", "Interpretation"],
        ["Eye Contact",     f"{eye}%",      "Gaze direction & iris tracking via MediaPipe"],
        ["Attention Span",  f"{attention}%","Head pose yaw/pitch estimation"],
        ["Emotion Signals", f"{emotion}%",  "Facial expression ratio (mouth/eye aspect)"],
        ["Gesture Analysis",f"{gesture}%",  "Hand landmark proximity & movement pattern"],
    ]
    ml_table = Table(
        metrics_legend,
        colWidths=[4 * cm, 2 * cm, 11 * cm],
        style=TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0),  1, COLOR_BRAND_BLUE),
            ("TEXTCOLOR",    (0, 0), (-1, 0),  1, COLOR_WHITE),
            ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS",(0, 1),(-1, -1), [COLOR_WHITE, COLOR_LIGHT_BG]),
            ("GRID",         (0, 0), (-1, -1), 0.25, COLOR_BORDER),
            ("TOPPADDING",   (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
            ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ]),
    )
    story.append(ml_table)
    story.append(Spacer(1, 6 * mm))

    # ══════════════════════════════════════════════════════════════════════════
    # AQ-10 MAPPED SCORES (if available)
    # ══════════════════════════════════════════════════════════════════════════
    if aq_scores:
        story.append(Paragraph("AQ-10 Behavioral Indicator Mapping", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER))
        story.append(Spacer(1, 2 * mm))

        aq_questions = {
            "A1": "Responds when name is called",
            "A2": "Social interaction ease",
            "A3": "Non-verbal communication (gestures)",
            "A4": "Pointing to indicate objects",
            "A5": "Pretend play behaviour",
            "A6": "Follows pointing gestures",
            "A7": "Maintains eye contact",
            "A8": "Routine / repetitive behaviour",
            "A9": "Facial expression understanding",
            "A10": "Response to others' emotions",
        }
        aq_data = [["Question", "Behavior Observed", "Score", "Concern"]]
        for key, desc in aq_questions.items():
            val = aq_scores.get(key, 0)
            concern = "Yes" if val >= 0.5 else "No"
            concern_color = COLOR_DANGER if val >= 0.5 else COLOR_BRAND_GREEN
            aq_data.append([key, desc, f"{int(val)}", concern])

        aq_table = Table(
            aq_data,
            colWidths=[1.5 * cm, 8.5 * cm, 2 * cm, 2 * cm],
            style=TableStyle([
                ("BACKGROUND",   (0, 0), (-1, 0),  1, COLOR_DARK),
                ("TEXTCOLOR",    (0, 0), (-1, 0),  1, COLOR_WHITE),
                ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
                ("FONTSIZE",     (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS",(0, 1),(-1, -1), [COLOR_WHITE, COLOR_LIGHT_BG]),
                ("GRID",         (0, 0), (-1, -1), 0.25, COLOR_BORDER),
                ("TOPPADDING",   (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
                ("LEFTPADDING",  (0, 0), (-1, -1), 6),
            ]),
        )
        story.append(aq_table)
        story.append(Spacer(1, 6 * mm))

    # ══════════════════════════════════════════════════════════════════════════
    # RECOMMENDATIONS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("Recommendations & Next Steps", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER))
    story.append(Spacer(1, 3 * mm))

    # Built-in recommendations based on risk level
    default_recs = {
        "high": [
            "Schedule an appointment with a developmental pediatrician within 2 weeks.",
            "Contact your nearest child development center for a formal ASD evaluation (ADOS-2).",
            "Keep a behavioral diary documenting eye contact, responses, and repetitive behaviors.",
            "Contact the National Trust helpline (India): 1800-11-4515 for guidance.",
            "ManasSaathi is a screening support tool — this report does NOT constitute a diagnosis.",
        ],
        "moderate": [
            "Consult a developmental pediatrician for a follow-up evaluation within 4–6 weeks.",
            "Repeat the ManasSaathi screening in 2 weeks to track behavioral trends.",
            "Discuss communication and social interaction milestones with your child's pediatrician.",
            "Ensure adequate stimulation through structured play and social interaction.",
            "This is a preliminary screening — professional clinical assessment is recommended.",
        ],
        "low": [
            "Continue regular developmental check-ups with your pediatrician.",
            "Monitor developmental milestones (speech, social play, eye contact) over time.",
            "Re-screen in 3 months if you observe sudden behavioral changes.",
            "Encourage structured play and social interaction activities.",
            "This screening indicates typical behavioral range — stay observant and supportive.",
        ],
    }

    all_recs = recs if recs else default_recs.get(risk_label.lower(), default_recs["low"])

    for i, rec in enumerate(all_recs, 1):
        rec_para = Paragraph(f"  {i}. {rec}", body_style)
        story.append(rec_para)
        story.append(Spacer(1, 2 * mm))

    story.append(Spacer(1, 4 * mm))

    # ══════════════════════════════════════════════════════════════════════════
    # PARENT GUIDE SECTION
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("Parent Guidance: Understanding This Report", h("PG", 11, COLOR_BRAND_BLUE)))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER))
    story.append(Spacer(1, 2 * mm))

    guidance_points = [
        ("What did ManasSaathi analyze?",
         "The AI analyzed your child's eye contact, attention patterns, emotional responses, "
         "and hand gestures through the camera using Google MediaPipe computer vision technology."),
        ("What does the Risk Score mean?",
         f"A score of {risk_score}% means the AI observed behavioral patterns that match "
         f"a {'high' if risk_score>=65 else 'moderate' if risk_score>=35 else 'low'} level of "
         "markers associated with ASD in the training dataset. It is NOT a diagnosis."),
        ("What should I do next?",
         "Share this report with your child's pediatrician or a developmental specialist. "
         "This report supports — but does not replace — a clinical evaluation by a trained professional."),
        ("Resources in India",
         "NIMHANS Bangalore: +91-80-4611-5900 | Action for Autism: +91-11-4054-0991 | "
         "National Trust: 1800-11-4515 (Toll Free)"),
    ]

    for heading, content in guidance_points:
        story.append(Paragraph(f"<b>{heading}</b>", body_style))
        story.append(Paragraph(content, body_style))
        story.append(Spacer(1, 3 * mm))

    story.append(Spacer(1, 4 * mm))

    # ══════════════════════════════════════════════════════════════════════════
    # DISCLAIMER
    # ══════════════════════════════════════════════════════════════════════════
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        "⚠ MEDICAL DISCLAIMER: This report is generated by an AI screening tool for informational "
        "purposes only. It is NOT a medical diagnosis and should NOT be used as a substitute for "
        "professional clinical evaluation. ManasSaathi uses the UCI ASD Screening Dataset (open "
        "research data) to train its model. All results must be confirmed by a qualified "
        "developmental pediatrician or clinical psychologist. Parents should not make medical "
        "decisions based solely on this report.",
        disclaimer_s,
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        f"Generated by ManasSaathi Platform | Model: {model_ver} | Report Date: {session_date}",
        ParagraphStyle("Footer", fontSize=7, textColor=COLOR_MUTED, alignment=TA_CENTER),
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
