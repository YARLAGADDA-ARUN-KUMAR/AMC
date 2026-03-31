from app import app, db
from models.user import User, Department
from models.attendance import Subject, AttendanceSession, AttendanceRecord
from models.marks import Marks
from datetime import date, timedelta
import random

def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        dept = Department(name="Computer Science & Engineering")
        db.session.add(dept)
        db.session.flush()

        admin = User(name="Admin User", email="admin@ams.com", role="admin", department_id=dept.id)
        admin.set_password("demo123")
        db.session.add(admin)

        hod = User(name="Dr. Indu Kumar", email="indukumarik26@gmail.com", role="hod", department_id=dept.id)
        hod.set_password("demo123")
        db.session.add(hod)
        db.session.flush()

        dept.hod_id = hod.id

        lecturer = User(name="Sravan", email="lecturer@ams.com", role="lecturer", department_id=dept.id)
        lecturer.set_password("demo123")
        db.session.add(lecturer)
        db.session.flush()

        student_data = [

        ]

        students = []
        for name, email, roll, parent_email in student_data:
            student = User(
                name=name,
                email=email,
                role="student",
                department_id=dept.id,
                roll_number=roll,
                parent_email=parent_email,
            )
            student.set_password("demo123")
            db.session.add(student)
            students.append(student)

        db.session.flush()

        subjects_data = [
            ("Python Programming", "CS301", 3),
        ]

        subjects = []
        for name, code, sem in subjects_data:
            subject = Subject(
                name=name,
                code=code,
                department_id=dept.id,
                lecturer_id=lecturer.id,
                semester=sem,
            )
            db.session.add(subject)
            subjects.append(subject)

        db.session.flush()

        today = date.today()
        for subject in subjects:
            for day_offset in range(20):
                session_date = today - timedelta(days=day_offset + 1)
                if session_date.weekday() >= 5:
                    continue

                period = random.randint(1, 4)

                existing = AttendanceSession.query.filter_by(
                    subject_id=subject.id,
                    date=session_date,
                    period=period,
                ).first()

                if existing:
                    continue

                session = AttendanceSession(
                    subject_id=subject.id,
                    lecturer_id=lecturer.id,
                    date=session_date,
                    period=period,
                    session_type="regular",
                )
                db.session.add(session)
                db.session.flush()

                for i, student in enumerate(students):
                    if i < 3:
                        status = random.choices(["present", "absent"], weights=[50, 50])[0]
                    else:
                        status = random.choices(["present", "absent", "late"], weights=[85, 10, 5])[0]

                    record = AttendanceRecord(
                        session_id=session.id,
                        student_id=student.id,
                        status=status,
                    )
                    db.session.add(record)

        for subject in subjects:
            for student in students:
                cla1 = round(random.uniform(5, 15), 1)
                cla2 = round(random.uniform(5, 15), 1)
                cla3 = round(random.uniform(5, 15), 1)
                model = round(random.uniform(20, 40), 1)

                mark = Marks(
                    student_id=student.id,
                    subject_id=subject.id,
                    cla1_score=cla1,
                    cla2_score=cla2,
                    cla3_score=cla3,
                    model_score=model,
                )
                mark.compute_total()
                db.session.add(mark)

        db.session.commit()
        print("Database seeded successfully.")
        print("Login credentials:")
        print("  Admin     — admin@ams.com / demo123")
        print("  HOD       — indukumarik26@gmail.com / demo123")
        print("  Lecturer  — lecturer@ams.com / demo123")
        print("  Student   — aarav@student.com / demo123")

if __name__ == "__main__":
    seed()
