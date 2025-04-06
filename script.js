// Function to determine the base URL for API calls
function getBaseUrl() {
    // This function helps with path resolution regardless of deployment environment
    return window.location.origin;
}

// Show login box if the video fails
function showLogin() {
    const loginEl = document.getElementById("loginDiv");
    if (!loginEl) return;
    loginEl.style.display = "block";
}

// Hide animation after video ends
document.addEventListener("DOMContentLoaded", function () {
    const video = document.querySelector(".intro-video");
    const animationContainer = document.querySelector(".animation-container");
    const loginContainer = document.querySelector(".login-container");

    if (video) {
        video.onended = function () {
            animationContainer.style.opacity = "0";
            setTimeout(() => {
                animationContainer.style.display = "none";
                loginContainer.style.opacity = "1";
            }, 1000);
        };
    } else {
        showLogin();
    }
});

// Check if the user has permission to access the management page
function checkManagementAccess() {
    const role = localStorage.getItem('role');
    if (role !== 'admin' && role !== 'manager') {
        alert('Access denied. Only admins and managers can access this page.');
        window.location.href = './static/dashboard.html';
        return false;
    }
    return true;
}

// Function to prompt for password verification before allowing access to management
async function verifyPasswordForManagement() {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    
    if (role !== 'admin' && role !== 'manager') {
        alert('Access denied. Only admins and managers can access this page.');
        return false;
    }
    
    // Show modal instead of using prompt
    displayPasswordModal(username);
    return new Promise((resolve) => {
        // Store the resolve function to be called when the modal is submitted
        window.confirmPasswordCallback = (success) => {
            resolve(success);
        };
    });
}

