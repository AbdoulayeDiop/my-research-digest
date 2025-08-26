import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()

def send_email(subject, body, to_email, is_html=False):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    sender_name = os.getenv("SENDER_NAME", "")

    msg = MIMEText(body, 'html' if is_html else 'plain')
    msg['Subject'] = subject
    msg['From'] = f"{sender_name} <{smtp_user}>"
    msg['To'] = to_email

    try:
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as smtp:
            smtp.login(smtp_user, smtp_pass)
            smtp.send_message(msg)
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Error sending email: {e}")

if __name__ == "__main__":
    send_email("Test Subject", "This is a test email body.", "recipient@example.com")