// emails.js
// Handles email settings and template editing for appointment notifications

document.addEventListener('DOMContentLoaded', function() {
    // Load settings
    const autoEmail = localStorage.getItem('autoEmail') === 'true';
    const manualEmail = localStorage.getItem('manualEmail') === 'true';
    const template = localStorage.getItem('emailTemplate') ||
        `Hello {customerName},\n\nYour appointment is scheduled for {date}.\nYou can confirm, cancel, or reschedule using this link: {statusLink}\n\nThank you!\n\n{businessName}`;

    document.getElementById('auto-email').checked = autoEmail;
    document.getElementById('manual-email').checked = manualEmail;
    document.getElementById('email-template').value = template;

    document.getElementById('auto-email').onchange = function() {
        localStorage.setItem('autoEmail', this.checked);
    };
    document.getElementById('manual-email').onchange = function() {
        localStorage.setItem('manualEmail', this.checked);
    };
    
    document.getElementById('save-template').onclick = function() {
        const template = document.getElementById('email-template').value;
        localStorage.setItem('emailTemplate', template);
        
        const saveStatus = document.getElementById('save-status');
        saveStatus.textContent = 'Template saved successfully!';
        saveStatus.className = 'success';
        saveStatus.style.display = 'block';
        
        setTimeout(() => {
            saveStatus.style.display = 'none';
        }, 3000);
    };
    
    document.getElementById('send-test').addEventListener('click', function() {
        const emailAddress = document.getElementById('test-email-address').value.trim();
        
        if (!emailAddress) {
            alert('Please enter an email address');
            return;
        }
        
        if (!/\S+@\S+\.\S+/.test(emailAddress)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Create test data
        const testData = {
            customerName: 'Test Customer',
            date: new Date().toLocaleString(),
            statusLink: 'https://www.monumevip.co/static/appointment-status.html?token=test123456789',
            type: 'Consultation',
            businessName: 'MonuMe'
        };
        
        // Get email template and replace tokens
        let template = document.getElementById('email-template').value;
        Object.keys(testData).forEach(key => {
            template = template.replace(new RegExp(`{${key}}`, 'g'), testData[key]);
        });
          // Send test email
        fetch('/send_simple_email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: emailAddress,
                subject: 'Test Appointment Email',
                body: template
            })
        })
        .then(response => response.json())
        .then(data => {
            const saveStatus = document.getElementById('save-status');
            
            if (data.success) {
                saveStatus.textContent = 'Test email sent successfully!';
                saveStatus.className = 'success';
            } else {
                saveStatus.textContent = 'Failed to send test email: ' + (data.error || 'Unknown error');
                saveStatus.className = 'error';
            }
            
            saveStatus.style.display = 'block';
            setTimeout(() => {
                saveStatus.style.display = 'none';
            }, 5000);
        })
        .catch(err => {
            const saveStatus = document.getElementById('save-status');
            saveStatus.textContent = 'Error: ' + err.message;
            saveStatus.className = 'error';
            saveStatus.style.display = 'block';
            
            setTimeout(() => {
                saveStatus.style.display = 'none';
            }, 5000);
        });
    });
});
