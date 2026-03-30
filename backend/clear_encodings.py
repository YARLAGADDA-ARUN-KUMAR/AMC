from app import create_app
from extensions import db
from models.user import User

app = create_app()

with app.app_context():
    students = User.query.filter_by(role='student').all()
    count = 0
    for s in students:
        if s.face_encoding is not None:
            s.face_encoding = None
            count += 1
    db.session.commit()
    print(f"Cleared legacy ResNet18 face encodings for {count} students.")
