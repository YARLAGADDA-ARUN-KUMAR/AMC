# from extensions import db
# from datetime import datetime
# import bcrypt

# class Department(db.Model):
#     __tablename__ = "departments"

#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), nullable=False)
#     hod_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

#     users = db.relationship("User", foreign_keys="User.department_id", back_populates="department")
#     subjects = db.relationship("Subject", back_populates="department")

#     def to_dict(self):
#         return {
#             "id": self.id,
#             "name": self.name,
#             "hod_id": self.hod_id,
#         }


# class User(db.Model):
#     __tablename__ = "users"

#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), nullable=False)
#     email = db.Column(db.String(150), unique=True, nullable=False)
#     password_hash = db.Column(db.String(256), nullable=False)
#     role = db.Column(db.String(20), nullable=False, default="student")
#     department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)
#     phone = db.Column(db.String(15), nullable=True)
#     parent_email = db.Column(db.String(150), nullable=True)
#     roll_number = db.Column(db.String(20), nullable=True)
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)

#     department = db.relationship("Department", foreign_keys=[department_id], back_populates="users")
#     attendance_records = db.relationship("AttendanceRecord", foreign_keys="AttendanceRecord.student_id", back_populates="student")
#     marks = db.relationship("Marks", foreign_keys="Marks.student_id", back_populates="student")
#     notifications_triggered = db.relationship("NotificationLog", foreign_keys="NotificationLog.triggered_by", back_populates="triggered_by_user")

#     def set_password(self, password):
#         self.password_hash = bcrypt.hashpw(
#             password.encode("utf-8"), bcrypt.gensalt()
#         ).decode("utf-8")

#     def check_password(self, password):
#         return bcrypt.checkpw(
#             password.encode("utf-8"),
#             self.password_hash.encode("utf-8")
#         )

#     def to_dict(self):
#         return {
#             "id": self.id,
#             "name": self.name,
#             "email": self.email,
#             "role": self.role,
#             "department_id": self.department_id,
#             "phone": self.phone,
#             "parent_email": self.parent_email,
#             "roll_number": self.roll_number,
#             "created_at": self.created_at.isoformat() if self.created_at else None,
#         }
from extensions import db
from datetime import datetime
import bcrypt  # type: ignore

class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    hod_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    users = db.relationship("User", foreign_keys="User.department_id", back_populates="department")
    subjects = db.relationship("Subject", back_populates="department")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "hod_id": self.hod_id,
        }


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="student")
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)
    phone = db.Column(db.String(15), nullable=True)
    parent_email = db.Column(db.String(150), nullable=True)
    roll_number = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    face_encoding = db.Column(db.Text, nullable=True)

    department = db.relationship("Department", foreign_keys=[department_id], back_populates="users")
    attendance_records = db.relationship("AttendanceRecord", foreign_keys="AttendanceRecord.student_id", back_populates="student")
    marks = db.relationship("Marks", foreign_keys="Marks.student_id", back_populates="student")
    notifications_triggered = db.relationship("NotificationLog", foreign_keys="NotificationLog.triggered_by", back_populates="triggered_by_user")

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode("utf-8"),
            self.password_hash.encode("utf-8")
        )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department_id": self.department_id,
            "phone": self.phone,
            "parent_email": self.parent_email,
            "roll_number": self.roll_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
