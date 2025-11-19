from fastapi import APIRouter, UploadFile, File
import os

router = APIRouter(prefix="/upload", tags=["Uploads"])

UPLOAD_DIR = "/var/lib/component-storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    dest = os.path.join(UPLOAD_DIR, file.filename)

    with open(dest, "wb") as f:
        f.write(await file.read())

    return {"url": f"/static/uploads/{file.filename}"}