// Function to display the password verification modal
function displayPasswordModal(username) {
    // Create modal if it doesn't exist
    if (!document.getElementById('password-verification-modal')) {
        const modalHtml = `
            <div id="password-verification-modal" class="verification-modal">
                <div class="verification-modal-content">
                    <h3>Password Verification</h3>
                    <p>Please enter your password to continue, ${username}</p>
                    <input type="password" id="verification-password" placeholder="Your password">
                    <div class="verification-buttons">
                        <button onclick="cancelPasswordVerification()">Cancel</button>
                        <button onclick="submitPasswordVerification()">Verify</button>
                    </div>
                </div>
            </div>
            <div id="verification-modal-overlay" class="verification-overlay"></div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .verification-modal {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                z-index: 2000;
                width: 350px;
                text-align: center;
            }
            
            .verification-modal-content h3 {
                color: #ff9562;
                margin-top: 0;
                font-size: 20px;
            }
            
            .verification-modal-content input {
                width: 100%;
                padding: 10px;
                margin: 15px 0;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-sizing: border-box;
            }
            
            .verification-buttons {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                margin-top: 20px;
            }
            
            .verification-buttons button {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .verification-buttons button:first-child {
                background: #f0f0f0;
                color: #555;
            }
            
            .verification-buttons button:last-child {
                background: #ff9562;
                color: white;
            }
            
            .verification-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1999;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Show the modal
    document.getElementById('password-verification-modal').style.display = 'block';
    document.getElementById('verification-modal-overlay').style.display = 'block';
    
    // Focus on the password input
    setTimeout(() => {
        document.getElementById('verification-password').focus();
    }, 100);
}

// Function to close the password verification modal
function cancelPasswordVerification() {
    document.getElementById('password-verification-modal').style.display = 'none';
    document.getElementById('verification-modal-overlay').style.display = 'none';
    if (window.confirmPasswordCallback) {
        window.confirmPasswordCallback(false);
    }
}

// Function to submit the password verification
async function submitPasswordVerification() {
    const username = localStorage.getItem('username');
    const password = document.getElementById('verification-password').value;
    
    if (!password) {
        alert("Please enter your password");
        return;
    }
    
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/verify_password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Close the modal
            document.getElementById('password-verification-modal').style.display = 'none';
            document.getElementById('verification-modal-overlay').style.display = 'none';
            
            // Call the callback with success
            if (window.confirmPasswordCallback) {
                window.confirmPasswordCallback(true);
            }
        } else {
            alert("Password verification failed: " + result.error);
            if (window.confirmPasswordCallback) {
                window.confirmPasswordCallback(false);
            }
        }
    } catch (error) {
        console.error("Error verifying password:", error);
        alert("Error verifying password. Please try again.");
        if (window.confirmPasswordCallback) {
            window.confirmPasswordCallback(false);
        }
    }
}

// Add event listener for Enter key in password field
document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && 
            document.getElementById('verification-password') && 
            document.getElementById('verification-password') === document.activeElement) {
            submitPasswordVerification();
        }
    });
});

// Function to load the sidebar
function loadSidebar() {
    const baseUrl = getBaseUrl();
    fetch(`${baseUrl}/static/sidebar.html`)
        .then(response => response.text())
        .then(data => {
            document.querySelector('.sidebar-container').innerHTML = data;
            
            // After loading sidebar, apply role-based access controls
            applyRoleBasedSidebarAccess();
            highlightActiveSidebarItem();
        })
        .catch(error => console.error('Error loading sidebar:', error));
}

// Function to apply role-based access controls to sidebar
function applyRoleBasedSidebarAccess() {
    const role = localStorage.getItem('role');
    
    // Get the management link if it exists
    const managementLink = document.querySelector('a[href="management.html"]');
    
    if (managementLink) {
        // Replace default link with a function that verifies password
        managementLink.href = "javascript:void(0)";
        managementLink.onclick = async function() {
            if (await verifyPasswordForManagement()) {
                window.location.href = "./static/management.html";
            }
        };
        
        // Hide management link entirely if the user is an employee
        if (role === 'employee') {
            managementLink.parentElement.style.display = 'none';
        }
    }
}

// Call loadSidebar when the document is ready
document.addEventListener('DOMContentLoaded', loadSidebar);

// Login function
async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        document.getElementById("login-error").innerText = "Please enter username and password.";
        return;
    }

    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Login successful:", data);
            
            // Store all user information in localStorage
            localStorage.setItem("username", data.username);
            localStorage.setItem("role", data.role);
            localStorage.setItem("location", data.location);
            localStorage.setItem("user_id", data.user_id);
            
            console.log(`User role stored: ${data.role}`);
            window.location.href = "./static/dashboard.html"; // Redirect to dashboard
        } else {
            console.error("Login failed:", data.error);
            document.getElementById("login-error").innerText = data.error;
        }
    } catch (error) {
        console.error("Login error:", error);
        document.getElementById("login-error").innerText = "Server error. Try again.";
    }
}

// Function to save a new user
async function saveUser() {
    const username = document.getElementById("new-username").value;
    const email = document.getElementById("new-email").value;
    const passcode = document.getElementById("new-passcode").value;
    const role = document.getElementById("new-role").value;
    const location = document.getElementById("new-location").value;

    if (!username || !email || !passcode || !role || !location) {
        alert("All fields are required.");
        return;
    }

    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/create_user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, passcode, role, location }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("User created successfully!");
            // Reload the user list or update the UI as needed
        } else {
            alert("Failed to create user: " + data.error);
        }
    } catch (error) {
        console.error("Error creating user:", error);
        alert("Server error. Try again.");
    }
}

// Function to edit an existing user
async function editUser(userId) {
    const username = document.getElementById("edit-username").value;
    const email = document.getElementById("edit-email").value;
    const passcode = document.getElementById("edit-passcode").value;
    const name = document.getElementById("edit-name").value;
    const role = document.getElementById("edit-role").value;
    const location = document.getElementById("edit-location").value;

    if (!username || !email || !passcode || !name || !role || !location) {
        alert("All fields are required.");
        return;
    }

    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/update_user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, username, email, passcode, name, role, location }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("User updated successfully!");
            // Reload the user list or update the UI as needed
        } else {
            alert("Failed to update user: " + data.error);
        }
    } catch (error) {
        console.error("Error updating user:", error);
        alert("Server error. Try again.");
    }
}

let currentPage = 1;
let pageSize = 10;

// Fetch and display history
async function loadHistory() {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/get_history`);
        const data = await response.json();
        displayByUser(data.history);
        displayByQuestion(data.history);
    } catch (error) {
        console.error("Error loading history:", error);
    }
}

