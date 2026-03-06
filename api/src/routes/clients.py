from flask import Blueprint, request

from src.db import db
from src.models.client import Client
from src.utils.http import error_response


clients_bp = Blueprint("clients", __name__)


@clients_bp.post("")
def create_client():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return error_response("Client name is required")

    c = Client(
        name=name,
        phone=payload.get("phone"),
        email=payload.get("email"),
        address=payload.get("address"),
        district=payload.get("district"),
    )
    db.session.add(c)
    db.session.commit()
    return c.to_dict(), 201


@clients_bp.get("")
def list_clients():
    include_cases = request.args.get("includeCases") == "1"
    clients = Client.query.order_by(Client.created_at.desc()).all()
    return [c.to_dict(include_cases=include_cases) for c in clients]


@clients_bp.put("/<int:client_id>")
def update_client(client_id: int):
    c = Client.query.get(client_id)
    if not c:
        return error_response("Client not found", 404)

    payload = request.get_json(silent=True) or {}

    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            return error_response("Client name cannot be empty")
        c.name = name

    for field in ["phone", "email", "address", "district"]:
        if field in payload:
            setattr(c, field, payload.get(field))

    db.session.commit()
    return c.to_dict()


@clients_bp.delete("/<int:client_id>")
def delete_client(client_id: int):
    c = Client.query.get(client_id)
    if not c:
        return error_response("Client not found", 404)

    db.session.delete(c)
    db.session.commit()
    return {"status": "deleted"}
