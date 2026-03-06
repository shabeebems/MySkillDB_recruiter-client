# Adding Environment Variables to GitHub Actions CI/CD

This guide explains how to add environment variables (secrets) to GitHub Actions for automated deployments to Firebase Hosting.

## Overview

The CI/CD pipeline uses GitHub Secrets to securely store environment variables that are injected during the build process. Different values are used for staging and production environments based on the branch being deployed.

## Required GitHub Secrets

The following secrets need to be configured in your GitHub repository:

### 1. Firebase Deployment Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `FIREBASE_TOKEN` | Firebase CI token for authentication | `1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

### 2. Application Environment Variables

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `VITE_SERVER_API_URL_STAGING` | Backend API URL for staging environment | `https://api-staging.example.com` |
| `VITE_SERVER_API_URL_PROD` | Backend API URL for production environment | `https://api.example.com` |
| `VITE_GEMINI_API_KEY` | Google Gemini API key (shared across environments) | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `VITE_FIREBASE_API_KEY` | Firebase API key (shared across environments) | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `VITE_PASSWORD_ENCRYPTION_KEY` | Password encryption key (shared across environments) | `YourSecureEncryptionKey123` |

## Step-by-Step Setup Guide

### Step 1: Generate Firebase CI Token

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Generate CI token:
   ```bash
   firebase login:ci
   ```

4. Copy the token that appears in the terminal. It will look like:
   ```
   1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   **Important:** Save this token securely - you won't be able to see it again!

### Step 2: Access GitHub Repository Settings

1. Navigate to your GitHub repository: `https://github.com/MySkillDb/MySkillDb-client`
2. Click on **Settings** (top navigation bar)
3. In the left sidebar, click on **Secrets and variables** → **Actions**

### Step 3: Add Repository Secrets

For each secret listed below, follow these steps:

1. Click **"New repository secret"** button
2. Enter the **Name** exactly as shown (case-sensitive)
3. Paste the **Value**
4. Click **"Add secret"**

#### Add Firebase Token

- **Name:** `FIREBASE_TOKEN`
- **Value:** Paste the token from Step 1
- **Description:** Firebase CI authentication token

#### Add Staging API URL

- **Name:** `VITE_SERVER_API_URL_STAGING`
- **Value:** Your staging backend API URL
  - Example: `https://myskilldb-server-staging-cvnux34dca-el.a.run.app`
  - Example: `https://api-staging.myskilldb.com`
- **Description:** Backend API URL for staging environment

#### Add Production API URL

- **Name:** `VITE_SERVER_API_URL_PROD`
- **Value:** Your production backend API URL
  - Example: `https://myskilldb-server-production-xyz123.el.a.run.app`
  - Example: `https://api.myskilldb.com`
- **Description:** Backend API URL for production environment

#### Add Gemini API Key

- **Name:** `VITE_GEMINI_API_KEY`
- **Value:** Your Google Gemini API key
  - Example: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
  - Get your key from: https://makersuite.google.com/app/apikey
- **Description:** Google Gemini API key for AI features

#### Add Firebase API Key

- **Name:** `VITE_FIREBASE_API_KEY`
- **Value:** Your Firebase API key
  - Example: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
  - Get your key from: Firebase Console → Project Settings → General → Your apps
- **Description:** Firebase API key for Firebase services

#### Add Password Encryption Key

- **Name:** `VITE_PASSWORD_ENCRYPTION_KEY`
- **Value:** Your password encryption key
  - Example: `YourSecureEncryptionKey123`
  - **Important:** Use a strong, unique encryption key
- **Description:** Encryption key for password security

### Step 4: Verify Secrets Are Added

After adding all secrets, you should see them listed in the **Secrets** section:

```
Repository secrets (6)
├── FIREBASE_TOKEN
├── VITE_SERVER_API_URL_STAGING
├── VITE_SERVER_API_URL_PROD
├── VITE_GEMINI_API_KEY
├── VITE_FIREBASE_API_KEY
└── VITE_PASSWORD_ENCRYPTION_KEY
```

**Note:** Secret values are hidden for security. You can only see the names, not the values.

## How It Works

### Environment Variable Selection

The GitHub Actions workflow automatically selects the correct environment variables based on the branch:

- **`staging` branch** → Uses `VITE_SERVER_API_URL_STAGING`
- **`master` branch** → Uses `VITE_SERVER_API_URL_PROD`
- Both environments use the same `VITE_GEMINI_API_KEY`, `VITE_FIREBASE_API_KEY`, and `VITE_PASSWORD_ENCRYPTION_KEY`
- Firebase configuration values (auth domain, project ID, storage bucket, messaging sender ID, app ID) are hardcoded in the workflow file

