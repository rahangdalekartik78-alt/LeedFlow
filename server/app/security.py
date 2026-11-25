"""Password hashing, JWT helpers and the get_current_user dependency."""
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .models import User

bearer = HTTPBearer(auto_error=False)


def hash_password(pw: str) -> str:
    """Return a bcrypt hash of the password."""
    return bcrypt.hashpw(pw.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    """Check a password against its bcrypt hash."""
    return bcrypt.checkpw(pw.encode()[:72], hashed.encode())


def create_token(user_id: int) -> str:
    """Create an HS256 JWT for the user."""
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.SECRET_KEY, algorithm="HS256")


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> User:
    """Resolve the authenticated user or raise 401."""
    if not creds:
        raise HTTPException(401, "Authentication required")
    try:
        payload = jwt.decode(creds.credentials, settings.SECRET_KEY, algorithms=["HS256"])
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(401, "Invalid or expired token")
    if not user:
        raise HTTPException(401, "User no longer exists")
    return user
