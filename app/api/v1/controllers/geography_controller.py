from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from sqlalchemy import func

from models.comp_geographies import Geography
from models.comp_provinces import Province
from models.comp_amphures import Amphure
from models.comp_districts import District


class DuplicateKeyError(Exception):
    pass


def model_to_dict(obj):
    """Convert SQLAlchemy model instance to dictionary, removing SQLAlchemy-specific attributes"""
    data = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    return data


def get_geographies(db: Session, skip: int = 0, limit: int = 100):
    """Get all geographies"""
    geographies = db.query(Geography).order_by(Geography.id).offset(skip).limit(limit).all()
    return [model_to_dict(geography) for geography in geographies]


def get_geography_by_id(db: Session, geography_id: int):
    """Get a geography by ID"""
    geography = db.query(Geography).filter(Geography.id == geography_id).first()
    if geography:
        return model_to_dict(geography)
    return None


def create_geography(db: Session, geography_data: Dict[str, Any]):
    """Create a new geography"""
    try:
        db_geography = Geography(**geography_data)
        db.add(db_geography)
        db.commit()
        db.refresh(db_geography)
        return model_to_dict(db_geography)
    except IntegrityError as e:
        db.rollback()
        if "duplicate key" in str(e).lower():
            raise DuplicateKeyError(f"Geography with this name already exists")
        raise e


def update_geography(db: Session, geography_id: int, geography_data: Dict[str, Any]):
    """Update a geography"""
    try:
        db_geography = db.query(Geography).filter(Geography.id == geography_id).first()
        if db_geography is None:
            return None
            
        for key, value in geography_data.items():
            setattr(db_geography, key, value)
            
        db.commit()
        db.refresh(db_geography)
        return model_to_dict(db_geography)
    except IntegrityError as e:
        db.rollback()
        if "duplicate key" in str(e).lower():
            raise DuplicateKeyError(f"Geography with this name already exists")
        raise e


def delete_geography(db: Session, geography_id: int):
    """Delete a geography"""
    db_geography = db.query(Geography).filter(Geography.id == geography_id).first()
    if db_geography is None:
        return False
        
    db.delete(db_geography)
    db.commit()
    return True


def get_provinces(db: Session, skip: int = 0, limit: int = 100):
    """Get all provinces"""
    provinces = db.query(Province).order_by(Province.id).offset(skip).limit(limit).all()
    return [model_to_dict(province) for province in provinces]


def get_province_by_id(db: Session, province_id: int):
    """Get a province by ID"""
    province = db.query(Province).filter(Province.id == province_id).first()
    if province:
        return model_to_dict(province)
    return None


def get_provinces_by_geography(db: Session, geography_id: int, skip: int = 0, limit: int = 100):
    """Get provinces by geography ID"""
    provinces = db.query(Province).filter(Province.geography_id == geography_id).order_by(Province.id).offset(skip).limit(limit).all()
    return [model_to_dict(province) for province in provinces]


def create_province(db: Session, province_data: Dict[str, Any]):
    """Create a new province"""
    try:
        db_province = Province(**province_data)
        db.add(db_province)
        db.commit()
        db.refresh(db_province)
        return model_to_dict(db_province)
    except IntegrityError as e:
        db.rollback()
        if "duplicate key" in str(e).lower():
            raise DuplicateKeyError(f"Province with this code already exists")
        raise e


def update_province(db: Session, province_id: int, province_data: Dict[str, Any]):
    """Update a province"""
    try:
        db_province = db.query(Province).filter(Province.id == province_id).first()
        if db_province is None:
            return None
            
        for key, value in province_data.items():
            setattr(db_province, key, value)
            
        db.commit()
        db.refresh(db_province)
        return model_to_dict(db_province)
    except IntegrityError as e:
        db.rollback()
        if "duplicate key" in str(e).lower():
            raise DuplicateKeyError(f"Province with this code already exists")
        raise e


def delete_province(db: Session, province_id: int):
    """Delete a province"""
    db_province = db.query(Province).filter(Province.id == province_id).first()
    if db_province is None:
        return False
        
    db.delete(db_province)
    db.commit()
    return True


def get_amphures(db: Session, skip: int = 0, limit: int = 100):
    """Get all amphures"""
    amphures = db.query(Amphure).order_by(Amphure.id).offset(skip).limit(limit).all()
    return [model_to_dict(amphure) for amphure in amphures]


def get_amphure_by_id(db: Session, amphure_id: int):
    """Get an amphure by ID"""
    amphure = db.query(Amphure).filter(Amphure.id == amphure_id).first()
    if amphure:
        return model_to_dict(amphure)
    return None


