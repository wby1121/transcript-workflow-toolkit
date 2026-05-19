# Security

## Reporting Vulnerabilities

If you discover a security vulnerability, please open a GitHub issue. Do NOT disclose it publicly until it has been addressed.

## API Keys

Never commit API keys. Use `.env.local` (gitignored). The `.env.example` file documents all required variables.

## Dependencies

Run `pnpm audit` regularly to check for known vulnerabilities in dependencies.
