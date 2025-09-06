# backend/create_admin.py

from app.database import SessionLocal
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

db = SessionLocal()

admin_user = User(
    username="admin",
    full_name="Super Admin",
    hashed_password=get_password_hash("admin123"),  # Change this later
    is_admin=True,
    role="admin"
)

db.add(admin_user)
db.commit()
db.refresh(admin_user)
print(f"✅ Admin user created with username: {admin_user.username}")
