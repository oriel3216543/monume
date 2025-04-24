/**
 * Simple notification system for MonuMe Tracker
 */

function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.style.backgroundColor = 'white';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    notification.style.padding = '16px';
    notification.style.marginBottom = '10px';
    notification.style.minWidth = '300px';
    notification.style.position = 'relative';
    notification.style.borderLeft = `4px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'}`;
    notification.style.animation = 'slideIn 0.3s ease-out forwards';

    // Add notification content
    notification.innerHTML = `
        <h4 style="margin-top: 0; margin-bottom: 5px;">${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
        <p style="margin: 0;">${message}</p>
        <button style="position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer; font-size: 16px;">&times;</button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Add close button functionality
    notification.querySelector('button').addEventListener('click', function() {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add necessary animations to document
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;
document.head.appendChild(styleSheet);
