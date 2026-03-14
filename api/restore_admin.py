from src.db import db
from src.models.user import User
from src.models.company import Company
from src.models.advocate import Advocate
from app import create_app

app = create_app()
with app.app_context():
    # 1. Ensure company 1 exists
    company = Company.query.get(1)
    if not company:
        print("Company 1 not found!")
        exit(1)
    
    # 2. Check if admin exists
    admin_email = "admin@nyayadesk.com"
    existing_user = User.query.filter_by(email=admin_email).first()
    
    if existing_user:
        print(f"User {admin_email} already exists. Updating to Admin.")
        existing_user.role = "admin"
        existing_user.company_id = 1
    else:
        print(f"Creating new Admin user: {admin_email}")
        new_user = User(
            company_id=1,
            name="Firm Administrator",
            email=admin_email,
            password="admin123",
            role="admin",
            status="active"
        )
        db.session.add(new_user)
    
    # 3. Handle Advocate record
    existing_adv = Advocate.query.filter_by(email=admin_email).first()
    if existing_adv:
        print(f"Advocate record for {admin_email} exists. Updating.")
        existing_adv.role = "Admin"
    else:
        print(f"Creating Advocate record for {admin_email}")
        new_adv = Advocate(
            company_id=1,
            name="Firm Administrator",
            email=admin_email,
            role="Admin",
            status="Active"
        )
        db.session.add(new_adv)
    
    db.session.commit()
    print("RESTORE SUCCESSFUL")
    print(f"Login Email: {admin_email}")
    print("Password: admin123")
