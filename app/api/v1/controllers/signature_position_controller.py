from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from fastapi import HTTPException
from datetime import datetime
from sqlalchemy import func
from lib.logger import get_logger

from models.signature_positions import SignaturePosition, SignatureAuthority
from models.departments import Department
from models.user import User
from models.position import Position
from app.api.v1.schemas.signature_positions import (
    SignaturePosition as SignaturePositionSchema,
    SignatureAuthority as SignatureAuthoritySchema
)

logger = get_logger("signature_position_controller")

class DuplicateKeyError(Exception):
    pass

def get_signature_positions(db: Session, skip: int = 0, limit: int = 100):
    """รับรายการตำแหน่งผู้มีอำนาจลงนามทั้งหมด"""
    try:
        positions = db.query(SignaturePosition).filter(
            SignaturePosition.is_active == True
        ).order_by(SignaturePosition.order_index).offset(skip).limit(limit).options(
            joinedload(SignaturePosition.department),
            joinedload(SignaturePosition.position)
        ).all()
        
        result = []
        for position in positions:
            # เพิ่มข้อมูลเพิ่มเติมที่ไม่ได้มีใน schema
            position_dict = SignaturePositionSchema.model_validate(position).model_dump()
            position_dict["department_name"] = position.department.name if position.department else None
            position_dict["position_name"] = position.position.name if position.position else None
            
            result.append(position_dict)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching signature positions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch signature positions: {str(e)}")

def get_signature_position_by_id(db: Session, position_id: UUID):
    """รับตำแหน่งผู้มีอำนาจลงนามตาม ID"""
    try:
        # ตรวจสอบความถูกต้องของ ID
        if not position_id:
            logger.error("Position ID is missing")
            raise HTTPException(status_code=400, detail="Position ID is required")
            
        if not isinstance(position_id, UUID):
            try:
                position_id = UUID(str(position_id))
            except ValueError:
                logger.error(f"Invalid position ID format: {position_id}")
                raise HTTPException(status_code=400, detail="Invalid position ID format")
        
        position = db.query(SignaturePosition).options(
            joinedload(SignaturePosition.department),
            joinedload(SignaturePosition.position),
            joinedload(SignaturePosition.authorities).joinedload(SignatureAuthority.user)
        ).filter(
            SignaturePosition.id == position_id,
            SignaturePosition.is_active == True
        ).first()
        
        if not position:
            logger.warning(f"Signature position with ID {position_id} not found")
            return None
        
        # เตรียมข้อมูลตำแหน่งผู้มีอำนาจลงนาม
        position_dict = SignaturePositionSchema.model_validate(position).model_dump()
        position_dict["department_name"] = position.department.name if position.department else None
        position_dict["position_name"] = position.position.name if position.position else None
        
        # รายชื่อผู้มีอำนาจลงนามในตำแหน่งนี้
        active_authorities = []
        for auth in position.authorities:
            if auth.is_active:
                auth_dict = SignatureAuthoritySchema.model_validate(auth).model_dump()
                auth_dict["user_name"] = f"{auth.user.first_name} {auth.user.last_name}" if auth.user else None
                active_authorities.append(auth_dict)
        
        position_dict["authorities"] = active_authorities
        
        return position_dict
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching signature position by ID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch signature position: {str(e)}")

