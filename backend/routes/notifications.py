from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.user import User
from models.attendance import AttendanceSession, AttendanceRecord, Subject
from models.marks import Marks
from models.notification import NotificationLog
from services.email_service import send_email
from services.attendance_calc import get_attendance_summary, get_defaulters
from services.marks_calc import get_marks_stats

notifications_bp = Blueprint("notifications", __name__)


def log_notification(notification_type, recipient_email, recipient_role, subject_line, triggered_by, status="sent"):
    log = NotificationLog(
        notification_type=notification_type,
        recipient_email=recipient_email,
        recipient_role=recipient_role,
        subject_line=subject_line,
        triggered_by=triggered_by,
        status=status,
    )
    db.session.add(log)


@notifications_bp.route("/absent-today", methods=["POST"])
@jwt_required()
def notify_absent_today():
    data = request.get_json()
    user_id = get_jwt_identity()
    session_id = data.get("session_id")

    if not session_id:
        return jsonify({"message": "session_id is required."}), 400

    session = AttendanceSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found."}), 404

    absent_records = AttendanceRecord.query.filter_by(
        session_id=session_id,
        status="absent"
    ).all()

    subject = Subject.query.get(session.subject_id)
    sent_count = 0
    failed_count = 0

    for record in absent_records:
        student = User.query.get(record.student_id)
        if not student or not student.email:
            continue

        subject_line = f"Absent Notice — {subject.name} on {session.date}"
        body = f"""
        <html><body>
        <h2>Attendance Notice</h2>
        <p>Dear {student.name},</p>
        <p>You were marked <strong>absent</strong> for <strong>{subject.name} ({subject.code})</strong> on <strong>{session.date}</strong>, Period {session.period}.</p>
        <p>Please ensure regular attendance to avoid detention.</p>
        <br>
        <p>Academic Monitoring System</p>
        </body></html>
        """

        status = send_email(student.email, subject_line, body)
        log_notification("absent_today", student.email, "student", subject_line, user_id, status)

        if status == "sent":
            sent_count += 1
        else:
            failed_count += 1

    db.session.commit()

    return jsonify({
        "message": f"Notifications sent. {sent_count} delivered, {failed_count} failed.",
        "sent": sent_count,
        "failed": failed_count,
    }), 200


