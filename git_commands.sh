# Navigate to the repository directory
cd c:\Users\Tech\Downloads\MonuMe_Tracker

# Add the remote repository (only needed if not already set)
git remote add origin https://github.com/oriel3216543/monume.git

# Add all changes to the staging area
git add .

# Commit the changes with a message
git commit -m "Update DOMAIN_DEPLOYMENT_GUIDE.md and CNAME for deployment setup"

# Push the changes to the default branch (replace 'main' with your branch name if different)
git push origin main
