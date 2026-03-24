from models.attendance import AttendanceSession, AttendanceRecord, Subject
from models.user import User


def get_attendance_summary(subject_id=None):
    query = AttendanceRecord.query.join(AttendanceSession)

    if subject_id:
        query = query.filter(AttendanceSession.subject_id == subject_id)

    records = query.all()

    summary = {}

    for record in records:
        session = record.session
        if session.session_type == "holiday":
            continue

        key = (record.student_id, session.subject_id)

        if key not in summary:
            student = User.query.get(record.student_id)
            subject = Subject.query.get(session.subject_id)
            summary[key] = {
                "student_id": record.student_id,
                "student_name": student.name if student else "Unknown",
                "roll_number": student.roll_number if student else "—",
                "subject_id": session.subject_id,
                "subject_name": subject.name if subject else "Unknown",
                "attended": 0,
                "total": 0,
                "percentage": 0.0,
            }

        if not record.is_condoned:
            summary[key]["total"] += 1
            if record.status in ["present", "late"]:
                summary[key]["attended"] += 1

    result = []
    for entry in summary.values():
        if entry["total"] > 0:
            entry["percentage"] = round((entry["attended"] / entry["total"]) * 100, 2)
        result.append(entry)

    return result


def get_defaulters(threshold=75):
    summary = get_attendance_summary()
    return [s for s in summary if s["percentage"] < threshold and s["total"] > 0]


def compute_can_miss(attended, total, threshold=75):
    return max(0, int((attended - threshold * total / 100) / (threshold / 100)))


def compute_classes_needed(attended, total, threshold=75):
    return max(0, round((threshold * total / 100) - attended))