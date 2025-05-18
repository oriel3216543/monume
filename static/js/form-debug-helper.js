/**
 * Form Debug Helper
 * This script helps debug form validation issues for the MonuMe Customer Modal
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Form Debug] Initializing form debug helper');
    
    // Wait for the DOM to be fully loaded
    setTimeout(function() {
        // Add debug button to the add-customer-modal
        const customerModalFooter = document.querySelector('#add-customer-modal .modal-footer');
        
        if (customerModalFooter) {
            const debugButton = document.createElement('button');
            debugButton.type = 'button';
            debugButton.className = 'btn btn-sm';
            debugButton.style.backgroundColor = '#6c757d';
            debugButton.style.color = 'white';
            debugButton.style.marginRight = 'auto'; // Push to the left
            debugButton.innerHTML = '<i class="fas fa-bug"></i> Debug';
            
            debugButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                debugCustomerForm();
            });
            
            // Insert at the beginning of the footer
            customerModalFooter.prepend(debugButton);
            console.log('[Form Debug] Debug button added to customer modal');
        }
    }, 500);
    
    // Add a global debug function that can be called from console
    window.debugCustomerForm = function() {
        console.log('[Form Debug] Running customer form debug check...');
        
        // Get all the form fields
        const fields = {
            firstName: document.getElementById('new-customer-first-name'),
            lastName: document.getElementById('new-customer-last-name'),
            phone: document.getElementById('new-customer-phone'),
            email: document.getElementById('new-customer-email'),
            gender: document.getElementById('new-customer-gender'),
            notes: document.getElementById('new-customer-notes')
        };
        
        // Check each field
        for (const [name, field] of Object.entries(fields)) {
            if (!field) {
                console.error(`[Form Debug] Field '${name}' element not found in DOM!`);
                continue;
            }
            
            const value = field.value.trim();
            console.log(`[Form Debug] Field '${name}': ${value ? `"${value}"` : '(empty)'}`);
            
            // Check if field is required
            if (field.hasAttribute('required')) {
                console.log(`[Form Debug] Field '${name}' is required`);
                if (!value) {
                    console.warn(`[Form Debug] Required field '${name}' is empty!`);
                }
            }
        }
        
        // Check gender select specifically (it's a common issue)
        const genderField = fields.gender;
        if (genderField) {
            console.log(`[Form Debug] Gender selected index: ${genderField.selectedIndex}`);
            console.log(`[Form Debug] Gender selected value: "${genderField.value}"`);
            
            // Check all options
            Array.from(genderField.options).forEach((option, index) => {
                console.log(`[Form Debug] Gender option ${index}: value="${option.value}", text="${option.text}", selected=${option.selected}`);
            });
        }
        
        // Check event handler conflicts
        const saveButton = document.getElementById('save-new-customer');
        if (saveButton) {
            console.log('[Form Debug] Save button found');
            
            // Log clone/replace operations that might interfere
            const originalClone = Element.prototype.cloneNode;
            Element.prototype.cloneNode = function(deep) {
                const result = originalClone.call(this, deep);
                if (this.id === 'save-new-customer') {
                    console.warn('[Form Debug] save-new-customer is being cloned! Stack trace:', new Error().stack);
                }
                return result;
            };
        }
        
        console.log('[Form Debug] Debug check complete. Check console for details.');
        alert('Form debug check complete. Check browser console for details.');
    };
});