// Populate the history table
function populateTable(historyData) {
    const table = document.getElementById("historyTable");
    if (!table) return;
    const tableBody = document.querySelector("#history-container");
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>User</th>
                    <th>Date</th>
                    <th>Opal Demos</th>
                    <th>Opal Sales</th>
                    <th>Scan Demos</th>
                    <th>Scan Sold</th>
                    <th>Net Sales</th>
                    <th>Hours Worked</th>
                </tr>
            </thead>
            <tbody>
    `;

    historyData.forEach(row => {
        tableHTML += `
            <tr>
                <td>${row[0]}</td>
                <td>${row[1]}</td>
                <td>${row[2]}</td>
                <td>${row[3]}</td>
                <td>${row[4]}</td>
                <td>${row[5]}</td>
                <td>${row[6]}</td>
                <td>${row[7]}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    tableBody.innerHTML = tableHTML;
}

function displayByUser(history) {
    const container = document.getElementById("by-user-boxes");
    if (!container) return;
    container.innerHTML = "";
    // Group by user
    const groupedByUser = {};
    history.forEach(item => {
        if (!groupedByUser[item.username]) {
            groupedByUser[item.username] = [];
        }
        groupedByUser[item.username].push(item);
    });
    for (const user in groupedByUser) {
        const box = document.createElement("div");
        box.classList.add("history-box");
        box.innerHTML = `<h3>${user}</h3>`;
        groupedByUser[user].forEach(record => {
            box.innerHTML += `<p>${record.date}: Opal Sales: ${record.opal_sales}, Scan Sold: ${record.scan_sold}</p>`;
        });
        container.appendChild(box);
    }
}

function displayByQuestion(history) {
    const container = document.getElementById("by-question-boxes");
    if (!container) return;
    container.innerHTML = "";
    // For demonstration, let's pick fixed questions
    const questions = ["opal_demos", "opal_sales", "scan_demos", "scan_sold"];
    questions.forEach(q => {
        const box = document.createElement("div");
        box.classList.add("history-box");
        box.innerHTML = `<h3>${q.replace('_', ' ').toUpperCase()}</h3>`;
        history.forEach(record => {
            box.innerHTML += `<p>${record.username} (${record.date}): ${record[q]}</p>`;
        });
        container.appendChild(box);
    });
}

// Run history load when the page is ready
document.addEventListener("DOMContentLoaded", loadHistory);