### Workflow Configuration

The environment variables are injected during the build step in `.github/workflows/deploy-firebase.yml`:

```yaml
- name: Build application
  env:
    VITE_SERVER_API_URL: ${{ github.ref == 'refs/heads/master' && secrets.VITE_SERVER_API_URL_PROD || secrets.VITE_SERVER_API_URL_STAGING }}
    VITE_CLIENT_URL: ${{ github.ref == 'refs/heads/master' && 'https://app.example.com' || 'https://staging-app.example.com' }}
    VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: your-project-id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID: your-project-id
    VITE_FIREBASE_STORAGE_BUCKET: your-project-id.firebasestorage.app
    VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000'
    VITE_FIREBASE_APP_ID: 1:000000000000:web:xxxxxxxxxxxxxxxx
    VITE_PASSWORD_ENCRYPTION_KEY: ${{ secrets.VITE_PASSWORD_ENCRYPTION_KEY }}
  run: npm run build
```

This ensures:
- Variables are available during the build process
- Correct API URL is used based on the deployment branch
- Secrets are never exposed in logs or code

## Testing the Setup

### 1. Trigger a Deployment

Push to the appropriate branch to trigger deployment:

```bash
# For staging deployment
git checkout staging
git push origin staging

# For production deployment
git checkout master
git push origin master
```

### 2. Check GitHub Actions

1. Go to your repository on GitHub
2. Click on **Actions** tab
3. Click on the latest workflow run
4. Expand the **"Build application"** step
5. Verify the build completes successfully

### 3. Verify Environment Variables

Check the build logs to ensure:
- Build completes without errors
- No "undefined" or "missing" variable warnings
- Application builds successfully

**Note:** Secret values are automatically masked in logs for security.

## Updating Secrets

To update an existing secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Find the secret you want to update
3. Click the **pencil icon** (✏️) next to the secret name
4. Update the value
5. Click **"Update secret"**

## Troubleshooting

### Issue: Build fails with "undefined" environment variable

**Solution:**
- Verify the secret name matches exactly (case-sensitive)
- Check that the secret exists in GitHub repository settings
- Ensure the secret is added to the correct repository (not organization-level)

### Issue: Wrong API URL is being used

**Solution:**
- Verify branch names match exactly (`staging` vs `master`)
- Check the workflow file logic in `.github/workflows/deploy-firebase.yml`
- Ensure secrets are named correctly (`VITE_SERVER_API_URL_STAGING` vs `VITE_SERVER_API_URL_PROD`)

### Issue: Firebase deployment fails

**Solution:**
- Verify `FIREBASE_TOKEN` is valid and not expired
- Regenerate token if needed: `firebase login:ci`
- Check Firebase project configuration in `.firebaserc`

### Issue: Secrets not accessible

**Solution:**
- Ensure you have admin/owner access to the repository
- Verify secrets are added at repository level (not organization level if using organization secrets)
- Check GitHub Actions is enabled for the repository

## Security Best Practices

1. **Never commit secrets to code** - Always use GitHub Secrets
2. **Rotate secrets regularly** - Update API keys and tokens periodically
3. **Use different values for staging/production** - Never share production secrets with staging
4. **Limit access** - Only repository admins should have access to secrets
5. **Monitor usage** - Review GitHub Actions logs regularly for unauthorized access
6. **Use fine-grained tokens** - When possible, use tokens with minimal required permissions

## Sample Configuration Checklist

Use this checklist to ensure all secrets are configured:

- [ ] `FIREBASE_TOKEN` - Firebase CI authentication token
- [ ] `VITE_SERVER_API_URL_STAGING` - Staging backend API URL
- [ ] `VITE_SERVER_API_URL_PROD` - Production backend API URL
- [ ] `VITE_GEMINI_API_KEY` - Gemini API key
- [ ] `VITE_FIREBASE_API_KEY` - Firebase API key
- [ ] `VITE_PASSWORD_ENCRYPTION_KEY` - Password encryption key

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase CI Authentication](https://firebase.google.com/docs/cli#ci-cd)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## Quick Reference

### Get Firebase Token
```bash
firebase login:ci
```

### Add Secret via GitHub UI
1. Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter name and value
4. Click "Add secret"

### Test Deployment
```bash
# Staging
git push origin staging

# Production
git push origin master
```

---

**Last Updated:** $(date)
**Maintained By:** Development Team
**Repository:** MySkillDb/MySkillDb-client

