from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from . import crud, schemas, db

app = FastAPI(title="Component Storage", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# If frontend build is placed in backend/app/static, serve it
try:
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
except Exception:
    pass

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/storages", response_model=schemas.Storage)
def create_storage(storage: schemas.StorageCreate):
    return crud.create_storage(storage)

@app.get("/storages")
def list_storages():
    return crud.list_storages()

@app.post("/storages/{storage_id}/partitions")
def create_partition(storage_id: int, payload: dict):
    return crud.create_partition(storage_id, payload)

@app.post("/cells/{cell_id}/items", response_model=schemas.Item)
def add_item(cell_id: int, item: schemas.ItemCreate):
    return crud.create_item(cell_id, item)

@app.get("/items")
def search_items(q: str = "", limit: int = 50):
    return crud.search_items(q, limit)
