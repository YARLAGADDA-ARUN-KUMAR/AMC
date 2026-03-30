from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models.user import User
from models.attendance import AttendanceSession, AttendanceRecord, Subject
from services.attendance_calc import get_attendance_summary, get_defaulters

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/session", methods=["POST"])
@jwt_required()
def create_session():
    data = request.get_json()
    user_id = get_jwt_identity()

    required = ["subject_id", "date", "period", "session_type"]
    for field in required:
        if not data.get(field):
            return jsonify({"message": f"{field} is required."}), 400

    existing = AttendanceSession.query.filter_by(
        subject_id=data["subject_id"],
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        period=data["period"],
    ).first()

    if existing:
        return jsonify(existing.to_dict()), 200

    session = AttendanceSession(
        subject_id=data["subject_id"],
        lecturer_id=user_id,
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        period=data["period"],
        session_type=data["session_type"],
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@attendance_bp.route("/session/<int:session_id>/mark", methods=["POST"])
@jwt_required()
def bulk_mark(session_id):
    data = request.get_json()
    records = data.get("records", [])

    session = AttendanceSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found."}), 404

    for item in records:
        student_id = item.get("student_id")
        status = item.get("status", "absent")
        existing = AttendanceRecord.query.filter_by(session_id=session_id, student_id=student_id).first()
        if existing:
            existing.status = status
        else:
            record = AttendanceRecord(session_id=session_id, student_id=student_id, status=status)
            db.session.add(record)

    db.session.commit()
    return jsonify({"message": "Attendance marked successfully."}), 200


@attendance_bp.route("/session/<int:session_id>/records", methods=["GET"])
@jwt_required()
def get_session_records(session_id):
    session = AttendanceSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found."}), 404
    records = AttendanceRecord.query.filter_by(session_id=session_id).all()
    return jsonify([r.to_dict() for r in records]), 200


@attendance_bp.route("/record/<int:record_id>", methods=["PUT"])
@jwt_required()
def override_record(record_id):
    data = request.get_json()
    record = AttendanceRecord.query.get(record_id)
    if not record:
        return jsonify({"message": "Record not found."}), 404
    if data.get("status") not in ["present", "absent", "late"]:
        return jsonify({"message": "Invalid status."}), 400
    record.status = data["status"]
    db.session.commit()
    return jsonify(record.to_dict()), 200


@attendance_bp.route("/record/<int:record_id>/condone", methods=["PUT"])
@jwt_required()
def condone_record(record_id):
    data = request.get_json()
    record = AttendanceRecord.query.get(record_id)
    if not record:
        return jsonify({"message": "Record not found."}), 404
    if not data.get("reason"):
        return jsonify({"message": "Condone reason is required."}), 400
    record.is_condoned = True
    record.condone_reason = data["reason"]
    db.session.commit()
    return jsonify(record.to_dict()), 200


@attendance_bp.route("/summary", methods=["GET"])
@jwt_required()
def attendance_summary():
    subject_id = request.args.get("subject_id", type=int)
    summary = get_attendance_summary(subject_id=subject_id)
    return jsonify(summary), 200


@attendance_bp.route("/defaulters", methods=["GET"])
@jwt_required()
def defaulters():
    result = get_defaulters()
    return jsonify(result), 200


@attendance_bp.route("/holiday", methods=["POST"])
@jwt_required()
def mark_holiday():
    data = request.get_json()
    user_id = get_jwt_identity()
    if not data.get("subject_id") or not data.get("date"):
        return jsonify({"message": "subject_id and date are required."}), 400

    existing = AttendanceSession.query.filter_by(
        subject_id=data["subject_id"],
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        session_type="holiday"
    ).first()
    if existing:
        return jsonify({"message": "Holiday already marked."}), 409

    holiday_session = AttendanceSession(
        subject_id=data["subject_id"],
        lecturer_id=user_id,
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        period=0,
        session_type="holiday",
    )
    db.session.add(holiday_session)
    db.session.commit()
    return jsonify({"message": "Holiday marked successfully.", "session": holiday_session.to_dict()}), 201


@attendance_bp.route("/subjects", methods=["GET"])
@jwt_required()
def list_subjects():
    user_id = get_jwt_identity()
    subjects = Subject.query.filter_by(lecturer_id=user_id).all()
    return jsonify([s.to_dict() for s in subjects]), 200