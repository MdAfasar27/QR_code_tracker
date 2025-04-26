from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os
import csv
from utils.pdf_generator import generate_pdf
from utils.email_sender import send_email

app = Flask(__name__)
CSV_FILE = 'temp/data.csv'

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start_walk():
    try:
        os.makedirs('temp', exist_ok=True)
        start_time = datetime.now().strftime('%d-%m-%Y %H:%M:%S')

        with open(CSV_FILE, 'w', newline='') as file:
            writer = csv.writer(file)
            # Write Start Time in the first row with headers
            writer.writerow(['Start Time'])
            # Add the actual start time in the second row
            writer.writerow([start_time])

        print("Start time saved:", start_time)
        return jsonify({'status': 'started', 'start_time': start_time})
    except Exception as e:
        print("Error in /start:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/scan', methods=['POST'])
def scan_qr():
    data = request.json
    scan_time = data.get('scan_time')
    gps = data.get('gps')
    address = data.get('address')
    qr_text = data.get('qr_text')

    try:
        # Append the scan data to the CSV file
        with open(CSV_FILE, 'a', newline='') as f:
            writer = csv.writer(f)
            # Write the scan data in the next row
            writer.writerow([scan_time, address])
        return jsonify({'status': 'success'})
    except Exception as e:
        print("Error in /scan:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/submit', methods=['POST'])
def submit_walk():
    try:
        os.makedirs('temp', exist_ok=True)
        Submit_time = datetime.now().strftime('%d-%m-%Y %H:%M:%S')

        with open(CSV_FILE, 'a', newline='') as file:
            writer = csv.writer(file)
            # Write Start Time in the first row with headers
            writer.writerow(['Submit Time'])
            # Add the actual start time in the second row
            writer.writerow([Submit_time])

        print("Start time saved:", Submit_time)
        pdf_path = generate_pdf(CSV_FILE)
        send_email(pdf_path)
        os.remove(CSV_FILE)
        os.remove(pdf_path)
        return jsonify({'status': 'submitted', 'Submit_time': Submit_time})
    except Exception as e:
        print("Error in /submit:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
