from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from rembg import remove
from transformers import pipeline
import numpy as np
import io
import os
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AVAILABLE_MODELS = ["rembg", "bria"]

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
    else:
        return JSONResponse(status_code=400, content={"error": "Invalid model"})

    output_filename = f"output_{uuid.uuid4().hex}.png"
    output_path = os.path.join("/tmp", output_filename)
    output_image.save(output_path)
    return FileResponse(output_path, media_type="image/png", filename=output_filename)
