from src.db import db
from src.models.user import User
from src.models.company import Company
from src.models.advocate import Advocate
from app import create_app

app = create_app()
with app.app_context():
    print("--- ADVOCATES ---")
    for a in Advocate.query.all():
        print(f"ID: {a.id}, CoID: {a.company_id}, Name: {a.name}, Email: {a.email}, Role: {a.role}")
