from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException
from datetime import datetime
from sqlalchemy import func
from lib.logger import get_logger

from models.signature_authorities import SignatureAuthority
from models.group_signature_authorities import GroupSignatureAuthority
from models.departments import Department
from models.user import User
from models.user_positions import UserPosition
from models.department_groups import DepartmentGroup
from models.title import Title
from app.api.v1.schemas.signature_authority import SignatureAuthority as SignatureAuthoritySchema
from app.api.v1.schemas.group_signature_authority import (
    GroupSignatureAuthority as GroupSignatureAuthoritySchema,
    BulkSignatureAuthorityCreate
)

logger = get_logger("signature_authority_controller")

class DuplicateKeyError(Exception):
    pass

def get_signature_authorities(db: Session, skip: int = 0, limit: int = 100):
    """ดึงรายการผู้มีอำนาจลงนามทั้งหมด จัดกลุ่มตาม group_signature_authorities_id"""
    try:
        # ดึงข้อมูลทั้งหมดพร้อม relationships
        result = db.query(SignatureAuthority)\
            .options(
                joinedload(SignatureAuthority.user).joinedload(User.title), 
                joinedload(SignatureAuthority.department),
                joinedload(SignatureAuthority.group)
            )\
            .filter(SignatureAuthority.is_active == True)\
            .order_by(SignatureAuthority.created_at.desc())\
            .offset(skip).limit(limit).all()
        
        # จัดกลุ่มข้อมูล
        grouped_authorities = {}
        individual_authorities = []
        
        for authority in result:
            if authority.group_signature_authorities_id:
                # มีกลุ่ม - จัดกลุ่ม
                group_id = str(authority.group_signature_authorities_id)
                if group_id not in grouped_authorities:
                    grouped_authorities[group_id] = {
                        "group_id": group_id,
                        "group_name": authority.group.name if authority.group else "Unknown Group",
                        "group_description": authority.group.description if authority.group else "",
                        "is_active": authority.group.is_active if authority.group else False,
                        "created_at": authority.group.created_at if authority.group else authority.created_at,
                        "updated_at": authority.group.updated_at if authority.group else authority.updated_at,
                        "users": [],
                        "departments": [],
                        "total_members": 0,
                        "total_departments": 0
                    }
                
                # เพิ่มผู้ใช้ (ไม่ซ้ำ)
                prefix = ""
                if authority.user.title and authority.user.title.short_name:
                    prefix = authority.user.title.short_name
                elif authority.user.prefix_other:
                    prefix = authority.user.prefix_other
                
                user_name = f"{prefix} {authority.user.first_name} {authority.user.last_name}".strip()
                
                user_info = {
                    "user_id": str(authority.user_id),
                    "user_name": user_name,
                    "user_email": authority.user.email,
                    "user_is_active": authority.user.is_active
                }
                
                if not any(u["user_id"] == user_info["user_id"] for u in grouped_authorities[group_id]["users"]):
                    grouped_authorities[group_id]["users"].append(user_info)
                
                # เพิ่มหน่วยงาน (ไม่ซ้ำ)
                dept_info = {
                    "department_id": str(authority.department_id),
                    "department_name": authority.department.name,
                    "department_is_active": authority.department.is_active
                }
                
                if not any(d["department_id"] == dept_info["department_id"] for d in grouped_authorities[group_id]["departments"]):
                    grouped_authorities[group_id]["departments"].append(dept_info)
                
            else:
                # ไม่มีกลุ่ม - เป็นรายบุคคล
                prefix = ""
                if authority.user.title and authority.user.title.short_name:
                    prefix = authority.user.title.short_name
                elif authority.user.prefix_other:
                    prefix = authority.user.prefix_other
                
                user_name = f"{prefix} {authority.user.first_name} {authority.user.last_name}".strip()
                
                auth_dict = {
                    "id": str(authority.id),
                    "type": "individual",
                    "user": {
                        "id": str(authority.user_id),
                        "name": user_name,
                        "email": authority.user.email,
                        "is_active": authority.user.is_active
                    },
                    "department": {
                        "id": str(authority.department_id),
                        "name": authority.department.name,
                        "is_active": authority.department.is_active
                    },
                    "is_active": authority.is_active,
                    "start_date": authority.start_date,
                    "end_date": authority.end_date,
                    "created_at": authority.created_at,
                    "updated_at": authority.updated_at
                }
                individual_authorities.append(auth_dict)
        
        # คำนวณจำนวน
        for group_id, group_data in grouped_authorities.items():
            group_data["total_members"] = len(group_data["users"])
            group_data["total_departments"] = len(group_data["departments"])
        
        # รวมผลลัพธ์
        final_result = {
            "groups": list(grouped_authorities.values()),
            "individuals": individual_authorities,
            "summary": {
                "total_groups": len(grouped_authorities),
                "total_individuals": len(individual_authorities),
                "total_records": len(result)
            }
        }
        
        return final_result
        
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
        user = db.query(User).options(joinedload(User.title)).filter(
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
        
        # สร้าง user_name พร้อม prefix
        prefix = ""
        if user.title and user.title.short_name:
            prefix = user.title.short_name
        elif user.prefix_other:
            prefix = user.prefix_other
            
        user_name = f"{prefix} {user.first_name} {user.last_name}".strip()
        auth_dict["user_name"] = user_name
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
            .options(
                joinedload(SignatureAuthority.user).joinedload(User.title), 
                joinedload(SignatureAuthority.department)
            )\
            .filter(
                SignatureAuthority.department_id == department_id,
                SignatureAuthority.is_active == True
            )\
            .order_by(SignatureAuthority.created_at.desc())\
            .all()
        
        # แปลงข้อมูลเป็นรูปแบบที่ต้องการ
        formatted_authorities = []
        for authority in result:
            # สร้าง user_name พร้อม prefix
            prefix = ""
            if authority.user.title and authority.user.title.short_name:
                prefix = authority.user.title.short_name
            elif authority.user.prefix_other:
                prefix = authority.user.prefix_other
                
            user_name = f"{prefix} {authority.user.first_name} {authority.user.last_name}".strip()
            
            auth_dict = {
                "id": str(authority.id),
                "user": {
                    "id": str(authority.user_id),
                    "name": user_name,
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
        users = db.query(User).options(joinedload(User.title)).filter(
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
            
            # สร้าง user_name พร้อม prefix
            prefix = ""
            if user.title and user.title.short_name:
                prefix = user.title.short_name
            elif user.prefix_other:
                prefix = user.prefix_other
                
            user_name = f"{prefix} {user.first_name} {user.last_name}".strip()
                
            result.append({
                "id": user.id,
                "name": user_name,
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

def create_bulk_signature_authorities(db: Session, bulk_data: dict):
    """สร้างกลุ่มผู้ลงนามพร้อมสมาชิกหลายคนในครั้งเดียว"""
    try:
        # 1. สร้างกลุ่มผู้ลงนามก่อน
        group_data = {
            "name": bulk_data["group_name"],
            "description": bulk_data.get("group_description", ""),
            "is_active": True
        }
        
        db_group = GroupSignatureAuthority(**group_data)
        db.add(db_group)
        db.commit()
        db.refresh(db_group)
        
        logger.info(f"Created signature authority group: {db_group.name} with ID {db_group.id}")
        
        # 2. ตรวจสอบข้อมูลผู้ใช้และหน่วยงาน
        user_ids = bulk_data["user_ids"]
        department_ids = bulk_data["department_ids"]
        
        # ตรวจสอบผู้ใช้
        users = db.query(User).filter(
            User.id.in_(user_ids),
            User.is_active == True
        ).all()
        
        if len(users) != len(user_ids):
            found_ids = [str(u.id) for u in users]
            missing_ids = [str(uid) for uid in user_ids if str(uid) not in found_ids]
            raise HTTPException(
                status_code=400, 
                detail=f"Users not found: {missing_ids}"
            )
        
        # ตรวจสอบหน่วยงาน
        departments = db.query(Department).filter(
            Department.id.in_(department_ids),
            Department.is_active == True
        ).all()
        
        if len(departments) != len(department_ids):
            found_ids = [str(d.id) for d in departments]
            missing_ids = [str(did) for did in department_ids if str(did) not in found_ids]
            raise HTTPException(
                status_code=400, 
                detail=f"Departments not found: {missing_ids}"
            )
        
        # 3. สร้างการมอบหมายสิทธิ์ทั้งหมด (user x department combinations)
        created_authorities = []
        
        for user_id in user_ids:
            for department_id in department_ids:
                # ตรวจสอบว่าเคยมีการมอบหมายแล้วหรือไม่
                existing = db.query(SignatureAuthority).filter(
                    SignatureAuthority.user_id == user_id,
                    SignatureAuthority.department_id == department_id,
                    SignatureAuthority.is_active == True
                ).first()
                
                if not existing:
                    authority_data = {
                        "user_id": user_id,
                        "department_id": department_id,
                        "group_signature_authorities_id": db_group.id,
                        "start_date": bulk_data.get("start_date"),
                        "end_date": bulk_data.get("end_date"),
                        "is_active": True
                    }
                    
                    db_authority = SignatureAuthority(**authority_data)
                    db.add(db_authority)
                    created_authorities.append(db_authority)
                else:
                    # อัปเดตให้อยู่ในกลุ่มใหม่
                    existing.group_signature_authorities_id = db_group.id
                    created_authorities.append(existing)
        
        db.commit()
        
        # 4. สร้างผลลัพธ์
        result = {
            "group_id": str(db_group.id),
            "group_name": db_group.name,
            "group_description": db_group.description,
            "total_assignments": len(created_authorities),
            "users": [
                {
                    "id": str(user.id),
                    "name": f"{user.first_name} {user.last_name}",
                    "email": user.email
                } for user in users
            ],
            "departments": [
                {
                    "id": str(dept.id),
                    "name": dept.name
                } for dept in departments
            ],
            "created_at": db_group.created_at
        }
        
        logger.info(f"Created {len(created_authorities)} signature authorities for group {db_group.name}")
        
        return result
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating bulk signature authorities: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create bulk signature authorities: {str(e)}"
        )

def get_signature_authority_groups(db: Session, skip: int = 0, limit: int = 100):
    """ดึงรายการกลุ่มผู้ลงนามทั้งหมด"""
    try:
        groups = db.query(GroupSignatureAuthority)\
            .filter(GroupSignatureAuthority.is_active == True)\
            .order_by(GroupSignatureAuthority.created_at.desc())\
            .offset(skip).limit(limit).all()
        
        result = []
        for group in groups:
            # นับจำนวนสมาชิกในกลุ่ม
            total_members = db.query(func.count(func.distinct(SignatureAuthority.user_id)))\
                .filter(
                    SignatureAuthority.group_signature_authorities_id == group.id,
                    SignatureAuthority.is_active == True
                ).scalar()
            
            # นับจำนวนหน่วยงาน
            total_departments = db.query(func.count(func.distinct(SignatureAuthority.department_id)))\
                .filter(
                    SignatureAuthority.group_signature_authorities_id == group.id,
                    SignatureAuthority.is_active == True
                ).scalar()
            
            group_dict = {
                "id": str(group.id),
                "name": group.name,
                "description": group.description,
                "is_active": group.is_active,
                "total_members": total_members,
                "total_departments": total_departments,
                "created_at": group.created_at,
                "updated_at": group.updated_at
            }
            result.append(group_dict)
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching signature authority groups: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch signature authority groups: {str(e)}"
        )

def create_signature_authority_group(db: Session, group_data: dict):
    """สร้างกลุ่มผู้ลงนามพร้อมการมอบหมายแบบใหม่ (ไม่กระทบ bulk endpoint เดิม)"""
    try:
        # ตรวจสอบว่ามีชื่อกลุ่มซ้ำหรือไม่
        existing_group = db.query(GroupSignatureAuthority).filter(
            GroupSignatureAuthority.name == group_data["group_name"],
            GroupSignatureAuthority.is_active == True
        ).first()
        
        if existing_group:
            raise HTTPException(
                status_code=400,
                detail=f"Group name '{group_data['group_name']}' already exists. Use PUT to update existing group."
            )
        
        # สร้างกลุ่มใหม่
        db_group = GroupSignatureAuthority(
            name=group_data["group_name"],
            description=group_data.get("description", ""),
            is_active=True
        )
        
        db.add(db_group)
        db.flush()  # เพื่อให้ได้ ID ของกลุ่มที่สร้างขึ้น
        
        created_assignments = []
        
        # สร้างการมอบหมายสำหรับแต่ละผู้ใช้
        if "assignments" in group_data:
            for assignment in group_data["assignments"]:
                user_id = assignment["user_id"]
                department_ids = assignment["department_ids"]
                
                # ตรวจสอบรูปแบบ UUID ของ user_id
                try:
                    if isinstance(user_id, str):
                        # ตรวจสอบว่าไม่ใช่ placeholder
                        if user_id.startswith("{{") and user_id.endswith("}}"):
                            raise HTTPException(
                                status_code=400,
                                detail=f"Invalid user_id format: {user_id} (placeholder detected)"
                            )
                        user_id = UUID(user_id)
                    elif not isinstance(user_id, UUID):
                        user_id = UUID(str(user_id))
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid user_id format: {user_id}"
                    )
                
                # ตรวจสอบว่าผู้ใช้มีอยู่จริง
                user = db.query(User).filter(
                    User.id == user_id,
                    User.is_active == True
                ).first()
                
                if not user:
                    raise HTTPException(
                        status_code=404,
                        detail=f"User with ID {user_id} not found"
                    )
                
                # สร้างการมอบหมายสำหรับแต่ละหน่วยงาน
                for dept_id in department_ids:
                    # ตรวจสอบรูปแบบ UUID ของ department_id
                    try:
                        if isinstance(dept_id, str):
                            # ตรวจสอบว่าไม่ใช่ placeholder
                            if dept_id.startswith("{{") and dept_id.endswith("}}"):
                                raise HTTPException(
                                    status_code=400,
                                    detail=f"Invalid department_id format: {dept_id} (placeholder detected)"
                                )
                            dept_id = UUID(dept_id)
                        elif not isinstance(dept_id, UUID):
                            dept_id = UUID(str(dept_id))
                    except ValueError:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid department_id format: {dept_id}"
                        )
                    
                    # ตรวจสอบว่าหน่วยงานมีอยู่จริง
                    department = db.query(Department).filter(
                        Department.id == dept_id,
                        Department.is_active == True
                    ).first()
                    
                    if not department:
                        raise HTTPException(
                            status_code=404,
                            detail=f"Department with ID {dept_id} not found"
                        )
                    
                    # ตรวจสอบว่ามีการมอบหมายซ้ำหรือไม่
                    existing = db.query(SignatureAuthority).filter(
                        SignatureAuthority.user_id == user_id,
                        SignatureAuthority.department_id == dept_id,
                        SignatureAuthority.is_active == True
                    ).first()
                    
                    if existing:
                        # อัปเดตการมอบหมายที่มีอยู่ให้เป็นของกลุ่มใหม่
                        existing.group_signature_authorities_id = db_group.id
                        existing.updated_at = func.now()
                        created_assignments.append({
                            "id": str(existing.id),
                            "user_id": str(existing.user_id),
                            "department_id": str(existing.department_id),
                            "status": "updated"
                        })
                    else:
                        # สร้างการมอบหมายใหม่
                        new_assignment = SignatureAuthority(
                            user_id=user_id,
                            department_id=dept_id,
                            group_signature_authorities_id=db_group.id,
                            is_active=True
                        )
                        db.add(new_assignment)
                        db.flush()
                        
                        created_assignments.append({
                            "id": str(new_assignment.id),
                            "user_id": str(new_assignment.user_id),
                            "department_id": str(new_assignment.department_id),
                            "status": "created"
                        })
        
        db.commit()
        
        logger.info(f"Successfully created signature authority group: {db_group.name} with ID {db_group.id}")
        
        return {
            "id": str(db_group.id),
            "group_name": db_group.name,
            "description": db_group.description,
            "assignments": created_assignments,
            "created_at": db_group.created_at,
            "updated_at": db_group.updated_at
        }
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating signature authority group: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create signature authority group: {str(e)}"
        )

def get_signature_authority_group_by_id(db: Session, group_id: UUID):
    """ดึงข้อมูลกลุ่มผู้มีอำนาจลงนามตาม ID พร้อมรายละเอียดสมาชิก"""
    try:
        # ค้นหากลุ่ม
        group = db.query(GroupSignatureAuthority).filter(
            GroupSignatureAuthority.id == group_id,
            GroupSignatureAuthority.is_active == True
        ).first()
        
        if not group:
            raise HTTPException(
                status_code=404,
                detail=f"Signature authority group with ID {group_id} not found"
            )
        
        # ดึงข้อมูลการมอบหมายในกลุ่ม
        assignments = db.query(SignatureAuthority)\
            .options(
                joinedload(SignatureAuthority.user),
                joinedload(SignatureAuthority.department).joinedload(Department.group)
            )\
            .filter(
                SignatureAuthority.group_signature_authorities_id == group_id,
                SignatureAuthority.is_active == True
            )\
            .all()
        
        # จัดกลุ่มข้อมูลตามผู้ใช้
        users_data = {}
        departments_data = {}
        
        for assignment in assignments:
            user_id = str(assignment.user_id)
            dept_id = str(assignment.department_id)
            
            # เก็บข้อมูลผู้ใช้
            if user_id not in users_data:
                users_data[user_id] = {
                    "user_id": user_id,
                    "user_name": f"{assignment.user.first_name} {assignment.user.last_name}",
                    "user_email": assignment.user.email,
                    "user_is_active": assignment.user.is_active,
                    "department_ids": [],
                    "departments": []  # เพิ่มข้อมูลหน่วยงานแบบละเอียด
                }
            
            # เพิ่ม department_id และข้อมูลหน่วยงานแบบละเอียด
            users_data[user_id]["department_ids"].append(dept_id)
            users_data[user_id]["departments"].append({
                "department_id": dept_id,
                "department_name": assignment.department.name,
                "department_description": getattr(assignment.department, 'short_name', ''),
                "department_is_active": assignment.department.is_active,
                "group_id": str(assignment.department.group_id) if assignment.department.group_id else None,
                "group_name": assignment.department.group.name if assignment.department.group else None
            })
            
            # เก็บข้อมูลหน่วยงาน
            if dept_id not in departments_data:
                departments_data[dept_id] = {
                    "department_id": dept_id,
                    "department_name": assignment.department.name,
                    "department_description": getattr(assignment.department, 'short_name', ''),
                    "department_is_active": assignment.department.is_active,
                    "group_id": str(assignment.department.group_id) if assignment.department.group_id else None,
                    "group_name": assignment.department.group.name if assignment.department.group else None
                }
        
        # สร้างรูปแบบ assignments ที่เหมาะสำหรับการแก้ไขพร้อมข้อมูลหน่วยงาน
        formatted_assignments = []
        for user_data in users_data.values():
            # สร้าง departments สำหรับ assignment
            assignment_departments = []
            for dept_id in user_data["department_ids"]:
                dept_info = departments_data[dept_id]
                assignment_departments.append({
                    "department_id": dept_id,
                    "department_name": dept_info["department_name"],
                    "department_description": dept_info["department_description"],
                    "group_id": dept_info["group_id"],
                    "group_name": dept_info["group_name"]
                })
            
            formatted_assignments.append({
                "user_id": user_data["user_id"],
                "department_ids": user_data["department_ids"],
                "departments": assignment_departments  # เพิ่มข้อมูลหน่วยงานแบบละเอียด
            })
        
        result = {
            "id": str(group.id),
            "group_name": group.name,
            "description": group.description,
            "is_active": group.is_active,
            "assignments": formatted_assignments,
            "users": list(users_data.values()),
            "departments": list(departments_data.values()),
            "total_members": len(users_data),
            "total_departments": len(departments_data),
            "total_assignments": len(assignments),
            "created_at": group.created_at,
            "updated_at": group.updated_at
        }
        
        return result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching signature authority group by ID: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch signature authority group: {str(e)}"
        )

