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
    // Initialize data
    loadCustomers();
    loadAppointments();
    loadSalesReps();
    updateStatistics();
    
    // Modal event listeners
    setupModalEvents();
    
    // Customer management events
    setupCustomerEvents();
    
    // Appointment form events
    setupAppointmentEvents();
});

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
                modal.style.display = 'none';
            }
        });
    });
    
    // Add appointment button
    document.getElementById('add-appointment-btn').addEventListener('click', function() {
        // Reset form and show modal
        resetAppointmentForm();
        document.getElementById('create-appointment-modal').style.display = 'block';
    });
    
    // Add customer from appointment modal - Fix the event listener
    document.getElementById('add-customer-for-appointment').addEventListener('click', function(e) {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event propagation
        // Show the add customer modal
        document.getElementById('add-customer-modal').style.display = 'block';
    });
    
    // Cancel adding customer
    document.getElementById('cancel-add-customer').addEventListener('click', function() {
        document.getElementById('add-customer-modal').style.display = 'none';
    });
    
    // Close customer modal X button
    document.getElementById('close-customer-modal').addEventListener('click', function() {
        document.getElementById('add-customer-modal').style.display = 'none';
    });
}

/**
 * Initialize customer management events
 */
function setupCustomerEvents() {
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
    
    // Save new customer from modal
    document.getElementById('save-new-customer').addEventListener('click', function() {
        saveNewCustomerFromModal();
    });
    
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
    document.getElementById('save-appointment').addEventListener('click', function() {
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
    } else {
        // Sample data for testing
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        appointments = [
            { 
                id: 1, 
                title: 'Initial Consultation', 
                type: 'consultation', 
                date: today.toISOString().split('T')[0], 
                time: '10:00', 
                duration: 30, 
                customerId: 1, 
                salesRep: 'Sarah Johnson',
                notes: 'Discuss monument options' 
            },
            { 
                id: 2, 
                title: 'Design Review', 
                type: 'service', 
                date: tomorrow.toISOString().split('T')[0], 
                time: '14:00', 
                duration: 45, 
                customerId: 2, 
                salesRep: 'Michael Chen',
                notes: 'Review custom design drafts' 
            }
        ];
        localStorage.setItem('appointments', JSON.stringify(appointments));
    }

    // Update calendar with appointments
    updateCalendarEvents();
}

/**
 * Load sales representatives from users in localStorage
 */
function loadSalesReps() {
    const salesRepSelect = document.getElementById('appointment-sales-rep');
    
    // Get users from localStorage instead of salesReps
    const storedUsers = localStorage.getItem('users');
    
    let salesReps = [];
    if (storedUsers) {
        // Extract user names from the users array
        const users = JSON.parse(storedUsers);
        salesReps = users.map(user => `${user.firstName} ${user.lastName}`);
    } else {
        // Sample data in case no users are found
        salesReps = [
            'Sarah Johnson',
            'Michael Chen',
            'David Wilson',
            'Maria Rodriguez'
        ];
        // We don't save this to localStorage as it should come from the users
    }
    
    // Clear and repopulate select
    salesRepSelect.innerHTML = '<option value="">Select sales representative</option>';
    salesReps.forEach(rep => {
        const option = document.createElement('option');
        option.value = rep;
        option.textContent = rep;
        salesRepSelect.appendChild(option);
    });
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
        
        customerCard.querySelector('.select-customer-btn').addEventListener('click', function() {
            // Open appointment form with this customer selected
            selectCustomerForAppointment(customer.id);
        });
        
        resultsContainer.appendChild(customerCard);
    });
}

/**
 * Save a new customer from the modal form and update the appointment form
 */
