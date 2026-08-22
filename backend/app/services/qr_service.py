import io
import base64
import json
import qrcode
from typing import Dict, Any


def generate_qr_code_data_uri(payload: Dict[str, Any]) -> str:
    """
    Generate a server-side QR code from a dictionary payload.
    Returns a base64-encoded PNG data URI string: 'data:image/png;base64,...'
    """
    json_str = json.dumps(payload, sort_keys=True)
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(json_str)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_bytes = buffer.getvalue()
    
    base64_encoded = base64.b64encode(qr_bytes).decode("utf-8")
    return f"data:image/png;base64,{base64_encoded}"
