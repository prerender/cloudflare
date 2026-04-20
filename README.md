# Prerender.io – Cloudflare Worker

A generic Cloudflare Worker that routes bot traffic through Prerender.io for SEO rendering.

## How it works

- Regular users are passed through to the origin unchanged
- Search engine bots and crawlers are routed to Prerender.io for server-side rendered HTML

## Setup

1. Deploy `worker.js` as a Cloudflare Worker
2. Set the following environment variable in your Worker settings:

| Variable | Description |
|----------|-------------|
| `PRERENDER_TOKEN` | Your Prerender.io token |

## Requirements

- Cloudflare Workers