function saveNewCustomerFromModal() {
    // Get form values
    const firstName = document.getElementById('new-customer-first-name').value.trim();
    const lastName = document.getElementById('new-customer-last-name').value.trim();
    const phone = document.getElementById('new-customer-phone').value.trim();
    const email = document.getElementById('new-customer-email').value.trim();
    const notes = document.getElementById('new-customer-notes').value.trim();
    
    // Validation
    if (!firstName || !lastName || !phone) {
        alert('Please fill in all required fields (First Name, Last Name, and Phone Number)');
        return;
    }
    
    // Create new customer
    const newCustomer = {
        id: Date.now(), // Use timestamp as ID
        firstName,
        lastName,
        phone,
        email,
        notes
    };
    
    // Add to customers array
    customers.push(newCustomer);
    
    // Save to localStorage
    localStorage.setItem('customers', JSON.stringify(customers));
    
    // Update customer count
    updateStatistics();
    
    // Select this customer for the appointment
    selectedCustomerForAppointment = newCustomer;
    
    // Create a hidden input to store the customer ID (this was missing)
    let selectedCustomerIdInput = document.getElementById('selected-customer-id');
    if (!selectedCustomerIdInput) {
        selectedCustomerIdInput = document.createElement('input');
        selectedCustomerIdInput.type = 'hidden';
        selectedCustomerIdInput.id = 'selected-customer-id';
        document.getElementById('appointment-form').appendChild(selectedCustomerIdInput);
    }
    selectedCustomerIdInput.value = newCustomer.id;
    
    // Update UI to show selected customer
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    customerLabel.textContent = `Customer: ${newCustomer.firstName} ${newCustomer.lastName}`;
    
    // Clear and hide modal
    document.getElementById('add-customer-form').reset();
    document.getElementById('add-customer-modal').style.display = 'none';
    
    // Show success message
    alert(`Customer ${firstName} ${lastName} has been added and selected for this appointment.`);
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
    const title = document.getElementById('appointment-title').value.trim();
    // Removed appointment type field
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const duration = document.getElementById('appointment-duration').value;
    const salesRep = document.getElementById('appointment-sales-rep').value;
    const notes = document.getElementById('appointment-notes').value.trim();
    
    // Validation - removed type from required fields check
    if (!title || !date || !time || !duration || !salesRep) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (!selectedCustomerForAppointment) {
        alert('Please select or add a customer for this appointment');
        return;
    }
    
    // Create appointment object
    const appointmentId = document.getElementById('save-appointment').dataset.appointmentId || Date.now();
    const appointment = {
        id: parseInt(appointmentId),
        title,
        // Set type to a default value since we're not collecting it anymore
        type: 'appointment',
        date,
        time,
        duration: parseInt(duration),
        customerId: selectedCustomerForAppointment.id,
        salesRep,
        notes
    };
    
    // Check if editing or creating
    const existingIndex = appointments.findIndex(a => a.id == appointmentId);
    if (existingIndex !== -1) {
        appointments[existingIndex] = appointment;
    } else {
        appointments.push(appointment);
    }
    
    // Save to localStorage
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Update UI
    document.getElementById('create-appointment-modal').style.display = 'none';
    updateCalendarEvents();
    updateStatistics();
    
    // Success message
    alert('Appointment saved successfully!');
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
    const appointmentId = event.id;
    const appointment = appointments.find(a => a.id == appointmentId);
    if (!appointment) return;
    
    // Get customer details
    const customer = customers.find(c => c.id == appointment.customerId);
    
    // Update modal with appointment details
    document.getElementById('modal-title').textContent = appointment.title;
    document.getElementById('modal-type').textContent = appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1);
    
    // Format date and time
    const dateObj = new Date(`${appointment.date}T${appointment.time}`);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('modal-datetime').textContent = dateObj.toLocaleString(undefined, options);
    
    document.getElementById('modal-duration').textContent = `${appointment.duration} minutes`;
    document.getElementById('modal-customer').textContent = customer ? `${customer.firstName} ${customer.lastName} (${customer.phone})` : 'Unknown Customer';
    document.getElementById('modal-sales-rep').textContent = appointment.salesRep;
    document.getElementById('modal-notes').textContent = appointment.notes || 'No notes available';
    
    // Set appointment ID for edit/delete buttons
    document.getElementById('delete-appointment').dataset.appointmentId = appointmentId;
    document.getElementById('edit-appointment').dataset.appointmentId = appointmentId;
    
    // Show modal
    document.getElementById('appointment-modal').style.display = 'block';
}

