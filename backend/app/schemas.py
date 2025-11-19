from pydantic import BaseModel
from typing import Optional, List

# ---------------------
# Storage Unit Schemas
# ---------------------

class PartitionCreate(BaseModel):
    label: str
    rows: int
    cols: int


class StorageUnitCreate(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    partitions: List[PartitionCreate]


class StorageUnitResponse(BaseModel):
    id: int
    name: str
    type: str
    description: Optional[str]

    class Config:
        from_attributes = True


# -------------
# Tray Schemas
# -------------

class TrayResponse(BaseModel):
    id: int
    code: str
    description: Optional[str]

    class Config:
        from_attributes = True


# ------------------
# Component Schemas
# ------------------

class ComponentCreate(BaseModel):
    name: str
    qty: int
    type: Optional[str] = None
    specs: Optional[str] = None
    link: Optional[str] = None
    manufacturer: Optional[str] = None
    notes: Optional[str] = None


class ComponentResponse(BaseModel):
    id: int
    tray_id: int
    name: str
    qty: int
    type: Optional[str]
    specs: Optional[str]
    link: Optional[str]
    manufacturer: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True
