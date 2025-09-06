import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import aliased
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime
import shutil, os

from app.models.user import User
from app.models.message import Message, MessageResponse, ContentType, MessageRecipient
from app.db.session import get_db
from app.api.deps import get_current_user
from app.schemas.message import MessageOut, MessageResponseOut
from app.models.user import Role # Import the Role enum

router = APIRouter(prefix="/messages", tags=["Messages"])

UPLOAD_BASE_DIR = "app/uploads"
os.makedirs(UPLOAD_BASE_DIR, exist_ok=True)

def save_upload_file(upload_file: UploadFile, upload_path: str):
    """Saves an uploaded file to a specified path and returns its URL."""
    os.makedirs(upload_path, exist_ok=True)
    file_ext = upload_file.filename.split(".")[-1]
    filename = f"{int(datetime.utcnow().timestamp())}.{file_ext}"
    file_path = os.path.join(upload_path, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {e}")
    finally:
        upload_file.file.close()

    return f"{upload_path.replace('app', '')}/{filename}"

# ---------------- Send message ----------------
@router.post("/send", response_model=MessageOut)
async def send_message(
    receiver_roles: List[str] = Form(...),
    content_type: ContentType = Form(...),
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    sender: User = Depends(get_current_user)
):
    if content_type not in [ContentType.pdf, ContentType.image, ContentType.video, ContentType.poll, ContentType.text]:
        raise HTTPException(400, "Invalid content type")

    content_url = None
    if file:
        content_url = save_upload_file(file, os.path.join(UPLOAD_BASE_DIR, "messages"))

    message = Message(
        sender_id=sender.id,
        content_type=content_type,
        text=text,
        content_url=content_url
    )
    db.add(message)
    db.flush()

    for role in receiver_roles:
        recipient = MessageRecipient(
            message_id=message.id,
            receiver_role=role
        )
        db.add(recipient)
    
    db.commit()
    db.refresh(message)

    return MessageOut(
        id=message.id,
        sender=sender.name,
        receiver_roles=[r.receiver_role for r in message.receiver_roles],
        content_type=message.content_type,
        text=message.text,
        content_url=message.content_url,
        created_at=message.created_at,
        responses=[]
    )

# ---------------- Upload Picture to Portals ----------------
@router.post("/upload-picture-to-portals")
async def upload_picture_to_portals(
    file: UploadFile = File(...),
    roles: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to perform this action")

    receiver_roles = json.loads(roles)

    content_url = save_upload_file(file, os.path.join(UPLOAD_BASE_DIR, "portals"))

    message = Message(
        sender_id=current_user.id,
        content_type=ContentType.image,
        text="New portal picture",
        content_url=content_url
    )
    db.add(message)
    db.flush()

    for role in receiver_roles:
        recipient = MessageRecipient(
            message_id=message.id,
            receiver_role=role
        )
        db.add(recipient)

    db.commit()
    return {"message": "Picture uploaded and distributed successfully"}

# ---------------- Inbox ----------------
@router.get("/inbox", response_model=List[MessageOut])
def get_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sent_messages_query = db.query(Message).filter(Message.sender_id == current_user.id)
    received_messages_query = db.query(Message).join(Message.receiver_roles).filter(MessageRecipient.receiver_role == current_user.role)

    messages = sent_messages_query.union(received_messages_query).order_by(Message.created_at.desc()).all()
    
    messages_dict = {}
    for m in messages:
        messages_dict[m.id] = m

    return [
        MessageOut(
            id=m.id,
            sender=m.sender.name,
            receiver_roles=[r.receiver_role for r in m.receiver_roles],
            content_type=m.content_type,
            text=m.text,
            content_url=m.content_url,
            created_at=m.created_at,
            responses=[
                MessageResponseOut(
                    responder=r.responder.name,
                    acknowledged=bool(r.acknowledged)
                )
                for r in m.responses
            ]
        )
        for m in messages_dict.values()
    ]

# ---------------- Acknowledge message ----------------
@router.post("/{message_id}/acknowledge", response_model=MessageResponseOut)
def acknowledge_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_recipient = db.query(MessageRecipient).filter(
        MessageRecipient.message_id == message_id,
        MessageRecipient.receiver_role == current_user.role
    ).first()

    if not is_recipient:
        raise HTTPException(403, "You are not a recipient of this message.")

    existing_response = db.query(MessageResponse).filter(
        MessageResponse.message_id == message_id,
        MessageResponse.responder_id == current_user.id
    ).first()

    if existing_response:
        existing_response.acknowledged = 1
        db.commit()
        db.refresh(existing_response)
        return MessageResponseOut(responder=current_user.name, acknowledged=True)

    response = MessageResponse(
        message_id=message_id,
        responder_id=current_user.id,
        acknowledged=1
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return MessageResponseOut(responder=current_user.name, acknowledged=True)

# ---------------- Poll / Generic Response ----------------
@router.post("/{message_id}/respond", response_model=MessageResponseOut)
def respond_to_message(
    message_id: int,
    text: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_recipient = db.query(MessageRecipient).filter(
        MessageRecipient.message_id == message_id,
        MessageRecipient.receiver_role == current_user.role
    ).first()

    if not is_recipient:
        raise HTTPException(403, "You are not a recipient of this message.")

    existing_response = db.query(MessageResponse).filter(
        MessageResponse.message_id == message_id,
        MessageResponse.responder_id == current_user.id
    ).first()

    if existing_response:
        existing_response.text = text
        db.commit()
        db.refresh(existing_response)
        return MessageResponseOut(responder=current_user.name, acknowledged=False, text=text)

    response = MessageResponse(
        message_id=message_id,
        responder_id=current_user.id,
        text=text
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return MessageResponseOut(responder=current_user.name, acknowledged=False, text=text)

@router.get("/content-types", response_model=List[str])
def get_content_types():
    return [c.value for c in ContentType]


# New endpoint to fetch images for a specific role (e.g., ADMIN, LEADER)
@router.get("/role-images/{role}", response_model=List[dict])
def get_role_images(
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only allow the current user to fetch images for their own role
    if current_user.role.value.lower() != role.lower():
        raise HTTPException(status_code=403, detail="Not authorized to access this content")

    messages = (
        db.query(Message)
        .join(MessageRecipient)
        .filter(
            MessageRecipient.receiver_role == role,
            Message.content_type == "image",
            Message.content_url.isnot(None)
        )
        .order_by(Message.created_at.desc())
        .all()
    )

    # Return a list of dictionaries with the image URL
    return [{"url": m.content_url} for m in messages]