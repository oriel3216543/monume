import os
import logging
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='server_logs.txt'
)
logger = logging.getLogger('pdf_generator')

def generate_performance_pdf(user_data):
    """Generate a performance summary PDF for a user"""
    try:
        # Create temp directory if not exists
        os.makedirs('temp', exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"temp/performance_summary_{user_data.get('user_id', 'user')}_{timestamp}.pdf"
        
        # Create document
        doc = SimpleDocTemplate(
            filename,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Initialize story (content)
        styles = getSampleStyleSheet()
        story = []
        
        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#ff9562'),
            spaceAfter=12
        )
        
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#ff7f42'),
            spaceAfter=6
        )
        
        date_style = ParagraphStyle(
            'DateStyle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.gray,
            alignment=1  # Center
        )
        
        # Add logo if available
        logo_path = 'static/images/logo.png'
        if os.path.exists(logo_path):
            img = Image(logo_path, width=2*inch, height=1*inch)
            story.append(img)
            story.append(Spacer(1, 0.5*inch))
        
        # Add title
        story.append(Paragraph("MonuMe Tracker - Performance Summary", title_style))
        
        # Add date and user info
        date_str = user_data.get('date', datetime.now().strftime('%Y-%m-%d'))
        story.append(Paragraph(f"Generated on: {date_str}", date_style))
        story.append(Spacer(1, 0.25*inch))
        
        # Add user information
        user_name = user_data.get('user_name', 'User')
        story.append(Paragraph(f"User: {user_name}", styles['Heading3']))
        story.append(Spacer(1, 0.25*inch))
        
        # Performance metrics section
        story.append(Paragraph("Performance Metrics", subtitle_style))
        story.append(Spacer(1, 0.1*inch))
        
        # Create performance table data
        data = [
            ["Metric", "Value"],
            ["Opal Demos", user_data.get('opal_demos', 0)],
            ["Opal Sales", user_data.get('opal_sales', 0)],
            ["Scan Demos", user_data.get('scan_demos', 0)],
            ["Scan Sold", user_data.get('scan_sold', 0)],
            ["Net Sales", f"${user_data.get('net_sales', 0)}"],
            ["Hours Worked", user_data.get('hours_worked', 0)],
            ["Success Rate", f"{user_data.get('success_rate', 0)}%"],
            ["Sales per Hour", f"${user_data.get('sales_per_hour', 0)}"]
        ]
        
        # Create table
        table = Table(data, colWidths=[2.5*inch, 2.5*inch])
        
        # Add style to table
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#ff9562')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (1, 0), 12),
            ('BACKGROUND', (0, 1), (1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            # Alternate row colors
            ('BACKGROUND', (0, 2), (-1, 2), colors.lightgrey),
            ('BACKGROUND', (0, 4), (-1, 4), colors.lightgrey),
            ('BACKGROUND', (0, 6), (-1, 6), colors.lightgrey),
            ('BACKGROUND', (0, 8), (-1, 8), colors.lightgrey),
        ])
        
        table.setStyle(table_style)
        story.append(table)
        
        # Add note about performance
        story.append(Spacer(1, 0.5*inch))
        
        # Conditionally add performance analysis
        success_rate = user_data.get('success_rate', 0)
        if success_rate > 80:
            performance_text = "Excellent performance! Your success rate is outstanding."
        elif success_rate > 60:
            performance_text = "Good performance. Your success rate is above average."
        elif success_rate > 40:
            performance_text = "Average performance. There's room for improvement in your success rate."
        else:
            performance_text = "Below target performance. Consider strategies to improve your success rate."
        
        story.append(Paragraph("Performance Analysis:", subtitle_style))
        story.append(Paragraph(performance_text, styles['Normal']))
        
        # Add footer
        story.append(Spacer(1, inch))
        footer_text = "This is an automated report generated by MonuMe Tracker."
        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.gray,
            alignment=1  # Center
        )
        story.append(Paragraph(footer_text, footer_style))
        
        # Build PDF
        doc.build(story)
        
        return filename
    
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        return None

def generate_test_pdf():
    """Generate a test PDF for email testing"""
    try:
        # Create sample user data
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
        
        # Generate PDF
        return generate_performance_pdf(test_data)
    
    except Exception as e:
        logger.error(f"Error generating test PDF: {str(e)}")
        return None
