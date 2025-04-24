// Custom script for Team MonuMe functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get references to the team modal elements
    const teamModal = document.getElementById('team-modal');
    const teamModalClose = document.querySelector('.team-modal-close');
    const cancelTeamModalBtn = document.getElementById('cancelTeamModalBtn');
    const teamUserGrid = document.getElementById('teamUserGrid');
    const teamNoUsersMessage = document.getElementById('teamNoUsersMessage');
    
    // Get references to the buttons in the Team MonuMe card
    const startSessionBtn = document.getElementById('start-session-btn');
    const viewActiveUsersBtn = document.getElementById('view-active-users-btn');
    
    // Add event listeners to the buttons
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', function() {
            openTeamModal();
        });
    }
    
    if (viewActiveUsersBtn) {
        viewActiveUsersBtn.addEventListener('click', function() {
            // Create a custom view instead
            showActiveUsersView();
        });
    }
    
    // Modal close buttons
    if (teamModalClose) {
        teamModalClose.addEventListener('click', closeTeamModal);
    }
    
    if (cancelTeamModalBtn) {
        cancelTeamModalBtn.addEventListener('click', closeTeamModal);
    }
    
    // Close when clicking outside the modal content
    window.addEventListener('click', function(e) {
        if (e.target === teamModal) {
            closeTeamModal();
        }
    });
    
    // Function to open the team modal
    function openTeamModal() {
        // Clear previous content
        teamUserGrid.innerHTML = "";
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
        const activeUsernames = activeUsers.map(user => user.username);
        
        // Create default users if none exist
        if (users.length === 0) {
            const defaultUsers = [
                { username: 'Admin', password: 'admin', role: 'admin' },
                { username: 'Manager', password: 'manager', role: 'manager' },
                { username: 'Staff1', password: 'staff', role: 'staff' },
                { username: 'Staff2', password: 'staff', role: 'staff' }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
        
        // Filter out users that are already active
        const availableUsers = users.filter(user => !activeUsernames.includes(user.username));
        
        if (availableUsers.length === 0) {
            // Show the "no users" message
            teamNoUsersMessage.style.display = "flex";
            
            // Hide the confirm button since no users are available
            const confirmButtonContainer = document.getElementById('team-modal-confirm-btn-container');
            if (confirmButtonContainer) {
                confirmButtonContainer.style.display = 'none';
            }
        } else {
            // Hide the "no users" message
            teamNoUsersMessage.style.display = "none";
            
            // Track selected user
            let selectedUser = null;
            let selectedUserItem = null;
            
            // Create user cards for the grid
            availableUsers.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.setAttribute('data-username', user.username);
                
                const userAvatar = document.createElement('div');
                userAvatar.className = 'user-item-avatar';
                userAvatar.textContent = user.username.charAt(0).toUpperCase();
                
                const userName = document.createElement('div');
                userName.className = 'user-item-name';
                userName.textContent = user.username;
                
                const userRole = document.createElement('div');
                userRole.className = 'user-item-role';
                userRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                
                // Add selection indicator
                const selectionIndicator = document.createElement('div');
                selectionIndicator.className = 'selection-indicator';
                selectionIndicator.innerHTML = '<i class="fas fa-check-circle"></i>';
                selectionIndicator.style.position = 'absolute';
                selectionIndicator.style.top = '10px';
                selectionIndicator.style.right = '10px';
                selectionIndicator.style.fontSize = '22px';
                selectionIndicator.style.color = '#4caf50';
                selectionIndicator.style.opacity = '0';
                selectionIndicator.style.transition = 'opacity 0.3s ease';
                
                userItem.appendChild(userAvatar);
                userItem.appendChild(userName);
                userItem.appendChild(userRole);
                userItem.appendChild(selectionIndicator);
                
                // Add visual styles for selection state
                userItem.style.position = 'relative';
                userItem.style.transition = 'all 0.3s ease';
                userItem.style.cursor = 'pointer';
                userItem.style.borderWidth = '2px';
                userItem.style.borderStyle = 'solid';
                userItem.style.borderColor = 'transparent';
                
                // Add click event to select this user
                userItem.addEventListener('click', function() {
                    // Remove previous selection
                    if (selectedUserItem) {
                        selectedUserItem.style.borderColor = 'transparent';
                        selectedUserItem.style.boxShadow = '';
                        selectedUserItem.querySelector('.selection-indicator').style.opacity = '0';
                    }
                    
                    // Set new selection
                    selectedUser = user;
                    selectedUserItem = userItem;
                    
                    // Update UI to show selection
                    userItem.style.borderColor = '#4caf50';
                    userItem.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.3)';
                    userItem.querySelector('.selection-indicator').style.opacity = '1';
                    
                    // Update and show the confirm button
                    const confirmBtn = document.getElementById('team-modal-confirm-btn');
                    const confirmButtonContainer = document.getElementById('team-modal-confirm-btn-container');
                    
                    if (confirmBtn && confirmButtonContainer) {
                        confirmButtonContainer.style.display = 'block';
                        confirmBtn.textContent = `Confirm Selection: ${user.username}`;
                        
                        // Update the button click handler
                        confirmBtn.onclick = function() {
                            // Store the selected user
                            localStorage.setItem('verifying-username', user.username);
                            
                            // Close the selection modal
                            closeTeamModal();
                            
                            // Open the password verification in a new window
                            openPasswordVerificationWindow(user.username);
                        };
                    }
                });
                
                teamUserGrid.appendChild(userItem);
            });
            
            // Show the confirm button container
            const confirmButtonContainer = document.getElementById('team-modal-confirm-btn-container');
            if (confirmButtonContainer) {
                // Initially hide until user selects
                confirmButtonContainer.style.display = 'none';
            } else {
                // Create it if it doesn't exist
                addConfirmButton();
            }
        }
        
        // Show the modal
        teamModal.classList.add('show');
    }
    
    // Function to add Confirm button to the team modal
    function addConfirmButton() {
        // Find buttons container
        const teamModalButtons = document.querySelector('.team-modal-buttons');
        
        if (teamModalButtons) {
            // Add a container for the confirm button (for better control)
            const confirmButtonContainer = document.createElement('div');
            confirmButtonContainer.id = 'team-modal-confirm-btn-container';
            confirmButtonContainer.style.display = 'none'; // Initially hidden
            confirmButtonContainer.style.marginBottom = '20px';
            
            // Create Confirm button
            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'team-modal-confirm-btn';
            confirmBtn.className = 'team-modal-button primary';
            confirmBtn.textContent = 'Confirm Selection';
            confirmBtn.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
            confirmBtn.style.width = '100%';
            confirmBtn.style.color = 'white';
            confirmBtn.style.fontWeight = 'bold';
            confirmBtn.style.padding = '12px 0';
            confirmBtn.style.marginTop = '15px';
            
            // Add to container
            confirmButtonContainer.appendChild(confirmBtn);
            
            // Insert before the buttons div
            teamModalButtons.parentNode.insertBefore(confirmButtonContainer, teamModalButtons);
        }
    }
    
    // Function to open password verification window
    function openPasswordVerificationWindow(username) {
        // Create a styled window for password verification
        const modal = document.createElement('div');
        modal.id = 'password-verification-window';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.backdropFilter = 'blur(5px)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '9100';
        
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '20px';
        modalContent.style.padding = '30px';
        modalContent.style.width = '400px';
        modalContent.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
        modalContent.style.textAlign = 'center';
        modalContent.style.position = 'relative';
        modalContent.style.animation = 'modalFadeIn 0.3s ease';
        
        // Add top gradient bar
        modalContent.style.position = 'relative';
        modalContent.style.overflow = 'hidden';
        modalContent.style.paddingTop = '40px';
        
        const gradientBar = document.createElement('div');
        gradientBar.style.position = 'absolute';
        gradientBar.style.top = '0';
        gradientBar.style.left = '0';
        gradientBar.style.width = '100%';
        gradientBar.style.height = '8px';
        gradientBar.style.background = 'linear-gradient(to right, #4caf50, #2e7d32)';
        modalContent.appendChild(gradientBar);
        
        // User profile display
        const userProfile = document.createElement('div');
        userProfile.style.marginBottom = '25px';
        
        // Get user information
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username);
        
        // User avatar
        const userAvatar = document.createElement('div');
        userAvatar.style.width = '80px';
        userAvatar.style.height = '80px';
        userAvatar.style.margin = '0 auto 15px';
        userAvatar.style.borderRadius = '50%';
        userAvatar.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
        userAvatar.style.color = 'white';
        userAvatar.style.display = 'flex';
        userAvatar.style.alignItems = 'center';
        userAvatar.style.justifyContent = 'center';
        userAvatar.style.fontSize = '36px';
        userAvatar.style.fontWeight = '600';
        userAvatar.textContent = username.charAt(0).toUpperCase();
        userProfile.appendChild(userAvatar);
        
        // Username
        const userName = document.createElement('h3');
        userName.style.margin = '0 0 5px';
        userName.style.color = '#333';
        userName.style.fontSize = '22px';
        userName.textContent = username;
        userProfile.appendChild(userName);
        
        // User role
        if (user) {
            const userRole = document.createElement('p');
            userRole.style.margin = '0';
            userRole.style.color = '#666';
            userRole.style.fontSize = '16px';
            userRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            userProfile.appendChild(userRole);
        }
        
        modalContent.appendChild(userProfile);
        
        // Title
        const title = document.createElement('h3');
        title.textContent = 'Enter Password';
        title.style.color = '#4caf50';
        title.style.fontSize = '20px';
        title.style.fontWeight = '600';
        title.style.marginBottom = '15px';
        modalContent.appendChild(title);
        
        // Password input
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = 'Password';
        passwordInput.style.width = '100%';
        passwordInput.style.padding = '15px';
        passwordInput.style.margin = '10px 0 25px';
        passwordInput.style.border = '1px solid #ddd';
        passwordInput.style.borderRadius = '10px';
        passwordInput.style.fontSize = '16px';
        passwordInput.style.boxSizing = 'border-box';
        modalContent.appendChild(passwordInput);
        
        // Error message area (hidden by default)
        const errorMsg = document.createElement('p');
        errorMsg.style.color = '#ff3333';
        errorMsg.style.margin = '0 0 15px 0';
        errorMsg.style.fontSize = '14px';
        errorMsg.style.display = 'none';
        errorMsg.classList.add('error-message');
        modalContent.appendChild(errorMsg);
        
        // Buttons container
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.justifyContent = 'space-between';
        buttonsDiv.style.gap = '15px';
        
        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.flex = '1';
        cancelButton.style.padding = '14px 0';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '10px';
        cancelButton.style.fontWeight = '600';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.transition = 'all 0.3s ease';
        cancelButton.style.backgroundColor = '#f0f0f0';
        cancelButton.style.color = '#666';
        
        // Activate button
        const activateButton = document.createElement('button');
        activateButton.textContent = 'Activate User';
        activateButton.style.flex = '1';
        activateButton.style.padding = '14px 0';
        activateButton.style.border = 'none';
        activateButton.style.borderRadius = '10px';
        activateButton.style.fontWeight = '600';
        activateButton.style.cursor = 'pointer';
        activateButton.style.transition = 'all 0.3s ease';
        activateButton.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
        activateButton.style.color = 'white';
        
        // Add hover effects
        cancelButton.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#e0e0e0';
            this.style.transform = 'translateY(-2px)';
        });
        
        cancelButton.addEventListener('mouseout', function() {
            this.style.backgroundColor = '#f0f0f0';
            this.style.transform = 'translateY(0)';
        });
        
        activateButton.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.3)';
        });
        
        activateButton.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        // Add event listeners
        cancelButton.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Handle activate button click
        activateButton.addEventListener('click', function() {
            verifyAndActivateUser(passwordInput.value, username, errorMsg, modal);
        });
        
        // Add keypress handler for Enter key
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyAndActivateUser(passwordInput.value, username, errorMsg, modal);
            }
        });
        
        // Add a close button in top right
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '15px';
        closeButton.style.right = '15px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#aaa';
        closeButton.style.transition = 'color 0.2s';
        closeButton.style.zIndex = '1';
        
        closeButton.addEventListener('mouseover', function() {
            this.style.color = '#4caf50';
        });
        
        closeButton.addEventListener('mouseout', function() {
            this.style.color = '#aaa';
        });
        
        closeButton.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Assemble the modal
        buttonsDiv.appendChild(cancelButton);
        buttonsDiv.appendChild(activateButton);
        modalContent.appendChild(buttonsDiv);
        modalContent.appendChild(closeButton);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Focus the password field
        setTimeout(() => {
            passwordInput.focus();
        }, 100);
    }
    
    // Function to verify and activate a user
    function verifyAndActivateUser(password, username, errorMsg, modal) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username);
        
        if (user && user.password === password) {
            // Add to active users
            const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
            activeUsers.push({
                username: username,
                role: user.role,
                startTime: new Date().toISOString()
            });
            localStorage.setItem('activeUsers', JSON.stringify(activeUsers));
            
            // Update count
            updateActiveUsersCount();
            
            // Create success animation
            createSuccessAnimation(modal, username);
        } else {
            // Show error message
            errorMsg.textContent = 'Invalid password. Please try again.';
            errorMsg.style.display = 'block';
            
            // Shake animation for error
            const modalContent = modal.querySelector('div');
            modalContent.style.animation = 'shake 0.5s';
            
            // Reset animation after it completes
            setTimeout(() => {
                modalContent.style.animation = '';
            }, 500);
            
            // Clear password field
            const passwordInput = modal.querySelector('input[type="password"]');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }
    
    // Function to create success animation and message
    function createSuccessAnimation(modal, username) {
        // Get the modal content
        const modalContent = modal.querySelector('div');
        
        // Create success animation overlay
        const successOverlay = document.createElement('div');
        successOverlay.style.position = 'absolute';
        successOverlay.style.top = '0';
        successOverlay.style.left = '0';
        successOverlay.style.width = '100%';
        successOverlay.style.height = '100%';
        successOverlay.style.background = 'white';
        successOverlay.style.display = 'flex';
        successOverlay.style.flexDirection = 'column';
        successOverlay.style.alignItems = 'center';
        successOverlay.style.justifyContent = 'center';
        successOverlay.style.borderRadius = '20px';
        successOverlay.style.zIndex = '2';
        successOverlay.style.animation = 'fadeIn 0.3s ease';
        
        // Success icon
        const successIcon = document.createElement('div');
        successIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        successIcon.style.fontSize = '80px';
        successIcon.style.color = '#4caf50';
        successIcon.style.marginBottom = '20px';
        successIcon.style.animation = 'bounceIn 0.5s ease 0.3s both';
        
        // Success message
        const successMessage = document.createElement('h3');
        successMessage.textContent = `${username} has been activated!`;
        successMessage.style.color = '#333';
        successMessage.style.fontSize = '22px';
        successMessage.style.marginBottom = '30px';
        successMessage.style.animation = 'fadeIn 0.5s ease 0.5s both';
        
        // Redirecting message
        const redirectMessage = document.createElement('p');
        redirectMessage.textContent = 'Redirecting to tracking page...';
        redirectMessage.style.color = '#666';
        redirectMessage.style.fontSize = '16px';
        redirectMessage.style.animation = 'fadeIn 0.5s ease 0.7s both';
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bounceIn {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.2); }
                80% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes shake {
                0%, 100% {transform: translateX(0);}
                10%, 30%, 50%, 70%, 90% {transform: translateX(-5px);}
                20%, 40%, 60%, 80% {transform: translateX(5px);}
            }
        `;
        document.head.appendChild(style);
        
        // Assemble and add to modal
        successOverlay.appendChild(successIcon);
        successOverlay.appendChild(successMessage);
        successOverlay.appendChild(redirectMessage);
        modalContent.appendChild(successOverlay);
        
        // Close modal and redirect after delay
        setTimeout(() => {
            document.body.removeChild(modal);
            
            // Store the active user in session storage for the tracking page
            sessionStorage.setItem('currentActiveUser', username);
            
            // Redirect to tracking.html
            window.location.href = '/static/tracking.html';
        }, 2000);
    }
    
    // Function to close the team modal
    function closeTeamModal() {
        teamModal.classList.remove('show');
    }
    
    // Update active users count
    updateActiveUsersCount();
});

// Update active users count function
function updateActiveUsersCount() {
    const activeUsersElement = document.getElementById('activeUsers');
    if (activeUsersElement) {
        const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
        activeUsersElement.textContent = activeUsers.length;
    }
}

// Function to show active users in a custom view
function showActiveUsersView() {
    // Create custom modal styled to match the existing UI
    const modal = document.createElement('div');
    modal.id = 'custom-active-users-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '2000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.backdropFilter = 'blur(8px)';
    
    // Create modal content styled with the team-modal-content classes
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '24px';
    modalContent.style.padding = '35px';
    modalContent.style.width = '500px';
    modalContent.style.maxWidth = '90%';
    modalContent.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.25)';
    modalContent.style.position = 'relative';
    modalContent.style.overflow = 'hidden';
    modalContent.style.animation = 'slideIn 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
    
    // Add the gradient top border
    modalContent.style.position = 'relative';
    modalContent.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 8px; background: linear-gradient(to right, #ff7f42, #ff9562, #ff7f42); background-size: 200% 100%; animation: gradient-shift 3s ease infinite;"></div>
        <button class="team-modal-close" style="position: absolute; top: 20px; right: 25px; background: none; border: none; font-size: 28px; cursor: pointer; color: #aaa; transition: all 0.3s; z-index: 10; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%;">&times;</button>
        <h2 class="team-modal-title" style="color: #ff7f42; font-size: 28px; font-weight: 700; margin-bottom: 25px; text-align: center; position: relative; display: inline-block; left: 50%; transform: translateX(-50%);">Active Users</h2>
        <div id="active-users-container" style="margin: 20px 0;"></div>
    `;
    
    // Append modal to body
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Get close button and add event listener
    const closeBtn = modalContent.querySelector('.team-modal-close');
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Close when clicking outside the modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Add ESC key listener to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('custom-active-users-modal')) {
            document.body.removeChild(modal);
        }
    });
    
    // Get active users container
    const activeUsersContainer = modalContent.querySelector('#active-users-container');
    
    // Get active users from localStorage
    const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
    
    if (activeUsers.length === 0) {
        // Display no active users message
        activeUsersContainer.innerHTML = `
            <div class="info-message" style="background-color: rgba(255, 127, 66, 0.1); border-radius: 14px; padding: 16px; color: #ff7f42; font-size: 14px; margin: 20px 0; display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-info-circle" style="font-size: 20px;"></i>
                <span>There are no active users at this time.</span>
            </div>
        `;
    } else {
        // Create active users list
        let usersHTML = '';
        
        activeUsers.forEach(user => {
            // Calculate time active
            const startTime = new Date(user.startTime);
            const now = new Date();
            const diffMs = now - startTime;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const remainingMins = diffMins % 60;
            
            let timeActiveText;
            if (diffHours > 0) {
                timeActiveText = `${diffHours}h ${remainingMins}m`;
            } else {
                timeActiveText = `${diffMins}m`;
            }
            
            const userInitial = user.username.charAt(0).toUpperCase();
            
            usersHTML += `
                <div class="active-user-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid rgba(238, 238, 238, 0.8); transition: all 0.3s; background-color: white; border-radius: 14px; margin-bottom: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
                    <div class="active-user-info" style="display: flex; align-items: center; gap: 15px;">
                        <div class="active-user-avatar" style="width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #ff7f42, #ff9562); color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600;">${userInitial}</div>
                        <div class="active-user-detail" style="display: flex; flex-direction: column;">
                            <div class="active-user-name" style="font-weight: 700; color: #333; font-size: 16px;">${user.username}</div>
                            <div class="active-user-role" style="font-size: 13px; color: #666;">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
                            <div class="active-user-time" style="font-size: 13px; color: #666; margin-top: 3px;">Active for: ${timeActiveText}</div>
                        </div>
                    </div>
                    <button class="deactivate-btn" data-username="${user.username}" style="padding: 8px 16px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; background-color: rgba(255, 149, 98, 0.15); color: #ff9562;">Deactivate</button>
                </div>
            `;
        });
        
        activeUsersContainer.innerHTML = usersHTML;
        
        // Add event listeners to deactivate buttons
        const deactivateButtons = activeUsersContainer.querySelectorAll('.deactivate-btn');
        deactivateButtons.forEach(button => {
            button.addEventListener('click', function() {
                const username = this.getAttribute('data-username');
                deactivateUser(username);
                
                // Remove the user item from the list
                const userItem = this.closest('.active-user-item');
                userItem.remove();
                
                // If no users left, show the empty state
                const remainingUsers = activeUsersContainer.querySelectorAll('.active-user-item');
                if (remainingUsers.length === 0) {
                    activeUsersContainer.innerHTML = `
                        <div class="info-message" style="background-color: rgba(255, 127, 66, 0.1); border-radius: 14px; padding: 16px; color: #ff7f42; font-size: 14px; margin: 20px 0; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-info-circle" style="font-size: 20px;"></i>
                            <span>There are no active users at this time.</span>
                        </div>
                    `;
                }
            });
        });
    }
}

// Deactivate user function
function deactivateUser(username) {
    // Get active users
    const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
    // Remove the user
    const updatedActiveUsers = activeUsers.filter(user => user.username !== username);
    // Save back to localStorage
    localStorage.setItem('activeUsers', JSON.stringify(updatedActiveUsers));
    // Update counter
    updateActiveUsersCount();
    // Show success message
    alert(`${username} has been deactivated`);
}