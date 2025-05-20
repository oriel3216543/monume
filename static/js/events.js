/**
 * MonuMe Appointment Management System
 * Handles appointment scheduling and customer management
 */

// Customer and Appointment data storage
let customers = [];
let appointments = [];
let selectedCustomerForAppointment = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Debug the available users in localStorage
    try {
        console.log("DEBUG - Available users in localStorage:");
        const usersKeys = ['users', 'monumeUsers', 'usersArray'];
        usersKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`${key}: ${parsed.length} users found`);
                    console.log(parsed);
                } catch (err) {
                    console.log(`${key}: Invalid JSON`);
                }
            } else {
                console.log(`${key}: Not found`);
            }
        });
    } catch (err) {
        console.error("Error checking localStorage:", err);
    }
    
    // Initialize data
    loadCustomers();
    loadAppointments();
    
    // Add debugging for sales rep loading
    console.log('Loading sales representatives...');
    loadSalesReps();
    console.log('Done loading sales representatives.');
    
    // Check if the dropdown was populated
    setTimeout(() => {
        const salesRepSelect = document.getElementById('appointment-sales-rep');
        if (salesRepSelect) {
            console.log(`Sales rep dropdown has ${salesRepSelect.options.length} options`);
            if (salesRepSelect.options.length <= 1) { // Only the placeholder option
                console.warn('Sales rep dropdown may not have been populated correctly!');
                console.log('Attempting to reload sales reps...');
                loadSalesReps();
            }
        }
    }, 500);
    
    updateStatistics();
    
    // Modal event listeners
    setupModalEvents();
    
    // Customer management events
    setupCustomerEvents();
    
    // Appointment form events
    setupAppointmentEvents();
    
    console.log('Events.js loaded');
    
    // Initialize the appointment type dropdown
    const appointmentTypeDropdown = document.getElementById('appointment-type');
    if (appointmentTypeDropdown) {
        appointmentTypeDropdown.addEventListener('change', function() {
            const selectedValue = this.value;
            console.log('Event type changed to:', selectedValue);
            
            // Update form fields based on selection
            toggleEventFormFields(selectedValue);
        });
    }
    
    // Initialize all-day checkbox
    const allDayCheckbox = document.getElementById('all-day-event');
    if (allDayCheckbox) {
        allDayCheckbox.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('appointment-time').value = '00:00';
                document.getElementById('appointment-duration').value = 1440; // 24 hours
                document.getElementById('appointment-time').disabled = true;
                document.getElementById('appointment-duration').disabled = true;
            } else {
                document.getElementById('appointment-time').disabled = false;
                document.getElementById('appointment-duration').disabled = false;
                document.getElementById('appointment-time').value = '';
                document.getElementById('appointment-duration').value = 30;
            }
        });
    }
    // Add event listener to Add Customer button
    const addCustomerBtn = document.getElementById('add-customer-for-appointment');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Show phone search modal
            document.getElementById('phone-search-modal').style.display = 'block';
            document.getElementById('phone-search-input').value = '';
            document.getElementById('phone-search-results').innerHTML = '';
        });
    }
    // Ensure the Find or Add Customer button exists and opens the phone search modal
    function ensureFindOrAddCustomerButton() {
        var container = document.querySelector('.customer-selection-container');
        if (!container) return;
        var btn = document.getElementById('add-customer-for-appointment');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'customer-add-btn-enhanced';
            btn.id = 'add-customer-for-appointment';
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Find or Add Customer';
            container.appendChild(btn);
        }
        btn.onclick = function(e) {
            e.preventDefault();
            var modal = document.getElementById('phone-search-modal');
            if (modal) {
                modal.style.display = 'block';
                document.getElementById('phone-search-input').value = '';
                document.getElementById('phone-search-results').innerHTML = '';
            } else {
                alert('Phone search modal not found in the HTML.');
            }
        };
    }
    ensureFindOrAddCustomerButton();
    // Also re-ensure after opening the appointment modal
    var apptModal = document.getElementById('create-appointment-modal');
    if (apptModal) {
        apptModal.addEventListener('show', ensureFindOrAddCustomerButton);
    }
    // Phone search modal close
    var closeBtn = document.getElementById('close-phone-search-modal');
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById('phone-search-modal').style.display = 'none';
        };
    }
    // Phone search logic
    document.getElementById('phone-search-btn').onclick = function() {
        const phone = document.getElementById('phone-search-input').value.trim();
        const resultsDiv = document.getElementById('phone-search-results');
        resultsDiv.innerHTML = '';
        if (!phone) {
            resultsDiv.innerHTML = '<div style="color:red;">Please enter a phone number.</div>';
            return;
        }
        // Search customers
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const matches = customers.filter(c => c.phone && c.phone.replace(/\D/g,'').includes(phone.replace(/\D/g,'')));
        if (matches.length > 0) {
            resultsDiv.innerHTML = '<div>Matches found:</div>' + matches.map(c =>
                `<div style='border:1px solid #ccc; border-radius:8px; margin:8px 0; padding:8px;'>
                    <b>${c.firstName} ${c.lastName}</b><br>
                    <span><i class='fas fa-phone'></i> ${c.phone}</span><br>
                    ${c.email ? `<span><i class='fas fa-envelope'></i> ${c.email}</span><br>` : ''}
                    <button class='btn btn-primary btn-sm select-customer-for-appt' data-id='${c.id}'>Select</button>
                </div>`
            ).join('');
        } else {
            resultsDiv.innerHTML = `<div style='color:green;'>No match found. <button class='btn btn-primary' id='proceed-add-customer'>Add as New Customer</button></div>`;
            // Save phone for prefill
            document.getElementById('proceed-add-customer').onclick = function() {
                document.getElementById('phone-search-modal').style.display = 'none';
                // Open add customer modal and prefill phone
                const addModal = document.getElementById('add-customer-modal');
                if (addModal) {
                    addModal.style.display = 'block';
                    const phoneInput = document.getElementById('new-customer-phone');
                    if (phoneInput) phoneInput.value = phone;
                }
            };
        }
        // Attach select handlers
        setTimeout(() => {
            document.querySelectorAll('.select-customer-for-appt').forEach(btn => {
                btn.onclick = function() {
                    const id = this.getAttribute('data-id');
                    // Set selected customer for appointment
                    let selectedInput = document.getElementById('selected-customer-id');
                    if (!selectedInput) {
                        selectedInput = document.createElement('input');
                        selectedInput.type = 'hidden';
                        selectedInput.id = 'selected-customer-id';
                        document.getElementById('appointment-form').appendChild(selectedInput);
                    }
                    selectedInput.value = id;
                    // Show selected customer visually (optional)
                    // Close modal
                    document.getElementById('phone-search-modal').style.display = 'none';
                    // Optionally show customer info in the form
                };
            });
        }, 100);
    };
    
    // Host verification modal logic
    var hostVerificationModal = document.getElementById('host-verification-modal');
    var closeHostVerificationBtn = document.getElementById('close-host-verification-modal');
    var verifyHostPasswordBtn = document.getElementById('verify-host-password-btn');
    var hostPasswordInput = document.getElementById('host-password-input');
    var hostVerificationError = document.getElementById('host-verification-error');
    var saveAppointmentBtn = document.getElementById('save-appointment');
    var appointmentSalesRep = document.getElementById('appointment-sales-rep');
    var verifiedHostId = null;

    // Show modal when host is selected
    if (appointmentSalesRep) {
        appointmentSalesRep.addEventListener('change', function() {
            if (this.value) {
                // Reset modal state
                hostPasswordInput.value = '';
                hostVerificationError.style.display = 'none';
                hostVerificationModal.style.display = 'block';
                verifiedHostId = null;
                // Prevent saving until verified
                saveAppointmentBtn.disabled = true;
            }
        });
    }

    // Close modal
    if (closeHostVerificationBtn) {
        closeHostVerificationBtn.onclick = function() {
            hostVerificationModal.style.display = 'none';
            appointmentSalesRep.value = '';
            saveAppointmentBtn.disabled = false;
        };
    }

    // Password verification logic (mock: password = 'password123' for all hosts)
    if (verifyHostPasswordBtn) {
        verifyHostPasswordBtn.onclick = function() {
            var entered = hostPasswordInput.value;
            var selectedHostId = appointmentSalesRep.value;
            // Replace this with real backend check if available
            var users = JSON.parse(localStorage.getItem('users') || '[]');
            var user = users.find(u => u.id == selectedHostId);
            var correctPassword = user ? (user.password || 'password123') : 'password123';
            if (entered === correctPassword) {
                hostVerificationModal.style.display = 'none';
                hostVerificationError.style.display = 'none';
                verifiedHostId = selectedHostId;
                saveAppointmentBtn.disabled = false;
            } else {
                hostVerificationError.textContent = 'Incorrect password. Please try again.';
                hostVerificationError.style.display = 'block';
                saveAppointmentBtn.disabled = true;
            }
        };
    }

    // Prevent saving if not verified (fix: only block if a host is selected and not verified)
    if (saveAppointmentBtn) {
        saveAppointmentBtn.addEventListener('click', function(e) {
            var selectedHostId = appointmentSalesRep.value;
            // If a host is selected and not verified, show modal and block save
            if (selectedHostId && selectedHostId !== verifiedHostId) {
                e.preventDefault();
                hostPasswordInput.value = '';
                hostVerificationError.textContent = '';
                hostVerificationError.style.display = 'none';
                hostVerificationModal.style.display = 'block';
                saveAppointmentBtn.disabled = false;
                return false;
            }
            // Allow save if no host is selected or already verified
        });
    }

    // When host is changed, reset verification
    if (appointmentSalesRep) {
        appointmentSalesRep.addEventListener('change', function() {
            verifiedHostId = null;
        });
    }
});

/**
 * Check if customer form has unsaved changes
 */
function hasUnsavedCustomerChanges() {
    const firstName = document.getElementById('new-customer-first-name').value.trim();
    const lastName = document.getElementById('new-customer-last-name').value.trim();
    const phone = document.getElementById('new-customer-phone').value.trim();
    const email = document.getElementById('new-customer-email').value.trim();
    const gender = document.getElementById('new-customer-gender').value.trim();
    const notes = document.getElementById('new-customer-notes').value.trim();
    
    // Check if any field has been filled out
    return firstName || lastName || phone || email || gender || notes;
}

/**
 * Initialize modal events
 */
