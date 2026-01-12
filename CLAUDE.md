# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Cloudflare Worker that provides geolocation lookup endpoints using Cloudflare's built-in location headers. Deployed to `loclook.iwpi.com`.

## Commands

```bash
npm run dev                # Start local development server (port 8787)
npm run deploy:staging     # Deploy to staging (cf-location-lookup-staging)
npm run deploy:production  # Deploy to production (cf-location-lookup)
npx wrangler login         # Authenticate with Cloudflare
```

## Architecture

Single-file worker (`src/index.js`) with these endpoints:
- `GET /` or `GET /location` - Returns location from Cloudflare headers only
- `GET /location-enhanced` - Returns location with fallback to ipapi.co when CF data is limited
- `GET /health` - Health check

Key functions:
- `extractLocationData()` - Extracts location from CF headers (CF-IPCountry, CF-Region, CF-IPCity, etc.)
- `calculateDataQuality()` - Scores data completeness (minimal/limited/fair/good/excellent)
- `handleEnhancedLocationRequest()` - Falls back to ipapi.co when quality is minimal/limited

## Development Notes

- Location headers are only available when deployed to Cloudflare (not in local dev)
- IPv6 addresses typically return less detailed location data
- The enhanced endpoint uses ipapi.co free tier (1000 requests/day limit)
- CORS is enabled for all origins

## Git Workflow

See `GIT_WORKFLOW.md` for full details. Key points:

- **Branch**: `main` is production-ready; use `feature/`, `fix/`, `hotfix/` branches
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) format (e.g., `feat:`, `fix:`, `chore:`). Omit AI-generated boilerplate from commit messages.
- **Deploy**: Test locally → deploy to staging → deploy to production

```bash
npm run deploy:staging     # Deploy to staging first
npm run deploy:production  # Then production
npx wrangler tail          # View live logs
```
