# Configuring Code Editors and LLMs 

Karafka provides LLM-optimized documentation following the [llms.txt standard](https://llmstxt.org). There are three ways to configure your development environment in order to get better code assistance and solve problems faster when working with Karafka. You can feed AI tools with Karafka documentation either by providing them with a URL, copying and pasting the docs, or setting up your code editor to do it automatically.

## Setup Methods

### Method 1: Providing direct Karafka URL Access (ChatGPT, Perplexity, Copilot)

For LLMs with web browsing capabilities, insert the following prompt containing the Karafka documentation URL:

```text
https://karafka.io/llms.txt

I'm building a Rails app that processes user events from Kafka. 
What's the best way to get started with Karafka?
```

```text
Please read https://karafka.io/llms.txt and then help me implement a Karafka consumer with error handling and retries.
```

### Method 2: Uploading Karafka documentation content 

For LLMs without web browsing:

1. Get the documentation from [karafka.io/llms.txt](https://karafka.io/llms.txt)
2. Copy the complete llms.txt content.  
3. Paste the itllms.txt content into chat.
4. Request specific implementation help

### Method 3: Integrating IDE 

To configure your code editor to use Karafka documentation as context for AI-assisted development, follow the path specific to your IDE.

The following process describes alternative approaches depending on your IDE's capabilities. Check the documentation of your AI assistant to determine which combination of remote URLs, local files, and configuration methods work best for your development environment.

**General Setup Process:**

1. Depending on your IDE capabilities, perform one of the following steps:
   - Add `https://karafka.io/llms.txt` to the documentation sources or knowledge base of your IDE
   - Download and save `https://karafka.io/llms.txt` in your project documents folder  
2. To reference project documentation, configure the AI assistant, unless your IDE automatically detects and uses documentation files in your project.
3. To complete the integration, enable the "use docs for context" feature in your IDE's AI settings.

!!! note "Where to Find These Settings"

    Most IDEs store AI configuration in Settings/Preferences under "AI Assistant" or "Documentation," in workspace config files like `.vscode/settings.json`, or through individual extension preferences.

## Advantages of LLM-optimized documentation

**When you work with traditional documentation search, you:**

❌ Hunt through multiple pages.  
❌ Miss important configuration details.  
❌ Struggle with framework-specific patterns.  
❌ Get generic Kafka advice instead of Karafka-specific guidance . 

### When you optimize your work with AI-enhanced documentation, you:

✅ Get comprehensive answers that reference multiple docs.  
✅ Receive Karafka-specific best practices.  
✅ Learn about Pro features when they solve your problems.  
✅ Get code examples tailored to your use case.  
✅ Understand the "why" behind configuration choices.  

# Best Practices for AI Assitance

## Prompts for basic AI Assistance

This section teaches you how to ask effective questions when working with AI assistants on basic Karafka-related problems. There are several rules to follow to optimize the replies.

### 1. **Be Specific About Your Setup**

See the difference between two levels of detail in the following prompts.

Good:

```text
"I'm using Karafka OSS with Rails 7 in production"
```

Better:

```text
"I'm using Karafka Pro with Rails 7, processing 10k msgs/minute"
```

### 2. **Mention Your Experience Level**
You can specify your expertise on one of the following levels:
- **New to Kafka**: to get foundational explanations
- **Kafka expert, new to Karafka**: for AI to focus on framework-specific patterns
- **Karafka user**: to get advanced optimization tips

### 3. **Include Error Messages**

Feed your AI assistant with complete error messages and stack traces for faster troubleshooting. Paste them as they are.

### 4. **Ask for Code Examples**

Use the following prompt for AI to illustrate the solution in detail.

```text
"Show me how to implement a consumer that processes user events with error handling and proper offset management."
```

## Prompts for Advanced AI Workflows
This section is a prompt engineering guide to help you cooperate with AI assistants on more complex Karafka-related problems.


### Development Planning

```text
"I need to build an event-driven system for [description]. 
What Karafka components should I use and how should I structure it?"
```

### Performance Optimization

```text
"My Karafka consumers are falling behind. I'm processing 50k messages/hour with current config: [paste config]. How can I optimize?"
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

 AI-optimized documentation of Karafka provides guidance about both Karafka OSS and Pro features. When you ask questions:

- Mention which version you're using.
- Ask about Pro features even if you're on OSS. AI will explain benefits and help you evaluate upgrades.
- Specify production vs development context, as recommendations differ significantly.

## Tips for Better Results

In this section, you'll find a general list of dos and don'ts for prompting your AI assistant about Karafka.

### ✅ **Do This**

- Provide complete context about your setup.
- Ask follow-up questions for clarification.
- Request code examples with explanations.
- Mention specific error messages or log outputs.
- Ask about testing strategies for your use case.

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

- **Version compatibility** – Always check against current docs
- **Production considerations** – Test recommendations in staging
- **Security implications** – Review security-related suggestions carefully
- **Performance claims** – Benchmark in your environment

# Automatic LLM Optimization

Karafka's documentation automatically detects AI services (OpenAI, Anthropic, GitHub Copilot, Perplexity, etc.) through the User-Agent detection and intelligently routes them to the optimized content.

**Smart Content Routing:**

- **LLM Request**: `/docs/Consuming-Messages/` → redirected to `/docs/Consuming-Messages.md` (special markdown)
- **Human Request**: `/docs/Consuming-Messages.md` → redirected to `/docs/Consuming-Messages/` (formatted HTML)

This bidirectional routing provides the best possible experience for both regular users and machines:

- **40-65% token reduction** – No HTML tags, CSS classes, or JavaScript noise
- **Direct processing** – LLMs receive clean, semantic content without parsing overhead
- **Better context understanding** – More actual documentation fits within AI context windows

The result is more accurate, framework-specific guidance when you reference Karafka documentation URLs in AI conversations. The optimization happens transparently as long as you use regular documentation URLs. The rest is handled by the system automatically.
