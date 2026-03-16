from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from html import escape

def generate_case_report_pdf(case_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom styles
    normal_style = styles['Normal']
    bold_style = ParagraphStyle('BoldNormal', parent=normal_style, fontName='Helvetica-Bold')

    elements = []

    # Title
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1 # Center
    )
    from flask import current_app
    brand = current_app.config.get("BRAND_NAME", "CaseduleAI")
    elements.append(Paragraph(f"{brand} Case Report", title_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Case Overview
    elements.append(Paragraph("<b>Case Overview</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.1 * inch))
    
    advocate_name = "Unassigned"
    adv = case_data.get('assignedAdvocate')
    if adv and isinstance(adv, dict):
        advocate_name = adv.get('name', 'Unassigned')

    def row_p(text):
        return Paragraph(escape(str(text or 'N/A')), normal_style)

    overview_data = [
        ["Case Title:", row_p(case_data.get('title'))],
        ["Case Number:", row_p(case_data.get('caseNumber'))],
        ["Court:", row_p(case_data.get('courtName'))],
        ["District:", row_p(case_data.get('district'))],
        ["Case Type:", row_p(case_data.get('caseType'))],
        ["Assigned Advocate:", row_p(advocate_name)],
        ["Status:", row_p(case_data.get('currentStatus'))],
        ["Filing Date:", row_p((case_data.get('createdAt') or '')[:10])],
    ]
    
    t = Table(overview_data, colWidths=[1.5*inch, 4.5*inch])
    t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.3 * inch))

    # Hearings
    elements.append(Paragraph("<b>Hearings Timeline</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.1 * inch))
    if case_data.get('hearings'):
        hearing_rows = [[Paragraph("<b>Date</b>", normal_style), Paragraph("<b>Notes</b>", normal_style), Paragraph("<b>Outcome</b>", normal_style)]]
        for h in case_data['hearings']:
            hearing_rows.append([
                row_p(h.get('hearingDate')), 
                row_p(h.get('notes')), 
                row_p(h.get('outcome'))
            ])
        
        ht = Table(hearing_rows, colWidths=[1.2*inch, 3*inch, 1.8*inch])
        ht.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(ht)
    else:
        elements.append(Paragraph("No hearings recorded.", normal_style))
    elements.append(Spacer(1, 0.3 * inch))

    # Case Updates
    elements.append(Paragraph("<b>Case Updates</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.1 * inch))
    if case_data.get('updates'):
        for u in case_data['updates']:
            ts = (u.get('createdAt') or '')[:16]
            author = escape(str(u.get('authorName', 'Unknown')))
            text = escape(str(u.get('updateText', '')))
            update_text = f"<b>{ts} - {author}</b><br/>{text}"
            elements.append(Paragraph(update_text, normal_style))
            elements.append(Spacer(1, 0.1 * inch))
    else:
        elements.append(Paragraph("No updates recorded.", normal_style))
    elements.append(Spacer(1, 0.3 * inch))

    # Documents
    elements.append(Paragraph("<b>Documents</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.1 * inch))
    if case_data.get('documents'):
        doc_rows = [[Paragraph("<b>File Name</b>", normal_style), Paragraph("<b>Type</b>", normal_style), Paragraph("<b>Uploaded By</b>", normal_style), Paragraph("<b>Date</b>", normal_style)]]
        for d in case_data['documents']:
            doc_rows.append([
                row_p(d.get('originalFilename')), 
                row_p(d.get('documentType')), 
                row_p(d.get('uploadedBy')), 
                row_p((d.get('createdAt') or '')[:10])
            ])
        
        dt = Table(doc_rows, colWidths=[2.5*inch, 1*inch, 1.5*inch, 1*inch])
        dt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(dt)
    else:
        elements.append(Paragraph("No documents uploaded.", normal_style))
    elements.append(Spacer(1, 0.3 * inch))

    # Resolution
    if case_data.get('currentStatus') in ['Disposed', 'Closed']:
        elements.append(Paragraph("<b>Case Resolution</b>", styles['Heading2']))
        elements.append(Spacer(1, 0.1 * inch))
        res_data = [
            ["Disposal Date:", row_p(case_data.get('disposalDate'))],
            ["Outcome:", row_p(case_data.get('outcome'))],
            ["Reason:", row_p(case_data.get('disposalReason'))],
        ]
        rt = Table(res_data, colWidths=[1.5*inch, 4.5*inch])
        rt.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(rt)

    doc.build(elements)
    buffer.seek(0)
    return buffer
