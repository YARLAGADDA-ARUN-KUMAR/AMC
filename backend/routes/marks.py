from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models.user import User
from models.attendance import Subject
from models.marks import Marks
from services.marks_calc import get_marks_stats
from services.pdf_service import generate_marks_pdf
import io

marks_bp = Blueprint("marks", __name__)


@marks_bp.route("/<int:subject_id>", methods=["GET"])
@jwt_required()
def get_marks(subject_id):
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"message": "Subject not found."}), 404

    marks = Marks.query.filter_by(subject_id=subject_id).all()
    return jsonify([m.to_dict() for m in marks]), 200


@marks_bp.route("/bulk", methods=["POST"])
@jwt_required()
def bulk_save():
    data = request.get_json()
    subject_id = data.get("subject_id")
    marks_list = data.get("marks", [])

    if not subject_id:
        return jsonify({"message": "subject_id is required."}), 400

    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"message": "Subject not found."}), 404

    for item in marks_list:
        student_id = item.get("student_id")
        if not student_id:
            continue

        existing = Marks.query.filter_by(
            student_id=student_id,
            subject_id=subject_id
        ).first()

        def clamp(val, max_val):
            if val is None:
                return None
            try:
                v = float(val)
                return max(0, min(v, max_val))
            except (TypeError, ValueError):
                return None

        if existing:
            if existing.is_locked:
                continue
            existing.cla1_score = clamp(item.get("cla1_score"), 15)
            existing.cla2_score = clamp(item.get("cla2_score"), 15)
            existing.cla3_score = clamp(item.get("cla3_score"), 15)
            existing.model_score = clamp(item.get("model_score"), 40)
            existing.compute_total()
        else:
            mark = Marks(
                student_id=student_id,
                subject_id=subject_id,
                cla1_score=clamp(item.get("cla1_score"), 15),
                cla2_score=clamp(item.get("cla2_score"), 15),
                cla3_score=clamp(item.get("cla3_score"), 15),
                model_score=clamp(item.get("model_score"), 40),
            )
            mark.compute_total()
            db.session.add(mark)

    db.session.commit()
    return jsonify({"message": "Marks saved successfully."}), 200


@marks_bp.route("/<int:marks_id>", methods=["PUT"])
@jwt_required()
def update_mark(marks_id):
    data = request.get_json()
    mark = Marks.query.get(marks_id)

    if not mark:
        return jsonify({"message": "Marks record not found."}), 404

    if mark.is_locked:
        return jsonify({"message": "Marks are locked. Contact admin to unlock."}), 403

    def clamp(val, max_val):
        if val is None:
            return None
        try:
            v = float(val)
            return max(0, min(v, max_val))
        except (TypeError, ValueError):
            return None

    if "cla1_score" in data:
        mark.cla1_score = clamp(data["cla1_score"], 15)
    if "cla2_score" in data:
        mark.cla2_score = clamp(data["cla2_score"], 15)
    if "cla3_score" in data:
        mark.cla3_score = clamp(data["cla3_score"], 15)
    if "model_score" in data:
        mark.model_score = clamp(data["model_score"], 40)

    mark.compute_total()
    db.session.commit()

    return jsonify(mark.to_dict()), 200


@marks_bp.route("/<int:subject_id>/submit", methods=["POST"])
@jwt_required()
def submit_marks(subject_id):
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"message": "Subject not found."}), 404

    marks = Marks.query.filter_by(subject_id=subject_id).all()

    if not marks:
        return jsonify({"message": "No marks found for this subject."}), 404

    for mark in marks:
        mark.is_locked = True
        mark.submitted_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": f"Marks submitted and locked for {len(marks)} students."}), 200


@marks_bp.route("/<int:subject_id>/stats", methods=["GET"])
@jwt_required()
def marks_stats(subject_id):
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"message": "Subject not found."}), 404

    stats = get_marks_stats(subject_id)
    return jsonify(stats), 200


@marks_bp.route("/<int:subject_id>/pdf", methods=["GET"])
@jwt_required()
def download_pdf(subject_id):
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"message": "Subject not found."}), 404

    marks = Marks.query.filter_by(subject_id=subject_id).all()

    if not marks:
        return jsonify({"message": "No marks found for this subject."}), 404

    pdf_buffer = generate_marks_pdf(subject, marks)

    return send_file(
        io.BytesIO(pdf_buffer),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"marksheet_{subject.code}.pdf"
    )