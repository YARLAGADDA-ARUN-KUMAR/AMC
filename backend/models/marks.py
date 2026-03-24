from extensions import db
from datetime import datetime


class Marks(db.Model):
    __tablename__ = "marks"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    ia1_score = db.Column(db.Float, nullable=True)
    ia2_score = db.Column(db.Float, nullable=True)
    model_score = db.Column(db.Float, nullable=True)
    assignment_score = db.Column(db.Float, nullable=True)
    attendance_marks = db.Column(db.Float, nullable=True)
    total = db.Column(db.Float, nullable=True)
    is_locked = db.Column(db.Boolean, default=False)
    submitted_at = db.Column(db.DateTime, nullable=True)

    student = db.relationship("User", foreign_keys=[student_id], back_populates="marks")
    subject = db.relationship("Subject", back_populates="marks")

    __table_args__ = (
        db.UniqueConstraint("student_id", "subject_id", name="unique_marks_per_subject"),
    )

    def compute_total(self):
        scores = [
            self.ia1_score or 0,
            self.ia2_score or 0,
            self.model_score or 0,
            self.assignment_score or 0,
            self.attendance_marks or 0,
        ]
        self.total = round(sum(scores), 2)
        return self.total

    def get_grade(self):
        if self.total is None:
            return None
        if self.total >= 81:
            return "O"
        if self.total >= 71:
            return "A+"
        if self.total >= 61:
            return "A"
        if self.total >= 51:
            return "B+"
        if self.total >= 50:
            return "B"
        return "F"

    def is_arrear(self):
        return self.total is not None and self.total < 50

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "roll_number": self.student.roll_number if self.student else None,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "ia1_score": self.ia1_score,
            "ia2_score": self.ia2_score,
            "model_score": self.model_score,
            "assignment_score": self.assignment_score,
            "attendance_marks": self.attendance_marks,
            "total": self.total,
            "grade": self.get_grade(),
            "is_locked": self.is_locked,
            "is_arrear": self.is_arrear(),
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
        }