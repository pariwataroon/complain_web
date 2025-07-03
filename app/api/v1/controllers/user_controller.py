import bcrypt
import os
import re   
from uuid import UUID
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime

from app.api.v1.schemas.user import UserCreate, UserUpdate
from lib.logger import get_logger
from models.title import Title
from models.user import User
from models.user_role import UserRole
from models.user_positions import UserPosition
from models.position import Position

logger = get_logger("user_repository", console_output=False)

ENV_VAR_PATTERN = re.compile(r"(\${[^}]+}|\$\w+|#\{ENV\[[^\]]+\]\})")

VERIFY_PATH = os.environ.get("VERIFY_PATH", "http://localhost:8000/api/v1/auth")

class DuplicateKeyError(Exception):
    pass

def sanitize_input_fields(data: dict) -> dict:
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            if ENV_VAR_PATTERN.search(value):
                logger.warning(f"Blocked environment variable-like input: {key} = {value}")
                raise ValueError(f"Environment variable-like pattern found in field '{key}': {value}")
            sanitized[key] = value.strip()
        else:
            sanitized[key] = value
    return sanitized

def get_password_hash(password: str) -> str:
    """Hash a password for storage."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode(), salt).decode()
    return hashed


def get_user(db: Session, user_id: int):
    # เพิ่ม options(joinedload(User.title)) เพื่อโหลดข้อมูล title พร้อมกัน
    return db.query(User).options(joinedload(User.title)).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_pid(db: Session, pid: str):
    return db.query(User).filter(User.citizen_id == pid).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).options(joinedload(User.title)).order_by(User.id).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate, roles: list = None, position_ids: list = None, primary_position_id: UUID = None):
    try:
        create_data = sanitize_input_fields(user.model_dump())

        # ตรวจสอบซ้ำเรื่อง email และ citizen_id ตามปกติ
        existing_email = get_user_by_email(db, user.email)
        if existing_email:
            raise DuplicateKeyError(f"User with email {user.email} already exists")

        if hasattr(user, 'citizen_id') and user.citizen_id:
            existing_citizen = db.query(User).filter(User.citizen_id == user.citizen_id).first()
            if existing_citizen:
                raise DuplicateKeyError(f"User with citizen ID {user.citizen_id} already exists")

        # Create new user
        hashed_password = get_password_hash(user.password)

        # ตรวจสอบว่ามี role 'people' หรือไม่ ถ้ามีหรือหา role ไม่ได้ ให้ is_active=False, ถ้าไม่มี people เลย ให้ is_active=True
        is_active = None
        role_names = []
        if roles and isinstance(roles, list):
            for role in roles:
                try:
                    # ลองแปลงเป็น UUID ก่อน ถ้าใช่จะไปหา name จาก DB
                    role_uuid = UUID(str(role))
                    from models.role import Role
                    role_obj = db.query(Role).filter(Role.id == role_uuid).first()
                    if role_obj:
                        role_names.append(role_obj.name)
                except Exception:
                    # ถ้าไม่ใช่ UUID ให้ถือว่าเป็นชื่อ role
                    role_names.append(str(role).lower())

        # ถ้าไม่มี role ที่หาได้เลย ให้ถือว่าเป็น people
        if not role_names:
            role_names = ['people']

        if 'people' in [r.lower() for r in role_names]:
            is_active = False
        else:
            is_active = True

        db_user = User(
            citizen_id=create_data.get('citizen_id'),
            email=create_data.get('email'),
            hashed_password=hashed_password,
            first_name=create_data.get('first_name'),
            last_name=create_data.get('last_name'),
            phone=create_data.get('phone'),
            address=create_data.get('address'),
            address_other=create_data.get('address_other'),
            province_id=create_data.get('province_id'),
            district_id=create_data.get('district_id'),
            subdistrict_id=create_data.get('subdistrict_id'),
            zipcode=create_data.get('zipcode'),
            province2_id=create_data.get('province2_id'),
            district2_id=create_data.get('district2_id'),
            subdistrict2_id=create_data.get('subdistrict2_id'),
            zipcode2=create_data.get('zipcode2'),
            profile_image=create_data.get('profile_image'),
            sync_address=create_data.get('sync_address', False),
            group_type=create_data.get('group'),
            is_active=is_active
        )

        # จัดการเรื่องคำนำหน้า
        if create_data.get('title_id'):
            title = db.query(Title).filter(Title.title_id == user.title_id).first()
            if title:
                db_user.title_id = title.title_id

        # กรณีเลือก "อื่นๆ" และระบุคำนำหน้าเอง
        if create_data.get('prefix_other'):
            other_title_id = 1  # ID ของ "อื่น ๆ" ตามข้อมูล seed
            db_user.title_id = other_title_id
            db_user.prefix_other = create_data.get('prefix_other')

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        # กำหนดบทบาท
        assign_user_roles(db, db_user.id, roles)
        
        # กำหนดตำแหน่ง (ถ้ามี)
        if position_ids:
            assign_user_positions(db, db_user.id, position_ids, primary_position_id)
        
        # ส่งอีเมลยืนยัน
        if VERIFY_PATH:
            from app.api.v1.controllers.email_controller import generate_verification_token, send_verification_email
            
            token = generate_verification_token(db, db_user.id)
            verification_url = f"{VERIFY_PATH}/verify-email?token={token}"
            user_full_name = f"{db_user.first_name} {db_user.last_name}"
            send_verification_email(db_user.email, user_full_name, verification_url)
        
        # รับข้อมูลผู้ใช้พร้อมบทบาทเพื่อส่งกลับ
        user_with_roles = get_user_with_roles_and_titles(db, db_user.id)
        return user_with_roles
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise DuplicateKeyError("User already exists")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {str(e)}")
        raise

def assign_user_roles(db: Session, user_id: UUID, roles: list):
    """กำหนดบทบาทให้กับผู้ใช้"""
    from models.role import Role
    
    roles_to_assign = []
    
    if roles and len(roles) > 0:
        # ตรวจสอบว่า roles เป็น UUID หรือ name
        for role in roles:
            if isinstance(role, str):
                try:
                    # ลองแปลงเป็น UUID ก่อน
                    role_uuid = UUID(role)
                    role_obj = db.query(Role).filter(Role.id == role_uuid).first()
                    if role_obj:
                        roles_to_assign.append(role_obj)
                except ValueError:
                    # ถ้าแปลงไม่ได้ ให้ถือว่าเป็น role name
                    role_obj = db.query(Role).filter(Role.name == role).first()
                    if role_obj:
                        roles_to_assign.append(role_obj)
    
    # ถ้าไม่มีบทบาทที่ระบุ ใช้บทบาทเริ่มต้น "people"
    if not roles_to_assign:
        default_role = db.query(Role).filter(Role.name == "people").first()
        if default_role:
            roles_to_assign = [default_role]
    
    # เพิ่มบทบาทให้กับผู้ใช้
    for role in roles_to_assign:
        new_user_role = UserRole(
            user_id=user_id,
            role_id=role.id
        )
        db.add(new_user_role)
    
    db.commit()

def assign_user_positions(db: Session, user_id: UUID, position_ids: list, primary_position_id: UUID = None):
    """กำหนดตำแหน่งให้กับผู้ใช้"""
    from models.position import Position
    
    for position_id in position_ids:
        # ตรวจสอบว่าตำแหน่งมีอยู่จริง
        position = db.query(Position).filter(Position.id == position_id).first()
        if position:
            is_primary = (position_id == primary_position_id) if primary_position_id else (position_id == position_ids[0])
            
            user_position = UserPosition(
                user_id=user_id,
                position_id=position_id,
                is_primary=is_primary,
                start_date=datetime.now()
            )
            db.add(user_position)
    
    db.commit()

def update_user(db: Session, user_id: int, user_data: UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    update_data = sanitize_input_fields(user_data.model_dump(exclude_unset=True, exclude_none=True))

    if "email" in update_data and update_data["email"] != db_user.email:
        existing_email = get_user_by_email(db, update_data["email"])
        if existing_email:
            raise DuplicateKeyError(f"User with email {update_data['email']} already exists")

    if "title_id" in update_data and update_data["title_id"]:
        title = db.query(Title).filter(Title.title_id == update_data["title_id"]).first()
        if title and title.title_name != "อื่น ๆ" and "prefix_other" not in update_data:
            update_data["prefix_other"] = None

    if "prefix_other" in update_data and update_data["prefix_other"]:
        if "title_id" not in update_data:
            update_data["title_id"] = 1  

    for key, value in update_data.items():
        setattr(db_user, key, value)

    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error during update: {str(e)}")
        raise DuplicateKeyError("Update would result in duplicate data")
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user: {str(e)}")
        raise


def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True


def get_titles(db: Session):
    title = db.query(Title.title_id, Title.title_name, Title.short_name).filter(Title.is_active == 1).all()
    return title


def get_users_with_titles(db: Session, skip: int = 0, limit: int = 100):
    """Get users with their titles in a simple, efficient way"""
    users = db.query(User).options(joinedload(User.title)).order_by(User.id).offset(skip).limit(limit).all()
    result = []
    for user in users:
        # Basic user data
        user_data = {
            "id": user.id,
            "email": user.email,
            "citizen_id": user.citizen_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "title_id": user.title_id,
            "prefix_other": user.prefix_other,
            "address": user.address or "",
            "address_other": user.address_other or "",
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "full_name": f"{user.first_name} {user.last_name}"
        }

        # Get title name - prioritize prefix_other for "Other" titles
        if user.title_id == 1 and user.prefix_other:
            title_name = user.prefix_other
        elif user.title:
            title_name = user.title.title_name
        else:
            title_name = None

        user_data["title_name"] = title_name
        user_data["full_name_with_title"] = f"{title_name or ''}{' ' if title_name else ''}{user.first_name} {user.last_name}"

        result.append(user_data)

    return result


def get_users_with_roles_and_titles(db: Session, skip: int = 0, limit: int = 100):
    """Get users with their titles, roles and positions"""
    # ใช้ joinedload เพื่อโหลดข้อมูล title, roles และ positions พร้อมกับข้อมูลผู้ใช้
    users = db.query(User).options(
        joinedload(User.title),
        joinedload(User.roles).joinedload(UserRole.role),
        joinedload(User.positions).joinedload(UserPosition.position)
    ).order_by(User.id).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        # Basic user data
        user_data = {
            "id": user.id,
            "email": user.email,
            "citizen_id": user.citizen_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "title_id": user.title_id,
            "prefix_other": user.prefix_other,
            "address": user.address or "",
            "address_other": user.address_other or "",
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "full_name": f"{user.first_name} {user.last_name}"
        }

        # Get title name - prioritize prefix_other for "Other" titles
        if user.title_id == 1 and user.prefix_other:
            title_name = user.prefix_other
        elif user.title:
            title_name = user.title.title_name
        else:
            title_name = None

        user_data["title_name"] = title_name
        user_data["full_name_with_title"] = f"{title_name or ''}{' ' if title_name else ''}{user.first_name} {user.last_name}"

        # Add user roles information
        user_roles = []
        for user_role in user.roles:
            if user_role.role:
                role_info = {
                    "role_id": user_role.role.id,
                    "role_name": user_role.role.name,
                    "role_description": user_role.role.description,
                    "is_active": user_role.role.is_active
                }
                user_roles.append(role_info)
        
        user_data["roles"] = user_roles
        
        # เพิ่มข้อมูลตำแหน่งของผู้ใช้
        user_positions = []
        primary_position = None
        
        for user_position in user.positions:
            if user_position.position and (not user_position.end_date):  # แสดงเฉพาะตำแหน่งที่ยังไม่สิ้นสุด
                position_info = {
                    "id": user_position.id,
                    "position_id": user_position.position.id,
                    "position_name": user_position.position.name,
                    "position_level": user_position.position.level,
                    "position_description": user_position.position.description,
                    "is_primary": user_position.is_primary,
                    "start_date": user_position.start_date,
                    "end_date": user_position.end_date
                }
                user_positions.append(position_info)
                
                # เก็บข้อมูลตำแหน่งหลัก
                if user_position.is_primary:
                    primary_position = position_info
        
        user_data["positions"] = user_positions
        user_data["primary_position"] = primary_position
        
        # เพิ่มข้อมูลแบบย่อสำหรับตำแหน่งหลักใน full_name
        if primary_position:
            user_data["full_name_with_position"] = f"{user_data['full_name_with_title']} - {primary_position['position_name']}"
            if primary_position['position_level']:
                user_data["full_name_with_position"] += f" ({primary_position['position_level']})"
        else:
            user_data["full_name_with_position"] = user_data["full_name_with_title"]

        result.append(user_data)

    return result


def get_user_with_roles_and_titles(db: Session, user_id: UUID):
    """Get a specific user with their titles, roles and positions"""
    # ใช้ joinedload เพื่อโหลดข้อมูล title, roles และ positions พร้อมกับข้อมูลผู้ใช้
    user = db.query(User).options(
        joinedload(User.title),
        joinedload(User.roles).joinedload(UserRole.role),
        joinedload(User.positions).joinedload(UserPosition.position)
    ).filter(User.id == user_id).first()
    
    if not user:
        return None
    
    # Basic user data
    user_data = {
        "id": user.id,
        "email": user.email,
        "citizen_id": user.citizen_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone or "",
        "address": user.address or "",
        "address_other": user.address_other or "",
        "title_id": user.title_id,
        "prefix_other": user.prefix_other or "",
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "full_name": f"{user.first_name} {user.last_name}"
    }

    # Get title name - prioritize prefix_other for "Other" titles
    if user.title_id == 1 and user.prefix_other:
        title_name = user.prefix_other
    elif user.title:
        title_name = user.title.title_name
    else:
        title_name = None

    user_data["title_name"] = title_name
    user_data["full_name_with_title"] = f"{title_name or ''}{' ' if title_name else ''}{user.first_name} {user.last_name}"

    # Add user roles information
    user_roles = []
    for user_role in user.roles:
        if user_role.role:
            role_info = {
                "role_id": user_role.role.id,
                "role_name": user_role.role.name,
                "role_description": user_role.role.description,
                "is_active": user_role.role.is_active
            }
            user_roles.append(role_info)
    
    user_data["roles"] = user_roles
    
    # เพิ่มข้อมูลตำแหน่งของผู้ใช้
    user_positions = []
    primary_position = None
    
    for user_position in user.positions:
        if user_position.position and (not user_position.end_date):  # แสดงเฉพาะตำแหน่งที่ยังไม่สิ้นสุด
            position_info = {
                "id": user_position.id,
                "position_id": user_position.position.id,
                "position_name": user_position.position.name,
                "position_level": user_position.position.level,
                "position_description": user_position.position.description,
                "is_primary": user_position.is_primary,
                "start_date": user_position.start_date,
                "end_date": user_position.end_date
            }
            user_positions.append(position_info)
            
            # เก็บข้อมูลตำแหน่งหลัก
            if user_position.is_primary:
                primary_position = position_info
    
    user_data["positions"] = user_positions
    user_data["primary_position"] = primary_position
    
    # เพิ่มข้อมูลแบบย่อสำหรับตำแหน่งหลักใน full_name
    if primary_position:
        user_data["full_name_with_position"] = f"{user_data['full_name_with_title']} - {primary_position['position_name']}"
        if primary_position['position_level']:
            user_data["full_name_with_position"] += f" ({primary_position['position_level']})"
    else:
        user_data["full_name_with_position"] = user_data["full_name_with_title"]

    return user_data

def search_users_by_role(db: Session, role_name: str = None, skip: int = 0, limit: int = 100):
    """
    Search users by role with pagination support
    
    Args:
        db: Database session
        role_name: Role name to filter by (optional)
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        
    Returns:
        List of users with their roles and titles
    """
    from models.role import Role
    
    # Base query with all necessary joins and filter for active users
    query = db.query(User).options(
        joinedload(User.title),
        joinedload(User.roles).joinedload(UserRole.role)
    ).filter(User.is_active == True)
    
    # If role_name is provided, filter users by that role
    if role_name:
        query = query.join(User.roles).join(UserRole.role).filter(Role.name == role_name)
    
    # Apply pagination and get results
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        # Build user data dictionary
        user_data = {
            "id": user.id,
            "email": user.email,
            "citizen_id": user.citizen_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone or "",
            "title_id": user.title_id,
            "prefix_other": user.prefix_other or "",
            "address": user.address or "",
            "address_other": user.address_other or "",
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "full_name": f"{user.first_name} {user.last_name}"
        }

        # Get title name - prioritize prefix_other for "Other" titles
        if user.title_id == 1 and user.prefix_other:
            title_name = user.prefix_other
        elif user.title:
            title_name = user.title.title_name
        else:
            title_name = None

        user_data["title_name"] = title_name
        user_data["full_name_with_title"] = f"{title_name or ''}{' ' if title_name else ''}{user.first_name} {user.last_name}"

        # Add user roles information
        user_roles = []
        for user_role in user.roles:
            if user_role.role:
                role_info = {
                    "role_id": user_role.role.id,
                    "role_name": user_role.role.name,
                    "role_description": user_role.role.description,
                    "is_active": user_role.role.is_active
                }
                user_roles.append(role_info)
        
        user_data["roles"] = user_roles
        result.append(user_data)

    return result

def get_users_count_by_roles(db: Session):
    """
    Get count of users grouped by their roles
    
    Args:
        db: Database session
        
    Returns:
        List of role names with their user counts
    """
    from sqlalchemy import func, distinct
    from models.role import Role
    
    # Query to count users by role (only active users)
    result = (
        db.query(
            Role.name.label('role_name'), 
            Role.description.label('role_description'),
            func.count(distinct(User.id)).label('user_count')
        )
        .join(UserRole, UserRole.role_id == Role.id)
        .join(User, User.id == UserRole.user_id)
        .filter(User.is_active == True)
        .group_by(Role.name, Role.description)
        .all()
    )
    
    # Format the results
    role_counts = [
        {
            "role_name": item.role_name,
            "role_description": item.role_description,
            "user_count": item.user_count
        }
        for item in result
    ]
    
    return role_counts

def get_detailed_users_by_roles(db: Session, role_id: UUID = None, skip: int = 0, limit: int = 100):
    from models.role import Role
    
    # สร้าง query พื้นฐานสำหรับ roles
    roles_query = db.query(Role).filter(Role.is_active == True).order_by(Role.order_index)
    
    # ถ้าระบุ role_id เฉพาะ ให้ใช้เฉพาะ role นั้น
    if role_id:
        roles_query = roles_query.filter(Role.id == role_id)
    
    # ดึงทุก role ที่มีในระบบ (ไม่จำกัดจำนวน) - เอา limit ออก
    roles = roles_query.all()
    
    result = []
    for role in roles:
        # ใช้ count แยกต่างหากเพื่อประสิทธิภาพ (only active users)
        total_users_count = (
            db.query(func.count(User.id))
            .join(UserRole, UserRole.user_id == User.id)
            .filter(UserRole.role_id == role.id)
            .filter(User.is_active == True)
            .scalar()
        )
        
        # ดึงข้อมูล users ถ้ามีใน role นี้
        users_data = []
        if total_users_count > 0:
            # ดึงเฉพาะข้อมูลที่จำเป็นโดยไม่ใช้ joinedload มากเกินไป (only active users)
            users_with_role = (
                db.query(User)
                .join(UserRole, UserRole.user_id == User.id)
                .filter(UserRole.role_id == role.id)
                .filter(User.is_active == True)
                .options(joinedload(User.title))
                .order_by(User.created_at.desc())
                .offset(skip)
                .limit(limit)
                .all()
            )
            
            # Format user data (ตัดข้อมูลที่ไม่จำเป็นออกไปในขั้นตอนนี้)
            for user in users_with_role:
                # สร้างเฉพาะข้อมูลที่จำเป็น
                user_data = {
                    "id": user.id,
                    "email": user.email,
                    "citizen_id": user.citizen_id,
                    "phone": user.phone or "",
                    "title_id": user.title_id,
                    "prefix_other": user.prefix_other or "",
                    "address": user.address or "",
                    "address_other": user.address_other or "",
                    "is_active": user.is_active,
                    "created_at": user.created_at,
                    "updated_at": user.updated_at,
                    "full_name": f"{user.first_name} {user.last_name}",
                }
                
                # Get title name ในรูปแบบที่เรียบง่าย
                if user.title_id == 1 and user.prefix_other:
                    title_name = user.prefix_other
                elif user.title:
                    title_name = user.title.title_name
                else:
                    title_name = None

                user_data["title_name"] = title_name
                user_data["full_name_with_title"] = f"{title_name or ''}{' ' if title_name else ''}{user.first_name} {user.last_name}"
                
                users_data.append(user_data)
        
        # เพิ่ม role entry แบบกระชับ (แม้ไม่มี user ก็สร้าง entry)
        role_entry = {
            "role_id": role.id,
            "role_name": role.name,
            "role_description": role.description,
            "total_user_count": total_users_count,
            "displayed_user_count": len(users_data),
            "pagination": {
                "skip": skip,
                "limit": limit
            },
            "users": users_data
        }
        
        result.append(role_entry)
    
    return result

def update_user_admin(db: Session, user_id: UUID, user_data: dict, roles: list = None, position_ids: list = None, primary_position_id: UUID = None):
    """
    Admin function to update user with roles and positions management
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None

    try:
        # ตรวจสอบความซ้ำซ้อนของอีเมล
        if "email" in user_data and user_data["email"] != db_user.email:
            existing_email = get_user_by_email(db, user_data["email"])
            if existing_email:
                raise DuplicateKeyError(f"User with email {user_data['email']} already exists")

        # ตรวจสอบความซ้ำซ้อนของ citizen_id
        if "citizen_id" in user_data and user_data["citizen_id"] != db_user.citizen_id:
            existing_citizen = get_user_by_pid(db, user_data["citizen_id"])
            if existing_citizen:
                raise DuplicateKeyError(f"User with citizen ID {user_data['citizen_id']} already exists")

        # จัดการเรื่องคำนำหน้าเมื่อมีการอัพเดต
        if "title_id" in user_data and user_data["title_id"]:
            title = db.query(Title).filter(Title.title_id == user_data["title_id"]).first()
            if title:
                # ถ้าไม่ใช่ "อื่นๆ" ให้ล้างค่า prefix_other
                if title.title_name != "อื่น ๆ" and "prefix_other" not in user_data:
                    user_data["prefix_other"] = None

        # กรณีเลือก "อื่นๆ" และระบุคำนำหน้าเอง
        if "prefix_other" in user_data and user_data["prefix_other"]:
            if "title_id" not in user_data:
                other_title_id = 1  # ID ของ "อื่น ๆ"
                user_data["title_id"] = other_title_id

        # Hash password ถ้ามีการอัพเดต
        if "password" in user_data and user_data["password"]:
            user_data["hashed_password"] = get_password_hash(user_data["password"])
            del user_data["password"]

        # อัพเดตข้อมูลผู้ใช้
        for key, value in user_data.items():
            if hasattr(db_user, key):
                setattr(db_user, key, value)

        # อัพเดต timestamp
        db_user.updated_at = datetime.utcnow()

        # จัดการ roles ถ้ามีการส่งมา
        if roles is not None:
            # ลบ roles เก่าทั้งหมด
            db.query(UserRole).filter(UserRole.user_id == user_id).delete()
            
            # เพิ่ม roles ใหม่
            if roles:
                assign_user_roles(db, user_id, roles)

        # จัดการ positions ถ้ามีการส่งมา
        if position_ids is not None:
            # ลบ positions เก่าทั้งหมด
            db.query(UserPosition).filter(UserPosition.user_id == user_id).delete()
            
            # เพิ่ม positions ใหม่
            if position_ids:
                assign_user_positions(db, user_id, position_ids, primary_position_id)

        db.commit()
        db.refresh(db_user)
        
        # รับข้อมูลผู้ใช้พร้อมบทบาทและตำแหน่งเพื่อส่งกลับ
        user_with_details = get_user_with_roles_and_titles(db, user_id)
        return user_with_details
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error during admin update: {str(e)}")
        raise DuplicateKeyError("Update would result in duplicate data")
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user (admin): {str(e)}")
        raise