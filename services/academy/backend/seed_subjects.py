import os
import sys
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# 🔧 Add app/ to Python path so imports work
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

# ✅ Load environment variables
load_dotenv()

# ✅ Import models and database setup
from models import Subject
from database import engine, Base, SessionLocal

# ✅ Create all tables
Base.metadata.create_all(bind=engine)

# ✅ Seeding function
def seed_subjects():
    db: Session = SessionLocal()
    try:
        if db.query(Subject).count() == 0:
            db.add_all([
                Subject(name="maths", level="junior"),
                Subject(name="english", level="junior"),
                Subject(name="social_studies", level="junior"),
                Subject(name="physics", level="senior"),
                Subject(name="chemistry", level="senior"),
                Subject(name="biology", level="senior"),
            ])
            db.commit()
            print("Subjects seeded successfully.")
        else:
            print("Subjects already exist.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_subjects()
