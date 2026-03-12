import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.reports.case_report import generate_case_report_pdf

# Dummy case data
case_data = {
    'title': 'Test Case',
    'caseNumber': '123/2024',
    'courtName': 'High Court',
    'district': 'Ernakulam',
    'caseType': 'Civil',
    'assignedAdvocate': {'name': 'Adv. John Doe'},
    'currentStatus': 'Open',
    'createdAt': '2024-03-12T10:00:00Z',
    'hearings': [
        {'hearingDate': '2024-03-15', 'notes': 'Test notes', 'outcome': 'Pending'}
    ],
    'updates': [
        {'createdAt': '2024-03-12T11:00:00Z', 'authorName': 'Admin', 'updateText': 'Update < & > test'}
    ],
    'documents': [
        {'originalFilename': 'test.pdf', 'documentType': 'Evidence', 'uploadedBy': 'Admin', 'createdAt': '2024-03-12T10:30:00Z'}
    ]
}

try:
    print("Starting PDF generation...")
    pdf = generate_case_report_pdf(case_data)
    print("PDF generated successfully!")
    with open('test_report.pdf', 'wb') as f:
        f.write(pdf.read())
    print("Saved to test_report.pdf")
except Exception as e:
    import traceback
    traceback.print_exc()
