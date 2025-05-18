/**
 * Calendar Data Integration Enhancement
 * This script ensures the calendar properly loads data from our enhanced utilities
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendar data integration enhancement loaded');
    
    // Wait for the calendar to be initialized
    const checkCalendar = setInterval(function() {
        // Check if calendar exists
        const calendarEl = document.getElementById('calendar');
        
        if (!calendarEl) {
            console.log('Calendar element not found yet');
            return;
        }
        
        // Check if calendar is initialized
        if (window.calendar) {
            console.log('Calendar is initialized, enhancing data source');
            clearInterval(checkCalendar);
            enhanceCalendarDataSource();
        }
    }, 500);
    
    // Give up after 10 seconds
    setTimeout(function() {
        clearInterval(checkCalendar);
    }, 10000);
    
    /**
     * Enhance the calendar data source to use our safe data functions
     */
    function enhanceCalendarDataSource() {
        console.log('Enhancing calendar data source');
        
        // Check if our safe data function exists
        if (typeof getSafeAppointments !== 'function') {
            console.log('getSafeAppointments function not found, skipping enhancement');
            return;
        }
        
        try {
            // Get the calendar instance
            const calendar = window.calendar;
            
            // If it has a refetchEvents method, we can enhance the data source
            if (calendar && typeof calendar.refetchEvents === 'function') {
                console.log('Setting up enhanced event source');
                
                // Try to set a safer events source
                if (typeof calendar.setOption === 'function') {
                    calendar.setOption('events', function(info, successCallback, failureCallback) {
                        try {
                            console.log('Using enhanced data source for calendar');
                            const appointments = getSafeAppointments();
                            successCallback(appointments);
                        } catch (error) {
                            console.error('Error fetching safe appointments:', error);
                            failureCallback(error);
                        }
                    });
                    
                    // Refetch events to apply the new source
                    calendar.refetchEvents();
                    
                    console.log('Enhanced event source set up successfully');
                }
            }
        } catch (error) {
            console.error('Error enhancing calendar data source:', error);
        }
    }
});

// Log that the script is loaded
console.log('Calendar data integration enhancement script loaded successfully');
