import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app


def send_email(to_email, subject, html_body):
    try:
        smtp_host = current_app.config["SMTP_HOST"]
        smtp_port = current_app.config["SMTP_PORT"]
        smtp_email = current_app.config["SMTP_EMAIL"]
        smtp_password = current_app.config["SMTP_PASSWORD"]
        sender_name = current_app.config["SMTP_SENDER_NAME"]

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{smtp_email}>"
        msg["To"] = to_email

        part = MIMEText(html_body, "html")
        msg.attach(part)

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, msg.as_string())

        return "sent"

    except smtplib.SMTPAuthenticationError:
        current_app.logger.error(f"SMTP Authentication failed for {to_email}")
        return "failed"

    except smtplib.SMTPRecipientsRefused:
        current_app.logger.error(f"Recipient refused: {to_email}")
        return "failed"

    except smtplib.SMTPException as e:
        current_app.logger.error(f"SMTP error sending to {to_email}: {str(e)}")
        return "failed"

    except Exception as e:
        current_app.logger.error(f"Unexpected error sending email to {to_email}: {str(e)}")
        return "failed"


def send_bulk_emails(recipients, subject, html_body):
    results = {"sent": 0, "failed": 0}
    for email in recipients:
        status = send_email(email, subject, html_body)
        if status == "sent":
            results["sent"] += 1
        else:
            results["failed"] += 1
    return results


def build_attendance_warning_email(student_name, subject_name, subject_code, percentage, attended, total, threshold=75):
    is_critical = percentage < threshold
    color = "#dc2626" if is_critical else "#d97706"
    alert_level = "URGENT" if is_critical else "WARNING"

    if is_critical:
        classes_needed = max(0, round((threshold * total / 100) - attended))
        action_line = f"You need to attend at least <strong>{classes_needed} more classes</strong> to reach 75%."
    else:
        can_miss = max(0, int((attended - threshold * total / 100) / (threshold / 100)))
        action_line = f"You can afford to miss <strong>{can_miss} more class{'es' if can_miss != 1 else ''}</strong> before dropping below 75%."

    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background:{color};padding:16px 20px;border-radius:8px;margin-bottom:20px;">
            <h2 style="color:white;margin:0;">{alert_level}: Attendance Alert</h2>
        </div>
        <p>Dear {student_name},</p>
        <p>Your attendance in <strong>{subject_name} ({subject_code})</strong> is currently:</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
            <span style="font-size:36px;font-weight:bold;color:{color};">{percentage:.1f}%</span>
            <p style="margin:4px 0 0;color:#64748b;">{attended} attended out of {total} classes</p>
        </div>
        <p>{action_line}</p>
        <p style="color:#64748b;font-size:14px;">Please contact your lecturer if you have valid reasons for absence (medical, NCC, inter-college events) that may be condoned.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
        <p style="color:#94a3b8;font-size:12px;">Academic Monitoring System — Automated Alert</p>
    </body>
    </html>
    """


def build_marks_email(student_name, subject_name, subject_code, mark):
    grade = mark.get_grade() or "—"
    is_fail = mark.is_arrear()
    color = "#dc2626" if is_fail else "#059669"
    result_text = "FAIL — Arrear Recorded" if is_fail else "PASS"

    def score_row(label, value, max_marks):
        val = value if value is not None else "—"
        return f"<tr><td style='padding:8px;border:1px solid #e2e8f0;'>{label}</td><td style='padding:8px;border:1px solid #e2e8f0;text-align:center;'>{val}</td><td style='padding:8px;border:1px solid #e2e8f0;text-align:center;color:#94a3b8;'>{max_marks}</td></tr>"

    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Marks Report — {subject_name}</h2>
        <p>Dear {student_name},</p>
        <p>Your marks for <strong>{subject_name} ({subject_code})</strong> have been published by your lecturer.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#f1f5f9;">
                <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Component</th>
                <th style="padding:8px;border:1px solid #e2e8f0;text-align:center;">Score</th>
                <th style="padding:8px;border:1px solid #e2e8f0;text-align:center;">Max</th>
            </tr>
            {score_row("CLA 1", mark.cla1_score, 15)}
            {score_row("CLA 2", mark.cla2_score, 15)}
            {score_row("CLA 3", mark.cla3_score, 15)}
            {score_row("Model Examination", mark.model_score, 40)}
            <tr style="background:#f8fafc;font-weight:bold;">
                <td style="padding:8px;border:1px solid #e2e8f0;">Total</td>
                <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:{color};">{mark.total if mark.total is not None else '—'}</td>
                <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#94a3b8;">85</td>
            </tr>
        </table>
        <p>Grade: <strong>{grade}</strong> &nbsp;|&nbsp; Result: <strong style="color:{color};">{result_text}</strong></p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
        <p style="color:#94a3b8;font-size:12px;">Academic Monitoring System — Automated Alert</p>
    </body>
    </html>
    """