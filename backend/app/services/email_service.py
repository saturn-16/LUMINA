import io
import os
import logging
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from typing import List, Optional, Dict, Any
from pathlib import Path

from backend.app.core.config import settings

logger = logging.getLogger("email_service")
logging.basicConfig(level=logging.INFO)

# Ensure local debug emails directory exists
EMAILS_DIR = Path("./backend/emails_sent")
EMAILS_DIR.mkdir(parents=True, exist_ok=True)


class EmailService:
    @staticmethod
    def _send_smtp_sync(
        to_email: str,
        subject: str,
        html_content: str,
        qr_png_bytes: Optional[bytes] = None,
        booking_reference: Optional[str] = None,
    ):
        """
        Send an email via SMTP (e.g. Gmail) or save to local delivery folder in dev mode.
        Supports both inline CID embedded QR images and standalone HTML payloads.
        """
        # Always persist a local copy for instant testing/preview
        try:
            ref_slug = booking_reference or "notification"
            preview_file = EMAILS_DIR / f"{ref_slug}.html"
            with open(preview_file, "w", encoding="utf-8") as f:
                f.write(html_content)
            logger.info(f"[EMAIL ARCHIVE] Saved local copy to {preview_file.resolve()}")
        except Exception as err:
            logger.warning(f"Could not save local email preview: {err}")

        # Check for Resend API delivery first (modern, free 3,000 emails/mo)
        resend_api_key = (getattr(settings, "RESEND_API_KEY", "") or os.getenv("RESEND_API_KEY", "")).strip()
        smtp_from_name = settings.SMTP_FROM_NAME or os.getenv("SMTP_FROM_NAME", "Lumina Live Experiences")
        
        if resend_api_key:
            try:
                import json
                import urllib.request
                import urllib.error

                import base64

                from_sender = os.getenv("RESEND_FROM_EMAIL", "Lumina Tickets <onboarding@resend.dev>")
                resend_payload = {
                    "from": from_sender,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                }
                if qr_png_bytes:
                    clean_ref = (booking_reference or "admission").replace("#", "").strip()
                    resend_payload["attachments"] = [
                        {
                            "filename": f"{clean_ref}_entry_qr.png",
                            "content": list(qr_png_bytes) if isinstance(qr_png_bytes, (list, tuple)) else [b for b in qr_png_bytes],
                        }
                    ]
                req = urllib.request.Request(
                    "https://api.resend.com/emails",
                    data=json.dumps(resend_payload).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {resend_api_key}",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Lumina/1.0",
                    },
                )
                res = urllib.request.urlopen(req, timeout=10)
                logger.info(f"✓ Real ticket passcard delivered via Resend API to: {to_email} (HTTP {res.status})")
                return
            except Exception as e:
                err_info = str(e)
                if hasattr(e, "read"):
                    try:
                        err_info += f" -> {e.read().decode('utf-8')}"
                    except Exception:
                        pass
                logger.error(f"Resend delivery attempt failed: {err_info}. Checking SMTP fallback...")

        # Check if SMTP (e.g. Gmail) is configured
        smtp_host = settings.SMTP_HOST or os.getenv("SMTP_HOST", "")
        smtp_user = settings.SMTP_USER or os.getenv("SMTP_USER", "")
        smtp_password = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", "")
        smtp_port = int(settings.SMTP_PORT or os.getenv("SMTP_PORT", 587))
        smtp_from = settings.SMTP_FROM_EMAIL or os.getenv("SMTP_FROM_EMAIL", smtp_user or "tickets@lumina.live")
        smtp_tls = settings.SMTP_TLS

        if not smtp_host or not smtp_user or not smtp_password:
            logger.info("=" * 60)
            logger.info(f"[EMAIL NOTIFICATION DISPATCHED]")
            logger.info(f"Recipient: {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Status: Ticket & QR generated and archived in database & local storage.")
            logger.info(f"Notice: To receive live Gmail emails, add SMTP_USER & SMTP_PASSWORD (or RESEND_API_KEY) in Render Environment Variables.")
            logger.info("=" * 60)
            return

        try:
            msg = MIMEMultipart("related")
            msg["Subject"] = subject
            msg["From"] = f"{smtp_from_name} <{smtp_from}>"
            msg["To"] = to_email

            # Alternative container for HTML
            msg_alt = MIMEMultipart("alternative")
            msg.attach(msg_alt)

            html_part = MIMEText(html_content, "html", "utf-8")
            msg_alt.attach(html_part)

            # Attach inline QR code if available
            if qr_png_bytes:
                img_part = MIMEImage(qr_png_bytes, "png")
                img_part.add_header("Content-ID", "<ticketqr>")
                img_part.add_header("Content-Disposition", "inline", filename="entry_qr.png")
                msg.attach(img_part)

            if smtp_port == 465:
                # SSL
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
            else:
                # STARTTLS (e.g. Gmail port 587)
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
                if smtp_tls:
                    server.starttls()

            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)

            server.sendmail(smtp_from, [to_email], msg.as_string())
            server.quit()
            logger.info(f"✓ Real email successfully delivered to registered address: {to_email} via {smtp_host}")
        except Exception as e:
            logger.error(f"Failed to deliver SMTP email to {to_email}: {str(e)}")

    @classmethod
    def _send_async(cls, *args, **kwargs):
        """Run SMTP delivery in a background thread to prevent latency on API response."""
        thread = threading.Thread(target=cls._send_smtp_sync, args=args, kwargs=kwargs, daemon=True)
        thread.start()

    @classmethod
    def send_booking_confirmation(
        cls,
        to_email: str,
        customer_name: str,
        booking_reference: str,
        event_title: str,
        venue_name: str,
        show_time_str: str,
        seats_str: str,
        total_amount: float,
        qr_code_data_uri: str,
        qr_png_bytes: Optional[bytes] = None,
    ):
        """Send high-contrast cinematic Lumina ticket confirmation email with scannable QR code."""
        subject = f"Your Tickets: {event_title} [Ref: {booking_reference}]"

        # Format INR currency
        formatted_price = f"₹{round(total_amount):,}" if total_amount >= 0 else "₹0"

        # Universal HTTPS QR code URL that renders natively in Gmail, Outlook, Apple Mail
        import urllib.parse
        clean_ref = (booking_reference or "PASS").replace("#", "").strip()
        encoded_data = urllib.parse.quote(f"LUMINA-PASS|{clean_ref}|{event_title}")
        qr_src = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data={encoded_data}"

        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Lumina Ticket Passcard</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #050505;
            color: #ffffff;
            margin: 0;
            padding: 24px 12px;
            -webkit-font-smoothing: antialiased;
        }}
        .container {{
            max-width: 580px;
            margin: 0 auto;
            background-color: #0c0c0e;
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
        }}
        .header {{
            background: linear-gradient(180deg, #18181b 0%, #0c0c0e 100%);
            padding: 32px 28px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            text-align: center;
        }}
        .badge {{
            display: inline-block;
            background-color: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            padding: 4px 12px;
            margin-bottom: 12px;
        }}
        .title {{
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin: 0 0 6px;
            color: #ffffff;
        }}
        .ref {{
            font-family: monospace;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            margin: 0;
        }}
        .body {{
            padding: 28px;
        }}
        .greeting {{
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            margin-top: 0;
            margin-bottom: 20px;
            line-height: 1.5;
        }}
        .ticket-details {{
            background-color: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 18px 20px;
            margin-bottom: 24px;
        }}
        .row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 9px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            font-size: 13px;
        }}
        .row:last-child {{
            border-bottom: none;
            padding-bottom: 0;
        }}
        .row:first-child {{
            padding-top: 0;
        }}
        .label {{
            color: rgba(255, 255, 255, 0.45);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .value {{
            font-weight: 600;
            color: #ffffff;
            text-align: right;
        }}
        .price-value {{
            font-size: 16px;
            font-weight: 700;
            color: #34d399;
        }}
        .qr-card {{
            background-color: #ffffff;
            border-radius: 18px;
            padding: 24px;
            text-align: center;
            margin-bottom: 24px;
        }}
        .qr-title {{
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #09090b;
            margin: 0 0 4px;
        }}
        .qr-subtitle {{
            font-size: 11px;
            color: #71717a;
            margin: 0 0 16px;
        }}
        .qr-image {{
            width: 180px;
            height: 180px;
            display: block;
            margin: 0 auto;
            border-radius: 8px;
        }}
        .footer {{
            padding: 20px 28px;
            background-color: rgba(0, 0, 0, 0.4);
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            text-align: center;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.4);
            line-height: 1.6;
        }}
        .footer a {{
            color: rgba(255, 255, 255, 0.7);
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="badge">● Confirmed Pass</div>
            <h1 class="title">{event_title}</h1>
            <p class="ref">Booking Ref: #{booking_reference}</p>
        </div>

        <div class="body">
            <p class="greeting">
                Hello <strong>{customer_name}</strong>,<br>
                Your reservation has been confirmed. Below is your official digital admission passcard.
            </p>

            <div class="ticket-details">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.45); letter-spacing: 1px;">Event</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #ffffff; text-align: right;">{event_title}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.45); letter-spacing: 1px;">Venue</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #ffffff; text-align: right;">{venue_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.45); letter-spacing: 1px;">Showtime</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #ffffff; text-align: right;">{show_time_str}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.45); letter-spacing: 1px;">Reserved Seats</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #ffffff; text-align: right;">{seats_str}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.45); letter-spacing: 1px;">Total Amount</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #34d399; text-align: right;">{formatted_price}</td>
                    </tr>
                </table>
            </div>

            <div class="qr-card">
                <div class="qr-title">Admission QR Code</div>
                <div class="qr-subtitle">Scan at venue turnstile or box office for entry</div>
                <img src="{qr_src}" alt="Admission QR Pass" width="200" height="200" style="display:block; margin: 16px auto; width: 200px; height: 200px; border-radius: 8px; border: 1px solid #e4e4e7;" />
                <p style="margin: 12px 0 0; font-family: monospace; font-size: 12px; color: #09090b; font-weight: bold;">
                    #{booking_reference}
                </p>
            </div>
        </div>

        <div class="footer">
            Present this email or the passcard in your <a href="{settings.FRONTEND_URL}/dashboard">Lumina Digital Wallet</a> upon arrival.<br>
            © {event_title} • Lumina Ticket Engine
        </div>
    </div>
