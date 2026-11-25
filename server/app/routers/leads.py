"""Lead routes: CRUD, status patch, stats. All scoped to the current user."""
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Lead, LeadSource, LeadStatus, User
from ..schemas import LeadCreate, LeadOut, LeadUpdate, StatusUpdate
from ..security import get_current_user
from .auth import ok

router = APIRouter(prefix="/api/leads", tags=["leads"])
SORTABLE = {"created_at", "full_name", "company", "status"}


def _own(db: Session, user: User, lead_id: int) -> Lead:
    lead = db.scalar(select(Lead).where(Lead.id == lead_id, Lead.owner_id == user.id))
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead


def _out(lead: Lead) -> dict:
    return LeadOut.model_validate(lead).model_dump(mode="json")


@router.get("/stats")
def stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Counts per status using a single GROUP BY query."""
    rows = db.execute(
        select(Lead.status, func.count()).where(Lead.owner_id == user.id).group_by(Lead.status)
    ).all()
    data = {s.name: 0 for s in LeadStatus}
    for status, count in rows:
        data[status.name] = count
    data["total"] = sum(data.values())
    return ok("OK", data)


@router.get("")
def list_leads(
    search: str = "",
    status: Optional[LeadStatus] = None,
    source: Optional[LeadSource] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str = "created_at",
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Paginated, filterable, sortable list."""
    if sort_by not in SORTABLE:
        raise HTTPException(400, f"sort_by must be one of {sorted(SORTABLE)}")
    q = select(Lead).where(Lead.owner_id == user.id)
    if search.strip():
        like = f"%{search.strip()}%"
        q = q.where(or_(Lead.full_name.ilike(like), Lead.email.ilike(like), Lead.company.ilike(like)))
    if status:
        q = q.where(Lead.status == status)
    if source:
        q = q.where(Lead.source == source)
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    col = getattr(Lead, sort_by)
    q = q.order_by(col.asc() if order == "asc" else col.desc(), Lead.id.desc())
    items = db.scalars(q.offset((page - 1) * limit).limit(limit)).all()
    meta = {"page": page, "limit": limit, "total": total, "total_pages": math.ceil(total / limit)}
    return ok("OK", [_out(i) for i in items], meta=meta)


@router.post("", status_code=201)
def create_lead(body: LeadCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Create a lead owned by the current user."""
    lead = Lead(**body.model_dump(), owner_id=user.id)
    db.add(lead)
    db.commit()
    return ok("Lead created", _out(lead))


@router.get("/{lead_id}")
def get_lead(lead_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Fetch one lead."""
    return ok("OK", _out(_own(db, user, lead_id)))


@router.put("/{lead_id}")
def update_lead(lead_id: int, body: LeadUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Partially update a lead."""
    lead = _own(db, user, lead_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(lead, k, v)
    db.commit()
    return ok("Lead updated", _out(lead))


@router.patch("/{lead_id}/status")
def update_status(lead_id: int, body: StatusUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Change only the status."""
    lead = _own(db, user, lead_id)
    lead.status = body.status
    db.commit()
    return ok("Status updated", _out(lead))


@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete a lead."""
    db.delete(_own(db, user, lead_id))
    db.commit()
    return ok("Lead deleted")
