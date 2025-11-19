from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import storage_units, trays, components, search, uploads
from app.config import settings

app = FastAPI(title="Component Storage API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(storage_units.router, prefix=settings.API_PREFIX)
app.include_router(trays.router, prefix=settings.API_PREFIX)
app.include_router(components.router, prefix=settings.API_PREFIX)
app.include_router(search.router, prefix=settings.API_PREFIX)
app.include_router(uploads.router, prefix=settings.API_PREFIX)

# Root fallback
@app.get("/")
async def root():
    return {"status": "Component Storage API running"}
