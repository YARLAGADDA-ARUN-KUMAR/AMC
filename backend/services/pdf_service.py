from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import io


def generate_marks_pdf(subject, marks):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle("title", parent=styles["Heading1"], alignment=TA_CENTER, fontSize=16, spaceAfter=4)
    sub_style = ParagraphStyle("sub", parent=styles["Normal"], alignment=TA_CENTER, fontSize=10, textColor=colors.grey, spaceAfter=16)

    elements.append(Paragraph("Academic Monitoring System", title_style))
    elements.append(Paragraph(f"Mark Sheet — {subject.name} ({subject.code}) | Semester {subject.semester}", sub_style))
    elements.append(Spacer(1, 0.3*cm))

    headers = ["#", "Roll No", "Student Name", "IA 1\n/25", "IA 2\n/25", "Model\n/25", "Assign.\n/10", "Attend.\n/5", "Total\n/90", "Grade", "Result"]

    data = [headers]

    for idx, m in enumerate(marks):
        grade = m.get_grade() or "—"
        result = "FAIL" if m.is_arrear() else "PASS"
        row = [
            str(idx + 1),
            m.student.roll_number if m.student else "—",
            m.student.name if m.student else "—",
            str(m.ia1_score) if m.ia1_score is not None else "—",
            str(m.ia2_score) if m.ia2_score is not None else "—",
            str(m.model_score) if m.model_score is not None else "—",
            str(m.assignment_score) if m.assignment_score is not None else "—",
            str(m.attendance_marks) if m.attendance_marks is not None else "—",
            str(round(m.total, 1)) if m.total is not None else "—",
            grade,
            result,
        ]
        data.append(row)

    col_widths = [1*cm, 2.5*cm, 4.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm]

    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    for i, m in enumerate(marks, start=1):
        if m.is_arrear():
            table.setStyle(TableStyle([
                ("TEXTCOLOR", (-1, i), (-1, i), colors.HexColor("#dc2626")),
                ("FONTNAME", (-1, i), (-1, i), "Helvetica-Bold"),
            ]))

    elements.append(table)
    elements.append(Spacer(1, 0.5*cm))

    scored = [m for m in marks if m.total is not None]
    if scored:
        totals = [m.total for m in scored]
        avg = round(sum(totals) / len(totals), 1)
        fail_count = sum(1 for t in totals if t < 50)
        topper = max(scored, key=lambda m: m.total)
        summary_text = f"Total Students: {len(scored)}   |   Class Average: {avg}   |   Topper: {topper.student.name if topper.student else '—'} ({topper.total})   |   Failed: {fail_count}"
        elements.append(Paragraph(summary_text, ParagraphStyle("summary", parent=styles["Normal"], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()