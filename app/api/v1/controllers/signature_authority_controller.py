from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException
from datetime import datetime
from sqlalchemy import func
from lib.logger import get_logger

from models.signature_authorities import SignatureAuthority
from models.departments import Department
from models.user import User
from models.user_positions import UserPosition
from models.department_groups import DepartmentGroup
from app.api.v1.schemas.signature_authority import SignatureAuthority as SignatureAuthoritySchema

logger = get_logger("signature_authority_controller")

class DuplicateKeyError(Exception):
    pass

def get_signature_authorities(db: Session, skip: int = 0, limit: int = 100):
    """ดึงรายการผู้มีอำนาจลงนามทั้งหมด"""
    try:
        # ตรวจสอบชื่อ relationship และ column จริงในโมเดล
        # ตัวอย่าง: ถ้าใช้ department แทน organization
        result = db.query(SignatureAuthority)\
            .options(joinedload(SignatureAuthority.user), joinedload(SignatureAuthority.department))\
            .filter(SignatureAuthority.is_active == True)\
            .order_by(SignatureAuthority.created_at.desc())\
            .offset(skip).limit(limit).all()
        
        # แปลงข้อมูลเป็นรูปแบบที่ต้องการ
        formatted_authorities = []
        for authority in result:
            # ปรับชื่อ field ให้ตรงกับที่มีในโมเดล
            auth_dict = {
                "id": str(authority.id),
                "user": {
                    "id": str(authority.user_id),
                    "name": f"{authority.user.first_name} {authority.user.last_name}",
                    "email": authority.user.email
                },
                "department": {
                    "id": str(authority.department_id),
                    "name": authority.department.name
                },
                "is_active": authority.is_active,
                "start_date": authority.start_date,
                "end_date": authority.end_date,
                "created_at": authority.created_at,
                "updated_at": authority.updated_at
            }
            formatted_authorities.append(auth_dict)
        
        return formatted_authorities
    except Exception as e:
        logger.error(f"Error fetching signature authorities: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch signature authorities: {str(e)}"
        )

def assign_signature_authority(db: Session, authority_data: dict):
    """กำหนดสิทธิการลงนามให้กับผู้ใช้"""
    try:
        # ตรวจสอบข้อมูลที่จำเป็น
        if "department_id" not in authority_data or not authority_data["department_id"]:
            logger.error("department_id is missing or invalid")
            raise HTTPException(status_code=400, detail="department_id is required")
            
        if "user_id" not in authority_data or not authority_data["user_id"]:
            logger.error("user_id is missing or invalid")
            raise HTTPException(status_code=400, detail="user_id is required")
            
        # แปลง UUID ถ้าจำเป็น
        if not isinstance(authority_data["department_id"], UUID):
            try:
                authority_data["department_id"] = UUID(str(authority_data["department_id"]))
            except ValueError:
                logger.error(f"Invalid department_id format: {authority_data['department_id']}")
                raise HTTPException(status_code=400, detail="Invalid department_id format")
                
        if not isinstance(authority_data["user_id"], UUID):
            try:
                authority_data["user_id"] = UUID(str(authority_data["user_id"]))
            except ValueError:
                logger.error(f"Invalid user_id format: {authority_data['user_id']}")
                raise HTTPException(status_code=400, detail="Invalid user_id format")
                
        # ตรวจสอบว่าหน่วยงานมีอยู่จริง
        department = db.query(Department).filter(
            Department.id == authority_data["department_id"],
            Department.is_active == True
        ).first()
        
        if not department:
            logger.error(f"Department with ID {authority_data['department_id']} not found")
            raise HTTPException(status_code=404, detail=f"Department with ID {authority_data['department_id']} not found")
        
        # ตรวจสอบว่าผู้ใช้มีอยู่จริง
        user = db.query(User).filter(
            User.id == authority_data["user_id"],
            User.is_active == True
        ).first()
        
        if not user:
            logger.error(f"User with ID {authority_data['user_id']} not found")
            raise HTTPException(status_code=404, detail=f"User with ID {authority_data['user_id']} not found")
        
        # ตรวจสอบว่าผู้ใช้นี้ได้รับมอบหมายสิทธิ์ลงนามในหน่วยงานนี้อยู่แล้วหรือไม่
        existing = db.query(SignatureAuthority).filter(
            SignatureAuthority.user_id == authority_data["user_id"],
            SignatureAuthority.department_id == authority_data["department_id"],
            SignatureAuthority.is_active == True
        ).first()
        
        if existing:
            logger.warning(f"User {authority_data['user_id']} already assigned signature authority for department {authority_data['department_id']}")
            raise DuplicateKeyError(f"User already assigned signature authority for this department")
        
        # สร้างการมอบหมายสิทธิใหม่
        db_authority = SignatureAuthority(**authority_data)
        db.add(db_authority)
        db.commit()
        db.refresh(db_authority)
        
        logger.info(f"Assigned signature authority: User {db_authority.user_id} for department {db_authority.department_id}")
        
        # สร้างข้อมูลผลลัพธ์
        auth_dict = SignatureAuthoritySchema.model_validate(db_authority).model_dump()
        auth_dict["user_name"] = f"{user.first_name} {user.last_name}"
        auth_dict["department_name"] = department.name
        
        # เพิ่มข้อมูลตำแหน่งปัจจุบันของผู้ใช้
        user_position = db.query(UserPosition).filter(
            UserPosition.user_id == db_authority.user_id,
            UserPosition.is_primary == True,
            UserPosition.end_date == None
        ).options(joinedload(UserPosition.position)).first()
        
        if user_position and user_position.position:
            auth_dict["position_name"] = user_position.position.name
        else:
            auth_dict["position_name"] = None
        
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

