// forms.js - Handles all form-related functionality
document.addEventListener('DOMContentLoaded', function() {
    // Clear localStorage forms to ensure no forms are loaded from there
    localStorage.removeItem('monume_forms');
    
    // Load forms from the server
    loadForms();
    
    // Setup click handler for the "New Form Cube"
    const newFormCube = document.querySelector('.new-form-cube');
    if (newFormCube) {
        newFormCube.addEventListener('click', function() {
            window.location.href = 'edit_form.html';
        });
    }
    
    // Close URL modal buttons - using optional chaining to avoid errors if elements don't exist
    const closeUrlModal = document.getElementById('closeUrlModal');
    if (closeUrlModal) {
        closeUrlModal.addEventListener('click', function() {
            const modal = document.getElementById('form-link-modal');
            if (modal) modal.style.display = 'none';
        });
    }
    
    const closeUrlModalBtn = document.getElementById('closeUrlModalBtn');
    if (closeUrlModalBtn) {
        closeUrlModalBtn.addEventListener('click', function() {
            const modal = document.getElementById('form-link-modal');
            if (modal) modal.style.display = 'none';
        });
    }

    // Copy URL button
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener('click', function() {
            const formUrlDisplay = document.getElementById('formUrlDisplay');
            if (formUrlDisplay) {
                const urlText = formUrlDisplay.textContent;
                navigator.clipboard.writeText(urlText)
                    .then(() => {
                        this.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            this.innerHTML = '<i class="fas fa-copy"></i>';
                        }, 2000);
                        
                        showNotification('URL copied to clipboard!', 'success');
                    })
                    .catch(err => {
                        console.error('Failed to copy URL: ', err);
                        showNotification('Failed to copy URL', 'error');
                    });
            }
        });
    }
});

// Load forms from the server
function loadForms() {
    showNotification('Loading forms...', 'info');
    
    // Check if we're using Visual Studio Code's Live Server or local file access
    const isLocalDevelopment = window.location.protocol === 'file:' || 
                               window.location.hostname === '127.0.0.1' || 
                               window.location.hostname === 'localhost';
    
    if (isLocalDevelopment) {
        // First try to get forms from localStorage
        const savedFormsJSON = localStorage.getItem('monume_forms');
        if (savedFormsJSON) {
            try {
                // Parse the saved forms JSON
                let savedForms = JSON.parse(savedFormsJSON);
                
                // Handle different data structures - normalize to an array
                if (savedForms.forms && Array.isArray(savedForms.forms)) {
                    // We have a {forms: [...]} structure
                    savedForms = savedForms.forms;
                } else if (!Array.isArray(savedForms)) {
                    // If it's not an array and doesn't have forms property, convert to array
                    savedForms = [savedForms];
                }
                
                console.log('Loaded forms from localStorage:', savedForms);
                // Display forms
                displayForms(savedForms);
                return;
            } catch (error) {
                console.error('Error parsing localStorage forms:', error);
            }
        }
        
        // Fallback to empty array instead of mock data
        console.log('No forms found in localStorage, starting with empty state');
        const mockForms = [];
        
        // Save empty forms array to localStorage
        localStorage.setItem('monume_forms', JSON.stringify(mockForms));
        
        // Display empty forms view
        displayForms(mockForms);
        return;
    }

    // For production environment, fetch from the API
    fetch('/api/forms')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Forms loaded:', data);
            displayForms(data.forms);
        })
        .catch(error => {
            console.error('Error loading forms:', error);
            showNotification('Error loading forms: ' + error.message, 'error');
            
            // Display empty state so users can still create forms
            displayForms([]);
        });
}

// Display forms in the forms container
function displayForms(forms) {
    const formsContainer = document.getElementById('forms-container');
    if (!formsContainer) {
        console.error('Forms container not found');
        return;
    }
    
    // Clear existing forms
    formsContainer.innerHTML = '';
    
    // If no forms, show message
    if (!forms || forms.length === 0) {
        formsContainer.innerHTML = `
            <div class="no-forms-message">
                <i class="fas fa-file-alt"></i>
                <p>No forms created yet. Click "Create New Form" to create your first form.</p>
            </div>
        `;
        return;
    }
    
    // Filter out demo forms and the official form
    const filteredForms = forms.filter(form => {
        const demoForms = [
            'Team Feedback Form',
            'Work Environment Survey',
            'Manager Performance Review',
            'Employee Engagement Survey',
            'Project Retrospective',
            'MonuMe Tracker - Official Form'
        ];
        
        return !demoForms.includes(form.title);
    });
    
    // If after filtering we have no forms, show empty state
    if (filteredForms.length === 0) {
        formsContainer.innerHTML = `
            <div class="no-forms-message">
                <i class="fas fa-file-alt"></i>
                <p>No forms created yet. Click "Create New Form" to create your first form.</p>
            </div>
        `;
        return;
    }
    
    // Display each filtered form
    filteredForms.forEach(form => {
        const formElement = createFormElement(form);
        formsContainer.appendChild(formElement);
    });
    
    // Setup event listeners for the form cubes
    setupFormCubeEventListeners();
}

