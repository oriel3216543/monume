/**
 * Enhanced Save Appointment Handler
 * This script ensures that both new and edited appointments are properly saved
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced save appointment handler loaded');
    attachEnhancedSaveHandler();
});

// Also add handler on full window load in case DOM ready fires too early
window.addEventListener('load', function() {
    setTimeout(function() {
        console.log('Checking for save button after full page load');
        attachEnhancedSaveHandler();
    }, 1000);
});

/**
 * Attaches an enhanced save handler for both new and edited appointments
 */
function attachEnhancedSaveHandler() {
    console.log('Setting up enhanced save appointment handler');
    
    // Get the save button
    const saveButton = document.getElementById('save-appointment');
    
    if (!saveButton) {
        console.error('Save appointment button not found');
        return;
    }
    
    // Remove any existing click listeners with the clone technique
    const newSaveButton = saveButton.cloneNode(true);
    if (saveButton.parentNode) {
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
    }
    
    // Add our enhanced click handler
    newSaveButton.addEventListener('click', function(event) {
        console.log('Save appointment button clicked');
        
        // Get the modal to check if we're in edit mode
        const modal = document.getElementById('create-appointment-modal');
        
        if (!modal) {
            console.error('Create/edit appointment modal not found');
            return;
        }
        
        // Check if we're in edit mode
        const isEditing = modal.getAttribute('data-editing') === 'true' ||
                      document.getElementById('edit-appointment-id')?.value;
        
        if (isEditing) {
            console.log('Saving edited appointment');
            event.preventDefault();
            
            // Call our enhanced update function
            if (typeof updateExistingAppointment === 'function') {
                updateExistingAppointment();
            } else if (typeof enhancedSaveEditedAppointment === 'function') {
                enhancedSaveEditedAppointment();
            } else {
                console.error('No appointment update function found');
                alert('Error: Update function not found. Please refresh the page and try again.');
            }
        } else {
            console.log('Saving new appointment - using default handler');
            // Let the default save handler take over for new appointments
        }
    });
    
    console.log('Enhanced save appointment handler attached');
}

/**
 * Enhanced function to save edited appointment data
 */
