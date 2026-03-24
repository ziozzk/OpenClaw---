---
name: tavily-search
description: Perform AI-optimized web searches using the Tavily API. Use when you need to search the web for current information, news, research, or any online content. Requires a Tavily API key.
---

# Tavily Web Search

This skill provides AI-optimized web search capabilities using the Tavily API.

## Configuration

Set your Tavily API key in one of these ways:

1. **Credentials file** (recommended): Stored in `~/.openclaw/credentials/tavily.json`
2. **Environment variable**: `TAVILY_API_KEY`
3. **Pass directly**: Include `api_key` parameter in requests

## Usage

### Basic Search

```python
from tavily_search import search

results = search(
    query="your search query",
    api_key="your-api-key"  # or use TAVILY_API_KEY env var
)
```

### Search Options

- `query` (required): The search query string
- `api_key` (optional): Tavily API key (falls back to TAVILY_API_KEY env var)
- `search_depth` (optional): "basic" or "advanced" - default is "basic"
- `topic` (optional): "general" or "news" - default is "general"
- `max_results` (optional): Number of results to return - default is 5

### Example Searches

**General web search:**
```
Search for: "latest developments in quantum computing 2026"
```

**News search:**
```
Search for: "AI regulation news" with topic="news"
```

**Deep research:**
```
Search for: "climate change mitigation strategies" with search_depth="advanced"
```

## Script Usage

Use the bundled script for command-line searches:

```bash
python scripts/tavily_search.py "your query" --api-key your-key
```

## Response Format

The search returns a list of results with:
- `title`: Page title
- `url`: Source URL
- `content`: Extracted content snippet
- `score`: Relevance score

## Error Handling

Common errors:
- **Invalid API key**: Check your Tavily API key
- **Rate limit**: Tavily has rate limits based on your plan
- **Network error**: Check internet connection

## Getting an API Key

1. Visit https://tavily.com
2. Sign up for an account
3. Get your API key from the dashboard
4. Free tier available for development
