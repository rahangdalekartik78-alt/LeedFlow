"""Seed demo user and 24 leads: python -m app.seed"""
import random
from datetime import datetime, timedelta
from sqlalchemy import delete, select
from .database import Base, SessionLocal, engine
from .models import Lead, LeadSource, LeadStatus, User
from .security import hash_password

NAMES = ["Aarav Mehta", "Priya Nair", "Rohan Desai", "Sneha Kulkarni", "Vikram Singh", "Ananya Iyer",
         "Karan Malhotra", "Neha Gupta", "Arjun Reddy", "Isha Patel", "Rahul Verma", "Divya Joshi",
         "Siddharth Rao", "Meera Shah", "Aditya Kapoor", "Pooja Bansal", "Manish Tiwari", "Kavya Menon",
         "Nikhil Jain", "Tanvi Bhatt", "Sameer Khan", "Riya Sethi", "Harsh Vora", "Ishaan Das"]
COMPANIES = ["Acme Corp", "Nimbus Labs", "Zenith Retail", "BlueOrbit", "Pixel Forge", "GreenLeaf Foods"]


def run() -> None:
    """Idempotently create the demo user and leads."""
    Base.metadata.create_all(bind=engine)
    random.seed(7)
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "demo@leadflow.com"))
        if not user:
            user = User(name="Demo User", email="demo@leadflow.com", hashed_password=hash_password("Demo@1234"))
            db.add(user)
            db.flush()
        db.execute(delete(Lead).where(Lead.owner_id == user.id))
        for i, name in enumerate(NAMES):
            db.add(Lead(
                full_name=name, email=f"{name.split()[0].lower()}{i}@example.com",
                phone=f"+91 98{random.randint(10000000, 99999999)}",
                company=random.choice(COMPANIES), source=random.choice(list(LeadSource)),
                status=random.choice(list(LeadStatus)), notes="Demo lead for walkthrough.",
                owner_id=user.id, created_at=datetime.now() - timedelta(days=random.randint(0, 60)),
            ))
        db.commit()
    print("Seeded demo@leadflow.com / Demo@1234 with 24 leads")


if __name__ == "__main__":
    run()
