import secrets
import uuid
from sqlalchemy.orm import Session
from models.project_api_key import ProjectApiKey
from app.api.v1.schemas.project_api_key import ProjectApiKeyCreate, ProjectApiKeyUpdate
from sqlalchemy.sql import func

def generate_api_key() -> str:
    """สร้าง API Key ที่เป็นสตริงแบบสุ่มที่ปลอดภัย"""
    # รูปแบบ: comp_mof_<32 random hex chars>
    return f"comp_mof_{secrets.token_hex(16)}"

def create_project_api_key(db: Session, project_data: ProjectApiKeyCreate) -> dict:
    """
    สร้าง API Key ใหม่สำหรับโปรเจค
    
    Args:
        db: Database session
        project_data: ข้อมูลโปรเจค
        
    Returns:
        Dictionary ที่มีข้อมูลโปรเจคและ API Key ที่สร้างขึ้นใหม่
    """
    # สร้าง API Key
    api_key = generate_api_key()
    
    # สร้าง Project API Key ใหม่
    db_project_api_key = ProjectApiKey(
        id=uuid.uuid4(),
        project_name=project_data.project_name,
        api_key=api_key,
        description=project_data.description,
        is_active=project_data.is_active
    )
    
    db.add(db_project_api_key)
    db.commit()
    db.refresh(db_project_api_key)
    
    # ส่งคืนข้อมูลพร้อม API Key แบบเต็ม (เฉพาะตอนสร้างเท่านั้น)
    return {
        "id": db_project_api_key.id,
        "project_name": db_project_api_key.project_name,
        "description": db_project_api_key.description,
        "is_active": db_project_api_key.is_active,
        "created_at": db_project_api_key.created_at,
        "updated_at": db_project_api_key.updated_at,
        "api_key": api_key,  # ส่งคืน API Key แบบเต็ม
        "api_key_masked": mask_api_key(api_key)  # ส่ง API Key แบบปกปิดด้วย
    }

def mask_api_key(api_key: str) -> str:
    """ปกปิด API Key โดยแสดงเฉพาะส่วนต้นและท้าย"""
    if not api_key or len(api_key) < 10:
        return api_key
    
    prefix_length = 5  # "comp_mof_" และอักขระตามหลังอีก 1 ตัว
    
    # แสดงเฉพาะส่วนต้นและส่วนท้าย
    masked_key = f"{api_key[:prefix_length]}...{api_key[-4:]}"
    return masked_key

def verify_project_api_key(db: Session, api_key: str) -> bool:
    """ตรวจสอบว่า API Key ของโปรเจคถูกต้องและยังใช้งานได้หรือไม่"""
    
    # ตรวจสอบว่ามี API Key นี้ในระบบหรือไม่ และสถานะยังใช้งานได้
    api_key_record = db.query(ProjectApiKey).filter(
        ProjectApiKey.api_key == api_key,
        ProjectApiKey.is_active == True
    ).first()
    
    # ถ้าพบ API Key และยังใช้งานได้ ให้อัปเดตเวลาการใช้งานล่าสุด
    if api_key_record:
        api_key_record.last_used_at = func.now()
        db.commit()
        return True
    
    return False

