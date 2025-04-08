from Integrate.integrate_app import create_application
from fastapi import FastAPI
from router.root import rootRouter 
from router import test_errors

app = create_application()

# Include routers
app.include_router(rootRouter)

# Include test errors router for testing purposes
app.include_router(test_errors.router)
