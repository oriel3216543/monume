/**
 * Share Appointment Dialog Handler
 * Manages the UI and functionality for sharing appointment links with customers
 */

// Global variable to store the current appointment being shared
let currentAppointmentForSharing = null;

/**
 * Opens the share dialog with the appointment information
 * @param {Object} appointment - The appointment object to share
 */
function openShareDialog(appointment) {
    // Store the appointment for use in share methods
    currentAppointmentForSharing = appointment;
    
    // Set up the share link
    const baseUrl = "https://www.monumevip.com/confirm-appointment/";
    const appointmentLink = `${baseUrl}${appointment.id}`;
    
    // Update the link in the dialog
    document.getElementById('share-dialog-link').value = appointmentLink;
    
    // Show the dialog and overlay
    document.getElementById('share-dialog').style.display = 'block';
    document.getElementById('share-overlay').style.display = 'block';
}

/**
 * Close the share dialog
 */
function closeShareDialog() {
    document.getElementById('share-dialog').style.display = 'none';
    document.getElementById('share-overlay').style.display = 'none';
    currentAppointmentForSharing = null;
}

/**
 * Copy the appointment link to clipboard
 */
function copyAppointmentLink() {
    const linkInput = document.getElementById('share-dialog-link');
    linkInput.select();
    document.execCommand('copy');
    
    // Visual feedback that the link was copied
    const copyBtn = document.getElementById('share-dialog-copy');
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    
    // Reset the button after 2 seconds
    setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    }, 2000);
}

/**
 * Share the appointment via WhatsApp
 */
function shareViaWhatsApp() {
    if (!currentAppointmentForSharing) return;
    
    const phone = currentAppointmentForSharing.extendedProps?.customerPhone;
    const appointmentLink = document.getElementById('share-dialog-link').value;
    
    // Format the message
    const message = encodeURIComponent(
        `Hello ${currentAppointmentForSharing.extendedProps?.customerName || 'there'},\n\n` +
        `Here is your appointment confirmation link for ${currentAppointmentForSharing.title} ` +
        `on ${formatAppointmentDate(currentAppointmentForSharing.start)}:\n\n` +
        `${appointmentLink}\n\n` +
        `Please confirm your appointment by clicking the link above.\n\n` +
        `Thank you,\n` +
        `MonuMe Team`
    );
    
    // Create the WhatsApp URL - if we have phone number, use it, otherwise just open WhatsApp
    const whatsappUrl = phone ? 
        `https://wa.me/${phone.replace(/\D/g, '')}?text=${message}` : 
        `https://web.whatsapp.com/send?text=${message}`;
    
    // Open in a new tab
    window.open(whatsappUrl, '_blank');
}

/**
 * Share the appointment via email
 */
function shareViaEmail() {
    if (!currentAppointmentForSharing) return;
    
    const email = currentAppointmentForSharing.extendedProps?.customerEmail;
    const appointmentLink = document.getElementById('share-dialog-link').value;
    
    if (!email) {
        // If we don't have an email, show an input dialog to enter email
        const emailInput = prompt('Please enter the customer\'s email address:', '');
        
        if (!emailInput || !validateEmail(emailInput)) {
            alert('Please enter a valid email address to send the confirmation.');
            return;
        }
        
        // Use the entered email
        sendConfirmationEmail(emailInput, currentAppointmentForSharing, appointmentLink);
        return;
    }
    
    // Send the confirmation email using the API
    sendConfirmationEmail(email, currentAppointmentForSharing, appointmentLink);
}

/**
 * Send confirmation email using the API
 * @param {string} email - The recipient email address
 * @param {Object} appointment - The appointment object
 * @param {string} appointmentLink - The appointment confirmation link
 */
