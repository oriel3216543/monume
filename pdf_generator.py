import os
import logging
from datetime import datetime
from pdfdocument.document import PDFDocument

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='server_logs.txt'
)
logger = logging.getLogger('pdf_generator')

def generate_performance_pdf(user_data):
    try:
        os.makedirs('temp', exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"temp/performance_summary_{user_data.get('user_id', 'user')}_{timestamp}.pdf"

        pdf = PDFDocument(filename)
        pdf.init_report()

        # Title and date
        pdf.h1("MonuMe Tracker - Performance Summary")
        pdf.p(f"Generated on: {user_data.get('date', datetime.now().strftime('%Y-%m-%d'))}")
        pdf.p(f"User: {user_data.get('user_name', 'User')}")

        pdf.h2("Performance Metrics")
        pdf.table([
            ["Metric", "Value"],
            ["Opal Demos", user_data.get('opal_demos', 0)],
            ["Opal Sales", user_data.get('opal_sales', 0)],
            ["Scan Demos", user_data.get('scan_demos', 0)],
            ["Scan Sold", user_data.get('scan_sold', 0)],
            ["Net Sales", f"${user_data.get('net_sales', 0)}"],
            ["Hours Worked", user_data.get('hours_worked', 0)],
            ["Success Rate", f"{user_data.get('success_rate', 0)}%"],
            ["Sales per Hour", f"${user_data.get('sales_per_hour', 0)}"]
        ])

        # Add a performance message
        success_rate = user_data.get('success_rate', 0)
        if success_rate > 80:
            message = "Excellent performance!"
        elif success_rate > 60:
            message = "Good performance."
        elif success_rate > 40:
            message = "Average performance."
        else:
            message = "Below target. Try improving."

        pdf.h2("Performance Analysis")
        pdf.p(message)

        pdf.generate()
        return filename
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        return None

def generate_test_pdf():
    try:
        test_data = {
            'user_id': 'test',
            'user_name': 'Test User',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'opal_demos': 5,
            'opal_sales': 2,
            'scan_demos': 8,
            'scan_sold': 3,
            'net_sales': 750,
            'hours_worked': 8,
            'success_rate': 62.5,
            'sales_per_hour': 93.75
        }
        return generate_performance_pdf(test_data)
    except Exception as e:
        logger.error(f"Error generating test PDF: {str(e)}")
        return None