def get_authorities_by_department(db: Session, department_id: UUID):
    """ดึงรายการผู้มีอำนาจลงนามตามหน่วยงาน"""
    try:
        # แก้ไขชื่อ field ให้ตรงกับโมเดล
        result = db.query(SignatureAuthority)\
            .options(joinedload(SignatureAuthority.user), joinedload(SignatureAuthority.department))\
            .filter(
                SignatureAuthority.department_id == department_id,
                SignatureAuthority.is_active == True
            )\
            .order_by(SignatureAuthority.created_at.desc())\
            .all()
        
        # แปลงข้อมูลเป็นรูปแบบที่ต้องการ
        formatted_authorities = []
        for authority in result:
            auth_dict = {
                "id": str(authority.id),
                "user": {
                    "id": str(authority.user_id),
                    "name": f"{authority.user.first_name} {authority.user.last_name}",
                    "email": authority.user.email
                },
                "department": {
                    "id": str(authority.department_id),
                    "name": authority.department.name
                },
                "is_active": authority.is_active,
                "start_date": authority.start_date,
                "end_date": authority.end_date,
                "created_at": authority.created_at,
                "updated_at": authority.updated_at
            }
            formatted_authorities.append(auth_dict)
        
        return formatted_authorities
    except Exception as e:
        logger.error(f"Error fetching authorities by department: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch authorities by department: {str(e)}"
        )

def remove_signature_authority(db: Session, authority_id: UUID):
    """ยกเลิกสิทธิการลงนามของผู้ใช้ (soft delete)"""
    try:
        # ตรวจสอบความถูกต้องของ ID
        if not authority_id:
            logger.error("Authority ID is missing")
            raise HTTPException(status_code=400, detail="Authority ID is required")
            
        if not isinstance(authority_id, UUID):
            try:
                authority_id = UUID(str(authority_id))
            except ValueError:
                logger.error(f"Invalid authority ID format: {authority_id}")
                raise HTTPException(status_code=400, detail="Invalid authority ID format")
                
        # ค้นหาข้อมูลสิทธิ์การลงนาม
        authority = db.query(SignatureAuthority).filter(
            SignatureAuthority.id == authority_id
        ).first()
        
        if not authority:
            logger.error(f"Authority with ID {authority_id} not found")
            return False
        
        # ทำการ soft delete
        authority.is_active = False
        authority.end_date = datetime.now()
        db.commit()
        
        logger.info(f"Removed signature authority with ID {authority_id}")
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing signature authority: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove signature authority: {str(e)}")
    
def get_available_users(db: Session, skip: int = 0, limit: int = 100):
    """รับรายการผู้ใช้ที่สามารถกำหนดเป็นผู้มีอำนาจลงนามได้"""
    try:
        # ดึงข้อมูลผู้ใช้ที่สถานะยังใช้งานอยู่
        users = db.query(User).filter(
            User.is_active == True
        ).order_by(User.first_name, User.last_name).offset(skip).limit(limit).all()
        
        result = []
        for user in users:
            # ดึงข้อมูลตำแหน่งปัจจุบันของผู้ใช้
            position_name = None
            department_name = None
            
            user_position = db.query(UserPosition).filter(
                UserPosition.user_id == user.id,
                UserPosition.is_primary == True,
                UserPosition.end_date == None
            ).options(joinedload(UserPosition.position)).first()
            
            if user_position and user_position.position:
                position_name = user_position.position.name
            
            # สามารถดึงข้อมูลหน่วยงานของผู้ใช้ได้ถ้ามีการเก็บข้อมูลในระบบ
            # (ปรับตามโครงสร้างข้อมูลจริง)
                
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
    """รับรายการหน่วยงานที่สามารถกำหนดผู้มีอำนาจลงนามได้"""
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
    
