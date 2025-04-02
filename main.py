from Integrate.integrate_app import create_application
from fastapi import FastAPI
from router.root import rootRouter 

app = create_application()
app.include_router(rootRouter)
