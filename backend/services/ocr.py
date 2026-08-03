import io
import pytesseract
from PIL import Image

def extract_text(image_bytes: bytes) -> str:
    """Extract text from an image using Tesseract OCR."""
    try:
        # Open image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Extract text (using default language, typically English. 
        # For multiple languages, you could pass lang='eng+tam' etc. if installed)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"OCR failed: {e}") from e
