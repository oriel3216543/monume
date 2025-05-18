// calendar-appointments-handler.js
// Ensures all appointment times and details are consistent between localStorage, calendar, and modal

document.addEventListener('DOMContentLoaded', function() {
    // Patch FullCalendar event source to always use localStorage
    if (window.calendar) {
        window.calendar.setOption('events', function(fetchInfo, successCallback, failureCallback) {
            try {
                const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
                successCallback(appointments);
            } catch (e) {
                failureCallback(e);
            }
        });
    }

    // Patch eventClick to always show correct details from localStorage
    if (window.calendar) {
        window.calendar.setOption('eventClick', function(info) {
            const eventId = info.event.id;
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            const appointment = appointments.find(a => a.id == eventId);
            if (appointment) {
                showAppointmentDetailsFromStorage(appointment);
            } else {
                // fallback to default
                if (typeof showAppointmentDetails === 'function') {
                    showAppointmentDetails(info.event);
                }
            }
        });
    }
});

// Helper to show details from localStorage appointment object
function showAppointmentDetailsFromStorage(appointment) {
    document.getElementById('modal-title').textContent = appointment.title || '';
    document.getElementById('modal-type').textContent = (appointment.extendedProps?.type || '').charAt(0).toUpperCase() + (appointment.extendedProps?.type || '').slice(1);
    const startDate = new Date(appointment.start);
    const endDate = new Date(appointment.end);
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let hours = startDate.getHours();
    let minutes = startDate.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    let displayHour = hours % 12;
    if (displayHour === 0) displayHour = 12;
    const timeStr = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    document.getElementById('modal-datetime').textContent = `${startDate.toLocaleDateString(undefined, dateOptions)} at ${timeStr}`;
    const durationMinutes = (endDate - startDate) / (1000 * 60);
    document.getElementById('modal-duration').textContent = `${durationMinutes} minutes`;
    document.getElementById('modal-customer').textContent = appointment.extendedProps?.customerName || '';
    document.getElementById('modal-sales-rep').textContent = appointment.extendedProps?.salesRepName || 'Not assigned';
    document.getElementById('modal-notes').textContent = appointment.extendedProps?.notes || appointment.notes || 'No notes';
    document.getElementById('appointment-modal').setAttribute('data-event-id', appointment.id);
    document.getElementById('appointment-modal').style.display = 'block';
}