// Function to load locations for the dropdown list
async function loadLocations() {
    try {
        // Get the containers, check if they exist first
        const locationsDiv = document.getElementById("locationsContainer");
        const locationDropdown = document.getElementById('newLocation');
        const container = document.getElementById("location-container");
        
        // If none of the relevant elements exist on this page, just exit early
        if (!locationsDiv && !locationDropdown && !container) {
            console.log("No location elements found on this page, skipping location loading");
            return;
        }
        
        // Fetch the locations data
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/get_locations`);
        const data = await response.json();
        
        // Update dropdown if it exists
        if (locationDropdown) {
            locationDropdown.innerHTML = "";
            data.locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location.location_name;
                option.textContent = location.location_name;
                locationDropdown.appendChild(option);
            });
        }
        
        // Update container if it exists
        if (container) {
            container.innerHTML = "";
            if (data.locations && data.locations.length > 0) {
                data.locations.forEach(location => {
                    const card = document.createElement("div");
                    card.classList.add("location-card");
                    card.innerHTML = `
                        <h3>${location.location_name}</h3>
                        <p>${location.mall}</p>
                        <div class="location-actions">
                            <button class="btn btn-edit" onclick="openEditLocationModal(${location.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-delete" onclick="removeLocation(${location.id})">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    `;
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state__icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <h3 class="empty-state__title">No Locations Yet</h3>
                        <p class="empty-state__text">Click the + button to add your first location</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error("Error loading locations:", error);
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h3>Error Loading Locations</h3>
                    <p>An error occurred while loading locations. Please try again.</p>
                    <button class="btn btn-edit" onclick="loadLocations()">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

function openAddLocationModal() {
    document.getElementById("add-location-modal").style.display = "flex";
}

function closeAddLocationModal() {
    document.getElementById("add-location-modal").style.display = "none";
}

async function addLocation() {
    const locationName = document.getElementById("location-name").value;
    const mall = document.getElementById("mall-name").value;
    if (locationName && mall) {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/add_location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location_name: locationName, mall: mall })
        });
        if (response.ok) {
            closeAddLocationModal();
            loadLocations();
        } else {
            alert("Failed to add location.");
        }
    }
}

async function removeLocation(locationId) {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/remove_location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location_id: locationId })
    });
    if (response.ok) {
        loadLocations();
    } else {
        alert("Failed to remove location.");
    }
}

async function editLocation(locationId) {
    const locationName = prompt("Enter new location name:");
    const mall = prompt("Enter new mall name:");
    if (locationName && mall) {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/update_location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location_id: locationId, location_name: locationName, mall: mall })
        });
        if (response.ok) {
            loadLocations();
        } else {
            alert("Failed to update location.");
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Only call loadLocations if the page might need it
    if (window.location.pathname.includes('management') || 
        document.getElementById("locationsContainer") || 
        document.getElementById("location-container") ||
        document.getElementById("newLocation")) {
        loadLocations();
    }
});

function loadData() {
    // Fetch data from server and populate HTML elements
    // Example AJAX call to load data based on filters
}

function applyFilters() {
    const user = document.getElementById('userFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const question = document.getElementById('questionFilter').value;

    // Example filter application logic
}

function compareData() {
    // Logic to compare data between users or locations
    // Example: Collecting values from the filter and making a request to the server
}

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    // Populate user and question filters dynamically
});

window.onload = function() {
    // You can also initialize event listeners or initial data loading here
};

// Add function to handle automatic emailing on save
async function saveTrackingDataWithEmail(data) {
    try {
        showLoadingIndicator();
        
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/save_tracking_with_email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        hideLoadingIndicator();
        
        if (response.ok) {
            // Show success message with email status
            if (result.email_sent) {
                showNotification('Tracking data saved successfully and performance summary email sent!', 'success');
            } else {
                showNotification('Tracking data saved successfully but email could not be sent.', 'warning');
            }
            return true;
        } else {
            showNotification(`Error: ${result.error || 'Unknown error'}`, 'error');
            console.error('Error saving tracking data:', result);
            return false;
        }
    } catch (error) {
        hideLoadingIndicator();
        showNotification(`Error: ${error.message}`, 'error');
        console.error('Error in saveTrackingDataWithEmail:', error);
        return false;
    }
}

// Add these utility functions for notifications
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    notification.style.transition = 'all 0.3s ease';
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4caf50';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#2196f3';
            notification.style.color = 'white';
    }
    
    notification.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.onclick = () => notification.remove();
    notification.appendChild(closeBtn);
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function showLoadingIndicator() {
    // Create or show loading indicator
    let loader = document.getElementById('loading-indicator');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100%';
        loader.style.height = '100%';
        loader.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loader.style.display = 'flex';
        loader.style.alignItems = 'center';
        loader.style.justifyContent = 'center';
        loader.style.zIndex = '9999';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.border = '5px solid #f3f3f3';
        spinner.style.borderTop = '5px solid #ff9562';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '50px';
        spinner.style.height = '50px';
        spinner.style.animation = 'spin 1s linear infinite';
        
        const keyframes = document.createElement('style');
        keyframes.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(keyframes);
        
        loader.appendChild(spinner);
        document.body.appendChild(loader);
    } else {
        loader.style.display = 'flex';
    }
}

function hideLoadingIndicator() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = 'none';
    }
}

// This file will contain common functionality for all pages

// Function to load the sidebar on all pages
function loadSidebar() {
    const sidebarContainer = document.querySelector('.sidebar-container');
    
    if (sidebarContainer) {
        fetch('sidebar.html')
            .then(response => response.text())
            .then(data => {
                sidebarContainer.innerHTML = data;
                
                // Determine which sidebar item should be active based on current page
                const currentPage = window.location.pathname.split('/').pop();
                highlightActiveSidebarItem(currentPage);
            })
            .catch(error => {
                console.error('Error loading sidebar:', error);
            });
    }
}

// Function to highlight the active sidebar item based on current page
function highlightActiveSidebarItem(currentPage) {
    if (!currentPage || currentPage === '' || currentPage === 'index.html') {
        return; // No need to highlight anything on the login page
    }
    
    // Map pages to their corresponding sidebar items
    const pageToItem = {
        'dashboard.html': 1,
        'management.html': 2,
        'tracking.html': 3,
        'analytics.html': 4,
        'morning_notes.html': 5
    };
    
    const itemIndex = pageToItem[currentPage];
    
    if (itemIndex) {
        const sidebarItem = document.querySelector(`.sidebar-item:nth-child(${itemIndex})`);
        if (sidebarItem) {
            sidebarItem.classList.add('active');
            
            // For analytics page, we need special handling due to the verification
            if (currentPage === 'analytics.html') {
                const analyticsLink = document.getElementById('analytics-link');
                if (analyticsLink) {
                    analyticsLink.classList.add('active');
                }
            }
        }
    }
}

// Add after existing sidebar code
function highlightActiveSidebarItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const sidebarLinks = document.querySelectorAll('.sidebar-menu li a');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.parentElement.classList.add('active');
        }
    });
}

// Add theme colors to be used across the application
const THEME = {
    mainColor: '#ff9562',
    gradientStart: '#ff7f42',
    gradientEnd: '#ff9562',
    sidebarBg: 'rgba(15, 23, 42, 0.9)',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    cardHoverBg: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#333',
    textSecondary: '#666',
    textLight: '#f8f9fa'
};

// Load sidebar when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadSidebar();
    
    // Additional common functionality can be added here
});

// Global function to handle analytics verification
function showAnalyticsVerification() {
    // Create and show the verification modal
    const modalHTML = `
        <div id="analytics-verification-modal" style="
            display: flex;
            position: fixed;
            z-index: 1001;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;">
            <div style="
                background-color: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
                width: 350px;
                text-align: center;">
                <h3 style="margin-top: 0; color: #ff9562;">Analytics Login</h3>
                <p>Please enter your credentials to access Analytics</p>
                <input type="text" id="verification-username" placeholder="Username" style="
                    width: calc(100% - 20px);
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #ddd;
                    border-radius: 8px;">
                <input type="password" id="verification-password" placeholder="Password" style="
                    width: calc(100% - 20px);
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #ddd;
                    border-radius: 8px;">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    margin-top: 20px;">
                    <button onclick="cancelAnalyticsVerification()" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        background-color: #f0f0f0;
                        color: #333;">Cancel</button>
                    <button onclick="submitAnalyticsVerification()" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        background-color: #ff9562;
                        color: white;">Login</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstChild);
    
    // Focus on username input
    document.getElementById('verification-username').focus();
    
    // Add event listener for Enter key in password field
    document.getElementById('verification-password').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            submitAnalyticsVerification();
        }
    });
}