def get_amphures_by_province(db: Session, province_id: int, skip: int = 0, limit: int = 100):
    """Get amphures by province ID"""
    amphures = db.query(Amphure).filter(Amphure.province_id == province_id).order_by(Amphure.id).offset(skip).limit(limit).all()
    return [model_to_dict(amphure) for amphure in amphures]


def create_amphure(db: Session, amphure_data: Dict[str, Any]):
    """Create a new amphure"""
    try:
        db_amphure = Amphure(**amphure_data)
        db.add(db_amphure)
        db.commit()
        db.refresh(db_amphure)
        return model_to_dict(db_amphure)
    except IntegrityError as e:
        db.rollback()
        if "duplicate key" in str(e).lower():
            raise DuplicateKeyError(f"Amphure with this code already exists")
        raise e


def update_amphure(db: Session, amphure_id: int, amphure_data: Dict[str, Any]):
    """Update an amphure"""
    try:
        db_amphure = db.query(Amphure).filter(Amphure.id == amphure_id).first()
        if db_amphure is None:
            return None
            
        for key, value in amphure_data.items():
            setattr(db_amphure, key, value)
            
        db.commit()
        db.refresh(db_amphure)
        return model_to_dict(db_amphure)
    except IntegrityError as e:
        db.rollback()
        if "duplicate key" in str(e).lower():
            raise DuplicateKeyError(f"Amphure with this code already exists")
        raise e


def delete_amphure(db: Session, amphure_id: int):
    """Delete an amphure"""
    db_amphure = db.query(Amphure).filter(Amphure.id == amphure_id).first()
    if db_amphure is None:
        return False
        
    db.delete(db_amphure)
    db.commit()
    return True


def get_districts(db: Session, skip: int = 0, limit: int = 100):
    """Get all districts"""
    districts = db.query(District).order_by(District.id).offset(skip).limit(limit).all()
    return [model_to_dict(district) for district in districts]


def get_district_by_id(db: Session, district_id: str):
    """Get a district by ID"""
    district = db.query(District).filter(District.id == district_id).first()
    if district:
        return model_to_dict(district)
    return None


def get_districts_by_amphure(db: Session, amphure_id: int, skip: int = 0, limit: int = 100):
    """Get districts by amphure ID"""
    districts = db.query(District).filter(District.amphure_id == amphure_id).order_by(District.id).offset(skip).limit(limit).all()
    return [model_to_dict(district) for district in districts]


def create_district(db: Session, district_data: Dict[str, Any]):
    """Create a new district"""
    try:
        db_district = District(**district_data)
        db.add(db_district)
        db.commit()
        db.refresh(db_district)
        return model_to_dict(db_district)
    except IntegrityError as e:
        db.rollback()
        if "duplicate key" in str(e).lower():
            raise DuplicateKeyError(f"District with this ID already exists")
        raise e


def update_district(db: Session, district_id: str, district_data: Dict[str, Any]):
    """Update a district"""
    try:
        db_district = db.query(District).filter(District.id == district_id).first()
        if db_district is None:
            return None
            
        for key, value in district_data.items():
            setattr(db_district, key, value)
            
        db.commit()
        db.refresh(db_district)
        return model_to_dict(db_district)
    except IntegrityError as e:
        db.rollback()
        if "duplicate key" in str(e).lower():
            raise DuplicateKeyError(f"District with this ID already exists")
        raise e


def delete_district(db: Session, district_id: str):
    """Delete a district"""
    db_district = db.query(District).filter(District.id == district_id).first()
    if db_district is None:
        return False
        
    db.delete(db_district)
    db.commit()
    return True


def get_geography_stats(db: Session):
    """Get statistics about geographical data"""
    geographies_count = db.query(func.count(Geography.id)).scalar()
    provinces_count = db.query(func.count(Province.id)).scalar()
    amphures_count = db.query(func.count(Amphure.id)).scalar()
    districts_count = db.query(func.count(District.id)).scalar()
    
    return {
        "geographies": geographies_count,
        "provinces": provinces_count,
        "amphures": amphures_count,
        "districts": districts_count
    }


def get_locations_by_zipcode(db: Session, zipcode: int):
    """Get all locations (districts) by zipcode"""
    districts = db.query(District).filter(District.zip_code == zipcode).all()
    
    results = []
    for district in districts:
        amphure = db.query(Amphure).filter(Amphure.id == district.amphure_id).first()
        province = None
        if amphure:
            province = db.query(Province).filter(Province.id == amphure.province_id).first()
        
        results.append({
            "district": {
                "id": district.id,
                "name_th": district.name_th,
                "name_en": district.name_en,
                "zip_code": district.zip_code
            },
            "amphure": {
                "id": amphure.id,
                "name_th": amphure.name_th,
                "name_en": amphure.name_en
            } if amphure else None,
            "province": {
                "id": province.id,
                "name_th": province.name_th,
                "name_en": province.name_en
            } if province else None
        })
    
    return results