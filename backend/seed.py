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

        hod = User(name="Dr. Rajesh Kumar", email="hod@ams.com", role="hod", department_id=dept.id)
        hod.set_password("demo123")
        db.session.add(hod)
        db.session.flush()

        dept.hod_id = hod.id

        lecturer = User(name="Prof. Anitha Sharma", email="lecturer@ams.com", role="lecturer", department_id=dept.id)
        lecturer.set_password("demo123")
        db.session.add(lecturer)
        db.session.flush()

        student_data = [
            ("Aarav Mehta", "aarav@student.com", "CS2021001", "parent1@gmail.com"),
            ("Priya Nair", "priya@student.com", "CS2021002", "parent2@gmail.com"),
            ("Rohit Verma", "rohit@student.com", "CS2021003", "parent3@gmail.com"),
            ("Sneha Iyer", "sneha@student.com", "CS2021004", "parent4@gmail.com"),
            ("Karthik Raja", "karthik@student.com", "CS2021005", "parent5@gmail.com"),
            ("Divya Menon", "divya@student.com", "CS2021006", "parent6@gmail.com"),
            ("Arjun Pillai", "arjun@student.com", "CS2021007", "parent7@gmail.com"),
            ("Lakshmi Patel", "lakshmi@student.com", "CS2021008", "parent8@gmail.com"),
            ("Vijay Shankar", "vijay@student.com", "CS2021009", "parent9@gmail.com"),
            ("Meera Krishnan", "meera@student.com", "CS2021010", "parent10@gmail.com"),
            ("Aditya Bose", "aditya@student.com", "CS2021011", "parent11@gmail.com"),
            ("Pooja Reddy", "pooja@student.com", "CS2021012", "parent12@gmail.com"),
            ("Suresh Babu", "suresh@student.com", "CS2021013", "parent13@gmail.com"),
            ("Nithya Chandran", "nithya@student.com", "CS2021014", "parent14@gmail.com"),
            ("Ravi Teja", "ravi@student.com", "CS2021015", "parent15@gmail.com"),
            ("Ananya Singh", "ananya@student.com", "CS2021016", "parent16@gmail.com"),
            ("Pranav Kumar", "pranav@student.com", "CS2021017", "parent17@gmail.com"),
            ("Kavitha Subramaniam", "kavitha@student.com", "CS2021018", "parent18@gmail.com"),
            ("Deepak Nair", "deepak@student.com", "CS2021019", "parent19@gmail.com"),
            ("Harini Balaji", "harini@student.com", "CS2021020", "parent20@gmail.com"),
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
                ia1 = round(random.uniform(8, 25), 1)
                ia2 = round(random.uniform(8, 25), 1)
                model = round(random.uniform(8, 25), 1)
                assignment = round(random.uniform(3, 10), 1)
                attendance_m = round(random.uniform(2, 5), 1)

                mark = Marks(
                    student_id=student.id,
                    subject_id=subject.id,
                    ia1_score=ia1,
                    ia2_score=ia2,
                    model_score=model,
                    assignment_score=assignment,
                    attendance_marks=attendance_m,
                )
                mark.compute_total()
                db.session.add(mark)

        db.session.commit()
        print("Database seeded successfully.")
        print("Login credentials:")
        print("  Admin     — admin@ams.com / demo123")
        print("  HOD       — hod@ams.com / demo123")
        print("  Lecturer  — lecturer@ams.com / demo123")
        print("  Student   — aarav@student.com / demo123")

if __name__ == "__main__":
    seed()
