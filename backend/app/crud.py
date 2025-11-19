from . import models, db
from sqlalchemy.orm import Session
from sqlalchemy import or_
import json

def create_storage(storage):
    session: Session = db.SessionLocal()
    s = models.Storage(code=storage.code, name=storage.name, description=storage.description)
    session.add(s)
    session.commit()
    session.refresh(s)
    session.close()
    return s

def list_storages():
    session: Session = db.SessionLocal()
    rows = session.query(models.Storage).all()
    session.close()
    return rows

def create_partition(storage_id: int, payload: dict):
    session = db.SessionLocal()
    s = session.query(models.Storage).filter_by(id=storage_id).first()
    if not s:
        session.close()
        raise Exception("storage not found")
    p = models.Partition(storage_id=storage_id, code=payload.get("code"), rows=payload.get("rows"), cols=payload.get("cols"), cell_type=payload.get("cell_type","normal"))
    session.add(p)
    session.commit()
    session.refresh(p)
    session.close()
    return p

def create_item(cell_id: int, item):
    session = db.SessionLocal()
    cell = session.query(models.Cell).filter_by(id=cell_id).first()
    if not cell:
        session.close()
        raise Exception("cell not found")
    it = models.Item(
        name=item.name,
        item_type=item.item_type,
        specs=item.specs,
        quantity=item.quantity,
        unit=item.unit,
        min_qty_alert=item.min_qty_alert,
        location_cell_id=cell_id,
        storage_code=cell.storage_id if cell.storage_id else str(cell.storage_id),
        address=cell.address,
        vendor=item.vendor,
        purchase_link=str(item.purchase_link) if item.purchase_link else None,
        tags=item.tags
    )
    session.add(it)
    session.commit()
    session.refresh(it)
    session.close()
    return it

def search_items(q: str, limit: int = 50):
    session = db.SessionLocal()
    likeq = f"%{q}%"
    rows = session.query(models.Item).filter(
        or_(models.Item.name.ilike(likeq), models.Item.tags.ilike(likeq), models.Item.address.ilike(likeq))
    ).limit(limit).all()
    session.close()
    return rows