def get_users_with_signature_by_department_group(db: Session, skip: int = 0, limit: int = 100):
    """ดึงรายการผู้ใช้ที่มีอำนาจลงนามจัดกลุ่มตามกลุ่มหน่วยงาน"""
    try:
        # ดึงข้อมูลกลุ่มหน่วยงานทั้งหมดก่อน
        all_department_groups = db.query(DepartmentGroup).filter(
            DepartmentGroup.is_active == True
        ).all()
        
        # สร้าง dictionary เพื่อเก็บข้อมูลกลุ่มหน่วยงานทั้งหมด
        department_groups_dict = {}
        for group in all_department_groups:
            department_groups_dict[str(group.id)] = {
                "group_id": str(group.id),
                "group_name": group.name,
                "departments": []
            }
        
        # ดึงข้อมูลผู้มีอำนาจลงนามทั้งหมด
        authorities = db.query(SignatureAuthority)\
            .options(
                joinedload(SignatureAuthority.user),
                joinedload(SignatureAuthority.department).joinedload(Department.group)
            )\
            .filter(SignatureAuthority.is_active == True)\
            .all()
        
        # จัดกลุ่มตามผู้ใช้
        user_authorities = {}
        for auth in authorities:
            if not auth.user_id or not auth.department_id or not auth.department or not auth.department.group:
                continue
                
            # สร้าง key เป็น user_id
            user_id = str(auth.user_id)
            
            # เริ่มต้นข้อมูลผู้ใช้ถ้ายังไม่มี
            if user_id not in user_authorities:
                user_authorities[user_id] = {
                    "user_id": user_id,
                    "user_name": f"{auth.user.first_name} {auth.user.last_name}",
                    "email": auth.user.email,
                    "department_groups": {},
                    "total_departments": 0
                }
                
                # เพิ่มทุกกลุ่มหน่วยงานที่มีในระบบ
                for group_id, group_data in department_groups_dict.items():
                    user_authorities[user_id]["department_groups"][group_id] = {
                        "group_id": group_data["group_id"],
                        "group_name": group_data["group_name"],
                        "departments": []
                    }
            
            # เพิ่มข้อมูลตำแหน่งถ้ายังไม่มี
            if "position" not in user_authorities[user_id] or not user_authorities[user_id]["position"]:
                user_position = db.query(UserPosition).filter(
                    UserPosition.user_id == auth.user_id,
                    UserPosition.is_primary == True,
                    UserPosition.end_date == None
                ).options(joinedload(UserPosition.position)).first()
                
                if user_position and user_position.position:
                    user_authorities[user_id]["position"] = user_position.position.name
                else:
                    user_authorities[user_id]["position"] = None
            
            # จัดกลุ่มตามกลุ่มของหน่วยงาน
            group_id = str(auth.department.group_id)
            
            # เพิ่มข้อมูลหน่วยงาน
            user_authorities[user_id]["department_groups"][group_id]["departments"].append({
                "department_id": str(auth.department_id),
                "department_name": auth.department.name,
                "authority_id": str(auth.id),
                "start_date": auth.start_date,
                "end_date": auth.end_date
            })
            
            # เพิ่มจำนวนหน่วยงาน
            user_authorities[user_id]["total_departments"] += 1
        
        # แปลงจาก dict เป็น list และจัดรูปแบบผลลัพธ์สุดท้าย
        result = []
        for user_id, user_data in user_authorities.items():
            # แปลง department_groups จาก dict เป็น list และคำนวณจำนวนรวม
            department_groups = []
            for group_id, group_data in user_data["department_groups"].items():
                group_data["total_departments"] = len(group_data["departments"])
                department_groups.append(group_data)
            
            # จัดเรียงกลุ่มหน่วยงานตาม order_index (ตาม group_name ในกรณีนี้)
            department_groups.sort(key=lambda x: x["group_name"])
            
            # แทนที่ department_groups ด้วยรูปแบบที่จัดเรียงแล้ว
            user_data["department_groups"] = department_groups
            result.append(user_data)
        
        # จัดเรียงผู้ใช้ตามชื่อ
        result.sort(key=lambda x: x["user_name"])
        
        # จำกัดจำนวนผลลัพธ์
        result = result[skip:skip+limit]
        
        return result
    except Exception as e:
        logger.error(f"Error fetching users with signature by department group: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch users with signature by department group: {str(e)}"
        )