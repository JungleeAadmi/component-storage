from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app import models, schemas

async def add_component_to_tray(session: AsyncSession,
                                tray_id: int,
                                data: schemas.ComponentCreate):

    tray = await session.get(models.Tray, tray_id)
    if not tray:
        raise HTTPException(404, "Tray not found")

    component = models.Component(
        tray_id=tray_id,
        name=data.name,
        qty=data.qty,
        type=data.type,
        specs=data.specs,
        link=data.link,
        manufacturer=data.manufacturer,
        notes=data.notes,
    )

    session.add(component)
    await session.commit()
    await session.refresh(component)
    return component
