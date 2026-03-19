"""Input sanitization to prevent stored XSS."""
import re


def strip_tags(value: str | None) -> str | None:
    """
    Remove HTML/XML tags from a string.
    Returns None if input is None.
    """
    if value is None:
        return None
    if not isinstance(value, str):
        return value
    # Remove tags: <...> and </...>
    return re.sub(r"<[^>]+>", "", value).strip()
