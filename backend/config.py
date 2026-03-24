import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "ams-secret-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///database.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "ams-jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = 86400

    SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
    SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "your_email@gmail.com")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "your_app_password")
    SMTP_SENDER_NAME = os.environ.get("SMTP_SENDER_NAME", "AMS Academic Monitor")

    ATTENDANCE_WARNING_THRESHOLD = 85
    ATTENDANCE_CRITICAL_THRESHOLD = 75
    PASSING_MARKS = 50
    LATE_ENTRY_MINUTES = 10