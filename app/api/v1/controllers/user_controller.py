import bcrypt
from uuid import UUID
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.api.v1.schemas.user import UserCreate, UserUpdate
from lib.logger import get_logger
from models.title import Title
from models.user import User
from models.user_role import UserRole
from models.user_positions import UserPosition

logger = get_logger("user_repository", console_output=False)


class DuplicateKeyError(Exception):
    pass


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


def create_user(db: Session, user: UserCreate, roles: list = None):
    try:
        # Check if user already exists
        existing_email = get_user_by_email(db, user.email)
        if existing_email:
            raise DuplicateKeyError(
                f"User with email {user.email} already exists")

        # ตรวจสอบ citizen_id ถ้ามี
        if hasattr(user, 'citizen_id') and user.citizen_id:
            existing_citizen = db.query(User).filter(User.citizen_id == user.citizen_id).first()
            if existing_citizen:
                raise DuplicateKeyError(
                    f"User with citizen ID {user.citizen_id} already exists")

        # Create new user
        hashed_password = get_password_hash(user.password)

        # สร้าง user object พร้อมข้อมูลใหม่
        db_user = User(
            citizen_id=user.citizen_id,
            email=user.email,
            hashed_password=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone if hasattr(user, 'phone') else None,
            address=user.address if hasattr(user, 'address') else None,
            address_other=user.address_other if hasattr(user, 'address_other') else None,
            is_active=True
        )

        # จัดการเรื่องคำนำหน้า
        if hasattr(user, 'title_id') and user.title_id:
            # กรณีเลือกคำนำหน้าที่มีอยู่ในระบบ
            title = db.query(Title).filter(Title.title_id == user.title_id).first()
            if title:
                db_user.title_id = title.title_id

        # กรณีเลือก "อื่นๆ" และระบุคำนำหน้าเอง
        if hasattr(user, 'prefix_other') and user.prefix_other:
            # ถ้า title_id ตรงกับ "อื่นๆ" (title_id = 1 ตามข้อมูล seed)
            other_title_id = 1  # ID ของ "อื่น ๆ" ตามข้อมูล seed
            db_user.title_id = other_title_id
            db_user.prefix_other = user.prefix_other

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # กำหนดบทบาทตามที่ระบุ หรือใช้บทบาทเริ่มต้น
        from models.role import Role
        
        roles_to_assign = []
        
        # ตรวจสอบว่ามีการระบุบทบาทมาหรือไม่
        if roles and len(roles) > 0:
            # ดึงบทบาทตามที่ระบุ
            roles_to_assign = db.query(Role).filter(Role.name.in_(roles)).order_by(Role.order_index).all()
        
        # ถ้าไม่มีบทบาทที่ระบุหรือไม่พบบทบาทที่ระบุ ใช้บทบาทเริ่มต้น "people"
        if not roles_to_assign:
            default_role = db.query(Role).filter(Role.name == "people").first()
            if default_role:
                roles_to_assign = [default_role]
        
        # เพิ่มบทบาทให้กับผู้ใช้
        for role in roles_to_assign:
            new_user_role = UserRole(
                user_id=db_user.id,
                role_id=role.id
            )
            db.add(new_user_role)
        
        db.commit()
        
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


def update_user(db: Session, user_id: int, user_data: UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    # ตรวจสอบความซ้ำซ้อนของอีเมล
    update_data = user_data.model_dump(exclude_unset=True, exclude_none=True)

    # ตรวจสอบอีเมล์
    if "email" in update_data and update_data["email"] != db_user.email:
        existing_email = get_user_by_email(db, update_data["email"])
        if existing_email:
            raise DuplicateKeyError(
                f"User with email {update_data['email']} already exists")

    # จัดการเรื่องคำนำหน้าเมื่อมีการอัพเดต
    if "title_id" in update_data and update_data["title_id"]:
        # กรณีเลือกคำนำหน้าที่มีอยู่ในระบบ
        title = db.query(Title).filter(Title.title_id ==
                                       update_data["title_id"]).first()
        if title:
            # ถ้าไม่ใช่ "อื่นๆ" ให้ล้างค่า prefix_other
            if title.title_name != "อื่น ๆ" and "prefix_other" not in update_data:
                update_data["prefix_other"] = None

    # กรณีเลือก "อื่นๆ" และระบุคำนำหน้าเอง
    if "prefix_other" in update_data and update_data["prefix_other"]:
        # ถ้าไม่ได้ระบุ title_id มา ให้กำหนดเป็น ID ของ "อื่น ๆ"
        if "title_id" not in update_data:
            other_title_id = 1  # ID ของ "อื่น ๆ" ตามข้อมูล seed
            update_data["title_id"] = other_title_id

    # อัปเดตข้อมูล
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
    
    # Base query with all necessary joins
    query = db.query(User).options(
        joinedload(User.title),
        joinedload(User.roles).joinedload(UserRole.role)
    )
    
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
    
    # Query to count users by role
    result = (
        db.query(
            Role.name.label('role_name'), 
            Role.description.label('role_description'),
            func.count(distinct(User.id)).label('user_count')
        )
        .join(UserRole, UserRole.role_id == Role.id)
        .join(User, User.id == UserRole.user_id)
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
        # ใช้ count แยกต่างหากเพื่อประสิทธิภาพ
        total_users_count = (
            db.query(func.count(User.id))
            .join(UserRole, UserRole.user_id == User.id)
            .filter(UserRole.role_id == role.id)
            .scalar()
        )
        
        # ดึงข้อมูล users ถ้ามีใน role นี้
        users_data = []
        if total_users_count > 0:
            # ดึงเฉพาะข้อมูลที่จำเป็นโดยไม่ใช้ joinedload มากเกินไป
            users_with_role = (
                db.query(User)
                .join(UserRole, UserRole.user_id == User.id)
                .filter(UserRole.role_id == role.id)
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