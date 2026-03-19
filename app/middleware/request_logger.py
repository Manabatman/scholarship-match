"""Request logging middleware for audit trail."""
import logging
import traceback

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log request method, path, client IP, and response status."""

    async def dispatch(self, request: Request, call_next):
        client_host = request.client.host if request.client else "unknown"
        logger.info("%s %s from %s", request.method, request.url.path, client_host)
        try:
            response = await call_next(request)
            logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
            return response
        except Exception:
            logger.error(
                "%s %s from %s UNHANDLED EXCEPTION\n%s",
                request.method,
                request.url.path,
                client_host,
                traceback.format_exc(),
            )
            raise
