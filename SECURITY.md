# Security Policy

## Supported Versions

We provide security updates for the latest release only.

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email us at: sheikhcoders@gmail.com
3. Include details about the vulnerability
4. Allow time for us to investigate and patch

We will:
- Acknowledge your report within 24 hours
- Keep you informed throughout the process
- Credit you in the release notes (if desired)

## Best Practices

When using this proxy:

- **Never commit API keys** to version control
- **Use environment variables** for all secrets
- **Rotate API keys** regularly
- **Enable HTTPS** in production
- **Implement rate limiting** to prevent abuse
- **Add authentication** for production deployments
- **Monitor logs** for suspicious activity
- **Keep dependencies updated**

## Security Features

- No API keys are logged or stored
- Request/response bodies are not logged by default
- CORS can be configured for your domain only
- Rate limiting can be enabled in production

## Dependencies

This project uses:
- express (MIT)
- axios (MIT)
- zod (MIT)
- dotenv (BSD-2-Clause)

All dependencies are regularly updated for security patches.
