from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List
from lib.format_data import format_response, FormatResponseModel

router = APIRouter(
    prefix="/test-errors",
    tags=["testing"]
) 

class TestItem(BaseModel):
    name: str = Field(..., min_length=3)
    value: int = Field(..., gt=0)
    tags: List[str] = []

@router.get("/validation-error")
async def test_validation_error(item: TestItem):
    # This will cause a validation error when called without proper query parameters
    return format_response("0000", item)

@router.get("/http-exception")
async def test_http_exception():
    # Simulate an HTTP exception
    raise HTTPException(status_code=404, detail="Item not found")

@router.get("/unhandled-exception")
async def test_unhandled_exception():
    # Simulate an unhandled exception
    raise ValueError("This is an unhandled exception")