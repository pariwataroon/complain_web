from fastapi import APIRouter, HTTPException
from lib.format_data import format_response, FormatResponseModel

router = APIRouter(
    prefix="/users",
    tags=["users"]
) 

@router.get("/")
async def get_users() -> FormatResponseModel:
    users = ["user1", "user2"]
    return format_response(
        "0000",
        users
    )

@router.get("/{user_id}")
async def get_user(user_id: str) -> FormatResponseModel:
    # Simulate looking up a user
    if user_id not in ["user1", "user2"]:
        # Just raise the exception - no try/catch needed
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    
    # Normal successful response
    return format_response(
        "0000",
        {"id": user_id, "name": f"User {user_id}"}
    )

@router.post("/")
async def create_user():
    return {"message": "Create new user"}