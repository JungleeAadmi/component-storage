#!/usr/bin/env python3
import os
import sys

# Ensure that package imports work when running the script directly
# by adding the backend folder to sys.path if necessary.
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))  # backend/
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Now import using package-style import
try:
    from app.db import engine, Base  # app/db.py must expose engine and Base
except Exception:
    # fallback: import existing engine / Base path
    from db import engine  # last resort (not ideal)
    from models import Base

def init_db():
    db_path = os.environ.get("DATABASE_PATH", "/var/lib/component-storage/app.db")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    print("Initializing database at:", db_path)
    # create tables
    try:
        from app.models import Base as AppBase
        AppBase.metadata.create_all(bind=engine)
    except Exception:
        # fallback if package import structure differs
        Base.metadata.create_all(bind=engine)
    print("Database initialized.")

if __name__ == "__main__":
    init_db()
