# AI Prompt Paster - Deployment Guide

This guide covers deploying AI Prompt Paster to Vercel (recommended) or other hosting platforms.

## Prerequisites

Before deploying, ensure you have:

1. **Google Cloud Project** with OAuth 2.0 credentials configured
2. **Google Drive API** enabled
3. **OAuth 2.0 Client ID and Secret** from Google Cloud Console
4. **Vercel Account** (for Vercel deployment)

## Environment Variables

The following environment variables must be configured in your deployment platform:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-random-secret-string-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Generating NEXTAUTH_SECRET

Run the following command to generate a secure secret:

```bash
openssl rand -base64 32
```

## Deploying to Vercel

### Step 1: Prepare Your Repository

1. Ensure your code is committed to a Git repository (GitHub, GitLab, or Bitbucket)
2. Push your latest changes:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js configuration

### Step 3: Configure Environment Variables

In the Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add each environment variable listed above
3. Set them for **Production**, **Preview**, and **Development** environments

### Step 4: Update Google OAuth Redirect URIs

In your Google Cloud Console:

1. Go to **APIs & Services** → **Credentials**
2. Select your OAuth 2.0 Client ID
3. Add the following to **Authorized redirect URIs**:
   - `https://your-vercel-domain.vercel.app/api/auth/callback/google`
   - `https://your-custom-domain.com/api/auth/callback/google` (if using custom domain)

### Step 5: Deploy

1. Click **Deploy** in Vercel
2. Wait for the build to complete (typically 2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Post-Deployment Verification

After deployment, test the following:

### 1. Authentication Flow
- [ ] Navigate to your deployed URL
- [ ] Click "Sign in with Google"
- [ ] Complete OAuth flow
- [ ] Verify successful login and session persistence

### 2. Google Drive Integration
- [ ] Paste a prompt and save it
- [ ] Verify the prompt appears in your Google Drive under `/AI Prompt Paster/`
- [ ] Check that the prompt appears in the Library

### 3. AI Features
- [ ] Verify WebLLM model loads (check browser console)
- [ ] Test AI-generated title, tags, and folder suggestions
- [ ] Test semantic search functionality

### 4. Performance
- [ ] Run Lighthouse audit (target: >90 performance)
- [ ] Verify no console errors in production

## Custom Domain Setup (Optional)

### On Vercel:

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable to your custom domain
5. Update Google OAuth redirect URIs with your custom domain

## Troubleshooting

### Issue: OAuth Callback Error

**Cause**: Redirect URI mismatch

**Solution**:
1. Verify `NEXTAUTH_URL` matches your deployed domain exactly
2. Ensure Google OAuth redirect URIs include the correct callback URL
3. Redeploy after updating environment variables

### Issue: Google Drive API Errors

**Cause**: Missing or incorrect scopes

**Solution**:
1. Verify Google Drive API is enabled in Google Cloud Console
2. Check that OAuth scopes include:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.appdata`

### Issue: WebLLM Model Fails to Load

**Cause**: Browser incompatibility or insufficient resources

**Solution**:
1. Ensure using Chrome 113+ or Edge 113+
2. Verify WebGPU/WebAssembly support in browser
3. Check browser console for specific error messages

### Issue: Build Failures

**Cause**: Missing dependencies or TypeScript errors

**Solution**:
1. Run `npm run build` locally to identify issues
2. Ensure all dependencies are listed in `package.json`
3. Fix any TypeScript errors reported during build

## Monitoring and Maintenance

### Analytics (Optional)

Consider adding:
- **Vercel Analytics**: Built-in, enable in project settings
- **Google Analytics**: For detailed user tracking
- **Sentry**: For error tracking and monitoring

### Regular Maintenance

1. **Monitor Usage**: Check Google Drive API quotas in Google Cloud Console
2. **Update Dependencies**: Regularly run `npm update` and test
3. **Security**: Monitor `npm audit` for vulnerabilities
4. **Backups**: User data is stored in their Google Drive (no server-side backups needed)

## Alternative Deployment Options

### Netlify

1. Similar to Vercel setup
2. Use Netlify CLI or web UI
3. Configure environment variables in Netlify dashboard
4. Update build command: `npm run build`
5. Publish directory: `.next`

### Docker (Self-Hosted)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ai-prompt-paster .
docker run -p 3000:3000 --env-file .env.production ai-prompt-paster
```

## Performance Optimization Checklist

- [x] Code splitting implemented (Composer component lazy-loaded)
- [x] Image optimization (using Next.js Image component where applicable)
- [x] Web Worker for AI processing (prevents UI blocking)
- [x] IndexedDB for client-side caching (embeddings)
- [x] Production build minification (Next.js default)
- [x] Error boundaries for graceful error handling

## Security Checklist

- [x] Environment variables not committed to Git
- [x] OAuth state parameter validation (NextAuth.js handles this)
- [x] CORS properly configured (Next.js API routes)
- [x] Input validation on API endpoints
- [x] Secure session handling (NextAuth.js)
- [ ] Rate limiting (consider adding for production)
- [ ] CSP headers (consider adding for enhanced security)

## Support and Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Vercel Documentation**: https://vercel.com/docs
- **NextAuth.js Documentation**: https://next-auth.js.org
- **Google Drive API**: https://developers.google.com/drive
- **WebLLM Documentation**: https://mlc.ai/web-llm

---

**Last Updated**: 2026-01-30
**Version**: 1.0.0
