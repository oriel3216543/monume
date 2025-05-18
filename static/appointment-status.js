// appointment-status.js
// Handles appointment status actions from the unique customer link

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function updateStatusUI(status, info) {
    const statusEl = document.getElementById('appointment-status');
    
    // Clear previous content
    statusEl.innerHTML = '';
    
    // Add appropriate icon based on status
    let icon = 'question-circle';
    let statusClass = '';
    
    switch(status.toLowerCase()) {
        case 'confirmed':
            icon = 'check-circle';
            statusClass = 'status-confirmed';
            break;
        case 'cancelled':
            icon = 'times-circle';
            statusClass = 'status-cancelled';
            break;
        case 'rescheduled':
            icon = 'calendar-alt';
            statusClass = 'status-rescheduled';
            break;
        case 'scheduled':
            icon = 'clock';
            statusClass = 'status-scheduled';
            break;
    }
    
    statusEl.innerHTML = `<i class="fas fa-${icon}"></i> ${status}`;
    statusEl.className = `status ${statusClass}`;
    document.getElementById('appointment-info').textContent = info || '';
}

function setActionsVisible(visible) {
    document.getElementById('appointment-actions').style.display = visible ? '' : 'none';
    document.getElementById('thank-you').style.display = 'none';
}

function setRescheduleVisible(visible) {
    document.getElementById('reschedule-form').style.display = visible ? '' : 'none';
    document.getElementById('appointment-actions').style.display = visible ? 'none' : '';
}

function showThankYou() {
    document.getElementById('appointment-actions').style.display = 'none';
    document.getElementById('reschedule-form').style.display = 'none';
    document.getElementById('thank-you').style.display = '';
}

// Simulate backend with localStorage for demo
function getAppointment(token) {
    const data = localStorage.getItem('appointments');
    if (!data) return null;
    const appointments = JSON.parse(data);
    return appointments.find(a => a.token === token);
}

function updateAppointment(token, updates) {
    const data = localStorage.getItem('appointments');
    if (!data) return;
    let appointments = JSON.parse(data);
    const idx = appointments.findIndex(a => a.token === token);
    if (idx === -1) return;
    appointments[idx] = { ...appointments[idx], ...updates };
    localStorage.setItem('appointments', JSON.stringify(appointments));
}

// Functions to interact with the server API
function updateAppointmentStatusAPI(token, status, datetime = null) {
    const data = {
        token: token,
        status: status
    };
    
    if (datetime) {
        data.datetime = datetime;
    }
    
    return fetch('/api/appointment-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Also update localStorage for offline access
            updateAppointment(token, { status: status, ...(datetime ? { datetime: datetime, start: new Date(datetime).toISOString() } : {}) });
            return result;
        } else {
            throw new Error(result.error || 'Failed to update appointment status');
        }
    });
}

// Improved version of existing handler functions
document.addEventListener('DOMContentLoaded', function() {
    const token = getQueryParam('token');
    if (!token) {
        updateStatusUI('Invalid Link', 'No appointment token provided. Please check your email for the correct link or contact us for assistance.');
        setActionsVisible(false);
        return;
    }
    let appt = getAppointment(token);
    if (!appt) {
        updateStatusUI('Not Found', 'Appointment not found. This may be because the appointment has been deleted or the link is incorrect.');
        setActionsVisible(false);
        return;
    }
    
    function refresh() {
        appt = getAppointment(token);
        // Handle different appointment data formats
        let customerName = '';
        let appointmentDate = '';
        
        if (appt.extendedProps && appt.extendedProps.customerName) {
            customerName = appt.extendedProps.customerName;
        } else if (appt.customerName) {
            customerName = appt.customerName;
        }
        
        if (appt.datetime) {
            appointmentDate = new Date(appt.datetime).toLocaleString();
        } else if (appt.start) {
            appointmentDate = new Date(appt.start).toLocaleString();
        }
        
        const title = appt.title ? `"${appt.title}"` : '';
        const infoText = `${title} appointment for ${customerName || 'you'} on ${appointmentDate}`;
        
        updateStatusUI(
            appt.status.charAt(0).toUpperCase() + appt.status.slice(1),
            infoText
        );
        
        if (appt.status === 'scheduled') {
            setActionsVisible(true);
        } else {
            setActionsVisible(false);
            showThankYou();
        }
        setRescheduleVisible(false);
    }
    
    refresh();
    
    // Replace the existing button handlers with API-enabled versions
    document.getElementById('confirm-btn').onclick = function() {
        if (confirm('Are you sure you want to confirm this appointment?')) {
            updateAppointmentStatusAPI(token, 'confirmed')
                .then(() => {
                    showThankYou();
                    updateStatusUI('Confirmed', 'Thank you for confirming your appointment.');
                })
                .catch(error => {
                    alert('Error updating status: ' + error.message);
                    console.error('API Error:', error);
                });
        }
    };
    
    document.getElementById('cancel-btn').onclick = function() {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            updateAppointmentStatusAPI(token, 'cancelled')
                .then(() => {
                    showThankYou();
                    updateStatusUI('Cancelled', 'Your appointment has been cancelled.');
                })
                .catch(error => {
                    alert('Error updating status: ' + error.message);
                    console.error('API Error:', error);
                });
        }
    };
    
    document.getElementById('reschedule-btn').onclick = function() {
        setRescheduleVisible(true);
    };
    
    document.getElementById('back-to-options').onclick = function() {
        setRescheduleVisible(false);
    };
    
    document.getElementById('submit-reschedule').onclick = function() {
        const newDate = document.getElementById('new-date').value;
        if (!newDate) return alert('Please select a new date/time.');
        
        const newDateTime = new Date(newDate);
        if (isNaN(newDateTime.getTime())) {
            return alert('Please enter a valid date and time.');
        }
        
        if (confirm('Are you sure you want to request rescheduling to this new time?')) {
            updateAppointmentStatusAPI(token, 'rescheduled', newDate)
                .then(() => {
                    showThankYou();
                    updateStatusUI('Rescheduled', 'Your reschedule request has been submitted.');
                })
                .catch(error => {
                    alert('Error updating status: ' + error.message);
                    console.error('API Error:', error);
                });
        }
    };
});
