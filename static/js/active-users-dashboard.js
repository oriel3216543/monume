document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for Active Users buttons in the Team MonuMe card
    const startSessionBtn = document.getElementById('start-session-btn');
    const viewActiveUsersBtn = document.getElementById('view-active-users-btn');
    
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', function() {
            console.log("Start button clicked - letting dashboard.html handle the modal");
        });
    }
    
    // Update active users count on load
    updateActiveUsersCount();
    setupActiveUsersButtons();
    
    // Set up direct event listener for close-active-users button
    const closeActiveUsersBtn = document.getElementById('close-active-users');
    if (closeActiveUsersBtn) {
        closeActiveUsersBtn.addEventListener('click', function() {
            closeActiveUsersModal();
        });
    }
    
    // Initialize users database
    initializeUsersDatabase();
});

// Update active users count in the dashboard
function updateActiveUsersCount() {
    const activeUsersElement = document.getElementById('activeUsers');
    if (activeUsersElement) {
        const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
        activeUsersElement.textContent = activeUsers.length;
    }
}

// Deactivate a user (requires password verification)
function deactivateUser(username) {
    // Create a styled modal for password verification
    const verificationModal = document.createElement('div');
    verificationModal.style.position = 'fixed';
    verificationModal.style.top = '0';
    verificationModal.style.left = '0';
    verificationModal.style.width = '100%';
    verificationModal.style.height = '100%';
    verificationModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    verificationModal.style.backdropFilter = 'blur(5px)';
    verificationModal.style.WebkitBackdropFilter = 'blur(5px)';
    verificationModal.style.display = 'flex';
    verificationModal.style.justifyContent = 'center';
    verificationModal.style.alignItems = 'center';
    verificationModal.style.zIndex = '2000';
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '20px';
    modalContent.style.padding = '30px';
    modalContent.style.width = '350px';
    modalContent.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
    modalContent.style.textAlign = 'center';
    modalContent.style.animation = 'modalFadeIn 0.3s ease';
    modalContent.style.position = 'relative';
    
    // Add a colored top border
    modalContent.style.borderTop = '6px solid #ff9562';
    
    const title = document.createElement('h3');
    title.textContent = 'Password Verification';
    title.style.marginTop = '0';
    title.style.color = '#ff9562';
    title.style.fontSize = '22px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '15px';
    
    const text = document.createElement('p');
    text.innerHTML = `Please enter <span style="color: #ff9562; font-weight: 600;">${username}</span>'s password to deactivate:`;
    text.style.marginBottom = '20px';
    text.style.color = '#666';
    
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Enter password';
    passwordInput.style.width = '100%';
    passwordInput.style.padding = '12px 15px';
    passwordInput.style.margin = '10px 0 20px';
    passwordInput.style.border = '1px solid #ddd';
    passwordInput.style.borderRadius = '10px';
    passwordInput.style.fontSize = '16px';
    passwordInput.style.boxSizing = 'border-box';
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.justifyContent = 'space-between';
    buttonsDiv.style.gap = '15px';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.flex = '1';
    cancelButton.style.padding = '12px 0';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '10px';
    cancelButton.style.fontWeight = '600';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.transition = 'all 0.2s ease';
    cancelButton.style.backgroundColor = '#f0f0f0';
    cancelButton.style.color = '#666';
    
    const verifyButton = document.createElement('button');
    verifyButton.textContent = 'Verify';
    verifyButton.style.flex = '1';
    verifyButton.style.padding = '12px 0';
    verifyButton.style.border = 'none';
    verifyButton.style.borderRadius = '10px';
    verifyButton.style.fontWeight = '600';
    verifyButton.style.cursor = 'pointer';
    verifyButton.style.transition = 'all 0.2s ease';
    verifyButton.style.background = 'linear-gradient(135deg, #ff7f42, #ff9562)';
    verifyButton.style.color = 'white';
    
    // Add hover effects
    cancelButton.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#e0e0e0';
        this.style.transform = 'translateY(-2px)';
    });
    
    cancelButton.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#f0f0f0';
        this.style.transform = 'translateY(0)';
    });
    
    verifyButton.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(255, 127, 66, 0.3)';
    });
    
    verifyButton.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    
    // Add event listeners
    cancelButton.addEventListener('click', function() {
        document.body.removeChild(verificationModal);
    });
    
    verifyButton.addEventListener('click', function() {
        const password = passwordInput.value;
        if (!password) {
            alert('Please enter a password');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
        const user = users.find(u => u.username === username);
        
        if (user && user.password === password) {
            // Remove from active users
            removeActiveUser(username);
            
            // Remove the modal
            document.body.removeChild(verificationModal);
            
            // Show success message
            const successToast = createToast(`${username} has been deactivated successfully`, 'success');
            document.body.appendChild(successToast);
            setTimeout(() => {
                successToast.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(successToast);
                }, 500);
            }, 3000);
            
            // Refresh active users modal
            openActiveUsersModal();
        } else {
            // Show error message
            const errorMsg = document.createElement('p');
            errorMsg.textContent = 'Invalid password. Please try again.';
            errorMsg.style.color = '#ff3333';
            errorMsg.style.margin = '0 0 15px 0';
            errorMsg.style.fontSize = '14px';
            
            // Remove any existing error message
            const existingError = modalContent.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Add class for easy removal
            errorMsg.classList.add('error-message');
            
            // Insert before buttons
            buttonsDiv.parentNode.insertBefore(errorMsg, buttonsDiv);
            
            // Clear password field
            passwordInput.value = '';
            passwordInput.focus();
            
            // Add shake animation
            modalContent.style.animation = 'none';
            setTimeout(() => {
                modalContent.style.animation = 'shake 0.5s';
            }, 10);
        }
    });
    
    // Add keypress handler for Enter key
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyButton.click();
        }
    });
    
    // Add a close button in top right
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
    closeButton.style.transition = 'color 0.2s';
    
    closeButton.addEventListener('mouseover', function() {
        this.style.color = '#ff9562';
    });
    
    closeButton.addEventListener('mouseout', function() {
        this.style.color = '#aaa';
    });
    
    closeButton.addEventListener('click', function() {
        document.body.removeChild(verificationModal);
    });
    
    // Assemble the modal
    buttonsDiv.appendChild(cancelButton);
    buttonsDiv.appendChild(verifyButton);
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(text);
    modalContent.appendChild(passwordInput);
    modalContent.appendChild(buttonsDiv);
    
    verificationModal.appendChild(modalContent);
    document.body.appendChild(verificationModal);
    
    // Focus the password field
    setTimeout(() => {
        passwordInput.focus();
    }, 100);
}

