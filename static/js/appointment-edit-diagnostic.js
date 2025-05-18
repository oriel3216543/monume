/**
 * Appointment Edit Diagnostic Tool
 * This script helps diagnose and fix issues with the appointment edit functionality
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Appointment edit diagnostic tool loaded');
    
    // Add diagnostic function to global scope
    window.diagnoseAppointmentEdit = function() {
        console.log('Running appointment edit diagnostic...');
        
        // 1. Check if the appointment data is valid
        checkAppointmentData();
        
        // 2. Check if the edit button is properly set up
        checkEditButton();
        
        // 3. Check if the edit form is properly set up
        checkEditForm();
        
        // 4. Check if the save button is properly set up
        checkSaveButton();
        
        // 5. Check if modal transitions work properly
        checkModalTransitions();
        
        console.log('Appointment edit diagnostic completed');
    };
    
    // Check appointment data
    function checkAppointmentData() {
        console.log('Checking appointment data...');
        
        try {
            // Get appointment data
            const appointments = localStorage.getItem('appointments');
            
            if (!appointments) {
                console.error('No appointment data found in localStorage');
                return false;
            }
            
            // Parse appointment data
            const parsedAppointments = JSON.parse(appointments);
            
            if (!Array.isArray(parsedAppointments)) {
                console.error('Appointment data is not an array');
                return false;
            }
            
            console.log('Appointment data format is valid');
            console.log('Found', parsedAppointments.length, 'appointments');
            
            // Check a sample appointment
            if (parsedAppointments.length > 0) {
                const sample = parsedAppointments[0];
                console.log('Sample appointment:', sample);
                
                // Check required fields
                const hasRequiredFields = sample.id && sample.title && sample.start && sample.end;
                console.log('Has required fields:', hasRequiredFields);
                
                // Check extended props
                const hasExtendedProps = sample.extendedProps && typeof sample.extendedProps === 'object';
                console.log('Has extended properties:', hasExtendedProps);
                
                if (hasExtendedProps) {
                    const extendedProps = sample.extendedProps;
                    console.log('Extended properties:', extendedProps);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error checking appointment data:', error);
            return false;
        }
    }
    
    // Check edit button
    function checkEditButton() {
        console.log('Checking edit button...');
        
        // Find all possible edit buttons
        const editById = document.getElementById('edit-appointment');
        const editButtons = document.querySelectorAll('button:has(i.fa-edit)');
        const editButtonsByText = document.querySelectorAll('button:contains("Edit")');
        
        console.log('Edit button by ID:', editById);
        console.log('Edit buttons with edit icon:', editButtons.length);
        console.log('Edit buttons with "Edit" text:', editButtonsByText.length);
        
        // Check if click events are attached
        if (editById) {
            console.log('Click events on edit-appointment button:', getEventListeners(editById, 'click').length);
        }
        
        return Boolean(editById || editButtons.length || editButtonsByText.length);
    }
    
    // Check edit form
    function checkEditForm() {
        console.log('Checking edit form...');
        
        // Check if form exists
        const form = document.getElementById('appointment-form');
        if (!form) {
            console.error('Appointment form not found');
            return false;
        }
        
        console.log('Appointment form exists');
        
        // Check required fields
        const titleField = document.getElementById('appointment-title');
        const dateField = document.getElementById('appointment-date');
        const timeField = document.getElementById('appointment-time');
        const customerField = document.getElementById('appointment-customer');
        const salesRepField = document.getElementById('appointment-sales-rep');
        const hiddenIdField = document.getElementById('edit-appointment-id');
        
        console.log('Title field exists:', Boolean(titleField));
        console.log('Date field exists:', Boolean(dateField));
        console.log('Time field exists:', Boolean(timeField));
        console.log('Customer field exists:', Boolean(customerField));
        console.log('Sales rep field exists:', Boolean(salesRepField));
        console.log('Hidden ID field exists:', Boolean(hiddenIdField));
        
        return Boolean(titleField && dateField && timeField && customerField && salesRepField && hiddenIdField);
    }
    
    // Check save button
    function checkSaveButton() {
        console.log('Checking save button...');
        
        // Find save button
        const saveButton = document.getElementById('save-appointment');
        
        if (!saveButton) {
            console.error('Save appointment button not found');
            return false;
        }
        
        console.log('Save button exists');
        
        // Try to get event listeners
        console.log('Click events on save button:', getEventListeners(saveButton, 'click').length);
        
        return true;
    }
    
    // Check modal transitions
    function checkModalTransitions() {
        console.log('Checking modal transitions...');
        
        // Check if modal helper exists
        const hasModalHelper = typeof modalHelper !== 'undefined';
        console.log('Modal helper exists:', hasModalHelper);
        
        if (hasModalHelper) {
            console.log('Modal helper functions:');
            console.log('- showModal:', typeof modalHelper.showModal === 'function');
            console.log('- hideModal:', typeof modalHelper.hideModal === 'function');
            console.log('- transitionToEdit:', typeof modalHelper.transitionToEdit === 'function');
        }
        
        // Check modals
        const detailsModal = document.getElementById('appointment-details-modal');
        const editModal = document.getElementById('create-appointment-modal');
        
        console.log('Details modal exists:', Boolean(detailsModal));
        console.log('Edit modal exists:', Boolean(editModal));
        
        return hasModalHelper && detailsModal && editModal;
    }
    
    // Helper function to get event listeners (won't work in all browsers)
    function getEventListeners(element, eventType) {
        try {
            // Check if we can access the element's event listeners (only works in dev tools)
            if (element && typeof element.onclick === 'function') {
                return [element.onclick];
            }
        } catch (error) {
            console.warn('Could not access event listeners');
        }
        return [];
    }
    
    // Also expose a fix function
    window.fixAppointmentEdit = function() {
        console.log('Running appointment edit fixes...');
        
        // 1. Fix appointment data issues
        fixAppointmentData();
        
        // 2. Ensure proper event handlers are attached
        ensureEventHandlers();
        
        // 3. Ensure hidden fields exist
        ensureHiddenFields();
        
        console.log('Appointment edit fixes completed');
    };
    
    // Fix appointment data issues
    function fixAppointmentData() {
        console.log('Fixing appointment data...');
        
        try {
            // Use our data helper functions if available
            if (typeof validateAndRepairAppointmentData === 'function') {
                validateAndRepairAppointmentData();
                return;
            }
            
            // Otherwise try to fix it manually
            const appointments = localStorage.getItem('appointments');
            
            if (!appointments) {
                console.log('No appointment data found, initializing with empty array');
                localStorage.setItem('appointments', '[]');
                return;
            }
            
            try {
                const parsedAppointments = JSON.parse(appointments);
                
                if (!Array.isArray(parsedAppointments)) {
                    console.error('Appointment data is not an array, resetting');
                    localStorage.setItem('appointments', '[]');
                    return;
                }
            } catch (error) {
                console.error('Error parsing appointment data, resetting', error);
                localStorage.setItem('appointments', '[]');
            }
        } catch (error) {
            console.error('Error fixing appointment data:', error);
        }
    }
    
    // Ensure proper event handlers are attached
    function ensureEventHandlers() {
        console.log('Ensuring event handlers are attached...');
        
        try {
            // For the edit button
            const editButton = document.getElementById('edit-appointment');
            if (editButton) {
                console.log('Attaching event handler to edit button');
                editButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    
                    // Get the event ID from the appointment details modal
                    const detailsModal = document.getElementById('appointment-details-modal');
                    const eventId = detailsModal?.getAttribute('data-event-id');
                    
                    if (!eventId) {
                        console.error('No event ID found for editing');
                        return;
                    }
                    
                    // Hide the details modal
                    if (detailsModal) {
                        if (typeof modalHelper?.hideModal === 'function') {
                            modalHelper.hideModal('appointment-details-modal');
                        } else {
                            detailsModal.style.display = 'none';
                        }
                    }
                    
                    // Call the enhanced edit function if available
                    if (typeof enhancedEditAppointment === 'function') {
                        enhancedEditAppointment(eventId);
                    } else {
                        // Fallback: open the edit modal and set the ID
                        const editModal = document.getElementById('create-appointment-modal');
                        if (editModal) {
                            editModal.style.display = 'block';
                            
                            // Set the appointment ID field if it exists
                            const idField = document.getElementById('edit-appointment-id');
                            if (idField) {
                                idField.value = eventId;
                            }
                        }
                    }
                });
            }
            
            // For the save button
            const saveButton = document.getElementById('save-appointment');
            if (saveButton) {
                console.log('Attaching event handler to save button');
                saveButton.addEventListener('click', function() {
                    // Check if we're in edit mode
                    const editIdField = document.getElementById('edit-appointment-id');
                    const isEditing = editIdField && editIdField.value;
                    
                    if (isEditing) {
                        // Save the edited appointment
                        if (typeof enhancedSaveEditedAppointment === 'function') {
                            enhancedSaveEditedAppointment();
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error ensuring event handlers:', error);
        }
    }
    
    // Ensure hidden fields exist
    function ensureHiddenFields() {
        console.log('Ensuring hidden fields exist...');
        
        try {
            // Check for edit-appointment-id
            let idField = document.getElementById('edit-appointment-id');
            
            if (!idField) {
                console.log('Creating hidden edit-appointment-id field');
                
                // Create the field
                idField = document.createElement('input');
                idField.type = 'hidden';
                idField.id = 'edit-appointment-id';
                idField.name = 'edit-appointment-id';
                
                // Add it to the form
                const form = document.getElementById('appointment-form');
                if (form) {
                    form.appendChild(idField);
                } else {
                    // Or add it to the modal
                    const modal = document.getElementById('create-appointment-modal');
                    if (modal) {
                        modal.querySelector('.modal-body')?.appendChild(idField);
                    }
                }
            }
        } catch (error) {
            console.error('Error ensuring hidden fields:', error);
        }
    }
    
    // Add a button in the top-right corner for quick diagnostics in development mode
    if (localStorage.getItem('devMode') === 'true') {
        const diagButton = document.createElement('button');
        diagButton.textContent = 'Diagnose Appointments';
        diagButton.style.position = 'fixed';
        diagButton.style.top = '10px';
        diagButton.style.right = '10px';
        diagButton.style.zIndex = '9999';
        diagButton.style.padding = '5px 10px';
        diagButton.style.backgroundColor = '#f0f0f0';
        diagButton.style.border = '1px solid #ccc';
        diagButton.style.borderRadius = '4px';
        diagButton.style.cursor = 'pointer';
        
        diagButton.addEventListener('click', function() {
            diagnoseAppointmentEdit();
        });
        
        document.body.appendChild(diagButton);
    }
});

// Log that the script is loaded
console.log('Appointment edit diagnostic tool loaded successfully');
