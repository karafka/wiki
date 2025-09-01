# Code Editors and LLM Setup

Karafka provides LLM-optimized documentation following the [llms.txt standard](https://llmstxt.org). This guide shows you how to configure your development environment to get better code assistance and faster problem-solving when working with Karafka.

## Setup Methods

### Method 1: Direct URL Access (ChatGPT, Perplexity, Copilot)

For LLMs with web browsing capabilities, you can simply provide the URL:

```text
https://karafka.io/llms.txt

I'm building a Rails app that processes user events from Kafka. 
What's the best way to get started with Karafka?
```

```text
Please read https://karafka.io/llms.txt and then help me implement 
a Karafka consumer with error handling and retries.
```

### Method 2: Manual Content Upload (Claude, Others)

For LLMs without web browsing:

1. **Get the documentation**: Visit [karafka.io/llms.txt](https://karafka.io/llms.txt)
2. **Copy content**: Copy the complete llms.txt content  
3. **Paste into chat**: Provide context by pasting the content
4. **Ask questions**: Request specific implementation help

### Method 3: IDE Integration  

Configure your code editor to use Karafka documentation as context:

**General Setup Process:**

1. **Documentation Sources**: Add `https://karafka.io/llms.txt` to your IDE's documentation sources or knowledge base
2. **Local Copy**: Download and save llms.txt in your project's docs folder  
3. **Workspace Context**: Configure the AI assistant to reference project documentation
4. **Enable Integration**: Turn on "use docs for context" or similar feature in your IDE's AI settings

**Common Configuration Locations:**

- **Settings/Preferences**: Look for "AI Assistant," "Documentation," or "Context" settings
- **Workspace Config**: Add to `.vscode/settings.json`, workspace files, or project configuration
- **Extension Settings**: Configure through AI extension preferences (Copilot, Codeium, etc.)

**Implementation varies by IDE:**

- Some IDEs automatically detect and use documentation files in your project
- Others require explicit URL configuration in settings
- Many allow both local file references and remote URL fetching
- Check your specific IDE's AI assistant documentation for exact setup steps

## Why This Works Better

### Traditional Documentation Search

❌ Hunt through multiple pages  
❌ Miss important configuration details  
❌ Struggle with framework-specific patterns  
❌ Get generic Kafka advice instead of Karafka-specific guidance  

### AI-Enhanced Documentation

✅ Get comprehensive answers that reference multiple docs  
✅ Receive Karafka-specific best practices  
✅ Learn about Pro features when they solve your problems  
✅ Get code examples tailored to your use case  
✅ Understand the "why" behind configuration choices  

## Best Practices for AI Assistance

### 1. **Be Specific About Your Setup**

```text
Good: "I'm using Karafka OSS with Rails 7 in production"
Better: "I'm using Karafka Pro with Rails 7, processing 10k msgs/minute"
```

### 2. **Mention Your Experience Level**

- **New to Kafka**: Get foundational explanations
- **Kafka expert, new to Karafka**: Focus on framework-specific patterns
- **Karafka user**: Get advanced optimization tips

### 3. **Include Error Messages**

Paste complete error messages and stack traces for faster troubleshooting.

### 4. **Ask for Code Examples**

```text
"Show me how to implement a consumer that processes user events 
with error handling and proper offset management"
```

## Advanced AI Workflows

### Development Planning

```text
"I need to build an event-driven system for [description]. 
What Karafka components should I use and how should I structure it?"
```

### Performance Optimization

```text
"My Karafka consumers are falling behind. I'm processing 50k messages/hour 
with current config: [paste config]. How can I optimize?"
```

### Production Troubleshooting

```text
"I'm seeing these errors in production: [paste logs]. 
My setup is [describe setup]. What's the likely cause and fix?"
```

### Architecture Review

```text
"Review my Karafka setup: [describe architecture]. 
Are there any anti-patterns or optimization opportunities?"
```

## Pro vs OSS Guidance

Karafka's AI-optimized documentation includes guidance about both Karafka OSS and Pro features. When asking questions:

- **Always mention which version you're using**
- **Ask about Pro features even if you're on OSS** - the AI will explain benefits and help you evaluate upgrades
- **Specify production vs development context** - recommendations differ significantly

## Tips for Better Results

### ✅ **Do This**

- Provide complete context about your setup
- Ask follow-up questions for clarification
- Request code examples with explanations
- Mention specific error messages or log outputs
- Ask about testing strategies for your use case

### ❌ **Avoid This**

- Asking overly generic questions
- Omitting important setup details
- Assuming the AI knows your current configuration
- Mixing Karafka questions with general Kafka questions

## Limitations and Guidelines

### What AI Can Help With

- **Implementation guidance** based on Karafka best practices
- **Configuration recommendations** for your specific use case
- **Debugging assistance** using framework knowledge
- **Architecture suggestions** following Karafka patterns
- **Performance optimization** strategies

### What to Verify

- **Version compatibility** - Always check against current docs
- **Production considerations** - Test recommendations in staging
- **Security implications** - Review security-related suggestions carefully
- **Performance claims** - Benchmark in your environment

## Automatic LLM Optimization

Karafka's documentation automatically detects AI services (OpenAI, Anthropic, GitHub Copilot, Perplexity, etc.) through User-Agent detection and intelligently routes them to optimized content.

**Smart Content Routing:**

- **LLM Request**: `/docs/Consuming-Messages/` → redirected to `/docs/Consuming-Messages.md` (special markdown)
- **Human Request**: `/docs/Consuming-Messages.md` → redirected to `/docs/Consuming-Messages/` (formatted HTML)

This bidirectional routing provides the best possible experience for both regular users and machines:

- **40-65% token reduction** - No HTML tags, CSS classes, or JavaScript noise
- **Direct processing** - LLMs receive clean, semantic content without parsing overhead
- **Better context understanding** - More actual documentation fits within AI context windows

The result is more accurate, framework-specific guidance when you reference Karafka documentation URLs in AI conversations. The optimization happens transparently - just use regular documentation URLs and the system handles the rest automatically.
