/**
 * Phone search functionality for customer lookup
 * 
 * CSS Styles for phone search components
 */

// Add CSS styles for phone search
const phoneSearchStyles = document.createElement('style');
phoneSearchStyles.textContent = `
    .phone-input-wrapper {
        position: relative;
    }
    
    .phone-search-results {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: white;
        z-index: 1000;
        margin-top: 2px;
    }
    
    .phone-search-item {
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.2s;
    }
    
    .phone-search-item:hover {
        background-color: #f8f8f8;
    }
    
    .phone-search-item strong {
        color: #FF9562;
        display: block;
        margin-bottom: 3px;
    }
    
    .phone-search-item div {
        font-size: 0.9em;
        color: #666;
    }
`;
document.head.appendChild(phoneSearchStyles);

document.addEventListener('DOMContentLoaded', function() {
    // Add phone number search functionality
    const phoneInput = document.getElementById('new-customer-phone');
    const phoneSearchResults = document.getElementById('phone-search-results');
    
    if (phoneInput && phoneSearchResults) {
        phoneInput.addEventListener('input', function() {
            const phone = this.value.trim();
            
            if (phone.length < 3) {
                phoneSearchResults.innerHTML = '';
                phoneSearchResults.style.display = 'none';
                return;
            }
            
            // Get customers from localStorage
            let customers = [];
            try {
                const storedCustomers = localStorage.getItem('customers');
                customers = storedCustomers ? JSON.parse(storedCustomers) : [];
            } catch (e) {
                console.error('Error loading customers from localStorage:', e);
                return;
            }
            
            // Filter customers by phone number (partial match)
            const matchingCustomers = customers.filter(customer => 
                customer.phone && customer.phone.includes(phone)
            );
              // Display search results
            phoneSearchResults.innerHTML = '';
            
            if (matchingCustomers.length > 0) {
                // Add a header to the search results
                const resultsHeader = document.createElement('div');
                resultsHeader.className = 'phone-search-header';
                resultsHeader.innerHTML = `<div style="font-weight: bold; padding: 5px; color: #FF9562; border-bottom: 1px solid #eee;">
                    ${matchingCustomers.length} existing customer${matchingCustomers.length > 1 ? 's' : ''} found
                </div>`;
                phoneSearchResults.appendChild(resultsHeader);
                
                matchingCustomers.forEach(customer => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'phone-search-item';
                    
                    // Highlight the matching part of the phone number
                    const phoneHighlighted = customer.phone.replace(
                        new RegExp(phone, 'gi'),
                        match => `<span style="background-color: #FFF3CD; color: #856404;">${match}</span>`
                    );
                    
                    resultItem.innerHTML = `
                        <strong>${customer.firstName} ${customer.lastName}</strong>
                        <div><i class="fas fa-phone"></i> ${phoneHighlighted}</div>
                        ${customer.email ? `<div><i class="fas fa-envelope"></i> ${customer.email}</div>` : ''}
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
                              // Add enhanced visual indication of selected customer
                            const customerSelectionResult = document.createElement('div');
                            customerSelectionResult.classList.add('customer-selection-result');
                            customerSelectionResult.innerHTML = `
                                <div class="selected-customer-info">
                                    <div class="customer-avatar">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="customer-details">
                                        <strong>${customer.firstName} ${customer.lastName}</strong>
                                        <div class="customer-contact-info">
                                            ${customer.phone ? `<span><i class="fas fa-phone"></i> ${customer.phone}</span>` : ''}
                                            ${customer.email ? `<span><i class="fas fa-envelope"></i> ${customer.email}</span>` : ''}
                                        </div>
                                        ${customer.gender ? `<div class="customer-gender"><i class="fas fa-venus-mars"></i> ${customer.gender}</div>` : ''}
                                    </div>
                                    <div class="customer-clear" title="Remove selected customer">
                                        <i class="fas fa-times-circle"></i>
                                    </div>
                                </div>
                            `;
                            
                            // Remove any existing selection result
                            const existingResult = document.querySelector('.customer-selection-result');
                            if (existingResult) {
                                existingResult.remove();
                            }
                              // Add visual indication in the customer selection container
                            const customerSelectionContainer = document.querySelector('.customer-selection-container');
                            if (customerSelectionContainer) {
                                // Update the indicator first
                                const indicator = customerSelectionContainer.querySelector('.customer-selection-indicator');
                                if (indicator) {
                                    indicator.style.display = 'none';
                                }
                                
                                // Then append the selection result
                                customerSelectionContainer.appendChild(customerSelectionResult);
                                
                                // Add event listener to clear button
                                const clearBtn = customerSelectionResult.querySelector('.customer-clear');
                                if (clearBtn) {
                                    clearBtn.addEventListener('click', function(e) {
                                        e.stopPropagation();
                                        customerSelectionResult.remove();
                                        selectedCustomerIdInput.value = '';
                                        
                                        // Show the indicator again
                                        if (indicator) {
                                            indicator.style.display = 'block';
                                        }
                                    });
                                }
                            } else {
                                // Fallback to the old method if the container is not found
                                const addCustomerBtn = document.getElementById('add-customer-for-appointment');
                                if (addCustomerBtn) {
                                    addCustomerBtn.insertAdjacentElement('afterend', customerSelectionResult);
                                }
                            }
                        }
                    });
                    
                    phoneSearchResults.appendChild(resultItem);
                });
                  // Show the search results with improved styling
                phoneSearchResults.style.display = 'block';
                phoneSearchResults.style.maxHeight = '300px';
                phoneSearchResults.style.overflowY = 'auto';
                phoneSearchResults.style.border = '1px solid #ddd';
                phoneSearchResults.style.borderRadius = '4px';
                phoneSearchResults.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            } else {
                phoneSearchResults.innerHTML = `
                    <div class="phone-search-item" style="padding: 10px; color: #856404; background-color: #FFF3CD; border-radius: 4px;">
                        <i class="fas fa-info-circle"></i> No existing customers found with this phone number
                    </div>
                `;
                phoneSearchResults.style.display = 'block';
                phoneSearchResults.style.border = '1px solid #ddd';
                phoneSearchResults.style.borderRadius = '4px';
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
});
