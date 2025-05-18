/**
 * Unified Calendar Refresh
 * This script fixes the issue with updateCalendarEvents not being defined
 * and ensures calendar refresh works consistently
 */

// Create a global updateCalendarEvents function that redirects to refreshCalendarEvents
window.updateCalendarEvents = function() {
    console.log('updateCalendarEvents called -> redirecting to refreshCalendarEvents');
    if (typeof refreshCalendarEvents === 'function') {
        refreshCalendarEvents();
    } else {
        console.error('refreshCalendarEvents is not defined, attempting direct calendar refresh');
        
        // Try direct refresh method
        try {
            // Find the calendar element
            const calendarEl = document.getElementById('calendar');
            
            // Find the calendar instance from various possible locations
            let calendar = null;
            
            if (calendarEl) {
                calendar = calendarEl._calendar || window.calendar || document.monumeCalendar;
            }
            
            if (calendar && typeof calendar.refetchEvents === 'function') {
                console.log('Refreshing calendar using refetchEvents');
                calendar.refetchEvents();
                return true;
            } else if (calendar && typeof calendar.removeAllEvents === 'function') {
                console.log('Refreshing calendar by removing and adding events');
                calendar.removeAllEvents();
                
                // Get appointments
                const appointments = typeof getSafeAppointments === 'function' 
                    ? getSafeAppointments() 
                    : JSON.parse(localStorage.getItem('appointments') || '[]');
                
                // Add appointments to calendar
                if (appointments && appointments.length > 0) {
                    calendar.addEventSource(appointments);
                }
                return true;
            }
        } catch (error) {
            console.error('Error directly refreshing calendar:', error);
        }
        
        return false;
    }
};

// Add confirmation when script is loaded
console.log('Unified calendar refresh bridge loaded - updateCalendarEvents is now defined');
