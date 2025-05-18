/**
 * Host Display Fix Script
 * This script ensures that host/sales rep information is correctly saved and displayed
 * in the appointment details modal after creating or editing an appointment.
 */

// Execute immediately when loaded
(function() {
    console.log('Host display fix script loading...');
    
    // Set up initialization when DOM is ready
    document.addEventListener('DOMContentLoaded', initHostDisplayFix);
    
    /**
     * Initialize the host display fixes
     */
    function initHostDisplayFix() {
        console.log('Initializing host display fixes...');
        
        // Enhance the save button to ensure host name is properly saved
        enhanceSaveAppointment();
        
        // Enhance the show appointment details function
        enhanceShowAppointmentDetails();
        
        // Enhance edit appointment functionality to maintain host selection
        enhanceEditAppointment();
    }
    
    /**
     * Enhance the save appointment function to correctly save host information
     */
    function enhanceSaveAppointment() {
        // Wait for the save button to be available
        const saveButton = document.getElementById('save-appointment');
        if (!saveButton) {
            console.warn('Save button not found yet, will retry later');
            setTimeout(enhanceSaveAppointment, 500);
            return;
        }
        
        // Add enhanced click handler that captures host name
        saveButton.addEventListener('click', function(event) {
            // If editing, ensure we capture the host name correctly
            console.log('Enhanced save handler ensuring host name is captured');
            
            // Get the selected host's ID and name
            const hostSelect = document.getElementById('appointment-sales-rep');
            if (hostSelect && hostSelect.selectedOptions && hostSelect.selectedOptions.length > 0) {
                // Store the ID and name in data attributes for later use
                const hostId = hostSelect.value;
                const hostName = hostSelect.selectedOptions[0].textContent;
                
                console.log('Setting host data:', { hostId, hostName });
                
                // Create a reliable storage for these values
                window._lastSelectedHost = {
                    id: hostId,
                    name: hostName
                };
                
                // Also store on the form for other scripts to access
                const form = document.getElementById('appointment-form');
                if (form) {
                    form.dataset.hostId = hostId;
                    form.dataset.hostName = hostName;
                }
            }
        }, true); // Use capture to ensure this runs first
    }
    
    /**
     * Enhance the edit appointment functionality to correctly handle host selection
     */
    function enhanceEditAppointment() {
        // Wait for edit button to be available (using mutation observer)
        const observer = new MutationObserver((mutations, obs) => {
            const editButton = document.getElementById('edit-appointment');
            if (editButton && !editButton.getAttribute('data-enhanced-host')) {
                console.log('Enhancing edit button for host selection');
                
                // Mark the button as enhanced
                editButton.setAttribute('data-enhanced-host', 'true');
                
                // Add event listener to capture appointment ID before edit modal opens
                editButton.addEventListener('click', function() {
                    const appointmentId = document.getElementById('appointment-modal').getAttribute('data-event-id');
                    
                    if (appointmentId) {
                        // Store the ID for later use
                        window._currentlyEditingAppointmentId = appointmentId;
                        console.log('Saved appointment ID for host selection:', appointmentId);
                    }
                }, true);
                
                obs.disconnect(); // Stop observing once we've enhanced the button
            }
        });
        
        // Start observing the document with the configured parameters
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Also add a document listener to enhance the host select when the modal opens
        document.addEventListener('shown.bs.modal', function(event) {
            if (event.target.id === 'create-appointment-modal' && window._currentlyEditingAppointmentId) {
                setTimeout(setCorrectHostSelection, 200); // Give time for other scripts
            }
        });
        
        // Periodically check if the edit modal is open and needs host selection set
        setInterval(() => {
            const modal = document.getElementById('create-appointment-modal');
            if (modal && 
                window._currentlyEditingAppointmentId && 
                modal.style.display === 'block' && 
                !modal.getAttribute('data-host-selection-set')) {
                
                setCorrectHostSelection();
                modal.setAttribute('data-host-selection-set', 'true');
            }
        }, 500);
    }
    
    /**
     * Set the correct host in the edit appointment modal
     */
    function setCorrectHostSelection() {
        if (!window._currentlyEditingAppointmentId) return;
        
        console.log('Setting correct host selection for appointment:', window._currentlyEditingAppointmentId);
        
        try {
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            const appointment = appointments.find(a => String(a.id) === String(window._currentlyEditingAppointmentId));
            
            if (appointment) {
                // Get host ID from different possible locations in the data structure
                const hostId = appointment.extendedProps?.salesRepId || 
                               appointment.salesRepId || 
                               '';
                               
                console.log('Found host ID:', hostId);
                
                // Set the selection in dropdown
                const hostSelect = document.getElementById('appointment-sales-rep');
                if (hostSelect && hostId) {
                    const options = Array.from(hostSelect.options);
                    
                    // First try exact match
                    const exactMatch = options.find(opt => String(opt.value) === String(hostId));
                    if (exactMatch) {
                        console.log('Setting host dropdown selection to exact match:', exactMatch.textContent);
                        hostSelect.value = exactMatch.value;
                    }
                    // If no match, find option by name
                    else {
                        const hostName = appointment.extendedProps?.salesRepName || 
                                        appointment.salesRepName || 
                                        '';
                        
                        if (hostName) {
                            const nameMatch = options.find(opt => 
                                opt.textContent.toLowerCase().includes(hostName.toLowerCase())
                            );
                            
                            if (nameMatch) {
                                console.log('Setting host dropdown selection by name match:', nameMatch.textContent);
                                hostSelect.value = nameMatch.value;
                            }
                        }
                    }
                    
                    // Store the selection in data attributes
                    const selected = hostSelect.selectedOptions[0];
                    if (selected) {
                        const form = document.getElementById('appointment-form');
                        if (form) {
                            form.dataset.hostId = selected.value;
                            form.dataset.hostName = selected.textContent;
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error setting host selection:', e);
        }
    }
    
    /**
     * Enhance the show appointment details function to correctly display host information
     */
    function enhanceShowAppointmentDetails() {
        // Wait until the original function is defined
        if (typeof window.showAppointmentDetails !== 'function') {
            // Create a monitor for the function
            if (!window._waitingForShowAppointmentDetails) {
                window._waitingForShowAppointmentDetails = true;
                Object.defineProperty(window, 'showAppointmentDetails', {
                    set: function(newFunction) {
                        // Store original function
                        window._originalShowAppointmentDetails = newFunction;
                        
                        // Create enhanced version
                        window._enhancedShowAppointmentDetails = function(event) {
                            console.log('Enhanced show appointment details running');
                            
                            // Call original function first
                            window._originalShowAppointmentDetails(event);
                            
                            // Then ensure host info is displayed correctly
                            ensureHostInfoDisplayed(event);
                        };
                        
                        // Return enhanced version
                        return window._enhancedShowAppointmentDetails;
                    },
                    get: function() {
                        // If we have our enhanced version, return it
                        if (window._enhancedShowAppointmentDetails) {
                            return window._enhancedShowAppointmentDetails;
                        }
                        
                        // Otherwise, return original or a placeholder
                        return window._originalShowAppointmentDetails || function() {
                            console.warn('Original showAppointmentDetails not available yet');
                        };
                    },
                    configurable: true
                });
            }
            
            // Also check again later
            setTimeout(enhanceShowAppointmentDetails, 500);
            return;
        }
        
        // If we get here, the function exists but wasn't caught by our property descriptor
        if (!window._originalShowAppointmentDetails) {
            console.log('Wrapping existing showAppointmentDetails function');
            window._originalShowAppointmentDetails = window.showAppointmentDetails;
            window.showAppointmentDetails = function(event) {
                // Call original function
                window._originalShowAppointmentDetails(event);
                
                // Then ensure host info is displayed correctly
                ensureHostInfoDisplayed(event);
            };
        }
    }
    
    /**
     * Ensure host information is displayed correctly in the appointment modal
     */
    function ensureHostInfoDisplayed(event) {
        console.log('Ensuring host information is displayed correctly');
        
        // Get appointment data
        const appointmentId = document.getElementById('appointment-modal').getAttribute('data-event-id');
        if (!appointmentId) {
            console.warn('No appointment ID found in modal');
            return;
        }
        
        // Try to get complete appointment data from localStorage
        try {
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            const appointment = appointments.find(a => String(a.id) === String(appointmentId));
            
            // If we found the appointment, ensure host name is displayed
            if (appointment) {
                console.log('Found appointment in localStorage:', appointment);
                
                // Get host information from different possible locations
                let hostName = '';
                
                // Check different possible locations for host name
                if (appointment.extendedProps && appointment.extendedProps.salesRepName) {
                    hostName = appointment.extendedProps.salesRepName;
                } else if (appointment.salesRepName) {
                    hostName = appointment.salesRepName;
                } else {
                    // If no name found, try to look up by ID
                    const hostId = appointment.extendedProps?.salesRepId || appointment.salesRepId;
                    
                    if (hostId) {
                        // Try to get host name from sales reps in localStorage
                        try {
                            const salesReps = JSON.parse(localStorage.getItem('salesReps') || '[]');
                            const host = salesReps.find(rep => String(rep.id) === String(hostId));
                            if (host) {
                                hostName = host.name || '';
                            }
                        } catch (e) {
                            console.error('Error looking up host name:', e);
                        }
                    }
                }
                
                // If we found a host name, display it
                if (hostName) {
                    console.log('Setting host name in modal:', hostName);
                    document.getElementById('modal-sales-rep').textContent = hostName;
                } else {
                    console.warn('No host name found for appointment');
                    document.getElementById('modal-sales-rep').textContent = 'Not assigned';
                }
            }
        } catch (e) {
            console.error('Error ensuring host information is displayed:', e);
        }
    }
    
    console.log('Host display fix script loaded');
})();
