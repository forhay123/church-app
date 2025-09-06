# app/services/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings  # loads from .env


def send_email(to_email: str, subject: str, body: str):
    """Low-level SMTP sender (HTML supported)."""
    msg = MIMEMultipart()
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.send_message(msg)
