/**
 * Calendar Enhancer Module
 * Enhances the appearance and functionality of the calendar
 */

document.addEventListener('DOMContentLoaded', function() {
    // Once the DOM is loaded, apply the enhancements
    enhanceCalendarEvents();
    
    // Listen for DOM changes (like when events are added dynamically)
    observeCalendarChanges();
});

/**
 * Enhances calendar events with improved styling
 */
function enhanceCalendarEvents() {
    // Wait a bit for FullCalendar to render all events
    setTimeout(() => {
        // Style regular appointments
        const appointments = document.querySelectorAll('.event-appointment');
        appointments.forEach(appointment => {
            enhanceEventElement(appointment, false);
        });
        
        // Style special events
        const events = document.querySelectorAll('.event-event');
        events.forEach(event => {
            enhanceEventElement(event, true);
        });
        
        // Style the calendar header
        enhanceCalendarHeader();
        
        // Ensure date cells have consistent styling and hide week numbers
        enhanceDateCellAppearance();
    }, 500);
}

/**
 * Enhances individual event elements
 */
function enhanceEventElement(element, isEvent) {
    // Determine the colors based on event type
    const colors = isEvent ? 
        { bg: '#8e44ad', border: '#7d3c98', hover: '#9b59b6' } :
        { bg: '#ff9562', border: '#e08550', hover: '#ff7f42' };
    
    // Apply enhanced styling
    element.style.backgroundColor = colors.bg;
    element.style.borderColor = colors.border;
    element.style.borderWidth = '0 0 0 4px';
    element.style.borderRadius = '4px';
    element.style.boxShadow = `0 2px 5px rgba(0, 0, 0, 0.1)`;
    element.style.transition = 'all 0.2s ease';
    
    // Add hover effect
    element.addEventListener('mouseenter', () => {
        element.style.backgroundColor = colors.hover;
        element.style.transform = 'translateY(-2px)';
        element.style.boxShadow = `0 5px 10px rgba(0, 0, 0, 0.15)`;
    });
    
    element.addEventListener('mouseleave', () => {
        element.style.backgroundColor = colors.bg;
        element.style.transform = 'translateY(0)';
        element.style.boxShadow = `0 2px 5px rgba(0, 0, 0, 0.1)`;
    });
    
    // Add a subtle icon for events based on type
    const eventTitle = element.querySelector('.fc-event-title');
    if (eventTitle) {
        if (isEvent) {
            eventTitle.innerHTML = `<i class="fas fa-calendar-day"></i> ${eventTitle.innerHTML}`;
        }
    }
    // Set the correct event time in .fc-event-time (if present)
    const eventTime = element.querySelector('.fc-event-time');
    if (eventTime && element.fcSeg && element.fcSeg.eventRange) {
        // Use the event's start time from the event object (which is set from Schedule New Appointment)
        const eventObj = element.fcSeg.eventRange.def;
        let start = null;
        if (eventObj && eventObj.extendedProps && eventObj.start) {
            start = new Date(eventObj.start);
        } else if (element.fcSeg.eventRange.range && element.fcSeg.eventRange.range.start) {
            start = element.fcSeg.eventRange.range.start;
        }
        if (start instanceof Date && !isNaN(start)) {
            let hours = start.getHours();
            let minutes = start.getMinutes();
            let ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12;
            const timeStr = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            eventTime.textContent = timeStr;
        } else {
            eventTime.textContent = '';
        }
    }
}

/**
 * Enhances calendar header elements
 */
function enhanceCalendarHeader() {
    // Style the today button distinctly
    const todayButton = document.querySelector('.fc-today-button');
    if (todayButton) {
        todayButton.style.backgroundColor = '#a55eea';
        todayButton.style.fontWeight = '700';
        
        // Add shimmer effect
        todayButton.addEventListener('mouseenter', function() {
            this.classList.add('shimmer-effect');
        });
        
        todayButton.addEventListener('mouseleave', function() {
            this.classList.remove('shimmer-effect');
        });
    }
    
    // Style the title
    const title = document.querySelector('.fc-toolbar-title');
    if (title) {
        title.style.color = '#7d3c98';
        title.style.fontWeight = '700';
        title.style.textShadow = '0px 1px 2px rgba(142, 68, 173, 0.1)';
    }
    
    // Style the current date cell
    const todayCell = document.querySelector('.fc-day-today');
    if (todayCell) {
        todayCell.style.backgroundColor = 'rgba(142, 68, 173, 0.1)';
        todayCell.style.boxShadow = 'inset 0 0 5px rgba(142, 68, 173, 0.2)';
    }
    
    // Enhance toolbar appearance
    enhanceToolbar();
    
    // Fix button spacing
    enhanceButtonSpacing();
}

