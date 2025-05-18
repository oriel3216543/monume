/**
 * Simple notification system for MonuMe Tracker
 * 
 * This system provides small notifications in the top-right corner of the screen
 * as a replacement for alert() dialogs. It's designed to be less intrusive
 * and provide a better user experience.
 */

// Create notification container if it doesn't exist
function createNotificationContainer() {
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.maxWidth = '300px';
        document.body.appendChild(container);
    }
    
    return container;
}

/**
 * Show a notification in the top-right corner
 * @param {string} message - The message to display
 * @param {string} type - The type of notification: 'success', 'error', 'info', 'warning'
 * @param {number} duration - How long to show the notification in milliseconds
 */
function showNotification(message, type = 'success', duration = 3000) {
    const container = createNotificationContainer();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.padding = '12px 20px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = '500';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(50px)';
    notification.style.transition = 'all 0.3s ease';
    
    // Add background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#4caf50';
        notification.style.color = 'white';
        notification.style.borderLeft = '4px solid #2e7d32';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
        notification.style.borderLeft = '4px solid #c62828';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ff9800';
        notification.style.color = 'white';
        notification.style.borderLeft = '4px solid #ef6c00';
    } else {
        notification.style.backgroundColor = '#2196f3';
        notification.style.color = 'white';
        notification.style.borderLeft = '4px solid #0d47a1';
    }
    
    // Create icon based on type
    let icon = '';
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle" style="margin-right: 8px;"></i>';
    } else if (type === 'error') {
        icon = '<i class="fas fa-times-circle" style="margin-right: 8px;"></i>';
    } else if (type === 'warning') {
        icon = '<i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>';
    } else {
        icon = '<i class="fas fa-info-circle" style="margin-right: 8px;"></i>';
    }
    
    // Set content
    notification.innerHTML = icon + message;
    
    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.right = '10px';
    closeBtn.style.top = '10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.onclick = function() {
        removeNotification(notification);
    };
    
    notification.style.position = 'relative';
    notification.appendChild(closeBtn);
    
    // Add to container
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove after duration
    setTimeout(() => {
        removeNotification(notification);
    }, duration);
    
    return notification;
}

// Remove a notification with animation
function removeNotification(notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(50px)';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Test function - can be used to test the notification system
function testNotifications() {
    showNotification('This is a success notification', 'success', 3000);
    setTimeout(() => {
        showNotification('This is an error notification', 'error', 3000);
    }, 1000);
    setTimeout(() => {
        showNotification('This is a warning notification', 'warning', 3000);
    }, 2000);
    setTimeout(() => {
        showNotification('This is an info notification', 'info', 3000);
    }, 3000);
}

// Log that notification system is ready
console.log('MonuMe Tracker notification system loaded');
