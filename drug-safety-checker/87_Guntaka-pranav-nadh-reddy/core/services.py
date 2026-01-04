import pytesseract
import json
import os
from PIL import Image
from django.conf import settings
from .models import Manufacturer

# Set Tesseract Path if on Windows
if hasattr(settings, 'TESSERACT_CMD_PATH') and settings.TESSERACT_CMD_PATH:
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD_PATH

class MedGuardEngine:
    """
    A 'Mock' Engine that works without OpenAI API keys.
    Useful for testing the frontend and database logic for free.
    """
    def __init__(self):
        pass # No OpenAI setup needed

    def perform_ocr(self, image_file):
        """Extracts text from uploaded image"""
        try:
            img = Image.open(image_file)
            text = pytesseract.image_to_string(img, lang='eng')
            return text
        except Exception as e:
            print(f"OCR Error: {e}")
            return "Dolo 650 Micro Labs" # Fallback simulation

    def extract_entities(self, raw_text):
        """
        SIMULATED ENTITY EXTRACTION
        Instead of using AI, we just look for common keywords or return defaults.
        """
        # Simple keyword matching for demo purposes
        raw_lower = raw_text.lower() if raw_text else ""
        
        medicine = "Unknown Medicine"
        manufacturer = "Unknown Manufacturer"

        if "dolo" in raw_lower:
            medicine = "Dolo 650"
            manufacturer = "Micro Labs Ltd"
        elif "metformin" in raw_lower:
            medicine = "Metformin"
            manufacturer = "USV Pvt Ltd"
        elif raw_text:
            # If we typed something else, just use that
            medicine = raw_text.split()[0] 
        
        return {
            "medicine_name": medicine,
            "manufacturer": manufacturer
        }

    def assess_risk(self, medicine_name, manufacturer_name):
        """Checks DB for trusted manufacturers (Real Logic)"""
        # This part is REAL. It actually checks your database.
        if not manufacturer_name or manufacturer_name == "Unknown Manufacturer":
            return {"level": "Unknown", "reason": "Could not identify manufacturer."}

        manuf = Manufacturer.objects.filter(name__icontains=manufacturer_name).first()
        
        if manuf:
            if manuf.is_verified:
                return {"level": "Low", "reason": f"Verified Manufacturer: {manuf.name}"}
            else:
                return {"level": "Medium", "reason": f"Unverified Manufacturer: {manuf.name}"}
        
        return {"level": "High", "reason": f"Manufacturer '{manufacturer_name}' not found in trusted database."}

    def get_medical_insights(self, medicine_name, conditions):
        """
        SIMULATED MEDICAL ADVICE
        Returns pre-written safe responses for demo.
        """
        med_name = medicine_name.lower()
        
        if "dolo" in med_name:
            return (
                "**Uses:** Dolo 650 is commonly used to relieve pain and reduce fever.\n\n"
                "**Side Effects:** Nausea, vomiting, stomach pain.\n\n"
                "**Safety Check:** Generally safe for most adults. Overdose can cause liver damage.\n\n"
                "**Disclaimer:** Consult a doctor before use."
            )
        elif "metformin" in med_name:
            return (
                "**Uses:** Metformin is used to treat type 2 diabetes.\n\n"
                "**Side Effects:** Nausea, stomach upset, metallic taste.\n\n"
                "**Safety Check:** Use with caution if you have kidney issues.\n\n"
                "**Disclaimer:** Consult a doctor before use."
            )
        
        return (
            f"**Analysis for {medicine_name}:**\n\n"
            "This medicine is identified, but specific details are not in the demo database.\n"
            "Always check the expiry date and packaging integrity.\n\n"
            "**Disclaimer:** Consult a doctor before use."
        )