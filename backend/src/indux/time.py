import re
from datetime import UTC, datetime

TIMESTAMP = re.compile(
    r"^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-](?:[01]\d|2[0-3]):[0-5]\d)$"
)


def utc_now() -> str:
    return serialize(datetime.now(UTC))


def serialize(value: datetime) -> str:
    return value.astimezone(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


def normalize_timestamp(value: str) -> str:
    if not isinstance(value, str) or not TIMESTAMP.fullmatch(value):
        raise ValueError("Expected an ISO 8601 timestamp with timezone")
    try:
        return serialize(datetime.fromisoformat(value.upper().replace("Z", "+00:00")))
    except (ValueError, OverflowError) as exc:
        raise ValueError("Timestamp is invalid or outside the supported UTC date range") from exc
