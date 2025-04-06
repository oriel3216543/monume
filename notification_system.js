// Notification system for incomplete tasks

class TaskNotificationSystem {
    constructor() {
        this.notificationContainer = null;
        this.notifications = [];
        this.checkInterval = 60000; // Check every minute
        this.intervalId = null;
    }
    
    // Initialize the notification system
    init() {
        this.createNotificationContainer();
        this.startPeriodicCheck();
        // Check immediately on load
        this.checkForTasks();
    }
    
    // Create the notification container
    createNotificationContainer() {
        if (document.getElementById('global-notification-container')) {
            this.notificationContainer = document.getElementById('global-notification-container');
            return;
        }
        
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'global-notification-container';
        this.notificationContainer.style.position = 'fixed';
        this.notificationContainer.style.bottom = '20px';
        this.notificationContainer.style.right = '20px';
        this.notificationContainer.style.zIndex = '9999';
        this.notificationContainer.style.display = 'flex';
        this.notificationContainer.style.flexDirection = 'column';
        this.notificationContainer.style.gap = '10px';
        document.body.appendChild(this.notificationContainer);
    }
    
    // Start periodic check for tasks
    startPeriodicCheck() {
        // Clear any existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Set new interval
        this.intervalId = setInterval(() => {
            this.checkForTasks();
        }, this.checkInterval);
    }
    
    // Check for incomplete tasks
    checkForTasks() {
        // Check for morning notes to complete
        this.checkMorningNotes();
        
        // Add other task checks here in the future
    }
    
    // Check for morning notes that need to be completed
    checkMorningNotes() {
        const storedNotes = localStorage.getItem('morningNotes');
        if (!storedNotes) return;
        
        const notes = JSON.parse(storedNotes);
        const incompleteTasks = notes.filter(note => !note.completed);
        
        if (incompleteTasks.length > 0) {
            const notificationId = 'morning-notes-notification';
            
            // Check if we already have this notification
            if (!this.notifications.includes(notificationId)) {
                this.showNotification(
                    'Morning Notes',
                    `You have ${incompleteTasks.length} morning ${incompleteTasks.length === 1 ? 'note' : 'notes'} to complete`,
                    'morning_notes.html',
                    notificationId
                );
                this.notifications.push(notificationId);
            }
        } else {
            // Remove notification if all notes are completed
            this.removeNotification('morning-notes-notification');
            this.notifications = this.notifications.filter(id => id !== 'morning-notes-notification');
        }
    }
    
