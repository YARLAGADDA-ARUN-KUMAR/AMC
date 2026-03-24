from extensions import db
from models.user import User, Department
from models.attendance import AttendanceSession, AttendanceRecord, Subject
from models.marks import Marks
from models.notification import NotificationLog

__all__ = [
    "db",
    "User",
    "Department",
    "Subject",
    "AttendanceSession",
    "AttendanceRecord",
    "Marks",
    "NotificationLog",
]