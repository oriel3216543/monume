/**
 * Appointment Data Helper
 * This script helps initialize and manage appointment data to ensure the edit function works properly
 */

// Function to initialize sample appointment data if none exists
function initializeAppointmentData() {
    console.log('Checking for appointment data...');
    
    // Check if appointments exist in localStorage
    const storedAppointments = localStorage.getItem('appointments');
    
    if (!storedAppointments || storedAppointments === '[]') {
        console.log('No appointment data found, initializing with sample data');
        
        // Current date + 1 day for start time
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        
        // End time is 1 hour after start
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(11, 0, 0, 0);
        
        // Current date + 2 days for second appointment
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        dayAfterTomorrow.setHours(14, 0, 0, 0);
        
        // End time is 1 hour after start
        const dayAfterTomorrowEnd = new Date(dayAfterTomorrow);
        dayAfterTomorrowEnd.setHours(15, 0, 0, 0);
        
        // Sample data
        const sampleAppointments = [
            {
                id: '1',
                title: 'MonuMe Consultation with John Smith',
                start: tomorrow.toISOString(),
                end: tomorrowEnd.toISOString(),
                extendedProps: {
                    type: 'MiniMe',
                    customerId: 'c1',
                    customerName: 'John Smith',
                    customerPhone: '555-123-4567',
                    customerEmail: 'john@example.com',
                    salesRepId: 's1',
                    salesRepName: 'Sarah Johnson',
                    notes: 'Initial consultation about MonuMe products'
                }
            },
            {
                id: '2',
                title: 'FrameMe Discussion with Emily Brown',
                start: dayAfterTomorrow.toISOString(),
                end: dayAfterTomorrowEnd.toISOString(),
                extendedProps: {
                    type: 'FrameMe',
                    customerId: 'c2',
                    customerName: 'Emily Brown',
                    customerPhone: '555-987-6543',
                    customerEmail: 'emily@example.com',
                    salesRepId: 's2',
                    salesRepName: 'Michael Wilson',
                    notes: 'Follow-up on FrameMe options'
                }
            }
        ];
        
        // Store in localStorage
        try {
            localStorage.setItem('appointments', JSON.stringify(sampleAppointments));
            console.log('Sample appointment data initialized successfully');
        } catch (error) {
            console.error('Error storing sample appointment data:', error);
        }
        
        return true;
    } else {
        console.log('Existing appointment data found in localStorage');
        return false;
    }
}

// Function to initialize sample customer data if none exists
function initializeCustomerData() {
    console.log('Checking for customer data...');
    
    // Check if customers exist in localStorage
    const storedCustomers = localStorage.getItem('customers');
    
    if (!storedCustomers || storedCustomers === '[]') {
        console.log('No customer data found, initializing with sample data');
        
        // Sample data
        const sampleCustomers = [
            {
                id: 'c1',
                firstName: 'John',
                lastName: 'Smith',
                phone: '555-123-4567',
                email: 'john@example.com',
                address: '123 Main St, Anytown, CA'
            },
            {
                id: 'c2',
                firstName: 'Emily',
                lastName: 'Brown',
                phone: '555-987-6543',
                email: 'emily@example.com',
                address: '456 Oak Ave, Somewhere, NY'
            },
            {
                id: 'c3',
                firstName: 'Michael',
                lastName: 'Davis',
                phone: '555-555-5555',
                email: 'michael@example.com',
                address: '789 Pine Rd, Elsewhere, TX'
            }
        ];
        
        // Store in localStorage
        try {
            localStorage.setItem('customers', JSON.stringify(sampleCustomers));
            console.log('Sample customer data initialized successfully');
        } catch (error) {
            console.error('Error storing sample customer data:', error);
        }
        
        return true;
    } else {
        console.log('Existing customer data found in localStorage');
        return false;
    }
}

// Function to initialize sample sales rep data if none exists
function initializeSalesRepData() {
    console.log('Checking for sales rep data...');
    
    // Check if sales reps exist in localStorage
    const storedSalesReps = localStorage.getItem('salesReps');
    
    if (!storedSalesReps || storedSalesReps === '[]') {
        console.log('No sales rep data found, initializing with sample data');
        
        // Sample data
        const sampleSalesReps = [
            {
                id: 's1',
                name: 'Sarah Johnson',
                email: 'sarah@monume.com',
                phone: '555-111-2222'
            },
            {
                id: 's2',
                name: 'Michael Wilson',
                email: 'michael@monume.com',
                phone: '555-222-3333'
            },
            {
                id: 's3',
                name: 'Jessica Thompson',
                email: 'jessica@monume.com',
                phone: '555-333-4444'
            }
        ];
        
        // Store in localStorage
        try {
            localStorage.setItem('salesReps', JSON.stringify(sampleSalesReps));
            console.log('Sample sales rep data initialized successfully');
        } catch (error) {
            console.error('Error storing sample sales rep data:', error);
        }
        
        return true;
    } else {
        console.log('Existing sales rep data found in localStorage');
        return false;
    }
}