async function sendConfirmationEmail(email, appointment, appointmentLink) {
    try {
        // Show sending indicator in the status area
        const statusArea = document.getElementById('share-status');
        const emailBtn = document.getElementById('share-email');
        
        // Disable all share methods during sending
        const shareMethods = document.querySelectorAll('.share-method');
        shareMethods.forEach(method => method.classList.add('disabled'));
        
        // Show the status area
        statusArea.style.display = 'block';
        
        // Use the API function from share-appointment-api.js
        const result = await sendAppointmentEmail(email, appointment, appointmentLink);
        
        // Update status area based on result
        if (result.success) {
            // Show success message in the status area
            statusArea.innerHTML = '<i class="fas fa-check-circle" style="color: green;"></i> <span class="status-text">Email sent successfully!</span>';
            
            // Hide the status after 3 seconds
            setTimeout(() => {
                statusArea.style.display = 'none';
            }, 3000);
        } else {
            // Show error message in status area
            statusArea.innerHTML = '<i class="fas fa-exclamation-circle" style="color: red;"></i> <span class="status-text">Failed to send email. Falling back to email client.</span>';
            
            // Fallback to mailto
            openEmailClient(email, appointment, appointmentLink);
            
            // Hide the status after 5 seconds
            setTimeout(() => {
                statusArea.style.display = 'none';
            }, 5000);
        }
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        
        // Show error in status area
        const statusArea = document.getElementById('share-status');
        statusArea.innerHTML = '<i class="fas fa-exclamation-circle" style="color: red;"></i> <span class="status-text">Error: Failed to connect to server. Using email client instead.</span>';
        
        // Fallback to mailto
        openEmailClient(email, appointment, appointmentLink);
        
        // Hide the status after 5 seconds
        setTimeout(() => {
            statusArea.style.display = 'none';
        }, 5000);
    } finally {
        // Re-enable all share methods
        const shareMethods = document.querySelectorAll('.share-method');
        shareMethods.forEach(method => method.classList.remove('disabled'));
    }
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if the email is valid
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Open the default email client with pre-populated fields
 * @param {string} email - The recipient email address
 * @param {Object} appointment - The appointment object
 * @param {string} appointmentLink - The appointment confirmation link
 */
function openEmailClient(email, appointment, appointmentLink) {
    const subject = encodeURIComponent(`Appointment Confirmation: ${appointment.title}`);
    const body = encodeURIComponent(
        `Hello ${appointment.extendedProps?.customerName || 'there'},\n\n` +
        `Thank you for scheduling an appointment with MonuMe.\n\n` +
        `Appointment Details:\n` +
        `- Title: ${appointment.title}\n` +
        `- Date: ${formatAppointmentDate(appointment.start)}\n` +
        `- Time: ${formatAppointmentTime(appointment.start)}\n` +
        (appointment.extendedProps?.salesRepName ? `- With: ${appointment.extendedProps.salesRepName}\n` : '') +
        `\nPlease confirm your appointment by clicking the link below:\n` +
        `${appointmentLink}\n\n` +
        `If you need to reschedule or cancel, please contact us as soon as possible.\n\n` +
        `Thank you,\n` +
        `The MonuMe Team`
    );
    
    // Create the mailto URL
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    
    // Open in a new tab or in the default mail client
    window.location.href = mailtoUrl;
}

/**
 * Share the appointment via SMS
 */
function shareViaSMS() {
    if (!currentAppointmentForSharing) return;
    
    const phone = currentAppointmentForSharing.extendedProps?.customerPhone;
    const appointmentLink = document.getElementById('share-dialog-link').value;
    
    // Format the message
    const message = encodeURIComponent(
        `MonuMe appointment confirmation for ${currentAppointmentForSharing.title} on ` +
        `${formatAppointmentDate(currentAppointmentForSharing.start)}. ` +
        `Please confirm: ${appointmentLink}`
    );
    
    // Try to use the Web Share API first if available
    if (navigator.share) {
        navigator.share({
            title: 'Appointment Confirmation',
            text: decodeURIComponent(message),
            url: appointmentLink
        }).catch(err => {
            // Fallback if sharing fails
            if (phone) {
                window.location.href = `sms:${phone}?body=${message}`;
            } else {
                window.location.href = `sms:?body=${message}`;
            }
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        if (phone) {
            window.location.href = `sms:${phone}?body=${message}`;
        } else {
            window.location.href = `sms:?body=${message}`;
        }
    }
}

/**
 * Share the appointment via other methods (uses the Web Share API if available)
 */
function shareViaOther() {
    if (!currentAppointmentForSharing) return;
    
    const appointmentLink = document.getElementById('share-dialog-link').value;
    
    // Try to use the Web Share API
    if (navigator.share) {
        navigator.share({
            title: `Appointment: ${currentAppointmentForSharing.title}`,
            text: `Here is your appointment confirmation link for ${currentAppointmentForSharing.title} on ${formatAppointmentDate(currentAppointmentForSharing.start)}.`,
            url: appointmentLink
        }).catch(err => {
            console.error('Error sharing:', err);
            // Fallback to copying to clipboard
            copyAppointmentLink();
            alert('The link has been copied to your clipboard. You can paste it to share with your customer.');
        });
    } else {
        // Fallback if Web Share API is not available
        copyAppointmentLink();
        alert('The link has been copied to your clipboard. You can paste it to share with your customer.');
    }
}

/**
 * Format an appointment date string into a human-readable date
 * @param {string|Date} dateString - The date string or Date object
 * @returns {string} Formatted date string
 */
function formatAppointmentDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Format an appointment time string into a human-readable time
 * @param {string|Date} dateString - The date string or Date object
 * @returns {string} Formatted time string
 */
function formatAppointmentTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize share dialog event listeners once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Close dialog button
    document.getElementById('close-share-dialog').addEventListener('click', closeShareDialog);
    
    // Copy link button
    document.getElementById('share-dialog-copy').addEventListener('click', copyAppointmentLink);
    
    // Share methods
    document.getElementById('share-whatsapp').addEventListener('click', shareViaWhatsApp);
    document.getElementById('share-email').addEventListener('click', shareViaEmail);
    document.getElementById('share-sms').addEventListener('click', shareViaSMS);
    document.getElementById('share-other').addEventListener('click', shareViaOther);
    
    // Also close when clicking on the overlay
    document.getElementById('share-overlay').addEventListener('click', closeShareDialog);
});

// Add a method to the modal-helper or event handlers to trigger the share dialog
function addShareButtonToAppointmentModal() {
    // Wait for the DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addShareButtonAfterLoad);
    } else {
        addShareButtonAfterLoad();
    }
}

