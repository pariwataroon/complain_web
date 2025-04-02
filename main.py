from fastapi import FastAPI
from router.root import rootRouter 

app = FastAPI() 
app.include_router(rootRouter)