def get_all_project_api_keys(db: Session, skip: int = 0, limit: int = 100) -> list:
    """
    ดึงรายการ API Key ทั้งหมดในระบบ (แบบปกปิดบางส่วน)
    
    Args:
        db: Database session
        skip: จำนวนรายการที่ต้องการข้าม (สำหรับ pagination)
        limit: จำนวนรายการสูงสุดที่ต้องการดึง
        
    Returns:
        List ของ Project API Key โดย API Key จะถูกปกปิดบางส่วน
    """
    api_keys = db.query(ProjectApiKey).order_by(ProjectApiKey.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for key in api_keys:
        masked_key = mask_api_key(key.api_key)
        result.append({
            "id": key.id,
            "project_name": key.project_name,
            "description": key.description,
            "api_key": masked_key,
            "is_active": key.is_active,
            "created_at": key.created_at,
            "updated_at": key.updated_at,
            "last_used_at": key.last_used_at
        })
    
    return result

def get_project_api_key_by_id(db: Session, api_key_id: uuid.UUID) -> dict:
    """
    ดึงข้อมูล API Key ตาม ID (แบบปกปิดบางส่วน)
    
    Args:
        db: Database session
        api_key_id: ID ของ Project API Key
        
    Returns:
        Dictionary ของข้อมูล Project API Key โดย API Key จะถูกปกปิดบางส่วน
    """
    api_key = db.query(ProjectApiKey).filter(ProjectApiKey.id == api_key_id).first()
    
    if not api_key:
        return None
    
    masked_key = mask_api_key(api_key.api_key)
    return {
        "id": api_key.id,
        "project_name": api_key.project_name,
        "description": api_key.description,
        "api_key": masked_key,
        "is_active": api_key.is_active,
        "created_at": api_key.created_at,
        "updated_at": api_key.updated_at,
        "last_used_at": api_key.last_used_at
    }

def update_project_api_key(db: Session, api_key_id: uuid.UUID, api_key_data: ProjectApiKeyUpdate) -> dict:
    """
    อัปเดตข้อมูล API Key
    
    Args:
        db: Database session
        api_key_id: ID ของ Project API Key
        api_key_data: ข้อมูลที่ต้องการอัปเดต
        
    Returns:
        Dictionary ของข้อมูล Project API Key ที่อัปเดตแล้ว
    """
    api_key = db.query(ProjectApiKey).filter(ProjectApiKey.id == api_key_id).first()
    
    if not api_key:
        return None
    
    # อัปเดตข้อมูลเฉพาะที่ส่งมา
    update_data = api_key_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(api_key, key, value)
    
    # อัปเดตเวลา
    api_key.updated_at = func.now()
    
    db.commit()
    db.refresh(api_key)
    
    # ส่งคืนข้อมูลพร้อม API Key แบบปกปิด
    masked_key = mask_api_key(api_key.api_key)
    return {
        "id": api_key.id,
        "project_name": api_key.project_name,
        "description": api_key.description,
        "api_key": masked_key,
        "is_active": api_key.is_active,
        "created_at": api_key.created_at,
        "updated_at": api_key.updated_at,
        "last_used_at": api_key.last_used_at
    }

def delete_project_api_key(db: Session, api_key_id: uuid.UUID) -> bool:
    """
    ลบ API Key
    
    Args:
        db: Database session
        api_key_id: ID ของ Project API Key
        
    Returns:
        True ถ้าลบสำเร็จ, False ถ้าไม่พบ API Key
    """
    api_key = db.query(ProjectApiKey).filter(ProjectApiKey.id == api_key_id).first()
    
    if not api_key:
        return False
    
    db.delete(api_key)
    db.commit()
    
    return True

def regenerate_api_key(db: Session, api_key_id: uuid.UUID) -> dict:
    """
    สร้าง API Key ใหม่สำหรับโปรเจคที่มีอยู่แล้ว
    
    Args:
        db: Database session
        api_key_id: ID ของ Project API Key
        
    Returns:
        Dictionary ของข้อมูล Project API Key พร้อม API Key ใหม่
    """
    api_key = db.query(ProjectApiKey).filter(ProjectApiKey.id == api_key_id).first()
    
    if not api_key:
        return None
    
    # สร้าง API Key ใหม่
    new_api_key = generate_api_key()
    
    # อัปเดต API Key
    api_key.api_key = new_api_key
    api_key.updated_at = func.now()
    
    db.commit()
    db.refresh(api_key)
    
    # ส่งคืนข้อมูลพร้อม API Key แบบเต็ม (เฉพาะตอนสร้างใหม่เท่านั้น)
    return {
        "id": api_key.id,
        "project_name": api_key.project_name,
        "description": api_key.description,
        "is_active": api_key.is_active,
        "created_at": api_key.created_at,
        "updated_at": api_key.updated_at,
        "api_key": new_api_key,  # ส่งคืน API Key แบบเต็ม
        "api_key_masked": mask_api_key(new_api_key)  # ส่ง API Key แบบปกปิดด้วย
    }