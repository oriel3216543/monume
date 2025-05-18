/**
 * Enhanced Appointment Edit Feature
 * This file fixes issues with the appointment edit modal functionality
 */

/**
 * Function to safely close the appointment modal
 * This prevents the black screen issue when closing the modal
 */
function safeCloseAppointmentModal() {
    console.log('Safely closing appointment modal');
    
    // Get the modal
    const modal = document.getElementById('create-appointment-modal');
    if (!modal) return;
    
    // Remove any modal backdrops that might be causing the black screen
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        console.log('Removing modal backdrop');
        backdrop.remove();
    });
    
    // Hide the modal
    if (typeof modalHelper !== 'undefined' && modalHelper.hideModal) {
        modalHelper.hideModal('create-appointment-modal');
    } else {
        modal.style.display = 'none';
    }
    
    // Make body scrollable again
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    // Reset the edit mode flag and appointment ID
    modal.setAttribute('data-editing', 'false');
    const idField = document.getElementById('edit-appointment-id');
    if (idField) idField.value = '';
    
    // Reset the save button
    const saveButton = document.getElementById('save-appointment');
    if (saveButton) {
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Appointment';
        saveButton.removeAttribute('data-appointment-id');
        saveButton.removeAttribute('data-editing');
    }
    
    // Reset the modal title
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Schedule New Appointment';
    }
    
    console.log('Modal safely closed');
}

// Add event listener to close button when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get all close buttons for the appointment modal
    const closeButtons = document.querySelectorAll('[data-dismiss="modal"], .close-modal-button, .close');
    
    closeButtons.forEach(button => {
        // Skip if already enhanced
        if (button.hasAttribute('data-enhanced-close')) return;
        
        // Mark as enhanced
        button.setAttribute('data-enhanced-close', 'true');
        
        // Add our safe close function
        button.addEventListener('click', function(event) {
            event.preventDefault();
            safeCloseAppointmentModal();
        });
    });
    
    console.log('Enhanced modal close buttons attached');
});

/**
 * Enhanced edit appointment function
 * Opens the appointment modal with pre-loaded data and marks it for editing
 */