def get_signature_positions_by_department(db: Session, department_id: UUID):
    """รับรายการตำแหน่งผู้มีอำนาจลงนามตามหน่วยงาน"""
    try:
        # ตรวจสอบความถูกต้องของ department_id
        if not department_id:
            logger.error("Department ID is missing")
            raise HTTPException(status_code=400, detail="Department ID is required")
            
        if not isinstance(department_id, UUID):
            try:
                department_id = UUID(str(department_id))
            except ValueError:
                logger.error(f"Invalid department ID format: {department_id}")
                raise HTTPException(status_code=400, detail="Invalid department ID format")
        
        # ตรวจสอบว่าหน่วยงานมีอยู่จริง
        department = db.query(Department).filter(
            Department.id == department_id,
            Department.is_active == True
        ).first()
        
        if not department:
            logger.error(f"Department with ID {department_id} not found")
            raise HTTPException(status_code=404, detail=f"Department with ID {department_id} not found")
        
        positions = db.query(SignaturePosition).filter(
            SignaturePosition.department_id == department_id,
            SignaturePosition.is_active == True
        ).order_by(SignaturePosition.order_index).options(
            joinedload(SignaturePosition.position),
            joinedload(SignaturePosition.authorities).joinedload(SignatureAuthority.user)
        ).all()
        
        result = []
        for position in positions:
            # เตรียมข้อมูลตำแหน่งผู้มีอำนาจลงนาม
            position_dict = SignaturePositionSchema.model_validate(position).model_dump()
            position_dict["position_name"] = position.position.name if position.position else None
            
            # รายชื่อผู้มีอำนาจลงนามในตำแหน่งนี้
            active_authorities = []
            for auth in position.authorities:
                if auth.is_active:
                    auth_dict = SignatureAuthoritySchema.model_validate(auth).model_dump()
                    auth_dict["user_name"] = f"{auth.user.first_name} {auth.user.last_name}" if auth.user else None
                    active_authorities.append(auth_dict)
            
            position_dict["authorities"] = active_authorities
            result.append(position_dict)
        
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching signature positions by department: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch signature positions by department: {str(e)}")

def create_signature_position(db: Session, position_data: dict):
    """สร้างตำแหน่งผู้มีอำนาจลงนามใหม่"""
    try:
        # ตรวจสอบว่าได้รับข้อมูลที่จำเป็นครบถ้วน
        if "department_id" not in position_data or not position_data["department_id"]:
            logger.error("department_id is missing or invalid")
            raise HTTPException(status_code=400, detail="department_id is required")
            
        if "position_id" not in position_data or not position_data["position_id"]:
            logger.error("position_id is missing or invalid")
            raise HTTPException(status_code=400, detail="position_id is required")
            
        # ตรวจสอบว่า department_id เป็น UUID
        if not isinstance(position_data["department_id"], UUID):
            try:
                position_data["department_id"] = UUID(str(position_data["department_id"]))
            except ValueError:
                logger.error(f"Invalid department_id format: {position_data['department_id']}")
                raise HTTPException(status_code=400, detail="Invalid department_id format")
                
        # ตรวจสอบว่า position_id เป็น UUID
        if not isinstance(position_data["position_id"], UUID):
            try:
                position_data["position_id"] = UUID(str(position_data["position_id"]))
            except ValueError:
                logger.error(f"Invalid position_id format: {position_data['position_id']}")
                raise HTTPException(status_code=400, detail="Invalid position_id format")
            
        # ตรวจสอบว่าหน่วยงานมีอยู่จริง
        logger.debug(f"Checking department ID: {position_data['department_id']}, type: {type(position_data['department_id'])}")
        department = db.query(Department).filter(
            Department.id == position_data["department_id"],
            Department.is_active == True
        ).first()
        
        logger.debug(f"Department query result: {department}")
        
        if not department:
            logger.error(f"Department with ID {position_data['department_id']} not found")
            raise HTTPException(status_code=404, detail=f"Department with ID {position_data['department_id']} not found")
        
        # ตรวจสอบว่า position มีอยู่จริง
        logger.debug(f"Checking position ID: {position_data['position_id']}, type: {type(position_data['position_id'])}")
        position = db.query(Position).filter(
            Position.id == position_data["position_id"],
            Position.is_active == True
        ).first()
        
        logger.debug(f"Position query result: {position}")
        
        if not position:
            logger.error(f"Position with ID {position_data['position_id']} not found")
            raise HTTPException(status_code=404, detail=f"Position with ID {position_data['position_id']} not found")
        
        # ค้นหาค่า order_index ที่มากที่สุดในหน่วยงานนี้
        max_order = db.query(func.max(SignaturePosition.order_index)).filter(
            SignaturePosition.department_id == position_data["department_id"]
        ).scalar() or 0
        
        # กำหนดค่า order_index อัตโนมัติถ้าไม่ได้ระบุ
        if "order_index" not in position_data or position_data["order_index"] is None:
            position_data["order_index"] = max_order + 10
        
        # สร้างตำแหน่งใหม่
        db_position = SignaturePosition(**position_data)
        db.add(db_position)
        db.commit()
        db.refresh(db_position)
        
        logger.info(f"Created signature position: {db_position.title} with ID {db_position.id}")
        
        return get_signature_position_by_id(db, db_position.id)
    except HTTPException as e:
        # ถ้าเป็น HTTPException ให้ส่งต่อไปเลย
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating signature position: {str(e)}")
        # แปลงเป็น HTTPException ที่สื่อความหมายมากขึ้น
        raise HTTPException(status_code=500, detail=f"Failed to create signature position: {str(e)}")

