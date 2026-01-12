# Git Workflow Guide

This document outlines the git workflow for the loclook Cloudflare Worker project.

## Remote

| Remote | Purpose |
|--------|---------|
| `origin` | GitHub repository (primary) |

## Branch Strategy

```
main ────●────●────●────●────●────  (production-ready)
              \         /
feature        ●──●──●─┘             (feature/fix-name)
```

### Branch Types

| Branch | Purpose | Naming Convention |
|--------|---------|-------------------|
| `main` | Production-ready code | Direct push allowed for small fixes |
| Feature | New functionality | `feature/description` |
| Fix | Bug fixes | `fix/description` |
| Hotfix | Urgent production fixes | `hotfix/description` |

### Branch Naming Examples

```
feature/batch-lookup-endpoint
feature/kv-caching
fix/cors-headers
fix/ipapi-fallback-timeout
hotfix/rate-limit-bypass
```

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format. Omit AI-generated boilerplate text (e.g. Co-authored by) from all commit messages.

```
<type>: <description>

[optional body]
```

### Commit Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `chore` | Maintenance tasks, dependency updates |
| `docs` | Documentation only changes |
| `style` | Formatting, missing semicolons, etc. |
| `test` | Adding or updating tests |
| `perf` | Performance improvements |

### Commit Message Examples

```bash
# Good
feat: add batch IP lookup endpoint
fix: handle missing CF-IPCity header gracefully
refactor: extract CORS headers to shared function
chore: update wrangler to v3.1.0
perf: cache ipapi.co responses in KV

# Bad
Updated stuff
fix bug
WIP
```

### Commit Guidelines

- Use imperative mood: "add feature" not "added feature"
- Keep the first line under 72 characters
- One logical change per commit

## Workflow Steps

### 1. Starting New Work

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Making Changes

```bash
# Stage changes
git add <files>

# Commit with conventional message
git commit -m "feat: add new endpoint for batch lookups"

# Push to remote (optional, for backup)
git push -u origin feature/your-feature-name
```

### 3. Keeping Branch Updated

```bash
# Rebase on main to keep history clean
git fetch origin
git rebase origin/main

# If conflicts occur, resolve them then:
git rebase --continue
```

### 4. Merging to Main

For smaller changes or when working solo:

```bash
git checkout main
git pull origin main
git merge feature/your-feature-name
git push origin main
```

For larger changes, create a PR on GitHub for review before merging.

### 5. Cleanup

```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch (if pushed)
git push origin --delete feature/your-feature-name
```

## Deployment

### Environments

| Environment | Command | Worker Name |
|-------------|---------|-------------|
| Local Dev | `npm run dev` | n/a (localhost:8787) |
| Staging | `npm run deploy:staging` | cf-location-lookup-staging |
| Production | `npm run deploy:production` | cf-location-lookup |

### Deployment Workflow

```bash
# 1. Test locally
npm run dev
# Visit http://localhost:8787/health

# 2. Deploy to staging
npm run deploy:staging
# Test at staging workers.dev URL

# 3. Deploy to production
npm run deploy:production
# Verify at https://loclook.iwpi.com/health
```

### Pre-Deployment Checklist

- [ ] Code tested locally with `npm run dev`
- [ ] All endpoints respond correctly (`/`, `/location`, `/location-enhanced`, `/health`)
- [ ] CORS headers present in responses
- [ ] No console errors in browser dev tools
- [ ] Staging deployment tested before production

## Cloudflare-Specific Notes

### Local Development Limitations

Location headers (`CF-IPCountry`, `CF-IPCity`, etc.) are **only available when deployed to Cloudflare**. Local development will return null values for these fields.

### Viewing Logs

```bash
# Tail production logs
npx wrangler tail

# Tail staging logs
npx wrangler tail --env staging
```

### Rollback

If a deployment causes issues:

```bash
# View deployment history
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback
```

### Authentication

```bash
# Login to Cloudflare (if needed)
npx wrangler login

# Check current auth status
npx wrangler whoami
```

## Quick Reference

```bash
# Start new feature
git checkout main && git pull && git checkout -b feature/name

# Save work in progress
git add . && git commit -m "wip: description"

# Update branch with main
git fetch origin && git rebase origin/main

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View branch history
git log --oneline -10

# Check what's staged
git diff --staged

# Full deploy workflow
git checkout main && git pull && npm run deploy:staging
# Test staging, then:
npm run deploy:production

# View live logs
npx wrangler tail
```

## Testing Endpoints

### Using curl

```bash
# Health check
curl https://loclook.iwpi.com/health

# Location lookup
curl https://loclook.iwpi.com/location

# Enhanced location (with fallback)
curl https://loclook.iwpi.com/location-enhanced
```

### Using the Test Page

Open `test.html` in a browser and enter the worker URL to test interactively.