// Create a toast notification
function createToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '15px 20px';
    toast.style.borderRadius = '10px';
    toast.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.zIndex = '2001';
    toast.style.transition = 'opacity 0.5s ease';
    
    // Set color based on type
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
    
    return toast;
}

// Force out a user (admin/manager only)
function forceOutUser(username) {
    const currentRole = getCurrentUserRole();
    
    if (currentRole !== 'admin' && currentRole !== 'manager') {
        const errorToast = createToast('You do not have permission to force out users.', 'error');
        document.body.appendChild(errorToast);
        setTimeout(() => {
            errorToast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(errorToast);
            }, 500);
        }, 3000);
        return;
    }
    
    // Get all admin and manager users
    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    const adminUsers = users.filter(user => user.role === 'admin' || user.role === 'manager');
    
    if (adminUsers.length === 0) {
        const errorToast = createToast('No admin users found in the system.', 'error');
        document.body.appendChild(errorToast);
        setTimeout(() => {
            errorToast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(errorToast);
            }, 500);
        }, 3000);
        return;
    }
    
    // Create admin selection modal
    const selectionModal = document.createElement('div');
    selectionModal.style.position = 'fixed';
    selectionModal.style.top = '0';
    selectionModal.style.left = '0';
    selectionModal.style.width = '100%';
    selectionModal.style.height = '100%';
    selectionModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    selectionModal.style.backdropFilter = 'blur(5px)';
    selectionModal.style.WebkitBackdropFilter = 'blur(5px)';
    selectionModal.style.display = 'flex';
    selectionModal.style.justifyContent = 'center';
    selectionModal.style.alignItems = 'center';
    selectionModal.style.zIndex = '2000';
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '20px';
    modalContent.style.padding = '30px';
    modalContent.style.width = '400px';
    modalContent.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
    modalContent.style.textAlign = 'center';
    modalContent.style.animation = 'modalFadeIn 0.3s ease';
    modalContent.style.position = 'relative';
    
    // Add a colored top border - red for force out
    modalContent.style.borderTop = '6px solid #f44336';
    
    const title = document.createElement('h3');
    title.textContent = 'Select Admin for Force Out';
    title.style.marginTop = '0';
    title.style.color = '#f44336';
    title.style.fontSize = '22px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '15px';
    
    const text = document.createElement('p');
    text.innerHTML = `Choose an admin to force out <span style="color: #f44336; font-weight: 600;">${username}</span>:`;
    text.style.marginBottom = '20px';
    text.style.color = '#666';
    
    // Create admin user list
    const userListContainer = document.createElement('div');
    userListContainer.style.marginBottom = '25px';
    userListContainer.style.maxHeight = '200px';
    userListContainer.style.overflowY = 'auto';
    userListContainer.style.padding = '10px';
    userListContainer.style.borderRadius = '10px';
    userListContainer.style.backgroundColor = '#f9f9f9';
    
    adminUsers.forEach(admin => {
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-user-item';
        adminItem.style.padding = '10px 15px';
        adminItem.style.margin = '8px 0';
        adminItem.style.backgroundColor = '#fff';
        adminItem.style.borderRadius = '8px';
        adminItem.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        adminItem.style.cursor = 'pointer';
        adminItem.style.transition = 'all 0.2s ease';
        adminItem.style.display = 'flex';
        adminItem.style.justifyContent = 'space-between';
        adminItem.style.alignItems = 'center';
        
        adminItem.innerHTML = `
            <div>
                <span style="font-weight: 600;">${admin.username}</span>
                <span style="display: block; font-size: 12px; color: #666;">${admin.role}</span>
            </div>
        `;
        
        adminItem.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 15px rgba(244, 67, 54, 0.2)';
            this.style.backgroundColor = '#fff8f8';
        });
        
        adminItem.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            this.style.backgroundColor = '#fff';
        });
        
        adminItem.addEventListener('click', function() {
            // Show password verification for selected admin
            showPasswordVerification(admin, username, selectionModal);
        });
        
        userListContainer.appendChild(adminItem);
    });
    
    // Close button at the bottom
    const closeButtonContainer = document.createElement('div');
    closeButtonContainer.style.textAlign = 'center';
    closeButtonContainer.style.marginTop = '20px';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cancel';
    closeButton.style.backgroundColor = '#f0f0f0';
    closeButton.style.color = '#666';
    closeButton.style.padding = '10px 25px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = '600';
    closeButton.style.transition = 'all 0.2s ease';
    
    closeButton.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#e0e0e0';
        this.style.transform = 'translateY(-2px)';
    });
    
    closeButton.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#f0f0f0';
        this.style.transform = 'translateY(0)';
    });
    
    closeButton.addEventListener('click', function() {
        document.body.removeChild(selectionModal);
    });
    
    closeButtonContainer.appendChild(closeButton);
    
    // Add a close button in top right
    const topCloseButton = document.createElement('button');
    topCloseButton.innerHTML = '&times;';
    topCloseButton.style.position = 'absolute';
    topCloseButton.style.top = '10px';
    topCloseButton.style.right = '15px';
    topCloseButton.style.background = 'none';
    topCloseButton.style.border = 'none';
    topCloseButton.style.fontSize = '24px';
    topCloseButton.style.cursor = 'pointer';
    topCloseButton.style.color = '#aaa';
    topCloseButton.style.transition = 'color 0.2s';
    
    topCloseButton.addEventListener('mouseover', function() {
        this.style.color = '#f44336';
    });
    
    topCloseButton.addEventListener('mouseout', function() {
        this.style.color = '#aaa';
    });
    
    topCloseButton.addEventListener('click', function() {
        document.body.removeChild(selectionModal);
    });
    
    // Assemble the modal
    modalContent.appendChild(topCloseButton);
    modalContent.appendChild(title);
    modalContent.appendChild(text);
    modalContent.appendChild(userListContainer);
    modalContent.appendChild(closeButtonContainer);
    
    selectionModal.appendChild(modalContent);
    document.body.appendChild(selectionModal);
}

