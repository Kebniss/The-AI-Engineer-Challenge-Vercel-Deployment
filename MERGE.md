# Merge Instructions

This document provides instructions for merging the Vercel deployment fixes back to the main branch.

## Changes Made

This feature branch includes the following fixes for Vercel deployment issues:

1. **Updated `api/requirements.txt`** - Added missing dependencies:
   - `python-dotenv==1.0.0` (for environment variable loading)
   - `docx2txt==0.8` (for document processing)
   - `html2text==2020.1.16` (for HTML processing)
   - Fixed versions for `numpy==1.24.3` and `nltk==3.8.1`

2. **Updated `pyproject.toml`** - Fixed Python version compatibility:
   - Changed from `>=3.13` to `>=3.9,<3.12` for Vercel compatibility

3. **Enhanced `aimakerspace/text_utils.py`** - Improved NLTK error handling:
   - Added fallback stopwords when NLTK download fails in serverless environment
   - Better error handling for NLTK data downloads

4. **Enhanced `api/app.py`** - Added comprehensive logging:
   - Added detailed logging to PDF upload endpoint for debugging
   - Better error handling with full traceback information

5. **Created `api/runtime.txt`** - Specified Python version:
   - Set Python version to 3.11 for Vercel deployment

## Merge Options

### Option 1: GitHub Pull Request (Recommended)

1. **Push the feature branch to GitHub:**
   ```bash
   git push origin feature/pdf-rag-chat
   ```

2. **Create a Pull Request:**
   - Go to your GitHub repository
   - Click "Compare & pull request" for the `feature/pdf-rag-chat` branch
   - Add a descriptive title: "Fix Vercel deployment issues and add missing dependencies"
   - Add description of the changes made
   - Review the changes and create the PR

3. **Merge the Pull Request:**
   - Once approved, click "Merge pull request"
   - Delete the feature branch after merging

### Option 2: GitHub CLI

1. **Push the feature branch:**
   ```bash
   git push origin feature/pdf-rag-chat
   ```

2. **Create and merge PR using GitHub CLI:**
   ```bash
   # Create the pull request
   gh pr create --title "Fix Vercel deployment issues and add missing dependencies" \
                --body "This PR fixes Vercel deployment issues by adding missing dependencies, improving error handling, and fixing Python version compatibility."
   
   # Merge the pull request (replace PR_NUMBER with the actual PR number)
   gh pr merge PR_NUMBER --merge
   
   # Delete the feature branch
   git checkout main
   git pull origin main
   git branch -d feature/pdf-rag-chat
   git push origin --delete feature/pdf-rag-chat
   ```

## Testing After Merge

After merging, test the deployment:

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Test PDF upload functionality:**
   - Upload a PDF file
   - Verify the upload completes successfully
   - Test the chat functionality with the uploaded PDF

3. **Check logs for any remaining issues:**
   - Monitor Vercel function logs for any errors
   - Verify all dependencies are properly installed

## Rollback Plan

If issues persist after deployment:

1. **Revert the merge:**
   ```bash
   git revert -m 1 <merge-commit-hash>
   ```

2. **Investigate further:**
   - Check Vercel function logs for specific error messages
   - Verify Python version compatibility
   - Test with different dependency versions if needed 