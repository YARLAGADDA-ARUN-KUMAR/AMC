from flask import Flask
from flask_cors import CORS
from extensions import db, jwt
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from routes.auth import auth_bp
    from routes.attendance import attendance_bp
    from routes.marks import marks_bp
    from routes.notifications import notifications_bp
    from routes.students import students_bp
    from routes.dashboard import dashboard_bp
    from routes.face_recognition import face_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(marks_bp, url_prefix="/api/marks")
    app.register_blueprint(notifications_bp, url_prefix="/api/notify")
    app.register_blueprint(students_bp, url_prefix="/api/students")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(face_bp, url_prefix="/api/face")

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
