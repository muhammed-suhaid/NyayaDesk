import os
from flask import Blueprint, request, jsonify
import google.generativeai as genai

ai_bp = Blueprint("ai", __name__)

def get_gemini_response(prompt, generation_config=None):
    """Try primary key, then secondary if primary fails with quota."""
    keys = [
        os.environ.get("GOOGLE_API_KEY"),
        os.environ.get("GOOGLE_API_KEY_2")
    ]
    # Only use keys that look real (not placeholders)
    active_keys = [k for k in keys if k and "PASTE" not in k and k.strip() != ""]
    
    if not active_keys:
        return None, "AI configuration missing. No API keys found.", 500

    last_error = ""
    for i, key in enumerate(active_keys):
        try:
            print(f"DEBUG: Attempting AI request with Key {i+1} of {len(active_keys)}")
            genai.configure(api_key=key)
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(prompt, generation_config=generation_config)
            
            if response and response.candidates:
                return response, None, 200
            last_error = "No candidates returned from AI."
        except Exception as e:
            last_error = str(e)
            # If not a quota error and not the last key, we might still want to try the next key
            # but usually quota (429) is the main reason to skip.
            if i < len(active_keys) - 1:
                print(f"Key {i+1} failed, trying next key... Error: {last_error}")
                continue
            
    return None, last_error, 429 if "429" in last_error or "quota" in last_error.lower() else 500


@ai_bp.route("/case-analysis", methods=["POST"])
def case_analysis():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No request data provided."}), 400

    title = data.get("title")
    facts = data.get("facts")

    if not title or not facts:
        return jsonify({"message": "Case title and facts are required."}), 400

    # ... (collect other fields like before)
    case_number = data.get("caseNumber", "Not provided")
    court = data.get("court", "Not provided")
    district = data.get("district", "Not provided")
    case_type = data.get("caseType", "Not provided")
    client_name = data.get("clientName", "Not provided")
    advocate_name = data.get("advocateName", "Not provided")
    status = data.get("status", "Not provided")
    filing_date = data.get("filingDate", "Not provided")
    next_hearing = data.get("nextHearing", "Not scheduled")
    hearing_notes = data.get("hearingNotes") or "No hearing notes."
    updates = data.get("updates") or "No updates."

    prompt = f"""
You are an AI assistant that helps advocates analyze legal cases in **Indian law**.
Use only the information provided. Start directly with "Case Details".

CASE INFORMATION
Title: {title} | Case No: {case_number} | Court: {court} | District: {district}
Client: {client_name} | Advocate: {advocate_name} | Status: {status}

CASE FACTS
{facts}

TASK: Generate 6 sections (Details, Summary, Arguments, Laws, Strategy, Evidence).
"""
    config = {"temperature": 0.3, "max_output_tokens": 2048}
    
    response, error, status_code = get_gemini_response(prompt, config)
    
    if error:
        return jsonify({"error": error}), status_code

    try:
        return jsonify({"analysis": response.text})
    except Exception as e:
        return jsonify({"error": f"Content filtered or invalid: {str(e)}"}), 500


@ai_bp.route("/legal-question", methods=["POST"])
def legal_question():
    data = request.get_json()
    question = data.get("question")
    if not question:
        return jsonify({"error": "Please enter a question."}), 400

    prompt = f"""
You are a specialized Legal AI for NyayaDesk, focusing strictly on Indian Law.

RULES:
1. ONLY answer questions related to Law, Statutes, Indian Penal Code (IPC), BNS, Court Procedures, or Legal Advice.
2. If the user asks about anything else (travel, cooking, sports, general knowledge, etc.), politely refuse.
3. Your refusal should be: "As a specialized Legal AI, I can only assist with queries related to Indian Law. Please ask a legal question."

QUESTION: {question}

LEGAL ANSWER:
"""
    config = {"temperature": 0.3, "max_output_tokens": 2048}

    response, error, status_code = get_gemini_response(prompt, config)
    
    if error:
        return jsonify({"error": error}), status_code

    try:
        return jsonify({"answer": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ai_bp.route("/download-pdf", methods=["POST"])
def download_pdf():
    from flask import send_file
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    import io

    data = request.get_json()
    analysis = data.get("analysis", "")
    case_number = data.get("caseNumber", "N/A")

    if not analysis:
        return jsonify({"error": "No analysis text provided"}), 400

    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        alignment=1, # Center
        textColor=colors.HexColor("#1a237e") # Deep Blue
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        spaceAfter=10
    )

    elements = []
    
    # Title
    elements.append(Paragraph(f"AI Legal Analysis Report", title_style))
    elements.append(Paragraph(f"Case Number: {case_number}", styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    # Format the AI response (basic markdown-like cleaning)
    # Convert bold markers ** to strong tags
    import re
    cleaned_txt = analysis.replace('\n', '<br/>')
    cleaned_txt = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', cleaned_txt)
    
    elements.append(Paragraph(cleaned_txt, body_style))
    
    doc.build(elements)
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"AI_Analysis_{case_number}.pdf",
        mimetype='application/pdf'
    )