/**
 * Save Button Enhancement Script
 * This script fixes issues with the save button in the appointment edit modal
 */

// Execute immediately when loaded
(function() {
    console.log('Save button enhancement loading...');
    
    // Set up initialization on DOM ready and window load to ensure it runs
    document.addEventListener('DOMContentLoaded', initializeSaveButtonEnhancement);
    window.addEventListener('load', function() {
        setTimeout(initializeSaveButtonEnhancement, 500);
    });
    
    /**
     * Initialize the save button enhancement functionality
     */
    function initializeSaveButtonEnhancement() {
        console.log('Initializing save button enhancement');
        
        // Create a more robust save button handler that will persist
        createPersistentSaveHandler();
        
        // Add a mutation observer to detect when the modal is shown
        const modalObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style') {
                    const modal = document.getElementById('create-appointment-modal');
                    if (modal && modal.style.display === 'block') {
                        console.log('Modal displayed - setting up save button handler');
                        setupSaveButtonHandler();
                    }
                }
            });
        });
        
        // Start observing the modal
        const modal = document.getElementById('create-appointment-modal');
        if (modal) {
            modalObserver.observe(modal, { attributes: true });
            console.log('Modal observer set up for save button');
        }
    }
    
    /**
     * Create a persistent handler for the save button
     */
    function createPersistentSaveHandler() {
        // Add a global click listener for all save button clicks
        document.addEventListener('click', function(event) {
            // Find if the click was on the save button or its children
            let target = event.target;
            let isSaveButton = false;
            
            // Check if this is the save button or a child of it
            while (target && target !== document) {
                if (target.id === 'save-appointment' || 
                    (target.getAttribute && target.getAttribute('data-action') === 'save-appointment')) {
                    isSaveButton = true;
                    break;
                }
                target = target.parentNode;
            }
            
            if (!isSaveButton) return;
            
            console.log('Save button click detected through persistent handler');
            
            // Check if we're in edit mode
            const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                           document.getElementById('edit-appointment-id')?.value;
            
            if (!isEditing) {
                console.log('Not in edit mode, letting regular save handler work');
                return;
            }
            
            // In edit mode, prevent the default action
            event.preventDefault();
            event.stopPropagation();
            
            // Call our enhanced save function
            console.log('Using enhanced save function for edit mode');
            enhancedSaveWithHostFix();
        }, true); // Use capturing phase to ensure our handler runs first
    }
    
    /**
     * Set up enhanced save button handler
     */
    function setupSaveButtonHandler() {
        const saveButton = document.getElementById('save-appointment');
        
        if (!saveButton) {
            console.error('Save button not found');
            return;
        }
        
        // Remove any existing click listeners with the clone technique
        const newSaveButton = saveButton.cloneNode(true);
        if (saveButton.parentNode) {
            saveButton.parentNode.replaceChild(newSaveButton, saveButton);
        }
        
        // Add our enhanced click handler
        newSaveButton.addEventListener('click', function(event) {
            console.log('Save button clicked (direct handler)');
            
            // Check if we're in edit mode
            const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                           document.getElementById('edit-appointment-id')?.value;
            
            if (!isEditing) {
                console.log('Not in edit mode, letting regular save handler work');
                return;
            }
            
            // In edit mode, prevent the default action
            event.preventDefault();
            event.stopPropagation();
            
            // Call our enhanced save function
            console.log('Using enhanced save function for edit mode');
            enhancedSaveWithHostFix();
        });
    }
    
    /**
     * Enhanced save function with special host handling
     */
    function enhancedSaveWithHostFix() {
        console.log('Running enhanced save with host fix');
        
        try {
            // Get appointment ID
            const appointmentId = document.getElementById('edit-appointment-id')?.value;
            
            if (!appointmentId) {
                console.error('No appointment ID found for editing');
                return;
            }
            
            // Get current appointment data
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            const appointmentIndex = appointments.findIndex(a => String(a.id) === String(appointmentId));
            
            if (appointmentIndex === -1) {
                console.error('Could not find appointment with ID:', appointmentId);
                return;
            }
            
            const existingAppointment = appointments[appointmentIndex];
            console.log('Found existing appointment:', existingAppointment.title);
            
            // Get form data
            const title = document.getElementById('appointment-title')?.value || existingAppointment.title;
            
            // Get date and time values
            const startDate = document.getElementById('appointment-date')?.value;
            const startTime = getTimeValue(); // Helper function defined below
            
            // Create start and end date objects
            let startDateTime = new Date(existingAppointment.start);
            let endDateTime = new Date(existingAppointment.end);
            
            // If both date and time are provided
            if (startDate && startTime) {
                const [year, month, day] = startDate.split('-').map(Number);
                const [hours, minutes] = startTime.split(':').map(Number);
                startDateTime = new Date(year, month - 1, day, hours, minutes);
                
                // End time is 1 hour after start time
                endDateTime = new Date(startDateTime);
                endDateTime.setHours(startDateTime.getHours() + 1);
            } 
            // If only date is provided but no time
            else if (startDate && !startTime) {
                // Use the date from input but keep the original time
                const [year, month, day] = startDate.split('-').map(Number);
                const originalDate = new Date(existingAppointment.start);
                startDateTime = new Date(year, month - 1, day, 
                    originalDate.getHours(), originalDate.getMinutes());
                
                // End time is 1 hour after start time
                endDateTime = new Date(startDateTime);
                endDateTime.setHours(startDateTime.getHours() + 1);
            }
            
            // Get type and notes
            const type = document.getElementById('appointment-type')?.value || existingAppointment.extendedProps?.type || 'appointment';
            const notes = document.getElementById('appointment-notes')?.value || existingAppointment.extendedProps?.notes || '';
            
            // Handle customer data
            let customerId = '';
            let customerName = '';
            let customerPhone = '';
            let customerEmail = '';
            
            // Try to get customer from form or use existing data
            const customerIdElement = document.getElementById('selected-customer-id');
            
            if (customerIdElement && customerIdElement.value) {
                // Get from form
                customerId = customerIdElement.value;
                
                // Try to find customer details
                try {
                    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
                    const customer = customers.find(c => String(c.id) === String(customerId));
                    
                    if (customer) {
                        customerName = customer.firstName + ' ' + customer.lastName;
                        customerPhone = customer.phone || '';
                        customerEmail = customer.email || '';
                    }
                } catch (error) {
                    console.error('Error getting customer details:', error);
                }
            } else {
                // Use existing data
                customerId = existingAppointment.extendedProps?.customerId || '';
                customerName = existingAppointment.extendedProps?.customerName || '';
                customerPhone = existingAppointment.extendedProps?.customerPhone || '';
                customerEmail = existingAppointment.extendedProps?.customerEmail || '';
            }
            
            // CRITICAL FIX: Get sales rep/host data
            let salesRepId = '';
            let salesRepName = '';
            
            // Get from form
            const salesRepField = document.getElementById('appointment-sales-rep');
            if (salesRepField && salesRepField.selectedIndex >= 0) {
                salesRepId = salesRepField.value;
                salesRepName = salesRepField.selectedOptions[0]?.textContent || '';
                console.log('Got sales rep from form:', { salesRepId, salesRepName });
            } else {
                // Use existing data
                salesRepId = existingAppointment.extendedProps?.salesRepId || '';
                salesRepName = existingAppointment.extendedProps?.salesRepName || '';
                console.log('Using existing sales rep data:', { salesRepId, salesRepName });
            }
            
            // Check if sales rep data is valid
            if (salesRepId) {
                console.log('Validating sales rep data');
                try {
                    // Verify against available reps
                    const salesReps = JSON.parse(localStorage.getItem('salesReps') || '[]');
                    const foundRep = salesReps.find(rep => String(rep.id) === String(salesRepId));
                    
                    if (foundRep) {
                        // Use accurate name from database
                        salesRepName = foundRep.name;
                        console.log('Validated sales rep:', { salesRepId, salesRepName });
                    } else {
                        console.warn('Selected sales rep not found in database');
                    }
                } catch (error) {
                    console.error('Error validating sales rep:', error);
                }
            }
            
            // Update the appointment
            appointments[appointmentIndex] = {
                ...existingAppointment,
                title: title,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
                extendedProps: {
                    ...existingAppointment.extendedProps,
                    type: type,
                    customerId: customerId,
                    customerName: customerName,
                    customerPhone: customerPhone,
                    customerEmail: customerEmail,
                    salesRepId: salesRepId,
                    salesRepName: salesRepName,
                    notes: notes
                }
            };
            
            // Save the updated appointments
            localStorage.setItem('appointments', JSON.stringify(appointments));
            console.log('Appointment saved successfully');
            
            // Close the modal
            const modal = document.getElementById('create-appointment-modal');
            if (modal) {
                modal.style.display = 'none';
                
                // Remove modal-open class and backdrop
                document.body.classList.remove('modal-open');
                
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => {
                    if (backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                    }
                });
            }
            
            // Refresh the calendar
            setTimeout(function() {
                if (typeof refreshCalendarEvents === 'function') {
                    refreshCalendarEvents();
                } else if (typeof updateCalendarEvents === 'function') {
                    updateCalendarEvents();
                }
            }, 100);
            
            return true;
        } catch (error) {
            console.error('Error in enhanced save:', error);
            alert('Error saving appointment: ' + error.message);
            return false;
        }
    }
    
    /**
     * Helper function to get time value from hour/minute/period inputs
     */
    function getTimeValue() {
        const hourElement = document.getElementById('appointment-hour');
        const minuteElement = document.getElementById('appointment-minute');
        const periodElement = document.getElementById('appointment-period');
        
        if (!hourElement || !minuteElement || !periodElement) {
            return '';
        }
        
        const hour = hourElement.value;
        const minute = minuteElement.value;
        const period = periodElement.value;
        
        if (!hour || !minute || !period) {
            return '';
        }
        
        // Convert to 24-hour format
        let hours = parseInt(hour);
        if (period.toLowerCase() === 'pm' && hours < 12) {
            hours += 12;
        } else if (period.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }
        
        return hours.toString().padStart(2, '0') + ':' + minute.padStart(2, '0');
    }
    
    console.log('Save button enhancement loaded');
})();