function cancelAnalyticsVerification() {
    const modal = document.getElementById('analytics-verification-modal');
    if (modal) {
        modal.remove();
    }
}

function submitAnalyticsVerification() {
    const username = document.getElementById('verification-username').value;
    const password = document.getElementById('verification-password').value;
    
    // Basic validation
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    
    // Set localStorage items
    localStorage.setItem('username', username);
    
    // Determine role based on credentials (this is a simple implementation)
    let role, location;
    if (username === 'admin' && password === 'admin') {
        role = 'admin';
        location = 'all';
    } else if (username === 'manager' && password === 'manager') {
        role = 'manager';
        location = 'Location1';
    } else if (username === 'employee' && password === 'employee') {
        role = 'employee';
        location = 'Location1';
    } else {
        alert('Invalid username or password.');
        return;
    }
    
    // Store role and location
    localStorage.setItem('role', role);
    localStorage.setItem('location', location);
    
    // Remove the modal
    const modal = document.getElementById('analytics-verification-modal');
    if (modal) {
        modal.remove();
    }
    
    // Redirect to analytics page
    window.location.href = 'analytics.html';
}

// Morning Notes Notification System
function checkMorningNotes() {
    const notes = JSON.parse(localStorage.getItem('morningNotes') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    const uncompletedNotes = notes.filter(note => 
        !note.completed && 
        note.date === today
    );

    if (uncompletedNotes.length > 0) {
        showMorningNoteNotification(uncompletedNotes);
    }
}

function showMorningNoteNotification(notes) {
    // Remove any existing morning note notifications
    const existingNotifications = document.querySelectorAll('.morning-note-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'morning-note-notification';
    notification.innerHTML = `
        <div class="notification-header">
            <i class="fas fa-coffee"></i>
            <span>Morning Notes</span>
            <button class="close-btn">&times;</button>
        </div>
        <div class="notification-content">
            <p>You have ${notes.length} uncompleted morning note${notes.length > 1 ? 's' : ''}</p>
            <a href="/static/morning_notes.html" class="view-btn">View Notes</a>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        width: 300px;
        z-index: 9999;
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .morning-note-notification .notification-header {
            background: var(--main-color, #ff9562);
            color: white;
            padding: 12px 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .morning-note-notification .close-btn {
            margin-left: auto;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0 5px;
        }
        .morning-note-notification .notification-content {
            padding: 15px;
        }
        .morning-note-notification .view-btn {
            display: inline-block;
            background: var(--main-color, #ff9562);
            color: white;
            text-decoration: none;
            padding: 8px 15px;
            border-radius: 5px;
            margin-top: 10px;
            transition: background 0.3s;
        }
        .morning-note-notification .view-btn:hover {
            background: var(--gradient-start, #ff7f42);
        }
    `;
    document.head.appendChild(style);

    // Add close button functionality
    notification.querySelector('.close-btn').addEventListener('click', () => {
        notification.remove();
    });

    // Add to DOM
    document.body.appendChild(notification);
}

// Check for morning notes every minute
setInterval(checkMorningNotes, 60000);

// Also check when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkMorningNotes();
});