    // Show a notification
    showNotification(title, message, link, id) {
        // Check if notification already exists
        if (document.getElementById(id)) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = 'global-notification';
        notification.style.backgroundColor = 'white';
        notification.style.borderRadius = '8px';
        notification.style.padding = '12px 15px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.borderLeft = '4px solid #ff9562';
        notification.style.minWidth = '280px';
        notification.style.maxWidth = '350px';
        notification.style.animation = 'slideInRight 0.3s forwards';
        notification.style.cursor = 'pointer';
        notification.style.display = 'flex';
        notification.style.flexDirection = 'column';
        
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="font-weight: bold; color: #ff9562;">${title}</div>
                <button class="close-btn" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #666;">&times;</button>
            </div>
            <div style="color: #333; margin-bottom: 8px;">${message}</div>
            <div style="text-align: right;">
                <a href="${link}" style="text-decoration: none; color: #ff9562; font-size: 14px; font-weight: 600;">
                    Take Action →
                </a>
            </div>
        `;
        
        // Add click handler to the notification
        notification.addEventListener('click', (e) => {
            // Ignore clicks on the close button
            if (e.target.classList.contains('close-btn')) {
                return;
            }
            
            window.location.href = link;
        });
        
        // Add close button handler
        notification.querySelector('.close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNotification(id);
        });
        
        // Add notification to the container
        this.notificationContainer.appendChild(notification);
        
        // Add animation styles if not already present
        if (!document.getElementById('notification-animations')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'notification-animations';
            styleTag.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styleTag);
        }
    }
    
    // Remove a notification
    removeNotification(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.style.animation = 'slideOutRight 0.3s forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
}

// Initialize the notification system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const notificationSystem = new TaskNotificationSystem();
    notificationSystem.init();
    
    // Make it globally accessible
    window.taskNotificationSystem = notificationSystem;
});

// User database management functions
function initializeUserDatabase() {
    // Check if usersall database exists, if not create it
    if (!localStorage.getItem("usersall")) {
        localStorage.setItem("usersall", JSON.stringify([]));
        console.log("Initialized empty usersall database");
    }
    
    // Attempt to sync with server-side user data
    syncUsersDatabase();
}

async function syncUsersDatabase() {
    try {
        // Fetch users from server
        const response = await fetch("/get_users");
        if (!response.ok) {
            throw new Error("Failed to fetch users from server");
        }
        
        const data = await response.json();
        if (data.users && Array.isArray(data.users)) {
            // Format users for our database
            const formattedUsers = data.users.map(user => ({
                id: user.id,
                username: user.username,
                name: user.name || user.username,
                email: user.email || '',
                role: user.role || 'employee',
                location: user.location || 'Default'
            }));
            
            // Save to localStorage
            localStorage.setItem("usersall", JSON.stringify(formattedUsers));
            console.log(`Synced ${formattedUsers.length} users to usersall database`);
        }
    } catch (error) {
        console.error("Error syncing users database:", error);
    }
}

// Get username by ID from usersall database
function getUsernameById(userId) {
    try {
        const usersData = localStorage.getItem("usersall");
        if (!usersData) return "Unknown User";
        
        const users = JSON.parse(usersData);
        // First try exact ID match, then look for userId property match
        const user = users.find(u => u.id == userId || u.userId == userId);
        
        // Return username or full name if available, otherwise return the user ID as fallback
        return user ? (user.name || user.username || userId) : userId.toString();
    } catch (error) {
        console.error("Error getting username by ID:", error);
        // Always return something displayable
        return userId ? userId.toString() : "Unknown User";
    }
}

// Define username as an alias for getUsernameById for clearer code
window.username = getUsernameById;

// Add a bi-directional lookup function to get ID from username or username from ID
function getUserInfo(userIdentifier) {
    try {
        const usersData = localStorage.getItem("usersall");
        if (!usersData) return null;
        
        const users = JSON.parse(usersData);
        let user;
        
        // If it looks like a numeric ID
        if (/^\d+$/.test(userIdentifier)) {
            user = users.find(u => u.id == userIdentifier || u.userId == userIdentifier);
        } else {
            // If it looks like a username (string)
            user = users.find(u => u.username === userIdentifier || 
                                  (u.name && u.name === userIdentifier));
        }
        
        return user || null;
    } catch (error) {
        console.error("Error getting user info:", error);
        return null;
    }
}

// Enhancement: Get all properties of a user by ID
function getUserById(userId) {
    try {
        const usersData = localStorage.getItem("usersall");
        if (!usersData) return null;
        
        const users = JSON.parse(usersData);
        return users.find(u => u.id == userId || u.userId == userId) || null;
    } catch (error) {
        console.error("Error getting user by ID:", error);
        return null;
    }
}

// Add a helper function to convert user IDs to names in datasets
function convertUserIdsToNames(data, userIdField = 'userId', userNameField = 'userName') {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => {
        const newItem = {...item};
        if (newItem[userIdField]) {
            // Try to get the username
            newItem[userNameField] = getUsernameById(newItem[userIdField]);
        }
        return newItem;
    });
}

// Initialize the database when this script loads
document.addEventListener('DOMContentLoaded', function() {
    initializeUserDatabase();
});

// Notification system
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
        
        // Remove container if empty
        if (container.children.length === 0) {
            container.remove();
        }
    }, 3000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    return container;
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    #notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
    }

    .notification {
        padding: 15px 25px;
        margin-bottom: 10px;
        border-radius: 4px;
        color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
    }

    .notification.success {
        background-color: #4CAF50;
    }

    .notification.error {
        background-color: #f44336;
    }

    .notification.info {
        background-color: #2196F3;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

document.head.appendChild(style);
