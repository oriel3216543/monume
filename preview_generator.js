/**
 * PDF Preview Generator for MonuMe Tracker
 * Handles preview generation and image fallbacks
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle image loading errors by using fallback images
    const previewImages = document.querySelectorAll('.pdf-preview-image');
    
    previewImages.forEach(img => {
        img.addEventListener('error', function() {
            console.log('Image failed to load, using fallback');
            if (this.dataset.fallback) {
                this.src = this.dataset.fallback;
            }
        });
        
        // Add click-to-zoom functionality
        img.addEventListener('click', function() {
            this.classList.toggle('zoomed');
        });
    });
    
    // Initialize any dynamic preview content
    initializePreviews();
});

/**
 * Initialize preview content from server data if available
 */
function initializePreviews() {
    // Check if we're on the emails page
    if (document.querySelector('.pdf-template-preview')) {
        // Try to fetch the latest template preview
        fetch('/get_pdf_template')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load template');
                return response.json();
            })
            .then(data => {
                if (data.previewUrl) {
                    // Update the preview image if available
                    const previewImg = document.querySelector('.pdf-preview-image');
                    if (previewImg) {
                        previewImg.src = data.previewUrl;
                    }
                }
            })
            .catch(error => {
                console.warn('Could not load dynamic template preview:', error);
                // Fallback is already handled by the error event listener
            });
    }
}

/**
 * Generate a preview from user data
 * @param {Object} userData - User data to include in preview
 * @returns {Promise} - Promise resolving to preview URL
 */
function generatePreview(userData) {
    return new Promise((resolve, reject) => {
        fetch('/generate_preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to generate preview');
            return response.json();
        })
        .then(data => {
            if (data.previewUrl) {
                resolve(data.previewUrl);
            } else {
                reject(new Error('No preview URL returned'));
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}
