# Production Deployment Checklist

Use this checklist before deploying AI Prompt Paster to production.

## Pre-Deployment

### Code Quality
- [x] All tests pass (if applicable)
- [x] Production build succeeds: `npm run build`
- [x] No ESLint errors: `npm run lint`
- [x] TypeScript compilation passes with no errors
- [x] Code reviewed and approved

### Environment Configuration
- [ ] `.env.local` is NOT committed to Git
- [ ] `.env.example` is up to date with all required variables
- [ ] Production environment variables configured in hosting platform
- [ ] `NEXTAUTH_SECRET` is generated with secure random string (min 32 chars)
- [ ] `NEXTAUTH_URL` points to production domain
- [ ] Google OAuth credentials are production-ready

### Google Cloud Setup
- [ ] Google Cloud Project created
- [ ] Google Drive API enabled
- [ ] OAuth 2.0 credentials created
- [ ] OAuth consent screen configured
- [ ] Production redirect URIs added:
  - `https://your-domain.com/api/auth/callback/google`
- [ ] Scopes verified:
  - `https://www.googleapis.com/auth/drive.file`
  - `https://www.googleapis.com/auth/drive.appdata`
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`

### Dependencies
- [x] All dependencies installed: `npm install`
- [x] No critical security vulnerabilities: `npm audit`
- [ ] Dependencies up to date (optional): `npm update`

## Deployment

### Vercel Deployment
- [ ] Project connected to Git repository
- [ ] Environment variables configured in Vercel dashboard
- [ ] Build settings verified (Next.js auto-detected)
- [ ] Custom domain configured (if applicable)
- [ ] DNS settings updated for custom domain
- [ ] SSL certificate provisioned automatically by Vercel

### Build Verification
- [ ] Production build completes successfully
- [ ] No build warnings that need addressing
- [ ] Bundle sizes are reasonable:
  - Main page: < 100 KB
  - Library page: < 150 KB
  - Shared JS: < 100 KB

## Post-Deployment Testing

### Authentication
- [ ] Can access landing page
- [ ] "Sign in with Google" button appears
- [ ] OAuth flow completes successfully
- [ ] User session persists across page refreshes
- [ ] Logout works correctly
- [ ] Session expires appropriately

### Core Functionality
- [ ] Paster page loads without errors
- [ ] Can paste content into textarea
- [ ] AI model loads successfully (check browser console)
- [ ] AI generates title, tags, and folder suggestions
- [ ] Can edit AI suggestions before saving
- [ ] Prompt saves to Google Drive successfully
- [ ] Saved prompt appears in Library
- [ ] Can view prompt details in modal
- [ ] Can delete prompt with confirmation
- [ ] Copy-to-clipboard works

### Library Features
- [ ] Prompts load and display correctly
- [ ] Folder tree shows correct structure
- [ ] Can create new folders
- [ ] Folder navigation filters prompts
- [ ] Tag filter works (single tag)
- [ ] Tag filter works (multiple tags)
- [ ] AND/OR toggle works for tag filtering
- [ ] Prompt count displays correctly

### Search Functionality
- [ ] Search bar accepts input
- [ ] Semantic search returns relevant results
- [ ] Search results display with relevance scores
- [ ] Can click search results to view details
- [ ] Clear search works
- [ ] Search with no results shows appropriate message

### Composer
- [ ] Composer modal opens
- [ ] Can type/edit content in editor
- [ ] Real-time suggestions appear
- [ ] Can insert suggested prompts
- [ ] Variable syntax highlighting works ({{variable}})
- [ ] Can save composed prompt
- [ ] Saved composed prompt appears in library

### Performance
- [ ] Initial page load < 3 seconds
- [ ] Navigation between pages is smooth
- [ ] AI model loads within reasonable time (30-60s)
- [ ] Subsequent AI operations are fast (cached model)
- [ ] No console errors in production
- [ ] No console warnings that need addressing

### Browser Compatibility
- [ ] Chrome 113+ works correctly
- [ ] Edge 113+ works correctly
- [ ] Safari 18+ works correctly (if available)
- [ ] Mobile Chrome works correctly
- [ ] Mobile Safari works correctly

### Responsive Design
- [ ] Desktop (1920x1080) displays correctly
- [ ] Laptop (1366x768) displays correctly
- [ ] Tablet (768x1024) displays correctly
- [ ] Mobile (375x667) displays correctly
- [ ] All components are touch-friendly on mobile

### Accessibility
- [ ] Keyboard navigation works throughout app
- [ ] All interactive elements are focusable
- [ ] Focus indicators are visible
- [ ] Screen reader labels present (ARIA)
- [ ] Color contrast meets WCAG AA standards
- [ ] No keyboard traps

### Security
- [ ] No sensitive data in client-side code
- [ ] No API keys or secrets exposed
- [ ] OAuth state validation working
- [ ] CSRF protection enabled (NextAuth.js)
- [ ] Secure cookies (httpOnly, secure)
- [ ] No mixed content warnings (HTTP/HTTPS)

### Error Handling
- [ ] Error boundary catches and displays errors gracefully
- [ ] API errors show user-friendly messages
- [ ] Network errors are handled appropriately
- [ ] Invalid input shows validation messages
- [ ] 404 page works correctly
- [ ] 500 error page displays (if applicable)

## Monitoring Setup (Optional but Recommended)

### Analytics
- [ ] Vercel Analytics enabled
- [ ] Google Analytics configured (optional)
- [ ] Custom events tracked (optional)

### Error Tracking
- [ ] Sentry or similar error tracking configured (optional)
- [ ] Source maps uploaded for error debugging
- [ ] Alert notifications configured

### Performance Monitoring
- [ ] Web Vitals tracking enabled
- [ ] Lighthouse CI configured (optional)
- [ ] Performance budgets set (optional)

## Lighthouse Audit

Run Lighthouse audit on production deployment:

```bash
# Using Chrome DevTools
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Select "Desktop" or "Mobile"
# 4. Click "Analyze page load"
```

Target Scores:
- [ ] Performance: > 90
- [ ] Accessibility: > 90
- [ ] Best Practices: > 90
- [ ] SEO: > 90

Common Issues to Fix:
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Images optimized and lazy-loaded
- [ ] Fonts optimized and preloaded

## Documentation

- [x] README.md is up to date
- [x] DEPLOYMENT.md is complete and accurate
- [ ] API documentation is complete (if applicable)
- [ ] User guide is available (optional)
- [ ] Developer onboarding guide (optional)

## Backup and Recovery

- [ ] Database backup strategy (N/A - data in user's Drive)
- [ ] Environment variable backups stored securely
- [ ] Deployment rollback plan documented
- [ ] Disaster recovery plan documented (optional)

## Legal and Compliance

- [ ] Privacy policy published (if collecting analytics)
- [ ] Terms of service published (if required)
- [ ] Cookie consent banner (if required in your region)
- [ ] GDPR compliance verified (if applicable)
- [ ] Data retention policy defined

## Communication

- [ ] Stakeholders notified of deployment
- [ ] Support team briefed on new features
- [ ] Users notified of any breaking changes
- [ ] Changelog updated

## Final Verification

- [ ] All items in this checklist completed
- [ ] Manual smoke test passed
- [ ] Production monitoring active
- [ ] On-call rotation scheduled (if applicable)
- [ ] Rollback plan ready if needed

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: 1.0.0
**Notes**: 

_______________________________________________
_______________________________________________
_______________________________________________
