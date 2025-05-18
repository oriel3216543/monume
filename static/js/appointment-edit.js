/**
 * MonuMe Appointment Editing System
 * Manages the edit functionality for appointment information
 */

// Wait for DOM to be fully loaded with higher priority and use immediate execution
(function() {
    // Function to initialize our edit functionality
    function initializeEditSystem() {
        // Check if the DOM is already ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // DOM is already loaded, initialize with a delay to ensure other scripts have run
            setTimeout(function() {
                setupEditAppointmentEvents();
                console.log('Appointment edit system initialized (delayed for proper order)');
            }, 500);
        } else {
            // DOM not yet loaded, wait for it
            document.addEventListener('DOMContentLoaded', function() {
                // Add a longer delay to ensure other scripts have initialized
                setTimeout(function() {
                    setupEditAppointmentEvents();
                    console.log('Appointment edit system initialized (delayed for proper order)');
                }, 800);
            });
        }
    }
    
    // Start initialization
    initializeEditSystem();
    
    // Also set up a backup initialization in case the normal one fails
    window.addEventListener('load', function() {
        // Check if edit button has our handler by looking for a marker
        const editButton = document.getElementById('edit-appointment');
        if (editButton && !window._editHandlerInitialized) {
            console.log('Backup initialization of edit system on window load');
            setupEditAppointmentEvents();
        }
    });
    
    // Expose a global function to manually initialize if needed
    window.initializeAppointmentEdit = initializeEditSystem;
})();

/**
 * Initialize edit appointment modal events
 * Sets up all the necessary event handlers for edit functionality
 */
function setupEditAppointmentEvents() {
    // Prevent double initialization
    if (window._editHandlerInitialized) {
        console.log('Edit appointment handlers already initialized, skipping');
        return;
    }
    
    console.log('Setting up edit appointment event handlers');
    
    // Mark as initialized
    window._editHandlerInitialized = true;
      // Function to create a new event handler for the edit button
    function setupEditButtonHandler() {
        // Find the edit button - use a direct DOM query to find it regardless of refreshes
        const allEditButtons = document.querySelectorAll('.modal-footer-right button.btn-primary');
        let editButton = null;
        
        // Find the edit button by checking text content
        for (let btn of allEditButtons) {
            if (btn.textContent.includes('Edit') || btn.innerHTML.includes('fa-edit')) {
                editButton = btn;
                break;
            }
        }
        
        // If still not found, try by ID
        if (!editButton) {
            editButton = document.getElementById('edit-appointment');
        }
        
        if (!editButton) {
            console.error('Edit appointment button not found in the DOM');
            // Try again after a short delay with increased time
            setTimeout(setupEditButtonHandler, 1000);
            return;
        }
        
        console.log('Found edit button:', editButton.outerHTML);
        
        // Remove all existing event listeners with clone technique
        const newEditButton = editButton.cloneNode(true);
        editButton.parentNode.replaceChild(newEditButton, editButton);
        
        // Add event capture handler with highest priority
        document.body.addEventListener('click', function(e) {
            // Check if the event target is our edit button or its child (like an icon)
            if (e.target === newEditButton || newEditButton.contains(e.target)) {                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                console.log('Global edit button capture triggered');
                
                const modal = document.getElementById('appointment-modal');
                if (!modal) {
                    console.error('Appointment modal not found');
                    return;
                }
                
                const eventId = modal.getAttribute('data-event-id');
                if (!eventId) {
                    console.error('No event ID found in appointment modal');
                    return;
                }
                
                console.log('Edit button clicked for event ID:', eventId);
                
                // Store the ID we need to edit before closing the modal
                const idToEdit = eventId;
                
                // Hide details modal first
                modal.style.display = 'none';
                
                // Add a slight delay before opening edit modal to ensure proper sequence
                setTimeout(() => {
                    console.log('Opening edit modal after delay for ID:', idToEdit);
                    // Open edit modal with appointment data
                    enhancedEditAppointment(idToEdit);
                }, 150);
            }
        }, true); // true for useCapture - ensures this runs before other handlers
        
        // Also add a direct click handler to be sure
        newEditButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            console.log('Direct edit button click handler triggered');
            
            const modal = document.getElementById('appointment-modal');
            if (!modal) {
                console.error('Appointment modal not found');
                return;
            }
            
            const eventId = modal.getAttribute('data-event-id');
            if (!eventId) {
                console.error('No event ID found in appointment modal');
                return;
            }
          // Store the ID we need to edit
            const idToEdit = eventId;
            
            // Hide details modal first - use modalHelper if available
            if (window.modalHelper) {
                window.modalHelper.hideModal('appointment-modal');
            } else {
                modal.style.display = 'none';
            }
            
            // Add a slight delay before opening edit modal to ensure proper sequence
            setTimeout(() => {
                console.log('Opening edit modal after delay for ID:', idToEdit);
                // Open edit modal with appointment data
                enhancedEditAppointment(idToEdit);
            }, 200);
        });
        
        console.log('Successfully attached multiple event handlers to edit button');
    }
    
    // Setup the edit button handler - first call
    setupEditButtonHandler();
    
    // Add a fallback check to ensure the handler is attached
    setTimeout(setupEditButtonHandler, 1000);
    
    // Add event listener for the save button in create/edit modal
    const saveButton = document.getElementById('save-appointment');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const isEditing = this.hasAttribute('data-editing') && this.getAttribute('data-editing') === 'true';
            if (isEditing) {
                updateExistingAppointment();
            }
        });
    }
}

