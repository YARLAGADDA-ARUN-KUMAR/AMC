from flask import Flask
from flask_cors import CORS
from sqlalchemy import text
from extensions import db, jwt
from config import Config


def migrate_marks_table_for_cla_schema():
    inspector = db.inspect(db.engine)
    if "marks" not in inspector.get_table_names():
        return

    existing_cols = {col["name"] for col in inspector.get_columns("marks")}
    required_cols = {
        "cla1_score": "FLOAT",
        "cla2_score": "FLOAT",
        "cla3_score": "FLOAT",
    }

    for col_name, col_type in required_cols.items():
        if col_name not in existing_cols:
            db.session.execute(text(f"ALTER TABLE marks ADD COLUMN {col_name} {col_type}"))

    # Backfill renamed columns when upgrading from older IA schema.
    refreshed_cols = {col["name"] for col in db.inspect(db.engine).get_columns("marks")}
    has_old_schema = {"ia1_score", "ia2_score", "assignment_score", "attendance_marks"}.issubset(refreshed_cols)
    if has_old_schema:
        db.session.execute(text("""
            UPDATE marks
            SET cla1_score = COALESCE(cla1_score, ia1_score),
                cla2_score = COALESCE(cla2_score, ia2_score),
                cla3_score = COALESCE(cla3_score, COALESCE(assignment_score, 0) + COALESCE(attendance_marks, 0))
        """))

    db.session.commit()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Ensure CORS headers on error responses
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

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
        migrate_marks_table_for_cla_schema()

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
