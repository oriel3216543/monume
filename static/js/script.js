// Location Management Functions
async function loadLocations() {
    try {
        const response = await fetch('/get_locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        
        const data = await response.json();
        const locationsContainer = document.getElementById('locations-list');
        if (!locationsContainer) return;
        
        locationsContainer.innerHTML = '';
        data.locations.forEach(location => {
            const locationElement = createLocationElement(location);
            locationsContainer.appendChild(locationElement);
        });
    } catch (error) {
        notifications.error('Error loading locations: ' + error.message);
    }
}

function createLocationElement(location) {
    const div = document.createElement('div');
    div.className = 'location-item';
    div.innerHTML = `
        <div class="location-info">
            <h3>${location.location_name}</h3>
            <p>Mall: ${location.mall}</p>
        </div>
        <div class="location-actions">
            <button onclick="editLocation(${location.id})" class="edit-btn">Edit</button>
            <button onclick="deleteLocation(${location.id})" class="delete-btn">Delete</button>
        </div>
    `;
    return div;
}

async function addLocation(event) {
    event.preventDefault();
    const locationName = document.getElementById('location-name').value;
    const mall = document.getElementById('mall').value;

    if (!locationName || !mall) {
        notifications.error('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/add_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location_name: locationName,
                mall: mall
            })
        });

        if (!response.ok) throw new Error('Failed to add location');

        const data = await response.json();
        notifications.success('Location added successfully');
        document.getElementById('add-location-form').reset();
        await loadLocations();
    } catch (error) {
        notifications.error('Error adding location: ' + error.message);
    }
}

async function editLocation(locationId) {
    try {
        const response = await fetch(`/get_location/${locationId}`);
        if (!response.ok) throw new Error('Failed to fetch location details');
        
        const location = await response.json();
        document.getElementById('edit-location-id').value = location.id;
        document.getElementById('edit-location-name').value = location.location_name;
        document.getElementById('edit-mall').value = location.mall;
        
        // Show edit modal
        document.getElementById('edit-location-modal').style.display = 'block';
    } catch (error) {
        notifications.error('Error loading location details: ' + error.message);
    }
}

async function updateLocation(event) {
    event.preventDefault();
    const locationId = document.getElementById('edit-location-id').value;
    const locationName = document.getElementById('edit-location-name').value;
    const mall = document.getElementById('edit-mall').value;

    if (!locationName || !mall) {
        notifications.error('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/update_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location_id: locationId,
                location_name: locationName,
                mall: mall
            })
        });

        if (!response.ok) throw new Error('Failed to update location');

        notifications.success('Location updated successfully');
        document.getElementById('edit-location-modal').style.display = 'none';
        await loadLocations();
    } catch (error) {
        notifications.error('Error updating location: ' + error.message);
    }
}

async function deleteLocation(locationId) {
    if (!confirm('Are you sure you want to delete this location?')) {
        return;
    }

    try {
        const response = await fetch('/remove_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location_id: locationId
            })
        });

        if (!response.ok) throw new Error('Failed to delete location');

        notifications.success('Location deleted successfully');
        await loadLocations();
    } catch (error) {
        notifications.error('Error deleting location: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const addLocationForm = document.getElementById('add-location-form');
    if (addLocationForm) {
        addLocationForm.addEventListener('submit', addLocation);
    }

    const editLocationForm = document.getElementById('edit-location-form');
    if (editLocationForm) {
        editLocationForm.addEventListener('submit', updateLocation);
    }

    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });

    // Load locations on page load
    if (document.getElementById('locations-list')) {
        loadLocations();
    }
});

// Team Chat Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize team chat if the required elements exist on this page
    if (document.getElementById('chatMessages') || document.getElementById('messageInput')) {
        initializeTeamChat();
    }
});

