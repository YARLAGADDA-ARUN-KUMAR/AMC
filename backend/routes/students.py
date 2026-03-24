from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models.user import User
from models.attendance import AttendanceSession, AttendanceRecord, Subject
from models.marks import Marks
from models.notification import NotificationLog

students_bp = Blueprint("students", __name__)


@students_bp.route("", methods=["GET"])
@jwt_required()
def list_students():
    students = User.query.filter_by(role="student").all()
    return jsonify([s.to_dict() for s in students]), 200


@students_bp.route("/<int:student_id>", methods=["GET"])
@jwt_required()
def get_student(student_id):
    student = User.query.get(student_id)
    if not student:
        return jsonify({"message": "Student not found."}), 404

    attendance_records = AttendanceRecord.query.filter_by(student_id=student_id).all()
    attendance_summary = {}

    for record in attendance_records:
        session = AttendanceSession.query.get(record.session_id)
        if not session or session.session_type == "holiday":
            continue

        subject = Subject.query.get(session.subject_id)
        key = session.subject_id

        if key not in attendance_summary:
            attendance_summary[key] = {
                "subject_id": key,
                "subject_name": subject.name if subject else "Unknown",
                "attended": 0,
                "total": 0,
                "percentage": 0.0,
            }

        if not record.is_condoned:
            attendance_summary[key]["total"] += 1
            if record.status in ["present", "late"]:
                attendance_summary[key]["attended"] += 1

    for entry in attendance_summary.values():
        if entry["total"] > 0:
            entry["percentage"] = round((entry["attended"] / entry["total"]) * 100, 2)

    marks = Marks.query.filter_by(student_id=student_id).all()
    notifications = NotificationLog.query.filter_by(recipient_email=student.email).order_by(NotificationLog.sent_at.desc()).all()

    return jsonify({
        "student": student.to_dict(),
        "attendance": list(attendance_summary.values()),
        "marks": [m.to_dict() for m in marks],
        "notifications": [n.to_dict() for n in notifications],
    }), 200


@students_bp.route("", methods=["POST"])
@jwt_required()
def create_student():
    data = request.get_json()

    if not data.get("name") or not data.get("email"):
        return jsonify({"message": "Name and email are required."}), 400

    existing = User.query.filter_by(email=data["email"]).first()
    if existing:
        return jsonify({"message": "Email already exists."}), 409

    student = User(
        name=data["name"],
        email=data["email"],
        role="student",
        department_id=data.get("department_id"),
        phone=data.get("phone"),
        parent_email=data.get("parent_email"),
        roll_number=data.get("roll_number"),
    )
    student.set_password(data.get("password", "demo123"))
    db.session.add(student)
    db.session.commit()

    return jsonify(student.to_dict()), 201


@students_bp.route("/<int:student_id>", methods=["PUT"])
@jwt_required()
def update_student(student_id):
    data = request.get_json()
    student = User.query.get(student_id)

    if not student:
        return jsonify({"message": "Student not found."}), 404

    if "name" in data:
        student.name = data["name"]
    if "email" in data:
        student.email = data["email"]
    if "phone" in data:
        student.phone = data["phone"]
    if "parent_email" in data:
        student.parent_email = data["parent_email"]
    if "roll_number" in data:
        student.roll_number = data["roll_number"]

    db.session.commit()
    return jsonify(student.to_dict()), 200