def update_signature_position(db: Session, position_id: UUID, position_data: dict):
    """อัปเดตข้อมูลตำแหน่งผู้มีอำนาจลงนาม"""
    try:
        # ตรวจสอบความถูกต้องของ position_id
        if not position_id:
            logger.error("Position ID is missing")
            raise HTTPException(status_code=400, detail="Position ID is required")
            
        if not isinstance(position_id, UUID):
            try:
                position_id = UUID(str(position_id))
            except ValueError:
                logger.error(f"Invalid position ID format: {position_id}")
                raise HTTPException(status_code=400, detail="Invalid position ID format")
            
        db_position = db.query(SignaturePosition).filter(SignaturePosition.id == position_id).first()
        if not db_position:
            logger.error(f"Signature position with ID {position_id} not found")
            return None
        
        # ตรวจสอบว่าหน่วยงานมีอยู่จริงถ้ามีการเปลี่ยนแปลง
        if "department_id" in position_data and position_data["department_id"]:
            # แปลง department_id เป็น UUID ถ้าจำเป็น
            if not isinstance(position_data["department_id"], UUID):
                try:
                    position_data["department_id"] = UUID(str(position_data["department_id"]))
                except ValueError:
                    logger.error(f"Invalid department_id format: {position_data['department_id']}")
                    raise HTTPException(status_code=400, detail="Invalid department_id format")
            
            if position_data["department_id"] != db_position.department_id:
                department = db.query(Department).filter(
                    Department.id == position_data["department_id"],
                    Department.is_active == True
                ).first()
                
                if not department:
                    logger.error(f"Department with ID {position_data['department_id']} not found")
                    raise HTTPException(status_code=404, detail=f"Department with ID {position_data['department_id']} not found")
        
        # ตรวจสอบตำแหน่งทั่วไปถ้ามีการเปลี่ยนแปลง
        if "position_id" in position_data and position_data["position_id"]:
            # แปลง position_id เป็น UUID ถ้าจำเป็น
            if not isinstance(position_data["position_id"], UUID):
                try:
                    position_data["position_id"] = UUID(str(position_data["position_id"]))
                except ValueError:
                    logger.error(f"Invalid position_id format: {position_data['position_id']}")
                    raise HTTPException(status_code=400, detail="Invalid position_id format")
                    
            if position_data["position_id"] != db_position.position_id:
                position = db.query(Position).filter(
                    Position.id == position_data["position_id"],
                    Position.is_active == True
                ).first()
                
                if not position:
                    logger.error(f"Position with ID {position_data['position_id']} not found")
                    raise HTTPException(status_code=404, detail=f"Position with ID {position_data['position_id']} not found")
        
        # อัปเดตข้อมูลตำแหน่ง
        for key, value in position_data.items():
            setattr(db_position, key, value)
        
        db.commit()
        db.refresh(db_position)
        
        logger.info(f"Updated signature position: {db_position.title} with ID {position_id}")
        
        return get_signature_position_by_id(db, position_id)
    except HTTPException as e:
        # ถ้าเป็น HTTPException ให้ส่งต่อไปเลย
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating signature position: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update signature position: {str(e)}")

def delete_signature_position(db: Session, position_id: UUID):
    """ลบตำแหน่งผู้มีอำนาจลงนาม (soft delete)"""
    try:
        # ตรวจสอบความถูกต้องของ position_id
        if not position_id:
            logger.error("Position ID is missing")
            raise HTTPException(status_code=400, detail="Position ID is required")
            
        if not isinstance(position_id, UUID):
            try:
                position_id = UUID(str(position_id))
            except ValueError:
                logger.error(f"Invalid position ID format: {position_id}")
                raise HTTPException(status_code=400, detail="Invalid position ID format")
                
        db_position = db.query(SignaturePosition).filter(SignaturePosition.id == position_id).first()
        if not db_position:
            logger.error(f"Signature position with ID {position_id} not found")
            return False
        
        # ตรวจสอบว่ามีการใช้งานตำแหน่งนี้อยู่หรือไม่
        authorities = db.query(SignatureAuthority).filter(
            SignatureAuthority.position_id == position_id,
            SignatureAuthority.is_active == True
        ).count()
        
        if authorities > 0:
            logger.warning(f"Cannot delete signature position with ID {position_id}: has {authorities} active authorities")
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete signature position with active assigned users. Please remove users first."
            )
        
        db_position.is_active = False
        db.commit()
        
        logger.info(f"Soft deleted signature position with ID {position_id}")
        
        return True
    except HTTPException as e:
        # ถ้าเป็น HTTPException ให้ส่งต่อไปเลย
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting signature position: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete signature position: {str(e)}")

