from datetime import date, datetime
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)
print(f"DEBUG: Environment variables loaded from {env_path}")
if os.environ.get("GOOGLE_API_KEY"):
    print("DEBUG: GOOGLE_API_KEY is present")
else:
    print("DEBUG: GOOGLE_API_KEY is MISSING")

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
from src.routes.subscription import subscription_bp
from src.routes.hearings import hearings_bp
from src.routes.ai import ai_bp
from src.services.seed_service import seed_if_needed
from src.utils.settings import AppSettings


def _normalize_attendance_statuses():
    from src.models.attendance import Attendance

    allowed = {"present", "absent"}
    changed = False
    for r in Attendance.query.all():
        s = (r.status or "").strip().lower()
        if s not in allowed:
            s = "present"
        if r.status != s:
            r.status = s
            changed = True
    if changed:
        db.session.commit()


def _normalize_leave_statuses():
    from src.models.leave_request import LeaveRequest

    allowed = {"pending", "approved", "rejected"}
    changed = False
    for r in LeaveRequest.query.all():
        s = (r.status or "").strip().lower()
        if s not in allowed:
            s = "pending"
        if r.status != s:
            r.status = s
            changed = True
    if changed:
        db.session.commit()


def create_app() -> Flask:
    app = Flask(__name__)

    settings = AppSettings.from_env()

    app.config["SQLALCHEMY_DATABASE_URI"] = settings.database_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_ROOT"] = str(settings.upload_root)
    app.config["BRAND_NAME"] = settings.brand_name

    CORS(app)

    db.init_app(app)

    with app.app_context():
        from src import models  # noqa: F401

        db.create_all()
        seed_if_needed()
        _normalize_attendance_statuses()
        _normalize_leave_statuses()

    app.register_blueprint(cases_bp, url_prefix="/api/cases")
    app.register_blueprint(clients_bp, url_prefix="/api/clients")
    app.register_blueprint(advocates_bp, url_prefix="/api/advocates")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(leave_bp, url_prefix="/api/leave")
    app.register_blueprint(documents_bp, url_prefix="/api/cases")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(hearings_bp, url_prefix="/api/hearings")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(superadmin_bp, url_prefix="/api/superadmin")
    app.register_blueprint(subscription_bp, url_prefix="/api/subscription")

    @app.get("/")
    def index():
        return jsonify(
            {
                "name": "API",
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
