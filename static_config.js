// Configuration file for static deployments (GitHub Pages)
const STATIC_CONFIG = {
    // Set to true for GitHub Pages deployment, false for backend server deployment
    isStaticDeployment: true,
    
    // For GitHub Pages, this should be the repository name, e.g. "/MonuMe_Tracker"
    // For custom domain, leave it as an empty string
    basePath: "",
    
    // API endpoint when using a separate backend server
    apiBaseUrl: "https://www.monumevip.com",
    
    // Demo mode - enables mock data when no backend is available
    demoMode: false
};

// Do not edit below this line
if (typeof module !== 'undefined') {
    module.exports = STATIC_CONFIG;
}