from datetime import date, datetime
import os
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS

from src.db import db
from src.routes.advocates import advocates_bp
from src.routes.admin import admin_bp
from src.routes.auth import auth_bp
from src.routes.attendance import attendance_bp
from src.routes.cases import cases_bp
from src.routes.clients import clients_bp
from src.routes.documents import documents_bp
from src.routes.leave_requests import leave_bp
from src.routes.notifications import notifications_bp
from src.routes.reports import reports_bp
from src.routes.superadmin import superadmin_bp
from src.services.seed_service import seed_if_empty
from src.utils.settings import AppSettings


def create_app() -> Flask:
    app = Flask(__name__)

    settings = AppSettings.from_env()

    app.config["SQLALCHEMY_DATABASE_URI"] = settings.database_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_ROOT"] = str(settings.upload_root)

    CORS(app)

    db.init_app(app)

    with app.app_context():
        from src import models  # noqa: F401

        db.create_all()
        seed_if_empty()

    app.register_blueprint(cases_bp, url_prefix="/api/cases")
    app.register_blueprint(clients_bp, url_prefix="/api/clients")
    app.register_blueprint(advocates_bp, url_prefix="/api/advocates")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(leave_bp, url_prefix="/api/leave")
    app.register_blueprint(documents_bp, url_prefix="/api/cases")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(superadmin_bp, url_prefix="/api/superadmin")

    @app.get("/")
    def index():
        return jsonify(
            {
                "name": "NyayaDesk API",
                "status": "ok",
                "server_time": datetime.utcnow().isoformat() + "Z",
                "today": date.today().isoformat(),
            }
        )
    return app


if __name__ == "__main__":
    app = create_app()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host=host, port=port, debug=debug)
