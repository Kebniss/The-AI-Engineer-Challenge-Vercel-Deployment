# Merge Instructions

This document provides instructions for merging the current feature branch back to main.

## Current Feature: Add Welcome Message to Input Placeholder

### What was changed:
- Updated the textarea placeholder in `frontend/src/app/page.tsx` to include a welcome message
- The placeholder now reads: "Welcome to Advocate! I am here to help with questions about building code and home maintenance. Ask me anything..."

### Files modified:
- `frontend/src/app/page.tsx` - Updated placeholder text

## Option 1: GitHub Pull Request (Recommended)

1. **Push the feature branch to GitHub:**
   ```bash
   git push origin feature/add-welcome-message
   ```

2. **Create a Pull Request:**
   - Go to your GitHub repository
   - Click "Compare & pull request" for the `feature/add-welcome-message` branch
   - Add a descriptive title: "Add welcome message to input placeholder"
   - Add description: "Updates the input placeholder to include a welcome message explaining the app's purpose for building code and home maintenance questions."
   - Review the changes
   - Click "Create pull request"

3. **Merge the Pull Request:**
   - Review any CI/CD checks
   - Click "Merge pull request"
   - Delete the feature branch when prompted

4. **Update your local main branch:**
   ```bash
   git checkout main
   git pull origin main
   ```

## Option 2: GitHub CLI

1. **Push the feature branch:**
   ```bash
   git push origin feature/add-welcome-message
   ```

2. **Create and merge the PR using GitHub CLI:**
   ```bash
   # Create the pull request
   gh pr create --title "Add welcome message to input placeholder" --body "Updates the input placeholder to include a welcome message explaining the app's purpose for building code and home maintenance questions."
   
   # Merge the pull request
   gh pr merge --auto
   
   # Delete the feature branch
   gh pr delete --yes
   ```

3. **Update your local main branch:**
   ```bash
   git checkout main
   git pull origin main
   ```

## Option 3: Direct Merge (Not Recommended for Team Projects)

If you want to merge directly without a pull request:

```bash
# Switch to main branch
git checkout main

# Merge the feature branch
git merge feature/add-welcome-message

# Push to remote
git push origin main

# Delete the feature branch
git branch -d feature/add-welcome-message
git push origin --delete feature/add-welcome-message
```

## Verification

After merging, verify the changes by:
1. Running the frontend locally
2. Checking that the input field shows the new welcome message
3. Testing that the app functionality still works correctly

## Next Steps

After merging, you can:
1. Delete the feature branch locally: `git branch -d feature/add-welcome-message`
2. Start working on the next feature
3. Consider additional improvements like:
   - Adding more detailed instructions in the sidebar
   - Creating a help modal with usage examples
   - Adding tooltips for better user guidance 