function setupModalEvents() {
    // Close modal buttons
    document.querySelectorAll('.close-modal, #close-modal').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
      // When user clicks outside the modal
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                // Special handling for customer modal to check for unsaved changes
                if (modal.id === 'add-customer-modal' && hasUnsavedCustomerChanges()) {
                    if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                        return; // User chose to stay on the form
                    }
                    document.getElementById('add-customer-form').reset();
                }
                
                modal.style.display = 'none';
            }
        });    });
      // Add appointment button
    document.getElementById('add-appointment-btn').addEventListener('click', function() {
        // Reset form and show modal
        resetAppointmentForm();
        
        // Refresh sales rep dropdown to ensure it's populated
        console.log('Refreshing sales reps before showing appointment modal');
        loadSalesReps();
        
        // Check if the sales rep dropdown has options
        const salesRepSelect = document.getElementById('appointment-sales-rep');
        if (salesRepSelect && salesRepSelect.options.length <= 1) {
            console.warn('Sales rep dropdown has no options, attempting to populate with default data');
            
            // Create default users if none exist
            const defaultUsers = [
                { id: '1', firstName: 'Sarah', lastName: 'Johnson', username: 'sjohnson', role: 'sales' },
                { id: '2', firstName: 'Michael', lastName: 'Chen', username: 'mchen', role: 'sales' },
                { id: '3', firstName: 'David', lastName: 'Wilson', username: 'dwilson', role: 'sales' },
                { id: '4', firstName: 'Maria', lastName: 'Rodriguez', username: 'mrodriguez', role: 'sales' }
            ];
            
            // Save to both localStorage keys
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            localStorage.setItem('monumeUsers', JSON.stringify(defaultUsers));
            
            // Reload dropdown
            loadSalesReps();
        }
        
        // Show the modal
        document.getElementById('create-appointment-modal').style.display = 'block';
    });
    
    // Add customer from appointment modal - already handled in DOMContentLoaded event
    // This event listener is removed to prevent duplicate handlers
    
    // Cancel adding customer
    const cancelAddCustomerBtn = document.getElementById('cancel-add-customer');
    if (cancelAddCustomerBtn) {
        // Remove any existing event listeners first
        const newCancelBtn = cancelAddCustomerBtn.cloneNode(true);
        cancelAddCustomerBtn.parentNode.replaceChild(newCancelBtn, cancelAddCustomerBtn);
        
        newCancelBtn.addEventListener('click', function() {
            console.log('Cancel customer button clicked - from events.js');
            
            // Check for unsaved changes
            if (hasUnsavedCustomerChanges()) {
                if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                    return; // User chose to stay on the form
                }
            }
            
            document.getElementById('add-customer-form').reset();
            document.getElementById('add-customer-modal').style.display = 'none';
            
            // Reset the save button to original state if needed
            const saveBtn = document.getElementById('save-new-customer');
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                saveBtn.disabled = false;
            }
            
            // Reset the flag
            saveCustomerInProgress = false;
        });
    }
      
    // Close customer modal X button
    const closeCustomerModalBtn = document.getElementById('close-customer-modal');
    if (closeCustomerModalBtn) {
        // Remove any existing event listeners first
        const newCloseBtn = closeCustomerModalBtn.cloneNode(true);
        closeCustomerModalBtn.parentNode.replaceChild(newCloseBtn, closeCustomerModalBtn);
        
        newCloseBtn.addEventListener('click', function() {
            console.log('Close customer modal button (X) clicked - from events.js');
            
            // Check for unsaved changes
            if (hasUnsavedCustomerChanges()) {
                if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                    return; // User chose to stay on the form
                }
            }
            
            document.getElementById('add-customer-form').reset();
            document.getElementById('add-customer-modal').style.display = 'none';
            
            // Reset the save button to original state if needed
            const saveBtn = document.getElementById('save-new-customer');
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                saveBtn.disabled = false;
            }

        });
    }

    // --- Add Customer Modal Button Handlers ---
    // Cancel button
    const cancelBtn = document.getElementById('cancel-add-customer');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', function() {
            if (hasUnsavedCustomerChanges()) {
                if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) return;
            }
            document.getElementById('add-customer-form').reset();
            document.getElementById('add-customer-modal').style.display = 'none';
            const saveBtn = document.getElementById('save-new-customer');
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                saveBtn.disabled = false;
            }
            saveCustomerInProgress = false;
        });
    }
    // Close (X) button
    const closeBtn = document.getElementById('close-customer-modal');
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', function() {
            if (hasUnsavedCustomerChanges()) {
                if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) return;
            }
            document.getElementById('add-customer-form').reset();
            document.getElementById('add-customer-modal').style.display = 'none';
            const saveBtn = document.getElementById('save-new-customer');
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                saveBtn.disabled = false;
            }
            saveCustomerInProgress = false;
        });
    }      // Add Customer (Save) button
    const saveBtn = document.getElementById('save-new-customer');
    if (saveBtn) {
        // First completely remove any existing event listeners
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        // Attach the improved event handler with proper error handling and feedback
        newSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Save new customer button clicked');
            
            if (window.saveCustomerInProgress) {
                console.log('Save operation already in progress, ignoring click');
                return;
            }
            
            window.saveCustomerInProgress = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            this.disabled = true;
            
            setTimeout(() => {
                try {
                    // Get form values
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
                        window.saveCustomerInProgress = false;
                        return;
                    }
                    
                    // Save to localStorage
                    let customers = [];
                    try {
                        const storedCustomers = localStorage.getItem('customers');
                        customers = storedCustomers ? JSON.parse(storedCustomers) : [];
                    } catch (e) { 
                        console.error('Error parsing customers from localStorage:', e);
                        customers = []; 
                    }
                    
                    const newCustomer = {
                        id: Date.now().toString(),
                        firstName, lastName, phone, email, gender, notes
                    };
                    
                    customers.push(newCustomer);
                    localStorage.setItem('customers', JSON.stringify(customers));
                    
                    // Update UI and show feedback
                    document.getElementById('add-customer-form').reset();
                    document.getElementById('add-customer-modal').style.display = 'none';
                    
                    // Update related UI components if they exist
                    if (typeof searchCustomers === 'function') searchCustomers();
                    if (typeof updateStatsCounters === 'function') updateStatsCounters();
                    if (typeof loadCustomers === 'function') loadCustomers();
                    
                    alert(`Customer ${firstName} ${lastName} has been added successfully!`);
                } catch (err) {
                    console.error('Error saving customer:', err);
                    alert('An error occurred while saving the customer. Please try again.');
                }                this.innerHTML = '<i class="fas fa-save"></i> Add Customer';
                this.disabled = false;
                window.saveCustomerInProgress = false;
            }, 100);
        });
    }
}

/**
 * Search for existing customers by phone number
 */
function searchCustomerByPhone(phone) {
    if (!phone || phone.length < 3) return [];
    
    // Get customers from localStorage
    let customers = [];
    try {
        const storedCustomers = localStorage.getItem('customers');
        customers = storedCustomers ? JSON.parse(storedCustomers) : [];
    } catch (e) {
        console.error('Error loading customers from localStorage:', e);
        return [];
    }
    
    // Filter customers by phone number (partial match)
    return customers.filter(customer => 
        customer.phone && customer.phone.includes(phone)
    );
}

/**
 * Initialize customer management events
 */
function setupCustomerEvents() {
    // Add phone number search functionality
    const phoneInput = document.getElementById('new-customer-phone');
    const phoneSearchResults = document.getElementById('phone-search-results');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            const phone = this.value.trim();
            const matchingCustomers = searchCustomerByPhone(phone);
            
            // Display search results
            phoneSearchResults.innerHTML = '';
            
            if (matchingCustomers.length > 0) {
                matchingCustomers.forEach(customer => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'phone-search-item';
                    resultItem.innerHTML = `
                        <strong>${customer.firstName} ${customer.lastName}</strong>
                        <div>${customer.phone}</div>
                        ${customer.email ? `<div>${customer.email}</div>` : ''}
                    `;
                    
                    resultItem.addEventListener('click', function() {
                        // Close the add customer modal
                        document.getElementById('add-customer-modal').style.display = 'none';
                        
                        // If we're in appointment creation mode, select this customer
                        if (document.getElementById('create-appointment-modal') && 
                            document.getElementById('create-appointment-modal').style.display === 'block') {
                            
                            // Create or update hidden input
                            let selectedCustomerIdInput = document.getElementById('selected-customer-id');
                            if (!selectedCustomerIdInput) {
                                selectedCustomerIdInput = document.createElement('input');
                                selectedCustomerIdInput.type = 'hidden';
                                selectedCustomerIdInput.id = 'selected-customer-id';
                                document.getElementById('appointment-form').appendChild(selectedCustomerIdInput);
                            }
                            selectedCustomerIdInput.value = customer.id;
                            
                            // Add visual indication of selected customer
                            const customerSelectionResult = document.createElement('div');
                            customerSelectionResult.classList.add('customer-selection-result');
                            customerSelectionResult.innerHTML = `
                                <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
                                    <strong>${customer.firstName} ${customer.lastName}</strong><br>
                                    <small>${customer.phone}${customer.email ? ' | ' + customer.email : ''}${customer.gender ? ' | ' + customer.gender : ''}</small>
                                </div>
                            `;
                            
                            // Remove any existing selection result
                            const existingResult = document.querySelector('.customer-selection-result');
                            if (existingResult) {
                                existingResult.remove();
                            }
                            
                            // Add visual indication after the Add Customer button
                            const addCustomerBtn = document.getElementById('add-customer-for-appointment');
                            if (addCustomerBtn) {
                                addCustomerBtn.insertAdjacentElement('afterend', customerSelectionResult);
                            }
                            
                            alert(`Customer ${customer.firstName} ${customer.lastName} selected for appointment.`);
                        }
                    });
                    
                    phoneSearchResults.appendChild(resultItem);
                });
                
                // Show the search results
                phoneSearchResults.style.display = 'block';
            } else {
                phoneSearchResults.style.display = 'none';
            }
        });
        
        // Hide search results when input loses focus (after a short delay)
        phoneInput.addEventListener('blur', function() {
            setTimeout(() => {
                phoneSearchResults.style.display = 'none';
            }, 200);
        });
        
        // Show search results when input gains focus (if there are results)
        phoneInput.addEventListener('focus', function() {
            if (phoneSearchResults.children.length > 0) {
                phoneSearchResults.style.display = 'block';
            }
        });
    }

    // Add customer button in customer tab
    document.getElementById('add-customer-btn').addEventListener('click', function() {
        document.getElementById('customer-form-container').style.display = 'block';
        document.getElementById('customer-form-title').textContent = 'Add New Customer';
        document.getElementById('customer-id').value = '';
        document.getElementById('customer-form').reset();
    });
    
    // Cancel customer form
    document.getElementById('cancel-customer-btn').addEventListener('click', function() {
        document.getElementById('customer-form-container').style.display = 'none';
    });
      // Save customer from main customer form
    document.getElementById('customer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCustomer();
    });
    
    // The save new customer from modal is now handled in setupModalEvents
    // to avoid duplicate event handlers
    console.log('Save customer button handler is now centralized in setupModalEvents()');
    
    // Customer search
    document.getElementById('customer-search').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        displayCustomerSearchResults(searchTerm);
    });
}

/**
 * Initialize appointment form events
 */
function setupAppointmentEvents() {
    // Save appointment
    document.getElementById('save-appointment').addEventListener('click', function(e) {
        // Host verification logic
        var appointmentSalesRep = document.getElementById('appointment-sales-rep');
        var hostVerificationModal = document.getElementById('host-verification-modal');
        var hostPasswordInput = document.getElementById('host-password-input');
        var hostVerificationError = document.getElementById('host-verification-error');
        var verifyHostPasswordBtn = document.getElementById('verify-host-password-btn');
        var closeHostVerificationBtn = document.getElementById('close-host-verification-modal');
        // Use a global or window-scoped variable to track verification
        if (!window._hostVerifiedId) window._hostVerifiedId = null;
        var selectedHostId = appointmentSalesRep ? appointmentSalesRep.value : null;
        // If a host is selected and not verified, show modal and block save
        if (selectedHostId && window._hostVerifiedId !== selectedHostId) {
            if (hostVerificationModal) {
                hostPasswordInput.value = '';
                hostVerificationError.style.display = 'none';
                hostVerificationModal.style.display = 'block';
                // Attach one-time verification handler
                verifyHostPasswordBtn.onclick = function() {
                    var entered = hostPasswordInput.value;
                    var users = JSON.parse(localStorage.getItem('users') || '[]');
                    var user = users.find(u => u.id == selectedHostId);
                    var correctPassword = user ? (user.password || 'password123') : 'password123';
                    if (entered === correctPassword) {
                        hostVerificationModal.style.display = 'none';
                        hostVerificationError.style.display = 'none';
                        window._hostVerifiedId = selectedHostId;
                        saveAppointment();
                    } else {
                        hostVerificationError.textContent = 'Incorrect password. Please try again.';
                        hostVerificationError.style.display = 'block';
                    }
                };
                // Attach close handler
                closeHostVerificationBtn.onclick = function() {
                    hostVerificationModal.style.display = 'none';
                };
            }
            return; // Block save until verified
        }
        // If no host or already verified, proceed to save
        saveAppointment();
    });
    
    // Clear appointment form
    document.getElementById('clear-form').addEventListener('click', function() {
        resetAppointmentForm();
    });
    
    // Delete appointment
    document.getElementById('delete-appointment').addEventListener('click', function() {
        const appointmentId = this.dataset.appointmentId;
        deleteAppointment(appointmentId);
    });
    
    // Edit appointment
    document.getElementById('edit-appointment').addEventListener('click', function() {
        const appointmentId = this.dataset.appointmentId;
        editAppointment(appointmentId);
    });
    
    // Toggle form fields based on event type
    document.getElementById('appointment-type').addEventListener('change', function() {
        toggleEventTypeFormFields(this.value);
    });
    
    // Handle all-day event checkbox
    document.getElementById('all-day-event').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('appointment-time').value = '00:00';
            document.getElementById('appointment-duration').value = 1440; // 24 hours
            document.getElementById('appointment-time').disabled = true;
            document.getElementById('appointment-duration').disabled = true;
        } else {
            document.getElementById('appointment-time').disabled = false;
            document.getElementById('appointment-duration').disabled = false;
        }
    });
}

/**
 * Toggle form fields based on event type (appointment or event)
 */
function toggleEventTypeFormFields(eventType) {
    const timeGroup = document.querySelector('.time-group');
    const allDayGroup = document.querySelector('.all-day-group');
    const durationField = document.getElementById('appointment-duration');
    const timeField = document.getElementById('appointment-time');
    
    if (eventType === 'event') {
        // Show all-day option for events
        allDayGroup.style.display = 'block';
        
        // Update field labels
        document.querySelector('label[for="appointment-sales-rep"]').textContent = 'Event Organizer';
        document.querySelector('label[for="customer-selection"]').textContent = 'Participants';
        document.querySelector('button#add-customer-for-appointment i').nextSibling.textContent = ' Add Participant';
    } else {
        // Hide all-day option for appointments
        allDayGroup.style.display = 'none';
        document.getElementById('all-day-event').checked = false;
        
        // Enable time and duration fields
        timeField.disabled = false;
        durationField.disabled = false;
        
        // Update field labels back to appointment terminology
        document.querySelector('label[for="appointment-sales-rep"]').textContent = 'Event Host';
        document.querySelector('label[for="customer-selection"]').textContent = 'Customer';
        document.querySelector('button#add-customer-for-appointment i').nextSibling.textContent = ' Add Customer';
    }
}

/**
 * Load customers from storage
 */
function loadCustomers() {
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) {
        customers = JSON.parse(storedCustomers);
        displayCustomerSearchResults('');
    } else {
        // Sample data for testing
        customers = [
            { id: 1, firstName: 'John', lastName: 'Doe', phone: '555-123-4567', email: 'john@example.com', notes: 'Preferred contact: email' },
            { id: 2, firstName: 'Jane', lastName: 'Smith', phone: '555-987-6543', email: 'jane@example.com', notes: 'Interested in bronze monuments' }
        ];
        localStorage.setItem('customers', JSON.stringify(customers));
        displayCustomerSearchResults('');
    }
}

/**
 * Load appointments from storage
 */
