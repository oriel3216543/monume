/**
 * Modal Conflict Detector
 * This script helps identify and prevent conflicts between event handlers in different JS files
 * for the MonuMe Tracker system
 * 
 * Enhanced to specifically monitor and fix issues with the Customer Modal buttons
 */

// Track registered event handlers
const eventHandlerTracker = {
    handlers: new Map(),
    buttonFixesApplied: false,
    
    registerHandler: function(elementId, eventType, handlerSource) {
        if (!this.handlers.has(elementId)) {
            this.handlers.set(elementId, new Map());
        }
        
        const elementHandlers = this.handlers.get(elementId);
        if (!elementHandlers.has(eventType)) {
            elementHandlers.set(eventType, []);
        }
        
        const eventHandlers = elementHandlers.get(eventType);
        if (!eventHandlers.includes(handlerSource)) {
            eventHandlers.push(handlerSource);
            console.log(`[Handler Tracker] Registered handler for ${elementId} (${eventType}) from ${handlerSource}`);
        }
        
        // Check for conflicts
        if (eventHandlers.length > 1) {
            console.warn(`[Handler Tracker] Potential conflict detected for ${elementId} (${eventType}):`);
            eventHandlers.forEach(source => console.warn(`  - Handler registered by ${source}`));
            
            // Fix specific conflicts with customer modal buttons
            if (elementId === 'save-new-customer' && !this.buttonFixesApplied) {
                this.fixCustomerModalButtons();
            }
        }
    },
      fixCustomerModalButtons: function() {
        console.log('[Handler Tracker] Applying fixes to customer modal buttons...');
        
        // Wait for DOM to be fully loaded
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => this.fixCustomerModalButtons());
            return;
        }
        
        // Fix all customer modal buttons to ensure they work properly
        const buttonIds = ['save-new-customer', 'cancel-add-customer', 'close-customer-modal'];
        
        buttonIds.forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                console.log(`[Handler Tracker] Fixing button: ${id}`);
                
                // Clone and replace to remove all listeners
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // For the save button specifically
                if (id === 'save-new-customer') {
                    newButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Handler Tracker] Save customer button clicked');
                        
                        // Visual feedback
                        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                        this.disabled = true;
                        
                        // Process customer form data
                        setTimeout(() => {
                            try {
                                const firstName = document.getElementById('new-customer-first-name').value.trim();
                                const lastName = document.getElementById('new-customer-last-name').value.trim();
                                const phone = document.getElementById('new-customer-phone').value.trim();
                                const email = document.getElementById('new-customer-email').value.trim();
                                const gender = document.getElementById('new-customer-gender').value.trim();
                                const notes = document.getElementById('new-customer-notes').value.trim();
                                
                                if (!firstName || !lastName || !phone || !gender) {
                                    alert('Please fill in all required fields (First Name, Last Name, Phone Number, and Gender)');
                                    this.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                                    this.disabled = false;
                                    return;
                                }
                                
                                // Save to localStorage
                                let customers = [];
                                try {
                                    const storedCustomers = localStorage.getItem('customers');
                                    customers = storedCustomers ? JSON.parse(storedCustomers) : [];
                                } catch (e) {
                                    console.error('Error parsing customers:', e);
                                    customers = [];
                                }
                                
                                const newCustomer = {
                                    id: Date.now().toString(),
                                    firstName, lastName, phone, email, gender, notes
                                };
                                
                                customers.push(newCustomer);
                                localStorage.setItem('customers', JSON.stringify(customers));
                                
                                // Close modal and reset form
                                document.getElementById('add-customer-form').reset();
                                document.getElementById('add-customer-modal').style.display = 'none';
                                
                                // Update UI if functions exist
                                if (typeof searchCustomers === 'function') searchCustomers();
                                if (typeof updateStatsCounters === 'function') updateStatsCounters();
                                if (typeof loadCustomers === 'function') loadCustomers();
                                
                                alert(`Customer ${firstName} ${lastName} has been added successfully!`);
                            } catch (err) {
                                console.error('Error saving customer:', err);
                                alert('An error occurred while saving the customer. Please try again.');
                            }
                            
                            // Reset button state
                            this.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                            this.disabled = false;
                        }, 100);
                    });
                    
                    console.log('[Handler Tracker] Save button handler attached');
                }
                
                // For cancel and close buttons
                if (id === 'cancel-add-customer' || id === 'close-customer-modal') {
                    newButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`[Handler Tracker] ${id} button clicked`);
                        
                        // Check for unsaved changes
                        const hasChanges = () => {
                            const fields = ['new-customer-first-name', 'new-customer-last-name', 
                                          'new-customer-phone', 'new-customer-email', 
                                          'new-customer-gender', 'new-customer-notes'];
                            return fields.some(id => document.getElementById(id)?.value.trim());
                        };
                        
                        if (hasChanges()) {
                            if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                                return;
                            }
                        }
                        
                        // Reset and close
                        document.getElementById('add-customer-form').reset();
                        document.getElementById('add-customer-modal').style.display = 'none';
                    });
                    
                    console.log(`[Handler Tracker] ${id} button handler attached`);
                }
            } else {
                console.warn(`[Handler Tracker] Button with id ${id} not found in DOM`);
            }
        });
        
        // Fix modal display issues
        const customerModal = document.getElementById('add-customer-modal');
        if (customerModal) {
            // Ensure modal has proper z-index
            customerModal.style.zIndex = '2000';
            
            // Make sure modal content is properly styled
            const modalContent = customerModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.position = 'relative';
                modalContent.style.zIndex = '2001';
            }
        }
          // Mark fixes as applied
        this.buttonFixesApplied = true;
        console.log('[Handler Tracker] Customer modal button fixes applied successfully');
    }
};