function initializeTeamChat() {
    // Get DOM elements
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const userSelectionModal = document.getElementById('user-selection-modal');
    const passwordModal = document.getElementById('chat-password-modal');
    
    // Exit if the necessary elements don't exist
    if (!chatMessages || !messageInput || !sendMessageBtn) {
        return;
    }
    
    // Initialize chat data if it doesn't exist
    if (!localStorage.getItem('chatMessages')) {
        localStorage.setItem('chatMessages', JSON.stringify([]));
    }
    
    // Load chat messages
    loadChatMessages();
    
    // Enable send button when message input has content
    messageInput.addEventListener('input', function() {
        sendMessageBtn.disabled = !this.value.trim();
    });
    
    // Send message on enter key
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            e.preventDefault();
            openUserSelectionModal();
        }
    });
    
    // Send message on button click
    sendMessageBtn.addEventListener('click', function() {
        if (messageInput.value.trim()) {
            openUserSelectionModal();
        }
    });
    
    // Set up event listener for closing the user selection modal
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            userSelectionModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === userSelectionModal) {
            userSelectionModal.style.display = 'none';
        }
        if (event.target === passwordModal) {
            passwordModal.style.display = 'none';
        }
    });
    
    // Set up password modal cancel button
    document.getElementById('cancel-chat-auth').addEventListener('click', function() {
        passwordModal.style.display = 'none';
    });
    
    // Set up password modal confirm button
    document.getElementById('confirm-chat-auth').addEventListener('click', verifyPasswordAndSendMessage);
    
    // Enter key in password field
    document.getElementById('chat-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyPasswordAndSendMessage();
        }
    });
    
    // Set up auto-refresh of messages
    setInterval(loadChatMessages, 3000);
}

