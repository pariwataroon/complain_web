from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.api.v1.controllers.auth_controller as auth_controller
import app.api.v1.schemas.user as schemas
import lib.format_data as format_data
from config.database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)


@router.post("/login", response_model=format_data.FormatResponseModel)
async def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = auth_controller.authenticate_user(db, user.citizen_id, user.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    assass_token = auth_controller.create_access_token({"sub": str(db_user.id)})
    refresh_token = auth_controller.create_refresh_token({"sub": str(db_user.id)})
    auth_controller.refresh_access_token_mapping(db, db_user.id, assass_token, refresh_token)
    return format_data.format_response("0000", {"access_token": assass_token, "refresh_token": refresh_token})
