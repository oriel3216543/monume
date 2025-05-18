/**
 * Enhanced Edit Button Handler
 * This script fixes the issue with the edit button not properly opening the edit form window
 */

// Function to be executed when the page is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced edit button handler script loaded');
    
    // Add event listener to document body that will handle edit button clicks
    attachEnhancedEditButtonHandler();
});

// Wait a bit longer to ensure all other scripts are loaded
window.addEventListener('load', function() {
    // Add some delay after load to ensure everything is ready
    setTimeout(function() {
        console.log('Checking for edit button handler after full page load');
        attachEnhancedEditButtonHandler();
    }, 1000);
});

/**
 * Attaches an enhanced click handler for edit buttons that works even with dynamically added content
 */
function attachEnhancedEditButtonHandler() {
    console.log('Attaching enhanced edit button handler');
    
    // Remove any previous handler first to prevent duplicates
    document.body.removeEventListener('click', handleEnhancedEditButtonClick);
    
    // Add the new handler with capturing phase to ensure it runs first
    document.body.addEventListener('click', handleEnhancedEditButtonClick, true);
    
    // Also attach directly to any existing edit button
    const editButton = document.getElementById('edit-appointment');
    if (editButton) {
        console.log('Found existing edit button, attaching direct handler');
        editButton.removeEventListener('click', handleDirectEditButtonClick);
        editButton.addEventListener('click', handleDirectEditButtonClick);
    } else {
        console.log('Edit button not found in DOM yet');
    }
}

/**
 * Direct handler for edit button clicks
 */
function handleDirectEditButtonClick(event) {
    console.log('Direct edit button click detected');
    event.preventDefault();
    event.stopPropagation();
    
    // Get the event ID from the appointment details modal
    const detailsModal = document.getElementById('appointment-details-modal');
    
    if (!detailsModal) {
        console.error('Appointment details modal not found');
        return;
    }
    
    const eventId = detailsModal.getAttribute('data-event-id');
    
    if (!eventId) {
        console.error('No event ID found in appointment details modal');
        return;
    }
    
    console.log('Handling edit for event:', eventId);
    
    // Hide the details modal
    if (typeof modalHelper !== 'undefined' && modalHelper.hideModal) {
        modalHelper.hideModal('appointment-details-modal');
    } else {
        detailsModal.style.display = 'none';
    }
    
    // Load and show the edit form
    if (typeof enhancedEditAppointment === 'function') {
        console.log('Calling enhanced edit appointment function');
        enhancedEditAppointment(eventId);
    } else {
        console.error('Enhanced edit appointment function not found');
        
        // Fallback to try opening the modal directly
        const editModal = document.getElementById('create-appointment-modal');
        if (editModal) {
            console.log('Trying fallback to show edit modal directly');
            editModal.style.display = 'block';
            
            // Set the appointment ID field if it exists
            const idField = document.getElementById('edit-appointment-id');
            if (idField) {
                idField.value = eventId;
            }
        }
    }
}

/**
 * Global handler for any edit button click anywhere in the document
 */
function handleEnhancedEditButtonClick(event) {
    // Check if the click was on an edit button or its children
    const target = event.target;
    
    // Check if the target or its parents are an edit button
    const isEditButton = isEditButtonElement(target);
    
    if (!isEditButton) {
        // Not an edit button, let normal event flow continue
        return;
    }
    
    console.log('Edit button click detected through global handler');
    
    // Find the closest appointment details modal
    const detailsModal = findParentByClass(target, 'modal') || document.getElementById('appointment-details-modal');
    
    if (!detailsModal) {
        console.error('Could not find appointment details modal');
        return;
    }
    
    // Get the event ID
    const eventId = detailsModal.getAttribute('data-event-id');
    
    if (!eventId) {
        console.error('No event ID found in appointment details modal');
        return;
    }
    
    // Prevent default action and stop propagation
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    console.log('Handling edit for event from global handler:', eventId);
    
    // Hide the details modal
    if (typeof modalHelper !== 'undefined' && modalHelper.hideModal) {
        modalHelper.hideModal(detailsModal.id);
    } else {
        detailsModal.style.display = 'none';
    }
    
    // Load and show the edit form after a brief delay
    setTimeout(function() {
        if (typeof enhancedEditAppointment === 'function') {
            console.log('Calling enhanced edit appointment function from global handler');
            enhancedEditAppointment(eventId);
        } else {
            console.error('Enhanced edit appointment function not found');
            
            // Fallback to try opening the modal directly
            const editModal = document.getElementById('create-appointment-modal');
            if (editModal) {
                console.log('Trying fallback to show edit modal directly from global handler');
                editModal.style.display = 'block';
                
                // Set the appointment ID field if it exists
                const idField = document.getElementById('edit-appointment-id');
                if (idField) {
                    idField.value = eventId;
                }
            }
        }
    }, 100);
}

/**
 * Helper function to check if an element is an edit button
 */
function isEditButtonElement(element) {
    if (!element || !element.tagName) return false;
    
    // Check if it has ID of edit-appointment
    if (element.id === 'edit-appointment') return true;
    
    // Check if it's a button with edit text
    if (element.tagName.toLowerCase() === 'button' && 
        (element.textContent.toLowerCase().includes('edit') || 
         element.innerHTML.toLowerCase().includes('fa-edit'))) {
        return true;
    }
    
    // Check if it's an icon inside an edit button
    if (element.tagName.toLowerCase() === 'i' && 
        (element.className.includes('fa-edit') || 
         element.className.includes('fa-pencil'))) {
        return true;
    }
    
    // If it's a span or other element, check its parent button
    if (element.parentElement) {
        return isEditButtonElement(element.parentElement);
    }
    
    return false;
}

/**
 * Helper function to find a parent element with a specific class
 */
function findParentByClass(element, className) {
    if (!element) return null;
    if (element.classList && element.classList.contains(className)) return element;
    return element.parentElement ? findParentByClass(element.parentElement, className) : null;
}

// Log to console that script is loaded
console.log('Enhanced edit button handler script loaded successfully');
