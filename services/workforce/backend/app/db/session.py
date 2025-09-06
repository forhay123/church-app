# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base import Base  # ✅ import the shared Base

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, future=True, echo=False)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
