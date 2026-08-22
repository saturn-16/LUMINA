import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "Ticket Booking System"
    DATABASE_URL: str = "sqlite+aiosqlite:///./ticket_booking.db"
    SYNC_DATABASE_URL: str = "sqlite:///./ticket_booking.db"
    
    SECRET_KEY: str = "development-secret-key-please-change-in-production-min32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Business logic TTL in seconds
    HOLD_TTL_SECONDS: int = 600  # 10 minutes
    WAITLIST_OFFER_TTL_SECONDS: int = 600  # 10 minutes
    EXPIRY_CLEANUP_INTERVAL_SECONDS: int = 15  # worker tick every 15s
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Email settings (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "no-reply@ticketbooking.example.com"
    SMTP_FROM_NAME: str = "Ticket Booking System"
    SMTP_TLS: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
