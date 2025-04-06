from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.user import User
from app.api.v1.schemas.user import UserCreate, UserUpdate
from lib.logger import get_logger
import bcrypt

logger = get_logger("user_repository", console_output=False)

class DuplicateKeyError(Exception):
    pass

def get_password_hash(password: str) -> str:
    """Hash a password for storage."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode(), salt).decode()
    return hashed

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).order_by(User.id).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    try:
        # Check if user already exists
        existing_email = get_user_by_email(db, user.email)
        if existing_email:
            raise DuplicateKeyError(f"User with email {user.email} already exists")
        
        existing_username = get_user_by_username(db, user.username)
        if existing_username:
            raise DuplicateKeyError(f"User with username {user.username} already exists")
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise DuplicateKeyError("User already exists")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {str(e)}")
        raise

def update_user(db: Session, user_id: int, user_data: UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    # Update user fields
    for key, value in user_data.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True