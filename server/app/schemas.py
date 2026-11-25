"""Pydantic request/response schemas."""
import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from .models import LeadSource, LeadStatus


def _strip(v):
    return v.strip() if isinstance(v, str) else v


def _lower(v):
    return v.lower() if isinstance(v, str) else v


def _phone(v):
    """Allow an optional +country code (1-3 digits) followed by exactly 10 digits."""
    if v is None:
        return v
    cleaned = re.sub(r"[\s\-()]", "", v)
    if not re.fullmatch(r"(\+\d{1,3})?\d{10}", cleaned):
        raise ValueError("Phone must be 10 digits, optionally with a country code (e.g. +91 9876543210)")
    return v


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    _strip = field_validator("name", "email", mode="before")(_strip)
    _lower = field_validator("email")(_lower)

    @field_validator("password")
    @classmethod
    def strength(cls, v: str) -> str:
        if not (re.search(r"[A-Za-z]", v) and re.search(r"\d", v)):
            raise ValueError("Password must contain at least one letter and one number")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    _lower = field_validator("email")(_lower)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str


class LeadCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str
    company: str = Field(min_length=1, max_length=120)
    source: LeadSource
    status: LeadStatus = LeadStatus.new
    notes: Optional[str] = Field(default=None, max_length=1000)

    _strip = field_validator("full_name", "email", "phone", "company", "notes", mode="before")(_strip)
    _lower = field_validator("email")(_lower)
    _phone = field_validator("phone")(_phone)


class LeadUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = Field(default=None, min_length=1, max_length=120)
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    notes: Optional[str] = Field(default=None, max_length=1000)

    _strip = field_validator("full_name", "email", "phone", "company", "notes", mode="before")(_strip)
    _lower = field_validator("email")(_lower)
    _phone = field_validator("phone")(_phone)

    @model_validator(mode="after")
    def at_least_one(self):
        if not self.model_fields_set:
            raise ValueError("At least one field is required")
        return self


class StatusUpdate(BaseModel):
    status: LeadStatus


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str
    phone: str
    company: str
    source: LeadSource
    status: LeadStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