</body>
</html>"""

        cls._send_async(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            qr_png_bytes=qr_png_bytes,
            booking_reference=booking_reference,
        )

    @classmethod
    def send_waitlist_offer(
        cls,
        to_email: str,
        customer_name: str,
        event_title: str,
        venue_name: str,
        show_time_str: str,
        seat_desc: str,
        price: float,
        claim_url: str,
        expiry_minutes: int = 10,
    ):
        """Send time-limited waitlist offer email."""
        subject = f"⚡ Good News! A seat opened up for {event_title}"
        formatted_price = f"₹{round(price):,}" if price >= 0 else "₹0"

        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Seat Available from Waitlist</title>
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 20px; }}
        .card {{ background-color: #121214; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); max-width: 560px; margin: 0 auto; padding: 28px; }}
        .btn {{ display: inline-block; background-color: #ffffff; color: #000000 !important; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; margin-top: 20px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }}
        .warning {{ background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #fbbf24; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="card">
        <h2 style="color: #ffffff; margin-top:0;">⚡ Seat Available from Waitlist!</h2>
        <p style="color: rgba(255,255,255,0.8); font-size: 14px;">Hi <strong>{customer_name}</strong>,</p>
        <p style="color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.5;">
            A seat in your requested category has opened up due to a cancellation for <strong>{event_title}</strong>.
        </p>
        
        <div style="background-color: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; margin: 16px 0; font-size: 13px;">
            <p style="margin: 4px 0; color: #ffffff;"><strong>Venue:</strong> {venue_name}</p>
            <p style="margin: 4px 0; color: #ffffff;"><strong>Showtime:</strong> {show_time_str}</p>
            <p style="margin: 4px 0; color: #ffffff;"><strong>Seat:</strong> {seat_desc}</p>
            <p style="margin: 4px 0; color: #34d399;"><strong>Price:</strong> {formatted_price}</p>
        </div>

        <div class="warning">
            <strong>Time-limited offer:</strong> You have <strong>{expiry_minutes} minutes</strong> to claim this seat. If you do not complete the booking in time, the seat will automatically reallocate to the next person on the queue.
        </div>

        <div style="text-align: center; margin: 24px 0;">
            <a href="{claim_url}" class="btn">Claim & Book Seat Now →</a>
        </div>

        <p style="font-size: 11px; color: rgba(255,255,255,0.4); text-align: center;">Direct Link: {claim_url}</p>
    </div>
</body>
</html>"""
        cls._send_async(to_email=to_email, subject=subject, html_content=html_content)

    @classmethod
    def test_email_delivery(cls, to_email: str) -> Dict[str, Any]:
        """Test delivery pipeline synchronously and return granular diagnostic info."""
        resend_api_key = (getattr(settings, "RESEND_API_KEY", "") or os.getenv("RESEND_API_KEY", "")).strip()
        smtp_host = settings.SMTP_HOST or os.getenv("SMTP_HOST", "")
        smtp_user = settings.SMTP_USER or os.getenv("SMTP_USER", "")
        smtp_password = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", "")

        diagnostics = {
            "target_email": to_email,
            "resend_api_key_configured": bool(resend_api_key),
            "resend_key_preview": (resend_api_key[:6] + "..." + resend_api_key[-4:]) if len(resend_api_key) > 10 else ("Configured" if resend_api_key else "Missing"),
            "smtp_configured": bool(smtp_host and smtp_user and smtp_password),
            "smtp_host": smtp_host or "None",
            "provider_used": None,
            "status": "NOT_CONFIGURED",
            "message": "",
        }

        if resend_api_key:
            try:
                import json
                import urllib.request
                import urllib.error

                from_sender = os.getenv("RESEND_FROM_EMAIL", "Lumina Tickets <onboarding@resend.dev>")
                resend_payload = {
                    "from": from_sender,
                    "to": [to_email],
                    "subject": "⚡ Lumina Ticket Engine Test Email",
                    "html": "<h3>Lumina Ticket Engine Test Email</h3><p>Your Resend API configuration is verified and working!</p>",
                }
                req = urllib.request.Request(
                    "https://api.resend.com/emails",
                    data=json.dumps(resend_payload).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {resend_api_key}",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Lumina/1.0",
                    },
                )
                res = urllib.request.urlopen(req, timeout=10)
                body = res.read().decode("utf-8")
                diagnostics["provider_used"] = "RESEND"
                diagnostics["status"] = "SUCCESS"
                diagnostics["message"] = f"Delivered successfully via Resend API (HTTP {res.status}): {body}"
                return diagnostics
            except urllib.error.HTTPError as he:
                error_body = he.read().decode("utf-8") if hasattr(he, "read") else str(he)
                diagnostics["provider_used"] = "RESEND"
                diagnostics["status"] = "ERROR"
                diagnostics["message"] = f"Resend API error HTTP {he.code}: {error_body}"
                return diagnostics
            except Exception as e:
                diagnostics["provider_used"] = "RESEND"
                diagnostics["status"] = "ERROR"
                diagnostics["message"] = f"Resend connection failed: {str(e)}"
                return diagnostics

        if smtp_host and smtp_user and smtp_password:
            try:
                msg = MIMEText("<p>Lumina SMTP Test Email</p>", "html")
                msg["Subject"] = "⚡ Lumina SMTP Test Email"
                msg["From"] = smtp_user
                msg["To"] = to_email

                server = smtplib.SMTP(smtp_host, int(settings.SMTP_PORT or 587), timeout=12)
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [to_email], msg.as_string())
                server.quit()

                diagnostics["provider_used"] = "SMTP"
                diagnostics["status"] = "SUCCESS"
                diagnostics["message"] = f"Delivered successfully via SMTP {smtp_host}"
                return diagnostics
            except Exception as e:
                diagnostics["provider_used"] = "SMTP"
                diagnostics["status"] = "ERROR"
                diagnostics["message"] = f"SMTP connection error: {str(e)}"
                return diagnostics

        diagnostics["message"] = "No email credentials found. Add RESEND_API_KEY in Render Environment Variables."
        return diagnostics
