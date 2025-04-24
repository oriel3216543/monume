// Team Chat Integration for Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboardChat();
});

function initializeDashboardChat() {
    // Check if we're on a page with chat elements
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!chatMessages || !messageInput || !sendButton) {
        return; // Not on a page with chat functionality
    }
    
    // Initialize shared chat storage if needed
    if (!localStorage.getItem('chatMessages')) {
        // Create sample messages
        const now = new Date();
        const messages = [
            {
                user: 'admin',
                message: 'Welcome to the MonuMe Tracker team chat!',
                timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days ago
            },
            {
                user: 'manager',
                message: 'Remember to complete your daily reports everyone.',
                timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
            },
            {
                user: 'employee',
                message: 'Has anyone seen the new dashboard updates?',
                timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
            },
            {
                user: 'admin',
                message: 'Team meeting scheduled for tomorrow at 10 AM.',
                timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
            }
        ];
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
    
    // Load messages initially
    loadChatMessages();
    
    // Set up auto refresh
    setInterval(loadChatMessages, 3000);
    
    // Set up user selection modal and auth modal events
    setupChatModalEvents();
    
    // Enable send button only when there's text
    messageInput.addEventListener('input', function() {
        sendButton.disabled = !this.value.trim();
    });
    
    // Send message on button click
    sendButton.addEventListener('click', function() {
        if (messageInput.value.trim()) {
            openUserSelectionModal();
        }
    });
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            e.preventDefault();
            openUserSelectionModal();
        }
    });
}

// Load chat messages from localStorage
function loadChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    
    // Filter messages from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMessages = messages.filter(msg => 
        new Date(msg.timestamp) > sevenDaysAgo
    );
    
    // Only update if there are new messages
    if (recentMessages.length > chatMessages.querySelectorAll('.chat-message').length) {
        // Clear existing messages
        chatMessages.innerHTML = '';
        
        if (recentMessages.length === 0) {
            chatMessages.innerHTML = '<div style="text-align:center; padding: 20px; color: #666;">No messages yet. Be the first to say hello!</div>';
            return;
        }
        
        // Group messages by date
        const messagesByDate = {};
        recentMessages.forEach(msg => {
            const dateKey = new Date(msg.timestamp).toDateString();
            if (!messagesByDate[dateKey]) {
                messagesByDate[dateKey] = [];
            }
            messagesByDate[dateKey].push(msg);
        });
        
        // Add messages with date dividers
        Object.keys(messagesByDate).forEach(dateKey => {
            // Add date divider
            const today = new Date().toDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            let dateText;
            if (dateKey === today) {
                dateText = "Today";
            } else if (dateKey === yesterdayString) {
                dateText = "Yesterday";
            } else {
                dateText = new Date(dateKey).toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric'
                });
            }
            
            chatMessages.innerHTML += `
                <div class="message-date-divider" style="display: flex; align-items: center; margin: 15px 0; text-align: center; opacity: 0.7;">
                    <span style="padding: 0 10px; color: #666; font-size: 0.8rem; margin: 0 10px; background: rgba(255, 149, 98, 0.1); border-radius: 10px; padding: 3px 10px;">${dateText}</span>
                </div>
            `;
            
            // Add messages for this date
            messagesByDate[dateKey].forEach(msg => {
                // Determine if this message was sent by current user
                const currentUser = localStorage.getItem('currentUser') || 'Guest';
                const messageType = msg.user === currentUser ? 'sent' : 'received';
                
                // Create the message element
                const messageEl = document.createElement('div');
                messageEl.className = `chat-message ${messageType}`;
                
                // Create sender avatar with first letter
                const senderInitial = msg.user.charAt(0).toUpperCase();
                
                // Create message HTML
                messageEl.innerHTML = `
                    <div class="message-header">
                        <span class="message-sender">
                            ${escapeHtml(msg.user)}
                        </span>
                        <span class="message-time">${formatTime(msg.timestamp)}</span>
                    </div>
                    <div class="message-content">${escapeHtml(msg.message)}</div>
                `;
                
                chatMessages.appendChild(messageEl);
            });
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Set up events for chat modals
function setupChatModalEvents() {
    const userSelectionModal = document.getElementById('user-selection-modal');
    const authModal = document.getElementById('authModal');
    
    if (!userSelectionModal || !authModal) return;
    
    // Close user selection modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === userSelectionModal) {
            userSelectionModal.style.display = 'none';
        }
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
    });
    
    // Set up auth modal buttons
    const authConfirm = document.getElementById('authConfirm');
    const authCancel = document.getElementById('authCancel');
    const authPassword = document.getElementById('authPassword');
    
    if (authConfirm && authCancel && authPassword) {
        // Cancel button closes the modal
        authCancel.addEventListener('click', function() {
            authModal.style.display = 'none';
        });
        
        // Confirm button verifies password and sends message
        authConfirm.addEventListener('click', verifyPasswordAndSendMessage);
        
        // Enter key in password field
        authPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyPasswordAndSendMessage();
            }
        });
    }
}

