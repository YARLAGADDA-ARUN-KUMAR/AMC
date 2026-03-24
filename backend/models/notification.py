from extensions import db
from datetime import datetime


class NotificationLog(db.Model):
    __tablename__ = "notifications_log"

    id = db.Column(db.Integer, primary_key=True)
    notification_type = db.Column(db.String(50), nullable=False)
    recipient_email = db.Column(db.String(150), nullable=False)
    recipient_role = db.Column(db.String(20), nullable=False)
    subject_line = db.Column(db.String(200), nullable=False)
    triggered_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(10), nullable=False, default="sent")

    triggered_by_user = db.relationship("User", foreign_keys=[triggered_by], back_populates="notifications_triggered")

    def to_dict(self):
        return {
            "id": self.id,
            "notification_type": self.notification_type,
            "recipient_email": self.recipient_email,
            "recipient_role": self.recipient_role,
            "subject_line": self.subject_line,
            "triggered_by": self.triggered_by,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "status": self.status,
        }