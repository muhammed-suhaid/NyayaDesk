from __future__ import annotations

from dataclasses import dataclass
from secrets import token_urlsafe
from typing import Dict


@dataclass(frozen=True)
class SessionUser:
    user_id: int
    role: str
    company_id: int | None


_SESSIONS: Dict[str, SessionUser] = {}


def create_token_for_user(user_id: int, role: str, company_id: int | None) -> str:
    token = token_urlsafe(32)
    _SESSIONS[token] = SessionUser(user_id=user_id, role=role, company_id=company_id)
    return token


def get_session(token: str) -> SessionUser | None:
    return _SESSIONS.get(token)


def revoke_token(token: str) -> None:
    _SESSIONS.pop(token, None)