function enhancedEditAppointment(eventId) {
    console.log('Enhancing edit appointment for ID:', eventId);
    
    if (!eventId) {
        console.error('No event ID provided to enhancedEditAppointment');
        return;
    }
    
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
    
    if (!appointments || appointments.length === 0) {
        console.error('No appointments found in data');
        alert('No appointment data available. Please refresh the page and try again.');
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
    
    // Get the edit modal
    const modal = document.getElementById('create-appointment-modal');
    if (!modal) {
        console.error('Edit modal element not found');
        alert('Cannot find the edit form. Please refresh the page and try again.');
        return;
    }
    
    // Change modal title to indicate editing
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Appointment';
    }
    
    // Set data attributes to mark as editing
    modal.setAttribute('data-editing', 'true');
    modal.setAttribute('data-event-id', normalizedId);
    
    console.log('Loading appointment data into form for editing');
    
    try {
        // Store the appointment ID
        const editIdField = document.getElementById('edit-appointment-id');
        if (editIdField) {
            editIdField.value = normalizedId;
        } else {
            console.warn('No edit-appointment-id field found, creating one');
            // Create one if it doesn't exist
            const hiddenId = document.createElement('input');
            hiddenId.type = 'hidden';
            hiddenId.id = 'edit-appointment-id';
            hiddenId.value = normalizedId;
            modal.querySelector('form').appendChild(hiddenId);
        }
        
        // Title field
        const titleField = document.getElementById('appointment-title');
        if (titleField) {
            titleField.value = appointment.title || '';
        }
        
        // Type field
        const typeField = document.getElementById('appointment-type');
        if (typeField && appointment.extendedProps && appointment.extendedProps.type) {
            typeField.value = appointment.extendedProps.type;
        } else if (typeField) {
            // Default or try to find type in other places
            const possibleType = appointment.type || 
                                (appointment.extendedProps ? appointment.extendedProps.type : null);
            if (possibleType) {
                typeField.value = possibleType;
            }
        }
          // Date and time fields
        let startDate = null;
        try {
            startDate = appointment.start instanceof Date ? 
                appointment.start : new Date(appointment.start);
                
            const dateField = document.getElementById('appointment-date');
            if (dateField) {
                // Format date as YYYY-MM-DD for input field
                const formattedDate = startDate.toISOString().split('T')[0];
                dateField.value = formattedDate;
            }
            
            // Handle different time input formats (single field or hour/minute/ampm)
            const timeField = document.getElementById('appointment-time');
            if (timeField) {
                // Format time as HH:MM for input field
                const hours = startDate.getHours().toString().padStart(2, '0');
                const minutes = startDate.getMinutes().toString().padStart(2, '0');
                timeField.value = `${hours}:${minutes}`;
            } else {
                // Handle hour, minute, ampm separate fields
                const hourField = document.getElementById('appointment-hour');
                const minuteField = document.getElementById('appointment-minute');
                const ampmField = document.getElementById('appointment-ampm');
                
                if (hourField && minuteField && ampmField) {
                    let hours = startDate.getHours();
                    const minutes = startDate.getMinutes();
                    let ampm = 'AM';
                    
                    // Convert to 12-hour format
                    if (hours >= 12) {
                        ampm = 'PM';
                        if (hours > 12) {
                            hours -= 12;
                        }
                    }
                    
                    // Handle midnight (0:00)
                    if (hours === 0) {
                        hours = 12;
                    }
                    
                    // Set values in form
                    hourField.value = hours.toString().padStart(2, '0');
                    
                    // Find closest minute option (0, 15, 30, 45)
                    const minuteOptions = [0, 15, 30, 45];
                    const closestMinute = minuteOptions.reduce((prev, curr) => {
                        return (Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev);
                    });
                    
                    minuteField.value = closestMinute.toString().padStart(2, '0');
                    ampmField.value = ampm;
                    
                    console.log('Set time fields to', hourField.value, minuteField.value, ampmField.value);
                }
            }
        } catch (e) {
            console.error('Error parsing date:', e);
            // Try alternate format or use provided fields
            if (document.getElementById('appointment-date')) {
                document.getElementById('appointment-date').value = appointment.date || '';
            }
            if (document.getElementById('appointment-time')) {
                document.getElementById('appointment-time').value = appointment.time || '';
            }
        }
        
        // Duration field
        const durationField = document.getElementById('appointment-duration');
        if (durationField) {
            let duration = '30'; // Default duration
            
            if (appointment.end && startDate) {
                // Calculate duration from start and end times
                const endDate = appointment.end instanceof Date ? 
                    appointment.end : new Date(appointment.end);
                duration = Math.round((endDate - startDate) / (1000 * 60)).toString();
            } else if (appointment.duration) {
                duration = appointment.duration;
            }
            
            durationField.value = duration;
        }
        
        // Notes field
        const notesField = document.getElementById('appointment-notes');
        if (notesField) {
            notesField.value = appointment.extendedProps && appointment.extendedProps.notes ? 
                appointment.extendedProps.notes : (appointment.notes || '');
        }        // Sales rep field - enhanced to ensure host is properly selected
        const salesRepField = document.getElementById('appointment-sales-rep');
        if (salesRepField && appointment) {
            // Get salesRepId from various possible locations with fallbacks
            let salesRepId = null;
            let salesRepName = null;
            
            // Direct extendedProps is preferred
            if (appointment.extendedProps) {
                salesRepId = appointment.extendedProps.salesRepId || null;
                salesRepName = appointment.extendedProps.salesRepName || null;
            }
            
            // Fallback to direct properties
            if (!salesRepId && appointment.salesRepId) {
                salesRepId = appointment.salesRepId;
            }
            
            if (!salesRepName && appointment.salesRepName) {
                salesRepName = appointment.salesRepName;
            }
            
            // Further fallback for older data format
            if (!salesRepId && appointment.salesRep) {
                salesRepId = appointment.salesRep;
            }
            
            console.log(`Attempting to set host field: ID=${salesRepId}, Name=${salesRepName}`);
            
            // Try all approaches to set the correct value
            if (salesRepId) {
                // Method 1: Direct value setting by ID
                salesRepField.value = salesRepId;
                
                // Verify the selection worked (check if selectedIndex is valid)
                if (salesRepField.selectedIndex < 0) {
                    console.log('Direct ID setting failed, trying alternative approaches');
                    
                    // Method 2: Look through options to find matching text
                    if (salesRepName) {
                        Array.from(salesRepField.options).forEach((option, index) => {
                            if (option.textContent === salesRepName) {
                                console.log('Found matching host by name');
                                salesRepField.selectedIndex = index;
                            }
                        });
                    
                    // If still not found, create a new option
                    if (salesRepField.selectedIndex < 0 && appointment.extendedProps.salesRepName) {
                        console.log('Creating new option for sales rep');
                        const newOption = document.createElement('option');
                        newOption.value = appointment.extendedProps.salesRepId;
                        newOption.textContent = appointment.extendedProps.salesRepName;
                        salesRepField.appendChild(newOption);
                        salesRepField.value = appointment.extendedProps.salesRepId;
                    }
                }
            }
        }
        
        // Customer information
        if (appointment.extendedProps) {
            // Create customer selection element with the customer info
            const customer = {
                id: appointment.extendedProps.customerId || '',
                firstName: '',
                lastName: '',
                phone: ''
            };
            
            // Parse customer name if available
            if (appointment.extendedProps.customerName) {
                const nameParts = appointment.extendedProps.customerName.split(' ');
                customer.firstName = nameParts[0] || '';
                customer.lastName = nameParts.slice(1).join(' ') || '';
            }
            
            // Set phone if available
            customer.phone = appointment.extendedProps.customerPhone || '';
            
            // Create and set the customer selection element
            const customerNameElement = document.createElement('div');
            customerNameElement.classList.add('customer-selection-result');
            customerNameElement.style.display = 'block';
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
            if (addCustomerBtn) {
                addCustomerBtn.insertAdjacentElement('afterend', customerNameElement);
            } else {
                console.warn('Add customer button not found');
                const customerContainer = document.querySelector('.customer-selection-container');
                if (customerContainer) {
                    customerContainer.appendChild(customerNameElement);
                }
            }
        }
        
        console.log('Appointment data loaded into form successfully');
        
        // Mark save button for editing mode
        const saveButton = document.getElementById('save-appointment');
        if (saveButton) {
            saveButton.setAttribute('data-appointment-id', normalizedId);
            saveButton.setAttribute('data-editing', 'true');
            saveButton.innerHTML = '<i class="fas fa-save"></i> Update Appointment';
        }
    } catch (error) {
        console.error('Error populating form fields:', error);
        alert('There was an error loading appointment data. Some fields may be incomplete.');
    }
    
    // Display the modal with our preferred technique
    if (window.modalHelper) {
        console.log('Using modal helper to display edit modal');
        window.modalHelper.showModal('create-appointment-modal');
    } else {
        // Fallback techniques for showing modal
        try {
            console.log('Using direct techniques to show modal');
            modal.style.display = 'block';
            modal.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; z-index: 10000 !important;';
            modal.classList.remove('hide', 'hidden', 'd-none', 'collapse');
            
            // Add a modal backdrop if needed
            if (!document.querySelector('.modal-backdrop')) {
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop';
                backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;';
                document.body.appendChild(backdrop);
            }
        } catch (error) {
            console.error('Error displaying modal:', error);
            // Last resort fallback
            alert('Could not open the edit form properly. Please try again or refresh the page.');
        }
    }
}

// Replace the original enhancedEditAppointment function with our fixed version
if (typeof window.originalEnhancedEditAppointment === 'undefined') {
    // Store the original function if it exists
    if (typeof window.enhancedEditAppointment === 'function') {
        window.originalEnhancedEditAppointment = window.enhancedEditAppointment;
    }
    // Replace with our version
    window.enhancedEditAppointment = enhancedEditAppointment;
}

/**
 * Update an existing appointment with the form data
 * This is an enhanced version of the updateExistingAppointment function
 */
function updateExistingAppointment() {
    console.log('Updating existing appointment');
    
    const form = document.getElementById('appointment-form');
    
    // Check form validity
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get the appointment ID from the save button or hidden field
    let appointmentId = null;
    const saveButton = document.getElementById('save-appointment');
    
    if (saveButton && saveButton.getAttribute('data-appointment-id')) {
        appointmentId = saveButton.getAttribute('data-appointment-id');
    } else {
        // Try to get from hidden field
        const hiddenField = document.getElementById('edit-appointment-id');
        if (hiddenField && hiddenField.value) {
            appointmentId = hiddenField.value;
        }
    }
    
    if (!appointmentId) {
        console.error('No appointment ID found for editing');
        alert('Could not find the appointment ID. Please try again.');
        return;
    }
    
    console.log('Updating appointment:', appointmentId);
    
    // Get all form values
    const title = document.getElementById('appointment-title').value;
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const duration = parseInt(document.getElementById('appointment-duration').value) || 30;
    
    let type = 'appointment'; // Default value
    const typeInput = document.getElementById('appointment-type');
    if (typeInput) {
        type = typeInput.value;
    }
    
    let salesRepId = '';
    const salesRepInput = document.getElementById('appointment-sales-rep');
    if (salesRepInput) {
        salesRepId = salesRepInput.value;
    }
    
    let notes = '';
    const notesInput = document.getElementById('appointment-notes');
    if (notesInput) {
        notes = notesInput.value;
    }
      // Get customer ID - either from form or existing appointment
    let customerId = '';
    let customer = null;
    const customerIdElement = document.getElementById('selected-customer-id');
    
    // Check if we have a selected customer in the form
    if (customerIdElement && customerIdElement.value) {
        customerId = customerIdElement.value;
    } else {
        // Use the existing customer from the appointment
        customerId = appointment.extendedProps?.customerId || '';
    }
    
    // Get customer and sales rep info
    let salesRep = null;
    
    try {
        // Find customer info if we have a customer ID
        if (customerId) {
            const customers = getCustomers();
            customer = customers.find(c => String(c.id) === String(customerId));
            
            if (!customer) {
                console.log('Customer not found in database, using appointment data');
                // Use customer info from the appointment
                customer = {
                    id: customerId,
                    firstName: '',
                    lastName: '',
                    phone: '',
                    email: ''
                };
                
                // Try to extract name from appointment
                if (appointment.extendedProps?.customerName) {
                    const nameParts = appointment.extendedProps.customerName.split(' ');
                    customer.firstName = nameParts[0] || '';
                    customer.lastName = nameParts.slice(1).join(' ') || '';
                }
                
                // Add phone and email
                customer.phone = appointment.extendedProps?.customerPhone || '';
                customer.email = appointment.extendedProps?.customerEmail || '';
            }
        } else {
            // Create a placeholder customer if none selected
            customer = {
                id: '',
                firstName: 'Unknown',
                lastName: 'Customer',
                phone: '',
                email: ''
            };
        }
          // Find sales rep info - handle both selected and existing
        const salesReps = getSalesReps();
        
        // If a sales rep is selected, use that one
        if (salesRepId) {
            salesRep = salesReps.find(r => String(r.id) === String(salesRepId));
            
            if (!salesRep) {
                console.log('Selected sales rep not found, using existing sales rep data');
                // Use existing sales rep data from appointment
                salesRep = {
                    id: salesRepId,
                    name: appointment.extendedProps?.salesRepName || 'Unknown Rep'
                };
            }
        } else {
            // If no sales rep is selected, use the existing one
            salesRep = {
                id: appointment.extendedProps?.salesRepId || '',
                name: appointment.extendedProps?.salesRepName || ''
            };
        }
    } catch (error) {
        console.error('Error getting customer or sales rep data:', error);
        alert('Error retrieving customer or sales rep data. Please try again.');
        return;
    }
    
    // Create start and end dates
    let startDateTime, endDateTime;
    try {
        startDateTime = new Date(`${date}T${time}`);
        if (isNaN(startDateTime)) {
            throw new Error('Invalid date/time');
        }
        endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    } catch (error) {
        console.error('Error parsing date/time:', error);
        alert('Please enter valid date and time.');
        return;
    }
    
    // Create updated appointment object
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
            customerEmail: customer.email || '',
            salesRepId: salesRep.id,
            salesRepName: salesRep.name,
            notes: notes
        }
    };
    
    console.log('Updated appointment object:', appointment);
    
    // Save the appointment
    const updateSuccess = updateAppointmentInDB(appointment);
    
    if (updateSuccess !== false) { // If not explicitly false, consider it success
        // Reset form
        console.log('Appointment updated successfully');
        
        // Clear editing state
        if (saveButton) {
            saveButton.removeAttribute('data-appointment-id');
            saveButton.removeAttribute('data-editing');
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Appointment';
        }
        
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
        const modal = document.getElementById('create-appointment-modal');
        if (modal) {
            if (window.modalHelper) {
                window.modalHelper.hideModal('create-appointment-modal');
            } else {
                modal.style.display = 'none';
                // Remove backdrop if exists
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
        }
        
        // Clear form after hiding modal
        form.reset();
        
        // Show success message
        alert('Appointment updated successfully!');
        
        // Attempt to refresh the calendar
        try {
            if (typeof refreshCalendarEvents === 'function') {
                refreshCalendarEvents();
            }
        } catch (e) {
            console.log('Could not refresh calendar automatically');
        }
    }
}
