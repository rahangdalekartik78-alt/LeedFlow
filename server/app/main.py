"""FastAPI app: CORS, routers, exception handlers, health route, table creation."""
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError
from .config import settings
from .database import Base, engine
from .routers import auth, leads

app = FastAPI(title="LeadFlow CRM API", version="1.0.0")
app.state.limiter = auth.limiter
app.add_middleware(
    CORSMiddleware, allow_origins=[settings.CLIENT_URL], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(leads.router)


def fail(status: int, message: str, errors: list | None = None) -> JSONResponse:
    """Standard error envelope."""
    return JSONResponse({"success": False, "message": message, "errors": errors or []}, status_code=status)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {"success": True, "message": "OK", "data": {"status": "up"}}


@app.exception_handler(HTTPException)
async def http_exc(_: Request, exc: HTTPException):
    return fail(exc.status_code, str(exc.detail))


@app.exception_handler(RequestValidationError)
async def validation_exc(_: Request, exc: RequestValidationError):
    errors = [
        {"field": str(e["loc"][-1]), "message": e["msg"].removeprefix("Value error, ")}
        for e in exc.errors()
    ]
    return fail(422, "Validation failed", errors)


@app.exception_handler(IntegrityError)
async def integrity_exc(_: Request, exc: IntegrityError):
    return fail(409, "A lead with this email already exists", [{"field": "email", "message": "Already exists"}])


app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def unhandled_exc(_: Request, exc: Exception):
    logging.exception("Unhandled error")
    return fail(500, "Internal server error")
