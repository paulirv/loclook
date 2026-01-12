# Claude Code Recommendations for loclook

## Project Summary

**loclook** is a Cloudflare Worker providing geolocation lookup endpoints using Cloudflare's built-in location headers. It's deployed to `loclook.iwpi.com` and includes:
- Core worker (`src/index.js`) - 275 lines
- Test HTML page (`test.html`)
- Client library example (`examples/client.js`)
- Staging and production environments

---

## Recommended Agents

### 1. cloudflare-expert (High Priority)
**When to use:** Any Cloudflare Worker development, deployment issues, configuration changes, or debugging

**Relevant tasks:**
- Deploying to staging/production environments
- Troubleshooting Wrangler configuration
- Adding new Cloudflare features (KV storage, D1, Workers AI)
- Configuring custom domains and routes
- Optimizing Worker performance
- Understanding Cloudflare headers behavior

**Example prompts:**
- "Why aren't CF headers available in local dev?"
- "How do I add rate limiting to this worker?"
- "Set up KV storage for caching location data"

---

### 2. api-designing (Medium Priority)
**When to use:** Extending endpoints, adding new routes, or standardizing responses

**Relevant tasks:**
- Adding new endpoints (e.g., batch lookup, IP validation)
- Designing consistent error response formats
- Planning API versioning strategy
- Creating OpenAPI/Swagger documentation

**Example prompts:**
- "Design an endpoint for batch IP lookups"
- "Standardize error responses across all endpoints"

---

### 3. unit-test-generator (Medium Priority)
**When to use:** Adding test coverage for the worker

**Relevant tasks:**
- Creating unit tests for location extraction functions
- Testing CORS handling
- Mocking Cloudflare headers for local testing
- Integration tests with Miniflare

**Example prompts:**
- "Create tests for calculateDataQuality function"
- "Set up Vitest for Cloudflare Workers testing"

---

### 4. code-debugger (As Needed)
**When to use:** Troubleshooting unexpected behavior in production

**Relevant tasks:**
- Debugging why enhanced endpoint returns incomplete data
- Investigating ipapi.co fallback failures
- Tracing request flow through the worker

---

### 5. seo-performance-auditor (Low Priority)
**When to use:** Optimizing the test.html page or client library

**Relevant tasks:**
- Analyzing test page performance
- Optimizing client library bundle size

---

## Recommended Skills

### 1. /commit (Frequent Use)
Standard git commit workflow after changes.

### 2. /commit-push-pr
Create PRs when ready to deploy to staging/production.

### 3. /api-designing
When planning new API endpoints or modifying response structures.

### 4. /performance-auditing
Audit Worker performance and edge optimization.

### 5. /explaining-code
For understanding complex parts of the codebase or onboarding.

---

## Recommended Tools

### 1. Playwright (webapp-testing skill)
**Purpose:** Test the worker endpoints and test.html page

**Use cases:**
- Automated testing of `/location`, `/location-enhanced`, `/health` endpoints
- Visual testing of test.html functionality
- Cross-browser testing of the client library

### 2. WebFetch
**Purpose:** Test endpoints directly from Claude

**Use cases:**
- Verify deployed worker responses
- Test CORS headers
- Compare staging vs production responses

### 3. Context7 (mcp__plugin_context7)
**Purpose:** Get up-to-date Cloudflare Workers documentation

**Use cases:**
- Looking up Cloudflare header specifications
- Finding Wrangler CLI options
- Understanding Workers API changes

---

## Potential Plugin Components

If you want to create a custom plugin for this project, consider:

### Custom Skill: `/deploy-loclook`
```yaml
description: Deploy loclook to staging or production
triggers:
  - "deploy loclook"
  - "push to staging"
  - "push to production"
```

### Custom Skill: `/test-loclook`
```yaml
description: Test loclook endpoints against live or local environment
triggers:
  - "test loclook"
  - "check endpoints"
```

### Custom Hook: Pre-deploy Validation
Validate worker syntax and check for common issues before deployment.

---

## Task Workflows

### Adding a New Endpoint
1. Use **api-designing** skill to design the endpoint
2. Implement in `src/index.js`
3. Use **unit-test-generator** to create tests
4. Test locally with `npm run dev`
5. Deploy to staging with `npm run deploy:staging`
6. Use **cloudflare-expert** if issues arise
7. Deploy to production with `npm run deploy:production`

### Debugging Production Issues
1. Use **cloudflare-expert** agent for CF-specific issues
2. Use **code-debugger** agent for logic issues
3. Check Cloudflare dashboard logs
4. Use WebFetch to test endpoints

### Performance Optimization
1. Use **seo-performance-auditor** for analysis
2. Use **cloudflare-expert** for edge-specific optimizations
3. Consider KV caching for frequently accessed data

---

## Environment-Specific Notes

| Environment | Worker Name | Domain |
|-------------|-------------|--------|
| Development | n/a | localhost:8787 |
| Staging | cf-location-lookup-staging | (workers.dev subdomain) |
| Production | cf-location-lookup | loclook.iwpi.com |

---

## Quick Reference Commands

```bash
npm run dev                # Local development
npm run deploy:staging     # Deploy to staging
npm run deploy:production  # Deploy to production
npx wrangler login         # Authenticate
npx wrangler tail          # View live logs
```

---

## Future Enhancements to Consider

1. **KV Caching** - Cache ipapi.co results to reduce API calls
2. **Rate Limiting** - Protect against abuse
3. **API Keys** - Add authentication for production use
4. **Batch Endpoint** - Look up multiple IPs in one request
5. **TypeScript Migration** - Better type safety
6. **Testing Framework** - Add Vitest + Miniflare for testing