@notifications_bp.route("/low-attendance", methods=["POST"])
@jwt_required()
def notify_low_attendance():
    data = request.get_json()
    user_id = get_jwt_identity()
    subject_id = data.get("subject_id")

    if not subject_id:
        return jsonify({"message": "subject_id is required."}), 400

    summary = get_attendance_summary(subject_id=subject_id)
    subject = Subject.query.get(subject_id)
    sent_count = 0
    failed_count = 0

    for record in summary:
        pct = record["percentage"]
        if pct >= 85:
            continue

        student = User.query.get(record["student_id"])
        if not student:
            continue

        total = record["total"]
        attended = record["attended"]
        threshold = 75

        if pct < threshold:
            classes_needed = max(0, round((threshold * total / 100) - attended))
            can_miss = 0
            alert_level = "URGENT"
            color = "#dc2626"
            extra_line = f"You need to attend at least <strong>{classes_needed} more classes</strong> to reach 75%."
        else:
            can_miss = max(0, int((attended - threshold * total / 100) / (threshold / 100)))
            classes_needed = 0
            alert_level = "WARNING"
            color = "#d97706"
            extra_line = f"You can afford to miss <strong>{can_miss} more class{'es' if can_miss != 1 else ''}</strong> before dropping below 75%."

        subject_line = f"[{alert_level}] Attendance Alert — {subject.name}"
        body = f"""
        <html><body>
        <h2 style="color:{color};">{alert_level}: Low Attendance Notice</h2>
        <p>Dear {student.name},</p>
        <p>Your attendance in <strong>{subject.name} ({subject.code})</strong> is currently <strong style="color:{color};">{pct:.1f}%</strong>.</p>
        <p>Classes attended: {attended} out of {total}</p>
        <p>{extra_line}</p>
        <p>Please contact your lecturer if you have any concerns.</p>
        <br>
        <p>Academic Monitoring System</p>
        </body></html>
        """

        status = send_email(student.email, subject_line, body)
        log_notification("low_attendance", student.email, "student", subject_line, user_id, status)
        if status == "sent":
            sent_count += 1
        else:
            failed_count += 1

        if student.parent_email:
            parent_subject = f"[{alert_level}] Your ward {student.name}'s attendance in {subject.name}"
            parent_body = f"""
            <html><body>
            <h2 style="color:{color};">{alert_level}: Attendance Notice for Your Ward</h2>
            <p>Dear Parent/Guardian,</p>
            <p>This is to inform you that your ward <strong>{student.name}</strong> ({student.roll_number}) has an attendance of <strong style="color:{color};">{pct:.1f}%</strong> in <strong>{subject.name}</strong>.</p>
            <p>{extra_line}</p>
            <p>Please encourage regular attendance.</p>
            <br>
            <p>Academic Monitoring System</p>
            </body></html>
            """
            p_status = send_email(student.parent_email, parent_subject, parent_body)
            log_notification("low_attendance", student.parent_email, "parent", parent_subject, user_id, p_status)

        if pct < 75:
            hod_users = User.query.filter_by(role="hod").all()
            for hod in hod_users:
                if hod.email:
                    hod_subject = f"[HOD ALERT] {student.name} below 75% in {subject.name}"
                    hod_body = f"""
                    <html><body>
                    <h2 style="color:#dc2626;">HOD Alert — Student Below 75%</h2>
                    <p>Dear HOD,</p>
                    <p><strong>{student.name}</strong> ({student.roll_number}) has attendance of <strong>{pct:.1f}%</strong> in <strong>{subject.name}</strong>.</p>
                    <p>Attended: {attended} / {total} classes.</p>
                    <p>Immediate intervention may be required.</p>
                    <br>
                    <p>Academic Monitoring System</p>
                    </body></html>
                    """
                    h_status = send_email(hod.email, hod_subject, hod_body)
                    log_notification("low_attendance", hod.email, "hod", hod_subject, user_id, h_status)

    db.session.commit()

    return jsonify({
        "message": f"Low attendance alerts sent. {sent_count} delivered, {failed_count} failed.",
        "sent": sent_count,
        "failed": failed_count,
    }), 200


@notifications_bp.route("/marks-published", methods=["POST"])
@jwt_required()
def notify_marks_published():
    data = request.get_json()
    user_id = get_jwt_identity()
    subject_id = data.get("subject_id")

    if not subject_id:
        return jsonify({"message": "subject_id is required."}), 400

    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"message": "Subject not found."}), 404

    marks_list = Marks.query.filter_by(subject_id=subject_id).all()
    sent_count = 0
    failed_count = 0

    for mark in marks_list:
        student = User.query.get(mark.student_id)
        if not student or not student.email:
            continue

        grade = mark.get_grade() or "—"
        is_fail = mark.is_arrear()
        status_text = "FAIL — Arrear Recorded" if is_fail else "PASS"
        color = "#dc2626" if is_fail else "#059669"

        subject_line = f"Marks Published — {subject.name} ({subject.code})"
        body = f"""
        <html><body>
        <h2>Marks Report — {subject.name}</h2>
        <p>Dear {student.name},</p>
        <p>Your marks for <strong>{subject.name} ({subject.code})</strong> have been published.</p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
            <tr style="background:#f1f5f9;"><th>Component</th><th>Score</th><th>Max</th></tr>
            <tr><td>Internal Assessment 1</td><td>{mark.ia1_score if mark.ia1_score is not None else '—'}</td><td>25</td></tr>
            <tr><td>Internal Assessment 2</td><td>{mark.ia2_score if mark.ia2_score is not None else '—'}</td><td>25</td></tr>
            <tr><td>Model Examination</td><td>{mark.model_score if mark.model_score is not None else '—'}</td><td>25</td></tr>
            <tr><td>Assignment</td><td>{mark.assignment_score if mark.assignment_score is not None else '—'}</td><td>10</td></tr>
            <tr><td>Attendance Marks</td><td>{mark.attendance_marks if mark.attendance_marks is not None else '—'}</td><td>5</td></tr>
            <tr style="background:#f8fafc;font-weight:bold;"><td>Total</td><td>{mark.total if mark.total is not None else '—'}</td><td>90</td></tr>
        </table>
        <p>Grade: <strong>{grade}</strong> &nbsp;|&nbsp; Result: <strong style="color:{color};">{status_text}</strong></p>
        <br>
        <p>Academic Monitoring System</p>
        </body></html>
        """

        s = send_email(student.email, subject_line, body)
        log_notification("marks_published", student.email, "student", subject_line, user_id, s)
        if s == "sent":
            sent_count += 1
        else:
            failed_count += 1

        if student.parent_email:
            p_subject = f"Marks Published — {student.name} — {subject.name}"
            p_status = send_email(student.parent_email, p_subject, body)
            log_notification("marks_published", student.parent_email, "parent", p_subject, user_id, p_status)

        if is_fail:
            hod_users = User.query.filter_by(role="hod").all()
            for hod in hod_users:
                if hod.email:
                    hod_subject = f"[ARREAR] {student.name} failed {subject.name}"
                    hod_body = f"""
                    <html><body>
                    <h2 style="color:#dc2626;">Arrear Alert</h2>
                    <p>Dear HOD,</p>
                    <p><strong>{student.name}</strong> ({student.roll_number}) has scored <strong>{mark.total}</strong>/90 in <strong>{subject.name}</strong> and has been flagged with an arrear.</p>
                    <p>Grade: {grade}</p>
                    <br>
                    <p>Academic Monitoring System</p>
                    </body></html>
                    """
                    h_status = send_email(hod.email, hod_subject, hod_body)
                    log_notification("arrear_alert", hod.email, "hod", hod_subject, user_id, h_status)

    db.session.commit()

    return jsonify({
        "message": f"Marks notifications sent. {sent_count} delivered, {failed_count} failed.",
        "sent": sent_count,
        "failed": failed_count,
    }), 200