// Location management functions
function openAddLocationModal() {
    document.getElementById('add-location-modal').style.display = 'flex';
    document.getElementById('location-name').focus();
}

function closeAddLocationModal() {
    document.getElementById('add-location-modal').style.display = 'none';
    document.getElementById('location-name').value = '';
    document.getElementById('mall-name').value = '';
}

function openEditLocationModal(locationId) {
    fetch(`/get_location/${locationId}`)
        .then(response => response.json())
        .then(location => {
            document.getElementById('edit-location-id').value = location.id;
            document.getElementById('edit-location-name').value = location.location_name;
            document.getElementById('edit-mall-name').value = location.mall;
            document.getElementById('edit-location-modal').style.display = 'flex';
        })
        .catch(error => {
            console.error('Error fetching location:', error);
            showNotification('Error loading location details', 'error');
        });
}

function closeEditLocationModal() {
    document.getElementById('edit-location-modal').style.display = 'none';
}

// Global click handler to close modals when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('add-location-modal');
    const editModal = document.getElementById('edit-location-modal');
    if (event.target === addModal) {
        closeAddLocationModal();
    } else if (event.target === editModal) {
        closeEditLocationModal();
    }
}

// ESC key handler to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAddLocationModal();
        closeEditLocationModal();
    }
});