// Show password verification for selected admin
function showPasswordVerification(admin, userToForceOut, previousModal) {
    // Create verification modal
    const verificationModal = document.createElement('div');
    verificationModal.style.position = 'fixed';
    verificationModal.style.top = '0';
    verificationModal.style.left = '0';
    verificationModal.style.width = '100%';
    verificationModal.style.height = '100%';
    verificationModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    verificationModal.style.backdropFilter = 'blur(5px)';
    verificationModal.style.WebkitBackdropFilter = 'blur(5px)';
    verificationModal.style.display = 'flex';
    verificationModal.style.justifyContent = 'center';
    verificationModal.style.alignItems = 'center';
    verificationModal.style.zIndex = '2001';
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '20px';
    modalContent.style.padding = '30px';
    modalContent.style.width = '350px';
    modalContent.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
    modalContent.style.textAlign = 'center';
    modalContent.style.animation = 'modalFadeIn 0.3s ease';
    modalContent.style.position = 'relative';
    
    // Add a colored top border
    modalContent.style.borderTop = '6px solid #f44336';
    
    const title = document.createElement('h3');
    title.textContent = 'Password Verification';
    title.style.marginTop = '0';
    title.style.color = '#f44336';
    title.style.fontSize = '22px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '15px';
    
    const text = document.createElement('p');
    text.innerHTML = `Enter password for <span style="color: #f44336; font-weight: 600;">${admin.username}</span> to force out ${userToForceOut}:`;
    text.style.marginBottom = '20px';
    text.style.color = '#666';
    
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Enter password';
    passwordInput.style.width = '100%';
    passwordInput.style.padding = '12px 15px';
    passwordInput.style.margin = '10px 0 20px';
    passwordInput.style.border = '1px solid #ddd';
    passwordInput.style.borderRadius = '10px';
    passwordInput.style.fontSize = '16px';
    passwordInput.style.boxSizing = 'border-box';
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.justifyContent = 'space-between';
    buttonsDiv.style.gap = '15px';
    
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.style.flex = '1';
    backButton.style.padding = '12px 0';
    backButton.style.border = 'none';
    backButton.style.borderRadius = '10px';
    backButton.style.fontWeight = '600';
    backButton.style.cursor = 'pointer';
    backButton.style.transition = 'all 0.2s ease';
    backButton.style.backgroundColor = '#f0f0f0';
    backButton.style.color = '#666';
    
    const verifyButton = document.createElement('button');
    verifyButton.textContent = 'Force Out';
    verifyButton.style.flex = '1';
    verifyButton.style.padding = '12px 0';
    verifyButton.style.border = 'none';
    verifyButton.style.borderRadius = '10px';
    verifyButton.style.fontWeight = '600';
    verifyButton.style.cursor = 'pointer';
    verifyButton.style.transition = 'all 0.2s ease';
    verifyButton.style.backgroundColor = '#f44336';
    verifyButton.style.color = 'white';
    
    // Add hover effects
    backButton.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#e0e0e0';
        this.style.transform = 'translateY(-2px)';
    });
    
    backButton.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#f0f0f0';
        this.style.transform = 'translateY(0)';
    });
    
    verifyButton.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(244, 67, 54, 0.3)';
    });
    
    verifyButton.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    
    // Add event listeners
    backButton.addEventListener('click', function() {
        document.body.removeChild(verificationModal);
    });
    
    verifyButton.addEventListener('click', function() {
        const password = passwordInput.value;
        if (!password) {
            alert('Please enter a password');
            return;
        }
        
        if (admin.password === password) {
            // Remove from active users
            removeActiveUser(userToForceOut);
            
            // Remove both modals
            document.body.removeChild(verificationModal);
            document.body.removeChild(previousModal);
            
            // Show success message
            const successToast = createToast(`${userToForceOut} has been forced out by ${admin.username}`, 'success');
            document.body.appendChild(successToast);
            setTimeout(() => {
                successToast.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(successToast);
                }, 500);
            }, 3000);
            
            // Refresh active users modal
            openActiveUsersModal();
        } else {
            // Show error message
            const errorMsg = document.createElement('p');
            errorMsg.textContent = 'Invalid password. Please try again.';
            errorMsg.style.color = '#ff3333';
            errorMsg.style.margin = '0 0 15px 0';
            errorMsg.style.fontSize = '14px';
            
            // Remove any existing error message
            const existingError = modalContent.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Add class for easy removal
            errorMsg.classList.add('error-message');
            
            // Insert before buttons
            buttonsDiv.parentNode.insertBefore(errorMsg, buttonsDiv);
            
            // Clear password field
            passwordInput.value = '';
            passwordInput.focus();
            
            // Add shake animation
            modalContent.style.animation = 'none';
            setTimeout(() => {
                modalContent.style.animation = 'shake 0.5s';
            }, 10);
        }
    });
    
    // Add keypress handler for Enter key
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyButton.click();
        }
    });
    
    // Add a close button in top right
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
    closeButton.style.transition = 'color 0.2s';
    
    closeButton.addEventListener('mouseover', function() {
        this.style.color = '#f44336';
    });
    
    closeButton.addEventListener('mouseout', function() {
        this.style.color = '#aaa';
    });
    
    closeButton.addEventListener('click', function() {
        document.body.removeChild(verificationModal);
    });
    
    // Assemble the modal
    buttonsDiv.appendChild(backButton);
    buttonsDiv.appendChild(verifyButton);
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(text);
    modalContent.appendChild(passwordInput);
    modalContent.appendChild(buttonsDiv);
    
    verificationModal.appendChild(modalContent);
    document.body.appendChild(verificationModal);
    
    // Focus the password field
    setTimeout(() => {
        passwordInput.focus();
    }, 100);
}

