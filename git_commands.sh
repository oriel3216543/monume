# Navigate to the repository directory
cd c:\Users\Tech\Downloads\MonuMe_Tracker

# Pull the latest changes from the remote repository
git pull origin main --rebase

# Add all changes to the staging area
git add .

# Commit the changes with a message
git commit -m "Update DOMAIN_DEPLOYMENT_GUIDE.md and CNAME for deployment setup"

# Push the changes to the default branch
git push origin main
