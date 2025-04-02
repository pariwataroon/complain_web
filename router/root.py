from fastapi import APIRouter
from config.dotenv import prefix

from router.user import router as user_router  

rootRouter = APIRouter(  
  prefix=prefix, 
)

rootRouter.include_router(user_router)