// Open user selection modal
function openUserSelectionModal() {
    const modal = document.getElementById('user-selection-modal');
    const usersList = document.getElementById('user-selection-list');
    
    if (!modal || !usersList) return;
    
    // Clear previous users
    usersList.innerHTML = '';
    
    // Get pending message
    const pendingMessage = document.getElementById('messageInput').value.trim();
    localStorage.setItem('pendingMessage', pendingMessage);
    
    // Load users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // If no users, create some default ones
    if (users.length === 0) {
        const defaultUsers = [
            { username: 'admin', password: 'admin', role: 'admin' },
            { username: 'manager', password: 'manager', role: 'manager' },
            { username: 'employee', password: 'employee', role: 'staff' }
        ];
        
        localStorage.setItem('users', JSON.stringify(defaultUsers));
        
        // Add default users to the list
        defaultUsers.forEach(user => {
            addUserToSelectionList(user, usersList);
        });
    } else {
        // Add users to the list
        users.forEach(user => {
            addUserToSelectionList(user, usersList);
        });
    }
    
    // Show the modal
    modal.style.display = 'block';
}

// Add user to selection list
function addUserToSelectionList(user, usersList) {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.style.display = 'flex';
    userItem.style.alignItems = 'center';
    userItem.style.padding = '12px';
    userItem.style.marginBottom = '8px';
    userItem.style.borderRadius = '8px';
    userItem.style.cursor = 'pointer';
    userItem.style.transition = 'all 0.3s ease';
    userItem.style.background = 'rgba(255, 149, 98, 0.1)';
    
    // Create user avatar
    const avatar = document.createElement('div');
    avatar.style.width = '40px';
    avatar.style.height = '40px';
    avatar.style.borderRadius = '50%';
    avatar.style.background = 'linear-gradient(135deg, #ff7f42, #ff9562)';
    avatar.style.color = 'white';
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.fontWeight = '600';
    avatar.style.marginRight = '12px';
    avatar.textContent = user.username.charAt(0).toUpperCase();
    
    // Create user name
    const name = document.createElement('div');
    name.style.fontWeight = '500';
    name.textContent = user.username;
    
    // Add click handler to select user
    userItem.addEventListener('click', function() {
        selectUserForAuth(user.username);
    });
    
    // Assemble user item
    userItem.appendChild(avatar);
    userItem.appendChild(name);
    usersList.appendChild(userItem);
}

// Select user and open auth modal
function selectUserForAuth(username) {
    // Hide user selection modal
    document.getElementById('user-selection-modal').style.display = 'none';
    
    // Set selected username
    localStorage.setItem('selectedUser', username);
    
    // Show auth modal
    const authModal = document.getElementById('authModal');
    const authPassword = document.getElementById('authPassword');
    
    if (authModal && authPassword) {
        authPassword.value = '';
        authModal.style.display = 'block';
        
        // Focus password field
        setTimeout(() => {
            authPassword.focus();
        }, 100);
    }
}

// Verify password and send message
function verifyPasswordAndSendMessage() {
    const authPassword = document.getElementById('authPassword');
    const password = authPassword.value;
    const selectedUser = localStorage.getItem('selectedUser');
    
    if (!password) {
        alert('Please enter a password');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === selectedUser);
    
    if (user && user.password === password) {
        // Password verified, send the message
        document.getElementById('authModal').style.display = 'none';
        
        const messageText = localStorage.getItem('pendingMessage');
        if (messageText) {
            // Get existing messages
            const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
            
            // Add new message
            const newMessage = {
                user: selectedUser,
                message: messageText,
                timestamp: new Date().toISOString()
            };
            
            messages.push(newMessage);
            
            // Save to localStorage
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            
            // Clear input and pending message
            document.getElementById('messageInput').value = '';
            localStorage.removeItem('pendingMessage');
            localStorage.removeItem('selectedUser');
            
            // Disable send button
            document.getElementById('sendButton').disabled = true;
            
            // Save the current user for next time
            localStorage.setItem('currentUser', selectedUser);
            
            // Reload messages
            loadChatMessages();
            
            // Show success toast
            showToast('Message sent successfully', 'success');
        }
    } else {
        // Invalid password
        authPassword.value = '';
        authPassword.focus();
        
        // Add shake animation to modal
        const modalContent = document.querySelector('#authModal .auth-content');
        if (modalContent) {
            modalContent.style.animation = 'none';
            setTimeout(() => {
                modalContent.style.animation = 'shake 0.5s';
            }, 10);
        }
        
        showToast('Invalid password. Please try again.', 'error');
    }
}

// Helper functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
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