function addShareButtonAfterLoad() {
    // Get the appointment modal footer
    const modalFooter = document.querySelector('#appointment-modal .modal-footer');
    
    if (!modalFooter) {
        console.error('Could not find appointment modal footer');
        return;
    }
    
    // Check if the share button already exists
    if (document.getElementById('share-appointment')) {
        console.log('Share button already exists');
        return;
    }
    
    // Create the share button
    const shareBtn = document.createElement('button');
    shareBtn.id = 'share-appointment';
    shareBtn.className = 'btn btn-secondary';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share';
    
    // Add event listener
    shareBtn.addEventListener('click', function() {
        // Get the appointment ID from the modal
        const appointmentId = document.getElementById('appointment-modal').getAttribute('data-event-id');
        
        // Find the appointment in storage
        const appointments = getAppointments();
        const appointment = appointments.find(a => String(a.id) === String(appointmentId));
        
        if (appointment) {
            openShareDialog(appointment);
        } else {
            console.error('Could not find appointment with ID:', appointmentId);
            alert('Could not find appointment details.');
        }
    });
    
    // Insert the share button before the close button
    const closeBtn = document.getElementById('close-modal');
    modalFooter.insertBefore(shareBtn, closeBtn);
}

// Add event listeners for the Appointment Details modal footer buttons
function setupAppointmentDetailsFooterShare() {
    // 'Share Link' button copies the appointment link
    const shareLinkBtn = document.getElementById('share-appointment-link');
    if (shareLinkBtn) {
        shareLinkBtn.addEventListener('click', function() {
            // Get the appointment ID from the modal
            const appointmentId = document.getElementById('appointment-modal').getAttribute('data-event-id');
            const appointments = getAppointments();
            const appointment = appointments.find(a => String(a.id) === String(appointmentId));
            if (appointment) {
                // Open the share dialog for this appointment
                openShareDialog(appointment);
                // Copy the link to clipboard immediately
                setTimeout(() => copyAppointmentLink(), 200); // Wait for dialog to render
            } else {
                alert('Could not find appointment details.');
            }
        });
    }
    // 'Send Email' button sends the confirmation email
    const sendEmailBtn = document.getElementById('send-email-manually');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', function() {
            // Get the appointment ID from the modal
            const appointmentId = document.getElementById('appointment-modal').getAttribute('data-event-id');
            const appointments = getAppointments();
            const appointment = appointments.find(a => String(a.id) === String(appointmentId));
            if (appointment) {
                // Open the share dialog for this appointment
                openShareDialog(appointment);
                // Trigger the email send action immediately
                setTimeout(() => shareViaEmail(), 200); // Wait for dialog to render
            } else {
                alert('Could not find appointment details.');
            }
        });
    }
}

// Run setup after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAppointmentDetailsFooterShare);
} else {
    setupAppointmentDetailsFooterShare();
}

// Run the function to add the share button
addShareButtonToAppointmentModal();
