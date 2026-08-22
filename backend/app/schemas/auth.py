from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: Optional[str] = "CUSTOMER"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class FirebaseSocialLogin(BaseModel):
    email: EmailStr
    full_name: Optional[str] = "Lumina User"
    photo_url: Optional[str] = None
    role: Optional[str] = "CUSTOMER"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime
