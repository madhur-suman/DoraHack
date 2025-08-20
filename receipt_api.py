import os
from typing import List, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from receipt_processing import (
    process_receipt_image,
    ReceiptItem,
    ReceiptData,
    save_data_to_db,
)


load_dotenv()

app = FastAPI(title="Receipt Service", version="1.0.0")

# Allow all origins by default (adjust for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SaveItemsRequest(BaseModel):
    items: List[ReceiptItem]
    user_id: int | None = None
    username: str | None = None
    receipt_id: str | None = None
    store_name: str | None = None
    purchase_date: str | None = None


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok"}


@app.post("/process_receipt")
async def process_receipt(file: UploadFile = File(...)) -> dict[str, Any]:
    try:
        contents = await file.read()
        ocr_text, data = process_receipt_image(contents, file.filename)
        return {
            "ocr_text": ocr_text,
            "items": [item.model_dump() for item in data.items],
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/save_items")
async def save_items(payload: SaveItemsRequest) -> dict[str, Any]:
    try:
        success, message = save_data_to_db(
            payload.items,
            user_id=payload.user_id,
            username=payload.username,
            receipt_id=payload.receipt_id,
            store_name=payload.store_name,
            purchase_date=payload.purchase_date,
        )
        if not success:
            raise HTTPException(status_code=400, detail=message)
        return {"message": message}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

