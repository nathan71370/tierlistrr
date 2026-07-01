# Security Policy

## Supported versions

tierlistrr is an actively developed self-hosted app. Security fixes target the
latest `main` and the most recent published image
(`ghcr.io/nathan71370/tierlistrr:latest`). Please run a recent version before
reporting.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Instead, report privately via GitHub's
[private vulnerability reporting](https://github.com/nathan71370/tierlistrr/security/advisories/new)
(Security tab → "Report a vulnerability").

Include, if you can:

- affected version / commit,
- a description and impact,
- steps to reproduce or a proof of concept.

You'll get an acknowledgement as soon as possible. Once a fix is available it
will be released and the advisory published, crediting you unless you prefer to
stay anonymous.

## Self-hosting hardening

A few deployment notes that prevent the most common issues:

- **Always set `BETTER_AUTH_SECRET`** to a strong random value in production
  (`openssl rand -base64 32`). The default is insecure and for local dev only.
- **Set `BETTER_AUTH_URL`** to your public origin behind a reverse proxy, so
  cookies and CSRF checks work correctly.
- Use `AUTH_ALLOWED_EMAILS` to restrict who can sign in if your instance isn't
  meant to be open.
- Keep the app updated — Dependabot and the published image track upstream fixes.
