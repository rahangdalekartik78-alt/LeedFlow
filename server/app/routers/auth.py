"""Auth routes: register, login, me."""
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserOut
from ..security import create_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


def ok(message: str, data=None, **extra) -> dict:
    """Standard success envelope."""
    return {"success": True, "message": message, "data": data, **extra}


def _session(user: User) -> dict:
    return {"token": create_token(user.id), "user": UserOut.model_validate(user).model_dump()}


@router.post("/register", status_code=201)
@limiter.limit("20/15 minutes")
def register(request: Request, body: UserCreate, db: Session = Depends(get_db)):
    """Create an account and return a JWT."""
    if db.scalar(select(User).where(User.email == body.email)):
        raise HTTPException(409, "Email already registered")
    user = User(name=body.name, email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    return ok("Account created", _session(user))


@router.post("/login")
@limiter.limit("20/15 minutes")
def login(request: Request, body: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and return a JWT."""
    user = db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    return ok("Logged in", _session(user))


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    """Return the current user."""
    return ok("OK", {"user": UserOut.model_validate(user).model_dump()})
