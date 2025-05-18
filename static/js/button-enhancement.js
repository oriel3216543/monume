/**
 * Button Enhancement Script
 * This script improves the appointment modal buttons functionality and tooltips
 */

// Execute immediately when loaded
(function() {
    console.log('Button enhancement script loading...');
    
    // Set up initialization on DOM ready and window load to ensure it runs
    document.addEventListener('DOMContentLoaded', enhanceButtons);
    window.addEventListener('load', function() {
        setTimeout(enhanceButtons, 500);
    });
    
    // Keep track of modals we've already processed
    const processedElements = new Set();
    
    /**
     * Enhance appointment modal buttons
     */
    function enhanceButtons() {
        console.log('Enhancing appointment modal buttons...');
        
        // Add tooltips and enhance close modal buttons
        enhanceCloseModalButtons();
        
        // Enhance delete appointment button
        enhanceDeleteButton();
        
        // Enhance edit button
        enhanceEditButton();
        
        // Add mutation observer to handle dynamically added elements
        setupButtonObserver();
    }
    
    /**
     * Enhance close modal buttons
     */
    function enhanceCloseModalButtons() {
        // Get all close modal buttons (X buttons)
        const closeButtons = document.querySelectorAll('.close-modal');
        
        closeButtons.forEach(function(button) {
            // Skip if already processed
            if (processedElements.has(button)) return;
            
            // Mark as processed
            processedElements.add(button);
            
            // Add tooltip
            button.setAttribute('title', 'Close this window');
            
            // Add hover styling
            button.style.cursor = 'pointer';
            
            // Add enhanced click handler
            button.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                
                console.log('Close modal button clicked');
                
                // Find the parent modal
                const modal = findParentModal(this);
                
                if (modal) {
                    console.log('Closing modal:', modal.id);
                    
                    // Method 1: Direct style change
                    modal.style.display = 'none';
                    
                    // Method 2: Use modalHelper if available
                    if (typeof modalHelper !== 'undefined' && modalHelper.hideModal) {
                        modalHelper.hideModal(modal.id);
                    }
                    
                    // Method 3: Bootstrap modal hide
                    if (typeof jQuery !== 'undefined' && jQuery(modal).modal) {
                        jQuery(modal).modal('hide');
                    }
                    
                    // Clean up backdrops
                    cleanupModalBackdrops();
                } else {
                    console.error('Could not find parent modal for close button');
                }
            });
        });
        
        // Also enhance the explicit close button
        const closeModalButton = document.getElementById('close-modal');
        if (closeModalButton && !processedElements.has(closeModalButton)) {
            processedElements.add(closeModalButton);
            closeModalButton.setAttribute('title', 'Close this window without making changes');
            
            // Make the button close the modal on click
            closeModalButton.addEventListener('click', function(event) {
                event.preventDefault();
                
                // Find the parent modal
                const modal = findParentModal(this);
                
                if (modal) {
                    console.log('Closing modal via close button:', modal.id);
                    
                    // Method 1: Direct style change
                    modal.style.display = 'none';
                    
                    // Method 2: Use modalHelper if available
                    if (typeof modalHelper !== 'undefined' && modalHelper.hideModal) {
                        modalHelper.hideModal(modal.id);
                    }
                    
                    // Clean up backdrops
                    cleanupModalBackdrops();
                }
            });
        }
        
        // Check for other close buttons
        const otherCloseButtons = document.querySelectorAll('#close-create-modal, #close-customer-modal');
        otherCloseButtons.forEach(function(button) {
            if (!processedElements.has(button)) {
                processedElements.add(button);
                button.setAttribute('title', 'Close this window');
                
                button.addEventListener('click', function(event) {
                    const modal = findParentModal(this);
                    if (modal) {
                        modal.style.display = 'none';
                        cleanupModalBackdrops();
                    }
                });
            }
        });
    }
    
    /**
     * Enhance the delete appointment button
     */
    function enhanceDeleteButton() {
        const deleteButton = document.getElementById('delete-appointment');
        
        if (deleteButton && !processedElements.has(deleteButton)) {
            processedElements.add(deleteButton);
            deleteButton.setAttribute('title', 'Delete this appointment permanently');
            
            // Style the delete button
            deleteButton.style.position = 'relative';
            
            // Create a confirmation tooltip
            const confirmTooltip = document.createElement('div');
            confirmTooltip.style.position = 'absolute';
            confirmTooltip.style.bottom = '40px';
            confirmTooltip.style.left = '50%';
            confirmTooltip.style.transform = 'translateX(-50%)';
            confirmTooltip.style.backgroundColor = '#ff4444';
            confirmTooltip.style.color = 'white';
            confirmTooltip.style.padding = '5px 10px';
            confirmTooltip.style.borderRadius = '5px';
            confirmTooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            confirmTooltip.style.display = 'none';
            confirmTooltip.style.zIndex = '9999';
            confirmTooltip.style.width = '200px';
            confirmTooltip.style.textAlign = 'center';
            confirmTooltip.innerHTML = 'This will permanently delete the appointment';
            
            // Add tooltip to button
            deleteButton.appendChild(confirmTooltip);
            
            // Show tooltip on hover
            deleteButton.addEventListener('mouseenter', function() {
                confirmTooltip.style.display = 'block';
            });
            
            // Hide tooltip when mouse leaves
            deleteButton.addEventListener('mouseleave', function() {
                confirmTooltip.style.display = 'none';
            });
            
            // Add dialog confirm before deleting
            deleteButton.addEventListener('click', function(event) {
                const eventId = this.dataset.appointmentId || 
                                document.getElementById('appointment-modal').getAttribute('data-event-id');
                
                if (!eventId) {
                    console.error('No appointment ID found for delete operation');
                    return;
                }
                
                // Use a more descriptive confirm dialog
                if (confirm('Are you sure you want to permanently delete this appointment? This action cannot be undone.')) {
                    console.log('Confirmed deletion of appointment:', eventId);
                    // The original handler will continue with deletion
                } else {
                    // Prevent the default delete handler if the user cancels
                    event.stopPropagation();
                    event.preventDefault();
                }
            }, true);
        }
    }
    
    /**
     * Enhance the edit appointment button
     */
    function enhanceEditButton() {
        const editButton = document.getElementById('edit-appointment');
        
        if (editButton && !processedElements.has(editButton)) {
            processedElements.add(editButton);
            editButton.setAttribute('title', 'Edit this appointment details');
            
            // Add click handler with better transition between modals
            editButton.addEventListener('click', function(event) {
                // Log that our enhanced handler is running
                console.log('Enhanced edit button handler running');
                
                const modal = findParentModal(this);
                const eventId = this.dataset.appointmentId || 
                               (modal ? modal.getAttribute('data-event-id') : null);
                
                if (!eventId) {
                    console.error('No appointment ID found for edit operation');
                    return;
                }
                
                // Store the ID we need to edit
                window._currentEventToEdit = eventId;
                
                // Close details modal first
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Clean up any modal backdrops
                cleanupModalBackdrops();
                
                // Add a small delay before opening the edit modal
                setTimeout(function() {
                    // Try multiple methods of opening the edit form
                    
                    // Method 1: Use modalHelper if available
                    if (window.modalHelper && window.modalHelper.transitionToEdit) {
                        window.modalHelper.transitionToEdit('appointment-modal', 'create-appointment-modal', eventId);
                    } 
                    // Method 2: Use enhanced edit function if available
                    else if (typeof enhancedEditAppointment === 'function') {
                        enhancedEditAppointment(eventId);
                    }
                    // Method 3: Use standard edit function if available
                    else if (typeof editAppointment === 'function') {
                        editAppointment(eventId);
                    }
                    // Method 4: Fall back to just showing the modal
                    else {
                        document.getElementById('create-appointment-modal').style.display = 'block';
                    }
                }, 100);
            }, true); // Use capture phase to ensure this runs first
        }
    }
    
    /**
     * Set up observer for dynamically added buttons
     */
    function setupButtonObserver() {
        try {
            // Create an observer to watch for DOM changes
            const observer = new MutationObserver(function(mutations) {
                let shouldProcessButtons = false;
                
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes && mutation.addedNodes.length) {
                        // Check if we have added nodes that might contain our buttons
                        Array.from(mutation.addedNodes).forEach(function(node) {
                            if (node.nodeType === 1) { // Element node
                                if (node.classList && (
                                    node.classList.contains('modal') || 
                                    node.classList.contains('modal-content') ||
                                    node.querySelector('.close-modal') ||
                                    node.querySelector('#delete-appointment') ||
                                    node.querySelector('#edit-appointment') ||
                                    node.querySelector('#close-modal')
                                )) {
                                    shouldProcessButtons = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldProcessButtons) {
                    console.log('Modal content changed - reprocessing buttons');
                    setTimeout(function() {
                        enhanceCloseModalButtons();
                        enhanceDeleteButton();
                        enhanceEditButton();
                    }, 100);
                }
            });
            
            // Start observing the document
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            console.log('Button observer set up');
        } catch (error) {
            console.error('Error setting up button observer:', error);
        }
    }
    
    /**
     * Helper function to find parent modal element
     */
    function findParentModal(element) {
        let current = element;
        
        // Search up the DOM tree
        while (current && current !== document.body) {
            // Check if this is a modal
            if (current.classList && current.classList.contains('modal')) {
                return current;
            }
            
            // Move up to parent
            current = current.parentNode;
        }
        
        // If we didn't find it by class, try finding by ID
        const modalId = element.getAttribute('data-target') || 
                      element.getAttribute('data-modal');
                      
        if (modalId) {
            return document.getElementById(modalId.replace('#', ''));
        }
        
        // Check if we're in the appointment modal
        const appointmentModal = document.getElementById('appointment-modal');
        if (appointmentModal && appointmentModal.contains(element)) {
            return appointmentModal;
        }
        
        // Common modal IDs to check
        const commonModalIds = ['appointment-modal', 'create-appointment-modal', 'add-customer-modal'];
        for (const id of commonModalIds) {
            const modal = document.getElementById(id);
            if (modal && modal.contains(element)) {
                return modal;
            }
        }
        
        return null;
    }
    
    /**
     * Clean up modal backdrops and other modal artifacts
     */
    function cleanupModalBackdrops() {
        // Use setTimeout to ensure it runs after modal closing
        setTimeout(function() {
            // Remove modal-open class and inline styles
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
    }
    
    /**
     * Initialize function - run immediately and schedule for later as well
     */
    enhanceButtons();
    setTimeout(enhanceButtons, 1000); // Run again after a delay to catch late-loaded elements
    
    console.log('Button enhancement script loaded');
})();
