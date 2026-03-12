from app import create_app
from src.db import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        db.session.execute(text('ALTER TABLE cases ADD COLUMN disposal_date DATE'))
    except Exception as e:
        print('Error 1:', e)

    try:
        db.session.execute(text('ALTER TABLE cases ADD COLUMN disposal_reason TEXT'))
    except Exception as e:
        print('Error 2:', e)
        
    try:
        db.session.execute(text('ALTER TABLE cases ADD COLUMN outcome TEXT'))
    except Exception as e:
        print('Error 3:', e)

    try:
        db.session.execute(text('ALTER TABLE documents ADD COLUMN document_type VARCHAR(50)'))
    except Exception as e:
        print('Error 4:', e)

    try:
        db.session.execute(text('ALTER TABLE documents ADD COLUMN uploaded_by VARCHAR(200)'))
    except Exception as e:
        print('Error 5:', e)

    db.session.commit()
    print('Migration finished.')
