import json

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.user import User
from models.attendance import AttendanceSession, AttendanceRecord, Subject

face_bp = Blueprint("face", __name__)

# Lazy import to avoid loading heavy ML libs at module level
_face_service = None


def get_face_service():
    global _face_service
    if _face_service is None:
        from services.face_recognition import face_service
        _face_service = face_service
    return _face_service


@face_bp.route("/register", methods=["POST"])
@jwt_required()
def register_face():
    """
    Register a student's face from multiple webcam photos.
    Expects { student_id: int, images: ["base64...", ...] }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"message": "Invalid JSON data."}), 400

        student_id = data.get("student_id")
        images = data.get("images", [])

        if not student_id or len(images) == 0:
            return jsonify({"message": "student_id and at least one image are required."}), 400

        student = User.query.get(student_id)
        if not student:
            return jsonify({"message": "Student not found."}), 404

        service = get_face_service()
        embedding = service.register_face(images)

        if embedding is None:
            return jsonify({"message": "No face detected in any of the photos. Please try again with better lighting and face the camera directly."}), 400

        # Store embedding as JSON string in the database
        student.face_encoding = json.dumps(embedding)
        db.session.commit()

        return jsonify({
            "message": f"Face registered successfully for {student.name}.",
            "student_id": student.id,
            "student_name": student.name,
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Server error: {str(e)}"}), 500


@face_bp.route("/recognize", methods=["POST"])
@jwt_required()
def recognize():
    """
    Receive a base64 webcam frame, detect and recognize faces.
    Uses real embeddings for registered students, simulation for others.
    """
    data = request.get_json()
    image = data.get("image")
    subject_id = data.get("subject_id")
    session_id = data.get("session_id")

    if not image or not subject_id or not session_id:
        return jsonify({"message": "image, subject_id, and session_id are required."}), 400

    session = AttendanceSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found."}), 404

    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"message": "Subject not found."}), 404

    students = User.query.filter_by(
        role="student", department_id=subject.department_id
    ).all()

    student_list = [
        {"id": s.id, "name": s.name, "roll_number": s.roll_number}
        for s in students
    ]

    # Build registered encodings dict for real recognition
    registered_encodings = {}
    for s in students:
        if s.face_encoding:
            try:
                registered_encodings[str(s.id)] = json.loads(s.face_encoding)
            except (json.JSONDecodeError, TypeError):
                pass

    service = get_face_service()
    result = service.recognize_from_frame(image, student_list, session_id, registered_encodings)

    return jsonify(result), 200


@face_bp.route("/students/<int:subject_id>", methods=["GET"])
@jwt_required()
def get_students(subject_id):
    """Get students for a subject with their face registration status."""
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"message": "Subject not found."}), 404

    students = User.query.filter_by(
        role="student", department_id=subject.department_id
    ).all()

    return jsonify([
        {
            "id": s.id,
            "name": s.name,
            "roll_number": s.roll_number,
            "face_registered": s.face_encoding is not None,
        }
        for s in students
    ]), 200


@face_bp.route("/session/<int:session_id>/recognized", methods=["GET"])
@jwt_required()
def get_recognized(session_id):
    """Get all students recognized so far in this session."""
    service = get_face_service()
    recognized_ids = service.get_session_recognized(session_id)
    students = User.query.filter(User.id.in_(recognized_ids)).all() if recognized_ids else []
    return jsonify([
        {"id": s.id, "name": s.name, "roll_number": s.roll_number}
        for s in students
    ]), 200


@face_bp.route("/session/<int:session_id>/save", methods=["POST"])
@jwt_required()
def save_face_attendance(session_id):
    """Save recognized students as present in the attendance session."""
    session = AttendanceSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found."}), 404

    service = get_face_service()
    recognized_ids = service.get_session_recognized(session_id)

    subject = Subject.query.get(session.subject_id)
    all_students = User.query.filter_by(
        role="student", department_id=subject.department_id
    ).all()

    saved_count = 0
    for student in all_students:
        status = "present" if student.id in recognized_ids else "absent"
        face_detected = student.id in recognized_ids

        existing = AttendanceRecord.query.filter_by(
            session_id=session_id, student_id=student.id
        ).first()

        if existing:
            existing.status = status
            existing.face_detected = face_detected
        else:
            record = AttendanceRecord(
                session_id=session_id,
                student_id=student.id,
                status=status,
                face_detected=face_detected,
            )
            db.session.add(record)
        saved_count += 1

    db.session.commit()
    service.clear_session(session_id)

    return jsonify({
        "message": f"Attendance saved. {len(recognized_ids)} present, {saved_count - len(recognized_ids)} absent.",
        "present_count": len(recognized_ids),
        "absent_count": saved_count - len(recognized_ids),
    }), 200
