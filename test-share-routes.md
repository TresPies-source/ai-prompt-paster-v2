# Testing Share API Routes

## Test Share Creation (POST /api/drive/prompts/[id]/share)

### Prerequisites
- User must be authenticated
- Prompt must exist with given ID

### Test 1: Create a basic share
```bash
# Replace [PROMPT_ID] with an actual prompt ID
curl -X POST http://localhost:3000/api/drive/prompts/[PROMPT_ID]/share \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "some-long-random-token",
  "url": "http://localhost:3000/share/some-long-random-token"
}
```

### Test 2: Create a share with expiration
```bash
curl -X POST http://localhost:3000/api/drive/prompts/[PROMPT_ID]/share \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "some-long-random-token",
  "url": "http://localhost:3000/share/some-long-random-token",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

### Test 3: Request share for same prompt again (should return existing share)
```bash
# Same request as Test 1
curl -X POST http://localhost:3000/api/drive/prompts/[PROMPT_ID]/share \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{}'
```

**Expected Response:**
- Should return the same token as the first request

### Test 4: Invalid prompt ID
```bash
curl -X POST http://localhost:3000/api/drive/prompts/invalid-id-123/share \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{}'
```

**Expected Response:**
```json
{
  "error": "Prompt not found",
  "details": "Prompt with ID invalid-id-123 not found"
}
```
**Status Code:** 404

### Test 5: Unauthenticated request
```bash
curl -X POST http://localhost:3000/api/drive/prompts/[PROMPT_ID]/share \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "error": "Unauthorized"
}
```
**Status Code:** 401

---

## Test Share Retrieval (GET /api/public/share/[token])

### Test 6: Retrieve valid share
```bash
# Replace [TOKEN] with actual token from Test 1
curl http://localhost:3000/api/public/share/[TOKEN]
```

**Expected Response:**
```json
{
  "prompt": {
    "id": "prompt-id",
    "title": "Prompt Title",
    "content": "Prompt content...",
    "tags": ["tag1", "tag2"],
    "createdAt": "2024-01-01T00:00:00Z",
    "modifiedAt": "2024-01-01T00:00:00Z"
  },
  "sharedAt": "2024-01-01T00:00:00Z"
}
```

**Note:** Response should NOT include sensitive fields like `folderPath`, `viewCount`, ratings, etc.

### Test 7: Invalid token
```bash
curl http://localhost:3000/api/public/share/invalid-token-12345
```

**Expected Response:**
```json
{
  "error": "Share not found",
  "details": "The shared prompt does not exist or has expired"
}
```
**Status Code:** 404

### Test 8: Expired share
- Create a share with past expiration date
- Try to retrieve it

**Expected Response:**
```json
{
  "error": "Share not found",
  "details": "The shared prompt does not exist or has expired"
}
```
**Status Code:** 404

---

## Integration Test Using Test Endpoint

The test-shares endpoint provides an easy way to test the full flow:

```bash
curl http://localhost:3000/api/drive/test-shares?action=test-all \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

This will:
1. Create a test prompt
2. Create a share for it
3. Verify the share can be retrieved by token
4. Test invalid tokens
5. Test expiration logic
6. Clean up all test data

---

## Verification Checklist

- [ ] POST /api/drive/prompts/[id]/share generates share link
- [ ] GET /api/public/share/[token] retrieves prompt (with or without auth depending on config)
- [ ] Invalid tokens return 404
- [ ] Shared prompt doesn't expose sensitive data (folderPath, viewCount, ratings, etc.)
- [ ] Expired shares cannot be retrieved
- [ ] Creating share for same prompt returns existing share
- [ ] Unauthorized requests to create share return 401
- [ ] Share works in incognito window (if service account is configured)

---

## Notes

### Public Access Configuration

The public share endpoint supports two modes:

1. **With Service Account (Recommended for Production)**
   - Configure `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` in `.env`
   - Shares will be accessible without authentication
   - True public sharing

2. **Without Service Account (Fallback)**
   - Public endpoint will require user to be authenticated
   - Less ideal but functional for development/testing
   - User must have access to the same Google Drive

### Security Notes

- Share tokens are cryptographically random (32 bytes, base64url encoded)
- Sensitive prompt metadata is filtered out in public responses
- Expired shares are automatically filtered during retrieval
- Share creation checks prompt ownership through authentication
