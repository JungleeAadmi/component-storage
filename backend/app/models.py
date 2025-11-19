from sqlalchemy import Column, Integer, String, Text, JSON, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .db import Base

class Storage(Base):
    __tablename__ = "storages"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

class Partition(Base):
    __tablename__ = "partitions"
    id = Column(Integer, primary_key=True, index=True)
    storage_id = Column(Integer, ForeignKey("storages.id"), nullable=False)
    code = Column(String, nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)
    cell_type = Column(String, default="normal")

    storage = relationship("Storage")

class Cell(Base):
    __tablename__ = "cells"
    id = Column(Integer, primary_key=True, index=True)
    storage_id = Column(Integer, ForeignKey("storages.id"), nullable=False)
    partition_id = Column(Integer, ForeignKey("partitions.id"), nullable=False)
    col = Column(String, nullable=False)
    row = Column(Integer, nullable=False)
    address = Column(String, unique=True, index=True, nullable=False)
    alias = Column(String, nullable=True)

    storage = relationship("Storage")
    partition = relationship("Partition")

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    item_type = Column(String, nullable=True)
    specs = Column(JSON, nullable=True)
    quantity = Column(Float, default=0)
    unit = Column(String, default="pcs")
    min_qty_alert = Column(Float, default=0)
    location_cell_id = Column(Integer, ForeignKey("cells.id"), nullable=False)
    storage_code = Column(String, nullable=False)
    address = Column(String, nullable=False, index=True)
    photos = Column(JSON, nullable=True)
    tags = Column(String, nullable=True)
    vendor = Column(String, nullable=True)
    purchase_link = Column(String, nullable=True)
