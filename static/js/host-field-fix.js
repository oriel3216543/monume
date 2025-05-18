/**
 * Host Field Enhancement Script
 * This script fixes issues with the host/sales rep field in the appointment edit modal
 */

// Execute immediately when loaded
(function() {
    console.log('Host field enhancement loading...');
    
    // Set up initialization on DOM ready and window load to ensure it runs
    document.addEventListener('DOMContentLoaded', initializeHostFieldEnhancement);
    window.addEventListener('load', function() {
        setTimeout(initializeHostFieldEnhancement, 500);
    });
    
    /**
     * Initialize the host field enhancement functionality
     */
    function initializeHostFieldEnhancement() {
        console.log('Initializing host field enhancement');
        
        // Add a mutation observer to detect when the modal is shown
        const modalObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style') {
                    const modal = document.getElementById('create-appointment-modal');
                    if (modal && modal.style.display === 'block') {
                        console.log('Modal displayed - checking host field');
                        enhanceHostField();
                    }
                }
            });
        });
        
        // Start observing the modal
        const modal = document.getElementById('create-appointment-modal');
        if (modal) {
            modalObserver.observe(modal, { attributes: true });
            console.log('Modal observer set up');
        }
        
        // Also set up direct enhancement when editing appointments
        monkeyPatchEditFunction();
    }
    
    /**
     * Enhance the host field population and selection
     */
    function enhanceHostField() {
        console.log('Enhancing host field');
        
        const hostField = document.getElementById('appointment-sales-rep');
        if (!hostField) {
            console.error('Host field not found');
            return;
        }
        
        // Check if we're in edit mode
        const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                      document.getElementById('edit-appointment-id')?.value;
        
        if (!isEditing) {
            console.log('Not in edit mode, skipping host field enhancement');
            return;
        }
        
        // Get the appointment ID
        const appointmentId = document.getElementById('edit-appointment-id')?.value;
        if (!appointmentId) {
            console.error('No appointment ID found for editing');
            return;
        }
        
        // Get the appointment data
        let appointment = null;
        try {
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            appointment = appointments.find(a => String(a.id) === String(appointmentId));
        } catch (error) {
            console.error('Error getting appointment data:', error);
        }
        
        if (!appointment) {
            console.error('Could not find appointment with ID:', appointmentId);
            return;
        }
        
        // Get sales rep ID from the appointment
        const salesRepId = appointment.extendedProps?.salesRepId || '';
        const salesRepName = appointment.extendedProps?.salesRepName || '';
        
        console.log('Appointment host data:', { salesRepId, salesRepName });
        
        // Try multiple approaches to set the correct host/sales rep
        
        // Approach 1: Direct value setting
        hostField.value = salesRepId;
        
        // Approach 2: If approach 1 didn't work (check selectedIndex)
        if (salesRepId && hostField.selectedIndex < 0) {
            console.log('Direct value setting failed, trying by name');
            
            // Look through options to find matching text
            for (let i = 0; i < hostField.options.length; i++) {
                const option = hostField.options[i];
                if (option.textContent === salesRepName) {
                    console.log('Found matching sales rep by name');
                    hostField.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Approach 3: If we still don't have a selection, try partial matching
        if (salesRepName && hostField.selectedIndex < 0) {
            console.log('Trying partial name matching');
            
            const nameParts = salesRepName.toLowerCase().split(' ');
            for (let i = 0; i < hostField.options.length; i++) {
                const optionText = hostField.options[i].textContent.toLowerCase();
                
                // Check if any part of the name matches
                if (nameParts.some(part => optionText.includes(part))) {
                    console.log('Found partial match for sales rep');
                    hostField.selectedIndex = i;
                    break;
                }
            }
        }
        
        console.log('Final host selection:', {
            index: hostField.selectedIndex,
            value: hostField.value,
            text: hostField.selectedOptions[0]?.textContent || 'none'
        });
        
        // Add change event listener to debug host selection changes
        hostField.addEventListener('change', function() {
            console.log('Host field changed by user:', {
                index: hostField.selectedIndex,
                value: hostField.value,
                text: hostField.selectedOptions[0]?.textContent || 'none'
            });
        });
    }
    
    /**
     * Monkey patch existing edit functions to ensure our host enhancement runs
     */
    function monkeyPatchEditFunction() {
        // Store original functions
        const originalEnhancedEditAppointment = window.enhancedEditAppointment;
        const originalEditAppointment = window.editAppointment;
        
        // Override enhancedEditAppointment if it exists
        if (typeof originalEnhancedEditAppointment === 'function') {
            window.enhancedEditAppointment = function() {
                // Call original function
                const result = originalEnhancedEditAppointment.apply(this, arguments);
                
                // Run our enhancement after a short delay
                setTimeout(enhanceHostField, 100);
                
                return result;
            };
            console.log('Enhanced the enhancedEditAppointment function');
        }
        
        // Override editAppointment if it exists
        if (typeof originalEditAppointment === 'function') {
            window.editAppointment = function() {
                // Call original function
                const result = originalEditAppointment.apply(this, arguments);
                
                // Run our enhancement after a short delay
                setTimeout(enhanceHostField, 100);
                
                return result;
            };
            console.log('Enhanced the editAppointment function');
        }
    }
    
    console.log('Host field enhancement loaded');
})();
