from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from config.database import get_db
from app.api.v1.schemas.user import UserCreate, UserResponse, UserUpdate
from app.api.v1.middlewares.user_middleware import create_user, get_user, get_users, update_user, delete_user, DuplicateKeyError
from lib.format_data import format_response, FormatResponseModel

router = APIRouter(
    prefix="/users",
    tags=["users"]
) 

@router.get("/", response_model=FormatResponseModel)
async def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = get_users(db, skip=skip, limit=limit)
    return format_response("0000", users)

@router.get("/{user_id}", response_model=FormatResponseModel)
async def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    return format_response("0000", db_user)

@router.post("/", response_model=FormatResponseModel)
async def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        result = create_user(db, user)
        return format_response("0001", result)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})

@router.put("/{user_id}", response_model=FormatResponseModel)
async def update_existing_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    updated_user = update_user(db, user_id, user)
    if updated_user is None:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    return format_response("0002", updated_user)

@router.delete("/{user_id}", response_model=FormatResponseModel)
async def delete_existing_user(user_id: int, db: Session = Depends(get_db)):
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    return format_response("0003", {"id": user_id})