function enhancedSaveEditedAppointment() {
    console.log('Executing enhanced save for edited appointment');
    
    // Get the appointment ID being edited
    const appointmentId = document.getElementById('edit-appointment-id')?.value;
    
    if (!appointmentId) {
        console.error('No appointment ID found for editing');
        alert('Error: Could not determine which appointment to update. Please try again.');
        return;
    }
    
    // Get the current appointments
    let appointments = [];
    try {
        // Use the safe function if available
        if (typeof getSafeAppointments === 'function') {
            appointments = getSafeAppointments();
        } else {
            appointments = getAppointments();
        }
    } catch (error) {
        console.error('Error getting appointments:', error);
        alert('Error loading appointment data. Please refresh the page and try again.');
        return;
    }
    
    if (!appointments || !Array.isArray(appointments)) {
        console.error('Invalid appointments data');
        alert('Error: Invalid appointment data. Please refresh the page and try again.');
        return;
    }
    
    // Find the existing appointment
    const appointmentIndex = appointments.findIndex(a => String(a.id).trim() === String(appointmentId).trim());
    
    if (appointmentIndex === -1) {
        console.error('Appointment not found for ID:', appointmentId);
        alert('Error: Appointment not found. It may have been deleted.');
        return;
    }
    
    // Get the existing appointment
    const existingAppointment = appointments[appointmentIndex];
      // Gather form data
    const title = document.getElementById('appointment-title')?.value || existingAppointment.title || 'Unnamed Appointment';
    const type = document.getElementById('appointment-type')?.value || (existingAppointment.extendedProps?.type);
    const startDate = document.getElementById('appointment-date')?.value;
    const startTime = document.getElementById('appointment-time')?.value;
    const duration = parseInt(document.getElementById('appointment-duration')?.value || '60', 10);
    
    // Customer data - use existing if not provided
    let customerId, customerName, customerPhone, customerEmail;
    
    // First check hidden field for selected customer
    const hiddenCustomerId = document.getElementById('selected-customer-id')?.value;
    
    if (hiddenCustomerId) {
        customerId = hiddenCustomerId;
        // Try to get customer details from localStorage
        try {
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');
            const selectedCustomer = customers.find(c => String(c.id) === String(customerId));
            if (selectedCustomer) {
                customerName = `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim();
                customerPhone = selectedCustomer.phone || '';
                customerEmail = selectedCustomer.email || '';
            }
        } catch (e) {
            console.error('Error getting customer details:', e);
        }
    }
    
    // If no customer details found, use existing appointment details
    if (!customerId) {
        customerId = existingAppointment.extendedProps?.customerId || '';
        customerName = existingAppointment.extendedProps?.customerName || '';
        customerPhone = existingAppointment.extendedProps?.customerPhone || '';
        customerEmail = existingAppointment.extendedProps?.customerEmail || '';
    }
    
    // Sales rep data - use selected or existing rep, NEVER default
    let salesRepId = document.getElementById('appointment-sales-rep')?.value;
    let salesRepName = '';
    
    // If sales rep is selected, get their name
    if (salesRepId) {
        const salesRepDropdown = document.getElementById('appointment-sales-rep');
        if (salesRepDropdown?.selectedOptions?.[0]) {
            salesRepName = salesRepDropdown.selectedOptions[0].textContent;
        } else {
            // Try to find the sales rep name from localStorage
            try {
                const salesReps = JSON.parse(localStorage.getItem('salesReps') || '[]');
                const selectedRep = salesReps.find(rep => String(rep.id) === String(salesRepId));
                if (selectedRep) {
                    salesRepName = selectedRep.name || '';
                }
            } catch (e) {
                console.error('Error getting sales rep details:', e);
            }
        }
    } else {
        // Use existing sales rep info if no selection made
        salesRepId = existingAppointment.extendedProps?.salesRepId || '';
        salesRepName = existingAppointment.extendedProps?.salesRepName || '';
    }
    
    const notes = document.getElementById('appointment-notes')?.value || existingAppointment.extendedProps?.notes || '';
      // For edit mode, we need to be more flexible and allow missing fields
    // We'll use the existing appointment values for any missing fields
    
    let startDateTime;
    
    // If both date and time are provided, parse them
    if (startDate && startTime) {
        try {
            const [year, month, day] = startDate.split('-').map(Number);
            const [hours, minutes] = startTime.split(':').map(Number);
            startDateTime = new Date(year, month - 1, day, hours, minutes);
            
            if (isNaN(startDateTime.getTime())) {
                console.error('Invalid date/time from form values');
                // Use the original date instead
                startDateTime = new Date(existingAppointment.start);
            }
        } catch (error) {
            console.error('Error parsing date/time:', error);
            // Use the original date instead
            startDateTime = new Date(existingAppointment.start);
        }
    } 
    // If only date is provided but no time
    else if (startDate && !startTime) {
        try {
            // Use the date from input but keep the original time
            const [year, month, day] = startDate.split('-').map(Number);
            const originalDate = new Date(existingAppointment.start);
            startDateTime = new Date(year, month - 1, day, 
                originalDate.getHours(), originalDate.getMinutes());
            
            if (isNaN(startDateTime.getTime())) {
                startDateTime = new Date(existingAppointment.start);
            }
        } catch (error) {
            console.error('Error parsing partial date:', error);
            startDateTime = new Date(existingAppointment.start);
        }
    } 
    // If only time is provided but no date
    else if (!startDate && startTime) {
        try {
            // Use the time from input but keep the original date
            const [hours, minutes] = startTime.split(':').map(Number);
            const originalDate = new Date(existingAppointment.start);
            startDateTime = new Date(
                originalDate.getFullYear(), 
                originalDate.getMonth(), 
                originalDate.getDate(),
                hours, minutes
            );
            
            if (isNaN(startDateTime.getTime())) {
                startDateTime = new Date(existingAppointment.start);
            }
        } catch (error) {
            console.error('Error parsing partial time:', error);
            startDateTime = new Date(existingAppointment.start);
        }
    } 
    // If neither date nor time is provided
    else {
        // Keep the original date/time
        console.log('Using original appointment date/time');
        startDateTime = new Date(existingAppointment.start);
    }
    
    // Calculate end time
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    
    // Update the appointment
    const updatedAppointment = {
        ...existingAppointment,
        title: title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        extendedProps: {
            ...existingAppointment.extendedProps,
            type: type,
            customerId: customerId,
            customerName: customerName,
            salesRepId: salesRepId,
            salesRepName: salesRepName,
            notes: notes
        }
    };
    
    // Update the appointments array
    appointments[appointmentIndex] = updatedAppointment;
      // Save to localStorage
    try {
        localStorage.setItem('appointments', JSON.stringify(appointments));
        console.log('Appointment updated successfully');
          // Close the modal properly - with enhanced backdrop removal
        const modal = document.getElementById('create-appointment-modal');
        if (modal) {
            // AGGRESSIVELY remove any and all modal backdrops
            console.log('Removing ALL modal backdrops');
            
            // Method 1: Remove by standard class
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                console.log('Removing standard modal backdrop');
                backdrop.parentNode.removeChild(backdrop);
            });
            
            // Method 2: Remove by fade show class
            const fadeBackdrops = document.querySelectorAll('.modal-backdrop.fade.show');
            fadeBackdrops.forEach(backdrop => {
                console.log('Removing fade show modal backdrop');
                backdrop.parentNode.removeChild(backdrop);
            });
            
            // Method 3: Find any element that might be a backdrop by style
            const possibleBackdrops = document.querySelectorAll('div[style*="background"]');
            possibleBackdrops.forEach(element => {
                const style = window.getComputedStyle(element);
                // If it looks like a backdrop (covers the screen and is semi-transparent)
                if (element.style.position === 'fixed' && 
                    (element.style.zIndex >= 1000 || element.style.zIndex === 'auto') && 
                    element.style.background && 
                    element.style.background.includes('rgba')) {
                    console.log('Removing backdrop-like element:', element);
                    element.parentNode.removeChild(element);
                }
            });
            
            // Then hide the modal
            if (typeof modalHelper !== 'undefined' && modalHelper.hideModal) {
                modalHelper.hideModal('create-appointment-modal');
            } else {
                modal.style.display = 'none';
            }
            
            // Make body scrollable again in case it was disabled
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
            document.body.classList.remove('modal-open-custom');
            
            // Remove any inline styles that might have been added to body
            document.body.style.paddingRight = '';
            document.body.style.overflow = '';
            
            // Reset the edit mode flag
            modal.removeAttribute('data-editing');
            
            // Clear the appointment ID
            document.getElementById('edit-appointment-id')?.removeAttribute('value');
        }
        
        // Refresh calendar if function exists
        if (typeof refreshCalendar === 'function') {
            console.log('Refreshing calendar');
            refreshCalendar();
        } else {
            console.log('No calendar refresh function found, reloading page instead');
            window.location.reload();
        }
        
        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification('Appointment updated successfully', 'success');
        } else {
            alert('Appointment updated successfully');
        }
    } catch (error) {
        console.error('Error saving appointment:', error);
        alert('Error saving appointment. Please try again.');
    }
}

// Expose our function to the global scope
window.enhancedSaveEditedAppointment = enhancedSaveEditedAppointment;
window.updateExistingAppointment = enhancedSaveEditedAppointment;

// Log to console that the script is loaded
console.log('Enhanced save appointment handler script loaded successfully');
