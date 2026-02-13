# Universal Proxy Server

A universal proxy server that provides a unified API interface for both OpenAI and Anthropic compatible APIs, supporting both Claude Code and Codex integrations.

## Features

- **Dual API compatibility**: Works with both OpenAI (`/v1/chat/completions`) and Anthropic (`/v1/messages`) endpoints
- **Smart routing**: Automatically routes requests to the appropriate backend based on model name
- **Format translation**: Seamlessly converts between OpenAI and Anthropic API formats
- **Extensible backend support**: Add custom backends for your own models
- **Streaming support**: Handles streaming responses from backends

## Supported Models

### Default Model Routes

| Model | Backend | Model ID |
|-------|---------|----------|
| Claude models | Anthropic | claude-sonnet-4-20250514 |
| gpt-4 | OpenAI | gpt-4 |
| gpt-3.5-turbo | OpenAI | gpt-3.5-turbo |
| big-pickle | Custom | big-pickle |
| minimax-* | Custom | minimax-m2.5-free |

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your API keys to .env file
```

## Configuration

Edit the `.env` file to configure your backends:

```env
# Anthropic API (Claude Code)
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# OpenAI API (GPT models)
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_openai_api_key_here

# Custom backend (your own models)
CUSTOM_BASE_URL=http://localhost:8000
CUSTOM_API_KEY=your_custom_api_key_here
```

## Usage

### Start the server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### API Endpoints

#### OpenAI Compatible Endpoint

```bash
POST http://localhost:3000/v1/chat/completions
```

Request body:
```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello, world!"}
  ],
  "temperature": 0.7,
  "max_tokens": 100
}
```

#### Anthropic Compatible Endpoint

```bash
POST http://localhost:3000/v1/messages
```

Request body:
```json
{
  "model": "claude",
  "messages": [
    {"role": "user", "content": "Hello, world!"}
  ],
  "max_tokens": 100
}
```

### Adding Custom Routes

Edit `src/router.ts` to add custom model routes:

```typescript
const config: RouterConfig = {
  // Add your custom routes here
  'my-model': { backend: 'custom', modelId: 'my-model-id' },
  'gpt-4': { backend: 'openai', modelId: 'gpt-4' },
};
```

### Adding Custom Backends

Edit `src/router.ts` to add custom backends:

```typescript
const backends: Record<BackendType, BackendConfig> = {
  anthropic: { /* existing config */ },
  openai: { /* existing config */ },
  custom: { /* existing config */ },
  // Add your custom backend
  my_backend: {
    baseUrl: process.env.MY_BACKEND_URL || 'http://localhost:9000',
    apiKey: process.env.MY_BACKEND_API_KEY || '',
  },
};
```

## Claude Code Configuration

Add to your `~/.config/claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:3000",
    "OPENAI_BASE_URL": "http://localhost:3000/v1"
  }
}
```

## Deployment

### Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Set environment variables in Vercel dashboard:
   - `ANTHROPIC_BASE_URL`
   - `ANTHROPIC_API_KEY`
   - `OPENAI_BASE_URL`
   - `OPENAI_API_KEY`
   - `CUSTOM_BASE_URL`
   - `CUSTOM_API_KEY`

### Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Set environment variables in Netlify dashboard under "Site settings" > "Environment variables"

### Wasmer (Edge Deploy)

1. Install Wasmer CLI:
   ```bash
   curl https://get.wasmer.io -sL | sh
   ```

2. Deploy:
   ```bash
   wasmer deploy
   ```

3. Set environment variables in Wasmer dashboard

### Docker

```bash
# Build the image
docker build -t universal-proxy .

# Run the container
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  -e CUSTOM_API_KEY=your_key \
  universal-proxy
```

### Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard

## Security Considerations

- **Rotate API keys**: If you accidentally exposed your API keys, rotate them immediately
- **Use environment variables**: Never commit API keys to version control
- **Rate limiting**: Consider adding rate limiting for production use
- **Authentication**: Add authentication middleware for production deployments

## License

MIT
