# NyayaDesk - Legal Case Management System

## Stack

- Frontend: React + Material UI + Axios
- Backend: Python Flask REST API + SQLAlchemy
- DB: SQLite
- File storage: Local filesystem under `app_data/documents/`

## Project Structure

- `api/` Flask backend
- `ui/` React frontend
- `app_data/` SQLite DB + uploaded case documents (created automatically)

## Backend - Run

1. Create a virtual environment (recommended) and install deps:

```bash
pip install -r api/requirements.txt
```

2. Start the API:

```bash
python api/app.py
```

API will run on `http://127.0.0.1:5000`.

## Frontend - Run

```bash
cd ui
npm install
npm start
```

UI will run on `http://localhost:3000` and proxy API calls to `http://127.0.0.1:5000`.

## File uploads

Uploads go to:

- `app_data/documents/case_<id>/...`

## Notes

- This is an internal office system with Admin/Advocate roles stored on the advocate record.
- No AI/ML features are included.
