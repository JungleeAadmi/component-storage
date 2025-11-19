from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_session
from app import models

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/")
async def search(q: str, session: AsyncSession = Depends(get_session)):

    q_like = f"%{q}%"

    result = await session.execute(
        select(models.Component, models.Tray, models.StorageUnit)
        .join(models.Tray, models.Component.tray_id == models.Tray.id)
        .join(models.StorageUnit, models.Tray.storage_unit_id == models.StorageUnit.id)
        .where(
            models.Component.name.ilike(q_like) |
            models.Component.type.ilike(q_like) |
            models.Component.specs.ilike(q_like) |
            models.Component.manufacturer.ilike(q_like) |
            models.Tray.code.ilike(q_like)
        )
    )

    items = []
    for component, tray, storage in result.all():
        items.append({
            "component": {
                "id": component.id,
                "name": component.name,
                "qty": component.qty,
                "type": component.type,
                "specs": component.specs,
                "link": component.link,
            },
            "tray_code": tray.code,
            "storage_name": storage.name,
        })

    return items