// Function to validate and repair appointment data
function validateAndRepairAppointmentData() {
    console.log('Validating appointment data...');
    
    try {
        // Get current appointments
        const storedAppointments = localStorage.getItem('appointments');
        
        if (!storedAppointments) {
            console.log('No appointments to validate');
            return false;
        }
        
        let appointments = JSON.parse(storedAppointments);
        
        if (!Array.isArray(appointments)) {
            console.error('Appointments data is not an array, resetting');
            localStorage.removeItem('appointments');
            initializeAppointmentData();
            return true;
        }
        
        // Check each appointment for required fields
        let needsRepair = false;
        
        appointments = appointments.map(appointment => {
            // Ensure the appointment has an id
            if (!appointment.id) {
                appointment.id = 'a' + Math.floor(Math.random() * 10000);
                needsRepair = true;
            }
            
            // Ensure the appointment has a title
            if (!appointment.title) {
                appointment.title = 'Appointment ' + appointment.id;
                needsRepair = true;
            }
            
            // Ensure the appointment has start and end times
            if (!appointment.start) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + 1);
                startDate.setHours(10, 0, 0, 0);
                appointment.start = startDate.toISOString();
                needsRepair = true;
            }
            
            if (!appointment.end) {
                const startDate = new Date(appointment.start);
                const endDate = new Date(startDate);
                endDate.setHours(startDate.getHours() + 1);
                appointment.end = endDate.toISOString();
                needsRepair = true;
            }
            
            // Ensure the appointment has extendedProps
            if (!appointment.extendedProps) {
                appointment.extendedProps = {
                    type: 'MiniMe',
                    customerId: 'c1',
                    customerName: 'Default Customer',
                    customerPhone: '555-000-0000',
                    salesRepId: 's1',
                    salesRepName: 'Default Sales Rep',
                    notes: ''
                };
                needsRepair = true;
            } else {
                // Ensure extendedProps has required fields
                if (!appointment.extendedProps.type) {
                    appointment.extendedProps.type = 'MiniMe';
                    needsRepair = true;
                }
                if (!appointment.extendedProps.customerId) {
                    appointment.extendedProps.customerId = 'c1';
                    needsRepair = true;
                }
                if (!appointment.extendedProps.customerName) {
                    appointment.extendedProps.customerName = 'Default Customer';
                    needsRepair = true;
                }                // Never set default sales rep - use empty string to indicate no selection
                if (!appointment.extendedProps.hasOwnProperty('salesRepId')) {
                    appointment.extendedProps.salesRepId = '';
                    needsRepair = true;
                }
                if (!appointment.extendedProps.hasOwnProperty('salesRepName')) {
                    appointment.extendedProps.salesRepName = '';
                    needsRepair = true;
                }
            }
            
            return appointment;
        });
        
        // Save repaired appointments if needed
        if (needsRepair) {
            console.log('Repairing appointment data');
            localStorage.setItem('appointments', JSON.stringify(appointments));
            return true;
        } else {
            console.log('Appointment data is valid');
            return false;
        }
    } catch (error) {
        console.error('Error validating appointment data:', error);
        
        // Reset data on critical error
        localStorage.removeItem('appointments');
        initializeAppointmentData();
        return true;
    }
}

// Function to get appointments safely
function getSafeAppointments() {
    try {
        const storedAppointments = localStorage.getItem('appointments');
        if (!storedAppointments) {
            initializeAppointmentData();
            return JSON.parse(localStorage.getItem('appointments') || '[]');
        }
        return JSON.parse(storedAppointments);
    } catch (error) {
        console.error('Error parsing appointments:', error);
        // Reset and reinitialize on error
        localStorage.removeItem('appointments');
        initializeAppointmentData();
        return JSON.parse(localStorage.getItem('appointments') || '[]');
    }
}

// Function to get customers safely
function getSafeCustomers() {
    try {
        const storedCustomers = localStorage.getItem('customers');
        if (!storedCustomers) {
            initializeCustomerData();
            return JSON.parse(localStorage.getItem('customers') || '[]');
        }
        return JSON.parse(storedCustomers);
    } catch (error) {
        console.error('Error parsing customers:', error);
        localStorage.removeItem('customers');
        initializeCustomerData();
        return JSON.parse(localStorage.getItem('customers') || '[]');
    }
}

// Function to get sales reps safely
function getSafeSalesReps() {
    try {
        const storedSalesReps = localStorage.getItem('salesReps');
        if (!storedSalesReps) {
            initializeSalesRepData();
            return JSON.parse(localStorage.getItem('salesReps') || '[]');
        }
        return JSON.parse(storedSalesReps);
    } catch (error) {
        console.error('Error parsing sales reps:', error);
        localStorage.removeItem('salesReps');
        initializeSalesRepData();
        return JSON.parse(localStorage.getItem('salesReps') || '[]');
    }
}

// Initialize all data when script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing appointment data helper');
    
    // Initialize all data types if needed
    initializeAppointmentData();
    initializeCustomerData();
    initializeSalesRepData();
    
    // Validate and repair appointment data
    validateAndRepairAppointmentData();
    
    // Expose our safe functions to the global scope
    window.getSafeAppointments = getSafeAppointments;
    window.getSafeCustomers = getSafeCustomers;
    window.getSafeSalesReps = getSafeSalesReps;
    
    // Override existing getAppointments function
    window.getAppointments = getSafeAppointments;
    window.getCustomers = getSafeCustomers;
    window.getSalesReps = getSafeSalesReps;
    
    console.log('Appointment data helper initialized successfully');
});

// Log to indicate the script was loaded
console.log('Appointment data helper script loaded');
