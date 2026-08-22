import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from backend.app.core.config import settings

logger = logging.getLogger("email_service")
logging.basicConfig(level=logging.INFO)


class EmailService:
    @staticmethod
    def _send_smtp(to_email: str, subject: str, html_content: str):
        """Send an email using configured SMTP settings."""
        if not settings.SMTP_HOST:
            # Dev mode fallback: log email to stdout
            logger.info("=" * 60)
            logger.info(f"[DEV EMAIL LOG] To: {to_email}")
            logger.info(f"[DEV EMAIL LOG] Subject: {subject}")
            logger.info(f"[DEV EMAIL LOG] Body Preview:\n{html_content[:300]}...")
            logger.info("=" * 60)
            return

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            server.quit()
            logger.info(f"Email successfully delivered to {to_email} via SMTP")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")

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
    ):
        """Send booking confirmation ticket email with QR code."""
        subject = f"Your Tickets for {event_title} [Ref: {booking_reference}]"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
                .ticket-card {{ background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
                .header {{ background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center; }}
                .content {{ padding: 24px; }}
                .row {{ display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }}
                .label {{ font-size: 14px; color: #64748b; }}
                .value {{ font-size: 14px; font-weight: bold; color: #0f172a; }}
                .qr-section {{ text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px dashed #cbd5e1; }}
                .qr-img {{ max-width: 200px; height: auto; margin: 12px auto; }}
                .footer {{ text-align: center; font-size: 12px; color: #94a3b8; padding: 16px; background-color: #f8fafc; }}
            </style>
        </head>
        <body>
            <div class="ticket-card">
                <div class="header">
                    <h2 style="margin:0;">Booking Confirmed!</h2>
                    <p style="margin:4px 0 0 0; font-size: 14px; opacity: 0.8;">Ref: {booking_reference}</p>
                </div>
                <div class="content">
                    <p>Hi <strong>{customer_name}</strong>,</p>
                    <p>Thank you for booking with us. Here are your ticket details:</p>
                    
                    <div class="row"><span class="label">Event:</span><span class="value">{event_title}</span></div>
                    <div class="row"><span class="label">Venue:</span><span class="value">{venue_name}</span></div>
                    <div class="row"><span class="label">Showtime:</span><span class="value">{show_time_str}</span></div>
                    <div class="row"><span class="label">Seats:</span><span class="value">{seats_str}</span></div>
                    <div class="row"><span class="label">Total Paid:</span><span class="value">${total_amount:.2f}</span></div>

                    <div class="qr-section">
                        <p style="font-size:14px; font-weight:bold; margin-bottom: 4px;">Entry QR Code</p>
                        <p style="font-size:12px; color:#64748b; margin-top:0;">Scan this at the venue gate</p>
                        <img src="{qr_code_data_uri}" alt="Ticket QR Code" class="qr-img" />
                    </div>
                </div>
                <div class="footer">
                    Present this email or QR code at entry. Enjoy your show!
                </div>
            </div>
        </body>
        </html>
        """
        cls._send_smtp(to_email, subject, html_content)

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
        subject = f"Good News! A seat opened up for {event_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
                .card {{ background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
                .btn {{ display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px; }}
                .warning {{ background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; font-size: 14px; color: #991b1b; }}
            </style>
        </head>
        <body>
            <div class="card">
                <h2 style="color: #0f172a; margin-top:0;">Seat Available from Waitlist!</h2>
                <p>Hi <strong>{customer_name}</strong>,</p>
                <p>A seat in your requested category has opened up due to a cancellation for <strong>{event_title}</strong>.</p>
                
                <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                    <p style="margin: 4px 0;"><strong>Venue:</strong> {venue_name}</p>
                    <p style="margin: 4px 0;"><strong>Showtime:</strong> {show_time_str}</p>
                    <p style="margin: 4px 0;"><strong>Seat:</strong> {seat_desc}</p>
                    <p style="margin: 4px 0;"><strong>Price:</strong> ${price:.2f}</p>
                </div>

                <div class="warning">
                    <strong>Time-limited offer:</strong> You have <strong>{expiry_minutes} minutes</strong> to claim this seat. If you do not complete the booking in time, the seat will be automatically offered to the next person on the waitlist.
                </div>

                <div style="text-align: center; margin: 24px 0;">
                    <a href="{claim_url}" class="btn" style="color: #ffffff !important;">Claim & Book Seat Now</a>
                </div>

                <p style="font-size: 12px; color: #64748b;">Or copy this link to your browser: {claim_url}</p>
            </div>
        </body>
        </html>
        """
        cls._send_smtp(to_email, subject, html_content)
