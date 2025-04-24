/**
 * Common utility functions for MonuMe Tracker
 */

// Check if an element exists in the DOM
function elementExists(selector) {
    return document.querySelector(selector) !== null;
}

// Format date to readable string
function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format time to readable string
function formatTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate a random ID
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Simple event bus for pub/sub pattern
const EventBus = {
    events: {},
    
    on: function(eventName, fn) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(fn);
    },
    
    off: function(eventName, fn) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(f => f !== fn);
        }
    },
    
    emit: function(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(fn => fn(data));
        }
    }
};

// Add a throttle function to limit the rate at which a function is executed
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
