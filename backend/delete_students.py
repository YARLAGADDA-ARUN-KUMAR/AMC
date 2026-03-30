import os
from app import create_app
from extensions import db
from models.user import User
from models.attendance import AttendanceRecord
from models.marks import Marks

app = create_app()

with app.app_context():
    students = User.query.filter_by(role='student').all()
    count = len(students)
    for s in students:
        AttendanceRecord.query.filter_by(student_id=s.id).delete()
        Marks.query.filter_by(student_id=s.id).delete()
        db.session.delete(s)
    db.session.commit()
    print(f"Deleted {count} students and their dependencies.")
