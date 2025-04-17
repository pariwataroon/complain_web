from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from models.time_setting import TimeSetting
from app.api.v1.schemas.time_setting import TimeSettingCreate, TimeSettingUpdate

def get_time_settings(db: Session, skip: int = 0, limit: int = 100) -> List[TimeSetting]:
    """ดึงข้อมูลการตั้งค่าระยะเวลาทั้งหมด"""
    return db.query(TimeSetting).order_by(TimeSetting.name).offset(skip).limit(limit).all()

def get_time_setting_by_id(db: Session, time_setting_id: UUID) -> Optional[TimeSetting]:
    """ดึงข้อมูลการตั้งค่าระยะเวลาตาม ID"""
    return db.query(TimeSetting).filter(TimeSetting.id == time_setting_id).first()

def get_time_setting_by_key(db: Session, key: str) -> Optional[TimeSetting]:
    """ดึงข้อมูลการตั้งค่าระยะเวลาตาม key"""
    return db.query(TimeSetting).filter(TimeSetting.key == key).first()

def create_time_setting(db: Session, time_setting: TimeSettingCreate) -> TimeSetting:
    """สร้างการตั้งค่าระยะเวลาใหม่"""
    db_time_setting = TimeSetting(
        key=time_setting.key,
        name=time_setting.name,
        value=time_setting.value,
        description=time_setting.description,
        icon=time_setting.icon,
        is_active=time_setting.is_active
    )
    db.add(db_time_setting)
    db.commit()
    db.refresh(db_time_setting)
    return db_time_setting

def update_time_setting(db: Session, time_setting_id: UUID, time_setting_data: TimeSettingUpdate) -> Optional[TimeSetting]:
    """อัปเดตการตั้งค่าระยะเวลา"""
    db_time_setting = get_time_setting_by_id(db, time_setting_id)
    if not db_time_setting:
        return None
        
    # อัปเดตเฉพาะค่าที่ส่งมา
    for key, value in time_setting_data.model_dump(exclude_unset=True).items():
        setattr(db_time_setting, key, value)
    
    db.commit()
    db.refresh(db_time_setting)
    return db_time_setting

def delete_time_setting(db: Session, time_setting_id: UUID) -> bool:
    """ลบการตั้งค่าระยะเวลา"""
    db_time_setting = get_time_setting_by_id(db, time_setting_id)
    if not db_time_setting:
        return False
    
    db.delete(db_time_setting)
    db.commit()
    return True