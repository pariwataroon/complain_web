from fastapi import APIRouter
from config.dotenv import PREFIX

from router.user import router as user_router  

rootRouter = APIRouter(  
  prefix=PREFIX, 
)

rootRouter.include_router(user_router)