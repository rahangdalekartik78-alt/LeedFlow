"""SQLAlchemy engine, session factory, Base and get_db dependency."""
from typing import Iterator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from .config import settings

args = {"check_same_thread": False} if settings.db_url.startswith("sqlite") else {}
engine = create_engine(settings.db_url, connect_args=args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
