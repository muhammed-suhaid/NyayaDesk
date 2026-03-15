import os
from flask import Blueprint, request, jsonify
import google.generativeai as genai

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/case-analysis", methods=["POST"])
def case_analysis():
    # Fetch key inside the route
    api_key = os.environ.get("GOOGLE_API_KEY")

    if not api_key:
        print(f"AI ERROR: GOOGLE_API_KEY not found in environment. Current CWD: {os.getcwd()}")
        return jsonify({
            "error": "AI configuration missing. Please ensure GOOGLE_API_KEY is defined in api/.env"
        }), 500

    try:
        genai.configure(api_key=api_key)
        data = request.get_json()

        if not data:
            return jsonify({"error": "No request data provided."}), 400

        title = data.get("title")
        facts = data.get("facts")

        if not title or not facts:
            return jsonify({
                "message": "Case title and case description are required for AI analysis."
            }), 400

        # Optional fields
        case_number = data.get("caseNumber", "Not provided")
        court = data.get("court", "Not provided")
        district = data.get("district", "Not provided")
        case_type = data.get("caseType", "Not provided")
        client_name = data.get("clientName", "Not provided")
        advocate_name = data.get("advocateName", "Not provided")
        status = data.get("status", "Not provided")
        filing_date = data.get("filingDate", "Not provided")
        next_hearing = data.get("nextHearing", "Not scheduled")
        hearing_notes = data.get("hearingNotes") or "No hearing notes available."
        updates = data.get("updates") or "No case updates available."

        prompt = f"""
You are an AI assistant that helps advocates analyze legal cases in **Indian law**.

Use only the information provided in the case facts. 
Do not assume information that is not mentioned.

CASE INFORMATION

Title: {title}
Case Number: {case_number}
Court: {court}
District: {district}
Case Type: {case_type}
Client: {client_name}
Advocate: {advocate_name}
Status: {status}
Filing Date: {filing_date}
Next Hearing Date: {next_hearing}

CASE FACTS
{facts}

HEARING NOTES
{hearing_notes}

CASE UPDATES
{updates}

TASK

Generate a **clear and relevant legal analysis** using these sections:

1. Case Details
2. Case Summary
3. Possible Legal Arguments
4. Relevant Indian Laws or Acts
5. Suggested Legal Strategy
6. Evidence Suggestions

RULES

• Use clear and simple English.
• Do not write introductions like "Here is the analysis".
• Start directly with "Case Details".
• Use bullet points.
• Only mention laws that are relevant to the case facts.
• Keep the answer concise and practical.
"""

        model = genai.GenerativeModel("gemini-flash-latest")
        
        # Generation configuration
        config = genai.types.GenerationConfig(
            temperature=0.3,
            max_output_tokens=2048
        )

        response = model.generate_content(prompt, generation_config=config)

        if not response:
             return jsonify({"error": "AI could not generate suggestions."}), 500
        
        try:
            # Safely check for text
            if response.candidates and len(response.candidates) > 0:
                analysis_text = response.text
                return jsonify({"analysis": analysis_text})
            else:
                return jsonify({"error": "AI could not generate a response. No candidates returned."}), 500
                
        except (ValueError, AttributeError) as e:
            # This happens if safety filters block the response
            print(f"AI SAFETY/VALIDATION ERROR: {str(e)}")
            return jsonify({"error": "AI could not generate a response. The content might have been filtered by safety settings."}), 500

    except Exception as e:
        print("AI EXCEPTION:", str(e))
        return jsonify({
            "error": "AI analysis is currently unavailable. Please try again later."
        }), 500


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