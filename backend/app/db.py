from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

DATABASE_URL = settings.DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")

engine = create_async_engine(
    DATABASE_URL, echo=False, future=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session
