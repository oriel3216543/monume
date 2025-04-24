/**
 * Form Cube Buttons Enhancement
 * 
 * This script adds enhanced hover and interactive effects to the form cube buttons
 * in the MonuMe Forms interface.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Select all form cube buttons - target both class names to ensure compatibility
    const formCubeButtons = document.querySelectorAll('.form-cube-btn, .form-card-btn');
    
    // Add hover and active effects to each button
    formCubeButtons.forEach(button => {
        // Improve accessibility - Add ARIA attributes
        if (!button.hasAttribute('aria-label')) {
            const iconEl = button.querySelector('i');
            const iconClass = iconEl ? iconEl.className : '';
            
            // Set appropriate aria labels based on button type
            if (button.classList.contains('edit-form-btn')) {
                button.setAttribute('aria-label', 'Edit form');
            } else if (button.classList.contains('url-form-btn')) {
                button.setAttribute('aria-label', 'Share form URL');
            } else if (button.classList.contains('view-responses-btn')) {
                button.setAttribute('aria-label', 'View form responses');
            }
        }
        
        // Ensure buttons have role attribute
        if (!button.hasAttribute('role')) {
            button.setAttribute('role', 'button');
        }
        
        // Add tabindex if not present
        if (!button.hasAttribute('tabindex')) {
            button.setAttribute('tabindex', '0');
        }
        
        // Add mouseover event
        button.addEventListener('mouseover', function() {
            // Add scale effect and change background
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 15px rgba(255, 149, 98, 0.3)';
            
            // Add icon animation
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1.2)';
                icon.style.transition = 'all 0.3s ease';
            }
        });
        
        // Add mouseout event to reset
        button.addEventListener('mouseout', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = '';
            }
        });
        
        // Add keyboard support for accessibility
        button.addEventListener('keydown', function(e) {
            // Handle Enter or Space key for button activation
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
                
                // Add visual feedback for keyboard users
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);
            }
        });
        
        // Add click effect
        button.addEventListener('click', function(event) {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('button-ripple');
            this.appendChild(ripple);
            
            // Position the ripple
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${event.clientX - rect.left - size/2}px`;
            ripple.style.top = `${event.clientY - rect.top - size/2}px`;
            
            // Remove ripple after animation completes
            setTimeout(() => {
                ripple.remove();
            }, 600);
            
            // Handle specific button actions
            if (this.classList.contains('edit-form-btn')) {
                console.log('Edit form button clicked');
                // Open form editor
                openFormEditor(this.closest('.form-cube').dataset.formId);
                showToast('Opening form editor...', 'info');
            } else if (this.classList.contains('url-form-btn')) {
                console.log('URL button clicked');
                // Show URL modal
                openUrlModal(this.dataset.url);
                showToast('URL sharing options available', 'info');
            } else if (this.classList.contains('view-responses-btn')) {
                console.log('View responses button clicked');
                // Show responses view
                showResponses(this.closest('.form-cube').dataset.formId);
                showToast('Loading responses...', 'info');
            }
        });
    });
    
    // New Form cube click handler
    const newFormCube = document.querySelector('.new-form-cube');
    if (newFormCube) {
        // Add accessibility attributes
        newFormCube.setAttribute('role', 'button');
        newFormCube.setAttribute('aria-label', 'Create new form');
        newFormCube.setAttribute('tabindex', '0');
        
        newFormCube.addEventListener('click', function() {
            console.log('Create new form clicked');
            // Add pulse animation to icon
            const icon = this.querySelector('.new-form-icon');
            if (icon) {
                icon.classList.add('pulse-animation');
                setTimeout(() => {
                    icon.classList.remove('pulse-animation');
                }, 800);
            }
            // Open form builder
            openFormBuilder();
            showToast('Creating new form...', 'success');
        });
        
        // Add keyboard support
        newFormCube.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }
    
    // Placeholder functions to be implemented or connected to existing code
    function openFormEditor(formId) {
        // Implementation to open form editor with the specific form
        console.log(`Opening editor for form ID: ${formId}`);
        // Toggle display of form grid and builder
        document.querySelector('.forms-grid-container').style.display = 'none';
        document.querySelector('.builder-container').style.display = 'block';
    }
    
    function openUrlModal(url) {
        // Implementation to open URL sharing modal
        console.log(`Opening URL modal for: ${url}`);
        const urlModal = document.getElementById('form-link-modal');
        if (urlModal) {
            // Set the URL in the modal
            const urlDisplay = document.getElementById('formUrlDisplay');
            if (urlDisplay) {
                const fullUrl = `https://monume-tracker.com/${url}`;
                urlDisplay.textContent = fullUrl;
                
                // Add QR code generation for the URL if needed
                // generateQRCode(fullUrl);
            }
            // Show the modal
            urlModal.style.display = 'flex';
            
            // Focus on close button for keyboard accessibility
            const closeBtn = urlModal.querySelector('.close-modal, #closeUrlModal');
            if (closeBtn) {
                setTimeout(() => closeBtn.focus(), 100);
            }
        }
    }
    
    // Generate QR Code for URL sharing
    function generateQRCode(url) {
        const qrContainer = document.getElementById('qrCodeContainer');
        if (qrContainer) {
            // Clear previous QR code
            qrContainer.innerHTML = '';
            
            // Check if QRCode library is available
            if (typeof QRCode === 'function') {
                new QRCode(qrContainer, {
                    text: url,
                    width: 128,
                    height: 128,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                // Fallback text if QR library is not available
                qrContainer.innerHTML = '<p>QR Code generation requires the QRCode library</p>';
                
                // Load QR Code library dynamically
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator/qrcode.min.js';
                script.onload = function() {
                    generateQRCode(url);
                };
                document.head.appendChild(script);
            }
        }
    }
    
    function showResponses(formId) {
        // Implementation to show form responses
        console.log(`Showing responses for form ID: ${formId}`);
        // Toggle display of grid and submissions
        document.querySelector('.forms-grid-container').style.display = 'none';
        document.querySelector('.submissions-container').style.display = 'block';
    }
    
    function openFormBuilder() {
        // Implementation to open blank form builder
        console.log('Opening form builder for new form');
        document.querySelector('.forms-grid-container').style.display = 'none';
        document.querySelector('.builder-container').style.display = 'block';
    }
    
    // Handle modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal, .close-btn');
    closeButtons.forEach(button => {
        // Add keyboard navigation attributes
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Close modal');
        button.setAttribute('tabindex', '0');
        
        button.addEventListener('click', function() {
            // Find closest modal and hide it
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                
                // Return focus to the element that opened the modal
                const lastFocusedElement = modal.dataset.lastFocused;
                if (lastFocusedElement) {
                    const element = document.querySelector(lastFocusedElement);
                    if (element) {
                        element.focus();
                    }
                }
            }
        });
        
        // Add keyboard support
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Handle the close buttons in the form-link modal
    const closeUrlModal = document.getElementById('closeUrlModal');
    const closeUrlModalBtn = document.getElementById('closeUrlModalBtn');
    
    if (closeUrlModal) {
        closeUrlModal.addEventListener('click', function() {
            const modal = document.getElementById('form-link-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    if (closeUrlModalBtn) {
        closeUrlModalBtn.addEventListener('click', function() {
            const modal = document.getElementById('form-link-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Copy URL button functionality
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    if (copyUrlBtn) {
        // Add accessibility attributes
        copyUrlBtn.setAttribute('role', 'button');
        copyUrlBtn.setAttribute('aria-label', 'Copy form URL to clipboard');
        
        copyUrlBtn.addEventListener('click', function() {
            const urlDisplay = document.getElementById('formUrlDisplay');
            if (urlDisplay) {
                // Modern clipboard API with fallback
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(urlDisplay.textContent)
                        .then(() => {
                            showToast('URL copied to clipboard!', 'success');
                            updateCopyButton(true);
                        })
                        .catch(err => {
                            console.error('Failed to copy: ', err);
                            showToast('Failed to copy URL', 'error');
                            updateCopyButton(false);
                        });
                } else {
                    // Fallback to older method
                    const tempInput = document.createElement('input');
                    tempInput.value = urlDisplay.textContent;
                    document.body.appendChild(tempInput);
                    // Select and copy
                    tempInput.select();
                    const success = document.execCommand('copy');
                    // Remove temporary element
                    document.body.removeChild(tempInput);
                    
                    if (success) {
                        showToast('URL copied to clipboard!', 'success');
                        updateCopyButton(true);
                    } else {
                        showToast('Failed to copy URL', 'error');
                        updateCopyButton(false);
                    }
                }
            }
        });
        
        function updateCopyButton(success) {
            if (success) {
                copyUrlBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyUrlBtn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            } else {
                copyUrlBtn.innerHTML = '<i class="fas fa-times"></i>';
                setTimeout(() => {
                    copyUrlBtn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            }
        }
    }
    
    // Add sharing options to URL modal
    const shareUrlBtn = document.getElementById('shareUrlBtn');
    if (shareUrlBtn) {
        shareUrlBtn.addEventListener('click', function() {
            const urlText = document.getElementById('formUrlText');
            if (urlText && navigator.share) {
                navigator.share({
                    title: 'MonuMe Form',
                    text: 'Check out this MonuMe form:',
                    url: urlText.textContent
                })
                .then(() => showToast('Form shared successfully!', 'success'))
                .catch(err => {
                    console.error('Share failed:', err);
                    showToast('Sharing failed', 'error');
                });
            } else {
                showToast('Web Share API not supported in this browser', 'warning');
            }
        });
    }
    
    // Toast notification system
    function showToast(message, type = 'info') {
        // Check if toast container exists, create if not
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Add appropriate icon based on type
        let icon = '';
        switch(type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            case 'info':
            default:
                icon = '<i class="fas fa-info-circle"></i>';
                break;
        }
        
        // Set toast content
        toast.innerHTML = `
            ${icon}
            <span>${message}</span>
            <button class="toast-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Set up close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.add('toast-hiding');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            });
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('toast-hiding');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
        
        // Add animation class to show
        setTimeout(() => {
            toast.classList.add('toast-visible');
        }, 10);
    }
    
    // Handle keyboard accessibility for modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        // Store last focused element before opening modal
        modal.addEventListener('show', function() {
            modal.dataset.lastFocused = document.activeElement.id || 
                document.activeElement.classList.toString().replace(/\s+/g, '.');
        });
        
        // Trap focus inside modal when open
        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                // Close on escape
                const closeBtn = modal.querySelector('.close-modal, .close-btn');
                if (closeBtn) {
                    closeBtn.click();
                }
                return;
            }
            
            if (e.key === 'Tab') {
                // Get all focusable elements
                const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                // Handle tab trapping
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    });
});

// Add CSS for the ripple effect, pulse animation, and toast notifications
document.addEventListener('DOMContentLoaded', function() {
    // Create style element
    const style = document.createElement('style');
    style.textContent = `
        .button-ripple {
            position: absolute;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .pulse-animation {
            animation: pulse 0.8s ease-in-out;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
        }
        
        /* Enhanced hover styles for form cube buttons */
        .form-cube-btn, .form-card-btn {
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        
        .form-cube-btn:hover, .form-card-btn:hover {
            background: var(--main-color) !important;
            color: white !important;
            transform: translateY(-5px) !important;
            box-shadow: 0 8px 15px rgba(255, 149, 98, 0.3) !important;
        }
        
        .form-cube-btn:hover i, .form-card-btn:hover i {
            transform: scale(1.2) !important;
        }
        
        /* Focus styles for keyboard navigation */
        .form-cube-btn:focus-visible, .form-card-btn:focus-visible {
            outline: 3px solid var(--main-color);
            outline-offset: 2px;
            box-shadow: 0 0 0 3px rgba(255, 149, 98, 0.3);
        }
        
        /* Make new form cube more interactive */
        .new-form-cube {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        
        .new-form-cube:hover {
            transform: translateY(-10px) scale(1.03) !important;
            box-shadow: 0 15px 30px rgba(255, 149, 98, 0.2) !important;
        }
        
        .new-form-cube:hover .new-form-icon {
            background: var(--main-color) !important;
            transform: scale(1.1) rotate(90deg) !important;
        }
        
        .new-form-cube:hover .new-form-icon i {
            color: white !important;
        }
        
        .new-form-cube:focus-visible {
            outline: 3px solid var(--main-color);
            outline-offset: 2px;
        }
        
        /* Toast notification styles */
        #toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .toast {
            min-width: 280px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
            padding: 12px 15px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            transform: translateX(120%);
            transition: transform 0.3s ease-out;
            border-left: 4px solid #ccc;
        }
        
        .toast-visible {
            transform: translateX(0);
        }
        
        .toast-hiding {
            transform: translateX(120%);
        }
        
        .toast-success {
            border-left-color: #4CAF50;
        }
        
        .toast-error {
            border-left-color: #F44336;
        }
        
        .toast-warning {
            border-left-color: #FF9800;
        }
        
        .toast-info {
            border-left-color: var(--main-color, #2196F3);
        }
        
        .toast i {
            font-size: 20px;
        }
        
        .toast-success i {
            color: #4CAF50;
        }
        
        .toast-error i {
            color: #F44336;
        }
        
        .toast-warning i {
            color: #FF9800;
        }
        
        .toast-info i {
            color: var(--main-color, #2196F3);
        }
        
        .toast span {
            flex-grow: 1;
        }
        
        .toast-close {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            padding: 0;
            color: #888;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .toast-close:hover {
            background: rgba(0, 0, 0, 0.1);
        }
        
        /* QR code container styles */
        #qrCodeContainer {
            display: flex;
            justify-content: center;
            margin: 15px 0;
            background: white;
            padding: 10px;
            border-radius: 8px;
        }

        /* URL Modal styles */
        #form-link-modal {
            display: none;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            align-items: center;
            justify-content: center;
        }
        
        #form-link-modal .modal-content {
            background-color: white;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            animation: modalFadeIn 0.3s ease-out;
        }
        
        #form-link-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
        }
        
        #form-link-modal .modal-title {
            color: var(--main-color);
            margin: 0;
            font-size: 1.4rem;
        }
        
        #form-link-modal .close-modal {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #888;
            transition: color 0.2s;
        }
        
        #form-link-modal .close-modal:hover {
            color: var(--main-color);
        }
        
        #form-link-modal .modal-body {
            padding: 20px;
        }
        
        #form-link-modal .form-url-container {
            display: flex;
            background: #f5f5f5;
            border-radius: 6px;
            padding: 10px 15px;
            margin: 15px 0;
            border: 1px solid #ddd;
            align-items: center;
        }
        
        #form-link-modal #formUrlDisplay {
            flex-grow: 1;
            font-family: monospace;
            word-break: break-all;
            color: #333;
        }
        
        #form-link-modal .copy-url-btn {
            background: var(--main-color);
            color: white;
            border: none;
            border-radius: 4px;
            width: 35px;
            height: 35px;
            margin-left: 10px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #form-link-modal .copy-url-btn:hover {
            background: var(--accent-color, #FF7043);
            transform: scale(1.05);
        }
        
        #form-link-modal .url-instructions {
            margin-top: 15px;
            color: #666;
            font-size: 0.9rem;
        }
        
        #form-link-modal .modal-footer {
            padding: 15px 20px;
            text-align: right;
            border-top: 1px solid #eee;
        }
        
        #form-link-modal .btn-secondary {
            background-color: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        #form-link-modal .btn-secondary:hover {
            background-color: #e5e5e5;
        }
        
        @keyframes modalFadeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    // Append to head
    document.head.appendChild(style);
});

// Add a modal to the document if it doesn't exist yet
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('urlModal')) {
        const modalHTML = `
        <div id="urlModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Share Form URL</h2>
                    <button class="close-modal" aria-label="Close modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Share this URL to allow others to access your form:</p>
                    <div class="url-container">
                        <code id="formUrlText"></code>
                        <button id="copyUrlBtn" aria-label="Copy URL to clipboard">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div id="qrCodeContainer"></div>
                    <div class="share-options">
                        <button id="shareUrlBtn" class="share-btn">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                        <a id="emailShareBtn" class="share-btn email-btn">
                            <i class="fas fa-envelope"></i> Email
                        </a>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="close-btn">Close</button>
                </div>
            </div>
        </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
    }
});