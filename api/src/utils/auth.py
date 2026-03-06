from __future__ import annotations

from functools import wraps

from flask import request

from src.models.user import User
from src.services.auth_service import SessionUser, get_session
from src.utils.http import error_response


def _get_bearer_token() -> str | None:
    header = request.headers.get("Authorization") or ""
    if not header.lower().startswith("bearer "):
        return None
    return header.split(" ", 1)[1].strip()


def current_session() -> SessionUser | None:
    token = _get_bearer_token()
    if not token:
        return None
    return get_session(token)


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        sess = current_session()
        if not sess:
            return error_response("Unauthorized", 401)
        return fn(*args, **kwargs)

    return wrapper


def require_role(*roles: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            sess = current_session()
            if not sess:
                return error_response("Unauthorized", 401)
            if sess.role not in roles:
                return error_response("Forbidden", 403)
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def require_company(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        sess = current_session()
        if not sess:
            return error_response("Unauthorized", 401)
        if sess.role == "super_admin":
            return error_response("Company scope required", 400)
        if sess.company_id is None:
            return error_response("Company scope missing", 400)
        return fn(*args, **kwargs)

    return wrapper


def get_current_user() -> User | None:
    sess = current_session()
    if not sess:
        return None
    return User.query.get(sess.user_id)
