from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch
from html import escape

def generate_invoice_pdf(payment_data, company_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    
    # Custom styles
    normal_style = styles['Normal']
    header_style = ParagraphStyle('BoldHeader', parent=normal_style, fontName='Helvetica-Bold', fontSize=12)
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=20, alignment=1, spaceAfter=20)
    
    elements = []

    # Header
    from flask import current_app
    brand = current_app.config.get("BRAND_NAME", "CaseduleAI")
    elements.append(Paragraph(f"<b>{brand}</b>", title_style))
    elements.append(Paragraph("SaaS Subscription Invoice", ParagraphStyle('Sub', parent=normal_style, alignment=1, fontSize=10, spaceAfter=30)))
    
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=20))

    # Info Row (Bill To vs Invoice Details)
    bill_to_v = [
        [Paragraph("<b>BILL TO:</b>", header_style), Paragraph("<b>INVOICE DETAILS:</b>", header_style)],
        [
            Paragraph(escape(company_data.get('name', 'N/A')), normal_style),
            Paragraph(f"Invoice #: INV-{payment_data.get('id'):04d}", normal_style)
        ],
        [
            Paragraph(escape(company_data.get('address', 'N/A')), normal_style),
            Paragraph(f"Date: {payment_data.get('paymentDate')}", normal_style)
        ],
        [
            Paragraph(escape(company_data.get('email', 'N/A')), normal_style),
            Paragraph(f"Status: {payment_data.get('status', 'Paid').capitalize()}", normal_style)
        ],
    ]
    
    info_table = Table(bill_to_v, colWidths=[3*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.5 * inch))

    # Item Table
    data = [
        [Paragraph("<b>Description</b>", header_style), Paragraph("<b>Plan</b>", header_style), Paragraph("<b>Amount</b>", header_style)],
        [
            Paragraph(f"{company_data.get('name')} Subscription", normal_style),
            Paragraph(payment_data.get('plan', 'N/A').capitalize(), normal_style),
            Paragraph(f"₹{payment_data.get('amount'):,}", normal_style)
        ]
    ]
    
    t = Table(data, colWidths=[3.5*inch, 1.2*inch, 1.3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
    ]))
    elements.append(t)
    
    # Total
    total_data = [
        ["", "TOTAL:", f"₹{payment_data.get('amount'):,}"]
    ]
    tt = Table(total_data, colWidths=[3.5*inch, 1.2*inch, 1.3*inch])
    tt.setStyle(TableStyle([
        ('FONTNAME', (1,0), (2,0), 'Helvetica-Bold'),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 15),
    ]))
    elements.append(tt)

    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("Thank you for your business!", ParagraphStyle('Thanks', parent=normal_style, alignment=1, fontName='Helvetica-Oblique')))

    doc.build(elements)
    buffer.seek(0)
    return buffer