@notifications_bp.route("/hod-report", methods=["POST"])
@jwt_required()
def notify_hod_report():
    user_id = get_jwt_identity()

    defaulters = get_defaulters()
    hod_users = User.query.filter_by(role="hod").all()

    if not hod_users:
        return jsonify({"message": "No HOD users found."}), 404

    defaulter_rows = ""
    for d in defaulters:
        defaulter_rows += f"""
        <tr>
            <td>{d['student_name']}</td>
            <td>{d['roll_number']}</td>
            <td>{d['subject_name']}</td>
            <td style="color:#dc2626;font-weight:bold;">{d['percentage']:.1f}%</td>
            <td>{d['attended']}</td>
            <td>{d['missed']}</td>
        </tr>
        """

    sent_count = 0
    failed_count = 0

    for hod in hod_users:
        if not hod.email:
            continue

        subject_line = f"Weekly Attendance Report — {len(defaulters)} Defaulters"
        body = f"""
        <html><body>
        <h2>Weekly Attendance Summary Report</h2>
        <p>Dear HOD,</p>
        <p>Here is the weekly attendance summary. Total defaulters (below 75%): <strong>{len(defaulters)}</strong></p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
            <tr style="background:#f1f5f9;">
                <th>Student</th>
                <th>Roll No</th>
                <th>Subject</th>
                <th>Attendance %</th>
                <th>Attended</th>
                <th>Missed</th>
            </tr>
            {defaulter_rows if defaulter_rows else '<tr><td colspan="6" style="text-align:center;">No defaulters this week.</td></tr>'}
        </table>
        <br>
        <p>Academic Monitoring System</p>
        </body></html>
        """

        status = send_email(hod.email, subject_line, body)
        log_notification("hod_report", hod.email, "hod", subject_line, user_id, status)
        if status == "sent":
            sent_count += 1
        else:
            failed_count += 1

    db.session.commit()

    return jsonify({
        "message": f"HOD report sent to {sent_count} HOD(s).",
        "sent": sent_count,
        "failed": failed_count,
    }), 200


@notifications_bp.route("/log", methods=["GET"])
@jwt_required()
def get_log():
    logs = NotificationLog.query.order_by(NotificationLog.sent_at.desc()).all()
    return jsonify([l.to_dict() for l in logs]), 200