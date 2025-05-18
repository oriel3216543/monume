/**
 * Event Status Selector for Creating New Appointments
 * Status is locked to "Scheduled" by default - only customers can change via status link
 */

document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('new-event-status');
    
    if (statusElement) {
        // Add tooltip to explain status behavior
        statusElement.title = "Event status will start as 'Scheduled' and can only change when customers interact with the event link";
        
        // Set the status to "Scheduled" by default
        statusElement.textContent = "Scheduled";
        statusElement.className = "appointment-status scheduled";
        
        // Add a note element below the status
        const statusNote = document.createElement('div');
        statusNote.className = 'status-note';
        statusNote.innerHTML = `
            <div style="margin-top: 8px; padding: 5px 10px; background: rgba(25, 135, 84, 0.1); border-radius: 4px; font-size: 12px;">
                <i class="fas fa-info-circle"></i> Status will update automatically based on customer actions:
                <ul style="margin: 5px 0 0 20px; padding: 0;">
                    <li>When confirmed by customer → Confirmed</li>
                    <li>When rescheduled → Rescheduled</li>
                    <li>When cancelled → Cancelled</li>
                </ul>
            </div>
        `;
        
        // Insert the note after the status element's parent (status-indicator-wrapper)
        const wrapper = statusElement.closest('.status-indicator-wrapper');
        if (wrapper && wrapper.parentNode) {
            wrapper.parentNode.insertBefore(statusNote, wrapper.nextSibling);
        }
        
        // Always set the form data-status to "scheduled"
        const appointmentForm = document.getElementById('appointment-form');
        if (appointmentForm) {
            appointmentForm.dataset.status = 'scheduled';
        }
    }
});
