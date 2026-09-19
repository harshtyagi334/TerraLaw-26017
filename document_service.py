"""Document intelligence primitives for land-record and gazette workflows."""
import hashlib
import io
from pathlib import Path

from PIL import Image
import pytesseract

REQUIRED_DOCUMENTS = {
    'identity_proof': 'Identity proof',
    'land_record': 'Land ownership record',
    'award_notice': 'Compensation award notice',
    'bank_details': 'Bank or DBT details',
    'rehabilitation_record': 'Rehabilitation and resettlement record',
}


def extract_text(file_bytes: bytes, filename: str) -> dict:
    digest = hashlib.sha256(file_bytes).hexdigest()
    suffix = Path(filename).suffix.lower()
    if suffix in {'.png', '.jpg', '.jpeg', '.tiff', '.bmp'}:
        text = pytesseract.image_to_string(Image.open(io.BytesIO(file_bytes)))
    else:
        text = file_bytes.decode('utf-8', errors='ignore')
    return {
        'filename': filename,
        'sha256': digest,
        'text': text,
        'characters': len(text),
        'verification': 'review_required',
    }


def validate_document_set(documents: list[dict]) -> dict:
    names = ' '.join((doc.get('text', '') + ' ' + doc.get('filename', '')).lower() for doc in documents)
    found = {key: label for key, label in REQUIRED_DOCUMENTS.items() if any(token in names for token in label.lower().split())}
    missing = {key: label for key, label in REQUIRED_DOCUMENTS.items() if key not in found}
    return {
        'verified_documents': found,
        'missing_documents': missing,
        'invalid_documents': [doc['filename'] for doc in documents if not doc.get('text', '').strip()],
        'required_corrections': ['Upload readable copies for every missing or invalid document.'] if missing else [],
    }
