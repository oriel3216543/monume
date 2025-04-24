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
    initializeTeamChat();
});

function initializeTeamChat() {
    // Get DOM elements
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const userSelectionModal = document.getElementById('user-selection-modal');
    const passwordModal = document.getElementById('chat-password-modal');
    
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