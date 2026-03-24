from extensions import db
from datetime import datetime


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    code = db.Column(db.String(20), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    semester = db.Column(db.Integer, nullable=False, default=1)

    department = db.relationship("Department", back_populates="subjects")
    lecturer = db.relationship("User", foreign_keys=[lecturer_id])
    sessions = db.relationship("AttendanceSession", back_populates="subject", cascade="all, delete-orphan")
    marks = db.relationship("Marks", back_populates="subject", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "department_id": self.department_id,
            "lecturer_id": self.lecturer_id,
            "semester": self.semester,
        }


class AttendanceSession(db.Model):
    __tablename__ = "attendance_sessions"

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    period = db.Column(db.Integer, nullable=False)
    session_type = db.Column(db.String(20), nullable=False, default="regular")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subject = db.relationship("Subject", back_populates="sessions")
    lecturer = db.relationship("User", foreign_keys=[lecturer_id])
    records = db.relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        db.UniqueConstraint("subject_id", "date", "period", name="unique_session_per_period"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "subject_id": self.subject_id,
            "lecturer_id": self.lecturer_id,
            "date": self.date.isoformat() if self.date else None,
            "period": self.period,
            "session_type": self.session_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AttendanceRecord(db.Model):
    __tablename__ = "attendance_records"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("attendance_sessions.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(10), nullable=False, default="absent")
    is_condoned = db.Column(db.Boolean, default=False)
    condone_reason = db.Column(db.String(200), nullable=True)
    face_detected = db.Column(db.Boolean, default=False)

    session = db.relationship("AttendanceSession", back_populates="records")
    student = db.relationship("User", foreign_keys=[student_id], back_populates="attendance_records")

    __table_args__ = (
        db.UniqueConstraint("session_id", "student_id", name="unique_record_per_session"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "roll_number": self.student.roll_number if self.student else None,
            "status": self.status,
            "is_condoned": self.is_condoned,
            "condone_reason": self.condone_reason,
            "face_detected": self.face_detected,
        }