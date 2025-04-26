from fpdf import FPDF
import csv

def generate_pdf(csv_file):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=8)
    
    with open(csv_file, 'r') as f:
        reader = csv.reader(f)
        for row in reader:
            pdf.cell(200, 10, txt=' | '.join(row), ln=True)

    path = "temp/report.pdf"
    pdf.output(path)
    return path