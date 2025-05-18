document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for Active Users buttons in the Team MonuMe card
    const startSessionBtn = document.getElementById('start-session-btn');
    const viewActiveUsersBtn = document.getElementById('view-active-users-btn');
    
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', function() {
            // Open the user selection modal
            openUserSelectionModal();
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
    
    // Set up event listener for view active users button
    if (viewActiveUsersBtn) {
        viewActiveUsersBtn.addEventListener('click', function() {
            // Open the active users modal
            openActiveUsersModal();
        });
    } else {
        console.error('view-active-users-btn not found in the DOM.');
    }
    
    // Close button in active users content
    const closeButton = document.getElementById('active-users-close-btn');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            const modal = document.getElementById('active-users-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Ensure the "Force Out" button functionality is set up correctly
    const activeUserList = document.getElementById('active-user-list');

    if (activeUserList) {
        activeUserList.addEventListener('click', function(e) {
            if (e.target.classList.contains('forceout-btn')) {
                console.log('Force Out button clicked.'); // Debug log
                const username = e.target.closest('.active-user-item')?.getAttribute('data-username');
                if (username) {
                    console.log(`Username retrieved: ${username}`); // Debug log
                    openForceOutModal(username);
                } else {
                    console.error('Failed to retrieve username for Force Out button.');
                }
            } else {
                console.log('Clicked element is not a Force Out button.'); // Debug log
            }
        });
    } else {
        console.error('Active user list not found in the DOM.');
    }
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
    // Check if a verification modal already exists
    const existingModal = document.querySelector('.verification-modal');
    if (existingModal) {
        return; // Exit if a modal is already open
    }

    // Create a styled modal for password verification
    const verificationModal = document.createElement('div');
    verificationModal.className = 'verification-modal';
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

    // Remove existing event listeners to prevent duplicates
    cancelButton.replaceWith(cancelButton.cloneNode(true));
    verifyButton.replaceWith(verifyButton.cloneNode(true));

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
    console.log(`Force Out button clicked for user: ${username}`); // Debug log

    // Check if a force-out modal already exists
    const existingModal = document.querySelector('.forceout-modal');
    if (existingModal) {
        console.log('Force-out modal already exists. Exiting.'); // Debug log
        return; // Exit if a modal is already open
    }

    console.log('Creating force-out modal...'); // Debug log

    // Create admin selection modal
    const selectionModal = document.createElement('div');
    selectionModal.className = 'forceout-modal';
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

    console.log('Force-out modal content created.'); // Debug log

    // Add a colored top border - red for force out
    modalContent.style.borderTop = '6px solid #f44336';

    const title = document.createElement('h3');
    title.textContent = 'Force Out User';
    title.style.marginTop = '0';
    title.style.color = '#f44336';
    title.style.fontSize = '22px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '15px';

    const text = document.createElement('p');
    text.innerHTML = `Select an admin or manager to authorize the force out of <span style="color: #f44336; font-weight: 600;">${username}</span>:`;
    text.style.marginBottom = '20px';
    text.style.color = '#666';

    console.log('Adding dropdown and password input to modal.'); // Debug log

    // Create admin/manager dropdown
    const dropdown = document.createElement('select');
    dropdown.style.width = '100%';
    dropdown.style.padding = '10px';
    dropdown.style.marginBottom = '20px';
    dropdown.style.border = '1px solid #ddd';
    dropdown.style.borderRadius = '10px';
    dropdown.style.fontSize = '16px';

    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    const adminUsers = users.filter(user => user.role === 'admin' || user.role === 'manager');

    if (adminUsers.length === 0) {
        console.error('No admin or manager users found.'); // Debug log
        alert('No admin or manager users available to authorize this action.');
        return;
    }

    adminUsers.forEach(admin => {
        const option = document.createElement('option');
        option.value = admin.username;
        option.textContent = `${admin.name || admin.username} (${admin.role})`;
        dropdown.appendChild(option);
    });

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
    verifyButton.style.backgroundColor = '#f44336';
    verifyButton.style.color = 'white';

    console.log('Adding event listeners to modal buttons.'); // Debug log

    // Add event listeners
    cancelButton.addEventListener('click', function() {
        console.log('Force-out modal canceled.'); // Debug log
        document.body.removeChild(selectionModal);
    });

    verifyButton.addEventListener('click', function() {
        const selectedAdmin = dropdown.value;
        const password = passwordInput.value;

        if (!password) {
            alert('Please enter a password');
            return;
        }

        const admin = adminUsers.find(user => user.username === selectedAdmin);

        if (admin && admin.password === password) {
            console.log(`Force-out authorized by ${selectedAdmin}.`); // Debug log
            // Remove user from active users
            removeActiveUser(username);

            // Remove the modal
            document.body.removeChild(selectionModal);

            // Show success message
            const successToast = createToast(`${username} has been forced out successfully`, 'success');
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
            console.error('Invalid password entered.'); // Debug log
            alert('Invalid password. Please try again.');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    console.log('Assembling modal content.'); // Debug log

    // Assemble the modal
    buttonsDiv.appendChild(cancelButton);
    buttonsDiv.appendChild(verifyButton);

    modalContent.appendChild(title);
    modalContent.appendChild(text);
    modalContent.appendChild(dropdown);
    modalContent.appendChild(passwordInput);
    modalContent.appendChild(buttonsDiv);

    selectionModal.appendChild(modalContent);
    document.body.appendChild(selectionModal);

    console.log('Force-out modal displayed.'); // Debug log
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
                <button class="action-button" id="start-session-btn">Start</button>
                <button class="action-button" id="view-active-users-btn">View</button>
            `;
            
            // Apply exact styles from the Gift Card card buttons in dashboard.html
            actionButtons.style.display = 'flex';
            actionButtons.style.gap = '15px';
            actionButtons.style.marginTop = '20px';
            
            // Apply the correct button styling to match Gift Card buttons
            const buttons = actionButtons.querySelectorAll('.action-button');
            buttons.forEach(button => {
                // Apply the exact styling from Gift Card buttons in dashboard.html
                button.style.flex = '1';
                button.style.display = 'flex';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';
                button.style.padding = '12px 15px';
                button.style.border = 'none';
                button.style.borderRadius = '12px'; // Same as Gift Card buttons
                button.style.fontWeight = '600';
                button.style.fontSize = '14px';
                button.style.cursor = 'pointer';
                button.style.transition = 'all 0.3s ease';
                button.style.background = '#272430'; // Matching sidebar background
                button.style.color = 'white';
                button.style.boxShadow = '0 4px 12px rgba(39, 36, 48, 0.2)';
                button.style.textTransform = 'none';
            });
            
            // Add event listeners for the buttons
            const startSessionBtn = document.getElementById('start-session-btn');
            const viewActiveUsersBtn = document.getElementById('view-active-users-btn');
            
            if (startSessionBtn) {
                startSessionBtn.addEventListener('click', openUserSelectionModal);
                
                // Add hover effect matching Gift Card buttons
                startSessionBtn.addEventListener('mouseover', function() {
                    this.style.transform = 'translateY(-5px)';
                    this.style.boxShadow = '0 8px 15px rgba(39, 36, 48, 0.3)';
                    this.style.background = 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))';
                });
                
                startSessionBtn.addEventListener('mouseout', function() {
                    this.style.transform = '';
                    this.style.boxShadow = '0 4px 12px rgba(39, 36, 48, 0.2)';
                    this.style.background = '#272430';
                });
            }
            
            if (viewActiveUsersBtn) {
                viewActiveUsersBtn.addEventListener('click', openActiveUsersModal);
                
                // Add hover effect matching Gift Card buttons
                viewActiveUsersBtn.addEventListener('mouseover', function() {
                    this.style.transform = 'translateY(-5px)';
                    this.style.boxShadow = '0 8px 15px rgba(39, 36, 48, 0.3)';
                    this.style.background = 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))';
                });
                
                viewActiveUsersBtn.addEventListener('mouseout', function() {
                    this.style.transform = '';
                    this.style.boxShadow = '0 4px 12px rgba(39, 36, 48, 0.2)';
                    this.style.background = '#272430';
                });
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

// Function to open active users modal
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
            
            // Directly attach event listeners to each button for immediate effect
            const unactiveBtn = userItem.querySelector('.unactive-btn');
            const forceOutBtn = userItem.querySelector('.forceout-btn');
            
            if (unactiveBtn) {
                unactiveBtn.addEventListener('click', function() {
                    console.log(`Direct unactive button clicked for ${user.username}`);
                    deactivateUser(user.username);
                });
            }
            
            if (forceOutBtn) {
                forceOutBtn.addEventListener('click', function() {
                    console.log(`Direct force out button clicked for ${user.username}`);
                    openForceOutModal(user.username);
                });
            }
        });
    }

    // Show the modal
    modal.style.display = 'flex';

    // This is the old event delegation approach, keeping it as a fallback
    // Remove any existing event listener to prevent duplicates
    activeUserList.removeEventListener('click', handleActiveUserButtonClick);
    
    // Add event listener for buttons in active user list
    activeUserList.addEventListener('click', handleActiveUserButtonClick);
}

// Handle clicks on the active user buttons 
function handleActiveUserButtonClick(e) {
    console.log('Active user button clicked:', e.target); // Debug log

    if (e.target.classList.contains('unactive-btn')) {
        const username = e.target.closest('.active-user-item')?.getAttribute('data-username');
        if (username) {
            console.log('Unactive button clicked for user:', username); // Debug log
            deactivateUser(username);
        } else {
            console.error('Failed to retrieve username for Unactive button.');
        }
    } else if (e.target.classList.contains('forceout-btn')) {
        const username = e.target.closest('.active-user-item')?.getAttribute('data-username');
        if (username) {
            console.log('Force Out button clicked for user:', username); // Debug log
            openForceOutModal(username);
        } else {
            console.error('Failed to retrieve username for Force Out button.');
        }
    } else {
        console.log('Clicked element is not a recognized button.'); // Debug log
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

// Close Force Out Modal
function closeForceOutModal() {
    const modal = document.getElementById('forceout-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Confirm Force Out action
function confirmForceOut() {
    const modal = document.getElementById('forceout-modal');
    const adminSelect = document.getElementById('forceout-admin-select');
    const passwordInput = document.getElementById('forceout-password');
    const errorElement = document.getElementById('forceout-error');
    const username = modal.getAttribute('data-forceout-username');
    const adminUsername = adminSelect.value;
    const password = passwordInput.value;

    if (!adminUsername) {
        errorElement.textContent = 'Please select a manager or admin';
        errorElement.style.display = 'block';
        return;
    }
    if (!password) {
        errorElement.textContent = 'Please enter the password';
        errorElement.style.display = 'block';
        return;
    }
    // Verify password for selected admin/manager
    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    const admin = users.find(u => u.username === adminUsername && (u.role === 'admin' || u.role === 'manager'));
    if (admin && admin.password === password) {
        // Remove user from active users
        removeActiveUser(username);
        closeForceOutModal();
        alert(`${username} has been forced out successfully`);
        openActiveUsersModal();
    } else {
        errorElement.textContent = 'Invalid password. Please try again.';
        errorElement.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Function to open the Force Out modal for a specific user
function openForceOutModal(username) {
    const modal = document.getElementById('forceout-modal');
    const userDisplay = document.getElementById('forceout-user-display');
    const adminSelect = document.getElementById('forceout-admin-select');
    const errorElement = document.getElementById('forceout-error');
    const passwordInput = document.getElementById('forceout-password');

    // Show the username to be forced out
    if (userDisplay) userDisplay.textContent = username;
    // Clear previous error
    if (errorElement) errorElement.style.display = 'none';
    // Clear password field
    if (passwordInput) passwordInput.value = '';
    // Clear previous options
    if (adminSelect) adminSelect.innerHTML = '';

    // Get all managers and admins
    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    const adminUsers = users.filter(user => user.role === 'admin' || user.role === 'manager');
    adminUsers.forEach(admin => {
        const option = document.createElement('option');
        option.value = admin.username;
        option.textContent = `${admin.name || admin.username} (${admin.role})`;
        adminSelect.appendChild(option);
    });
    // Show the modal
    if (modal) modal.style.display = 'flex';
    // Focus the password field
    setTimeout(() => {
        if (passwordInput) passwordInput.focus();
    }, 100);
    // Store the username to be forced out for confirmation
    modal.setAttribute('data-forceout-username', username);
}

// Add this function to support the Start Session modal on dashboard.html
function openUserSelectionModal() {
    const modal = document.getElementById('user-selection-modal');
    const userList = document.getElementById('user-list');
    if (!modal || !userList) return;
    // Clear previous list
    userList.innerHTML = '';
    // Get all users and active users
    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
    const activeUsernames = activeUsers.map(user => user.username);
    // Create user items, excluding already active users
    users.forEach(user => {
        if (!activeUsernames.includes(user.username)) {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.setAttribute('data-username', user.username);
            userItem.textContent = user.name || user.username;
            userItem.addEventListener('click', function() {
                selectUser(user.username);
            });
            userList.appendChild(userItem);
        }
    });
    // Show the modal
    modal.style.display = 'flex';
}

function selectUser(username) {
    document.getElementById('selected-username').textContent = username;
    document.getElementById('user-password').value = '';
    // Close selection modal and open password modal
    document.getElementById('user-selection-modal').style.display = 'none';
    document.getElementById('password-modal').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('user-password').focus();
    }, 100);
}

function closeUserSelectionModal() {
    document.getElementById('user-selection-modal').style.display = 'none';
}

function closePasswordModal() {
    document.getElementById('password-modal').style.display = 'none';
}

function verifyPasswordAndStart() {
    const username = document.getElementById('selected-username').textContent;
    const password = document.getElementById('user-password').value;
    const users = JSON.parse(localStorage.getItem('monumeUsers')) || [];
    const user = users.find(u => u.username === username);
    if (user && user.password === password) {
        // Add user to active users
        const activeUsers = JSON.parse(localStorage.getItem('activeUsers')) || [];
        activeUsers.push({ username: user.username, role: user.role, startTime: new Date().toISOString() });
        localStorage.setItem('activeUsers', JSON.stringify(activeUsers));
        updateActiveUsersCount();
        closePasswordModal();
        // Optionally redirect or show a success message
    } else {
        alert('Invalid password. Please try again.');
        document.getElementById('user-password').value = '';
        document.getElementById('user-password').focus();
    }
}

// Attach modal button event listeners
if (document.getElementById('cancel-selection')) {
    document.getElementById('cancel-selection').onclick = closeUserSelectionModal;
}
if (document.getElementById('cancel-password')) {
    document.getElementById('cancel-password').onclick = closePasswordModal;
}
if (document.getElementById('verify-password')) {
    document.getElementById('verify-password').onclick = verifyPasswordAndStart;
}