// Load locations from server
async function loadLocations() {
    try {
        const response = await fetch('/get_locations');
        const data = await response.json();
        
        const container = document.getElementById('location-container');
        if (!container) return;

        if (!data.locations || data.locations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <h2 class="empty-state__title">No Locations Yet</h2>
                    <p class="empty-state__text">Add your first location to get started</p>
                </div>`;
            return;
        }

        container.innerHTML = data.locations.map(location => `
            <div class="location-card">
                <h3>${location.location_name}</h3>
                <p>${location.mall}</p>
                <div class="location-actions">
                    <button class="btn btn-edit" onclick="editLocation(${location.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete" onclick="deleteLocation(${location.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading locations:', error);
        showNotification('Error loading locations', 'error');
    }
}

// Modal functions
function openAddLocationModal() {
    const modal = document.getElementById('add-location-modal');
    modal.style.display = 'flex';
}

function closeAddLocationModal() {
    const modal = document.getElementById('add-location-modal');
    modal.style.display = 'none';
    document.getElementById('add-location-form').reset();
}

function openEditLocationModal() {
    const modal = document.getElementById('edit-location-modal');
    modal.style.display = 'flex';
}

function closeEditLocationModal() {
    const modal = document.getElementById('edit-location-modal');
    modal.style.display = 'none';
    document.getElementById('edit-location-form').reset();
}

// Add location
async function addLocation() {
    const locationName = document.getElementById('location-name').value;
    const mall = document.getElementById('mall-name').value;

    if (!locationName || !mall) {
        showNotification('Please fill in all fields', 'error');
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

        if (!response.ok) {
            throw new Error('Failed to add location');
        }

        const data = await response.json();
        showNotification('Location added successfully', 'success');
        closeAddLocationModal();
        loadLocations();
    } catch (error) {
        console.error('Error adding location:', error);
        showNotification('Error adding location', 'error');
    }
}

// Edit location
async function editLocation(locationId) {
    try {
        const response = await fetch(`/get_location/${locationId}`);
        const location = await response.json();

        document.getElementById('edit-location-id').value = location.id;
        document.getElementById('edit-location-name').value = location.location_name;
        document.getElementById('edit-mall-name').value = location.mall;

        openEditLocationModal();
    } catch (error) {
        console.error('Error loading location details:', error);
        showNotification('Error loading location details', 'error');
    }
}

// Delete location
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
            body: JSON.stringify({ location_id: locationId })
        });

        if (!response.ok) {
            throw new Error('Failed to delete location');
        }

        showNotification('Location deleted successfully', 'success');
        loadLocations();
    } catch (error) {
        console.error('Error deleting location:', error);
        showNotification('Error deleting location', 'error');
    }
}

// Update location
async function updateLocation(event) {
    event.preventDefault();

    const locationId = document.getElementById('edit-location-id').value;
    const locationName = document.getElementById('edit-location-name').value;
    const mall = document.getElementById('edit-mall-name').value;

    if (!locationName || !mall) {
        showNotification('Please fill in all fields', 'error');
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

        if (!response.ok) {
            throw new Error('Failed to update location');
        }

        showNotification('Location updated successfully', 'success');
        closeEditLocationModal();
        loadLocations();
    } catch (error) {
        console.error('Error updating location:', error);
        showNotification('Error updating location', 'error');
    }
}
