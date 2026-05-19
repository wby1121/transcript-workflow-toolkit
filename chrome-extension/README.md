# Chrome Extension (Coming Month 2+)

The Chrome Extension will provide one-click transcript extraction directly from YouTube pages.

## Planned Features

- One-click transcript extraction from YouTube watch pages
- Inline transcript viewer overlay
- One-click export to Markdown
- Sync with web app local workspace

## Status

Currently deferred. Will begin development after the web app has:
- Organic traffic > 100 UV/day
- Returning visitors
- Stable provider chain

## Architecture Preview

The extension will be a Manifest V3 Chrome extension using:
- Content script for YouTube page injection
- Popup for quick actions
- Shared types from `packages/shared`
