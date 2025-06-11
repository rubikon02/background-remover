from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from rembg import remove
from transformers import pipeline
import numpy as np
import cv2
import io
import os
import uuid
import tempfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AVAILABLE_MODELS = ["rembg", "bria", "custom"]

@app.get("/models")
def get_models():
    return {"models": AVAILABLE_MODELS}

@app.post("/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    model: str = Form("rembg")
):
    contents = await file.read()
    input_image = Image.open(io.BytesIO(contents)).convert("RGB")
    output_image = None

    if model == "rembg":
        output_image = remove(input_image)
    elif model == "bria":
        bria = pipeline("image-segmentation", model="briaai/RMBG-1.4", trust_remote_code=True, device=-1)
        mask = bria(input_image, return_mask=True)
        if not isinstance(mask, Image.Image):
            mask = Image.fromarray((mask * 255).astype('uint8'))
        output_image = Image.new("RGBA", input_image.size, (0, 0, 0, 0))
        output_image.paste(input_image, mask=mask)
    elif model == "custom":
        output_image = remove_background(input_image)
    else:
        return JSONResponse(status_code=400, content={"error": "Invalid model"})

    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
        output_image.save(tmp.name)
        tmp_path = tmp.name
    return FileResponse(tmp_path, media_type="image/png", filename="no-bg.png")


def auto_detect_rect(image):
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 10, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        # Fallback: użyj całego obrazu
        height, width = image.shape[:2]
        return (1, 1, width - 2, height - 2)

    largest_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_contour)

    Powiększ trochę prostokąt
    pad = 1
    x = max(1, x - pad)
    y = max(1, y - pad)
    w = min(image.shape[1] - x, w + 2 * pad)
    h = min(image.shape[0] - y, h + 2 * pad)

    return (x, y, w, h)

def remove_background(imgo):
    # Resize dla lepszej wydajności
    height, width = imgo.shape[:2]
    imgo = cv2.resize(imgo, (int(width * 0.7), int(height * 0.7)), interpolation=cv2.INTER_AREA)
    # Tworzenie maski
    mask = np.zeros(imgo.shape[:2], np.uint8)
    # Automatyczne wykrycie prostokąta
    rect = auto_detect_rect(imgo)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    cv2.grabCut(imgo, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
    mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')

    # Aplikacja maski
    img1 = imgo * mask2[:, :, np.newaxis]

    # Tło na biało
    background = imgo - img1
    background[np.where((background > [0, 0, 0]).all(axis=2))] = [255, 255, 255]
    final = background + img1
    
    return final