def assign_signature_authority(db: Session, authority_data: dict):
    """กำหนดสิทธิการลงนามให้กับผู้ใช้"""
    try:
        # ตรวจสอบข้อมูลที่จำเป็น
        if "position_id" not in authority_data or not authority_data["position_id"]:
            logger.error("position_id is missing or invalid")
            raise HTTPException(status_code=400, detail="position_id is required")
            
        if "user_id" not in authority_data or not authority_data["user_id"]:
            logger.error("user_id is missing or invalid")
            raise HTTPException(status_code=400, detail="user_id is required")
            
        # แปลง position_id และ user_id เป็น UUID ถ้าจำเป็น
        if not isinstance(authority_data["position_id"], UUID):
            try:
                authority_data["position_id"] = UUID(str(authority_data["position_id"]))
            except ValueError:
                logger.error(f"Invalid position_id format: {authority_data['position_id']}")
                raise HTTPException(status_code=400, detail="Invalid position_id format")
                
        if not isinstance(authority_data["user_id"], UUID):
            try:
                authority_data["user_id"] = UUID(str(authority_data["user_id"]))
            except ValueError:
                logger.error(f"Invalid user_id format: {authority_data['user_id']}")
                raise HTTPException(status_code=400, detail="Invalid user_id format")
                
        # ตรวจสอบว่าตำแหน่งมีอยู่จริง
        position = db.query(SignaturePosition).filter(
            SignaturePosition.id == authority_data["position_id"],
            SignaturePosition.is_active == True
        ).first()
        
        if not position:
            logger.error(f"Signature position with ID {authority_data['position_id']} not found")
            raise HTTPException(status_code=404, detail=f"Signature position with ID {authority_data['position_id']} not found")
        
        # ตรวจสอบว่าผู้ใช้มีอยู่จริง
        user = db.query(User).filter(
            User.id == authority_data["user_id"],
            User.is_active == True
        ).first()
        
        if not user:
            logger.error(f"User with ID {authority_data['user_id']} not found")
            raise HTTPException(status_code=404, detail=f"User with ID {authority_data['user_id']} not found")
        
        # ตรวจสอบว่าผู้ใช้นี้ได้รับมอบหมายตำแหน่งนี้อยู่แล้วหรือไม่
        existing = db.query(SignatureAuthority).filter(
            SignatureAuthority.user_id == authority_data["user_id"],
            SignatureAuthority.position_id == authority_data["position_id"],
            SignatureAuthority.is_active == True
        ).first()
        
        if existing:
            logger.warning(f"User {authority_data['user_id']} already assigned to position {authority_data['position_id']}")
            raise DuplicateKeyError(f"User already assigned to this position")
        
        # สร้างการมอบหมายสิทธิใหม่
        db_authority = SignatureAuthority(**authority_data)
        db.add(db_authority)
        db.commit()
        db.refresh(db_authority)
        
        logger.info(f"Assigned signature authority: User {db_authority.user_id} to position {db_authority.position_id}")
        
        # สร้างข้อมูลผลลัพธ์
        auth_dict = SignatureAuthoritySchema.model_validate(db_authority).model_dump()
        auth_dict["user_name"] = f"{user.first_name} {user.last_name}"
        auth_dict["position_title"] = position.title
        
        return auth_dict
    except DuplicateKeyError as e:
        db.rollback()
        raise e
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error assigning signature authority: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to assign signature authority: {str(e)}")

