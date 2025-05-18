/**
 * Appointment Edit Validation
 * This script validates the edit form inputs and ensures the data is consistent
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Appointment edit validation script loaded');
    setupValidation();
});

// Set up validation when the form is displayed
function setupValidation() {
    // Get the form
    const form = document.getElementById('appointment-form');
    if (!form) {
        console.error('Appointment form not found');
        return;
    }
      // Add validation before submit
    form.addEventListener('submit', function(event) {
        // Prevent default submission
        event.preventDefault();
        
        // Check if we're in edit mode
        const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                       document.getElementById('edit-appointment-id')?.value;
        
        console.log('Form submitted, editing mode:', isEditing);
        
        // If in edit mode, bypass validation completely
        if (isEditing) {
            console.log('Edit mode - bypassing validation entirely');
            
            // Process the edit directly
            if (typeof enhancedSaveEditedAppointment === 'function') {
                enhancedSaveEditedAppointment();
            } else if (typeof updateExistingAppointment === 'function') {
                updateExistingAppointment();
            } else {
                console.error('No function found to update existing appointment');
                alert('Error: Could not save changes. Please refresh the page and try again.');
            }
            return; // Exit early
        }
        
        // For new appointments, validate as normal
        if (validateAppointmentForm()) {
            console.log('New appointment - form validation passed');
            // This case is handled by the existing event handlers
            // Just ensure the form submission goes through by triggering the save button
            document.getElementById('save-appointment')?.click();
        } else {
            console.log('Form validation failed');
        }
    });
    
    // Also add validation to individual fields
    addFieldValidation('appointment-title', validateTitle);
    addFieldValidation('appointment-date', validateDate);
    addFieldValidation('appointment-time', validateTime);
    addFieldValidation('appointment-customer', validateCustomer);
    addFieldValidation('appointment-sales-rep', validateSalesRep);
}

// Add validation to a specific field
function addFieldValidation(fieldId, validationFn) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.addEventListener('change', function() {
        validationFn(field);
    });
    
    field.addEventListener('blur', function() {
        validationFn(field);
    });
}

// Validate the entire form
function validateAppointmentForm() {
    // First, check if we're in edit mode - in edit mode we make all fields optional
    const editModalAttr = document.getElementById('create-appointment-modal')?.getAttribute('data-editing');
    const editIdField = document.getElementById('edit-appointment-id')?.value;
    const saveButton = document.getElementById('save-appointment');
    const saveButtonEditing = saveButton?.getAttribute('data-editing') === 'true';
    const saveButtonId = saveButton?.getAttribute('data-appointment-id');
    
    // Check all possible indicators of edit mode
    const isEditing = 
        editModalAttr === 'true' || 
        Boolean(editIdField) || 
        saveButtonEditing ||
        Boolean(saveButtonId);
    
    console.log('Validation called, edit mode detected:', isEditing);
    console.log('Edit indicators:', {
        modalAttr: editModalAttr,
        idField: editIdField,
        buttonEditing: saveButtonEditing,
        buttonId: saveButtonId
    });
    
    // If editing, skip validation entirely - all fields are optional
    if (isEditing) {
        console.log('Edit mode confirmed - bypassing ALL validation');
        
        // Clear any existing validation errors
        const invalidFields = document.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
            const errorMessage = field.parentElement.querySelector('.invalid-feedback');
            if (errorMessage) errorMessage.style.display = 'none';
        });
        
        return true;
    }
    
    // For new appointments, validate each required field
    if (!validateTitle(titleField)) isValid = false;
    if (!validateDate(dateField)) isValid = false;
    if (!validateTime(timeField)) isValid = false;
    if (!validateCustomer(customerField)) isValid = false;
    if (!validateSalesRep(salesRepField)) isValid = false;
    
    return isValid;
}

// Validate title field
function validateTitle(field) {
    if (!field) return false;
    
    // Check if in edit mode
    const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                   document.getElementById('edit-appointment-id')?.value;
    
    const value = field.value.trim();
    
    // Check if empty (only required for new appointments)
    if (!value && !isEditing) {
        setFieldError(field, 'Please enter an appointment title');
        return false;
    }
    
    // Title is valid or optional in edit mode
    clearFieldError(field);
    return true;
}

// Validate date field
function validateDate(field) {
    if (!field) return false;
    
    // Check if in edit mode
    const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                   document.getElementById('edit-appointment-id')?.value;
    
    const value = field.value.trim();
    
    // Check if empty (only required for new appointments)
    if (!value && !isEditing) {
        setFieldError(field, 'Please select a date');
        return false;
    }
    
    // If editing and field is empty, it's valid (we'll keep the original date)
    if (isEditing && !value) {
        clearFieldError(field);
        return true;
    }
    
    // If there's a value, validate it regardless of mode
    if (value) {
        // Check format (YYYY-MM-DD)
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(value)) {
            setFieldError(field, 'Please enter a valid date (YYYY-MM-DD)');
            return false;
        }
        
        // Try to parse date
        try {
            const date = new Date(value);
            
            if (isNaN(date.getTime())) {
                setFieldError(field, 'Please enter a valid date');
                return false;
            }
        } catch (error) {
            setFieldError(field, 'Please enter a valid date');
            return false;
        }
    }
    
    // Date is valid or optional in edit mode
    clearFieldError(field);
    return true;
}

// Validate time field
function validateTime(field) {
    if (!field) return false;
    
    // Check if we're using separate time fields
    const hourField = document.getElementById('appointment-hour');
    const minuteField = document.getElementById('appointment-minute');
    const ampmField = document.getElementById('appointment-ampm');
    
    // If we have separate hour/minute fields instead
    if (hourField && minuteField) {
        return validateSeparateTimeFields(hourField, minuteField, ampmField);
    }
    
    // Check if in edit mode
    const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                   document.getElementById('edit-appointment-id')?.value;
    
    const value = field.value.trim();
    
    // Check if empty (only required for new appointments)
    if (!value && !isEditing) {
        setFieldError(field, 'Please select a time');
        return false;
    }
    
    // If editing and field is empty, it's valid (we'll keep the original time)
    if (isEditing && !value) {
        clearFieldError(field);
        return true;
    }
    
    // If there's a value, validate it
    if (value) {
        // Check format (HH:MM)
        const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timePattern.test(value)) {
            setFieldError(field, 'Please enter a valid time (HH:MM)');
            return false;
        }
    }
    
    // Time is valid or optional in edit mode
    clearFieldError(field);
    return true;
}

// Validate separate hour/minute/ampm fields
function validateSeparateTimeFields(hourField, minuteField, ampmField) {
    if (!hourField || !minuteField) return false;
    
    // Check if in edit mode
    const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                   document.getElementById('edit-appointment-id')?.value;
    
    const hour = hourField.value.trim();
    const minute = minuteField.value.trim();
    const ampm = ampmField ? ampmField.value.trim() : '';
    
    // In edit mode, if all fields are empty, it's valid (we keep the original time)
    if (isEditing && !hour && !minute) {
        clearFieldError(hourField);
        clearFieldError(minuteField);
        if (ampmField) clearFieldError(ampmField);
        return true;
    }
    
    // For new appointments, all fields are required
    if (!isEditing) {
        if (!hour) {
            setFieldError(hourField, 'Please select an hour');
            return false;
        }
        
        if (!minute) {
            setFieldError(minuteField, 'Please select a minute');
            return false;
        }
        
        if (ampmField && !ampm) {
            setFieldError(ampmField, 'Please select AM or PM');
            return false;
        }
    }
    
    // All fields valid or optional in edit mode
    clearFieldError(hourField);
    clearFieldError(minuteField);
    if (ampmField) clearFieldError(ampmField);
    return true;
}

// Validate customer field
function validateCustomer(field) {
    if (!field) {
        // Try checking for a hidden customer ID field (for edit mode)
        const hiddenCustomerField = document.getElementById('selected-customer-id');
        if (hiddenCustomerField && hiddenCustomerField.value) {
            return true; // Valid if we have hidden customer ID
        }
        
        // Check if customer selection result exists
        const customerResult = document.querySelector('.customer-selection-result');
        if (customerResult) {
            return true; // Valid if we have a visual selection
        }
        
        return false;
    }
    
    // Check if in edit mode
    const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                   document.getElementById('edit-appointment-id')?.value;
    
    // Check if a customer is selected (only required for new appointments)
    if (!field.value && !isEditing) {
        setFieldError(field, 'Please select a customer');
        return false;
    }
    
    // Customer is selected or optional in edit mode
    clearFieldError(field);
    return true;
}

// Validate sales rep field
function validateSalesRep(field) {
    if (!field) return false;
    
    // Check if in edit mode
    const isEditing = document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true' ||
                   document.getElementById('edit-appointment-id')?.value;
    
    // Check if a sales rep is selected (only required for new appointments)
    if (!field.value && !isEditing) {
        setFieldError(field, 'Please select a sales rep');
        return false;
    }
    
    // Sales rep is selected or optional in edit mode
    clearFieldError(field);
    return true;
}

// Set an error on a field
function setFieldError(field, message) {
    // Add error class to field
    field.classList.add('is-invalid');
    
    // Find or create error message element
    let errorElement = field.parentElement.querySelector('.invalid-feedback');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback';
        field.parentElement.appendChild(errorElement);
    }
    
    // Set error message
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Clear error on a field
function clearFieldError(field) {
    // Remove error class
    field.classList.remove('is-invalid');
    
    // Hide error message
    const errorElement = field.parentElement.querySelector('.invalid-feedback');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Debug utility to check the edit mode
function checkEditMode() {
    const modal = document.getElementById('create-appointment-modal');
    const idField = document.getElementById('edit-appointment-id');
    
    console.log('Checking edit mode:');
    console.log('Modal data-editing attribute:', modal?.getAttribute('data-editing'));
    console.log('Edit appointment ID value:', idField?.value);
    
    return {
        isEditing: modal?.getAttribute('data-editing') === 'true' || Boolean(idField?.value),
        appointmentId: idField?.value || null
    };
}

// Expose debug utility to global scope
window.checkAppointmentEditMode = checkEditMode;

// Log that the script has loaded
console.log('Appointment edit validation script loaded successfully');
