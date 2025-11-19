from sqlalchemy.ext.asyncio import AsyncSession
from app import models, schemas
from app.utils import generate_tray_codes

async def create_storage_with_partitions(session: AsyncSession,
                                         data: schemas.StorageUnitCreate):

    storage = models.StorageUnit(
        name=data.name,
        type=data.type,
        description=data.description
    )
    session.add(storage)
    await session.flush()

    # Create partitions
    partition_objects = []
    for p in data.partitions:
        part = models.Partition(
            storage_unit_id=storage.id,
            label=p.label,
            rows=p.rows,
            cols=p.cols
        )
        session.add(part)
        partition_objects.append(part)

    await session.flush()

    # Create trays for each partition
    for part in partition_objects:
        codes = generate_tray_codes(part.label, part.rows, part.cols)
        for code in codes:
            tray = models.Tray(
                storage_unit_id=storage.id,
                partition_id=part.id,
                code=code
            )
            session.add(tray)

    await session.commit()
    await session.refresh(storage)
    return storage