/**
 * Enhanced edit appointment function
 * Opens the appointment modal with pre-loaded data and marks it for editing
 */
function enhancedEditAppointment(eventId) {
    console.log('Enhancing edit appointment for ID:', eventId);
    
    // Normalize the event ID to handle string/number inconsistencies
    const normalizedId = String(eventId).trim();
    console.log('Normalized ID for lookup:', normalizedId);
    
    // Get the appointment data with robust error handling
    let appointments = [];
    try {
        appointments = getAppointments();
        console.log('Found appointments:', appointments.length);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        alert('Error loading appointments data. Please refresh the page and try again.');
        return;
    }
    
    // Find matching appointment with flexible ID matching
    const appointment = appointments.find(a => String(a.id).trim() === normalizedId);
    
    if (!appointment) {
        console.error('Appointment not found with ID:', normalizedId);
        
        // Log all appointment IDs for debugging
        console.log('Available appointment IDs:', appointments.map(a => a.id));
        
        alert('Appointment not found. It may have been deleted or the data is corrupted.');
        return;
    }
    
    console.log('Found appointment:', appointment.title);
    
    // Change modal title to indicate editing
    const modalTitle = document.querySelector('#create-appointment-modal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Appointment';
    } else {
        console.error('Modal title element not found');
    }
    
    // Ensure the modal is visible - use modalHelper if available
    const modal = document.getElementById('create-appointment-modal');
    if (!modal) {
        console.error('Edit modal element not found');
        return;
    }
    
    // Set data attributes to mark as editing
    modal.setAttribute('data-editing', 'true');
    modal.setAttribute('data-event-id', normalizedId);
    
    console.log('Loading appointment data into form for editing');
    
    // Get all form fields we need to populate
    try {
        // Populate form fields with appointment data
        document.getElementById('edit-appointment-id').value = appointment.id;
        document.getElementById('appointment-title').value = appointment.title || '';
        document.getElementById('appointment-customer').value = appointment.customer || '';
        document.getElementById('appointment-phone').value = appointment.phone || '';
        document.getElementById('appointment-date').value = appointment.date || '';
        document.getElementById('appointment-time').value = appointment.time || '';
        document.getElementById('appointment-status').value = appointment.status || 'scheduled';
        document.getElementById('appointment-notes').value = appointment.notes || '';
        
        // Additional fields if they exist
        const locationField = document.getElementById('appointment-location');
        if (locationField) {
            locationField.value = appointment.location || '';
        }
        
        const durationField = document.getElementById('appointment-duration');
        if (durationField) {
            durationField.value = appointment.duration || '60';
        }
        
        console.log('Appointment data loaded into form successfully');
    } catch (e) {
        console.error('Error populating form fields:', e);
        alert('There was an error loading appointment data into the form.');
    }

    // Make sure the modal is visible
    if (window.modalHelper) {
        console.log('Using modal helper to ensure edit modal is visible');
        window.modalHelper.showModal('create-appointment-modal');
    } else {
        try {
            console.log('Showing edit modal with direct techniques');
            
            // Apply multiple display techniques
            modal.style.display = 'block';
            modal.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; z-index: 10000 !important;';
            modal.classList.remove('hide', 'hidden', 'd-none', 'collapse');
            
            // Check visibility after a small delay
            setTimeout(() => {
                const isVisible = window.getComputedStyle(modal).display !== 'none';
                console.log('Modal visible after display techniques:', isVisible);
                
                if (!isVisible) {
                    console.warn('Modal still not visible, trying fallback methods');
                    
                    // Try jQuery as fallback
                    if (typeof $ !== 'undefined') {
                        try {
                            $(modal).modal('show');
                            console.log('Showed modal via jQuery modal method');
                        } catch (e) {
                            console.error('jQuery modal show error:', e);
                        }
                    }
                }
            }, 50);
        } catch (e) {
            console.error('Error displaying modal:', e);
            // Fallback to simple display change
            modal.style.display = 'block';
        }
    }
    
    // Fill form with appointment data
    document.getElementById('appointment-title').value = appointment.title;
    
    // Handle appointment type if it exists in the form
    const typeInput = document.getElementById('appointment-type');
    if (typeInput && appointment.extendedProps.type) {
        typeInput.value = appointment.extendedProps.type;
    }
    
    // Set date and time
    const startDate = new Date(appointment.start);
    document.getElementById('appointment-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('appointment-time').value = startDate.toTimeString().substring(0, 5);
    
    // Set duration
    const endDate = new Date(appointment.end);
    const durationMinutes = (endDate - startDate) / (1000 * 60);
    document.getElementById('appointment-duration').value = durationMinutes;
    
    // Add customer info to form
    const customer = {
        id: appointment.extendedProps.customerId,
        firstName: appointment.extendedProps.customerName.split(' ')[0],
        lastName: appointment.extendedProps.customerName.split(' ')[1] || '',
        phone: appointment.extendedProps.customerPhone
    };
    
    // Create customer selection element
    const customerNameElement = document.createElement('div');
    customerNameElement.classList.add('customer-selection-result');
    customerNameElement.innerHTML = `
        <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
            <strong>${customer.firstName} ${customer.lastName}</strong><br>
            <small>${customer.phone}</small>
            <input type="hidden" id="selected-customer-id" value="${customer.id}">
        </div>
    `;
    
    // Remove any existing customer selection
    const existingSelection = document.querySelector('.customer-selection-result');
    if (existingSelection) {
        existingSelection.remove();
    }
    
    // Insert customer info
    const addCustomerBtn = document.getElementById('add-customer-for-appointment');
    addCustomerBtn.insertAdjacentElement('afterend', customerNameElement);
    
    // Set sales rep selection
    document.getElementById('appointment-sales-rep').value = appointment.extendedProps.salesRepId;
    
    // Set notes
    document.getElementById('appointment-notes').value = appointment.extendedProps.notes || '';
    
    // Store the appointment ID for updating
    const saveButton = document.getElementById('save-appointment');
    saveButton.setAttribute('data-appointment-id', eventId);
    saveButton.setAttribute('data-editing', 'true');
}

/**
 * Update an existing appointment with the form data
 */
function updateExistingAppointment() {
    const form = document.getElementById('appointment-form');
    
    // Check form validity
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const saveButton = document.getElementById('save-appointment');
    const appointmentId = saveButton.getAttribute('data-appointment-id');
    
    if (!appointmentId) {
        console.error('No appointment ID found for editing');
        return;
    }
    
    const title = document.getElementById('appointment-title').value;
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const duration = parseInt(document.getElementById('appointment-duration').value);
    const salesRepId = document.getElementById('appointment-sales-rep').value;
    const notes = document.getElementById('appointment-notes').value;
    
    // Get type if available in the form
    let type = 'appointment'; // Default value
    const typeInput = document.getElementById('appointment-type');
    if (typeInput) {
        type = typeInput.value;
    }
    
    // Get customer id from the hidden input
    const customerIdElement = document.getElementById('selected-customer-id');
    
    if (!customerIdElement || !customerIdElement.value) {
        alert('Please add a customer for this appointment.');
        return;
    }
    
    const customerId = customerIdElement.value;
    
    // Find customer info
    const customers = getCustomers();
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        alert('Please select a valid customer.');
        return;
    }
    
    // Find sales rep info
    const salesReps = getSalesReps();
    const salesRep = salesReps.find(r => r.id === salesRepId);
    
    if (!salesRep) {
        alert('Please select a valid sales representative.');
        return;
    }
    
    // Create updated appointment object
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    
    const appointment = {
        id: appointmentId,
        title: title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        extendedProps: {
            type: type,
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            salesRepId: salesRep.id,
            salesRepName: salesRep.name,
            notes: notes
        }
    };
    
    // Save the appointment
    updateAppointmentInDB(appointment);
    
    // Reset form
    form.reset();
    
    // Clear editing state
    saveButton.removeAttribute('data-appointment-id');
    saveButton.removeAttribute('data-editing');
    
    // Reset modal title
    const modalTitle = document.querySelector('#create-appointment-modal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Schedule New Appointment';
    }
    
    // Remove the customer selection result
    const customerSelectionResult = document.querySelector('.customer-selection-result');
    if (customerSelectionResult) {
        customerSelectionResult.remove();
    }
    
    // Hide modal
    document.getElementById('create-appointment-modal').style.display = 'none';
    
    // Show success message
    alert('Appointment updated successfully!');
}