// Load chat messages from local storage
function loadChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    
    // Only update if there are new messages
    if (messages.length > chatMessages.querySelectorAll('.chat-message').length) {
        // Clear existing messages
        chatMessages.innerHTML = '';
        
        // Add messages to the chat
        messages.forEach(message => {
            const messageEl = createMessageElement(message);
            chatMessages.appendChild(messageEl);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Create a message element
function createMessageElement(message) {
    const currentUser = localStorage.getItem('currentUser') || 'Guest';
    const isCurrentUser = message.sender === currentUser;
    
    // Create message container
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${isCurrentUser ? 'sent' : 'received'}`;
    
    // Create message header
    const headerEl = document.createElement('div');
    headerEl.className = 'message-header';
    
    // Create sender name element
    const senderEl = document.createElement('span');
    senderEl.className = 'message-sender';
    senderEl.textContent = message.sender;
    
    // Create time element
    const timeEl = document.createElement('span');
    timeEl.className = 'message-time';
    timeEl.textContent = formatMessageTime(message.timestamp);
    
    // Create message content
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.textContent = message.content;
    
    // Assemble message
    headerEl.appendChild(senderEl);
    headerEl.appendChild(timeEl);
    messageEl.appendChild(headerEl);
    messageEl.appendChild(contentEl);
    
    return messageEl;
}

// Format message time
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Open user selection modal
function openUserSelectionModal() {
    const modal = document.getElementById('user-selection-modal');
    const usersList = document.getElementById('users-list');
    
    // Clear previous users
    usersList.innerHTML = '';
    
    // Load users from localStorage - Updated to use the same storage key as users.html
    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    
    // If no users, create some default ones
    if (users.length === 0) {
        const defaultUsers = [
            { 
                id: 1,
                username: 'Admin', 
                password: 'admin123', 
                role: 'admin',
                name: 'Admin User',
                email: 'admin@example.com',
                location: 'Main Office'
            },
            { 
                id: 2,
                username: 'Manager', 
                password: 'manager123', 
                role: 'manager',
                name: 'John Manager',
                email: 'manager@example.com',
                location: 'West Branch'
            },
            { 
                id: 3,
                username: 'Staff1', 
                password: 'staff123', 
                role: 'employee',
                name: 'Jane Employee',
                email: 'employee@example.com',
                location: 'East Branch'
            },
            { 
                id: 4,
                username: 'Staff2', 
                password: 'staff123', 
                role: 'employee',
                name: 'Bob Worker',
                email: 'bob@example.com',
                location: 'North Branch'
            }
        ];
        
        localStorage.setItem('monumeUsers', JSON.stringify(defaultUsers));
        
        // Add default users to the list
        defaultUsers.forEach(user => {
            addUserToList(user, usersList);
        });
    } else {
        // Add users to the list
        users.forEach(user => {
            addUserToList(user, usersList);
        });
    }
    
    // Show the modal
    modal.style.display = 'block';
}

// Add a user to the selection list
function addUserToList(user, usersList) {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    
    // Create user avatar with initials
    const avatarEl = document.createElement('div');
    avatarEl.className = 'user-avatar';
    avatarEl.textContent = user.username.charAt(0).toUpperCase();
    
    // Create user name element
    const nameEl = document.createElement('div');
    nameEl.className = 'user-name';
    nameEl.textContent = user.username;
    
    // Add click event to select user
    userItem.addEventListener('click', function() {
        selectUserAndOpenPasswordModal(user.username);
    });
    
    // Assemble user item
    userItem.appendChild(avatarEl);
    userItem.appendChild(nameEl);
    usersList.appendChild(userItem);
}

// Select user and open password modal
function selectUserAndOpenPasswordModal(username) {
    // Hide user selection modal
    document.getElementById('user-selection-modal').style.display = 'none';
    
    // Update recipient username in password modal
    document.getElementById('recipient-username').textContent = username;
    
    // Store recipient for later use
    localStorage.setItem('selectedRecipient', username);
    
    // Clear previous password
    document.getElementById('chat-password').value = '';
    
    // Show password modal
    document.getElementById('chat-password-modal').style.display = 'block';
    
    // Focus password input
    setTimeout(() => {
        document.getElementById('chat-password').focus();
    }, 100);
}

// Verify password and send message
function verifyPasswordAndSendMessage() {
    const passwordInput = document.getElementById('chat-password');
    const password = passwordInput.value.trim();
    const recipientUsername = localStorage.getItem('selectedRecipient');
    
    if (!password) {
        alert('Please enter a password');
        return;
    }
    
    // Get the current user (sender)
    const currentUser = localStorage.getItem('currentUser') || 'Guest';
    
    // Verify password - Updated to use the same storage key as users.html
    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    const user = users.find(u => u.username === currentUser);
    
    if (user && user.password === password) {
        // Password is correct, send the message
        const messageText = document.getElementById('messageInput').value.trim();
        
        if (messageText) {
            // Get existing messages
            const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
            
            // Add new message
            const newMessage = {
                sender: currentUser,
                recipient: recipientUsername,
                content: messageText,
                timestamp: new Date().toISOString()
            };
            
            messages.push(newMessage);
            
            // Save to localStorage
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            
            // Clear input
            document.getElementById('messageInput').value = '';
            
            // Disable send button
            document.getElementById('sendMessageBtn').disabled = true;
            
            // Reload messages
            loadChatMessages();
            
            // Close password modal
            document.getElementById('chat-password-modal').style.display = 'none';
            
            // Show success toast
            showToast(`Message sent to ${recipientUsername}`, 'success');
        }
    } else {
        // Password is incorrect
        passwordInput.value = '';
        passwordInput.focus();
        showToast('Incorrect password. Please try again.', 'error');
        
        // Add shake animation to the modal
        const modalContent = document.querySelector('.chat-password-modal .modal-content');
        modalContent.style.animation = 'none';
        setTimeout(() => {
            modalContent.style.animation = 'shake 0.5s';
        }, 10);
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '2000';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '4px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    toast.style.animation = 'fadeIn 0.3s ease';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    
    // Set colors based on type
    if (type === 'success') {
        toast.style.backgroundColor = '#4caf50';
        toast.style.color = 'white';
        toast.innerHTML = '<i class="fas fa-check-circle"></i> ';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#f44336';
        toast.style.color = 'white';
        toast.innerHTML = '<i class="fas fa-exclamation-circle"></i> ';
    } else {
        toast.style.backgroundColor = '#2196f3';
        toast.style.color = 'white';
        toast.innerHTML = '<i class="fas fa-info-circle"></i> ';
    }
    
    toast.innerHTML += message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show the toast
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// Helper function to get current user if not already set
function getCurrentUser() {
    let currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        // Try to guess based on users available - Updated to use the same storage key as users.html
        const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
        
        if (users.length > 0) {
            // Default to first user
            currentUser = users[0].username;
            localStorage.setItem('currentUser', currentUser);
        } else {
            // Create a default user if none exists
            const defaultUser = { 
                id: 1,
                username: 'Guest', 
                password: 'guest123', 
                role: 'guest',
                name: 'Guest User',
                email: 'guest@example.com',
                location: 'Main Office'
            };
            localStorage.setItem('monumeUsers', JSON.stringify([defaultUser]));
            currentUser = defaultUser.username;
            localStorage.setItem('currentUser', currentUser);
        }
    }
    
    return currentUser;
}

document.addEventListener('DOMContentLoaded', function() {
    // Load sidebar
    fetch('sidebar-template.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;
        });

    // Initialize tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Hide all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show active tab
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Initialize calendar only if the element exists
    const calendarEl = document.getElementById('calendar');
    if (calendarEl && typeof FullCalendar !== 'undefined') {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            editable: true,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            events: getAppointments(),
            select: function(info) {
                // Pre-fill date when clicking on calendar
                document.getElementById('appointment-date').value = info.startStr;
                
                // Open the appointment modal
                document.getElementById('create-appointment-modal').style.display = 'block';
                
                // Set default duration to 30 minutes
                document.getElementById('appointment-duration').value = 30;
                
                calendar.unselect();
            },
            eventClick: function(info) {
                // Show appointment details when clicking on an event
                showAppointmentDetails(info.event);
            }
        });
        calendar.render();
    }

    // Get sales representatives
    function getSalesReps() {
        // In a real implementation, this would fetch from a database
        const storedReps = localStorage.getItem('salesReps');
        if (storedReps) {
            return JSON.parse(storedReps);
        }
        return [
            { id: '1', name: 'David Johnson' },
            { id: '2', name: 'Sarah Miller' },
            { id: '3', name: 'Michael Brown' },
            { id: '4', name: 'Emily Davis' }
        ];
    }

    // Populate sales rep dropdown
    function populateSalesRepDropdown() {
        const salesRepSelect = document.getElementById('appointment-sales-rep');
        // Clear existing options except the first
        while (salesRepSelect.options.length > 1) {
            salesRepSelect.remove(1);
        }
        
        // Add sales reps to dropdown
        const salesReps = getSalesReps();
        salesReps.forEach(rep => {
            const option = document.createElement('option');
            option.value = rep.id;
            option.textContent = rep.name;
            salesRepSelect.appendChild(option);
        });
    }

    // Mock functions for demo
    function getAppointments() {
        // In a real implementation, this would fetch from a database
        const storedAppointments = localStorage.getItem('appointments');
        if (storedAppointments) {
            return JSON.parse(storedAppointments);
        }
        return [
            {
                id: '1',
                title: 'Consultation with John Doe',
                start: '2025-04-30T10:00:00',
                end: '2025-04-30T11:00:00',
                extendedProps: {
                    type: 'consultation',
                    customerId: '1',
                    customerName: 'John Doe',
                    customerPhone: '555-123-4567',
                    customerEmail: 'john@example.com',
                    salesRepId: '1',
                    salesRepName: 'David Johnson',
                    notes: 'Initial consultation'
                }
            },
            {
                id: '2',
                title: 'Service for Jane Smith',
                start: '2025-05-02T14:00:00',
                end: '2025-05-02T15:30:00',
                extendedProps: {
                    type: 'service',
                    customerId: '2',
                    customerName: 'Jane Smith',
                    customerPhone: '555-987-6543',
                    customerEmail: 'jane@example.com',
                    salesRepId: '2',
                    salesRepName: 'Sarah Miller',
                    notes: 'Standard service'
                }
            }
        ];
    }

    function updateStatsCounters() {
        const appointments = getAppointments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const todayCount = appointments.filter(apt => {
            const aptDate = new Date(apt.start);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate.getTime() === today.getTime();
        }).length;
        
        const upcomingCount = appointments.filter(apt => {
            const aptDate = new Date(apt.start);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate >= today && aptDate <= nextWeek;
        }).length;
        
        document.getElementById('today-count').textContent = todayCount;
        document.getElementById('upcoming-count').textContent = upcomingCount;
        
        // Update customer count
        const customers = getCustomers();
        document.getElementById('customer-count').textContent = customers.length;
    }

    function getCustomers() {
        // In a real implementation, this would fetch from a database
        const storedCustomers = localStorage.getItem('customers');
        if (storedCustomers) {
            return JSON.parse(storedCustomers);
        }
        return [
            {
                id: '1',
                firstName: 'John',
                lastName: 'Doe',
                phone: '555-123-4567',
                email: 'john@example.com',
                notes: 'Regular customer'
            },
            {
                id: '2',
                firstName: 'Jane',
                lastName: 'Smith',
                phone: '555-987-6543',
                email: 'jane@example.com',
                notes: 'New customer'
            }
        ];
    }

    // Show appointment details in modal
    function showAppointmentDetails(event) {
        document.getElementById('modal-title').textContent = event.title;
        document.getElementById('modal-type').textContent = event.extendedProps.type.charAt(0).toUpperCase() + event.extendedProps.type.slice(1);
        
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        document.getElementById('modal-datetime').textContent = 
            `${startDate.toLocaleDateString(undefined, dateOptions)} at ${startDate.toLocaleTimeString(undefined, timeOptions)}`;
        
        const durationMinutes = (endDate - startDate) / (1000 * 60);
        document.getElementById('modal-duration').textContent = `${durationMinutes} minutes`;
        
        document.getElementById('modal-customer').textContent = event.extendedProps.customerName;
        document.getElementById('modal-sales-rep').textContent = event.extendedProps.salesRepName || 'Not assigned';
        document.getElementById('modal-notes').textContent = event.extendedProps.notes || 'No notes';
        
        // Store event ID for edit/delete operations
        document.getElementById('appointment-modal').setAttribute('data-event-id', event.id);
        
        // Show modal
        document.getElementById('appointment-modal').style.display = 'block';
    }

    // Handle appointment form submission
    document.getElementById('save-appointment').addEventListener('click', function() {
        const form = document.getElementById('appointment-form');
        
        // Check form validity
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const title = document.getElementById('appointment-title').value;
        const type = document.getElementById('appointment-type').value;
        const date = document.getElementById('appointment-date').value;
        const time = document.getElementById('appointment-time').value;
        const duration = parseInt(document.getElementById('appointment-duration').value);
        const salesRepId = document.getElementById('appointment-sales-rep').value;
        const notes = document.getElementById('appointment-notes').value;
        
        // Get customer id from the hidden input
        const customerIdElement = document.getElementById('selected-customer-id');
        
        if (!customerIdElement || !customerIdElement.value) {
            alert('Please add a customer for this appointment.');
            return;
        }
        
        const customerId = customerIdElement.value;
        
        // Find customer info
        const customers = getCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) {
            alert('Please select a valid customer.');
            return;
        }
        
        // Find sales rep info
        const salesReps = getSalesReps();
        const salesRep = salesReps.find(r => r.id === salesRepId);
        
        if (!salesRep) {
            alert('Please select a valid sales representative.');
            return;
        }
        
        // Create appointment object
        const startDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
        
        const appointment = {
            id: Date.now().toString(), // Generate unique ID
            title: title,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            extendedProps: {
                type: type,
                customerId: customer.id,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                salesRepId: salesRep.id,
                salesRepName: salesRep.name,
                notes: notes
            }
        };
        
        // Save the appointment
        saveAppointment(appointment);
        
        // Reset form
        form.reset();
        
        // Set default duration to 30 minutes
        document.getElementById('appointment-duration').value = 30;
        
        // Remove the customer selection result
        const customerSelectionResult = document.querySelector('.customer-selection-result');
        if (customerSelectionResult) {
            customerSelectionResult.remove();
        }
        
        // Hide modal
        document.getElementById('create-appointment-modal').style.display = 'none';
        
        // Show success message
        alert('Appointment created successfully!');
    });

    // Save appointment to storage
    function saveAppointment(appointment) {
        let appointments = getAppointments();
        
        // Check if we're updating an existing appointment
        const existingIndex = appointments.findIndex(a => a.id === appointment.id);
        
        if (existingIndex >= 0) {
            appointments[existingIndex] = appointment;
        } else {
            appointments.push(appointment);
        }
        
        // Save to localStorage
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Refresh calendar
        calendar.removeAllEvents();
        calendar.addEventSource(appointments);
        
        // Update stats
        updateStatsCounters();
    }

    // Handle customer form submission
    document.getElementById('customer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const customerId = document.getElementById('customer-id').value;
        const firstName = document.getElementById('customer-first-name').value;
        const lastName = document.getElementById('customer-last-name').value;
        const phone = document.getElementById('customer-phone').value;
        const email = document.getElementById('customer-email').value;
        const notes = document.getElementById('customer-notes').value;
        
        // Create customer object
        const customer = {
            id: customerId || Date.now().toString(), // Generate unique ID if not editing
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            email: email,
            notes: notes
        };
        
        // Save the customer
        saveCustomer(customer);
        
        // Reset form and hide
        document.getElementById('customer-form').reset();
        document.getElementById('customer-form-container').style.display = 'none';
        
        // Refresh customer search results
        searchCustomers();
        
        // Show success message
        alert(`Customer ${customerId ? 'updated' : 'created'} successfully!`);
    });

    // Save customer to storage
    function saveCustomer(customer) {
        let customers = getCustomers();
        
        // Check if we're updating an existing customer
        const existingIndex = customers.findIndex(c => c.id === customer.id);
        
        if (existingIndex >= 0) {
            customers[existingIndex] = customer;
        } else {
            customers.push(customer);
        }
        
        // Save to localStorage
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // Update stats
        updateStatsCounters();
    }

    // Search customers
    function searchCustomers(searchTerm = '') {
        const customers = getCustomers();
        const resultsContainer = document.getElementById('customer-results');
        resultsContainer.innerHTML = '';
        
        const filteredCustomers = searchTerm 
            ? customers.filter(customer => 
                `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.phone.includes(searchTerm) ||
                (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            : customers;
        
        if (filteredCustomers.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">No customers found. Try a different search or add a new customer.</p>';
            return;
        }
        
        filteredCustomers.forEach(customer => {
            const customerCard = document.createElement('div');
            customerCard.className = 'customer-card';
            customerCard.innerHTML = `
                <h3 class="customer-name">${customer.firstName} ${customer.lastName}</h3>
                <p class="customer-contact">
                    <i class="fas fa-phone"></i> ${customer.phone} 
                    ${customer.email ? `&nbsp;&nbsp;|&nbsp;&nbsp; <i class="fas fa-envelope"></i> ${customer.email}` : ''}
                </p>
                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <button class="btn btn-secondary edit-customer" data-id="${customer.id}" style="padding: 5px 10px; margin-right: 10px;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-primary schedule-appointment" data-id="${customer.id}" style="padding: 5px 10px;">
                        <i class="fas fa-calendar-plus"></i> Schedule
                    </button>
                </div>
            `;
            
            resultsContainer.appendChild(customerCard);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.edit-customer').forEach(button => {
            button.addEventListener('click', function() {
                const customerId = this.getAttribute('data-id');
                editCustomer(customerId);
            });
        });
        
        document.querySelectorAll('.schedule-appointment').forEach(button => {
            button.addEventListener('click', function() {
                const customerId = this.getAttribute('data-id');
                scheduleForCustomer(customerId);
            });
        });
    }

    // Edit customer
    function editCustomer(customerId) {
        const customers = getCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) {
            alert('Customer not found.');
            return;
        }
        
        // Fill form with customer data
        document.getElementById('customer-id').value = customer.id;
        document.getElementById('customer-first-name').value = customer.firstName;
        document.getElementById('customer-last-name').value = customer.lastName;
        document.getElementById('customer-phone').value = customer.phone;
        document.getElementById('customer-email').value = customer.email || '';
        document.getElementById('customer-notes').value = customer.notes || '';
        
        // Update form title
        document.getElementById('customer-form-title').textContent = 'Edit Customer';
        
        // Show form
        document.getElementById('customer-form-container').style.display = 'block';
    }

    // Schedule for customer
    function scheduleForCustomer(customerId) {
        const customers = getCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) {
            alert('Customer not found.');
            return;
        }
        
        // Open appointment creation modal
        document.getElementById('create-appointment-modal').style.display = 'block';
        
        // Set default duration to 30 minutes
        document.getElementById('appointment-duration').value = 30;
        
        // Create and add customer info to the appointment form
        const customerNameElement = document.createElement('div');
        customerNameElement.classList.add('customer-selection-result');
        customerNameElement.innerHTML = `
            <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
                <strong>${customer.firstName} ${customer.lastName}</strong><br>
                <small>${customer.phone}</small>
                <input type="hidden" id="selected-customer-id" value="${customer.id}">
            </div>
        `;
        
        // Remove any existing customer selection
        const existingSelection = document.querySelector('.customer-selection-result');
        if (existingSelection) {
            existingSelection.remove();
        }
        
        // Insert after the add customer button
        const addCustomerBtn = document.getElementById('add-customer-for-appointment');
        addCustomerBtn.insertAdjacentElement('afterend', customerNameElement);
    }

    // Add event listeners
    document.getElementById('customer-search').addEventListener('input', function() {
        searchCustomers(this.value);
    });
    
    document.getElementById('add-customer-btn').addEventListener('click', function() {
        // Reset form
        document.getElementById('customer-form').reset();
        document.getElementById('customer-id').value = '';
        
        // Update form title
        document.getElementById('customer-form-title').textContent = 'Add New Customer';
        
        // Show form
        document.getElementById('customer-form-container').style.display = 'block';
    });
    
    document.getElementById('cancel-customer-btn').addEventListener('click', function() {
        document.getElementById('customer-form').reset();
        document.getElementById('customer-form-container').style.display = 'none';
    });
    
    document.getElementById('clear-form').addEventListener('click', function() {
        document.getElementById('appointment-form').reset();
        
        // Set default duration to 30 minutes
        document.getElementById('appointment-duration').value = 30;
        
        // Remove customer selection
        const customerSelection = document.querySelector('.customer-selection-result');
        if (customerSelection) {
            customerSelection.remove();
        }
    });
    
    // Add new appointment button
    document.getElementById('add-appointment-btn').addEventListener('click', function() {
        document.getElementById('create-appointment-modal').style.display = 'block';
        
        // Set default duration to 30 minutes
        document.getElementById('appointment-duration').value = 30;
    });
    
    // Modal event listeners
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('appointment-modal').style.display = 'none';
    });
    
    document.getElementById('close-create-modal').addEventListener('click', function() {
        document.getElementById('create-appointment-modal').style.display = 'none';
    });
    
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('appointment-modal').style.display = 'none';
    });
    
    document.getElementById('delete-appointment').addEventListener('click', function() {
        const eventId = document.getElementById('appointment-modal').getAttribute('data-event-id');
        
        if (confirm('Are you sure you want to delete this appointment?')) {
            deleteAppointment(eventId);
            document.getElementById('appointment-modal').style.display = 'none';
        }
    });
    
    document.getElementById('edit-appointment').addEventListener('click', function() {
        const eventId = document.getElementById('appointment-modal').getAttribute('data-event-id');
        editAppointment(eventId);
        document.getElementById('appointment-modal').style.display = 'none';
    });
    
    // Delete appointment
    function deleteAppointment(eventId) {
        let appointments = getAppointments();
        appointments = appointments.filter(a => a.id !== eventId);
        
        // Save to localStorage
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Refresh calendar
        calendar.removeAllEvents();
        calendar.addEventSource(appointments);
        
        // Update stats
        updateStatsCounters();
        
        // Show success message
        alert('Appointment deleted successfully!');
    }
    
    // Edit appointment
    function editAppointment(eventId) {
        const appointments = getAppointments();
        const appointment = appointments.find(a => a.id === eventId);
        
        if (!appointment) {
            alert('Appointment not found.');
            return;
        }
        
        // Open the appointment modal
        document.getElementById('create-appointment-modal').style.display = 'block';
        
        // Fill form with appointment data
        document.getElementById('appointment-title').value = appointment.title;
        document.getElementById('appointment-type').value = appointment.extendedProps.type;
        
        const startDate = new Date(appointment.start);
        document.getElementById('appointment-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('appointment-time').value = startDate.toTimeString().substring(0, 5);
        
        const endDate = new Date(appointment.end);
        const durationMinutes = (endDate - startDate) / (1000 * 60);
        document.getElementById('appointment-duration').value = durationMinutes;
        
        // Add customer info to form
        const customer = {
            id: appointment.extendedProps.customerId,
            firstName: appointment.extendedProps.customerName.split(' ')[0],
            lastName: appointment.extendedProps.customerName.split(' ')[1] || '',
            phone: appointment.extendedProps.customerPhone
        };
        
        // Create customer selection element
        const customerNameElement = document.createElement('div');
        customerNameElement.classList.add('customer-selection-result');
        customerNameElement.innerHTML = `
            <div style="background: rgba(255, 149, 98, 0.1); padding: 10px; border-radius: 10px; margin-top: 10px;">
                <strong>${customer.firstName} ${customer.lastName}</strong><br>
                <small>${customer.phone}</small>
                <input type="hidden" id="selected-customer-id" value="${customer.id}">
            </div>
        `;
        
        // Remove any existing customer selection
        const existingSelection = document.querySelector('.customer-selection-result');
        if (existingSelection) {
            existingSelection.remove();
        }
        
        // Insert customer info
        const addCustomerBtn = document.getElementById('add-customer-for-appointment');
        addCustomerBtn.insertAdjacentElement('afterend', customerNameElement);
          document.getElementById('appointment-sales-rep').value = appointment.extendedProps.salesRepId;
        document.getElementById('appointment-notes').value = appointment.extendedProps.notes || '';
    }
    
    // REMOVED: All customer modal event listeners from script.js
    // These are now handled properly in events.js
    console.log('All customer modal event listeners in script.js are disabled to prevent duplicates');
    // DO NOT add event listeners for:
    // - add-customer-for-appointment
    // - close-customer-modal
    // - cancel-add-customer
    // - save-new-customer
      // Fix modal scrolling when opened - but exclude customer modals which are handled in events.js
    const modals = document.querySelectorAll('.modal:not(#add-customer-modal)');
    modals.forEach(modal => {
        if (modal.id !== 'add-customer-modal') {  // Double-check to avoid conflicts
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    });
    
    // Stop propagation for modal content to prevent closing when clicking inside
    // Exclude the customer modal content which is handled in events.js
    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(content => {
        // Check if this content is not inside the customer modal
        if (!content.closest('#add-customer-modal')) {
            content.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    });
    
    // Initialize the page
    populateSalesRepDropdown();
    searchCustomers();
    updateStatsCounters();
});