// Initialize the tracker after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Handler Tracker] Initializing event handler tracker');
    
    // Register key elements to monitor for conflicts
    const keysToMonitor = [
        'save-new-customer',
        'cancel-add-customer',
        'close-customer-modal',
        'add-customer-for-appointment'
    ];
    
    // Wait for a short delay to ensure all handlers are registered
    setTimeout(function() {
        keysToMonitor.forEach(id => {
            eventHandlerTracker.registerHandler(id, 'click', 'conflict-detector');
        });
        
        // Check if customer modal is properly configured
        const customerModal = document.getElementById('add-customer-modal');
        if (customerModal) {
            console.log('[Handler Tracker] Customer modal found, checking configuration');
        } else {
            console.warn('[Handler Tracker] Customer modal not found in DOM');
        }
    }, 500);
});

// Monitor specific elements that might have conflicting handlers
document.addEventListener('DOMContentLoaded', function() {
    // Key elements to monitor
    const elementsToMonitor = [
        { id: 'add-customer-modal', events: ['click'] },
        { id: 'close-customer-modal', events: ['click'] },
        { id: 'cancel-add-customer', events: ['click'] },
        { id: 'save-new-customer', events: ['click'] },
        { id: 'add-customer-for-appointment', events: ['click'] }
    ];
    
    // Check for these elements
    elementsToMonitor.forEach(element => {
        const el = document.getElementById(element.id);
        if (el) {
            console.log(`[Handler Tracker] Monitoring ${element.id} for potential handler conflicts`);
            // Add observer to detect when new event handlers are added
            const originalAddEventListener = el.addEventListener;
            el.addEventListener = function(type, listener, options) {
                // Get the script that's adding the handler
                const error = new Error();
                const stack = error.stack || '';
                let source = 'unknown';
                
                if (stack.includes('events.js')) {
                    source = 'events.js';
                } else if (stack.includes('script.js')) {
                    source = 'script.js';
                } else if (stack.includes('events.html')) {
                    source = 'events.html inline script';
                }
                
                eventHandlerTracker.registerHandler(element.id, type, source);
                return originalAddEventListener.call(this, type, listener, options);
            };
        }
    });
    
    console.log('[Handler Tracker] Initialization complete');
});
