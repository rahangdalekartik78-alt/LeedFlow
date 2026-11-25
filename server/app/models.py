"""User and Lead ORM models plus enums."""
import enum
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class LeadSource(str, enum.Enum):
    website = "Website"
    referral = "Referral"
    linkedin = "LinkedIn"
    cold_call = "Cold Call"
    email_campaign = "Email Campaign"
    event = "Event"
    other = "Other"


class LeadStatus(str, enum.Enum):
    new = "New"
    contacted = "Contacted"
    interested = "Interested"
    converted = "Converted"
    lost = "Lost"


def _enum(e: type[enum.Enum], name: str) -> Enum:
    return Enum(e, name=name, values_callable=lambda x: [i.value for i in x])


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = (
        UniqueConstraint("owner_id", "email", name="uq_owner_email"),
        Index("ix_owner_status_created", "owner_id", "status", "created_at"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(20))
    company: Mapped[str] = mapped_column(String(120))
    source: Mapped[LeadSource] = mapped_column(_enum(LeadSource, "lead_source"))
    status: Mapped[LeadStatus] = mapped_column(_enum(LeadStatus, "lead_status"), default=LeadStatus.new)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now(), nullable=True)
