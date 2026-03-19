"""
Fuzzy search utility using stdlib only (difflib).
Scoring: exact prefix > word-boundary prefix > substring > character overlap.
"""

from difflib import SequenceMatcher


_STOP_WORDS = frozenset({"of", "the", "a", "an", "and", "de", "la", "del"})


def _acronym_match(q: str, item: str) -> bool:
    """Check if query matches first letters of significant words (e.g. UP -> University of the Philippines)."""
    words = [w for w in item.lower().split() if w and w not in _STOP_WORDS]
    if len(q) > len(words):
        return False
    for i, c in enumerate(q):
        if i >= len(words) or not words[i].startswith(c):
            return False
    return True


def _score_match(query: str, item: str) -> float:
    """
    Score how well query matches item. Higher = better.
    - Exact prefix: 1.0
    - Word-boundary prefix: 0.9
    - Acronym (first letters): 0.85
    - Substring: 0.7
    - Character overlap (SequenceMatcher): 0.0-0.6
    """
    if not query or not item:
        return 0.0

    q = query.strip().lower()
    i = item.strip().lower()

    if i.startswith(q):
        return 1.0

    words = i.split()
    for w in words:
        if w.startswith(q):
            return 0.9

    if _acronym_match(q, item):
        return 0.85

    if q in i:
        return 0.7

    ratio = SequenceMatcher(None, q, i).ratio()
    if ratio >= 0.3:
        return 0.3 + ratio * 0.3
    return 0.0


def fuzzy_search(query: str, items: list[str], limit: int = 10) -> list[str]:
    """
    Return top matching items sorted by relevance score.
    Uses prefix, word-boundary, substring, and character-overlap matching.
    """
    if not query or not query.strip():
        return items[:limit] if items else []

    q = query.strip().lower()
    scored: list[tuple[str, float]] = []

    for item in items:
        if not item:
            continue
        score = _score_match(q, item)
        if score > 0:
            scored.append((item, score))

    scored.sort(key=lambda x: (-x[1], x[0].lower()))
    return [item for item, _ in scored[:limit]]