def get_available_users(db: Session, skip: int = 0, limit: int = 100):
    """รับรายการผู้ใช้ที่สามารถกำหนดเป็นผู้มีอำนาจลงนามได้"""
    try:
        # ดึงข้อมูลผู้ใช้ที่สถานะยังใช้งานอยู่
        users = db.query(User).filter(
            User.is_active == True
        ).order_by(User.first_name, User.last_name).offset(skip).limit(limit).all()
        
        result = []
        for user in users:
            # ดึงข้อมูลตำแหน่งและหน่วยงานเพิ่มเติมถ้ามี
            position_name = None
            department_name = None
            
            # ถ้ามีการเก็บข้อมูล position และ department ใน user ให้ดึงมาด้วย
            # อาจต้องปรับตามโครงสร้างข้อมูลจริงของระบบ
            if hasattr(user, "position") and user.position:
                position_name = user.position.name
                
            if hasattr(user, "department") and user.department:
                department_name = user.department.name
                
            result.append({
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "position": position_name,
                "department": department_name
            })
        
        return result
    except Exception as e:
        logger.error(f"Error fetching available users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch available users: {str(e)}")

def get_available_departments(db: Session, skip: int = 0, limit: int = 100):
    """รับรายการหน่วยงานที่สามารถกำหนดตำแหน่งผู้มีอำนาจลงนามได้"""
    try:
        departments = db.query(Department).filter(
            Department.is_active == True
        ).order_by(Department.name).offset(skip).limit(limit).all()
        
        result = []
        for dept in departments:
            dept_dict = {
                "id": dept.id,
                "name": dept.name
            }
            
            # เพิ่มข้อมูลเสริมถ้ามี
            if hasattr(dept, "code"):
                dept_dict["code"] = dept.code
                
            if hasattr(dept, "type"):
                dept_dict["type"] = dept.type
                
            result.append(dept_dict)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching available departments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch available departments: {str(e)}")

def get_positions_with_authorities(db: Session, department_id: Optional[UUID] = None, skip: int = 0, limit: int = 100):
    """รับรายการตำแหน่งผู้มีอำนาจลงนามพร้อมข้อมูลผู้ลงนาม"""
    try:
        # ตรวจสอบ department_id ถ้ามีการระบุ
        if department_id:
            if not isinstance(department_id, UUID):
                try:
                    department_id = UUID(str(department_id))
                except ValueError:
                    logger.error(f"Invalid department ID format: {department_id}")
                    raise HTTPException(status_code=400, detail="Invalid department ID format")
            
            department = db.query(Department).filter(
                Department.id == department_id,
                Department.is_active == True
            ).first()
            
            if not department:
                logger.error(f"Department with ID {department_id} not found")
                raise HTTPException(status_code=404, detail=f"Department with ID {department_id} not found")
        
        # สร้าง query พื้นฐาน
        query = db.query(SignaturePosition).filter(
            SignaturePosition.is_active == True
        )
        
        # กรองตามหน่วยงานถ้ามีการระบุ
        if department_id:
            query = query.filter(SignaturePosition.department_id == department_id)
        
        # ดึงข้อมูลพร้อม join ตาราง
        positions = query.order_by(
            SignaturePosition.department_id,
            SignaturePosition.order_index
        ).options(
            joinedload(SignaturePosition.department),
            joinedload(SignaturePosition.position),
            joinedload(SignaturePosition.authorities).joinedload(SignatureAuthority.user)
        ).offset(skip).limit(limit).all()
        
        # จัดเตรียมข้อมูลในรูปแบบที่เหมาะกับ UI
        result = []
        for position in positions:
            position_dict = {
                "id": position.id,
                "title": position.title,
                "description": position.description,
                "order_index": position.order_index,
                "department_id": position.department_id,
                "department_name": position.department.name if position.department else None,
                "position_id": position.position_id,
                "position_name": position.position.name if position.position else None,
                "is_active": position.is_active,
                "authorities": []
            }
            
            # เพิ่มข้อมูลผู้มีอำนาจลงนาม
            for auth in position.authorities:
                if auth.is_active:
                    auth_dict = {
                        "id": auth.id,
                        "user_id": auth.user_id,
                        "user_name": f"{auth.user.first_name} {auth.user.last_name}" if auth.user else None,
                        "start_date": auth.start_date,
                        "end_date": auth.end_date,
                        "is_active": auth.is_active
                    }
                    position_dict["authorities"].append(auth_dict)
            
            result.append(position_dict)
        
        return result
    except HTTPException as e:
        # ส่งต่อ HTTPException ที่เกิดขึ้น
        raise e
    except Exception as e:
        logger.error(f"Error fetching positions with authorities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch positions with authorities: {str(e)}")