function loadAppointments() {
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
        appointments = JSON.parse(storedAppointments);
        
        // Ensure all appointments have necessary fields
        appointments = appointments.map(appointment => {
            // Make sure all appointments have a status
            if (!appointment.status) {
                appointment.status = 'scheduled';
            }
            
            // Make sure all appointments have a token for status links
            if (!appointment.token) {
                appointment.token = Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
            }
              // Make sure all appointments have a status link using the domain
            if (!appointment.statusLink) {
                appointment.statusLink = `https://www.monumevip.com/static/appointment-status.html?token=${appointment.token}`;
            } else if (!appointment.statusLink.includes('monumevip.com')) {
                // Update old links to use the correct domain
                appointment.statusLink = appointment.statusLink.replace(
                    /^.*\/appointment-status\.html/, 
                    'https://www.monumevip.com/static/appointment-status.html'
                );
            }
            
            return appointment;
        });
        
        // Save back to storage with updated fields
        localStorage.setItem('appointments', JSON.stringify(appointments));
    } else {
        // Sample data for testing
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Generate tokens for sample appointments
        const token1 = Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
        const token2 = Math.random().toString(36).substr(2, 12) + (Date.now()+1).toString(36);
        
        appointments = [
            { 
                id: 1, 
                title: 'Initial Consultation',
                start: `${today.toISOString().split('T')[0]}T10:00:00`,
                end: `${today.toISOString().split('T')[0]}T10:30:00`,
                type: 'consultation', 
                status: 'scheduled',
                token: token1,
                statusLink: `https://www.monumevip.com/static/appointment-status.html?token=${token1}`,
                allDay: false,
                extendedProps: {
                    type: 'consultation',
                    customerId: 1,
                    customerName: 'John Doe',
                    salesRep: 'Sarah Johnson',
                    notes: 'Discuss monument options'
                }
            },
            { 
                id: 2, 
                title: 'Design Review',
                start: `${tomorrow.toISOString().split('T')[0]}T14:00:00`,
                end: `${tomorrow.toISOString().split('T')[0]}T14:45:00`,
                type: 'service', 
                status: 'confirmed',
                token: token2,
                statusLink: `https://www.monumevip.com/static/appointment-status.html?token=${token2}`,
                allDay: false,
                extendedProps: {
                    type: 'service',
                    customerId: 2,
                    customerName: 'Jane Smith',
                    salesRep: 'Michael Chen',
                    notes: 'Review custom design drafts'
                }
            }        ];
        localStorage.setItem('appointments', JSON.stringify(appointments));
    }

    // Update calendar with appointments
    if (typeof refreshCalendarEvents === 'function') {
        console.log('Refreshing calendar with refreshCalendarEvents()');
        refreshCalendarEvents();
    } else {
        console.error('refreshCalendarEvents function not found, calendar may not update');
    }
}

/**
 * Load sales representatives from users in localStorage
 */
function loadSalesReps() {
    const salesRepSelect = document.getElementById('appointment-sales-rep');
    if (!salesRepSelect) {
        console.error('Sales rep select element not found!');
        return;
    }

    // Try to get users from both possible localStorage keys
    const storedUsers = localStorage.getItem('users');
    const storedMonumeUsers = localStorage.getItem('monumeUsers');
    const storedUsersArray = localStorage.getItem('usersArray');
    
    let salesReps = [];
    
    // First try with 'users' key
    if (storedUsers) {
        try {
            // Extract user details from the users array
            const users = JSON.parse(storedUsers);
            console.log('Found users in localStorage (users key):', users.length);
            
            // Map users to include ID and name
            salesReps = users.map(user => {
                // Check which property contains the user ID
                const userId = user.id || user.userId || user._id || user.user_id;
                const firstName = user.firstName || user.first_name || '';
                const lastName = user.lastName || user.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                const displayName = fullName || user.username || user.name || user.email || 'Unknown User';
                
                return {
                    id: userId || String(Math.random()).slice(2, 10), // Fallback to random ID if none exists
                    name: displayName
                };
            });
            
            console.log('Populated sales reps from users:', salesReps);
        } catch (error) {
            console.error('Error parsing users from localStorage (users key):', error);
        }
    }
    
    // If no users found with 'users' key, try with 'monumeUsers' key
    if (!salesReps.length && storedMonumeUsers) {
        try {
            // Extract user details from the monumeUsers array
            const monumeUsers = JSON.parse(storedMonumeUsers);
            console.log('Found users in localStorage (monumeUsers key):', monumeUsers.length);
            
            // Map users to include ID and name
            salesReps = monumeUsers.map(user => {
                // Check which property contains the user ID
                const userId = user.id || user.userId || user._id || user.user_id;
                const firstName = user.firstName || user.first_name || '';
                const lastName = user.lastName || user.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                const displayName = fullName || user.username || user.name || user.email || 'Unknown User';
                
                return {
                    id: userId || String(Math.random()).slice(2, 10), // Fallback to random ID if none exists
                    name: displayName
                };
            });
            
            console.log('Populated sales reps from monumeUsers:', salesReps);
        } catch (error) {
            console.error('Error parsing users from localStorage (monumeUsers key):', error);
        }
    }
    
    // Try with 'usersArray' key as well
    if (!salesReps.length && storedUsersArray) {
        try {
            const usersArray = JSON.parse(storedUsersArray);
            console.log('Found users in localStorage (usersArray key):', usersArray.length);
            
            salesReps = usersArray.map(user => {
                const userId = user.id || user.userId || user._id || user.user_id;
                const firstName = user.firstName || user.first_name || '';
                const lastName = user.lastName || user.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                const displayName = fullName || user.username || user.name || user.email || 'Unknown User';
                
                return {
                    id: userId || String(Math.random()).slice(2, 10),
                    name: displayName
                };
            });
            
            console.log('Populated sales reps from usersArray:', salesReps);
        } catch (error) {
            console.error('Error parsing users from localStorage (usersArray key):', error);
        }
    }    // If users found, sync the lists to maintain consistency
    if (salesReps.length) {
        // Sync the user lists to maintain consistency
        syncUserLists();
    } else {
        console.log('No users found in localStorage. Please make sure users are added to the system.');
    }
    
    // Clear and repopulate select
    salesRepSelect.innerHTML = '<option value="">Select event host</option>';
    salesReps.forEach(rep => {
        const option = document.createElement('option');
        option.value = rep.id; // Use user ID as the value
        option.textContent = rep.name;
        option.dataset.userId = rep.id; // Store user ID as data attribute
        salesRepSelect.appendChild(option);
    });
    
    console.log(`Populated sales rep select with ${salesReps.length} options`);
}

/**
 * Sync the 'users' and 'monumeUsers' lists to maintain consistency
 */
function syncUserLists() {
    try {
        // Get both user lists
        const usersStr = localStorage.getItem('users');
        const monumeUsersStr = localStorage.getItem('monumeUsers');
        
        if (!usersStr && !monumeUsersStr) {
            // Neither list exists, nothing to do
            return;
        }
        
        if (usersStr && !monumeUsersStr) {
            // Only 'users' exists, copy to 'monumeUsers'
            localStorage.setItem('monumeUsers', usersStr);
            console.log('Synced users → monumeUsers');
            return;
        }
        
        if (!usersStr && monumeUsersStr) {
            // Only 'monumeUsers' exists, copy to 'users'
            localStorage.setItem('users', monumeUsersStr);
            console.log('Synced monumeUsers → users');
            return;
        }
        
        // Both exist, merge them
        const users = JSON.parse(usersStr);
        const monumeUsers = JSON.parse(monumeUsersStr);
        
        // Create a map of IDs to users
        const mergedUserMap = {};
        
        // Add all users from 'users' list
        users.forEach(user => {
            const userId = user.id || user.userId || user._id || user.user_id;
            if (userId) {
                mergedUserMap[userId] = user;
            }
        });
        
        // Add or update with users from 'monumeUsers' list
        monumeUsers.forEach(user => {
            const userId = user.id || user.userId || user._id || user.user_id;
            if (userId) {
                mergedUserMap[userId] = { ...mergedUserMap[userId], ...user };
            }
        });
        
        // Convert map back to array
        const mergedUsers = Object.values(mergedUserMap);
        
        // Save merged lists back to both keys
        const mergedUsersStr = JSON.stringify(mergedUsers);
        localStorage.setItem('users', mergedUsersStr);
        localStorage.setItem('monumeUsers', mergedUsersStr);
        
        console.log(`User lists synced: ${mergedUsers.length} unique users`);
    } catch (error) {
        console.error('Error syncing user lists:', error);
    }
}

/**
 * Display customer search results
 */
