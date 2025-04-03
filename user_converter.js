/**
 * User ID Converter - Converts user IDs to usernames in data displays
 */

// Initialize when loaded
document.addEventListener('DOMContentLoaded', function() {
    // Ensure user database is available
    if (typeof initializeUserDatabase === 'function') {
        initializeUserDatabase();
    }
    
    // Convert all tables, charts and other elements
    convertAllUserIdDisplays();
});

/**
 * Main function to convert all user IDs to usernames across the page
 */
function convertAllUserIdDisplays() {
    // Convert tables
    convertTableUserIds();
    
    // Convert UI elements
    convertUIUserIds();
    
    // Convert charts if they exist
    if (window.Chart) {
        convertChartUserIds();
    }
    
    // For Select2 dropdowns if they exist
    if (window.jQuery && jQuery.fn.select2) {
        setTimeout(convertSelect2Dropdowns, 100);
    }
    
    console.log('Converted user IDs to usernames throughout the page');
}

/**
 * Converts user IDs in tables to usernames
 */
function convertTableUserIds() {
    // Process all tables on the page
    document.querySelectorAll('table').forEach(table => {
        // Find headers with 'user id' or similar text
        const headers = table.querySelectorAll('th');
        let userIdColumnIndex = -1;
        
        Array.from(headers).forEach((header, index) => {
            const headerText = header.textContent.toLowerCase();
            if (headerText.includes('user id') || headerText === 'userid' || headerText === 'user') {
                userIdColumnIndex = index;
                
                // Update header text from "User ID" to "User"
                if (headerText.includes('user id')) {
                    header.textContent = header.textContent.replace(/user\s*id/i, 'User');
                }
            }
        });
        
        // If we found a user ID column, update all cells in that column
        if (userIdColumnIndex >= 0) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > userIdColumnIndex) {
                    const cell = cells[userIdColumnIndex];
                    const userId = cell.textContent.trim();
                    
                    // Only convert if it looks like a user ID (number)
                    if (/^\d+$/.test(userId)) {
                        // Store original ID as data attribute
                        cell.dataset.userId = userId;
                        
                        // Replace with username
                        if (typeof getUsernameById === 'function') {
                            cell.textContent = getUsernameById(userId);
                        }
                    }
                }
            });
        }
    });
}

/**
 * Converts user IDs in UI elements to usernames
 */
function convertUIUserIds() {
    // Find all elements with data-user-id attribute
    document.querySelectorAll('[data-user-id]').forEach(element => {
        const userId = element.dataset.userId;
        if (userId && typeof getUsernameById === 'function') {
            element.textContent = getUsernameById(userId);
        }
    });
    
    // Find elements with user-id class
    document.querySelectorAll('.user-id').forEach(element => {
        const text = element.textContent.trim();
        if (/^\d+$/.test(text) && typeof getUsernameById === 'function') {
            element.dataset.userId = text; // Save original ID
            element.textContent = getUsernameById(text);
        }
    });
    
    // Find spans/divs with IDs that suggest user display
    document.querySelectorAll('[id*="user-id"], [id*="userId"]').forEach(element => {
        const text = element.textContent.trim();
        if (/^\d+$/.test(text) && typeof getUsernameById === 'function') {
            element.dataset.userId = text; // Save original ID
            element.textContent = getUsernameById(text);
        }
    });
}

/**
 * Converts user IDs in Chart.js charts to usernames
 */
function convertChartUserIds() {
    if (!window.Chart || !window.Chart.instances) return;
    
    // Process all charts
    Object.values(window.Chart.instances).forEach(chart => {
        let updated = false;
        
        // Check if chart labels might be user IDs
        if (chart.data && chart.data.labels) {
            const newLabels = chart.data.labels.map(label => {
                // If label is a numeric string, it might be a user ID
                if (typeof label === 'string' && /^\d+$/.test(label.trim())) {
                    updated = true;
                    return getUsernameById(label);
                }
                return label;
            });
            
            if (updated) {
                chart.data.labels = newLabels;
                chart.update();
            }
        }
    });
}

/**
 * Convert Select2 dropdowns containing user IDs
 */
function convertSelect2Dropdowns() {
    if (!window.jQuery || !jQuery.fn.select2) return;
    
    jQuery('select').each(function() {
        const $select = jQuery(this);
        
        // Check if this select might contain user data
        if ($select.attr('id')?.toLowerCase().includes('user') || 
            $select.attr('name')?.toLowerCase().includes('user')) {
            
            // Process options
            let updated = false;
            $select.find('option').each(function() {
                const $option = jQuery(this);
                const value = $option.val();
                
                // If value is numeric and not empty, it might be a user ID
                if (value && /^\d+$/.test(value)) {
                    updated = true;
                    $option.text(getUsernameById(value));
                }
            });
            
            // Refresh Select2 if needed
            if (updated && $select.hasClass('select2-hidden-accessible')) {
                $select.select2('destroy').select2();
            }
        }
    });
}

/**
 * Utility to convert userIds in any dataset
 */
function convertUserIdsInData(data, userIdField = 'userId', includeOriginal = true) {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => {
        const result = {...item};
        
        // Handle both user ID and username fields
        if (result[userIdField]) {
            // Add a userName field with the username
            const displayName = getUsernameById(result[userIdField]);
            
            // Always include the userName property
            result.userName = displayName;
            result.displayName = displayName; // Add a display-specific property
            
            // Optionally replace the userId field with the username
            if (!includeOriginal) {
                result[userIdField] = displayName;
            }
        }
        
        return result;
    });
}

// Add helper for data table creation with user ID mapping
function createUserMappedTable(tableSelector, data, columns) {
    const table = document.querySelector(tableSelector);
    if (!table) return;
    
    // Clear table
    const tbody = table.querySelector('tbody') || table.createTBody();
    tbody.innerHTML = '';
    
    // Process data to replace user IDs with usernames
    const processedData = data.map(item => {
        const row = {...item};
        
        // Look for user ID fields
        Object.keys(row).forEach(key => {
            if (key.toLowerCase().includes('userid') || key.toLowerCase() === 'user') {
                const userId = row[key];
                if (userId && /^\d+$/.test(userId.toString())) {
                    // Add a username display property
                    row[key + 'Display'] = getUsernameById(userId);
                }
            }
        });
        
        return row;
    });
    
    // Render the table
    processedData.forEach(row => {
        const tr = document.createElement('tr');
        
        columns.forEach(col => {
            const td = document.createElement('td');
            
            // Use display version of user ID if available
            const displayKey = col + 'Display';
            if (row[displayKey]) {
                td.textContent = row[displayKey];
                // Store original ID as data attribute
                td.dataset.userId = row[col];
            } else {
                td.textContent = row[col] !== undefined ? row[col] : '';
            }
            
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
}

// Expose main functions globally
window.convertAllUserIdDisplays = convertAllUserIdDisplays;
window.convertUserIdsInData = convertUserIdsInData;
window.createUserMappedTable = createUserMappedTable;
window.getUserDisplayName = function(userId) {
    return typeof getUsernameById === 'function' ? getUsernameById(userId) : userId;
};

// Add a short alias for getUsernameById for easier use in templates and code
window.username = getUsernameById;
