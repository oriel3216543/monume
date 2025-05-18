/**
 * API functions for sharing appointments
 * This file contains functions to interact with the backend API for sharing appointments
 */

/**
 * Send an appointment confirmation email via the API
 * @param {string} email - The recipient email address
 * @param {Object} appointment - The appointment object
 * @param {string} appointmentLink - The appointment confirmation link
 * @returns {Promise} A promise that resolves to the API response
 */
async function sendAppointmentEmail(email, appointment, appointmentLink) {
    try {
        // Format the date and time for email
        const appointmentDate = formatAppointmentDate(appointment.start);
        const appointmentTime = formatAppointmentTime(appointment.start);
        
        // Prepare the request data
        const requestData = {
            email: email,
            subject: `Appointment Confirmation: ${appointment.title}`,
            appointmentData: {
                title: appointment.title,
                date: appointmentDate,
                time: appointmentTime,
                customerName: appointment.extendedProps?.customerName || '',
                salesRepName: appointment.extendedProps?.salesRepName || '',
            },
            confirmationLink: appointmentLink
        };
        
        // Send the request to the API
        const response = await fetch('/send_appointment_email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        // Parse and return the response
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to send email');
        }
        
        return {
            success: true,
            message: result.message || 'Email sent successfully!'
        };
    } catch (error) {
        console.error('Error sending appointment email:', error);
        return {
            success: false,
            message: error.message || 'An error occurred while sending the email'
        };
    }
}