/**
 * Update appointment in localStorage and refresh calendar
 * Enhanced with better error handling and logging
 */
function updateAppointmentInDB(updatedAppointment) {
    if (!updatedAppointment || !updatedAppointment.id) {
        console.error('Invalid appointment object passed to update function');
        alert('Error updating appointment: Invalid data');
        return;
    }
    
    console.log('Updating appointment in database:', updatedAppointment.id);
    
    try {
        let appointments = getAppointments();
        
        // Normalize IDs for comparison to handle string/number inconsistencies
        const targetId = String(updatedAppointment.id).trim();
        
        // Find the appointment index with normalized comparison
        const existingIndex = appointments.findIndex(a => String(a.id).trim() === targetId);
        
        console.log('Found appointment at index:', existingIndex);
        
        if (existingIndex >= 0) {
            // Keep a backup of the original appointment in case we need to revert
            const originalAppointment = appointments[existingIndex];
            
            // Update the existing appointment
            appointments[existingIndex] = updatedAppointment;
            
            // Save to localStorage with error handling
            try {
                localStorage.setItem('appointments', JSON.stringify(appointments));
                console.log('Successfully saved appointment to localStorage');
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                // Attempt to recover by removing some data or stringifying differently
                try {
                    // Create a simpler version of the appointments array
                    const simplifiedAppointments = appointments.map(a => ({
                        id: a.id,
                        title: a.title,
                        start: a.start,
                        end: a.end,
                        extendedProps: a.extendedProps
                    }));
                    localStorage.setItem('appointments', JSON.stringify(simplifiedAppointments));
                    console.log('Saved simplified appointment data as fallback');
                } catch (innerError) {
                    console.error('Critical: Even simplified save failed:', innerError);
                    alert('Unable to save appointment data. Storage may be full.');
                    return;
                }
            }
            
            // Refresh calendar with error handling
            try {
                const calendar = document.getElementById('calendar');
                if (calendar && calendar._calendar) {
                    // Refresh calendar
                    calendar._calendar.removeAllEvents();
                    calendar._calendar.addEventSource(appointments);
                    console.log('Calendar refreshed successfully');
                } else {
                    console.log('Calendar instance not found or not initialized');
                    // This isn't critical since the updated data is in localStorage
                }
            } catch (error) {
                console.error('Error refreshing calendar:', error);
                // Not a critical error - data is still saved
            }
            
            // Update stats if function exists
            try {
                if (typeof updateStatsCounters === 'function') {
                    updateStatsCounters();
                    console.log('Stats counters updated');
                }
            } catch (error) {
                console.error('Error updating stats counters:', error);
                // Not critical
            }
            
            return true;
        } else {
            console.error('Could not find appointment to update, ID:', targetId);
            console.log('Available appointment IDs:', appointments.map(a => a.id));
            alert('Error updating appointment. The appointment may have been deleted.');
            return false;
        }
    } catch (error) {
        console.error('Unexpected error in updateAppointmentInDB:', error);
        alert('An unexpected error occurred while saving the appointment.');
        return false;
    }
}

/**
 * Utility function to get appointments from localStorage
 * In case getAppointments is not available from the main script
 */
function getAppointments() {
    // Try to use the global function if available
    if (typeof window.getAppointments === 'function') {
        return window.getAppointments();
    }
    
    // Fallback to local implementation
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
        return JSON.parse(storedAppointments);
    }
    return [];
}

/**
 * Utility function to get customers from localStorage
 * In case getCustomers is not available from the main script
 */
function getCustomers() {
    // Try to use the global function if available
    if (typeof window.getCustomers === 'function') {
        return window.getCustomers();
    }
    
    // Fallback to local implementation
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) {
        return JSON.parse(storedCustomers);
    }
    return [];
}

/**
 * Utility function to get sales representatives from localStorage
 * In case getSalesReps is not available from the main script
 */
function getSalesReps() {
    // Try to use the global function if available
    if (typeof window.getSalesReps === 'function') {
        return window.getSalesReps();
    }
    
    // Fallback to local implementation
    const storedReps = localStorage.getItem('salesReps');
    if (storedReps) {
        return JSON.parse(storedReps);
    }
    return [];
}