// Helper function to remove a user from active users
function removeActiveUser(username) {
    const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
    const updatedActiveUsers = activeUsers.filter(user => user.username !== username);
    localStorage.setItem('activeUsers', JSON.stringify(updatedActiveUsers));
    
    // Update count
    updateActiveUsersCount();
}

// Setup Active Users functionality
function setupActiveUsersButtons() {
    const teamMonumeCard = document.querySelector('.stat-card');
    
    if (teamMonumeCard) {
        // Set up the Team MonuMe card header
        const cardHeader = teamMonumeCard.querySelector('.stat-card-header');
        if (cardHeader) {
            cardHeader.innerHTML = `
                <h2 class="team-monume-title">
                    <i class="fas fa-users" style="color: #ff7f42; margin-right: 10px;"></i>
                    Team MonuMe
                </h2>
            `;
        }
        
        // Set up the active users info section
        const activeUsersInfo = teamMonumeCard.querySelector('.active-users-info');
        if (activeUsersInfo) {
            // Get active users count from localStorage
            const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
            activeUsersInfo.innerHTML = `
                <h2 class="stat-card-value" id="activeUsers">${activeUsers.length}</h2>
                <p class="stat-card-description">Active Team Members</p>
            `;
        }
        
        // Set up the action buttons
        const actionButtons = teamMonumeCard.querySelector('.stat-card-actions');
        if (actionButtons) {
            actionButtons.innerHTML = `
                <button class="action-button start-btn" id="start-session-btn">
                    <i class="fas fa-play"></i> Start
                </button>
                <button class="action-button view-btn" id="view-active-users-btn">
                    <i class="fas fa-users"></i> Activate
                </button>
            `;
            
            // Add event listeners for the buttons
            const startSessionBtn = document.getElementById('start-session-btn');
            const viewActiveUsersBtn = document.getElementById('view-active-users-btn');
            
            if (startSessionBtn) {
                startSessionBtn.addEventListener('click', openUserSelectionModal);
            }
            
            if (viewActiveUsersBtn) {
                viewActiveUsersBtn.addEventListener('click', openActiveUsersModal);
            }
        }
    }
    
    // Set up event listeners for the modal close buttons
    const closeActiveUsersBtn = document.getElementById('close-active-users');
    if (closeActiveUsersBtn) {
        closeActiveUsersBtn.addEventListener('click', closeActiveUsersModal);
    }
    
    const forceoutCloseBtn = document.getElementById('forceout-close');
    if (forceoutCloseBtn) {
        forceoutCloseBtn.addEventListener('click', closeForceOutModal);
    }
    
    const forceoutCancelBtn = document.getElementById('forceout-cancel-btn');
    if (forceoutCancelBtn) {
        forceoutCancelBtn.addEventListener('click', closeForceOutModal);
    }
    
    const forceoutConfirmBtn = document.getElementById('forceout-confirm-btn');
    if (forceoutConfirmBtn) {
        forceoutConfirmBtn.addEventListener('click', confirmForceOut);
    }
}

