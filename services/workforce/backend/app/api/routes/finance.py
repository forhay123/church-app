from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, time
from sqlalchemy import Date, cast
from decimal import Decimal
from app.db.session import get_db
from app.models.finance import Finance
from app.models.user import User
from app.core.roles import Role
from app.schemas.finance import FinanceCreate, FinanceUpdate, FinanceOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/finances", tags=["Finances"])

# ---------------- CREATE ----------------
@router.post("/", response_model=FinanceOut)
def create_finance(
    finance_in: FinanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != Role.HEAD_A:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HEAD_A can create finance records"
        )

    if current_user.church_id != finance_in.church_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create finance records for your own church"
        )

    finance = Finance(**finance_in.dict(), created_by_id=current_user.id, confirmed=False)
    db.add(finance)
    db.commit()
    db.refresh(finance)
    return finance

# ---------------- READ ALL ----------------
@router.get("/", response_model=List[FinanceOut])
def get_all_finances(
    date: Optional[date] = None,
    church_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Finance)

    if current_user.role in [Role.ADMIN, Role.LEAD_PASTOR]:
        # ADMIN and LEAD_PASTOR can filter by any church
        if church_id:
            query = query.filter(Finance.church_id == church_id)
    elif current_user.role == Role.HEAD_A:
        # HEAD_A is restricted to their own church
        query = query.filter(Finance.church_id == current_user.church_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view finance records"
        )
    
    # Filter by date if provided
    if date:
        # Filter for records on that exact day
        start_of_day = datetime.combine(date, time.min)
        end_of_day = datetime.combine(date, time.max)
        query = query.filter(Finance.service_date.between(start_of_day, end_of_day))

    return query.all()

# ---------------- SUMMARY ----------------
@router.get("/summary")
def finance_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    church_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [Role.ADMIN, Role.LEAD_PASTOR, Role.HEAD_A]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view financial summary"
        )

    query = db.query(Finance)

    if current_user.role == Role.HEAD_A:
        query = query.filter(Finance.church_id == current_user.church_id)
    
    # Corrected date filtering logic
    if start_date and end_date:
        query = query.filter(cast(Finance.service_date, Date) >= start_date)
        query = query.filter(cast(Finance.service_date, Date) <= end_date)
    elif start_date:
        # If only start_date is provided, filter for records on that exact day
        # We check between the start of the day (00:00:00) and the end of the day (23:59:59)
        start_of_day = datetime.combine(start_date, time.min)
        end_of_day = datetime.combine(start_date, time.max)
        query = query.filter(Finance.service_date.between(start_of_day, end_of_day))

    if current_user.role in [Role.ADMIN, Role.LEAD_PASTOR] and church_id:
        query = query.filter(Finance.church_id == church_id)

    finances = query.all()

    # ... (rest of your existing logic for calculating summary)
    total_offerings = sum(float(f.offerings or 0) for f in finances)
    total_partnership = sum(float(f.partnership_offering or 0) for f in finances)
    total_extra = {}
    net_extra = 0.0
    church_extra_details = {}
    church_offerings_summary = {}
    church_partnerships_summary = {}

    for f in finances:
        church_name = f.church.name if f.church else f"Church {f.church_id}"

        church_offerings_summary[f.church_id] = {
            "church_name": church_name,
            "offerings": church_offerings_summary.get(f.church_id, {}).get("offerings", 0) + float(f.offerings or 0)
        }
        
        church_partnerships_summary[f.church_id] = {
            "church_name": church_name,
            "partnership": church_partnerships_summary.get(f.church_id, {}).get("partnership", 0) + float(f.partnership_offering or 0)
        }

        if f.church_id not in church_extra_details:
            church_extra_details[f.church_id] = {
                "church_name": church_name,
                "extra_details": {}
            }
        
        for key, detail in (f.extra_details or {}).items():
            value = float(detail.get("value", 0))
            type_ = detail.get("type", "None")
            signed_value = value if type_ != "Debit" else -value
            
            total_extra[key] = total_extra.get(key, 0) + signed_value
            net_extra += signed_value
            
            church_details = church_extra_details[f.church_id]["extra_details"]
            church_details[key] = church_details.get(key, 0) + signed_value

    net_income = total_offerings + total_partnership + net_extra

    return {
        "total_offerings": total_offerings,
        "total_partnership": total_partnership,
        "total_extra_details": total_extra,
        "net_income": net_income,
        "number_of_records": len(finances),
        "church_offerings": list(church_offerings_summary.values()),
        "church_partnerships": list(church_partnerships_summary.values()),
        "church_extra_details": list(church_extra_details.values())
    }
    

# ---------------- READ ONE ----------------
@router.get("/{finance_id}", response_model=FinanceOut)
def get_finance(
    finance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finance = db.query(Finance).filter(Finance.id == finance_id).first()
    if not finance:
        raise HTTPException(status_code=404, detail="Finance record not found")

    if current_user.role in [Role.ADMIN, Role.LEAD_PASTOR]:
        return finance
    elif current_user.role == Role.HEAD_A and finance.church_id == current_user.church_id:
        return finance
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this finance record"
        )

# ---------------- UPDATE ----------------
@router.put("/{finance_id}", response_model=FinanceOut)
def update_finance(
    finance_id: int,
    finance_update: FinanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finance = db.query(Finance).filter(Finance.id == finance_id).first()
    if not finance:
        raise HTTPException(status_code=404, detail="Finance record not found")

    if finance.confirmed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This record has been confirmed and can no longer be edited"
        )

    if current_user.role != Role.HEAD_A or finance.church_id != current_user.church_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this finance record"
        )

    update_data = finance_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(finance, key, value)

    db.commit()
    db.refresh(finance)
    return finance

# ---------------- DELETE ----------------
@router.delete("/{finance_id}")
def delete_finance(
    finance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finance = db.query(Finance).filter(Finance.id == finance_id).first()
    if not finance:
        raise HTTPException(status_code=404, detail="Finance record not found")

    if finance.confirmed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This record has been confirmed and cannot be deleted"
        )

    if current_user.role != Role.HEAD_A or finance.church_id != current_user.church_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this finance record"
        )

    db.delete(finance)
    db.commit()
    return {"detail": "Finance record deleted successfully"}

# ---------------- CONFIRM (ADMIN ONLY) ----------------
@router.post("/{finance_id}/confirm", response_model=FinanceOut)
def confirm_finance(
    finance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ADMIN can confirm finance records"
        )

    finance = db.query(Finance).filter(Finance.id == finance_id).first()
    if not finance:
        raise HTTPException(status_code=404, detail="Finance record not found")

    finance.confirmed = True
    db.commit()
    db.refresh(finance)
    return finance