/**
 * Edit an appointment
 */
function editAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id == appointmentId);
    if (!appointment) return;
    
    // Get customer
    const customer = customers.find(c => c.id == appointment.customerId);
    selectedCustomerForAppointment = customer;
    
    // Populate form
    document.getElementById('appointment-title').value = appointment.title;
    document.getElementById('appointment-type').value = appointment.type;
    document.getElementById('appointment-date').value = appointment.date;
    document.getElementById('appointment-time').value = appointment.time;
    document.getElementById('appointment-duration').value = appointment.duration;
    document.getElementById('appointment-sales-rep').value = appointment.salesRep;
    document.getElementById('appointment-notes').value = appointment.notes || '';
    
    // Set appointment ID for save button
    document.getElementById('save-appointment').dataset.appointmentId = appointmentId;
    
    // Update customer label
    const customerLabel = document.querySelector('label[for="customer-selection"]');
    customerLabel.textContent = `Customer: ${customer.firstName} ${customer.lastName}`;
    
    // Hide details modal and show edit modal
    document.getElementById('appointment-modal').style.display = 'none';
    document.getElementById('create-appointment-modal').style.display = 'block';
}

/**
 * Delete an appointment
 */
function deleteAppointment(appointmentId) {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    
    // Remove appointment
    const index = appointments.findIndex(a => a.id == appointmentId);
    if (index !== -1) {
        appointments.splice(index, 1);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Update UI
        document.getElementById('appointment-modal').style.display = 'none';
        updateCalendarEvents();
        updateStatistics();
        
        alert('Appointment deleted successfully!');
    }
}

/**
 * Update calendar events
 */
function updateCalendarEvents() {
    // Get calendar instance
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    const calendar = calendarEl._calendar;
    if (!calendar) return;
    
    // Clear existing events
    calendar.removeAllEvents();
    
    // Add appointments as events
    appointments.forEach(appointment => {
        const customer = customers.find(c => c.id == appointment.customerId);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown';
        
        calendar.addEvent({
            id: appointment.id,
            title: `${appointment.title} - ${customerName}`,
            start: `${appointment.date}T${appointment.time}`,
            end: getEndTime(appointment.date, appointment.time, appointment.duration),
            allDay: false,
            extendedProps: {
                type: appointment.type,
                salesRep: appointment.salesRep,
                customerId: appointment.customerId
            }
        });
    });
}

/**
 * Calculate end time based on start time and duration
 */
function getEndTime(date, time, duration) {
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    return endDateTime.toISOString();
}

/**
 * Update statistics
 */
function updateStatistics() {
    // Update customer count
    document.getElementById('customer-count').textContent = customers.length;
    
    // Today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayCount = appointments.filter(a => a.date === today).length;
    document.getElementById('today-count').textContent = todayCount;
    
    // Upcoming appointments (next 7 days)
    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    const upcomingCount = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= now && appointmentDate <= oneWeekLater;
    }).length;
    
    document.getElementById('upcoming-count').textContent = upcomingCount;
}

/**
 * Get appointments for calendar initialization
 */
function getAppointments() {
    const storedAppointments = localStorage.getItem('appointments');
    if (!storedAppointments) return [];
    
    const appointments = JSON.parse(storedAppointments);
    const events = [];
    
    appointments.forEach(appointment => {
        const customer = customers.find(c => c.id == appointment.customerId);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown';
        
        events.push({
            id: appointment.id,
            title: `${appointment.title} - ${customerName}`,
            start: `${appointment.date}T${appointment.time}`,
            end: getEndTime(appointment.date, appointment.time, appointment.duration),
            allDay: false,
            extendedProps: {
                type: appointment.type,
                salesRep: appointment.salesRep,
                customerId: appointment.customerId
            }
        });
    });
    
    return events;
}