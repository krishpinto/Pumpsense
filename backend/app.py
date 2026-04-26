from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
import os
import tempfile
import shutil

from extract_features import extract_features_from_excel

# Initialize FastAPI App
app = FastAPI(
    title="Pump Fault Diagnosis API",
    description="Real-time predictive maintenance API identifying specific bearing defects using Vibration Frequencies.",
    version="1.0.0"
)

# Allow the Next.js dev server (and any localhost origin) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Model Globally
model_path = "processed_data/final_multiclass_rf_model.pkl"
try:
    rf_model = joblib.load(model_path)
    print("SUCCESS: Model loaded successfully!")
except Exception as e:
    print(f"ERROR: Error loading model: {e}")
    rf_model = None

# Define the Input Schema based on our Extracted Features
class VibrationFeatures(BaseModel):
    max_amp: float = Field(..., description="Maximum amplitude of FFT vibration")
    mean_mag: float = Field(..., description="Mean magnitude of the spectral curve")
    var_mag: float = Field(..., description="Variance/spread of the magnitudes")
    spectral_energy: float = Field(..., description="Total energy encapsulated in the spectrum")
    spectral_centroid: float = Field(..., description="Weighted average frequency (center of mass)")
    spectral_spread: float = Field(..., description="Bandwidth surrounding the centroid")
    peak_f1: float = Field(..., description="Primary dominant frequency (Hz)")
    peak_f2: float = Field(..., description="Secondary dominant frequency (Hz)")
    peak_f3: float = Field(..., description="Tertiary dominant frequency (Hz)")

    class Config:
        json_schema_extra = {
            "example": {
                "max_amp": 0.05,
                "mean_mag": 0.002,
                "var_mag": 0.0001,
                "spectral_energy": 0.15,
                "spectral_centroid": 120.5,
                "spectral_spread": 45.2,
                "peak_f1": 60.0,
                "peak_f2": 120.0,
                "peak_f3": 180.0
            }
        }

# Exact mapping based on our Unsupervised K-Means dictionary
LABEL_MAP = {
    0: "Healthy Pump Operation",
    1: "Inner Race Defect",
    2: "Outer Race Defect",
    3: "Combination Defect (Severe)"
}

@app.get("/")
def home():
    return {"message": "✅ Predictive Maintenance API is purely active. Navigate to /docs to test it interactively!"}

@app.post("/predict")
def predict_fault(data: VibrationFeatures):
    if rf_model is None:
        raise HTTPException(status_code=500, detail="The machine learning model failed to load. Check processor files.")

    # Format incoming JSON specifically to exactly match Pandas Training structure
    input_data = pd.DataFrame([{
        'max_amp': data.max_amp,
        'mean_mag': data.mean_mag,
        'var_mag': data.var_mag,
        'spectral_energy': data.spectral_energy,
        'spectral_centroid': data.spectral_centroid,
        'spectral_spread': data.spectral_spread,
        'peak_f1': data.peak_f1,
        'peak_f2': data.peak_f2,
        'peak_f3': data.peak_f3
    }])

    # Predict Class
    prediction = rf_model.predict(input_data)[0]
    
    # Predict Confidence Probabilities
    probabilities = rf_model.predict_proba(input_data)[0]
    
    # Format the probabilities dictionary cleanly
    prob_dict = {
        LABEL_MAP[i]: f"{round(prob * 100, 2)}%" for i, prob in enumerate(probabilities)
    }

    return {
        "status": "success",
        "primary_classification": LABEL_MAP[int(prediction)],
        "class_id": int(prediction),
        "confidence_matrix": prob_dict
    }

@app.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    if rf_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded.")

    if not file.filename or not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=422, detail="Please upload a valid .xlsx file.")

    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        features = extract_features_from_excel(tmp_path)
        if features is None:
            raise HTTPException(status_code=422, detail="Could not extract features from file. Check that it contains valid vibration data.")

        FEATURE_KEYS = ['max_amp', 'mean_mag', 'var_mag', 'spectral_energy',
                        'spectral_centroid', 'spectral_spread', 'peak_f1', 'peak_f2', 'peak_f3']

        input_data = pd.DataFrame([{k: features[k] for k in FEATURE_KEYS}])
        prediction = rf_model.predict(input_data)[0]
        probabilities = rf_model.predict_proba(input_data)[0]

        prob_dict = {LABEL_MAP[i]: f"{round(prob * 100, 2)}%" for i, prob in enumerate(probabilities)}

        return {
            "status": "success",
            "filename": file.filename,
            "primary_classification": LABEL_MAP[int(prediction)],
            "class_id": int(prediction),
            "confidence_matrix": prob_dict,
            "features": {k: float(features[k]) for k in FEATURE_KEYS},
        }
    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
