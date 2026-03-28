from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
import uvicorn
import swagger_ui_bundle

# Import routers
from src.controllers.health_controller import router as health_router
from src.controllers.example_controller import router as example_router
from src.controllers.user_controller import router as user_router
from src.controllers.node_controller import router as node_router
from src.controllers.model_controller import router as model_router
from src.controllers.model_mgmt_controller import router as model_mgmt_router
from src.controllers.persistence_controller import router as persistence_router

# Import exceptions
from src.exceptions.business_exception import (
    BusinessException,
    NotFoundException,
    DatabaseUnavailableException,
)

app = FastAPI(
    title="Creative Forge",
    description="AI-powered content creation workflow platform",
    version="1.0.0",
    docs_url=None,
    redoc_url=None
)

# CORS middleware - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount swagger-ui static files
app.mount("/swagger-ui", StaticFiles(directory=swagger_ui_bundle.swagger_ui_path), name="swagger-ui")


def custom_openapi():
    """Generate OpenAPI 3.0.2 schema (compatible with swagger-ui-bundle)."""
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["openapi"] = "3.0.2"
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/docs", include_in_schema=False)
async def swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=app.title + " - Docs",
        swagger_js_url="/swagger-ui/swagger-ui-bundle.js",
        swagger_css_url="/swagger-ui/swagger-ui.css",
        swagger_ui_parameters={"persistAuthorization": True},
    )


# Register routers
app.include_router(health_router)
app.include_router(example_router)
app.include_router(user_router)
app.include_router(node_router)
app.include_router(model_router)
app.include_router(model_mgmt_router)
app.include_router(persistence_router)

# Mount uploads static files
from pathlib import Path as _Path
_uploads_dir = _Path("uploads")
_uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")


# Exception handlers
@app.exception_handler(NotFoundException)
async def not_found_handler(request: Request, exc: NotFoundException):
    return JSONResponse(
        status_code=404,
        content={"code": exc.code, "message": exc.message},
    )


@app.exception_handler(BusinessException)
async def business_exception_handler(request: Request, exc: BusinessException):
    return JSONResponse(
        status_code=400,
        content={"code": exc.code, "message": exc.message},
    )


@app.exception_handler(DatabaseUnavailableException)
async def database_unavailable_handler(request: Request, exc: DatabaseUnavailableException):
    return JSONResponse(
        status_code=503,
        content={"code": exc.code, "message": exc.message},
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
