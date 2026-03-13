from datetime import date
from flask import Blueprint, jsonify
from src.db import db
from src.models.hearing import Hearing
from src.models.case import Case
from src.models.advocate import Advocate
from src.models.case_client import CaseClient
from src.models.client import Client
from src.utils.auth import current_session, require_auth
from src.utils.http import error_response

hearings_bp = Blueprint("hearings", __name__)

@hearings_bp.get("/upcoming")
@require_auth
def get_upcoming_hearings():
    sess = current_session()
    assert sess is not None
    
    today = date.today()
    
    # Query hearings for the company
    # We join with Case to get title and court_name
    # We join with Advocate assigned to the case
    hearings = (
        Hearing.query
        .filter(Hearing.company_id == sess.company_id)
        .filter(Hearing.hearing_date >= today)
        .join(Case, Case.id == Hearing.case_id)
        .order_by(Hearing.hearing_date.asc())
        .limit(10)
        .all()
    )
    
    result = []
    for h in hearings:
        # Get clients for this case via case_client links
        # Optimization: We could join Client in the main query, 
        # but since a case can have multiple clients, we'll fetch them here or join with group_concat equivalent.
        # For simplicity and correctness with multiple clients:
        client_names = []
        for link in h.case.client_links:
            if link.client:
                client_names.append(link.client.name)
        
        result.append({
            "caseId": h.case.id,
            "caseTitle": h.case.title,
            "court": h.case.court_name,
            "clientName": ", ".join(client_names) if client_names else "No Client",
            "hearingDate": h.hearing_date.isoformat(),
            "advocateName": h.case.assigned_advocate.name if h.case.assigned_advocate else "Unassigned"
        })
        
    return jsonify(result)
