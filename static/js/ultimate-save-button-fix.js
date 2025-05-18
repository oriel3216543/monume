/**
 * Ultimate Save Button Fix
 * This script ensures the save button works reliably for appointment editing
 */

// Execute immediately when loaded
(function() {
    console.log('Ultimate save button fix loading...');
    
    // Make sure we run this code as soon as possible
    fixSaveButton();
    
    // Also run on DOM ready
    document.addEventListener('DOMContentLoaded', fixSaveButton);
    
    // And after window load to be extra safe
    window.addEventListener('load', function() {
        setTimeout(fixSaveButton, 500);
        // Run again after a delay to catch any dynamic changes
        setTimeout(fixSaveButton, 1500);
    });
    
    /**
     * Main function to fix the save button
     */
    function fixSaveButton() {
        console.log('Running save button fix...');
        
        // Create a global save function that will be accessible anywhere
        window.saveAppointmentWithFullErrorHandling = function(event) {
            console.log('🔄 SAVE BUTTON CLICKED - Running ultimate save function');
            
            // Prevent default form submission
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            try {
                // Check if we're in edit mode
                const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                              document.getElementById('edit-appointment-id')?.value;
                
                console.log('Save button clicked, editing mode:', isEditing);
                
                // In edit mode, use our enhanced save function
                if (isEditing) {
                    console.log('Edit mode detected - using enhanced save function');
                    saveEditedAppointment();
                    return false;
                }
                // For new appointments, let the existing handler work
                else {
                    console.log('New appointment - using existing save handler');
                    return true;
                }
            } catch (error) {
                console.error('Error in save function:', error);
                alert('Error while trying to save appointment. Please try again.');
                return false;
            }
        };
        
        // Direct replacement of the save button click handler
        replaceSaveButtonHandler();
        
        // Global click listener for the save button
        addGlobalSaveButtonListener();
        
        // Create a mutation observer to watch for new save buttons
        watchForSaveButton();
        
        // Export our save function globally for direct calls
        window.ultimateSaveAppointment = saveEditedAppointment;
        
        console.log('Save button fix installed');
    }
    
    /**
     * Replace the existing save button click handler
     */
    function replaceSaveButtonHandler() {
        try {
            const saveButton = document.getElementById('save-appointment');
            
            if (saveButton) {
                console.log('Found save button - replacing handler');
                
                // Clone the button to remove all existing listeners
                const newSaveButton = saveButton.cloneNode(true);
                if (saveButton.parentNode) {
                    saveButton.parentNode.replaceChild(newSaveButton, saveButton);
                }
                
                // Add our ultimate save handler
                newSaveButton.addEventListener('click', window.saveAppointmentWithFullErrorHandling);
                
                // Add a direct attribute for extra safety
                newSaveButton.setAttribute('onclick', 'return window.saveAppointmentWithFullErrorHandling(event)');
                
                console.log('Save button handler replaced successfully');
            } else {
                console.warn('Save button not found in DOM yet');
            }
        } catch (error) {
            console.error('Error replacing save button handler:', error);
        }
    }
    
    /**
     * Add a global click listener to catch all save button clicks
     */
    function addGlobalSaveButtonListener() {
        document.addEventListener('click', function(event) {
            // Find if this is a click on the save button or its children
            let target = event.target;
            let isSaveButton = false;
            
            // Check all parent elements up to document
            while (target && target !== document) {
                if (target.id === 'save-appointment' || 
                    (target.getAttribute && target.getAttribute('data-action') === 'save') ||
                    (target.classList && target.classList.contains('save-appointment-btn'))) {
                    isSaveButton = true;
                    break;
                }
                target = target.parentNode;
            }
            
            if (!isSaveButton) return;
            
            console.log('Save button click detected via global listener');
            return window.saveAppointmentWithFullErrorHandling(event);
        }, true); // Use capturing for highest priority
    }
    
    /**
     * Watch for new save buttons being added to the DOM
     */
    function watchForSaveButton() {
        try {
            // Create an observer to watch for DOM changes
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes && mutation.addedNodes.length) {
                        for (let i = 0; i < mutation.addedNodes.length; i++) {
                            const node = mutation.addedNodes[i];
                            if (node.nodeType === 1) { // Only Element nodes
                                // Check if this is the save button
                                if (node.id === 'save-appointment') {
                                    console.log('Save button dynamically added - attaching handler');
                                    node.addEventListener('click', window.saveAppointmentWithFullErrorHandling);
                                }
                                
                                // Or check if it contains the save button
                                const saveButtons = node.querySelectorAll('#save-appointment');
                                if (saveButtons.length) {
                                    console.log('Found save button in added content - attaching handler');
                                    saveButtons.forEach(button => {
                                        button.addEventListener('click', window.saveAppointmentWithFullErrorHandling);
                                    });
                                }
                            }
                        }
                    }
                });
            });
            
            // Start observing the entire document
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            console.log('Save button observer started');
        } catch (error) {
            console.error('Error setting up save button observer:', error);
        }
    }
    
    /**
     * The actual save function that handles edited appointments
     */
    function saveEditedAppointment() {
        try {
            console.log('⭐ Running enhanced appointment save function');
            
            // Get appointment ID
            const appointmentId = document.getElementById('edit-appointment-id')?.value;
            
            if (!appointmentId) {
                console.error('No appointment ID found for editing');
                alert('Error: Could not find appointment ID. Please try again.');
                return false;
            }
            
            console.log('Saving appointment with ID:', appointmentId);
            
            // Get current appointment data
            let appointments;
            try {
                appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            } catch (error) {
                console.error('Error parsing appointments from localStorage:', error);
                alert('Error loading appointments data. Please refresh the page.');
                return false;
            }
            
            const appointmentIndex = appointments.findIndex(a => String(a.id) === String(appointmentId));
            
            if (appointmentIndex === -1) {
                console.error('Could not find appointment with ID:', appointmentId);
                alert('Error: The appointment you are editing cannot be found. It may have been deleted.');
                return false;
            }
            
            const existingAppointment = appointments[appointmentIndex];
            console.log('Found existing appointment:', existingAppointment);
            
            // COLLECT ALL FORM DATA
            
            // Title (required)
            const titleField = document.getElementById('appointment-title');
            const title = titleField?.value || existingAppointment.title || 'Untitled Appointment';
            
            // Date and time
            const startDate = document.getElementById('appointment-date')?.value;
            let startDateTime = new Date(existingAppointment.start);
            let endDateTime = new Date(existingAppointment.end);
            
            // Get time components
            const hourField = document.getElementById('appointment-hour');
            const minuteField = document.getElementById('appointment-minute');
            const periodField = document.getElementById('appointment-period');
            
            // Only update date/time if valid input is provided
            if (startDate) {
                try {
                    // Parse date components
                    const [year, month, day] = startDate.split('-').map(Number);
                    
                    // If we have time components too
                    if (hourField?.value && minuteField?.value && periodField?.value) {
                        let hours = parseInt(hourField.value, 10);
                        const minutes = parseInt(minuteField.value, 10);
                        const isPM = periodField.value.toLowerCase() === 'pm';
                        
                        // Convert to 24-hour format
                        if (isPM && hours < 12) hours += 12;
                        if (!isPM && hours === 12) hours = 0;
                        
                        // Create new date objects
                        startDateTime = new Date(year, month - 1, day, hours, minutes);
                        endDateTime = new Date(startDateTime);
                        endDateTime.setHours(startDateTime.getHours() + 1); // 1 hour duration
                    }
                    // If only date is provided, keep the original time
                    else {
                        const originalDate = new Date(existingAppointment.start);
                        startDateTime = new Date(year, month - 1, day, 
                            originalDate.getHours(), originalDate.getMinutes());
                        
                        endDateTime = new Date(startDateTime);
                        endDateTime.setHours(startDateTime.getHours() + 1);
                    }
                } catch (error) {
                    console.error('Error parsing date/time:', error);
                    // Fallback to existing date/time
                    startDateTime = new Date(existingAppointment.start);
                    endDateTime = new Date(existingAppointment.end);
                }
            }
            
            // Appointment type
            const typeField = document.getElementById('appointment-type');
            const type = typeField?.value || existingAppointment.extendedProps?.type || 'appointment';
            
            // Notes
            const notesField = document.getElementById('appointment-notes');
            const notes = notesField?.value || existingAppointment.extendedProps?.notes || '';
            
            // Customer data
            let customerId = '';
            let customerName = '';
            let customerPhone = '';
            let customerEmail = '';
            
            // Try to get customer from form
            const customerIdField = document.getElementById('selected-customer-id');
            
            if (customerIdField && customerIdField.value) {
                customerId = customerIdField.value;
                
                // Try to find customer details
                try {
                    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
                    const customer = customers.find(c => String(c.id) === String(customerId));
                    
                    if (customer) {
                        customerName = customer.firstName + ' ' + customer.lastName;
                        customerPhone = customer.phone || '';
                        customerEmail = customer.email || '';
                    } else {
                        // If customer not found but ID is provided, use existing data
                        customerId = existingAppointment.extendedProps?.customerId || '';
                        customerName = existingAppointment.extendedProps?.customerName || '';
                        customerPhone = existingAppointment.extendedProps?.customerPhone || '';
                        customerEmail = existingAppointment.extendedProps?.customerEmail || '';
                    }
                } catch (error) {
                    console.error('Error getting customer details:', error);
                    // Use existing data as fallback
                    customerId = existingAppointment.extendedProps?.customerId || '';
                    customerName = existingAppointment.extendedProps?.customerName || '';
                    customerPhone = existingAppointment.extendedProps?.customerPhone || '';
                    customerEmail = existingAppointment.extendedProps?.customerEmail || '';
                }
            } else {
                // No customer selected, use existing data
                customerId = existingAppointment.extendedProps?.customerId || '';
                customerName = existingAppointment.extendedProps?.customerName || '';
                customerPhone = existingAppointment.extendedProps?.customerPhone || '';
                customerEmail = existingAppointment.extendedProps?.customerEmail || '';
            }
            
            // CRITICAL: Sales rep/host data
            let salesRepId = '';
            let salesRepName = '';
            
            // Get from form if available
            const salesRepField = document.getElementById('appointment-sales-rep');
            
            if (salesRepField && salesRepField.selectedIndex >= 0) {
                salesRepId = salesRepField.value;
                salesRepName = salesRepField.options[salesRepField.selectedIndex].textContent || '';
                console.log('Got sales rep from form:', { salesRepId, salesRepName });
            } else {
                // Use existing data as fallback
                salesRepId = existingAppointment.extendedProps?.salesRepId || '';
                salesRepName = existingAppointment.extendedProps?.salesRepName || '';
                console.log('Using existing sales rep data:', { salesRepId, salesRepName });
            }
            
            // Verify sales rep data against database
            if (salesRepId) {
                try {
                    const salesReps = JSON.parse(localStorage.getItem('salesReps') || '[]');
                    const foundRep = salesReps.find(rep => String(rep.id) === String(salesRepId));
                    
                    if (foundRep) {
                        // Use accurate name from database
                        salesRepName = foundRep.name || salesRepName;
                    }
                } catch (error) {
                    console.error('Error validating sales rep:', error);
                }
            }
            
            // Log the data we're about to save
            console.log('Saving appointment with data:', {
                title,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
                type,
                customerId,
                customerName,
                customerPhone,
                customerEmail,
                salesRepId,
                salesRepName,
                notes
            });
            
            // Update the appointment with collected data
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
            console.log('✅ Appointment saved successfully!');
            
            // Close the modal
            const modal = document.getElementById('create-appointment-modal');
            if (modal) {
                console.log('Closing modal...');
                
                // Method 1: Direct style change
                modal.style.display = 'none';
                
                // Method 2: Bootstrap modal hide
                if (typeof jQuery !== 'undefined' && jQuery(modal).modal) {
                    jQuery(modal).modal('hide');
                }
                
                // Method 3: Use existing close function
                const closeButton = document.querySelector('#create-appointment-modal .close');
                if (closeButton) {
                    closeButton.click();
                }
            }
            
            // Remove modal backdrop and clean up
            setTimeout(function() {
                // Remove modal-open class
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                
                // Remove all backdrops
                document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                    if (backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                    }
                });
                
                // Also use our dedicated backdrop remover if available
                if (typeof window.checkAndRemoveBackdrops === 'function') {
                    window.checkAndRemoveBackdrops();
                }
            }, 50);
            
            // Refresh the calendar
            setTimeout(function() {
                console.log('Refreshing calendar...');
                try {
                    // Try all possible refresh methods
                    if (typeof refreshCalendarEvents === 'function') {
                        refreshCalendarEvents();
                    } 
                    else if (typeof updateCalendarEvents === 'function') {
                        updateCalendarEvents();
                    }
                    else if (window.calendar && typeof window.calendar.refetchEvents === 'function') {
                        window.calendar.refetchEvents();
                    }
                } catch (error) {
                    console.error('Error refreshing calendar:', error);
                }
            }, 100);
            
            return true;
        } catch (error) {
            console.error('Error in saveEditedAppointment:', error);
            alert('Error saving appointment: ' + error.message);
            return false;
        }
    }
    
    console.log('Ultimate save button fix loaded and ready');
})();
