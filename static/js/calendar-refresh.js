/**
 * Calendar refresh utility for MonuMe Tracker
 * This script ensures the calendar is refreshed after appointments are updated
 */

/**
 * Refresh calendar events from local storage
 */
function refreshCalendarEvents() {
    console.log('Refreshing calendar events');
    try {
        // Get the calendar element
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl || !calendarEl._calendar) {
            console.warn('Calendar not initialized properly, trying alternate methods');
            
            // Try to find calendar in global scope
            if (window.calendar) {
                console.log('Found calendar in window object');
                reloadCalendarData(window.calendar);
                return true;
            }
            
            return false;
        }
        
        // Get the calendar instance
        const calendar = calendarEl._calendar;
        
        // Reload data
        reloadCalendarData(calendar);
        
        return true;
    } catch (error) {
        console.error('Error refreshing calendar:', error);
        return false;
    }
}

/**
 * Reload calendar data from localStorage
 * @param {Object} calendar - The FullCalendar instance
 */
function reloadCalendarData(calendar) {
    if (!calendar) {
        console.error('No calendar instance provided to reloadCalendarData');
        return false;
    }
    
    try {
        // Remove existing events
        calendar.removeAllEvents();
        
        // Get updated appointments from localStorage
        const appointments = getAppointments();
        
        // Add events back to calendar
        calendar.addEventSource(appointments);
        
        // Re-render the calendar
        calendar.render();
        
        console.log('Calendar data reloaded successfully');
        return true;
    } catch (error) {
        console.error('Error reloading calendar data:', error);
        return false;
    }
}

// Expose function to global scope
window.refreshCalendarEvents = refreshCalendarEvents;
