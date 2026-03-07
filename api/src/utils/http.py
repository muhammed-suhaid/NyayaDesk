from flask import jsonify


def error_response(message: str, status_code: int = 400):
    return jsonify({"error": message}), status_code


def success_response(message: str, status_code: int = 200, **payload):
    if "data" in payload and len(payload) == 1:
        body = {"message": message, "data": payload["data"]}
        return jsonify(body), status_code

    body = {"message": message}
    if payload:
        body["data"] = payload
    return jsonify(body), status_code
