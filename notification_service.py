"""Provider adapters for production alert delivery.

Configure SMTP_* and ALERT_WEBHOOK_URL in deployment secrets. SMS and push
providers can be added behind the same interface without changing alert rules.
"""
import json
import os
import smtplib
import urllib.request
from dataclasses import dataclass
from email.message import EmailMessage


@dataclass
class DeliveryResult:
    channel: str
    delivered: bool
    detail: str


def send_email(recipient: str, subject: str, message: str) -> DeliveryResult:
    host = os.getenv('SMTP_HOST')
    if not host:
        return DeliveryResult('email', False, 'SMTP_HOST is not configured')
    email = EmailMessage()
    email['From'] = os.getenv('SMTP_FROM', 'alerts@land-acquisition.gov')
    email['To'] = recipient
    email['Subject'] = subject
    email.set_content(message)
    with smtplib.SMTP(host, int(os.getenv('SMTP_PORT', '587')), timeout=10) as server:
        server.starttls()
        server.login(os.environ['SMTP_USERNAME'], os.environ['SMTP_PASSWORD'])
        server.send_message(email)
    return DeliveryResult('email', True, 'SMTP delivery accepted')


def send_webhook(payload: dict) -> DeliveryResult:
    endpoint = os.getenv('ALERT_WEBHOOK_URL')
    if not endpoint:
        return DeliveryResult('webhook', False, 'ALERT_WEBHOOK_URL is not configured')
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return DeliveryResult('webhook', 200 <= response.status < 300, f'HTTP {response.status}')


def dispatch_alert(alert: dict, recipients: list[dict]) -> list[DeliveryResult]:
    results = []
    for recipient in recipients:
        if recipient.get('email'):
            results.append(send_email(recipient['email'], alert['title'], alert['message']))
        if recipient.get('webhook', False):
            results.append(send_webhook(alert))
    return results
