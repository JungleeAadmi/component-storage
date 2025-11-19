from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Any, Dict

class StorageBase(BaseModel):
    code: str = Field(..., example="TYPE1-01")
    name: str
    description: Optional[str] = None

class StorageCreate(StorageBase):
    pass

class Storage(StorageBase):
    id: int
    class Config:
        orm_mode = True

class PartitionCreate(BaseModel):
    code: str
    rows: int
    cols: int
    cell_type: Optional[str] = "normal"

class ItemCreate(BaseModel):
    name: str
    item_type: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    quantity: float = 0
    unit: Optional[str] = "pcs"
    min_qty_alert: Optional[float] = 0
    vendor: Optional[str] = None
    purchase_link: Optional[HttpUrl] = None
    tags: Optional[str] = None

class Item(ItemCreate):
    id: int
    location_cell_id: int
    storage_code: str
    address: str
    class Config:
        orm_mode = True
