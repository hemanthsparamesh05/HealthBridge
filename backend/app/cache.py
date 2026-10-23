"""Small in-process caches. Claims data is cached until any write bumps the version."""

from __future__ import annotations

import time
from typing import Any, Awaitable, Callable

_version = 0
_store: dict[str, tuple[int, Any]] = {}


def invalidate_claims() -> None:
    global _version
    _version += 1


async def cached(key: str, loader: Callable[[], Awaitable[Any]]) -> Any:
    hit = _store.get(key)
    if hit and hit[0] == _version:
        return hit[1]
    value = await loader()
    _store[key] = (_version, value)
    return value


class TTLCache:
    def __init__(self, ttl_seconds: float, max_items: int = 512) -> None:
        self.ttl = ttl_seconds
        self.max_items = max_items
        self._data: dict[Any, tuple[float, Any]] = {}

    def get(self, key: Any) -> Any | None:
        item = self._data.get(key)
        if not item:
            return None
        if item[0] < time.monotonic():
            self._data.pop(key, None)
            return None
        return item[1]

    def set(self, key: Any, value: Any) -> None:
        if len(self._data) >= self.max_items:
            self._data.clear()
        self._data[key] = (time.monotonic() + self.ttl, value)

    def pop(self, key: Any) -> None:
        self._data.pop(key, None)