// Create a form element with the updated compact design
function createFormElement(form) {
    // Create form container
    const formElement = document.createElement('div');
    formElement.className = 'form-cube';
    formElement.dataset.formId = form.id;
    
    // Format date
    const formattedDate = new Date(form.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Count questions
    const questionsCount = form.questions ? (typeof form.questions === 'string' 
        ? JSON.parse(form.questions).length 
        : form.questions.length) : 0;
    
    // Create form HTML with more compact layout
    formElement.innerHTML = `
        <div class="form-cube-content">
            <div class="form-cube-header">
                <i class="fas fa-clipboard-check form-icon"></i>
                <h3 title="${form.title}">${form.title}</h3>
                <span class="form-date">Updated: ${formattedDate}</span>
                <span class="responses-count">
                    <i class="fas fa-chart-bar"></i> 0 Responses
                </span>
            </div>
            <div class="form-cube-body">
                <p title="${form.description || 'No description provided.'}">${form.description || 'No description provided.'}</p>
                <div class="form-cube-preview">
                    ${questionsCount > 0 ? `<div class="preview-question" title="Question 1">Question 1</div>` : ''}
                    ${questionsCount > 1 ? `<div class="preview-question" title="Question 2">Question 2</div>` : ''}
                    ${questionsCount > 2 ? `<div class="preview-question" title="More questions">+${questionsCount - 2} more</div>` : ''}
                </div>
            </div>
            <div class="form-cube-footer">
                <button class="form-cube-btn edit-form-btn" title="Edit Form">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="form-cube-btn url-form-btn" title="Share Form">
                    <i class="fas fa-link"></i> Share
                </button>
                <button class="form-cube-btn view-responses-btn" title="View Responses">
                    <i class="fas fa-chart-pie"></i> View
                </button>
                <button class="form-cube-btn delete-form-btn" title="Delete Form">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="form-footer">
                <p>© ${new Date().getFullYear()} MonumeVIP - All rights reserved</p>
            </div>
        </div>
    `;
    
    return formElement;
}

// Setup event listeners for form cubes
function setupFormCubeEventListeners() {
    // Form cube functionality - Edit buttons redirect to edit_form.html
    const editButtons = document.querySelectorAll('.edit-form-btn');
    if (editButtons) {
        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const formCube = this.closest('.form-cube');
                const formId = formCube.dataset.formId;
                // Redirect to edit_form.html with the form ID as a parameter
                window.location.href = `edit_form.html?form_id=${formId}`;
            });
        });
    }

    // Form URL modal functionality
    const urlButtons = document.querySelectorAll('.url-form-btn');
    if (urlButtons) {
        urlButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                const formCube = this.closest('.form-cube');
                const formId = formCube.dataset.formId;
                const formTitleEl = formCube.querySelector('h3');
                const formTitle = formTitleEl ? formTitleEl.textContent : 'Form ' + formId;
                
                // Show the modal
                const modal = document.getElementById('form-link-modal');
                if (modal) {
                    modal.style.display = 'flex';
                    // Generate and display the URL
                    const urlDisplay = document.getElementById('formUrlDisplay');
                    if (urlDisplay) {
                        const cleanTitle = formTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
                        urlDisplay.textContent = `https://monumevip.com/form/${formId}/${cleanTitle}`;
                    }
                }
            });
        });
    }

    // View responses button
    const responseButtons = document.querySelectorAll('.view-responses-btn');
    if (responseButtons) {
        responseButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                const formCube = this.closest('.form-cube');
                const formId = formCube.dataset.formId;
                // Use a simpler URL structure for form responses 
                window.location.href = `view_responses.html?form=${formId}`;
            });
        });
    }
    
    // Delete form button
    const deleteButtons = document.querySelectorAll('.delete-form-btn');
    if (deleteButtons) {
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                const formCube = this.closest('.form-cube');
                const formId = formCube.dataset.formId;
                const formTitle = formCube.querySelector('h3')?.textContent || 'this form';
                
                if (confirm(`Are you sure you want to delete "${formTitle}"? This action cannot be undone.`)) {
                    deleteForm(formId);
                }
            });
        });
    }
}

// Delete a form
function deleteForm(formId) {
    showNotification('Deleting form...', 'info');
    
    fetch(`/api/forms/${formId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Form deleted:', data);
        showNotification('Form deleted successfully!', 'success');
        
        // Reload forms after deletion
        loadForms();
    })
    .catch(error => {
        console.error('Error deleting form:', error);
        showNotification('Error deleting form: ' + error.message, 'error');
    });
}

// Show a notification toast
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.padding = '12px 20px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : 
                                       type === 'error' ? '#F44336' :
                                       type === 'warning' ? '#FF9800' : '#2196F3';
    notification.style.color = 'white';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.minWidth = '250px';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';
    
    // Add icon based on notification type
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-times-circle' :
                    type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';
    icon.style.marginRight = '10px';
    
    notification.appendChild(icon);
    notification.appendChild(document.createTextNode(message));
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode === notificationContainer) {
                notificationContainer.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Show the URL modal with the form link
function showLinkModal(url) {
    const modal = document.getElementById('form-link-modal');
    const urlDisplay = document.getElementById('formUrlDisplay');
    
    if (modal && urlDisplay) {
        urlDisplay.textContent = url;
        modal.style.display = 'flex';
    } else {
        // Fallback if modal elements aren't found
        alert('Form URL: ' + url);
    }
}