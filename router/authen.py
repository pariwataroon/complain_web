from fastapi import APIRouter

router = APIRouter(
    prefix="/auth",  
    tags=["auth"]   
) 

@router.post("/login")
def get_users():
    return {"message": "Get all users"}

@router.post("/register")
def create_user():
    return {"message": "Create new user"}