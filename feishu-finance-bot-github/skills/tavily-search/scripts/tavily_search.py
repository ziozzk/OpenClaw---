#!/usr/bin/env python3
"""
Tavily Web Search Script

Usage:
    python tavily_search.py "your search query" --api-key your-api-key
    python tavily_search.py "your search query"  # uses TAVILY_API_KEY env var

Options:
    --api-key: Tavily API key (or set TAVILY_API_KEY env var)
    --depth: Search depth - "basic" or "advanced" (default: basic)
    --topic: Search topic - "general" or "news" (default: general)
    --max-results: Number of results (default: 5)
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.error


def tavily_search(query, api_key, search_depth="basic", topic="general", max_results=5):
    """
    Perform a Tavily web search.
    
    Args:
        query: Search query string
        api_key: Tavily API key
        search_depth: "basic" or "advanced"
        topic: "general" or "news"
        max_results: Number of results to return
    
    Returns:
        List of search results
    """
    url = "https://api.tavily.com/search"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    data = {
        "query": query,
        "search_depth": search_depth,
        "topic": topic,
        "max_results": max_results,
        "include_answer": True,
        "include_raw_content": False
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers=headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ""
        return {"error": f"HTTP {e.code}: {error_body}"}
    except urllib.error.URLError as e:
        return {"error": f"Network error: {e.reason}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


def format_results(results):
    """Format search results for display."""
    if "error" in results:
        return f"Error: {results['error']}"
    
    output = []
    
    # Include AI answer if available
    if "answer" in results:
        output.append(f"\n🤖 AI Answer:\n{results['answer']}\n")
    
    # Include results
    if "results" in results:
        output.append(f"\n📊 Search Results ({len(results['results'])} found):\n")
        for i, result in enumerate(results['results'], 1):
            output.append(f"\n{i}. {result.get('title', 'No title')}")
            output.append(f"   URL: {result.get('url', 'No URL')}")
            if "content" in result:
                content = result["content"][:200] + "..." if len(result.get("content", "")) > 200 else result.get("content", "")
                output.append(f"   {content}")
            if "score" in result:
                output.append(f"   Score: {result['score']}")
    
    return "\n".join(output)


def main():
    parser = argparse.ArgumentParser(description="Tavily Web Search")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--api-key", help="Tavily API key (or set TAVILY_API_KEY env var)")
    parser.add_argument("--depth", choices=["basic", "advanced"], default="basic", help="Search depth")
    parser.add_argument("--topic", choices=["general", "news"], default="general", help="Search topic")
    parser.add_argument("--max-results", type=int, default=5, help="Number of results")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    
    args = parser.parse_args()
    
    # Get API key
    api_key = args.api_key or os.environ.get("TAVILY_API_KEY")
    if not api_key:
        print("Error: No API key provided. Use --api-key or set TAVILY_API_KEY environment variable.")
        sys.exit(1)
    
    # Perform search
    results = tavily_search(
        query=args.query,
        api_key=api_key,
        search_depth=args.depth,
        topic=args.topic,
        max_results=args.max_results
    )
    
    # Output results
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(format_results(results))


if __name__ == "__main__":
    main()
