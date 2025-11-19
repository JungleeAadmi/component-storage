from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db import Base

class StorageUnit(Base):
    __tablename__ = "storage_units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "type1" or "type2"
    description = Column(Text, nullable=True)

    partitions = relationship("Partition", back_populates="storage_unit", cascade="all,delete")
    trays = relationship("Tray", back_populates="storage_unit", cascade="all,delete")


class Partition(Base):
    __tablename__ = "partitions"

    id = Column(Integer, primary_key=True)
    storage_unit_id = Column(Integer, ForeignKey("storage_units.id"))
    label = Column(String, nullable=False)     # e.g. "TOP" or "BIG"
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)

    storage_unit = relationship("StorageUnit", back_populates="partitions")


class Tray(Base):
    __tablename__ = "trays"

    id = Column(Integer, primary_key=True)
    storage_unit_id = Column(Integer, ForeignKey("storage_units.id"))
    partition_id = Column(Integer, ForeignKey("partitions.id"))

    code = Column(String, index=True)       # A1, B5, BIG-A3, etc.
    description = Column(Text, nullable=True)

    storage_unit = relationship("StorageUnit", back_populates="trays")
    components = relationship("Component", back_populates="tray", cascade="all,delete")


class Component(Base):
    __tablename__ = "components"

    id = Column(Integer, primary_key=True)
    tray_id = Column(Integer, ForeignKey("trays.id"))

    name = Column(String, nullable=False)
    qty = Column(Integer, default=1)
    type = Column(String, nullable=True)
    specs = Column(String, nullable=True)
    link = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    tray = relationship("Tray", back_populates="components")
