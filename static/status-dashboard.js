/**
 * Status Dashboard JavaScript
 * Handles loading and displaying appointment status changes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadStatusChanges();
    
    // Set up refresh button
    document.getElementById('refresh-btn').addEventListener('click', function() {
        this.classList.add('rotating');
        loadStatusChanges();
        
        // Remove the rotating class after animation completes
        setTimeout(() => {
            this.classList.remove('rotating');
        }, 1000);
    });
    
    // Set up filter buttons
    document.querySelectorAll('.status-filter button').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.status-filter button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Apply filter
            const filter = this.getAttribute('data-filter');
            filterStatusCards(filter);
        });
    });
});

// Function to load status changes from the API
function loadStatusChanges() {
    // Clear current content and show loading indicator
    const container = document.getElementById('status-container');
    container.innerHTML = `
        <div class="no-changes">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Loading appointment status changes...</p>
        </div>
    `;
    
    // Fetch data from API
    fetch('/api/appointment-status-changes')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch status changes');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.statusChanges && data.statusChanges.length > 0) {
                displayStatusChanges(data.statusChanges);
            } else {
                container.innerHTML = `
                    <div class="no-changes">
                        <i class="fas fa-calendar-times fa-2x"></i>
                        <p>No recent appointment status changes</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching status changes:', error);
            container.innerHTML = `
                <div class="no-changes">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <p>Failed to load appointment status changes. Please try again later.</p>
                    <p class="error-message">${error.message}</p>
                </div>
            `;
        });
}

// Function to display status changes
function displayStatusChanges(changes) {
    const container = document.getElementById('status-container');
    
    // Clear container
    container.innerHTML = '';
    
    // Sort changes by timestamp (newest first)
    changes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Create HTML elements for each change
    changes.forEach(change => {
        const formattedDate = formatDate(change.timestamp);
        const originalDate = formatDate(change.originalDateTime);
        let newDateElement = '';
        
        // Add new date element for rescheduled appointments
        if (change.status === 'rescheduled' && change.newDateTime) {
            const newDate = formatDate(change.newDateTime);
            newDateElement = `
                <div class="status-detail">
                    <i class="fas fa-calendar-plus"></i>
                    <span>Requested new time: ${newDate}</span>
                </div>
            `;
        }
        
        // Create card HTML
        const card = document.createElement('div');
        card.className = `status-card ${change.status.toLowerCase()}`;
        card.setAttribute('data-status', change.status.toLowerCase());
        card.innerHTML = `
            <div class="status-header">
                <div>
                    <span class="status-badge ${change.status.toLowerCase()}">${change.status}</span>
                </div>
                <div class="status-time">${formattedDate}</div>
            </div>
            <div class="status-body">
                <div class="status-customer">${change.customerName}</div>
                <div class="status-detail">
                    <i class="fas fa-calendar"></i>
                    <span>Original appointment: ${originalDate}</span>
                </div>
                ${newDateElement}
                <div class="status-detail">
                    <i class="fas fa-comment"></i>
                    <span>${change.notes || 'No additional notes'}</span>
                </div>
            </div>
            <div class="status-actions">
                <button class="secondary" onclick="viewAppointment('${change.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="contactCustomer('${change.id}', '${change.customerName}')">
                    <i class="fas fa-phone"></i> Contact
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Apply current filter
    const activeFilter = document.querySelector('.status-filter button.active').getAttribute('data-filter');
    filterStatusCards(activeFilter);
}

// Function to filter status cards
function filterStatusCards(filter) {
    const cards = document.querySelectorAll('.status-card');
    
    cards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-status') === filter) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show "no changes" message if no visible cards
    const visibleCards = document.querySelectorAll('.status-card[style=""]').length;
    const container = document.getElementById('status-container');
    const noChangesElement = container.querySelector('.no-changes');
    
    if (visibleCards === 0 && !noChangesElement) {
        container.innerHTML += `
            <div class="no-changes">
                <i class="fas fa-filter fa-2x"></i>
                <p>No ${filter !== 'all' ? filter : ''} appointment status changes found</p>
            </div>
        `;
    } else if (noChangesElement && visibleCards > 0) {
        noChangesElement.remove();
    }
}

// Function to format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
    };
    
    try {
        return new Date(dateString).toLocaleString(undefined, options);
    } catch (e) {
        return dateString;
    }
}

// Function to view appointment details
function viewAppointment(appointmentId) {
    // In a real implementation, this would open the appointment details
    // For now, alert with the ID
    alert(`View appointment: ${appointmentId}`);
    
    // This would typically redirect to the calendar with the appointment details
    // window.location.href = `/static/events.html?view=${appointmentId}`;
}

// Function to contact customer
function contactCustomer(appointmentId, customerName) {
    // In a real implementation, this would show contact options
    // For now, alert with the customer name
    alert(`Contact customer: ${customerName}`);
    
    // This would typically open a modal with contact options
    // showContactModal(appointmentId, customerName);
}
