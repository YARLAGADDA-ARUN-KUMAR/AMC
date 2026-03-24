from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from models.user import User
from models.attendance import AttendanceSession, AttendanceRecord, Subject
from models.marks import Marks
from services.attendance_calc import get_attendance_summary, get_defaulters

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    total_students = User.query.filter_by(role="student").count()

    defaulters = get_defaulters()
    at_risk_count = len(set(d["student_id"] for d in defaulters))

    today = date.today()
    todays_sessions = AttendanceSession.query.filter_by(date=today).all()
    classes_taken_today = len(todays_sessions)

    all_subjects = Subject.query.all()
    total_periods_today = len(all_subjects) * 2
    classes_pending_today = max(0, total_periods_today - classes_taken_today)

    all_marks = Marks.query.filter(Marks.total != None).all()
    last_assessment_average = 0.0
    if all_marks:
        last_assessment_average = round(
            sum(m.total for m in all_marks) / len(all_marks), 1
        )

    summary = get_attendance_summary()
    above_90 = sum(1 for s in summary if s["percentage"] >= 90)
    between_75_90 = sum(1 for s in summary if 75 <= s["percentage"] < 90)
    below_75 = sum(1 for s in summary if s["percentage"] < 75)

    return jsonify({
        "total_students": total_students,
        "at_risk_count": at_risk_count,
        "classes_taken_today": classes_taken_today,
        "classes_pending_today": classes_pending_today,
        "last_assessment_average": last_assessment_average,
        "distribution": {
            "above_90": above_90,
            "between_75_90": between_75_90,
            "below_75": below_75,
        },
    }), 200