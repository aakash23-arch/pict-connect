# Firebase Email Link Authentication Setup Guide

## Issue
The login page shows "Failed to send login link" error when attempting to send authentication emails.

## Root Cause
Firebase Email Link authentication requires specific configuration in the Firebase Console:

1. **Email/Password Sign-in must be enabled**
2. **Email Link (passwordless sign-in) must be enabled**
3. **Authorized domains must include your domain**

## Fix Steps

### Step 1: Enable Google Sign-In (REQUIRED)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pict-connect-a00c6**
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Google** provider
5. Click **Enable**
6. Select a support email from the dropdown
7. Click **Save**

### Step 2: Enable Email Link Authentication (Optional)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pict-connect-a00c6**
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Email/Password** provider
5. Click **Edit** (pencil icon)
6. Ensure both options are enabled:
   - ✅ **Email/Password** - Enabled
   - ✅ **Email link (passwordless sign-in)** - Enabled
7. Click **Save**

### Step 2: Add Authorized Domains

1. In the same **Authentication** section
2. Go to **Settings** tab → **Authorized domains**
3. Ensure these domains are listed:
   - `localhost` (for local development)
   - `pict-connect-a00c6.firebaseapp.com` (your Firebase hosting domain)
   - Any custom domain you're using

4. If `localhost` is missing, click **Add domain** and add it

### Step 3: Verify Configuration

After making these changes:

1. Refresh your application at http://localhost:3000/login
2. Try logging in with a test email like `test@ms.pict.edu`
3. Check the browser console (F12) for detailed error messages
4. The updated error handling will now show specific error codes

## Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/unauthorized-continue-uri` | The domain is not authorized | Add domain to Authorized domains list |
| `auth/invalid-continue-uri` | The redirect URL format is invalid | Check actionCodeSettings configuration |
| `auth/invalid-email` | Email format is invalid | Ensure email ends with @ms.pict.edu |
| `auth/operation-not-allowed` | Email link sign-in is disabled | Enable Email link in Sign-in methods |

## Testing

Once configured, test with these steps:

1. Navigate to http://localhost:3000/login
2. Enter: `yourname@ms.pict.edu`
3. Click "Send login link"
4. Expected: Alert showing "Login link sent! Please check your PICT email."
5. Check the email inbox for the login link
6. Click the link to complete authentication

## Current Configuration

**Firebase Project:** pict-connect-a00c6  
**Auth Domain:** pict-connect-a00c6.firebaseapp.com  
**Redirect URL:** `${window.location.origin}/login/verify`

## Next Steps

1. Complete the Firebase Console configuration above
2. Test the login flow
3. If errors persist, check the browser console for the specific error code
4. The enhanced error messages will guide you to the exact issue
