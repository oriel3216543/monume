/**
 * Analytics Helpers - Convert user IDs to usernames
 * This script helps analytics pages display usernames instead of user IDs
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the database if needed
    if (typeof initializeUserDatabase === 'function') {
        initializeUserDatabase();
    }
    
    // Convert any user IDs in tables
    convertTableUserIds();
    
    // Look for charts and convert them
    convertChartUserIds();
    
    // Update any other UI elements
    updateUIUserIds();
});

/**
 * Converts all user IDs in tables to usernames
 */
function convertTableUserIds() {
    // Find tables with user ID data
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        // Find header row to identify which column has user IDs
        const headerRow = table.querySelector('thead tr');
        if (!headerRow) return;
        
        // Get all header cells
        const headers = Array.from(headerRow.querySelectorAll('th'));
        
        // Find user ID column index
        const userIdIndex = headers.findIndex(th => 
            th.textContent.toLowerCase().includes('user id') || 
            th.textContent.toLowerCase().includes('userid')
        );
        
        // If we found a user ID column
        if (userIdIndex >= 0) {
            // Process all data rows
            const dataRows = table.querySelectorAll('tbody tr');
            dataRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > userIdIndex) {
                    const userIdCell = cells[userIdIndex];
                    const userId = userIdCell.textContent.trim();
                    if (userId && userId !== 'Unknown User') {
                        const username = getUsernameById(userId);
                        userIdCell.textContent = username;
                        
                        // Add userId as a data attribute for reference
                        userIdCell.dataset.userId = userId;
                    }
                }
            });
            
            // Update the header to say "User" instead of "User ID"
            if (headers[userIdIndex]) {
                headers[userIdIndex].textContent = headers[userIdIndex].textContent.replace(/user\s*id/i, 'User');
            }
        }
    });
}

/**
 * Converts user IDs in charts to usernames
 */
function convertChartUserIds() {
    // Look for Chart.js instances
    if (window.Chart && window.Chart.instances) {
        Object.values(window.Chart.instances).forEach(chart => {
            // Check if this is a chart with user data
            const hasUserIds = chart.data.labels && chart.data.labels.some(label => 
                /^\d+$/.test(label) || // Numeric labels might be user IDs
                label.toLowerCase().includes('user')
            );
            
            if (hasUserIds) {
                // Replace user ID labels with usernames
                chart.data.labels = chart.data.labels.map(label => {
                    if (/^\d+$/.test(label)) {
                        return getUsernameById(label);
                    }
                    return label;
                });
                
                // Update the chart
                chart.update();
            }
        });
    }
    
    // For other chart libraries or custom implementations
    // You would need to add specific code here
}

/**
 * Updates other UI elements that might contain user IDs
 */
function updateUIUserIds() {
    // Look for elements with userId class or data attribute
    document.querySelectorAll('[data-user-id], .user-id').forEach(element => {
        const userId = element.dataset.userId || element.textContent.trim();
        if (userId && /^\d+$/.test(userId)) {
            const username = getUsernameById(userId);
            element.textContent = username;
            
            // Keep the original ID as a data attribute
            element.dataset.userId = userId;
        }
    });
    
    // Look for select dropdowns with user options
    document.querySelectorAll('select').forEach(select => {
        // Check if this is a user selection dropdown
        const isUserSelect = select.id.toLowerCase().includes('user') || 
                             select.name.toLowerCase().includes('user');
        
        if (isUserSelect) {
            Array.from(select.options).forEach(option => {
                // If the option value looks like a user ID
                if (/^\d+$/.test(option.value)) {
                    const username = getUsernameById(option.value);
                    // Update only if we found a valid username
                    if (username !== 'Unknown User') {
                        option.textContent = username;
                    }
                }
            });
        }
    });
}

/**
 * Utility function to apply username conversion to any data array
 * @param {Array} data - Array of objects with user ID properties
 * @param {String} userIdField - Name of the property containing user ID
 * @param {String} target - Where to put the username (can be same as userIdField to replace)
 * @returns {Array} - The modified array with usernames
 */
function convertDataUserIds(data, userIdField = 'userId', target = userIdField) {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => {
        const newItem = {...item};
        if (newItem[userIdField]) {
            newItem[target] = getUsernameById(newItem[userIdField]);
        }
        return newItem;
    });
}

/**
 * Creates a binding function that ensures user IDs are always displayed as usernames
 * Usage: const userBinding = createUserDisplayBinding();
 *        element.textContent = userBinding(userId);
 */
function createUserDisplayBinding() {
    return function(userId) {
        if (!userId) return "Unknown User";
        return typeof getUsernameById === 'function' ? getUsernameById(userId) : userId;
    };
}

/**
 * Preprocesses data by adding username properties for all userId properties
 * @param {Array} data - The array of data objects
 * @returns {Array} - The same array with added username properties
 */
function addUsernameProperties(data) {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => {
        const result = {...item};
        
        // Check all properties for ones that look like user IDs
        Object.keys(result).forEach(key => {
            if (key.toLowerCase().includes('userid') && !key.toLowerCase().includes('display')) {
                const userId = result[key];
                if (userId && typeof userId !== 'object') {
                    // Add corresponding username property
                    const displayKey = key.replace(/id$/i, '') + 'Name';
                    result[displayKey] = getUsernameById(userId);
                }
            }
        });
        
        // Always ensure a userName if userId exists
        if (result.userId && !result.userName) {
            result.userName = getUsernameById(result.userId);
        }
        
        // For common fields, always set display name
        if (result.userId) {
            result.userDisplay = getUsernameById(result.userId);
        }
        
        return result;
    });
}

// Expose key functions to the global scope
window.getUsernameById = getUsernameById || function() { return "Unknown User"; };
window.convertDataUserIds = convertDataUserIds;
window.updateUIUserIds = updateUIUserIds;
window.createUserDisplayBinding = createUserDisplayBinding;
window.addUsernameProperties = addUsernameProperties;
window.username = getUsernameById; // Add short alias