// Initialize users database if needed
function initializeUsersDatabase() {
    // Check if the users DB exists, if not create default users
    if (!localStorage.getItem('monumeUsers')) {
        const defaultUsers = [
            { 
                id: 1,
                username: "Admin", 
                password: "admin123", 
                role: "admin",
                name: "Admin User",
                email: "admin@example.com",
                location: "Main Office" 
            },
            { 
                id: 2,
                username: "Manager", 
                password: "manager123", 
                role: "manager",
                name: "John Manager",
                email: "manager@example.com",
                location: "West Branch" 
            },
            { 
                id: 3,
                username: "Staff1", 
                password: "staff123", 
                role: "employee",
                name: "Jane Employee",
                email: "employee@example.com",
                location: "East Branch" 
            },
            { 
                id: 4,
                username: "Staff2", 
                password: "staff123", 
                role: "employee",
                name: "Bob Worker",
                email: "bob@example.com",
                location: "North Branch" 
            }
        ];
        localStorage.setItem('monumeUsers', JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem('activeUsers')) {
        localStorage.setItem('activeUsers', JSON.stringify([]));
    }
}

// Close active users modal
function closeActiveUsersModal() {
    const modal = document.getElementById('active-users-modal');
    if (modal) {
        modal.style.display = 'none';
        
        // Remove event listeners to prevent duplicate bindings
        const activeUserList = document.getElementById('active-user-list');
        if (activeUserList) {
            activeUserList.removeEventListener('click', handleActiveUserButtonClick);
        }
    }
}

// Function to open active users modal - EXACTLY matches ActiveUsers.html
function openActiveUsersModal() {
    const modal = document.getElementById('active-users-modal');
    const activeUserList = document.getElementById('active-user-list');
    
    // Clear previous list
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
        // Create user items
        activeUsers.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'active-user-item';
            userItem.setAttribute('data-username', user.username);
            
            const startTime = new Date(user.startTime);
            const timeActive = getTimeActive(startTime);
            
            userItem.innerHTML = `
                <div class="active-user-name">${user.username} <span style="font-weight: normal; font-size: 13px; color: #666;">(${timeActive})</span></div>
                <div class="active-user-buttons">
                    <button class="unactive-btn">Unactive</button>
                    <button class="forceout-btn">Force Out</button>
                </div>
            `;
            
            activeUserList.appendChild(userItem);
        });
    }
    
    // Show the modal
    modal.style.display = 'flex';
}

// Handle clicks on the active user buttons
function handleActiveUserButtonClick(e) {
    if (e.target.classList.contains('unactive-btn')) {
        const username = e.target.closest('.active-user-item').getAttribute('data-username');
        deactivateUser(username);
    } else if (e.target.classList.contains('forceout-btn')) {
        const username = e.target.closest('.active-user-item').getAttribute('data-username');
        forceOutUser(username);
    }
}

// Get time active in human-readable format
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

// Get current user role
function getCurrentUserRole() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) return 'guest';
    
    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    const user = users.find(u => u.username === currentUser);
    
    return user ? user.role : 'guest';
}

// Add shake animation for error feedback
document.head.insertAdjacentHTML('beforeend', `
    <style>
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    </style>
`);