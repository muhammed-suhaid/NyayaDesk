from flask import jsonify


def error_response(message: str, status_code: int = 400, **extra):
    payload = {"error": message}
    payload.update(extra)
    return jsonify(payload), status_code
