import time
from collections import defaultdict
from threading import Lock
from app.config import RATE_LIMIT_PER_MINUTE

class InMemoryRateLimiter:
    def __init__(self, requests_per_minute: int = RATE_LIMIT_PER_MINUTE):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.lock = Lock()

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds

        with self.lock:
            # Filter out timestamps outside the active window
            timestamps = [t for t in self.requests[client_ip] if t > window_start]
            
            if len(timestamps) >= self.requests_per_minute:
                self.requests[client_ip] = timestamps
                return False

            timestamps.append(now)
            self.requests[client_ip] = timestamps
            return True

rate_limiter = InMemoryRateLimiter()
