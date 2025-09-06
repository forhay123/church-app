from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class ContentType(str, enum.Enum):
    text = "TEXT"
    pdf = "PDF"
    image = "Image"
    video = "Video"
    poll = "Poll"


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    content_type = Column(Enum(ContentType))
    content_url = Column(String, nullable=True)
    text = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", back_populates="messages_sent")
    
    # Define the one-to-many relationship to MessageRecipient
    receiver_roles = relationship(
        "MessageRecipient",
        back_populates="message",
        cascade="all, delete-orphan",
    )
    responses = relationship(
        "MessageResponse", 
        back_populates="message", 
        cascade="all, delete-orphan"
    )


class MessageRecipient(Base):
    __tablename__ = "message_recipients"

    message_id = Column(Integer, ForeignKey("messages.id"), primary_key=True)
    receiver_role = Column(String, primary_key=True, index=True)

    # Add a relationship back to Message
    message = relationship("Message", back_populates="receiver_roles")


class MessageResponse(Base):
    __tablename__ = "message_responses"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    responder_id = Column(Integer, ForeignKey("users.id"))
    acknowledged = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    text = Column(String, nullable=True)

    message = relationship("Message", back_populates="responses")
    responder = relationship("User")

