/**
 * Enhanced edit appointment function to properly handle modal transitions
 * - Ensures the edit modal opens properly after details modal is closed
 * - Uses the modalHelper utility when available
 * - Includes comprehensive fallback techniques
 * - Provides better error handling and logging
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
    
    // Get the edit modal element
    const modal = document.getElementById('create-appointment-modal');
    if (!modal) {
        console.error('Edit modal element not found');
        return;
    }
    
    // Change modal title to indicate editing
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Appointment';
    } else {
        console.error('Modal title element not found');
    }
    
    // Set data attributes to mark as editing
    modal.setAttribute('data-editing', 'true');
    modal.setAttribute('data-event-id', normalizedId);
    
    console.log('Loading appointment data into form for editing');
    
    try {
        // Populate form fields with appointment data
        if (document.getElementById('edit-appointment-id')) {
            document.getElementById('edit-appointment-id').value = appointment.id;
        }
        
        // Basic appointment details
        if (document.getElementById('appointment-title')) {
            document.getElementById('appointment-title').value = appointment.title || '';
        }
        
        // Customer information
        if (document.getElementById('appointment-customer')) {
            document.getElementById('appointment-customer').value = 
                appointment.customer || 
                appointment.extendedProps?.customerName || 
                '';
        }
        
        if (document.getElementById('appointment-phone')) {
            document.getElementById('appointment-phone').value = 
                appointment.phone || 
                appointment.extendedProps?.customerPhone || 
                '';
        }
        
        // Date and time
        const startDate = appointment.start instanceof Date ? 
            appointment.start : 
            new Date(appointment.start);
            
        if (document.getElementById('appointment-date')) {
            document.getElementById('appointment-date').value = startDate.toISOString().split('T')[0];
        }
        
        if (document.getElementById('appointment-time')) {
            document.getElementById('appointment-time').value = 
                startDate.toTimeString().substring(0, 5) || 
                appointment.time || 
                '';
        }
        
        // Status and notes
        if (document.getElementById('appointment-status')) {
            document.getElementById('appointment-status').value = 
                appointment.status || 
                appointment.extendedProps?.status || 
                'scheduled';
        }
        
        if (document.getElementById('appointment-notes')) {
            document.getElementById('appointment-notes').value = 
                appointment.notes || 
                appointment.extendedProps?.notes || 
                '';
        }
        
        // Additional fields
        const locationField = document.getElementById('appointment-location');
        if (locationField) {
            locationField.value = 
                appointment.location || 
                appointment.extendedProps?.location || 
                '';
        }
        
        // Duration
        let duration = '60'; // Default duration
        
        if (appointment.end) {
            const endDate = appointment.end instanceof Date ? 
                appointment.end : 
                new Date(appointment.end);
            duration = Math.round((endDate - startDate) / (1000 * 60)).toString();
        } else if (appointment.duration) {
            duration = appointment.duration;
        }
        
        const durationField = document.getElementById('appointment-duration');
        if (durationField) {
            durationField.value = duration;
        }
        
        // If there's a save button, mark it for editing
        const saveButton = document.getElementById('save-appointment');
        if (saveButton) {
            saveButton.setAttribute('data-editing', 'true');
            saveButton.setAttribute('data-appointment-id', normalizedId);
        }
        
        console.log('Appointment data loaded into form successfully');
    } catch (e) {
        console.error('Error populating form fields:', e);
        alert('There was an error loading appointment data into the form.');
    }
    
    // Show the modal using modalHelper if available, otherwise use fallback methods
    if (window.modalHelper) {
        console.log('Using modal helper to display edit modal');
        window.modalHelper.showModal('create-appointment-modal');
    } else {
        try {
            console.log('Using direct techniques to show edit modal');
            
            // Technique 1: Direct style manipulation
            modal.style.display = 'block';
            
            // Technique 2: Important CSS override
            modal.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; z-index: 10000 !important;';
            
            // Technique 3: Class manipulation
            modal.classList.remove('hide', 'hidden', 'd-none', 'collapse');
            modal.classList.add('show');
            
            // Technique 4: Handle backdrop
            let backdrop = document.querySelector('.modal-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;';
                document.body.appendChild(backdrop);
            }
            
            // Technique 5: Body class
            document.body.classList.add('modal-open');
            
            // Check visibility after a small delay
            setTimeout(() => {
                const isVisible = window.getComputedStyle(modal).display !== 'none';
                console.log('Modal visible after techniques:', isVisible);
                
                if (!isVisible) {
                    // Try additional methods
                    console.warn('Modal not visible, trying additional methods');
                    
                    // Technique 6: jQuery if available
                    if (typeof $ !== 'undefined') {
                        try {
                            $(modal).modal('show');
                            console.log('Showed modal via jQuery modal method');
                        } catch (e) {
                            console.error('jQuery modal show error:', e);
                        }
                    }
                    
                    // Technique 7: Force repaint
                    modal.offsetHeight;
                    
                    // Technique 8: Direct HTML attribute
                    modal.setAttribute('style', 'display: block !important');
                }
            }, 50);
        } catch (e) {
            console.error('Error displaying modal:', e);
            // Final fallback - simple display change
            modal.style.display = 'block';
        }
    }
    
    console.log('Edit appointment process complete for ID:', normalizedId);
}
