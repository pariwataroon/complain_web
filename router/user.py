from fastapi import APIRouter
from lib.format_data import format_response,FormatResponseModel
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


@router.post("/")
async def create_user():
    return {"message": "Create new user"}