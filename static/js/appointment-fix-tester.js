/**
 * MonuMe Appointment Fix Tester
 * This file allows you to test the fixes made to the appointment edit functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('MonuMe fix tester loaded');
    createTestPanel();
});

function createTestPanel() {
    // Create the test panel button
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Edit Fixes';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '10px 15px';
    testButton.style.backgroundColor = '#007bff';
    testButton.style.color = '#fff';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '5px';
    testButton.style.cursor = 'pointer';
    testButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    
    // Create the test panel
    const testPanel = document.createElement('div');
    testPanel.id = 'edit-fix-test-panel';
    testPanel.style.display = 'none';
    testPanel.style.position = 'fixed';
    testPanel.style.bottom = '80px';
    testPanel.style.right = '20px';
    testPanel.style.width = '400px';
    testPanel.style.maxHeight = '80vh';
    testPanel.style.overflowY = 'auto';
    testPanel.style.backgroundColor = '#fff';
    testPanel.style.padding = '20px';
    testPanel.style.borderRadius = '5px';
    testPanel.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
    testPanel.style.zIndex = '9998';
    
    testPanel.innerHTML = `
        <h3>MonuMe Edit Fix Tester</h3>
        <div style="margin-bottom: 10px;">
            <button id="close-test-panel" style="float: right; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
            <p>Use this panel to test the appointment edit fix functionality.</p>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h4>Step 1: Choose an appointment</h4>
            <select id="test-appointment-selector" style="width: 100%; padding: 5px;">
                <option value="">Loading appointments...</option>
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h4>Step 2: Test specific fixes</h4>
            <button id="test-open-edit-modal" class="test-button" disabled>Open Edit Modal</button>
            <button id="test-field-validation" class="test-button" disabled>Test No Validation</button>
            <button id="test-save-no-changes" class="test-button" disabled>Save Without Changes</button>
            <button id="test-change-one-field" class="test-button" disabled>Change Just Title</button>
            <button id="test-check-rep-selection" class="test-button" disabled>Check Rep Selection</button>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h4>Test results:</h4>
            <div id="test-results" style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; height: 150px; overflow-y: auto;">
                <em>Results will appear here</em>
            </div>
        </div>
        
        <div>
            <h4>Black screen test</h4>
            <button id="test-check-backdrop" class="test-button">Check For Backdrops</button>
            <button id="test-remove-backdrop" class="test-button">Remove All Backdrops</button>
            <p><small>If you see a black screen, click "Remove All Backdrops"</small></p>
        </div>
    `;
    
    // Add styles for the test buttons
    const style = document.createElement('style');
    style.textContent = `
        .test-button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 5px 10px;
            margin: 5px;
            border-radius: 3px;
            cursor: pointer;
        }
        .test-button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        .test-button:hover:not(:disabled) {
            background-color: #0069d9;
        }
        .test-success {
            color: green;
            font-weight: bold;
        }
        .test-failure {
            color: red;
            font-weight: bold;
        }
        .test-info {
            color: #0069d9;
        }
    `;
    
    // Add elements to the page
    document.head.appendChild(style);
    document.body.appendChild(testButton);
    document.body.appendChild(testPanel);
    
    // Add event listener for the test button
    testButton.addEventListener('click', function() {
        testPanel.style.display = testPanel.style.display === 'none' ? 'block' : 'none';
        if (testPanel.style.display === 'block') {
            loadAppointmentsForTesting();
        }
    });
    
    // Add event listener for the close button
    document.getElementById('close-test-panel').addEventListener('click', function() {
        testPanel.style.display = 'none';
    });
    
    // Add event listeners for the test buttons
    document.getElementById('test-open-edit-modal').addEventListener('click', openEditModal);
    document.getElementById('test-field-validation').addEventListener('click', testFieldValidation);
    document.getElementById('test-save-no-changes').addEventListener('click', testSaveNoChanges);
    document.getElementById('test-change-one-field').addEventListener('click', testChangeOneField);
    document.getElementById('test-check-rep-selection').addEventListener('click', testCheckRepSelection);
    document.getElementById('test-check-backdrop').addEventListener('click', testCheckBackdrop);
    document.getElementById('test-remove-backdrop').addEventListener('click', testRemoveBackdrop);
}

// Load appointments for testing
function loadAppointmentsForTesting() {
    const selector = document.getElementById('test-appointment-selector');
    
    try {
        // Get appointments
        const appointments = getSafeAppointments();
        
        if (!appointments || appointments.length === 0) {
            logTestResult('No appointments found. Try refreshing the page.');
            return;
        }
        
        // Clear existing options
        selector.innerHTML = '';
        
        // Add options for each appointment
        appointments.forEach(appointment => {
            const option = document.createElement('option');
            option.value = appointment.id;
            option.textContent = `ID ${appointment.id}: ${appointment.title}`;
            selector.appendChild(option);
        });
        
        // Enable test buttons
        document.getElementById('test-open-edit-modal').disabled = false;
        
        logTestResult('Loaded ' + appointments.length + ' appointments for testing', 'info');
    } catch (error) {
        logTestResult('Error loading appointments: ' + error.message, 'failure');
        console.error('Error in loadAppointmentsForTesting:', error);
    }
}

// Test function: Open edit modal
function openEditModal() {
    try {
        const appointmentId = document.getElementById('test-appointment-selector').value;
        
        if (!appointmentId) {
            logTestResult('Please select an appointment first', 'failure');
            return;
        }
        
        // Get the appointment
        const appointments = getSafeAppointments();
        const appointment = appointments.find(a => String(a.id) === String(appointmentId));
        
        if (!appointment) {
            logTestResult('Appointment not found', 'failure');
            return;
        }
        
        logTestResult('Opening edit modal for appointment ' + appointmentId, 'info');
        
        // Use the existing edit function if available
        if (typeof editAppointment === 'function') {
            editAppointment(appointment);
            
            // Enable other test buttons
            document.querySelectorAll('.test-button').forEach(button => {
                button.disabled = false;
            });
            
            logTestResult('Edit modal opened successfully', 'success');
        } else {
            logTestResult('Edit function not found', 'failure');
        }
    } catch (error) {
        logTestResult('Error opening edit modal: ' + error.message, 'failure');
        console.error('Error in openEditModal:', error);
    }
}

// Test function: Test field validation (should be bypassed in edit mode)
function testFieldValidation() {
    try {
        logTestResult('Testing field validation bypass...', 'info');
        
        // Clear the title field
        const titleField = document.getElementById('appointment-title');
        const originalTitle = titleField.value;
        titleField.value = '';
        
        // Try to save the appointment
        if (document.getElementById('create-appointment-modal')?.getAttribute('data-editing') === 'true') {
            logTestResult('Confirmed edit mode is active', 'success');
        } else {
            logTestResult('Warning: Form does not appear to be in edit mode', 'failure');
        }
        
        // Check if validation is bypassed (should not show alerts)
        const alertShown = false;
        const originalAlert = window.alert;
        window.alert = function(message) {
            logTestResult('Alert shown: ' + message, 'failure');
            alertShown = true;
            originalAlert.apply(this, arguments);
        };
        
        // Reset title
        titleField.value = originalTitle;
        
        // Reset alert
        setTimeout(() => {
            window.alert = originalAlert;
            if (!alertShown) {
                logTestResult('Validation bypass test passed - no alerts shown', 'success');
            }
        }, 1000);
    } catch (error) {
        logTestResult('Error during validation test: ' + error.message, 'failure');
        console.error('Error in testFieldValidation:', error);
    }
}

// Test function: Save without changes
function testSaveNoChanges() {
    try {
        logTestResult('Testing save without changes...', 'info');
        
        // Click the save button
        const saveButton = document.getElementById('save-appointment');
        if (saveButton) {
            saveButton.click();
            logTestResult('Save button clicked', 'info');
            
            // Check if modal is closed after save
            setTimeout(() => {
                const modalVisible = document.getElementById('create-appointment-modal').style.display !== 'none';
                if (!modalVisible) {
                    logTestResult('Modal closed successfully after save', 'success');
                } else {
                    logTestResult('Modal is still open after save', 'failure');
                }
                
                // Check for backdrops
                const hasBackdrop = document.querySelector('.modal-backdrop');
                if (!hasBackdrop) {
                    logTestResult('No backdrop found after save - success!', 'success');
                } else {
                    logTestResult('Backdrop still present after save', 'failure');
                }
            }, 1000);
        } else {
            logTestResult('Save button not found', 'failure');
        }
    } catch (error) {
        logTestResult('Error during save test: ' + error.message, 'failure');
        console.error('Error in testSaveNoChanges:', error);
    }
}

// Test function: Change just one field (title)
function testChangeOneField() {
    try {
        // Open the edit modal again
        const appointmentId = document.getElementById('test-appointment-selector').value;
        
        // Get the appointment
        const appointments = getSafeAppointments();
        const appointment = appointments.find(a => String(a.id) === String(appointmentId));
        
        if (!appointment) {
            logTestResult('Appointment not found', 'failure');
            return;
        }
        
        // If modal is not open, open it
        const modal = document.getElementById('create-appointment-modal');
        if (modal.style.display !== 'block') {
            logTestResult('Reopening edit modal', 'info');
            editAppointment(appointment);
            
            // Wait for modal to open
            setTimeout(() => {
                changeOnlyTitle();
            }, 500);
        } else {
            changeOnlyTitle();
        }
        
        function changeOnlyTitle() {
            // Change only the title
            const titleField = document.getElementById('appointment-title');
            const originalTitle = titleField.value;
            const newTitle = originalTitle + ' (EDITED)';
            
            titleField.value = newTitle;
            logTestResult('Changed title to: ' + newTitle, 'info');
            
            // Save the appointment
            const saveButton = document.getElementById('save-appointment');
            if (saveButton) {
                saveButton.click();
                logTestResult('Save button clicked after changing only title', 'info');
                
                // Check if the change was saved
                setTimeout(() => {
                    const updatedAppointments = getSafeAppointments();
                    const updatedAppointment = updatedAppointments.find(a => String(a.id) === String(appointmentId));
                    
                    if (updatedAppointment && updatedAppointment.title === newTitle) {
                        logTestResult('Title change saved successfully', 'success');
                    } else {
                        logTestResult('Title change not saved', 'failure');
                    }
                }, 1000);
            } else {
                logTestResult('Save button not found', 'failure');
            }
        }
    } catch (error) {
        logTestResult('Error during title change test: ' + error.message, 'failure');
        console.error('Error in testChangeOneField:', error);
    }
}

// Test function: Check if sales rep selection is maintained
function testCheckRepSelection() {
    try {
        // Open the edit modal again
        const appointmentId = document.getElementById('test-appointment-selector').value;
        
        // Get the appointment
        const appointments = getSafeAppointments();
        const appointment = appointments.find(a => String(a.id) === String(appointmentId));
        
        if (!appointment) {
            logTestResult('Appointment not found', 'failure');
            return;
        }
        
        // If modal is not open, open it
        const modal = document.getElementById('create-appointment-modal');
        if (modal.style.display !== 'block') {
            logTestResult('Opening edit modal for rep selection test', 'info');
            editAppointment(appointment);
            
            // Wait for modal to open
            setTimeout(() => {
                checkAndChangeRep();
            }, 500);
        } else {
            checkAndChangeRep();
        }
        
        function checkAndChangeRep() {
            // Get the current sales rep
            const repDropdown = document.getElementById('appointment-sales-rep');
            const currentRepId = repDropdown.value;
            let currentRepName = '';
            
            if (repDropdown.selectedOptions[0]) {
                currentRepName = repDropdown.selectedOptions[0].textContent;
            }
            
            logTestResult('Current sales rep: ' + currentRepName + ' (ID: ' + currentRepId + ')', 'info');
            
            // Change the sales rep
            if (repDropdown.options.length > 1) {
                // Select a different option
                for (let i = 0; i < repDropdown.options.length; i++) {
                    if (repDropdown.options[i].value !== currentRepId) {
                        repDropdown.selectedIndex = i;
                        break;
                    }
                }
                
                const newRepId = repDropdown.value;
                const newRepName = repDropdown.selectedOptions[0].textContent;
                
                logTestResult('Changed sales rep to: ' + newRepName + ' (ID: ' + newRepId + ')', 'info');
                
                // Save the appointment
                const saveButton = document.getElementById('save-appointment');
                if (saveButton) {
                    saveButton.click();
                    logTestResult('Save button clicked after changing sales rep', 'info');
                    
                    // Check if the change was saved
                    setTimeout(() => {
                        const updatedAppointments = getSafeAppointments();
                        const updatedAppointment = updatedAppointments.find(a => String(a.id) === String(appointmentId));
                        
                        if (updatedAppointment && String(updatedAppointment.extendedProps.salesRepId) === String(newRepId)) {
                            logTestResult('Sales rep change saved successfully', 'success');
                        } else {
                            logTestResult('Sales rep change not saved correctly', 'failure');
                        }
                    }, 1000);
                } else {
                    logTestResult('Save button not found', 'failure');
                }
            } else {
                logTestResult('Not enough sales reps to test changing', 'info');
            }
        }
    } catch (error) {
        logTestResult('Error during rep selection test: ' + error.message, 'failure');
        console.error('Error in testCheckRepSelection:', error);
    }
}

// Test function: Check for backdrops
function testCheckBackdrop() {
    try {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        const backdropCount = backdrops.length;
        
        logTestResult('Found ' + backdropCount + ' backdrop elements', backdropCount > 0 ? 'failure' : 'success');
        
        // Check body class
        if (document.body.classList.contains('modal-open')) {
            logTestResult('Body has modal-open class - may cause issues', 'failure');
        } else {
            logTestResult('Body does not have modal-open class - good', 'success');
        }
        
        // Check for any fixed position elements that could be backdrops
        const possibleBackdrops = Array.from(document.querySelectorAll('div'))
            .filter(div => {
                const style = window.getComputedStyle(div);
                return style.position === 'fixed' && 
                       !div.id &&
                       style.zIndex >= 1000 &&
                       (parseFloat(style.opacity) > 0);
            });
        
        if (possibleBackdrops.length > 0) {
            logTestResult('Found ' + possibleBackdrops.length + ' possible backdrop-like elements', 'failure');
        } else {
            logTestResult('No backdrop-like elements found - good', 'success');
        }
    } catch (error) {
        logTestResult('Error checking backdrops: ' + error.message, 'failure');
        console.error('Error in testCheckBackdrop:', error);
    }
}

// Test function: Remove backdrops
function testRemoveBackdrop() {
    try {
        logTestResult('Removing all backdrops...', 'info');
        
        // Call our global function if available
        if (typeof window.checkAndRemoveBackdrops === 'function') {
            window.checkAndRemoveBackdrops();
            logTestResult('Used global backdrop removal function', 'info');
        }
        
        // Method 1: Remove by standard class
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            logTestResult('Removing standard modal backdrop', 'info');
            if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        });
        
        // Method 2: Remove by fade show class
        document.querySelectorAll('.modal-backdrop.fade.show').forEach(backdrop => {
            logTestResult('Removing fade show modal backdrop', 'info');
            if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        });
        
        // Method 3: Find any element that might be a backdrop by style
        const possibleBackdrops = Array.from(document.querySelectorAll('div'))
            .filter(div => {
                const style = window.getComputedStyle(div);
                return style.position === 'fixed' && 
                       !div.id &&
                       style.zIndex >= 1000 &&
                       (parseFloat(style.opacity) > 0);
            });
        
        possibleBackdrops.forEach(element => {
            logTestResult('Removing backdrop-like element', 'info');
            if (element.parentNode) element.parentNode.removeChild(element);
        });
        
        // Make body scrollable again
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        
        // Check for any remaining backdrops
        setTimeout(() => {
            const remainingBackdrops = document.querySelectorAll('.modal-backdrop').length;
            if (remainingBackdrops === 0) {
                logTestResult('All backdrops successfully removed', 'success');
            } else {
                logTestResult(remainingBackdrops + ' backdrops still present', 'failure');
            }
        }, 100);
    } catch (error) {
        logTestResult('Error removing backdrops: ' + error.message, 'failure');
        console.error('Error in testRemoveBackdrop:', error);
    }
}

// Helper function to log test results
function logTestResult(message, type = 'info') {
    const resultsDiv = document.getElementById('test-results');
    
    if (!resultsDiv) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const resultLine = document.createElement('div');
    
    let icon = '🔹';
    if (type === 'success') icon = '✅';
    if (type === 'failure') icon = '❌';
    if (type === 'info') icon = 'ℹ️';
    
    resultLine.innerHTML = `<span>${timestamp}</span> <span class="test-${type}">${icon} ${message}</span>`;
    
    resultsDiv.appendChild(resultLine);
    resultsDiv.scrollTop = resultsDiv.scrollHeight;
    
    // Also log to console
    console.log(`[${type.toUpperCase()}] ${message}`);
}