def update_signature_authority_group(db: Session, group_id: UUID, group_data: dict):
    """อัปเดตกลุ่มผู้มีอำนาจลงนาม"""
    try:
        # ค้นหากลุ่มที่ต้องการอัปเดต
        db_group = db.query(GroupSignatureAuthority).filter(
            GroupSignatureAuthority.id == group_id,
            GroupSignatureAuthority.is_active == True
        ).first()
        
        if not db_group:
            raise HTTPException(
                status_code=404,
                detail=f"Signature authority group with ID {group_id} not found"
            )
        
        # ตรวจสอบชื่อซ้ำ (ยกเว้นกลุ่มปัจจุบัน)
        if "group_name" in group_data:
            existing_group = db.query(GroupSignatureAuthority).filter(
                GroupSignatureAuthority.name == group_data["group_name"],
                GroupSignatureAuthority.is_active == True,
                GroupSignatureAuthority.id != group_id
            ).first()
            
            if existing_group:
                raise HTTPException(
                    status_code=400,
                    detail=f"Group name '{group_data['group_name']}' already exists"
                )
            
            db_group.name = group_data["group_name"]
        
        # อัปเดตคำอธิบาย
        if "description" in group_data:
            db_group.description = group_data["description"]
        
        db_group.updated_at = func.now()
        
        # อัปเดตการมอบหมาย
        updated_assignments = []
        
        if "assignments" in group_data:
            # ลบการมอบหมายเดิมทั้งหมดในกลุ่มนี้
            existing_assignments = db.query(SignatureAuthority).filter(
                SignatureAuthority.group_signature_authorities_id == group_id,
                SignatureAuthority.is_active == True
            ).all()
            
            for assignment in existing_assignments:
                assignment.is_active = False
                assignment.end_date = datetime.now()
            
            # สร้างการมอบหมายใหม่
            for assignment in group_data["assignments"]:
                user_id = assignment["user_id"]
                department_ids = assignment["department_ids"]
                
                # ตรวจสอบรูปแบบ UUID ของ user_id
                try:
                    if isinstance(user_id, str):
                        if user_id.startswith("{{") and user_id.endswith("}}"):
                            raise HTTPException(
                                status_code=400,
                                detail=f"Invalid user_id format: {user_id} (placeholder detected)"
                            )
                        user_id = UUID(user_id)
                    elif not isinstance(user_id, UUID):
                        user_id = UUID(str(user_id))
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid user_id format: {user_id}"
                    )
                
                # ตรวจสอบว่าผู้ใช้มีอยู่จริง
                user = db.query(User).filter(
                    User.id == user_id,
                    User.is_active == True
                ).first()
                
                if not user:
                    raise HTTPException(
                        status_code=404,
                        detail=f"User with ID {user_id} not found"
                    )
                
                # สร้างการมอบหมายสำหรับแต่ละหน่วยงาน
                for dept_id in department_ids:
                    # ตรวจสอบรูปแบบ UUID ของ department_id
                    try:
                        if isinstance(dept_id, str):
                            if dept_id.startswith("{{") and dept_id.endswith("}}"):
                                raise HTTPException(
                                    status_code=400,
                                    detail=f"Invalid department_id format: {dept_id} (placeholder detected)"
                                )
                            dept_id = UUID(dept_id)
                        elif not isinstance(dept_id, UUID):
                            dept_id = UUID(str(dept_id))
                    except ValueError:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid department_id format: {dept_id}"
                        )
                    
                    # ตรวจสอบว่าหน่วยงานมีอยู่จริง
                    department = db.query(Department).filter(
                        Department.id == dept_id,
                        Department.is_active == True
                    ).first()
                    
                    if not department:
                        raise HTTPException(
                            status_code=404,
                            detail=f"Department with ID {dept_id} not found"
                        )
                    
                    # สร้างการมอบหมายใหม่
                    new_assignment = SignatureAuthority(
                        user_id=user_id,
                        department_id=dept_id,
                        group_signature_authorities_id=group_id,
                        is_active=True
                    )
                    db.add(new_assignment)
                    db.flush()
                    
                    updated_assignments.append({
                        "id": str(new_assignment.id),
                        "user_id": str(new_assignment.user_id),
                        "department_id": str(new_assignment.department_id),
                        "status": "created"
                    })
        
        db.commit()
        
        logger.info(f"Successfully updated signature authority group: {db_group.name} with ID {db_group.id}")
        
        return {
            "id": str(db_group.id),
            "group_name": db_group.name,
            "description": db_group.description,
            "assignments": updated_assignments,
            "total_assignments": len(updated_assignments),
            "created_at": db_group.created_at,
            "updated_at": db_group.updated_at
        }
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating signature authority group: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update signature authority group: {str(e)}"
        )