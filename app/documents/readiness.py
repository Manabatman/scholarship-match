"""
Document readiness computation.
Tags user documents against scholarship requirements.
"""

from enum import Enum
from dataclasses import dataclass


class ReadinessState(str, Enum):
    READY = "ready"
    PARTIALLY_READY = "partially_ready"
    MISSING_CRITICAL = "missing_critical"


DOCUMENT_TYPES = {
    "ITR": {"label": "Income Tax Return", "category": "financial"},
    "BIRTH_CERT": {"label": "Birth Certificate", "category": "identity"},
    "GOOD_MORAL": {"label": "Good Moral Certificate", "category": "academic"},
    "TOR": {"label": "Transcript of Records", "category": "academic"},
    "FORM_137": {"label": "Form 137 / School Records", "category": "academic"},
    "CEDULA": {"label": "Community Tax Certificate", "category": "identity"},
    "BARANGAY_CERT": {"label": "Barangay Certificate", "category": "residency"},
    "SKETCH_HOME": {"label": "Sketch of Home Location", "category": "residency"},
    "ESSAY": {"label": "Application Essay", "category": "supplementary"},
    "RECOMMENDATION": {"label": "Recommendation Letter", "category": "supplementary"},
    "PWD_ID": {"label": "PWD ID", "category": "equity"},
    "IP_CERT": {"label": "NCIP Certificate", "category": "equity"},
    "SOLO_PARENT_ID": {"label": "Solo Parent ID", "category": "equity"},
    "OFW_DOCS": {"label": "OFW POEA/DMW Records", "category": "equity"},
    "4PS_CERT": {"label": "4Ps/Listahanan Certificate", "category": "equity"},
    "PHOTO_2X2": {"label": "2x2 ID Photo", "category": "identity"},
}


@dataclass
class ReadinessResult:
    state: ReadinessState
    ratio: float
    missing: list[str]


def _parse_user_docs(documents: list | str | None) -> list[dict]:
    """Parse user document inventory from JSON or list."""
    if documents is None:
        return []
    if isinstance(documents, list):
        return documents
    if isinstance(documents, str):
        import json
        try:
            parsed = json.loads(documents)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []
    return []


def _parse_required_docs(required: list | str | None) -> list[str]:
    """Parse scholarship required documents."""
    if required is None:
        return []
    if isinstance(required, list):
        return [str(x).strip().upper() for x in required if x]
    if isinstance(required, str):
        import json
        try:
            parsed = json.loads(required)
            return [str(x).strip().upper() for x in parsed if x] if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return [x.strip().upper() for x in required.split(",") if x.strip()]
    return []


def _normalize_doc_type(doc_type: str) -> str:
    """Normalize document type for matching."""
    mapping = {
        "ITR": "ITR",
        "BIRTH CERTIFICATE": "BIRTH_CERT",
        "BIRTH_CERT": "BIRTH_CERT",
        "GOOD MORAL": "GOOD_MORAL",
        "GOOD_MORAL": "GOOD_MORAL",
        "TOR": "TOR",
        "FORM 137": "FORM_137",
        "FORM_137": "FORM_137",
        "ESSAY": "ESSAY",
        "SKETCH": "SKETCH_HOME",
        "SKETCH_HOME": "SKETCH_HOME",
        "SKETCH TO SM MALL": "SKETCH_HOME",
        "4PS": "4PS_CERT",
        "4PS_CERT": "4PS_CERT",
        "4PS/Listahanan": "4PS_CERT",
        "OFW_DOCS": "OFW_DOCS",
    }
    key = str(doc_type).strip().upper().replace(" ", "_")
    return mapping.get(key, key)


def compute_readiness(
    user_documents: list | str | None,
    scholarship_required: list | str | None,
) -> ReadinessResult:
    """
    Compute document readiness for a user-scholarship pair.
    Returns state, ratio (0.0-1.0), and list of missing document types.
    """
    user_docs = _parse_user_docs(user_documents)
    required = _parse_required_docs(scholarship_required)

    if not required:
        return ReadinessResult(state=ReadinessState.READY, ratio=1.0, missing=[])

    # Build set of user uploaded doc types
    uploaded_types = set()
    for doc in user_docs:
        if isinstance(doc, dict):
            doc_type = doc.get("type") or doc.get("doc_type")
            status = doc.get("status", "").lower()
            if status == "uploaded" and doc_type:
                uploaded_types.add(_normalize_doc_type(str(doc_type)))
        elif isinstance(doc, str):
            uploaded_types.add(_normalize_doc_type(doc))

    # Normalize required
    required_normalized = [_normalize_doc_type(r) for r in required]

    uploaded_count = sum(1 for r in required_normalized if r in uploaded_types)
    total = len(required_normalized)
    ratio = uploaded_count / total if total else 1.0

    missing = [r for r in required_normalized if r not in uploaded_types]

    if ratio >= 1.0:
        return ReadinessResult(state=ReadinessState.READY, ratio=1.0, missing=[])
    if uploaded_count > 0:
        return ReadinessResult(
            state=ReadinessState.PARTIALLY_READY,
            ratio=ratio,
            missing=missing,
        )
    return ReadinessResult(
        state=ReadinessState.MISSING_CRITICAL,
        ratio=0.0,
        missing=missing,
    )
