/**
 * Modal Helper - Provides improved modal handling for MonuMe Tracker
 * This ensures modals open correctly even when other scripts might interfere
 */

// Create modal helper namespace immediately to ensure it's available early
window.modalHelper = {
    /**
     * Show a modal with enhanced reliability using multiple techniques
     * @param {string} modalId - The ID of the modal to show
     * @param {boolean} createBackdrop - Whether to create a backdrop if not present
     * @returns {boolean} Success status
     */
    showModal: function(modalId, createBackdrop = true) {
        console.log('Modal helper: showing modal', modalId);
        const modal = document.getElementById(modalId);
        
        if (!modal) {
            console.error('Modal helper: Modal not found with ID', modalId);
            return false;
        }
        
        // First, ensure any other modals are hidden
        this.hideAllModals(modalId);
        
        // Apply multiple display techniques
        try {
            // Direct style - simplest approach
            modal.style.display = 'block';
            
            // Important style - overrides any CSS rules with !important
            modal.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; z-index: 10000 !important;';
            
            // Remove hiding classes that might be added by frameworks
            modal.classList.remove('hide', 'hidden', 'd-none', 'collapse', 'invisible');
            modal.classList.add('show', 'in');
            
            // Apply ARIA attributes for accessibility
            modal.setAttribute('aria-hidden', 'false');
            modal.setAttribute('aria-modal', 'true');
            
            // Handle backdrop
            if (createBackdrop) {
                this.ensureBackdrop();
            }
            
            // Force a repaint to ensure changes take effect
            modal.offsetHeight;
            
            // Store the currently open modal ID
            window._currentOpenModal = modalId;
            
            console.log('Modal helper: Successfully displayed modal', modalId);
            return true;
        } catch (error) {
            console.error('Modal helper: Error displaying modal', error);
            
            // Emergency fallback
            try {
                modal.style.display = 'block';
                document.body.classList.add('modal-open');
            } catch (e) {
                console.error('Even fallback failed:', e);
            }
            
            return false;
        }
    },
    
    /**
     * Hide a modal cleanly
     * @param {string} modalId - The ID of the modal to hide
     * @returns {boolean} Success status
     */
    hideModal: function(modalId) {
        console.log('Modal helper: hiding modal', modalId);
        const modal = document.getElementById(modalId);
        
        if (!modal) {
            console.error('Modal helper: Modal not found with ID', modalId);
            return false;
        }
        
        try {
            // Set style to none - most direct approach
            modal.style.display = 'none';
            
            // Remove showing classes and add hiding classes
            modal.classList.remove('show', 'in');
            modal.classList.add('hide');
            
            // Update ARIA attributes
            modal.setAttribute('aria-hidden', 'true');
            modal.setAttribute('aria-modal', 'false');
            
            if (window._currentOpenModal === modalId) {
                window._currentOpenModal = null;
            }
            
            console.log('Modal helper: Successfully hid modal', modalId);
            return true;
        } catch (error) {
            console.error('Modal helper: Error hiding modal', error);
            return false;
        }
    },
    
    /**
     * Hide all modals except the one specified
     * @param {string} exceptModalId - ID of modal to exclude from hiding (optional)
     */
    hideAllModals: function(exceptModalId = null) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.id !== exceptModalId) {
                modal.style.display = 'none';
                modal.classList.remove('show', 'in');
                modal.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Only remove backdrops if we're not showing another modal
        if (!exceptModalId) {
            this.removeBackdrops();
        }
    },
    
    /**
     * Ensure a backdrop exists for modals
     */
    ensureBackdrop: function() {
        let backdrop = document.querySelector('.modal-backdrop');
        
        if (!backdrop) {
            console.log('Modal helper: Creating backdrop element');
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;';
            document.body.appendChild(backdrop);
        } else {
            backdrop.style.cssText = 'display: block !important; opacity: 0.5 !important;';
            backdrop.classList.add('show');
        }
        
        // Add a class to body to prevent scrolling
        document.body.classList.add('modal-open');
    },
    
    /**
     * Remove all modal backdrops
     */
    removeBackdrops: function() {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.remove();
        });
        
        // Remove body class when no modals are open
        if (!window._currentOpenModal) {
            document.body.classList.remove('modal-open');
        }
    },
    
    /**
     * Properly handle the edit button transition from details to edit modal
     * @param {string} detailsModalId - The ID of the details modal to close
     * @param {string} editModalId - The ID of the edit modal to open
     * @param {string} eventId - The ID of the event to edit
     */
    transitionToEdit: function(detailsModalId, editModalId, eventId) {
        console.log(`Modal helper: Transitioning from ${detailsModalId} to ${editModalId} for event ${eventId}`);
        
        // Store the event ID globally for access after modal transitions
        window._currentEventToEdit = eventId;
        
        // First hide the details modal
        this.hideModal(detailsModalId);
        
        // Add a delay before opening the edit modal
        setTimeout(() => {
            console.log('Opening edit modal after delay for event:', window._currentEventToEdit);
            this.showModal(editModalId);
            
            // Trigger event to load appointment data
            if (typeof enhancedEditAppointment === 'function') {
                enhancedEditAppointment(window._currentEventToEdit);
            }
        }, 200);
    }
};

// Initialize event listeners when the page loads
window.addEventListener('load', function() {
    console.log('Modal helper initialized - setting up global handlers');
    
    // Find all edit buttons in the entire document and improve their handling
    document.addEventListener('click', function(e) {
        // Look for edit buttons with both class and id approaches
        if (
            (e.target && e.target.id === 'edit-appointment') || 
            (e.target && e.target.classList.contains('edit-appointment-btn')) ||
            (e.target.closest && e.target.closest('#edit-appointment')) ||
            (e.target.closest && e.target.closest('.edit-appointment-btn'))
        ) {
            console.log('Global edit button handler from modal-helper.js activated');
            e.preventDefault();
            e.stopPropagation();
            
            // Get the relevant modal
            const detailsModal = document.getElementById('appointment-modal');
            if (!detailsModal) {
                console.error('Details modal not found');
                return;
            }
            
            // Extract the event ID
            const eventId = detailsModal.getAttribute('data-event-id');
            if (!eventId) {
                console.error('No event ID found in details modal');
                return;
            }
            
            // Use our transition function
            modalHelper.transitionToEdit('appointment-modal', 'create-appointment-modal', eventId);
        }
    }, true); // Use capture phase to get events before they're handled by other listeners
    
    console.log('Modal helper global event handlers initialized');
});
