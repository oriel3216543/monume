class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notification-container') || this.createContainer();
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        this.container.appendChild(notification);

        // Fade in effect
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
        });

        // Auto-remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                this.container.removeChild(notification);
            }, 300);
        }, duration);
    }

    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 3000) {
        this.show(message, 'error', duration);
    }

    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}

// Create global notification instance
window.notifications = new NotificationSystem();