/**
 * Enhances the overall toolbar appearance
 */
function enhanceToolbar() {
    const toolbar = document.querySelector('.fc-toolbar');
    if (toolbar) {
        // Add subtle animation
        toolbar.style.animation = 'fadeIn 0.5s ease-out';
        
        // Add box shadow
        toolbar.style.boxShadow = '0 2px 8px rgba(142, 68, 173, 0.15)';
    }
}

/**
 * Enhances spacing between calendar buttons
 */
function enhanceButtonSpacing() {
    // Add margin to buttons and improve their appearance
    const buttons = document.querySelectorAll('.fc-button-primary');
    buttons.forEach(button => {
        // Add proper spacing
        button.style.margin = '0 5px';
        button.style.padding = '8px 15px';
        
        // Improve button appearance
        button.style.borderRadius = '8px';
        button.style.fontWeight = '600';
        button.style.textTransform = 'capitalize';
        
        // Add nice hover effect
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(142, 68, 173, 0.4)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '0 2px 5px rgba(142, 68, 173, 0.3)';
        });
    });
    
    // Add gap to button groups
    const buttonGroups = document.querySelectorAll('.fc-button-group');
    buttonGroups.forEach(group => {
        group.style.display = 'flex';
        group.style.gap = '8px';
        group.style.padding = '3px';
        group.style.backgroundColor = 'rgba(142, 68, 173, 0.05)';
        group.style.borderRadius = '10px';
        group.style.border = '1px solid rgba(142, 68, 173, 0.1)';
    });
    
    // Add margin to toolbar chunks
    const toolbarChunks = document.querySelectorAll('.fc-toolbar-chunk');
    toolbarChunks.forEach(chunk => {
        chunk.style.margin = '0 8px';
        chunk.style.display = 'flex';
        chunk.style.alignItems = 'center';
    });
    
    // Make sure the view buttons (month, week, day) are clearly visible
    const viewButtons = document.querySelectorAll('.fc-timeGridWeek-button, .fc-timeGridDay-button, .fc-dayGridMonth-button');
    viewButtons.forEach(button => {
        if (button.classList.contains('fc-button-active')) {
            button.style.backgroundColor = '#6c3483';
            button.style.fontWeight = '700';
        }
    });
}

/**
 * Ensures consistent styling across date cells and hides week numbers
 */
function enhanceDateCellAppearance() {
    // Apply consistent background color to all date cells
    const dateCells = document.querySelectorAll('.fc-daygrid-day');
    dateCells.forEach(cell => {
        cell.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    });
    
    // Make sure week numbers are hidden
    const weekNumbers = document.querySelectorAll('.fc-daygrid-week-number, .fc-week-number');
    weekNumbers.forEach(element => {
        element.style.display = 'none';
    });
    
    // Ensure list view button is hidden if it exists
    const listViewButton = document.querySelector('.fc-listMonth-button');
    if (listViewButton) {
        listViewButton.style.display = 'none';
    }
}

/**
 * Sets up a mutation observer to watch for calendar changes
 */
function observeCalendarChanges() {
    // Create a new observer
    const observer = new MutationObserver((mutations) => {
        // Look for changes to the calendar
        const calendarChanged = mutations.some(mutation => {
            return mutation.type === 'childList' && 
                   mutation.target.classList && 
                   (mutation.target.classList.contains('fc') || 
                    mutation.target.closest('.fc'));
        });
        
        // If calendar content changed, re-apply our enhancements
        if (calendarChanged) {
            enhanceCalendarEvents();
        }
    });
    
    // Start observing the calendar container
    const calendarContainer = document.querySelector('.calendar-container');
    if (calendarContainer) {
        observer.observe(calendarContainer, {
            childList: true,
            subtree: true
        });
    }
}

// Add event to window.calendar to enhance events after refetchEvents
const originalRefetchEvents = window.calendar ? window.calendar.refetchEvents : null;
if (originalRefetchEvents) {
    window.calendar.refetchEvents = function() {
        originalRefetchEvents.call(window.calendar);
        setTimeout(enhanceCalendarEvents, 500);
    };
}
