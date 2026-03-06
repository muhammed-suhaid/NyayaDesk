import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class AppSettings:
    database_uri: str
    upload_root: Path

    @staticmethod
    def from_env() -> "AppSettings":
        base_dir = Path(__file__).resolve().parents[3]
        default_db = base_dir / "app_data" / "nyayadesk.sqlite"
        default_upload_root = base_dir / "app_data" / "documents"

        database_uri = os.environ.get("DATABASE_URI", f"sqlite:///{default_db}")
        upload_root = Path(os.environ.get("UPLOAD_ROOT", str(default_upload_root)))
        upload_root.mkdir(parents=True, exist_ok=True)

        default_db.parent.mkdir(parents=True, exist_ok=True)

        return AppSettings(database_uri=database_uri, upload_root=upload_root)
