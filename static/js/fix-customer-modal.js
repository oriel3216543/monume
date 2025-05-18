/**
 * Fix Customer Modal Buttons
 * This script resolves issues with the "Add Customer" button functionality in the MonuMe Tracker
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Customer Modal Fix] Initializing customer modal button fix script');
    
    // Fix the gender dropdown to ensure proper option selection
    const fixGenderDropdown = () => {
        const genderDropdown = document.getElementById('new-customer-gender');
        if (genderDropdown) {
            // Make sure the first option is blank or has a placeholder
            if (genderDropdown.options[0].value !== "") {
                const placeholderOption = document.createElement('option');
                placeholderOption.value = "";
                placeholderOption.text = "Select gender";
                placeholderOption.selected = true;
                genderDropdown.insertBefore(placeholderOption, genderDropdown.firstChild);
            }
            
            // Add change event to log selection
            genderDropdown.addEventListener('change', function() {
                console.log('[Customer Modal Fix] Gender selected:', 
                    this.options[this.selectedIndex].text,
                    'value:', this.value);
            });
            
            console.log('[Customer Modal Fix] Gender dropdown fixed');
        }
    };
    
    // Wait for a short delay to ensure the DOM is fully loaded
    setTimeout(function() {
        fixGenderDropdown();
        fixCustomerModalButtons();
    }, 300);
    
    function fixCustomerModalButtons() {
        console.log('[Customer Modal Fix] Applying fixes to customer modal buttons...');
        
        // Fix all customer modal buttons to ensure they work properly
        const buttonIds = ['save-new-customer', 'cancel-add-customer', 'close-customer-modal'];
        
        buttonIds.forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                console.log(`[Customer Modal Fix] Fixing button: ${id}`);
                
                // Clone and replace to remove all listeners
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // For the save button specifically
                if (id === 'save-new-customer') {
                    newButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Customer Modal Fix] Save customer button clicked');
                        
                        // Flag to prevent duplicate save operations
                        if (window.saveCustomerInProgress) {
                            console.log('Save operation already in progress');
                            return;
                        }
                        
                        // Visual feedback
                        window.saveCustomerInProgress = true;
                        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                        this.disabled = true;
                        
                        // Process customer form data
                        setTimeout(() => {
                            try {
                                // Get form field values with null checks
                                const firstNameEl = document.getElementById('new-customer-first-name');
                                const lastNameEl = document.getElementById('new-customer-last-name');
                                const phoneEl = document.getElementById('new-customer-phone');
                                const emailEl = document.getElementById('new-customer-email');
                                const genderElement = document.getElementById('new-customer-gender');
                                const notesEl = document.getElementById('new-customer-notes');
                                const firstName = firstNameEl ? firstNameEl.value.trim() : '';
                                const lastName = lastNameEl ? lastNameEl.value.trim() : '';
                                const phone = phoneEl ? phoneEl.value.trim() : '';
                                const email = emailEl ? emailEl.value.trim() : '';
                                let gender = '';
                                if (genderElement) {
                                    if (genderElement.selectedIndex > 0) {
                                        gender = genderElement.options[genderElement.selectedIndex].value;
                                    } else {
                                        gender = genderElement.value.trim();
                                    }
                                    console.log('[Customer Modal Fix] Gender selected:', {index: genderElement.selectedIndex, value: gender});
                                }
                                const notes = notesEl ? notesEl.value.trim() : '';
                                
                                // Enhanced validation with better debugging
                                console.log('[Customer Modal Fix] Validating fields:', 
                                    {firstName, lastName, phone, gender});
                                
                                // Check each required field individually for better error messages
                                let missingFields = [];
                                
                                if (!firstName) missingFields.push('First Name');
                                if (!lastName) missingFields.push('Last Name');
                                if (!phone) missingFields.push('Phone Number');
                                if (!gender) missingFields.push('Gender');
                                
                                if (missingFields.length > 0) {
                                    const missingFieldsStr = missingFields.join(', ');
                                    alert(`Please fill in the following required fields: ${missingFieldsStr}`);
                                    console.warn('[Customer Modal Fix] Missing fields:', missingFields);
                                    this.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                                    this.disabled = false;
                                    window.saveCustomerInProgress = false;
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
                                const form = document.getElementById('add-customer-form');
                                if (form) form.reset();
                                const modal = document.getElementById('add-customer-modal');
                                if (modal) modal.style.display = 'none';
                                
                                // Update UI if functions exist
                                if (typeof searchCustomers === 'function') searchCustomers();
                                if (typeof updateStatsCounters === 'function') updateStatsCounters();
                                if (typeof loadCustomers === 'function') loadCustomers();
                                
                                alert(`Customer ${firstName} ${lastName} has been added successfully!`);
                                
                                // After successfully saving the customer
                                // If the appointment/event form is open, show the selected customer
                                const appointmentModal = document.getElementById('create-appointment-modal');
                                if (appointmentModal && appointmentModal.style.display === 'block') {
                                    // Set hidden input for selected customer ID
                                    let selectedCustomerIdInput = document.getElementById('selected-customer-id');
                                    if (!selectedCustomerIdInput) {
                                        selectedCustomerIdInput = document.createElement('input');
                                        selectedCustomerIdInput.type = 'hidden';
                                        selectedCustomerIdInput.id = 'selected-customer-id';
                                        const appointmentForm = document.getElementById('appointment-form');
                                        if (appointmentForm) appointmentForm.appendChild(selectedCustomerIdInput);
                                    }
                                    selectedCustomerIdInput.value = newCustomer.id;
                                    // Show a visible summary of the selected customer
                                    const addCustomerBtn = document.getElementById('add-customer-for-appointment');
                                    // Remove any existing summary first
                                    const existingSummary = document.querySelector('.customer-selection-result');
                                    if (existingSummary) existingSummary.remove();
                                    const customerSummary = document.createElement('div');
                                    customerSummary.className = 'customer-selection-result';
                                    customerSummary.innerHTML = `
                                        <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
                                            <strong>${firstName} ${lastName}</strong><br>
                                            <small>${phone}${email ? ' | ' + email : ''}${gender ? ' | ' + gender : ''}</small>
                                        </div>
                                    `;
                                    if (addCustomerBtn) {
                                        addCustomerBtn.insertAdjacentElement('afterend', customerSummary);
                                    }
                                }
                            } catch (err) {
                                console.error('Error saving customer:', err);
                                alert('An error occurred while saving the customer. Please try again.');
                            }
                            
                            // Reset button state
                            this.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                            this.disabled = false;
                            window.saveCustomerInProgress = false;
                        }, 100);
                    });
                    
                    console.log('[Customer Modal Fix] Save button handler attached');
                }
                
                // For cancel and close buttons
                if (id === 'cancel-add-customer' || id === 'close-customer-modal') {
                    newButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`[Customer Modal Fix] ${id} button clicked`);
                        
                        // Check for unsaved changes
                        const hasChanges = () => {
                            const fields = ['new-customer-first-name', 'new-customer-last-name', 
                                          'new-customer-phone', 'new-customer-email', 
                                          'new-customer-gender', 'new-customer-notes'];
                            return fields.some(id => {
                                const el = document.getElementById(id);
                                return el && el.value.trim();
                            });
                        };
                        
                        if (hasChanges()) {
                            if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                                return;
                            }
                        }
                        
                        // Reset and close
                        document.getElementById('add-customer-form').reset();
                        document.getElementById('add-customer-modal').style.display = 'none';
                        
                        // Make sure the save button is reset
                        const saveBtn = document.getElementById('save-new-customer');
                        if (saveBtn) {
                            saveBtn.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                            saveBtn.disabled = false;
                        }
                        
                        // Reset the flag
                        window.saveCustomerInProgress = false;
                    });
                    
                    console.log(`[Customer Modal Fix] ${id} button handler attached`);
                }
            } else {
                console.warn(`[Customer Modal Fix] Button with id ${id} not found in DOM`);
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
            
            // Fix the "Add Customer" button in the appointment form
            const addCustomerBtn = document.getElementById('add-customer-for-appointment');
            if (addCustomerBtn) {
                // Clone to remove existing handlers
                const newAddCustomerBtn = addCustomerBtn.cloneNode(true);
                addCustomerBtn.parentNode.replaceChild(newAddCustomerBtn, addCustomerBtn);                    newAddCustomerBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('[Customer Modal Fix] Add Customer button clicked');
                        
                        // Show the modal with correct z-index
                        customerModal.style.display = 'block';
                        customerModal.style.zIndex = '2000';
                        
                        // Properly reset form with special handling for gender
                        const form = document.getElementById('add-customer-form');
                        form.reset();
                        
                        // Make sure gender dropdown is properly reset to placeholder
                        const genderDropdown = document.getElementById('new-customer-gender');
                        if (genderDropdown) {
                            genderDropdown.selectedIndex = 0;
                        }
                        
                        // Reset save button
                        const saveBtn = document.getElementById('save-new-customer');
                        if (saveBtn) {
                            saveBtn.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                            saveBtn.disabled = false;
                        }
                        
                        // Reset the flag
                        window.saveCustomerInProgress = false;
                });
                
                console.log('[Customer Modal Fix] Add Customer button handler reattached');
            }
        }
        
        console.log('[Customer Modal Fix] Button fixes applied successfully');
    }
});
