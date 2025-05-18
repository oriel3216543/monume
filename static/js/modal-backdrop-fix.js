/**
 * Modal Backdrop Fix
 * 
 * This script prevents the black screen/modal backdrop issue by actively removing
 * any modal-backdrop elements that appear in the DOM and overriding Bootstrap's modal functions.
 */

// Execute immediately when loaded
(function() {
    console.log('Modal backdrop fix loading...');
    
    // Function to remove all modal backdrops
    function removeAllModalBackdrops() {
        console.log('Removing ALL modal backdrops');
        
        // Method 1: Remove by standard class
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            console.log('Removing standard modal backdrop');
            if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        });
        
        // Method 2: Remove by fade show class
        document.querySelectorAll('.modal-backdrop.fade.show').forEach(backdrop => {
            console.log('Removing fade show modal backdrop');
            if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        });
        
        // Method 3: Find any element that might be a backdrop by style
        document.querySelectorAll('div[style*="background"]').forEach(element => {
            if (!element.id && !element.classList.contains('modal') && 
                (element.style.position === 'fixed' || 
                 window.getComputedStyle(element).position === 'fixed') && 
                element.style.zIndex >= 1000) {
                console.log('Removing backdrop-like element');
                if (element.parentNode) element.parentNode.removeChild(element);
            }
        });
        
        // Make body scrollable again
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
    }
    
    // Set up override for Bootstrap modal functions if Bootstrap is loaded
    function setupBootstrapOverrides() {
        // Wait for Bootstrap to be loaded
        if (window.jQuery && typeof window.jQuery.fn.modal === 'function') {
            console.log('Overriding Bootstrap modal functions');
            
            // Store original modal function
            const originalModal = window.jQuery.fn.modal;
            
            // Override modal function
            window.jQuery.fn.modal = function(action) {
                const result = originalModal.apply(this, arguments);
                
                if (action === 'hide' || action === 'dispose' || action === 'toggle') {
                    // Remove backdrops when modal is hidden
                    setTimeout(removeAllModalBackdrops, 100);
                    setTimeout(removeAllModalBackdrops, 500);
                }
                
                return result;
            };
            
            // Also hook into the modal hidden event
            window.jQuery(document).on('hidden.bs.modal', function() {
                setTimeout(removeAllModalBackdrops, 0);
            });
        } else {
            // Try again later if Bootstrap is not loaded yet
            setTimeout(setupBootstrapOverrides, 500);
        }
    }
    
    // Set up MutationObserver to detect and remove modal backdrops as they appear
    function setupBackdropObserver() {
        // Create observer instance
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    // Check if any added nodes are modal backdrops
                    const hasBackdrop = Array.from(mutation.addedNodes).some(node => {
                        return node.nodeType === 1 && (
                            node.classList?.contains('modal-backdrop') ||
                            (node.nodeName === 'DIV' && 
                             node.style && 
                             node.style.position === 'fixed' &&
                             !node.id && 
                             node.style.zIndex >= 1000)
                        );
                    });
                    
                    if (hasBackdrop) {
                        console.log('Modal backdrop detected in DOM, removing');
                        setTimeout(removeAllModalBackdrops, 0);
                    }
                }
            });
        });
        
        // Start observing document body
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        console.log('Modal backdrop observer set up');
    }
    
    // Setup click handlers for all close buttons
    function setupCloseButtonHandlers() {
        // Check periodically for new close buttons
        function addHandlersToCloseButtons() {
            const closeButtons = document.querySelectorAll('.close, [data-dismiss="modal"], .btn-close');
            
            closeButtons.forEach(button => {
                // Skip if already processed
                if (button.getAttribute('data-backdrop-fix')) return;
                
                // Mark as processed
                button.setAttribute('data-backdrop-fix', 'true');
                
                // Add click handler
                button.addEventListener('click', function() {
                    console.log('Close button clicked, removing backdrops');
                    removeAllModalBackdrops();
                });
            });
        }
        
        // Initial setup
        addHandlersToCloseButtons();
        
        // Set interval to check for new buttons
        setInterval(addHandlersToCloseButtons, 2000);
    }
    
    // Add a global function to check and remove backdrops
    window.checkAndRemoveBackdrops = function() {
        console.log('Manual backdrop check triggered');
        removeAllModalBackdrops();
    };
    
    // Perform an initial clean-up
    setTimeout(removeAllModalBackdrops, 0);
    
    // Set up all our fixes
    setupBootstrapOverrides();
    setupBackdropObserver();
    setupCloseButtonHandlers();
    
    // Also run cleanup periodically
    setInterval(removeAllModalBackdrops, 10000); // Check every 10 seconds
    
    console.log('Modal backdrop fix loaded');
    
    // Add a key handler to remove backdrops with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            console.log('Escape key pressed, removing backdrops');
            removeAllModalBackdrops();
        }
    });
})();
