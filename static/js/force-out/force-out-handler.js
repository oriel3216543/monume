/**
 * Force Out Handler - Specialized script to handle the Force Out functionality
 * This file is intentionally isolated to avoid conflicts with other scripts
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Force Out Handler initialized");
    
    // Directly attach Force Out functionality to all existing buttons
    attachForceOutHandlers();
    
    // Create a MutationObserver to handle dynamically created Force Out buttons
    setupMutationObserver();
});

/**
 * Attach event handlers to all Force Out buttons
 */
function attachForceOutHandlers() {
    console.log("Attaching Force Out handlers");
    
    // Get all Force Out buttons
    const forceOutButtons = document.querySelectorAll('.forceout-btn');
    console.log(`Found ${forceOutButtons.length} Force Out buttons`);
    
    // Attach event handlers to each button
    forceOutButtons.forEach(button => {
        // Remove any existing event listeners to prevent duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new event listener
        newButton.addEventListener('click', handleForceOutClick);
    });
}

/**
 * Handle Force Out button click
 */
function handleForceOutClick(event) {
    // Prevent default action and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    // Get the username from the parent element
    const userItem = event.target.closest('.active-user-item');
    if (!userItem) {
        console.error("Could not find parent user item element");
        return;
    }
    
    const username = userItem.getAttribute('data-username');
    if (!username) {
        console.error("Could not find username");
        return;
    }
    
    console.log(`Force Out button clicked for user: ${username}`);
    
    // Show Force Out modal
    showForceOutAuthModal(username);
}

/**
 * Show the Force Out authentication modal
 */
function showForceOutAuthModal(username) {
    console.log(`Showing Force Out authentication modal for ${username}`);
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'forceOutAuthModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000'; // Very high to ensure it's above everything else
    modal.style.backdropFilter = 'blur(5px)';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '10px';
    modalContent.style.padding = '30px';
    modalContent.style.maxWidth = '400px';
    modalContent.style.width = '90%';
    modalContent.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    modalContent.style.position = 'relative';
    modalContent.style.borderTop = '6px solid #f44336';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '15px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#aaa';
    closeButton.onclick = function() {
        document.body.removeChild(modal);
    };
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Authentication Check';
    title.style.color = '#f44336';
    title.style.margin = '0 0 20px 0';
    title.style.fontSize = '24px';
    title.style.fontWeight = '700';
    title.style.textAlign = 'center';
    
    // Create description
    const description = document.createElement('p');
    description.innerHTML = `Enter admin or manager credentials to force out <strong style="color: #f44336;">${username}</strong>:`;
    description.style.marginBottom = '20px';
    description.style.color = '#444';
    description.style.textAlign = 'center';
    
    // Create admin select
    const adminSelect = document.createElement('select');
    adminSelect.id = 'adminSelect';
    adminSelect.style.width = '100%';
    adminSelect.style.padding = '12px 15px';
    adminSelect.style.marginBottom = '15px';
    adminSelect.style.border = '1px solid #ddd';
    adminSelect.style.borderRadius = '5px';
    adminSelect.style.fontSize = '16px';
    
    // Get admin and manager users
    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    const admins = users.filter(user => user.role === 'admin' || user.role === 'manager');
    
    // Populate admin select
    admins.forEach(admin => {
        const option = document.createElement('option');
        option.value = admin.username;
        option.textContent = `${admin.name || admin.username} (${admin.role})`;
        adminSelect.appendChild(option);
    });
    
    // Create password input
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Enter password';
    passwordInput.style.width = '100%';
    passwordInput.style.padding = '12px 15px';
    passwordInput.style.marginBottom = '20px';
    passwordInput.style.border = '1px solid #ddd';
    passwordInput.style.borderRadius = '5px';
    passwordInput.style.fontSize = '16px';
    passwordInput.style.boxSizing = 'border-box';
    
    // Create error message element
    const errorMessage = document.createElement('p');
    errorMessage.id = 'errorMessage';
    errorMessage.style.color = '#f44336';
    errorMessage.style.margin = '0 0 15px 0';
    errorMessage.style.fontSize = '14px';
    errorMessage.style.display = 'none';
    errorMessage.style.textAlign = 'center';
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '15px';
    
    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.flex = '1';
    cancelButton.style.padding = '12px';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.backgroundColor = '#f0f0f0';
    cancelButton.style.color = '#444';
    cancelButton.style.fontWeight = '600';
    cancelButton.style.cursor = 'pointer';
    cancelButton.onclick = function() {
        document.body.removeChild(modal);
    };
    
    // Create force out button
    const forceOutButton = document.createElement('button');
    forceOutButton.textContent = 'Force Out';
    forceOutButton.style.flex = '1';
    forceOutButton.style.padding = '12px';
    forceOutButton.style.border = 'none';
    forceOutButton.style.borderRadius = '5px';
    forceOutButton.style.backgroundColor = '#f44336';
    forceOutButton.style.color = 'white';
    forceOutButton.style.fontWeight = '600';
    forceOutButton.style.cursor = 'pointer';
    forceOutButton.onclick = function() {
        const adminUsername = adminSelect.value;
        const password = passwordInput.value;
        
        if (!password) {
            errorMessage.textContent = 'Please enter a password.';
            errorMessage.style.display = 'block';
            return;
        }
        
        const admin = admins.find(a => a.username === adminUsername);
        if (admin && admin.password === password) {
            // Password is correct - force out the user
            forceOutUser(username, adminUsername);
            document.body.removeChild(modal);
        } else {
            // Password is incorrect
            errorMessage.textContent = 'Incorrect password. Please try again.';
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
            
            // Shake animation for error feedback
            modalContent.style.animation = 'forceout-shake 0.5s ease';
            setTimeout(() => {
                modalContent.style.animation = '';
            }, 500);
        }
    };
    
    // Add enter key support for password field
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            forceOutButton.click();
        }
    });
    
    // Assemble modal content
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(forceOutButton);
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(description);
    modalContent.appendChild(adminSelect);
    modalContent.appendChild(passwordInput);
    modalContent.appendChild(errorMessage);
    modalContent.appendChild(buttonContainer);
    
    modal.appendChild(modalContent);
    
    // Add the modal to the document
    document.body.appendChild(modal);
    
    // Focus the password input
    setTimeout(() => {
        passwordInput.focus();
    }, 100);
    
    // Add shake animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes forceout-shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Force out a user
 */
