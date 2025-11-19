#!/usr/bin/env python3
import os
from .db import engine
from .models import Base

def init_db():
    db_path = os.environ.get("DATABASE_PATH", "/var/lib/component-storage/app.db")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    # Create sqlite file & tables
    print("Initializing database at:", db_path)
    Base.metadata.create_all(bind=engine)
    print("Database initialized.")

if __name__ == "__main__":
    init_db()