function displayCustomerSearchResults(searchTerm) {
    const resultsContainer = document.getElementById('customer-results');
    resultsContainer.innerHTML = '';
    
    const filteredCustomers = searchTerm ? 
        customers.filter(customer => 
            `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm))
        ) : customers;
    
    if (filteredCustomers.length === 0) {
        resultsContainer.innerHTML = '<p>No customers found. Try a different search term or add a new customer.</p>';
        return;
    }
    
    filteredCustomers.forEach(customer => {
        const customerCard = document.createElement('div');
        customerCard.className = 'customer-card';
        customerCard.dataset.customerId = customer.id;
        
        customerCard.innerHTML = `
            <h3 class="customer-name">${customer.firstName} ${customer.lastName}</h3>
            <div class="customer-contact">
                <span><i class="fas fa-phone"></i> ${customer.phone}</span>
                ${customer.email ? `<span><i class="fas fa-envelope"></i> ${customer.email}</span>` : ''}
            </div>
            <div class="customer-actions">
                <button class="btn btn-secondary btn-sm edit-customer-btn">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-secondary btn-sm select-customer-btn">
                    <i class="fas fa-calendar-plus"></i> New Appointment
                </button>
            </div>
        `;
        
        // Add event listeners
        customerCard.querySelector('.edit-customer-btn').addEventListener('click', function() {
            editCustomer(customer.id);
        });
        
        // Update the select-customer-btn behavior to select an existing customer
        customerCard.querySelector('.select-customer-btn').addEventListener('click', function() {
            document.getElementById('appointment-customer').value = customer.id;
            document.getElementById('create-appointment-modal').style.display = 'block';
            document.getElementById('customer-form-container').style.display = 'none';
        });
        
        resultsContainer.appendChild(customerCard);
    });
}

/**
 * Save a new customer from the modal form and update the appointment form
 */
// Track if save operation is in progress to prevent double submissions
let saveCustomerInProgress = false;

function saveNewCustomerFromModal() {
    // Prevent duplicate saves
    if (saveCustomerInProgress) {
        console.log('Save operation already in progress, preventing duplicate submission');
        return;
    }
    
    saveCustomerInProgress = true;
    console.log('Saving new customer from modal...');
    
    // Debug output to track execution
    console.log('saveNewCustomerFromModal function is executing');
    
    // Get form values
    const firstName = document.getElementById('new-customer-first-name').value.trim();
    const lastName = document.getElementById('new-customer-last-name').value.trim();
    const phone = document.getElementById('new-customer-phone').value.trim();
    const email = document.getElementById('new-customer-email').value.trim();
    const gender = document.getElementById('new-customer-gender').value.trim();
    const notes = document.getElementById('new-customer-notes').value.trim();    // Validation
    if (!firstName || !lastName || !phone || !gender) {
        alert('Please fill in all required fields (First Name, Last Name, Phone Number, and Gender)');
        saveCustomerInProgress = false; // Reset flag if validation fails
        
        // Reset save button
        const saveButton = document.getElementById('save-new-customer');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> Add Customer';
            saveButton.disabled = false;
        } else {
            console.error('Save button element not found when trying to reset it');
        }
        
        return;
    }
    
    // Log validation passed
    console.log('Validation passed. Creating new customer with:');
    console.log(`Name: ${firstName} ${lastName}, Phone: ${phone}, Gender: ${gender}`); 
    
    // Create new customer
    const newCustomer = {
        id: Date.now().toString(), // Use timestamp as ID (string to match other implementations)
        firstName,
        lastName,
        phone,
        email,
        gender,
        notes
    };
    
    // Get customers from localStorage
    let customers = [];
    try {
        const storedCustomers = localStorage.getItem('customers');
        customers = storedCustomers ? JSON.parse(storedCustomers) : [];
    } catch (e) {
        console.error('Error loading customers from localStorage:', e);
        customers = [];
    }
      // Add to customers array
    customers.push(newCustomer);
    
    // Save to localStorage
    try {
        localStorage.setItem('customers', JSON.stringify(customers));
    } catch (e) {
        console.error('Error saving customer to localStorage:', e);
        alert('There was a problem saving the customer. Please try again.');
        
        // Reset button and flag
        saveCustomerInProgress = false;
        const saveButton = document.getElementById('save-new-customer');
        saveButton.innerHTML = '<i class="fas fa-save"></i> Add Customer';
        saveButton.disabled = false;
        
        return;
    }
    
    // Update customer count if function exists
    if (typeof updateStatistics === 'function') {
        updateStatistics();
    }
    
    if (typeof updateStatsCounters === 'function') {
        updateStatsCounters();
    }
    
    // Select this customer for the appointment if we're in appointment creation mode
    if (document.getElementById('create-appointment-modal') && 
        document.getElementById('create-appointment-modal').style.display === 'block') {
        
        // Create a hidden input to store the customer ID
        let selectedCustomerIdInput = document.getElementById('selected-customer-id');
        if (!selectedCustomerIdInput) {
            selectedCustomerIdInput = document.createElement('input');
            selectedCustomerIdInput.type = 'hidden';
            selectedCustomerIdInput.id = 'selected-customer-id';
            document.getElementById('appointment-form').appendChild(selectedCustomerIdInput);
        }
        selectedCustomerIdInput.value = newCustomer.id;
        
        // Add visual indication of the selected customer
        const customerSelectionResult = document.createElement('div');
        customerSelectionResult.classList.add('customer-selection-result');
        customerSelectionResult.innerHTML = `
            <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
                <strong>${newCustomer.firstName} ${newCustomer.lastName}</strong><br>
                <small>${newCustomer.phone}${email ? ' | ' + email : ''}${gender ? ' | ' + gender : ''}</small>
            </div>
        `;
        
        // Add the visual element after the "Add Customer" button
        const addCustomerBtn = document.getElementById('add-customer-for-appointment');
        // Remove any existing selection result first
        const existingResult = document.querySelector('.customer-selection-result');
        if (existingResult) {
            existingResult.remove();
        }
        
        if (addCustomerBtn) {
            addCustomerBtn.insertAdjacentElement('afterend', customerSelectionResult);
        }
    }
      // Update the customer dropdown if it exists
    if (typeof populateCustomerDropdown === 'function') {
        populateCustomerDropdown();
    }
      
    // Clear form and hide modal
    document.getElementById('add-customer-form').reset();
    document.getElementById('add-customer-modal').style.display = 'none';
      
    // Refresh customer search results if available
    if (typeof searchCustomers === 'function') {
        searchCustomers();
    }
    
    // Show one appropriate success message based on context
    if (document.getElementById('create-appointment-modal') &&
        document.getElementById('create-appointment-modal').style.display === 'block') {
        alert(`Customer ${firstName} ${lastName} has been added and selected for this appointment.`);    } else {
        alert(`Customer ${firstName} ${lastName} has been added successfully!`);
    }
    
    // Reset the flag after successful completion
    saveCustomerInProgress = false;
    
    // Reset save button
    const saveButton = document.getElementById('save-new-customer');
    saveButton.innerHTML = '<i class="fas fa-save"></i> Add Customer';
    saveButton.disabled = false;
    
    // Reset the progress flag after successful completion
    saveCustomerInProgress = false;
}

/**
 * Save a customer from the main customer form
 */
function saveCustomer() {
    // Get form values
    const customerId = document.getElementById('customer-id').value;
    const firstName = document.getElementById('customer-first-name').value.trim();
    const lastName = document.getElementById('customer-last-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    const notes = document.getElementById('customer-notes').value.trim();
    
    // Validation
    if (!firstName || !lastName || !phone) {
        alert('Please fill in all required fields (First Name, Last Name, and Phone Number)');
        return;
    }
    
    if (customerId) {
        // Edit existing customer
        const index = customers.findIndex(c => c.id == customerId);
        if (index !== -1) {
            customers[index] = {
                id: parseInt(customerId),
                firstName,
                lastName,
                phone,
                email,
                notes
            };
        }
    } else {
        // Create new customer
        const newCustomer = {
            id: Date.now(), // Use timestamp as ID
            firstName,
            lastName,
            phone,
            email,
            notes
        };
        customers.push(newCustomer);
    }
    
    // Save to localStorage
    localStorage.setItem('customers', JSON.stringify(customers));
    
    // Update UI
    document.getElementById('customer-form-container').style.display = 'none';
    document.getElementById('customer-form').reset();
    displayCustomerSearchResults('');
    
    // Update statistics
    updateStatistics();
}

/**
 * Edit a customer
 */
function editCustomer(customerId) {
    const customer = customers.find(c => c.id == customerId);
    if (!customer) return;
    
    // Populate form
    document.getElementById('customer-id').value = customer.id;
    document.getElementById('customer-first-name').value = customer.firstName;
    document.getElementById('customer-last-name').value = customer.lastName;
    document.getElementById('customer-phone').value = customer.phone;
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-notes').value = customer.notes || '';
    
    // Update UI
    document.getElementById('customer-form-title').textContent = 'Edit Customer';
    document.getElementById('customer-form-container').style.display = 'block';
}

/**
 * Select a customer for a new appointment
 */
function selectCustomerForAppointment(customerId) {
    const customer = customers.find(c => c.id == customerId);
    if (!customer) return;
    
    // Store selected customer
    selectedCustomerForAppointment = customer;
    
    // Reset form and open modal
    resetAppointmentForm();
    
    // Update UI to show selected customer
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    customerLabel.textContent = `Customer: ${customer.firstName} ${customer.lastName}`;
    
    // Show the appointment modal
    document.getElementById('create-appointment-modal').style.display = 'block';
}

/**
 * Save an appointment
 */
function saveAppointment() {
    // Get form values
    const title = document.getElementById('appointment-title').value;
    const type = document.getElementById('appointment-type').value;
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const duration = parseInt(document.getElementById('appointment-duration').value);
    const salesRepId = document.getElementById('appointment-sales-rep').value;
    const salesRepName = document.getElementById('appointment-sales-rep').selectedOptions[0]?.textContent || '';
    const notes = document.getElementById('appointment-notes').value;
    // Validation
    if (!title || !date || !type || !salesRepId) {
        if (typeof showNotification === 'function') {
            showNotification('Please fill in all required fields', 'error');
        } else {
            alert('Please fill in all required fields');
        }
        return false;
    }
    // For appointments, validate customer selection
    const customerIdElement = document.getElementById('selected-customer-id');
    if (!customerIdElement) {
        if (typeof showNotification === 'function') {
            showNotification('Please add a customer for this appointment', 'error');
        } else {
            alert('Please add a customer for this appointment');
        }
        return false;
    }
    const customerId = customerIdElement.value;
    // Find customer info
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customer = customers.find(c => c.id == customerId);
    if (!customer) {
        if (typeof showNotification === 'function') {
            showNotification('Please select a valid customer', 'error');
        } else {
            alert('Please select a valid customer');
        }
        return false;
    }
    // Calculate start and end
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    // Generate unique token for live status link
    const token = Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
    const statusLink = `${window.location.origin}/static/appointment-status.html?token=${token}`;
    // Always use 'scheduled' as the initial status
    const status = 'scheduled';
    console.log('All new appointments start with status: scheduled');

    const appointment = {
        id: Date.now().toString(),
        title: title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        allDay: false,
        duration: duration, // always save duration
        salesRepId: salesRepId,
        salesRepName: salesRepName, // always save salesRepName
        className: type === 'event' ? 'event-event' : 'event-appointment',
        status: status,
        token: token,
        statusLink: statusLink,
        extendedProps: {
            type: type,
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            customerGender: customer.gender || '',
            salesRepId: salesRepId,
            salesRepName: salesRepName,
            notes: notes
        }
    };    // Save to localStorage
    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Also save to global appointments array for immediate use
    if (typeof window.appointments !== 'undefined') {
        window.appointments.push(appointment);
    }
    
    // Try to save to the database if available
    try {
        fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointment)
        }).then(response => {
            if (!response.ok) {
                console.warn('Could not save appointment to database:', response.status);
            } else {
                console.log('Appointment saved to database successfully');
            }
        }).catch(err => {
            console.warn('Database save error:', err);
        });
    } catch (e) {
        console.warn('Could not save to database:', e);
    }
    
    // Email sending logic (auto/manual)
    const autoEmail = localStorage.getItem('autoEmail') === 'true';
    const manualEmail = localStorage.getItem('manualEmail') === 'true';
    const template = localStorage.getItem('emailTemplate') ||
        `Hello {customerName},\n\nYour appointment is scheduled for {date}.\nYou can confirm, cancel, or reschedule using this link: {statusLink}\n\nThank you!`;
    if (autoEmail && customer.email) {
        // Prepare email body
        const emailBody = template
            .replace('{customerName}', `${customer.firstName} ${customer.lastName}`)
            .replace('{date}', startDateTime.toLocaleString())
            .replace('{statusLink}', statusLink);
        // Call backend to send email (pseudo, see email_sender.py)
        fetch('/send_simple_email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: customer.email,
                subject: 'Your Appointment Details',
                body: emailBody
            })        });
    }
    // Hide modal
    const modal = document.getElementById('create-appointment-modal');
    if (modal) {
        console.log('Hiding create appointment modal');
        modal.style.display = 'none';
    } else {
        console.error('Create appointment modal element not found');
    }
    // Reset form
    const form = document.getElementById('appointment-form');
    if (form) {
        console.log('Resetting appointment form');
        form.reset();
    }
    // Remove the customer selection result
    const customerSelectionResult = document.querySelector('.customer-selection-result');
    if (customerSelectionResult) {
        customerSelectionResult.remove();
    }
    
    // Show success notification instead of alert
    if (typeof showNotification === 'function') {
        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`, 'success');
    } else {
        console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`);
    }    // Make sure the appointment is properly added to all needed places
    // Global appointments array (ensure it exists)
    window.appointments = window.appointments || [];
    
    // Avoid duplicates by removing any existing appointment with the same ID
    window.appointments = window.appointments.filter(a => a.id !== appointment.id);
    
    // Add the new appointment
    window.appointments.push(appointment);
    
    console.log('New appointment added:', appointment.title);
    
    // Use a consistent approach to update the calendar to avoid duplicates
    console.log('Updating calendar with new appointment');
    
    // First try to get the calendar instance
    let calendarEl = document.getElementById('calendar');
    let calendar = null;
    
    if (calendarEl) {
        calendar = calendarEl._calendar || window.calendar || document.monumeCalendar;
    }
    
    // First method: update through our dedicated function
    if (typeof updateCalendarEvents === 'function') {
        console.log('Refreshing calendar with updateCalendarEvents()');
        updateCalendarEvents();
    }    // Fallback method: direct calendar update
    else if (calendar) {
        console.log('Refreshing calendar directly');
        calendar.removeAllEvents();
        
        // Add all appointments
        window.appointments.forEach(apt => {
            // Display the exact time that was chosen, no icons
            let displayTime;
            
            if (apt.time) {
                // Use the exact time chosen by the user
                try {
                    // Try to format the time string directly
                    const timeStr = apt.time;
                    const [hours, minutes] = timeStr.split(':');
                    const timeDate = new Date();
                    timeDate.setHours(parseInt(hours, 10));
                    timeDate.setMinutes(parseInt(minutes, 10));
                    displayTime = timeDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                } catch(err) {
                    // Fallback to start time
                    displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                }
            } else {
                // Fallback if no specific time property
                displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
            }
            
            calendar.addEvent({
                id: apt.id,
                title: displayTime, // Just the time, no icons
                start: apt.start,
                end: apt.end,
                backgroundColor: '#d6b9e4',
                borderColor: '#9b59b6',
                textColor: '#333',
                classNames: ['appointment-event', `status-${apt.status || 'scheduled'}`]
            });
        });
        
        // Force a calendar re-render
        calendar.render();
    }
    
    // Update statistics if possible
    if (typeof updateStatistics === 'function') {
        updateStatistics();
    }
    
    return true;
}

/**
 * Reset the appointment form
 */
function resetAppointmentForm() {
    // Clear form
    document.getElementById('appointment-form').reset();
    document.getElementById('save-appointment').removeAttribute('data-appointment-id');
    
    // Reset customer selection
    selectedCustomerForAppointment = null;
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    customerLabel.textContent = 'Customer';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
}

/**
 * Show appointment details
 */
function showAppointmentDetails(event) {
    // Support both event object and appointment object
    const appointment = event.extendedProps ? event : appointments.find(a => a.id == event.id);
    if (!appointment) return;
    // Get customer details
    const customer = customers.find(c => c.id == (appointment.extendedProps?.customerId || appointment.customerId));
    // Update modal with appointment details
    document.getElementById('modal-title').textContent = appointment.title;
    document.getElementById('modal-type').textContent = (appointment.extendedProps?.type || appointment.type || '').charAt(0).toUpperCase() + (appointment.extendedProps?.type || appointment.type || '').slice(1);
    // Format date and time
    const start = new Date(appointment.start);
    const end = new Date(appointment.end);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('modal-datetime').textContent = start.toLocaleString(undefined, options);
    // Duration: use saved duration if present, else calculate
    let duration = appointment.duration || (appointment.extendedProps && appointment.extendedProps.duration);
    if (!duration && appointment.start && appointment.end) {
        duration = Math.round((end - start) / 60000);
    }
    document.getElementById('modal-duration').textContent = duration ? `${duration} minutes` : 'N/A';
    // Appointment Host: always use salesRepName if present
    const host = appointment.salesRepName || (appointment.extendedProps && appointment.extendedProps.salesRepName) || appointment.salesRep || (appointment.extendedProps && appointment.extendedProps.salesRep) || 'Not specified';
    document.getElementById('modal-sales-rep').textContent = host;
    // Set customer information
    document.getElementById('modal-customer').textContent = customer ? `${customer.firstName} ${customer.lastName} (${customer.phone})` : (appointment.extendedProps?.customerName || 'Unknown Customer');
    document.getElementById('modal-notes').textContent = (appointment.extendedProps?.notes || appointment.notes || 'No notes available');
    // Display status
    const statusElement = document.getElementById('modal-status');
    const status = appointment.status || 'scheduled';
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusElement.className = 'appointment-status status-' + status.toLowerCase();
    // Add status explanation if status link exists
    if (appointment.statusLink) {
        const statusNoteEl = document.getElementById('modal-status-note');
        if (statusNoteEl) {
            statusNoteEl.textContent = 'This appointment can be confirmed, cancelled, or rescheduled by the customer.';
        }
    }
    // Set the status link if available
    const linkContainer = document.getElementById('status-link-container');
    const statusLinkInput = document.getElementById('status-link');
    if (linkContainer && statusLinkInput && appointment.statusLink) {
        linkContainer.style.display = '';
        statusLinkInput.value = appointment.statusLink;
    } else if (linkContainer) {
        linkContainer.style.display = 'none';
    }
    // Set appointment ID for edit/delete/share buttons
    document.getElementById('delete-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('edit-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('share-appointment-link').dataset.appointmentId = appointmentId;
    document.getElementById('send-email-manually').dataset.appointmentId = appointmentId;
    // Show modal
    document.getElementById('appointment-modal').style.display = 'block';
}

/**
 * Edit an appointment
 */
function editAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id == appointmentId);
    if (!appointment) return;

    // Get customer (handle both new and legacy formats)
    let customerId = appointment.extendedProps?.customerId || appointment.customerId;
    const customer = customers.find(c => c.id == customerId);
    selectedCustomerForAppointment = customer;

    // Pre-fill all fields in the form
    document.getElementById('appointment-title').value = appointment.title || '';
    document.getElementById('appointment-type').value = appointment.extendedProps?.type || appointment.type || '';
    // Extract date and time from ISO string if needed
    let startDate = '', startTime = '';
    if (appointment.start) {
        const start = new Date(appointment.start);
        startDate = start.toISOString().split('T')[0];
        startTime = start.toTimeString().slice(0,5);
    } else {
        startDate = appointment.date || '';
        startTime = appointment.time || '';
    }
    document.getElementById('appointment-date').value = startDate;
    document.getElementById('appointment-time').value = startTime;
    document.getElementById('appointment-duration').value = appointment.duration || appointment.extendedProps?.duration || 30;
    document.getElementById('appointment-sales-rep').value = appointment.salesRepId || appointment.extendedProps?.salesRepId || appointment.salesRep || '';
    document.getElementById('appointment-notes').value = appointment.extendedProps?.notes || appointment.notes || '';

    // Set customer selection
    let selectedCustomerIdInput = document.getElementById('selected-customer-id');
    if (!selectedCustomerIdInput) {
        selectedCustomerIdInput = document.createElement('input');
        selectedCustomerIdInput.type = 'hidden';
        selectedCustomerIdInput.id = 'selected-customer-id';
        document.getElementById('appointment-form').appendChild(selectedCustomerIdInput);
    }
    selectedCustomerIdInput.value = customerId;

    // Add visual indication of the selected customer
    const addCustomerBtn = document.getElementById('add-customer-for-appointment');
    const existingResult = document.querySelector('.customer-selection-result');
    if (existingResult) existingResult.remove();
    if (addCustomerBtn && customer) {
        const customerSelectionResult = document.createElement('div');
        customerSelectionResult.classList.add('customer-selection-result');
        customerSelectionResult.innerHTML = `
            <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
                <strong>${customer.firstName} ${customer.lastName}</strong><br>
                <small>${customer.phone}${customer.email ? ' | ' + customer.email : ''}${customer.gender ? ' | ' + customer.gender : ''}</small>
            </div>
        `;
        addCustomerBtn.insertAdjacentElement('afterend', customerSelectionResult);
    }

    // Store original date/time for change detection
    document.getElementById('save-appointment').dataset.editing = 'true';
    document.getElementById('save-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('save-appointment').dataset.originalDate = startDate;
    document.getElementById('save-appointment').dataset.originalTime = startTime;

    // Update customer label
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    if (customer) {
        customerLabel.textContent = `Customer: ${customer.firstName} ${customer.lastName}`;
    } else {
        customerLabel.textContent = 'Customer';
    }

    // Hide details modal and show edit modal
    document.getElementById('appointment-modal').style.display = 'none';
    document.getElementById('create-appointment-modal').style.display = 'block';
}

/**
 * Save an appointment (handles both new and edit mode)
 */
function saveAppointment() {
    // Get form values
    const title = document.getElementById('appointment-title').value;
    const type = document.getElementById('appointment-type').value;
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const duration = parseInt(document.getElementById('appointment-duration').value);
    const salesRepId = document.getElementById('appointment-sales-rep').value;
    const salesRepName = document.getElementById('appointment-sales-rep').selectedOptions[0]?.textContent || '';
    const notes = document.getElementById('appointment-notes').value;
    // Validation
    if (!title || !date || !type || !salesRepId) {
       
        if (typeof showNotification === 'function') {
            showNotification('Please fill in all required fields', 'error');
        } else {
            alert('Please fill in all required fields');
        }
        return false;
    }
    // For appointments, validate customer selection
    const customerIdElement = document.getElementById('selected-customer-id');
    if (!customerIdElement) {
        if (typeof showNotification === 'function') {
            showNotification('Please add a customer for this appointment', 'error');
        } else {
            alert('Please add a customer for this appointment');
        }
        return false;
    }
    const customerId = customerIdElement.value;
    // Find customer info
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customer = customers.find(c => c.id == customerId);
    if (!customer) {
        if (typeof showNotification === 'function') {
            showNotification('Please select a valid customer', 'error');
        } else {
            alert('Please select a valid customer');
        }
        return false;
    }
    // Calculate start and end
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // Check if editing
    const saveBtn = document.getElementById('save-appointment');
    const isEditing = saveBtn.dataset.editing === 'true';
    const editingId = saveBtn.dataset.appointmentId;
    const originalDate = saveBtn.dataset.originalDate;
    const originalTime = saveBtn.dataset.originalTime;

    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    let appointment;
    let status = 'scheduled';
    let token, statusLink;

    if (isEditing && editingId) {
        // Find and update existing appointment
        const idx = appointments.findIndex(a => a.id == editingId);
        if (idx === -1) {
            showNotification ? showNotification('Error: Appointment not found.', 'error') : alert('Error: Appointment not found.');
            return false;
        }
        appointment = appointments[idx];
        // Detect if date or time changed
        const dateChanged = (originalDate !== date);
        const timeChanged = (originalTime !== time);
        // Keep the same token and statusLink
        token = appointment.token;
        statusLink = appointment.statusLink;
        // If date or time changed, set status to 'rescheduled'
        if (dateChanged || timeChanged) {
            status = 'rescheduled';
        } else {
            status = appointment.status || 'scheduled';
        }
        // Update appointment fields
        appointment.title = title;
        appointment.start = startDateTime.toISOString();
        appointment.end = endDateTime.toISOString();
        appointment.allDay = false;
        appointment.duration = duration;
        appointment.salesRepId = salesRepId;
        appointment.salesRepName = salesRepName;
        appointment.className = type === 'event' ? 'event-event' : 'event-appointment';
        appointment.status = status;
        appointment.token = token;
        appointment.statusLink = statusLink;
        appointment.extendedProps = {
            type: type,
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            customerGender: customer.gender || '',
            salesRepId: salesRepId,
            salesRepName: salesRepName,
            notes: notes
        };
        // Save back to array
        appointments[idx] = appointment;
    } else {
        // Create new appointment
        const appointment = {
            id: Date.now().toString(),
            title: title,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            allDay: false,
            duration: duration, // always save duration
            salesRepId: salesRepId,
            salesRepName: salesRepName, // always save salesRepName
            className: type === 'event' ? 'event-event' : 'event-appointment',
            status: status,
            token: token,
            statusLink: statusLink,
            extendedProps: {
                type: type,
                customerId: customer.id,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                customerGender: customer.gender || '',
                salesRepId: salesRepId,
                salesRepName: salesRepName,
                notes: notes
            }
        };    // Save to localStorage
        let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        appointments.push(appointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Also save to global appointments array for immediate use
        if (typeof window.appointments !== 'undefined') {
            window.appointments.push(appointment);
        }
        
        // Try to save to the database if available
        try {
            fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointment)
            }).then(response => {
                if (!response.ok) {
                    console.warn('Could not save appointment to database:', response.status);
                } else {
                    console.log('Appointment saved to database successfully');
                }
            }).catch(err => {
                console.warn('Database save error:', err);
            });
        } catch (e) {
            console.warn('Could not save to database:', e);
        }
        
        // Email sending logic (auto/manual)
        const autoEmail = localStorage.getItem('autoEmail') === 'true';
        const manualEmail = localStorage.getItem('manualEmail') === 'true';
        const template = localStorage.getItem('emailTemplate') ||
            `Hello {customerName},\n\nYour appointment is scheduled for {date}.\nYou can confirm, cancel, or reschedule using this link: {statusLink}\n\nThank you!`;
        if (autoEmail && customer.email) {
            // Prepare email body
            const emailBody = template
                .replace('{customerName}', `${customer.firstName} ${customer.lastName}`)
                .replace('{date}', startDateTime.toLocaleString())
                .replace('{statusLink}', statusLink);
            // Call backend to send email (pseudo, see email_sender.py)
            fetch('/send_simple_email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: customer.email,
                    subject: 'Your Appointment Details',
                    body: emailBody
                })        });
        }
    }
    // Hide modal
    const modal = document.getElementById('create-appointment-modal');
    if (modal) {
        console.log('Hiding create appointment modal');
        modal.style.display = 'none';
    } else {
        console.error('Create appointment modal element not found');
    }
    // Reset form
    const form = document.getElementById('appointment-form');
    if (form) {
        console.log('Resetting appointment form');
        form.reset();
    }
    // Remove the customer selection result
    const customerSelectionResult = document.querySelector('.customer-selection-result');
    if (customerSelectionResult) {
        customerSelectionResult.remove();
    }
    
    // Show success notification instead of alert
    if (typeof showNotification === 'function') {
        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`, 'success');
    } else {
        console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`);
    }    // Make sure the appointment is properly added to all needed places
    // Global appointments array (ensure it exists)
    window.appointments = window.appointments || [];
    
    // Avoid duplicates by removing any existing appointment with the same ID
    window.appointments = window.appointments.filter(a => a.id !== appointment.id);
    
    // Add the new appointment
    window.appointments.push(appointment);
    
    console.log('New appointment added:', appointment.title);
    
    // Use a consistent approach to update the calendar to avoid duplicates
    console.log('Updating calendar with new appointment');
    
    // First try to get the calendar instance
    let calendarEl = document.getElementById('calendar');
    let calendar = null;
    
    if (calendarEl) {
        calendar = calendarEl._calendar || window.calendar || document.monumeCalendar;
    }
    
    // First method: update through our dedicated function
    if (typeof updateCalendarEvents === 'function') {
        console.log('Refreshing calendar with updateCalendarEvents()');
        updateCalendarEvents();
    }    // Fallback method: direct calendar update
    else if (calendar) {
        console.log('Refreshing calendar directly');
        calendar.removeAllEvents();
        
        // Add all appointments
        window.appointments.forEach(apt => {
            // Display the exact time that was chosen, no icons
            let displayTime;
            
            if (apt.time) {
                // Use the exact time chosen by the user
                try {
                    // Try to format the time string directly
                    const timeStr = apt.time;
                    const [hours, minutes] = timeStr.split(':');
                    const timeDate = new Date();
                    timeDate.setHours(parseInt(hours, 10));
                    timeDate.setMinutes(parseInt(minutes, 10));
                    displayTime = timeDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                } catch(err) {
                    // Fallback to start time
                    displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                }
            } else {
                // Fallback if no specific time property
                displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
            }
            
            calendar.addEvent({
                id: apt.id,
                title: displayTime, // Just the time, no icons
                start: apt.start,
                end: apt.end,
                backgroundColor: '#d6b9e4',
                borderColor: '#9b59b6',
                textColor: '#333',
                classNames: ['appointment-event', `status-${apt.status || 'scheduled'}`]
            });
        });
        
        // Force a calendar re-render
        calendar.render();
    }
    
    // Update statistics if possible
    if (typeof updateStatistics === 'function') {
        updateStatistics();
    }
    
    return true;
}

/**
 * Reset the appointment form
 */
function resetAppointmentForm() {
    // Clear form
    document.getElementById('appointment-form').reset();
    document.getElementById('save-appointment').removeAttribute('data-appointment-id');
    
    // Reset customer selection
    selectedCustomerForAppointment = null;
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    customerLabel.textContent = 'Customer';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
}

/**
 * Show appointment details
 */
function showAppointmentDetails(event) {
    // Support both event object and appointment object
    const appointment = event.extendedProps ? event : appointments.find(a => a.id == event.id);
    if (!appointment) return;
    // Get customer details
    const customer = customers.find(c => c.id == (appointment.extendedProps?.customerId || appointment.customerId));
    // Update modal with appointment details
    document.getElementById('modal-title').textContent = appointment.title;
    document.getElementById('modal-type').textContent = (appointment.extendedProps?.type || appointment.type || '').charAt(0).toUpperCase() + (appointment.extendedProps?.type || appointment.type || '').slice(1);
    // Format date and time
    const start = new Date(appointment.start);
    const end = new Date(appointment.end);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('modal-datetime').textContent = start.toLocaleString(undefined, options);
    // Duration: use saved duration if present, else calculate
    let duration = appointment.duration || (appointment.extendedProps && appointment.extendedProps.duration);
    if (!duration && appointment.start && appointment.end) {
        duration = Math.round((end - start) / 60000);
    }
    document.getElementById('modal-duration').textContent = duration ? `${duration} minutes` : 'N/A';
    // Appointment Host: always use salesRepName if present
    const host = appointment.salesRepName || (appointment.extendedProps && appointment.extendedProps.salesRepName) || appointment.salesRep || (appointment.extendedProps && appointment.extendedProps.salesRep) || 'Not specified';
    document.getElementById('modal-sales-rep').textContent = host;
    // Set customer information
    document.getElementById('modal-customer').textContent = customer ? `${customer.firstName} ${customer.lastName} (${customer.phone})` : (appointment.extendedProps?.customerName || 'Unknown Customer');
    document.getElementById('modal-notes').textContent = (appointment.extendedProps?.notes || appointment.notes || 'No notes available');
    // Display status
    const statusElement = document.getElementById('modal-status');
    const status = appointment.status || 'scheduled';
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusElement.className = 'appointment-status status-' + status.toLowerCase();
    // Add status explanation if status link exists
    if (appointment.statusLink) {
        const statusNoteEl = document.getElementById('modal-status-note');
        if (statusNoteEl) {
            statusNoteEl.textContent = 'This appointment can be confirmed, cancelled, or rescheduled by the customer.';
        }
    }
    // Set the status link if available
    const linkContainer = document.getElementById('status-link-container');
    const statusLinkInput = document.getElementById('status-link');
    if (linkContainer && statusLinkInput && appointment.statusLink) {
        linkContainer.style.display = '';
        statusLinkInput.value = appointment.statusLink;
    } else if (linkContainer) {
        linkContainer.style.display = 'none';
    }
    // Set appointment ID for edit/delete/share buttons
    document.getElementById('delete-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('edit-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('share-appointment-link').dataset.appointmentId = appointmentId;
    document.getElementById('send-email-manually').dataset.appointmentId = appointmentId;
    // Show modal
    document.getElementById('appointment-modal').style.display = 'block';
}

/**
 * Edit an appointment
 */
function editAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id == appointmentId);
    if (!appointment) return;

    // Get customer (handle both new and legacy formats)
    let customerId = appointment.extendedProps?.customerId || appointment.customerId;
    const customer = customers.find(c => c.id == customerId);
    selectedCustomerForAppointment = customer;

    // Pre-fill all fields in the form
    document.getElementById('appointment-title').value = appointment.title || '';
    document.getElementById('appointment-type').value = appointment.extendedProps?.type || appointment.type || '';
    // Extract date and time from ISO string if needed
    let startDate = '', startTime = '';
    if (appointment.start) {
        const start = new Date(appointment.start);
        startDate = start.toISOString().split('T')[0];
        startTime = start.toTimeString().slice(0,5);
    } else {
        startDate = appointment.date || '';
        startTime = appointment.time || '';
    }
    document.getElementById('appointment-date').value = startDate;
    document.getElementById('appointment-time').value = startTime;
    document.getElementById('appointment-duration').value = appointment.duration || appointment.extendedProps?.duration || 30;
    document.getElementById('appointment-sales-rep').value = appointment.salesRepId || appointment.extendedProps?.salesRepId || appointment.salesRep || '';
    document.getElementById('appointment-notes').value = appointment.extendedProps?.notes || appointment.notes || '';

    // Set customer selection
    let selectedCustomerIdInput = document.getElementById('selected-customer-id');
    if (!selectedCustomerIdInput) {
        selectedCustomerIdInput = document.createElement('input');
        selectedCustomerIdInput.type = 'hidden';
        selectedCustomerIdInput.id = 'selected-customer-id';
        document.getElementById('appointment-form').appendChild(selectedCustomerIdInput);
    }
    selectedCustomerIdInput.value = customerId;

    // Add visual indication of the selected customer
    const addCustomerBtn = document.getElementById('add-customer-for-appointment');
    const existingResult = document.querySelector('.customer-selection-result');
    if (existingResult) existingResult.remove();
    if (addCustomerBtn && customer) {
        const customerSelectionResult = document.createElement('div');
        customerSelectionResult.classList.add('customer-selection-result');
        customerSelectionResult.innerHTML = `
            <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
                <strong>${customer.firstName} ${customer.lastName}</strong><br>
                <small>${customer.phone}${customer.email ? ' | ' + customer.email : ''}${customer.gender ? ' | ' + customer.gender : ''}</small>
            </div>
        `;
        addCustomerBtn.insertAdjacentElement('afterend', customerSelectionResult);
    }

    // Store original date/time for change detection
    document.getElementById('save-appointment').dataset.editing = 'true';
    document.getElementById('save-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('save-appointment').dataset.originalDate = startDate;
    document.getElementById('save-appointment').dataset.originalTime = startTime;

    // Update customer label
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    if (customer) {
        customerLabel.textContent = `Customer: ${customer.firstName} ${customer.lastName}`;
    } else {
        customerLabel.textContent = 'Customer';
    }

    // Hide details modal and show edit modal
    document.getElementById('appointment-modal').style.display = 'none';
    document.getElementById('create-appointment-modal').style.display = 'block';
}

/**
 * Save an appointment (handles both new and edit mode)
 */
function saveAppointment() {
    // Get form values
    const title = document.getElementById('appointment-title').value;
    const type = document.getElementById('appointment-type').value;
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const duration = parseInt(document.getElementById('appointment-duration').value);
    const salesRepId = document.getElementById('appointment-sales-rep').value;
    const salesRepName = document.getElementById('appointment-sales-rep').selectedOptions[0]?.textContent || '';
    const notes = document.getElementById('appointment-notes').value;
    // Validation
    if (!title || !date || !type || !salesRepId) {
        if (typeof showNotification === 'function') {
            showNotification('Please fill in all required fields', 'error');
        } else {
            alert('Please fill in all required fields');
        }
        return false;
    }
    // For appointments, validate customer selection
    const customerIdElement = document.getElementById('selected-customer-id');
    if (!customerIdElement) {
        if (typeof showNotification === 'function') {
            showNotification('Please add a customer for this appointment', 'error');
        } else {
            alert('Please add a customer for this appointment');
        }
        return false;
    }
    const customerId = customerIdElement.value;
    // Find customer info
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customer = customers.find(c => c.id == customerId);
    if (!customer) {
        if (typeof showNotification === 'function') {
            showNotification('Please select a valid customer', 'error');
        } else {
            alert('Please select a valid customer');
        }
        return false;
    }
    // Calculate start and end
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // Check if editing
    const saveBtn = document.getElementById('save-appointment');
    const isEditing = saveBtn.dataset.editing === 'true';
    const editingId = saveBtn.dataset.appointmentId;
    const originalDate = saveBtn.dataset.originalDate;
    const originalTime = saveBtn.dataset.originalTime;

    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    let appointment;
    let status = 'scheduled';
    let token, statusLink;

    if (isEditing && editingId) {
        // Find and update existing appointment
        const idx = appointments.findIndex(a => a.id == editingId);
        if (idx === -1) {
            showNotification ? showNotification('Error: Appointment not found.', 'error') : alert('Error: Appointment not found.');
            return false;
        }
        appointment = appointments[idx];
        // Detect if date or time changed
        const dateChanged = (originalDate !== date);
        const timeChanged = (originalTime !== time);
        // Keep the same token and statusLink
        token = appointment.token;
        statusLink = appointment.statusLink;
        // If date or time changed, set status to 'rescheduled'
        if (dateChanged || timeChanged) {
            status = 'rescheduled';
        } else {
            status = appointment.status || 'scheduled';
        }
        // Update appointment fields
        appointment.title = title;
        appointment.start = startDateTime.toISOString();
        appointment.end = endDateTime.toISOString();
        appointment.allDay = false;
        appointment.duration = duration;
        appointment.salesRepId = salesRepId;
        appointment.salesRepName = salesRepName;
        appointment.className = type === 'event' ? 'event-event' : 'event-appointment';
        appointment.status = status;
        appointment.token = token;
        appointment.statusLink = statusLink;
        appointment.extendedProps = {
            type: type,
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            customerGender: customer.gender || '',
            salesRepId: salesRepId,
            salesRepName: salesRepName,
            notes: notes
        };
        // Save back to array
        appointments[idx] = appointment;
    } else {
        // Create new appointment
        const appointment = {
            id: Date.now().toString(),
            title: title,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            allDay: false,
            duration: duration, // always save duration
            salesRepId: salesRepId,
            salesRepName: salesRepName, // always save salesRepName
            className: type === 'event' ? 'event-event' : 'event-appointment',
            status: status,
            token: token,
            statusLink: statusLink,
            extendedProps: {
                type: type,
                customerId: customer.id,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                customerGender: customer.gender || '',
                salesRepId: salesRepId,
                salesRepName: salesRepName,
                notes: notes
            }
        };    // Save to localStorage
        let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        appointments.push(appointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Also save to global appointments array for immediate use
        if (typeof window.appointments !== 'undefined') {
            window.appointments.push(appointment);
        }
        
        // Try to save to the database if available
        try {
            fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointment)
            }).then(response => {
                if (!response.ok) {
                    console.warn('Could not save appointment to database:', response.status);
                } else {
                    console.log('Appointment saved to database successfully');
                }
            }).catch(err => {
                console.warn('Database save error:', err);
            });
        } catch (e) {
            console.warn('Could not save to database:', e);
        }
        
        // Email sending logic (auto/manual)
        const autoEmail = localStorage.getItem('autoEmail') === 'true';
        const manualEmail = localStorage.getItem('manualEmail') === 'true';
        const template = localStorage.getItem('emailTemplate') ||
            `Hello {customerName},\n\nYour appointment is scheduled for {date}.\nYou can confirm, cancel, or reschedule using this link: {statusLink}\n\nThank you!`;
        if (autoEmail && customer.email) {
            // Prepare email body
            const emailBody = template
                .replace('{customerName}', `${customer.firstName} ${customer.lastName}`)
                .replace('{date}', startDateTime.toLocaleString())
                .replace('{statusLink}', statusLink);
            // Call backend to send email (pseudo, see email_sender.py)
            fetch('/send_simple_email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: customer.email,
                    subject: 'Your Appointment Details',
                    body: emailBody
                })        });
        }
    }
    // Hide modal
    const modal = document.getElementById('create-appointment-modal');
    if (modal) {
        console.log('Hiding create appointment modal');
        modal.style.display = 'none';
    } else {
        console.error('Create appointment modal element not found');
    }
    // Reset form
    const form = document.getElementById('appointment-form');
    if (form) {
        console.log('Resetting appointment form');
        form.reset();
    }
    // Remove the customer selection result
    const customerSelectionResult = document.querySelector('.customer-selection-result');
    if (customerSelectionResult) {
        customerSelectionResult.remove();
    }
    
    // Show success notification instead of alert
    if (typeof showNotification === 'function') {
        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`, 'success');
    } else {
        console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`);
    }    // Make sure the appointment is properly added to all needed places
    // Global appointments array (ensure it exists)
    window.appointments = window.appointments || [];
    
    // Avoid duplicates by removing any existing appointment with the same ID
    window.appointments = window.appointments.filter(a => a.id !== appointment.id);
    
    // Add the new appointment
    window.appointments.push(appointment);
    
    console.log('New appointment added:', appointment.title);
    
    // Use a consistent approach to update the calendar to avoid duplicates
    console.log('Updating calendar with new appointment');
    
    // First try to get the calendar instance
    let calendarEl = document.getElementById('calendar');
    let calendar = null;
    
    if (calendarEl) {
        calendar = calendarEl._calendar || window.calendar || document.monumeCalendar;
    }
    
    // First method: update through our dedicated function
    if (typeof updateCalendarEvents === 'function') {
        console.log('Refreshing calendar with updateCalendarEvents()');
        updateCalendarEvents();
    }    // Fallback method: direct calendar update
    else if (calendar) {
        console.log('Refreshing calendar directly');
        calendar.removeAllEvents();
        
        // Add all appointments
        window.appointments.forEach(apt => {
            // Display the exact time that was chosen, no icons
            let displayTime;
            
            if (apt.time) {
                // Use the exact time chosen by the user
                try {
                    // Try to format the time string directly
                    const timeStr = apt.time;
                    const [hours, minutes] = timeStr.split(':');
                    const timeDate = new Date();
                    timeDate.setHours(parseInt(hours, 10));
                    timeDate.setMinutes(parseInt(minutes, 10));
                    displayTime = timeDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                } catch(err) {
                    // Fallback to start time
                    displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                }
            } else {
                // Fallback if no specific time property
                displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
            }
            
            calendar.addEvent({
                id: apt.id,
                title: displayTime, // Just the time, no icons
                start: apt.start,
                end: apt.end,
                backgroundColor: '#d6b9e4',
                borderColor: '#9b59b6',
                textColor: '#333',
                classNames: ['appointment-event', `status-${apt.status || 'scheduled'}`]
            });
        });
        
        // Force a calendar re-render
        calendar.render();
    }
    
    // Update statistics if possible
    if (typeof updateStatistics === 'function') {
        updateStatistics();
    }
    
    return true;
}

/**
 * Reset the appointment form
 */
function resetAppointmentForm() {
    // Clear form
    document.getElementById('appointment-form').reset();
    document.getElementById('save-appointment').removeAttribute('data-appointment-id');
    
    // Reset customer selection
    selectedCustomerForAppointment = null;
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    customerLabel.textContent = 'Customer';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
}

/**
 * Show appointment details
 */
function showAppointmentDetails(event) {
    // Support both event object and appointment object
    const appointment = event.extendedProps ? event : appointments.find(a => a.id == event.id);
    if (!appointment) return;
    // Get customer details
    const customer = customers.find(c => c.id == (appointment.extendedProps?.customerId || appointment.customerId));
    // Update modal with appointment details
    document.getElementById('modal-title').textContent = appointment.title;
    document.getElementById('modal-type').textContent = (appointment.extendedProps?.type || appointment.type || '').charAt(0).toUpperCase() + (appointment.extendedProps?.type || appointment.type || '').slice(1);
    // Format date and time
    const start = new Date(appointment.start);
    const end = new Date(appointment.end);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('modal-datetime').textContent = start.toLocaleString(undefined, options);
    // Duration: use saved duration if present, else calculate
    let duration = appointment.duration || (appointment.extendedProps && appointment.extendedProps.duration);
    if (!duration && appointment.start && appointment.end) {
        duration = Math.round((end - start) / 60000);
    }
    document.getElementById('modal-duration').textContent = duration ? `${duration} minutes` : 'N/A';
    // Appointment Host: always use salesRepName if present
    const host = appointment.salesRepName || (appointment.extendedProps && appointment.extendedProps.salesRepName) || appointment.salesRep || (appointment.extendedProps && appointment.extendedProps.salesRep) || 'Not specified';
    document.getElementById('modal-sales-rep').textContent = host;
    // Set customer information
    document.getElementById('modal-customer').textContent = customer ? `${customer.firstName} ${customer.lastName} (${customer.phone})` : (appointment.extendedProps?.customerName || 'Unknown Customer');
    document.getElementById('modal-notes').textContent = (appointment.extendedProps?.notes || appointment.notes || 'No notes available');
    // Display status
    const statusElement = document.getElementById('modal-status');
    const status = appointment.status || 'scheduled';
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusElement.className = 'appointment-status status-' + status.toLowerCase();
    // Add status explanation if status link exists
    if (appointment.statusLink) {
        const statusNoteEl = document.getElementById('modal-status-note');
        if (statusNoteEl) {
            statusNoteEl.textContent = 'This appointment can be confirmed, cancelled, or rescheduled by the customer.';
        }
    }
    // Set the status link if available
    const linkContainer = document.getElementById('status-link-container');
    const statusLinkInput = document.getElementById('status-link');
    if (linkContainer && statusLinkInput && appointment.statusLink) {
        linkContainer.style.display = '';
        statusLinkInput.value = appointment.statusLink;
    } else if (linkContainer) {
        linkContainer.style.display = 'none';
    }
    // Set appointment ID for edit/delete/share buttons
    document.getElementById('delete-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('edit-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('share-appointment-link').dataset.appointmentId = appointmentId;
    document.getElementById('send-email-manually').dataset.appointmentId = appointmentId;
    // Show modal
    document.getElementById('appointment-modal').style.display = 'block';
}

/**
 * Edit an appointment
 */
function editAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id == appointmentId);
    if (!appointment) return;

    // Get customer (handle both new and legacy formats)
    let customerId = appointment.extendedProps?.customerId || appointment.customerId;
    const customer = customers.find(c => c.id == customerId);
    selectedCustomerForAppointment = customer;

    // Pre-fill all fields in the form
    document.getElementById('appointment-title').value = appointment.title || '';
    document.getElementById('appointment-type').value = appointment.extendedProps?.type || appointment.type || '';
    // Extract date and time from ISO string if needed
    let startDate = '', startTime = '';
    if (appointment.start) {
        const start = new Date(appointment.start);
        startDate = start.toISOString().split('T')[0];
        startTime = start.toTimeString().slice(0,5);
    } else {
        startDate = appointment.date || '';
        startTime = appointment.time || '';
    }
    document.getElementById('appointment-date').value = startDate;
    document.getElementById('appointment-time').value = startTime;
    document.getElementById('appointment-duration').value = appointment.duration || appointment.extendedProps?.duration || 30;
    document.getElementById('appointment-sales-rep').value = appointment.salesRepId || appointment.extendedProps?.salesRepId || appointment.salesRep || '';
    document.getElementById('appointment-notes').value = appointment.extendedProps?.notes || appointment.notes || '';

    // Set customer selection
    let selectedCustomerIdInput = document.getElementById('selected-customer-id');
    if (!selectedCustomerIdInput) {
        selectedCustomerIdInput = document.createElement('input');
        selectedCustomerIdInput.type = 'hidden';
        selectedCustomerIdInput.id = 'selected-customer-id';
        document.getElementById('appointment-form').appendChild(selectedCustomerIdInput);
    }
    selectedCustomerIdInput.value = customerId;

    // Add visual indication of the selected customer
    const addCustomerBtn = document.getElementById('add-customer-for-appointment');
    const existingResult = document.querySelector('.customer-selection-result');
    if (existingResult) existingResult.remove();
    if (addCustomerBtn && customer) {
        const customerSelectionResult = document.createElement('div');
        customerSelectionResult.classList.add('customer-selection-result');
        customerSelectionResult.innerHTML = `
            <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
                <strong>${customer.firstName} ${customer.lastName}</strong><br>
                <small>${customer.phone}${customer.email ? ' | ' + customer.email : ''}${customer.gender ? ' | ' + customer.gender : ''}</small>
            </div>
        `;
        addCustomerBtn.insertAdjacentElement('afterend', customerSelectionResult);
    }

    // Store original date/time for change detection
    document.getElementById('save-appointment').dataset.editing = 'true';
    document.getElementById('save-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('save-appointment').dataset.originalDate = startDate;
    document.getElementById('save-appointment').dataset.originalTime = startTime;

    // Update customer label
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    if (customer) {
        customerLabel.textContent = `Customer: ${customer.firstName} ${customer.lastName}`;
    } else {
        customerLabel.textContent = 'Customer';
    }

    // Hide details modal and show edit modal
    document.getElementById('appointment-modal').style.display = 'none';
    document.getElementById('create-appointment-modal').style.display = 'block';
}

/**
 * Save an appointment (handles both new and edit mode)
 */
function saveAppointment() {
    // Get form values
    const title = document.getElementById('appointment-title').value;
    const type = document.getElementById('appointment-type').value;
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const duration = parseInt(document.getElementById('appointment-duration').value);
    const salesRepId = document.getElementById('appointment-sales-rep').value;
    const salesRepName = document.getElementById('appointment-sales-rep').selectedOptions[0]?.textContent || '';
    const notes = document.getElementById('appointment-notes').value;
    // Validation
    if (!title || !date || !type || !salesRepId) {
        if (typeof showNotification === 'function') {
            showNotification('Please fill in all required fields', 'error');
        } else {
            alert('Please fill in all required fields');
        }
        return false;
    }
    // For appointments, validate customer selection
    const customerIdElement = document.getElementById('selected-customer-id');
    if (!customerIdElement) {
        if (typeof showNotification === 'function') {
            showNotification('Please add a customer for this appointment', 'error');
        } else {
            alert('Please add a customer for this appointment');
        }
        return false;
    }
    const customerId = customerIdElement.value;
    // Find customer info
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customer = customers.find(c => c.id == customerId);
    if (!customer) {
        if (typeof showNotification === 'function') {
            showNotification('Please select a valid customer', 'error');
        } else {
            alert('Please select a valid customer');
        }
        return false;
    }
    // Calculate start and end
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // Check if editing
    const saveBtn = document.getElementById('save-appointment');
    const isEditing = saveBtn.dataset.editing === 'true';
    const editingId = saveBtn.dataset.appointmentId;
    const originalDate = saveBtn.dataset.originalDate;
    const originalTime = saveBtn.dataset.originalTime;

    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    let appointment;
    let status = 'scheduled';
    let token, statusLink;

    if (isEditing && editingId) {
        // Find and update existing appointment
        const idx = appointments.findIndex(a => a.id == editingId);
        if (idx === -1) {
            showNotification ? showNotification('Error: Appointment not found.', 'error') : alert('Error: Appointment not found.');
            return false;
        }
        appointment = appointments[idx];
        // Detect if date or time changed
        const dateChanged = (originalDate !== date);
        const timeChanged = (originalTime !== time);
        // Keep the same token and statusLink
        token = appointment.token;
        statusLink = appointment.statusLink;
        // If date or time changed, set status to 'rescheduled'
        if (dateChanged || timeChanged) {
            status = 'rescheduled';
        } else {
            status = appointment.status || 'scheduled';
        }
        // Update appointment fields
        appointment.title = title;
        appointment.start = startDateTime.toISOString();
        appointment.end = endDateTime.toISOString();
        appointment.allDay = false;
        appointment.duration = duration;
        appointment.salesRepId = salesRepId;
        appointment.salesRepName = salesRepName;
        appointment.className = type === 'event' ? 'event-event' : 'event-appointment';
        appointment.status = status;
        appointment.token = token;
        appointment.statusLink = statusLink;
        appointment.extendedProps = {
            type: type,
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            customerGender: customer.gender || '',
            salesRepId: salesRepId,
            salesRepName: salesRepName,
            notes: notes
        };
        // Save back to array
        appointments[idx] = appointment;
    } else {
        // Create new appointment
        const appointment = {
            id: Date.now().toString(),
            title: title,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            allDay: false,
            duration: duration, // always save duration
            salesRepId: salesRepId,
            salesRepName: salesRepName, // always save salesRepName
            className: type === 'event' ? 'event-event' : 'event-appointment',
            status: status,
            token: token,
            statusLink: statusLink,
            extendedProps: {
                type: type,
                customerId: customer.id,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                customerGender: customer.gender || '',
                salesRepId: salesRepId,
                salesRepName: salesRepName,
                notes: notes
            }
        };    // Save to localStorage
        let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        appointments.push(appointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Also save to global appointments array for immediate use
        if (typeof window.appointments !== 'undefined') {
            window.appointments.push(appointment);
        }
        
        // Try to save to the database if available
        try {
            fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointment)
            }).then(response => {
                if (!response.ok) {
                    console.warn('Could not save appointment to database:', response.status);
                } else {
                    console.log('Appointment saved to database successfully');
                }
            }).catch(err => {
                console.warn('Database save error:', err);
            });
        } catch (e) {
            console.warn('Could not save to database:', e);
        }
        
        // Email sending logic (auto/manual)
        const autoEmail = localStorage.getItem('autoEmail') === 'true';
        const manualEmail = localStorage.getItem('manualEmail') === 'true';
        const template = localStorage.getItem('emailTemplate') ||
            `Hello {customerName},\n\nYour appointment is scheduled for {date}.\nYou can confirm, cancel, or reschedule using this link: {statusLink}\n\nThank you!`;
        if (autoEmail && customer.email) {
            // Prepare email body
            const emailBody = template
                .replace('{customerName}', `${customer.firstName} ${customer.lastName}`)
                .replace('{date}', startDateTime.toLocaleString())
                .replace('{statusLink}', statusLink);
            // Call backend to send email (pseudo, see email_sender.py)
            fetch('/send_simple_email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: customer.email,
                    subject: 'Your Appointment Details',
                    body: emailBody
                })        });
        }
    }
    // Hide modal
    const modal = document.getElementById('create-appointment-modal');
    if (modal) {
        console.log('Hiding create appointment modal');
        modal.style.display = 'none';
    } else {
        console.error('Create appointment modal element not found');
    }
    // Reset form
    const form = document.getElementById('appointment-form');
    if (form) {
        console.log('Resetting appointment form');
        form.reset();
    }
    // Remove the customer selection result
    const customerSelectionResult = document.querySelector('.customer-selection-result');
    if (customerSelectionResult) {
        customerSelectionResult.remove();
    }
    
    // Show success notification instead of alert
    if (typeof showNotification === 'function') {
        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`, 'success');
    } else {
        console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`);
    }    // Make sure the appointment is properly added to all needed places
    // Global appointments array (ensure it exists)
    window.appointments = window.appointments || [];
    
    // Avoid duplicates by removing any existing appointment with the same ID
    window.appointments = window.appointments.filter(a => a.id !== appointment.id);
    
    // Add the new appointment
    window.appointments.push(appointment);
    
    console.log('New appointment added:', appointment.title);
    
    // Use a consistent approach to update the calendar to avoid duplicates
    console.log('Updating calendar with new appointment');
    
    // First try to get the calendar instance
    let calendarEl = document.getElementById('calendar');
    let calendar = null;
    
    if (calendarEl) {
        calendar = calendarEl._calendar || window.calendar || document.monumeCalendar;
    }
    
    // First method: update through our dedicated function
    if (typeof updateCalendarEvents === 'function') {
        console.log('Refreshing calendar with updateCalendarEvents()');
        updateCalendarEvents();
    }    // Fallback method: direct calendar update
    else if (calendar) {
        console.log('Refreshing calendar directly');
        calendar.removeAllEvents();
        
        // Add all appointments
        window.appointments.forEach(apt => {
            // Display the exact time that was chosen, no icons
            let displayTime;
            
            if (apt.time) {
                // Use the exact time chosen by the user
                try {
                    // Try to format the time string directly
                    const timeStr = apt.time;
                    const [hours, minutes] = timeStr.split(':');
                    const timeDate = new Date();
                    timeDate.setHours(parseInt(hours, 10));
                    timeDate.setMinutes(parseInt(minutes, 10));
                    displayTime = timeDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                } catch(err) {
                    // Fallback to start time
                    displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                }
            } else {
                // Fallback if no specific time property
                displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
            }
            
            calendar.addEvent({
                id: apt.id,
                title: displayTime, // Just the time, no icons
                start: apt.start,
                end: apt.end,
                backgroundColor: '#d6b9e4',
                borderColor: '#9b59b6',
                textColor: '#333',
                classNames: ['appointment-event', `status-${apt.status || 'scheduled'}`]
            });
        });
        
        // Force a calendar re-render
        calendar.render();
    }
    
    // Update statistics if possible
    if (typeof updateStatistics === 'function') {
        updateStatistics();
    }
    
    return true;
}

/**
 * Reset the appointment form
 */
function resetAppointmentForm() {
    // Clear form
    document.getElementById('appointment-form').reset();
    document.getElementById('save-appointment').removeAttribute('data-appointment-id');
    
    // Reset customer selection
    selectedCustomerForAppointment = null;
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    customerLabel.textContent = 'Customer';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
}

/**
 * Show appointment details
 */
function showAppointmentDetails(event) {
    // Support both event object and appointment object
    const appointment = event.extendedProps ? event : appointments.find(a => a.id == event.id);
    if (!appointment) return;
    // Get customer details
    const customer = customers.find(c => c.id == (appointment.extendedProps?.customerId || appointment.customerId));
    // Update modal with appointment details
    document.getElementById('modal-title').textContent = appointment.title;
    document.getElementById('modal-type').textContent = (appointment.extendedProps?.type || appointment.type || '').charAt(0).toUpperCase() + (appointment.extendedProps?.type || appointment.type || '').slice(1);
    // Format date and time
    const start = new Date(appointment.start);
    const end = new Date(appointment.end);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('modal-datetime').textContent = start.toLocaleString(undefined, options);
    // Duration: use saved duration if present, else calculate
    let duration = appointment.duration || (appointment.extendedProps && appointment.extendedProps.duration);
    if (!duration && appointment.start && appointment.end) {
        duration = Math.round((end - start) / 60000);
    }
    document.getElementById('modal-duration').textContent = duration ? `${duration} minutes` : 'N/A';
    // Appointment Host: always use salesRepName if present
    const host = appointment.salesRepName || (appointment.extendedProps && appointment.extendedProps.salesRepName) || appointment.salesRep || (appointment.extendedProps && appointment.extendedProps.salesRep) || 'Not specified';
    document.getElementById('modal-sales-rep').textContent = host;
    // Set customer information
    document.getElementById('modal-customer').textContent = customer ? `${customer.firstName} ${customer.lastName} (${customer.phone})` : (appointment.extendedProps?.customerName || 'Unknown Customer');
    document.getElementById('modal-notes').textContent = (appointment.extendedProps?.notes || appointment.notes || 'No notes available');
    // Display status
    const statusElement = document.getElementById('modal-status');
    const status = appointment.status || 'scheduled';
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusElement.className = 'appointment-status status-' + status.toLowerCase();
    // Add status explanation if status link exists
    if (appointment.statusLink) {
        const statusNoteEl = document.getElementById('modal-status-note');
        if (statusNoteEl) {
            statusNoteEl.textContent = 'This appointment can be confirmed, cancelled, or rescheduled by the customer.';
        }
    }
    // Set the status link if available
    const linkContainer = document.getElementById('status-link-container');
    const statusLinkInput = document.getElementById('status-link');
    if (linkContainer && statusLinkInput && appointment.statusLink) {
        linkContainer.style.display = '';
        statusLinkInput.value = appointment.statusLink;
    } else if (linkContainer) {
        linkContainer.style.display = 'none';
    }
    // Set appointment ID for edit/delete/share buttons
    document.getElementById('delete-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('edit-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('share-appointment-link').dataset.appointmentId = appointmentId;
    document.getElementById('send-email-manually').dataset.appointmentId = appointmentId;
    // Show modal
    document.getElementById('appointment-modal').style.display = 'block';
}

/**
 * Edit an appointment
 */
function editAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id == appointmentId);
    if (!appointment) return;

    // Get customer (handle both new and legacy formats)
    let customerId = appointment.extendedProps?.customerId || appointment.customerId;
    const customer = customers.find(c => c.id == customerId);
    selectedCustomerForAppointment = customer;

    // Pre-fill all fields in the form
    document.getElementById('appointment-title').value = appointment.title || '';
    document.getElementById('appointment-type').value = appointment.extendedProps?.type || appointment.type || '';
    // Extract date and time from ISO string if needed
    let startDate = '', startTime = '';
    if (appointment.start) {
        const start = new Date(appointment.start);
        startDate = start.toISOString().split('T')[0];
        startTime = start.toTimeString().slice(0,5);
    } else {
        startDate = appointment.date || '';
        startTime = appointment.time || '';
    }
    document.getElementById('appointment-date').value = startDate;
    document.getElementById('appointment-time').value = startTime;
    document.getElementById('appointment-duration').value = appointment.duration || appointment.extendedProps?.duration || 30;
    document.getElementById('appointment-sales-rep').value = appointment.salesRepId || appointment.extendedProps?.salesRepId || appointment.salesRep || '';
    document.getElementById('appointment-notes').value = appointment.extendedProps?.notes || appointment.notes || '';

    // Set customer selection
    let selectedCustomerIdInput = document.getElementById('selected-customer-id');
    if (!selectedCustomerIdInput) {
        selectedCustomerIdInput = document.createElement('input');
        selectedCustomerIdInput.type = 'hidden';
        selectedCustomerIdInput.id = 'selected-customer-id';
        document.getElementById('appointment-form').appendChild(selectedCustomerIdInput);
    }
    selectedCustomerIdInput.value = customerId;

    // Add visual indication of the selected customer
    const addCustomerBtn = document.getElementById('add-customer-for-appointment');
    const existingResult = document.querySelector('.customer-selection-result');
    if (existingResult) existingResult.remove();
    if (addCustomerBtn && customer) {
        const customerSelectionResult = document.createElement('div');
        customerSelectionResult.classList.add('customer-selection-result');
        customerSelectionResult.innerHTML = `
            <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
                <strong>${customer.firstName} ${customer.lastName}</strong><br>
                <small>${customer.phone}${customer.email ? ' | ' + customer.email : ''}${customer.gender ? ' | ' + customer.gender : ''}</small>
            </div>
        `;
        addCustomerBtn.insertAdjacentElement('afterend', customerSelectionResult);
    }

    // Store original date/time for change detection
    document.getElementById('save-appointment').dataset.editing = 'true';
    document.getElementById('save-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('save-appointment').dataset.originalDate = startDate;
    document.getElementById('save-appointment').dataset.originalTime = startTime;

    // Update customer label
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    if (customer) {
        customerLabel.textContent = `Customer: ${customer.firstName} ${customer.lastName}`;
    } else {
        customerLabel.textContent = 'Customer';
    }

    // Hide details modal and show edit modal
    document.getElementById('appointment-modal').style.display = 'none';
    document.getElementById('create-appointment-modal').style.display = 'block';
}

/**
 * Save an appointment (handles both new and edit mode)
 */
function saveAppointment() {
    // Get form values
    const title = document.getElementById('appointment-title').value;
    const type = document.getElementById('appointment-type').value;
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const duration = parseInt(document.getElementById('appointment-duration').value);
    const salesRepId = document.getElementById('appointment-sales-rep').value;
    const salesRepName = document.getElementById('appointment-sales-rep').selectedOptions[0]?.textContent || '';
    const notes = document.getElementById('appointment-notes').value;
    // Validation
    if (!title || !date || !type || !salesRepId) {
        if (typeof showNotification === 'function') {
            showNotification('Please fill in all required fields', 'error');
        } else {
            alert('Please fill in all required fields');
        }
        return false;
    }
    // For appointments, validate customer selection
    const customerIdElement = document.getElementById('selected-customer-id');
    if (!customerIdElement) {
        if (typeof showNotification === 'function') {
            showNotification('Please add a customer for this appointment', 'error');
        } else {
            alert('Please add a customer for this appointment');
        }
        return false;
    }
    const customerId = customerIdElement.value;
    // Find customer info
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customer = customers.find(c => c.id == customerId);
    if (!customer) {
        if (typeof showNotification === 'function') {
            showNotification('Please select a valid customer', 'error');
        } else {
            alert('Please select a valid customer');
        }
        return false;
    }
    // Calculate start and end
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // Check if editing
    const saveBtn = document.getElementById('save-appointment');
    const isEditing = saveBtn.dataset.editing === 'true';
    const editingId = saveBtn.dataset.appointmentId;
    const originalDate = saveBtn.dataset.originalDate;
    const originalTime = saveBtn.dataset.originalTime;

    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    let appointment;
    let status = 'scheduled';
    let token, statusLink;

    if (isEditing && editingId) {
        // Find and update existing appointment
        const idx = appointments.findIndex(a => a.id == editingId);
        if (idx === -1) {
            showNotification ? showNotification('Error: Appointment not found.', 'error') : alert('Error: Appointment not found.');
            return false;
        }
        appointment = appointments[idx];
        // Detect if date or time changed
        const dateChanged = (originalDate !== date);
        const timeChanged = (originalTime !== time);
        // Keep the same token and statusLink
        token = appointment.token;
        statusLink = appointment.statusLink;
        // If date or time changed, set status to 'rescheduled'
        if (dateChanged || timeChanged) {
            status = 'rescheduled';
        } else {
            status = appointment.status || 'scheduled';
        }
        // Update appointment fields
        appointment.title = title;
        appointment.start = startDateTime.toISOString();
        appointment.end = endDateTime.toISOString();
        appointment.allDay = false;
        appointment.duration = duration;
        appointment.salesRepId = salesRepId;
        appointment.salesRepName = salesRepName;
        appointment.className = type === 'event' ? 'event-event' : 'event-appointment';
        appointment.status = status;
        appointment.token = token;
        appointment.statusLink = statusLink;
        appointment.extendedProps = {
            type: type,
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            customerGender: customer.gender || '',
            salesRepId: salesRepId,
            salesRepName: salesRepName,
            notes: notes
        };
        // Save back to array
        appointments[idx] = appointment;
    } else {
        // Create new appointment
        const appointment = {
            id: Date.now().toString(),
            title: title,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            allDay: false,
            duration: duration, // always save duration
            salesRepId: salesRepId,
            salesRepName: salesRepName, // always save salesRepName
            className: type === 'event' ? 'event-event' : 'event-appointment',
            status: status,
            token: token,
            statusLink: statusLink,
            extendedProps: {
                type: type,
                customerId: customer.id,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                customerGender: customer.gender || '',
                salesRepId: salesRepId,
                salesRepName: salesRepName,
                notes: notes
            }
        };    // Save to localStorage
        let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        appointments.push(appointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Also save to global appointments array for immediate use
        if (typeof window.appointments !== 'undefined') {
            window.appointments.push(appointment);
        }
        
        // Try to save to the database if available
        try {
            fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointment)
            }).then(response => {
                if (!response.ok) {
                    console.warn('Could not save appointment to database:', response.status);
                } else {
                    console.log('Appointment saved to database successfully');
                }
            }).catch(err => {
                console.warn('Database save error:', err);
            });
        } catch (e) {
            console.warn('Could not save to database:', e);
        }
        
        // Email sending logic (auto/manual)
        const autoEmail = localStorage.getItem('autoEmail') === 'true';
        const manualEmail = localStorage.getItem('manualEmail') === 'true';
        const template = localStorage.getItem('emailTemplate') ||
            `Hello {customerName},\n\nYour appointment is scheduled for {date}.\nYou can confirm, cancel, or reschedule using this link: {statusLink}\n\nThank you!`;
        if (autoEmail && customer.email) {
            // Prepare email body
            const emailBody = template
                .replace('{customerName}', `${customer.firstName} ${customer.lastName}`)
                .replace('{date}', startDateTime.toLocaleString())
                .replace('{statusLink}', statusLink);
            // Call backend to send email (pseudo, see email_sender.py)
            fetch('/send_simple_email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: customer.email,
                    subject: 'Your Appointment Details',
                    body: emailBody
                })        });
        }
    }
    // Hide modal
    const modal = document.getElementById('create-appointment-modal');
    if (modal) {
        console.log('Hiding create appointment modal');
        modal.style.display = 'none';
    } else {
        console.error('Create appointment modal element not found');
    }
    // Reset form
    const form = document.getElementById('appointment-form');
    if (form) {
        console.log('Resetting appointment form');
        form.reset();
    }
    // Remove the customer selection result
    const customerSelectionResult = document.querySelector('.customer-selection-result');
    if (customerSelectionResult) {
        customerSelectionResult.remove();
    }
    
    // Show success notification instead of alert
    if (typeof showNotification === 'function') {
        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`, 'success');
    } else {
        console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`);
    }    // Make sure the appointment is properly added to all needed places
    // Global appointments array (ensure it exists)
    window.appointments = window.appointments || [];
    
    // Avoid duplicates by removing any existing appointment with the same ID
    window.appointments = window.appointments.filter(a => a.id !== appointment.id);
    
    // Add the new appointment
    window.appointments.push(appointment);
    
    console.log('New appointment added:', appointment.title);
    
    // Use a consistent approach to update the calendar to avoid duplicates
    console.log('Updating calendar with new appointment');
    
    // First try to get the calendar instance
    let calendarEl = document.getElementById('calendar');
    let calendar = null;
    
    if (calendarEl) {
        calendar = calendarEl._calendar || window.calendar || document.monumeCalendar;
    }
    
    // First method: update through our dedicated function
    if (typeof updateCalendarEvents === 'function') {
        console.log('Refreshing calendar with updateCalendarEvents()');
        updateCalendarEvents();
    }    // Fallback method: direct calendar update
    else if (calendar) {
        console.log('Refreshing calendar directly');
        calendar.removeAllEvents();
        
        // Add all appointments
        window.appointments.forEach(apt => {
            // Display the exact time that was chosen, no icons
            let displayTime;
            
            if (apt.time) {
                // Use the exact time chosen by the user
                try {
                    // Try to format the time string directly
                    const timeStr = apt.time;
                    const [hours, minutes] = timeStr.split(':');
                    const timeDate = new Date();
                    timeDate.setHours(parseInt(hours, 10));
                    timeDate.setMinutes(parseInt(minutes, 10));
                    displayTime = timeDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                } catch(err) {
                    // Fallback to start time
                    displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
                }
            } else {
                // Fallback if no specific time property
                displayTime = new Date(apt.start).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
            }
            
            calendar.addEvent({
                id: apt.id,
                title: displayTime, // Just the time, no icons
                start: apt.start,
                end: apt.end,
                backgroundColor: '#d6b9e4',
                borderColor: '#9b59b6',
                textColor: '#333',
                classNames: ['appointment-event', `status-${apt.status || 'scheduled'}`]
            });
        });
        
        // Force a calendar re-render
        calendar.render();
    }
    
    // Update statistics if possible
    if (typeof updateStatistics === 'function') {
        updateStatistics();
    }
    
    return true;
}