function forceOutUser(username, adminUsername) {
    console.log(`Forcing out user ${username} authorized by ${adminUsername}`);
    
    // Get active users
    const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
    
    // Remove the user from active users
    const updatedActiveUsers = activeUsers.filter(user => user.username !== username);
    
    // Update localStorage
    localStorage.setItem('activeUsers', JSON.stringify(updatedActiveUsers));
    
    // Show success message
    showSuccessToast(`${username} has been forced out by ${adminUsername}`);
    
    // Update the active users count and refresh the display
    updateActiveUsersCount();
    refreshActiveUsersList();
}

/**
 * Show a success toast message
 */
function showSuccessToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#4CAF50';
    toast.style.color = 'white';
    toast.style.padding = '15px 20px';
    toast.style.borderRadius = '5px';
    toast.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    toast.style.zIndex = '9999';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    // Add the toast to the document
    document.body.appendChild(toast);
    
    // Remove the toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
}

/**
 * Update the active users count displayed in the UI
 */
function updateActiveUsersCount() {
    // Get active users
    const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
    
    // Find and update all elements that display the active users count
    const countElements = document.querySelectorAll('.active-users-count, #active-users-count, #activeUsers');
    countElements.forEach(element => {
        if (element) {
            element.textContent = activeUsers.length;
        }
    });
}

/**
 * Refresh the active users list in the modal
 */
function refreshActiveUsersList() {
    // Check if the modal is open
    const modal = document.getElementById('active-users-modal');
    if (modal && modal.style.display === 'flex') {
        // Get the active user list container
        const activeUserList = document.getElementById('active-user-list');
        if (activeUserList) {
            // Clear existing list
            activeUserList.innerHTML = '';
            
            // Get active users
            const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
            
            if (activeUsers.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = 'No active users at the moment.';
                emptyMessage.style.textAlign = 'center';
                emptyMessage.style.padding = '20px';
                emptyMessage.style.color = '#666';
                activeUserList.appendChild(emptyMessage);
            } else {
                // Re-create user items
                activeUsers.forEach(user => {
                    const startTime = new Date(user.startTime);
                    const timeActive = getTimeActive(startTime);
                    
                    const userItem = document.createElement('div');
                    userItem.className = 'active-user-item';
                    userItem.setAttribute('data-username', user.username);
                    
                    userItem.innerHTML = `
                        <div class="active-user-name">${user.username} <span style="font-weight: normal; font-size: 13px; color: #666;">(${timeActive})</span></div>
                        <div class="active-user-buttons">
                            <button class="unactive-btn">Unactive</button>
                            <button class="forceout-btn">Force Out</button>
                        </div>
                    `;
                    
                    activeUserList.appendChild(userItem);
                });
                
                // Re-attach handlers to the new buttons
                attachForceOutHandlers();
            }
        }
    }
}

/**
 * Get time active in human-readable format
 */
function getTimeActive(startTime) {
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000); // seconds
    
    if (diff < 60) {
        return `${diff} sec`;
    } else if (diff < 3600) {
        return `${Math.floor(diff / 60)} min`;
    } else {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

/**
 * Set up a MutationObserver to watch for dynamically added Force Out buttons
 */
function setupMutationObserver() {
    // Create an observer to watch for changes in the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Check if nodes were added
            if (mutation.addedNodes.length) {
                // Check if any Force Out buttons were added
                const hasForceOutButtons = Array.from(mutation.addedNodes).some(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if the node itself is a Force Out button
                        if (node.classList && node.classList.contains('forceout-btn')) {
                            return true;
                        }
                        // Check if the node contains Force Out buttons
                        return node.querySelectorAll && node.querySelectorAll('.forceout-btn').length > 0;
                    }
                    return false;
                });
                
                // If Force Out buttons were added, attach handlers
                if (hasForceOutButtons) {
                    console.log("Force Out buttons added to DOM, attaching handlers");
                    attachForceOutHandlers();
                }
            }
        });
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { 
        childList: true,
        subtree: true
    });
}