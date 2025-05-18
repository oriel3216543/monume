/**
 * Form Submission Fix
 * This script ensures that the appointment form is properly handled
 */

// Execute immediately when loaded
(function() {
    console.log('Form submission fix loading...');
    
    // Run on DOM ready
    document.addEventListener('DOMContentLoaded', fixFormSubmission);
    
    // And after window load
    window.addEventListener('load', function() {
        setTimeout(fixFormSubmission, 500);
    });
    
    /**
     * Fix the form submission behavior
     */
    function fixFormSubmission() {
        console.log('Fixing form submission...');
        
        const form = document.getElementById('appointment-form');
        if (!form) {
            console.warn('Appointment form not found yet');
            return;
        }
        
        // Remove existing submit handlers using cloning technique
        const newForm = form.cloneNode(true);
        if (form.parentNode) {
            form.parentNode.replaceChild(newForm, form);
        }
        
        // Add our own submit handler
        newForm.addEventListener('submit', function(event) {
            // Always prevent default form submission
            event.preventDefault();
            
            console.log('Form submission intercepted');
            
            // Check if we're in edit mode
            const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                           document.getElementById('edit-appointment-id')?.value;
            
            console.log('Form submission - editing mode:', isEditing);
            
            // Handle based on mode
            if (isEditing) {
                // Use our ultimate save function
                if (typeof window.ultimateSaveAppointment === 'function') {
                    console.log('Using ultimate save function for edit mode');
                    window.ultimateSaveAppointment();
                }
                // Fallback to enhanced save
                else if (typeof window.enhancedSaveEditedAppointment === 'function') {
                    console.log('Using enhanced save function for edit mode');
                    window.enhancedSaveEditedAppointment();
                }
                // Last resort - click the save button
                else {
                    console.log('No save function found, clicking save button');
                    const saveButton = document.getElementById('save-appointment');
                    if (saveButton) {
                        saveButton.click();
                    } else {
                        console.error('Save button not found');
                        alert('Error: Could not find save button. Please try again.');
                    }
                }
            }
            // For new appointments, let the validation handler take over
            else if (typeof validateAppointmentForm === 'function') {
                console.log('Using validateAppointmentForm for new appointment');
                if (validateAppointmentForm()) {
                    // If validation passes, use the save function
                    if (typeof saveNewAppointment === 'function') {
                        console.log('Using saveNewAppointment function');
                        saveNewAppointment();
                    } else {
                        console.log('No saveNewAppointment function found, clicking save button');
                        const saveButton = document.getElementById('save-appointment');
                        if (saveButton) {
                            saveButton.click();
                        }
                    }
                }
            }
            // If no validation function, just click the save button
            else {
                console.log('No validation function found, clicking save button');
                const saveButton = document.getElementById('save-appointment');
                if (saveButton) {
                    saveButton.click();
                }
            }
        });
        
        console.log('Form submission handler installed');
    }
    
    console.log('Form submission fix loaded');
})();
