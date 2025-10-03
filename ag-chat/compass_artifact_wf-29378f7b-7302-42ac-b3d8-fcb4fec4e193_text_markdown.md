# AI SDK v5 + AI Elements + MCP Client Application Tutorial

**Complete Step-by-Step Guide for Building Production-Ready AI Applications**

---

## Overview

This tutorial guides you through building a complete AI application using AI SDK v5, AI Elements UI components, and MCP (Model Context Protocol) integration. Following the KISSS principle (Keep It Simple, Scalable, Stupid), we'll build incrementally across 6 phases, ensuring you have a working foundation at each step.

**Target Audience:** Intermediate to advanced developers using Cursor IDE with AI coding agents

**Stack:**
- AI SDK v5 (released July 2025)
- AI Elements (UI components)
- MCP Protocol for tool integration
- Claude Sonnet 4.5 and OpenAI GPT-5
- Next.js 14+ with App Router
- TypeScript
- React 18+

**Estimated Time:** 8-12 hours across all phases

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Phase 1: Basic Chat with Reasoning and Streaming](#phase-1-basic-chat-with-reasoning-and-streaming)
- [Phase 2: MCP Integration](#phase-2-mcp-integration)
- [Phase 3: Agent System](#phase-3-agent-system)
- [Phase 4: Computer Use](#phase-4-computer-use)
- [Phase 5: Custom Apps](#phase-5-custom-apps)
- [Phase 6: RAG Implementation](#phase-6-rag-implementation)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Knowledge
- [ ] TypeScript fundamentals
- [ ] React and Next.js basics
- [ ] Basic understanding of AI/LLM concepts
- [ ] Command line proficiency

### Required Tools
- [ ] Node.js 18+ installed
- [ ] Cursor IDE or VS Code
- [ ] Git
- [ ] npm or pnpm

### Required API Keys
- [ ] Anthropic API key (for Claude Sonnet 4.5) - https://console.anthropic.com
- [ ] OpenAI API key (for GPT-5) - https://platform.openai.com
- [ ] Optional: E2B API key for sandboxing - https://e2b.dev

---

## Project Setup

### Module 1.1: Initialize Next.js Project

**Objective:** Create a new Next.js project with TypeScript and Tailwind CSS

**Copy this prompt to Claude/GPT:**

```
Create a new Next.js 14+ project with the following specifications:
- Use App Router
- Enable TypeScript with strict mode
- Configure Tailwind CSS
- Set up environment variables for API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY)
- Create a basic folder structure: /app, /components, /lib, /lib/ai
- Add .env.local to .gitignore
- Configure next.config.js for optimal AI SDK performance
```

**Manual Steps:**

```bash
# Initialize project
- [ ] npx create-next-app@latest ai-sdk-tutorial --typescript --tailwind --app --no-src-dir
- [ ] cd ai-sdk-tutorial

# Install core dependencies
- [ ] npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/react
- [ ] npm install zod@^4.1.8

# Create environment file
- [ ] touch .env.local
```

**Configure .env.local:**

```env
# .env.local
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
```

### Module 1.2: Install shadcn/ui and AI Elements

**Objective:** Set up UI component library foundation

**Copy this prompt to Claude/GPT:**

```
Initialize shadcn/ui with CSS Variables mode, then install AI Elements components. 
Configure:
1. Run shadcn init with CSS Variables option
2. Install AI Elements: conversation, message, response, prompt-input, reasoning, loader
3. Verify components are in @/components/ai-elements/ directory
4. Test that Tailwind is properly configured for component styling
```

**Manual Steps:**

```bash
# Initialize shadcn/ui
- [ ] npx shadcn@latest init
  # Select: CSS Variables, TypeScript
  
# Install AI Elements
- [ ] npx ai-elements@latest add conversation message response prompt-input reasoning loader code-block

# Verify installation
- [ ] ls components/ai-elements/
  # Should see: conversation.tsx, message.tsx, response.tsx, etc.
```

---

## Phase 1: Basic Chat with Reasoning and Streaming

**Goal:** Build a functional chat interface with streaming responses and reasoning display

**Time Estimate:** 2-3 hours

### Module 1.3: Create Basic Chat API Route

**Objective:** Set up server-side streaming endpoint with Claude Sonnet 4.5

**Copy this prompt to Claude/GPT:**

```
Create a Next.js API route at /app/api/chat/route.ts that:
1. Accepts POST requests with messages array
2. Uses AI SDK v5's streamText function
3. Integrates Claude Sonnet 4.5 model (anthropic/claude-sonnet-4-5)
4. Enables reasoning output with sendReasoning: true
5. Uses convertToModelMessages to transform UIMessage to ModelMessage
6. Returns toUIMessageStreamResponse for proper streaming
7. Includes error handling and proper TypeScript types
8. Sets maxDuration to 30 seconds

Include comprehensive comments explaining each section.
```

**Expected Code Structure:**

```typescript
// app/api/chat/route.ts
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      messages: convertToModelMessages(messages),
    });
    
    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

**Verification Steps:**

```bash
- [ ] File created at app/api/chat/route.ts
- [ ] TypeScript compiles without errors
- [ ] Environment variable ANTHROPIC_API_KEY is set
```

### Module 1.4: Build Chat UI Component

**Objective:** Create responsive chat interface with AI Elements

**Copy this prompt to Claude/GPT:**

```
Create a chat component at /app/page.tsx that:
1. Uses useChat hook from @ai-sdk/react
2. Implements AI Elements components: Conversation, ConversationContent, Message, MessageContent, Response
3. Handles message parts (text and reasoning types)
4. Includes PromptInput with PromptInputTextarea and PromptInputSubmit
5. Shows Reasoning component that auto-opens during streaming
6. Displays loader during 'submitted' status
7. Handles streaming status properly
8. Uses proper TypeScript types throughout
9. Includes ConversationScrollButton for UX

Add comprehensive inline comments explaining the AI SDK v5 patterns used.
```

**Expected Code Structure:**

```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Loader } from '@/components/ai-elements/loader';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Chat Assistant</h1>
      
      <Conversation className="flex-1 mb-4">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask me anything!"
              icon={<MessageSquare className="size-12" />}
            />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={
                              status === 'streaming' &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === 'submitted' && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="w-full relative">
        <PromptInputTextarea
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
          className="pr-12"
        />
        <PromptInputSubmit
          status={status === 'streaming' ? 'streaming' : 'ready'}
          disabled={!input.trim()}
          className="absolute bottom-1 right-1"
        />
      </PromptInput>
    </div>
  );
}
```

**Verification Steps:**

```bash
- [ ] Run npm run dev
- [ ] Navigate to http://localhost:3000
- [ ] Send a test message
- [ ] Verify streaming response appears
- [ ] Check reasoning panel opens automatically
- [ ] Test scroll-to-bottom behavior
```

### Module 1.5: Add Model Switching

**Objective:** Enable switching between Claude and GPT-5

**Copy this prompt to Claude/GPT:**

```
Enhance the chat application to support model switching:
1. Add a dropdown/selector UI component for model selection
2. Support models: claude-sonnet-4-5, gpt-5
3. Pass selected model to API via messages payload
4. Update API route to handle model parameter
5. Store model preference in state
6. Display current model in UI
7. Handle model-specific configurations (reasoning support varies)

Ensure backward compatibility with existing code.
```

**Expected Implementation:**

```typescript
// app/page.tsx (additions)
const [selectedModel, setSelectedModel] = useState<'claude-sonnet-4-5' | 'gpt-5'>('claude-sonnet-4-5');

const { messages, sendMessage, status } = useChat({
  api: '/api/chat',
  body: { model: selectedModel }, // Pass model to API
});

// Add model selector UI
<select 
  value={selectedModel} 
  onChange={(e) => setSelectedModel(e.target.value as any)}
  className="mb-4 p-2 border rounded"
>
  <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
  <option value="gpt-5">GPT-5</option>
</select>
```

```typescript
// app/api/chat/route.ts (update)
const { messages, model = 'claude-sonnet-4-5' } = await req.json();

const selectedProvider = model === 'gpt-5' 
  ? openai('gpt-5')
  : anthropic('claude-sonnet-4-5');

const result = streamText({
  model: selectedProvider,
  messages: convertToModelMessages(messages),
});
```

**Verification:**

```bash
- [ ] Model selector appears in UI
- [ ] Can switch between Claude and GPT-5
- [ ] Responses come from correct model
- [ ] No console errors
```

---

## Phase 2: MCP Integration

**Goal:** Integrate Model Context Protocol for tool connectivity

**Time Estimate:** 3-4 hours

### Module 2.1: Set Up MCP Client Infrastructure

**Objective:** Install MCP SDK and create client utilities

**Copy this prompt to Claude/GPT:**

```
Set up MCP infrastructure:
1. Install @modelcontextprotocol/sdk package
2. Create /lib/mcp/ directory
3. Create mcp-client.ts with helper functions for creating MCP clients
4. Support stdio, SSE, and Streamable HTTP transports
5. Add error handling and connection management
6. Create types for MCP tools
7. Include connection pooling pattern

Add comprehensive documentation comments.
```

**Manual Steps:**

```bash
- [ ] npm install @modelcontextprotocol/sdk
- [ ] mkdir lib/mcp
- [ ] touch lib/mcp/mcp-client.ts
```

**Expected Code:**

```typescript
// lib/mcp/mcp-client.ts
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse';
import { experimental_createMCPClient } from 'ai';

export type MCPTransportConfig = {
  type: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
};

export async function createMCPClient(config: MCPTransportConfig) {
  let transport;
  
  switch (config.type) {
    case 'stdio':
      transport = new StdioClientTransport({
        command: config.command!,
        args: config.args || [],
      });
      break;
    case 'sse':
      transport = new SSEClientTransport(new URL(config.url!));
      break;
  }

  return await experimental_createMCPClient({ transport });
}

export class MCPConnectionPool {
  private pool: Map<string, any> = new Map();

  async getClient(serverId: string, config: MCPTransportConfig) {
    if (!this.pool.has(serverId)) {
      const client = await createMCPClient(config);
      this.pool.set(serverId, client);
    }
    return this.pool.get(serverId)!;
  }

  async closeAll() {
    for (const client of this.pool.values()) {
      await client.close();
    }
    this.pool.clear();
  }
}
```

### Module 2.2: Create First MCP Server (Calculator)

**Objective:** Build a simple MCP server for mathematical operations

**Copy this prompt to Claude/GPT:**

```
Create a Python MCP server using FastMCP:
1. Create /mcp-servers/calculator/ directory
2. Create calculator_server.py with FastMCP
3. Implement tools: add, subtract, multiply, divide, power
4. Add input validation and error handling
5. Configure for stdio transport
6. Add setup instructions in README.md

Include detailed comments and usage examples.
```

**Manual Steps:**

```bash
- [ ] mkdir -p mcp-servers/calculator
- [ ] cd mcp-servers/calculator
- [ ] python3 -m venv venv
- [ ] source venv/bin/activate  # On Windows: venv\Scripts\activate
- [ ] pip install mcp mcp[cli]
- [ ] touch calculator_server.py
```

**Expected Code:**

```python
# mcp-servers/calculator/calculator_server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Calculator Server")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return int(a + b)

@mcp.tool()
def subtract(a: int, b: int) -> int:
    """Subtract b from a"""
    return int(a - b)

@mcp.tool()
def multiply(a: int, b: int) -> int:
    """Multiply two numbers"""
    return int(a * b)

@mcp.tool()
def divide(a: int, b: int) -> float:
    """Divide a by b"""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return float(a / b)

@mcp.tool()
def power(a: int, b: int) -> int:
    """Calculate a to the power of b"""
    return int(a ** b)

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

**Verification:**

```bash
- [ ] python calculator_server.py  # Should start without errors
- [ ] Test with: mcp dev calculator_server.py
```

### Module 2.3: Integrate MCP Tools into Chat

**Objective:** Connect MCP server tools to AI SDK chat

**Copy this prompt to Claude/GPT:**

```
Integrate MCP calculator server with chat application:
1. Update API route to create MCP client
2. Fetch tools from MCP server
3. Pass tools to streamText
4. Handle tool calls in UI
5. Display tool invocations with Tool component from AI Elements
6. Show tool execution state (input-streaming, input-available, output-available, output-error)
7. Add proper error handling
8. Include cleanup logic (close MCP client)

Add detailed comments explaining the MCP integration flow.
```

**Expected Code:**

```typescript
// app/api/chat/route.ts (updated)
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { experimental_createMCPClient } from 'ai';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import path from 'path';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    
    // Create MCP client for calculator server
    const calculatorClient = await experimental_createMCPClient({
      transport: new StdioClientTransport({
        command: 'python',
        args: [path.join(process.cwd(), 'mcp-servers/calculator/calculator_server.py')],
      }),
    });

    // Fetch tools from MCP server
    const mcpTools = await calculatorClient.tools();
    
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      messages: convertToModelMessages(messages),
      tools: mcpTools, // Use MCP tools
    });
    
    const response = result.toUIMessageStreamResponse({
      sendReasoning: true,
    });

    // Cleanup on stream end
    response.then(() => calculatorClient.close());
    
    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

**Update UI for Tool Display:**

```typescript
// app/page.tsx (add tool handling in message parts)
case 'tool-add':
case 'tool-subtract':
case 'tool-multiply':
case 'tool-divide':
case 'tool-power':
  return (
    <div key={`${message.id}-${i}`} className="tool-call-display p-3 bg-muted rounded-lg">
      <p className="font-semibold">🔧 {part.type.replace('tool-', '')}</p>
      {part.state === 'input-available' && (
        <p className="text-sm">Input: {JSON.stringify(part.input)}</p>
      )}
      {part.state === 'output-available' && (
        <p className="text-sm text-green-600">Result: {part.output}</p>
      )}
      {part.state === 'output-error' && (
        <p className="text-sm text-red-600">Error: {part.errorText}</p>
      )}
    </div>
  );
```

**Verification:**

```bash
- [ ] Start dev server: npm run dev
- [ ] Ask: "What is 25 + 17?"
- [ ] Verify calculator tool is called
- [ ] Check tool result is displayed
- [ ] Test error case: "Divide 10 by 0"
```

### Module 2.4: Add Smithery MCP Integration

**Objective:** Integrate pre-built MCP servers from Smithery

**Copy this prompt to Claude/GPT:**

```
Add Smithery MCP integration:
1. Install Smithery CLI globally
2. Configure Smithery MCP servers (GitHub, Slack)
3. Create server configuration file
4. Update API route to connect to Smithery servers
5. Handle authentication for Smithery servers
6. Add UI for selecting which MCP servers to use
7. Document setup process

Include environment variable management for API keys.
```

**Manual Steps:**

```bash
- [ ] npm install -g @smithery/cli
- [ ] smithery login
- [ ] smithery install github --client cursor
- [ ] smithery install slack --client cursor
```

**Environment Setup:**

```env
# .env.local (add)
GITHUB_TOKEN=your_github_token
SLACK_TOKEN=your_slack_token
```

**Expected Code:**

```typescript
// lib/mcp/smithery-config.ts
export const smitheryServers = {
  github: {
    url: 'https://server.smithery.ai/github/ws',
    auth: process.env.GITHUB_TOKEN,
  },
  slack: {
    url: 'https://server.smithery.ai/slack/ws',
    auth: process.env.SLACK_TOKEN,
  },
};

// app/api/chat/route.ts (add Smithery integration)
import { smitheryServers } from '@/lib/mcp/smithery-config';

const githubClient = await experimental_createMCPClient({
  transport: {
    type: 'sse',
    url: smitheryServers.github.url,
    headers: {
      'Authorization': `Bearer ${smitheryServers.github.auth}`,
    },
  },
});

const githubTools = await githubClient.tools();
```

### Module 2.5: Add Composio MCP Integration

**Objective:** Integrate Composio's managed MCP platform

**Copy this prompt to Claude/GPT:**

```
Set up Composio MCP integration:
1. Install composio-core package
2. Create Composio account and get API key
3. Configure Composio MCP servers (Gmail, Linear)
4. Implement OAuth flow for user connections
5. Add tool filtering for security
6. Create connection status checker
7. Document the Composio setup process

Include proper error handling and reconnection logic.
```

**Manual Steps:**

```bash
- [ ] npm install composio-core
- [ ] Sign up at https://mcp.composio.dev/
- [ ] Get API key from dashboard
```

**Environment Setup:**

```env
# .env.local (add)
COMPOSIO_API_KEY=your_composio_api_key
```

**Expected Code:**

```typescript
// lib/mcp/composio-client.ts
import { Composio } from 'composio-core';

export async function createComposioMCPServer(userId: string) {
  const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
  });

  const mcpServer = await composio.mcp.createServer({
    userId,
    apps: ['gmail', 'linear'],
    toolFilters: {
      allowed: [
        'GMAIL_SEND_EMAIL',
        'GMAIL_SEARCH_EMAIL',
        'LINEAR_CREATE_ISSUE',
        'LINEAR_SEARCH_ISSUES',
      ],
      blocked: [
        'GMAIL_DELETE_EMAIL',
        'LINEAR_DELETE_ISSUE',
      ],
    },
  });

  return mcpServer;
}
```

**Verification:**

```bash
- [ ] Test Composio connection
- [ ] Verify OAuth flow works
- [ ] Test email search with Gmail
- [ ] Test issue creation with Linear
```

---

## Phase 3: Agent System

**Goal:** Build pluggable agent system with specialized agents

**Time Estimate:** 2-3 hours

### Module 3.1: Create Agent Base Infrastructure

**Objective:** Set up agent architecture with Agent class

**Copy this prompt to Claude/GPT:**

```
Create agent system infrastructure:
1. Create /lib/ai/agents/ directory
2. Create base-agent.ts with Agent class configuration
3. Define agent types and interfaces
4. Create agent registry system
5. Implement agent selection logic
6. Add agent storage/persistence patterns
7. Create agent configuration schema with Zod

Include comprehensive TypeScript types and documentation.
```

**Expected Code:**

```typescript
// lib/ai/agents/base-agent.ts
import { Experimental_Agent as Agent } from 'ai';
import { z } from 'zod';

export const agentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  systemPrompt: z.string(),
  model: z.string(),
  tools: z.record(z.any()),
  maxSteps: z.number().default(10),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;

export function createAgent(config: AgentConfig) {
  return new Agent({
    model: config.model,
    system: config.systemPrompt,
    tools: config.tools,
    stopWhen: stepCountIs(config.maxSteps),
  });
}
```

```typescript
// lib/ai/agents/registry.ts
import { AgentConfig } from './base-agent';

export class AgentRegistry {
  private agents: Map<string, AgentConfig> = new Map();

  register(config: AgentConfig) {
    this.agents.set(config.id, config);
  }

  get(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  list(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  unregister(id: string) {
    this.agents.delete(id);
  }
}

export const agentRegistry = new AgentRegistry();
```

### Module 3.2: Create Specialized Agents

**Objective:** Build domain-specific agents (coding, research, support)

**Copy this prompt to Claude/GPT:**

```
Create three specialized agents:
1. Coding Agent - for software development tasks
2. Research Agent - for information gathering
3. Support Agent - for customer service

For each agent:
- Define unique system prompt
- Configure appropriate tools
- Set model preferences
- Add to agent registry
- Include usage examples

Store in /lib/ai/agents/[agent-name].ts
```

**Expected Code:**

```typescript
// lib/ai/agents/coding-agent.ts
import { tool } from 'ai';
import { z } from 'zod';
import { createAgent, AgentConfig } from './base-agent';

const codeExecutionTool = tool({
  description: 'Execute code in a sandbox',
  inputSchema: z.object({
    code: z.string(),
    language: z.enum(['python', 'javascript', 'typescript']),
  }),
  execute: async ({ code, language }) => {
    // Integration with E2B or similar
    return { output: 'Code executed successfully' };
  },
});

export const codingAgentConfig: AgentConfig = {
  id: 'coding-agent',
  name: 'Coding Assistant',
  description: 'Expert software engineer for coding tasks',
  systemPrompt: `You are an expert software engineer specializing in:
- Writing clean, maintainable code
- Following best practices and design patterns
- Debugging and optimization
- Code review and refactoring

Always explain your reasoning and provide well-commented code.`,
  model: 'anthropic/claude-sonnet-4-5',
  tools: {
    executeCode: codeExecutionTool,
  },
  maxSteps: 15,
};

export const codingAgent = createAgent(codingAgentConfig);
```

```typescript
// lib/ai/agents/research-agent.ts
import { tool } from 'ai';
import { z } from 'zod';
import { createAgent, AgentConfig } from './base-agent';

const webSearchTool = tool({
  description: 'Search the web for information',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // Integration with search API
    return { results: [] };
  },
});

export const researchAgentConfig: AgentConfig = {
  id: 'research-agent',
  name: 'Research Assistant',
  description: 'Comprehensive research and information gathering',
  systemPrompt: `You are a research assistant that:
- Conducts thorough research on topics
- Synthesizes information from multiple sources
- Provides citations and references
- Identifies reliable sources
- Presents findings clearly

Always verify information from multiple sources.`,
  model: 'openai/gpt-5',
  tools: {
    webSearch: webSearchTool,
  },
  maxSteps: 10,
};

export const researchAgent = createAgent(researchAgentConfig);
```

### Module 3.3: Implement Agent Selection System

**Objective:** Create router agent for intelligent agent selection

**Copy this prompt to Claude/GPT:**

```
Create an agent routing system:
1. Build router agent that classifies user intent
2. Implement agent selection based on query type
3. Create UI for manual agent selection
4. Add agent switching mid-conversation
5. Implement agent handoff patterns
6. Track which agent handled each message
7. Add agent performance monitoring

Include proper TypeScript types and error handling.
```

**Expected Code:**

```typescript
// lib/ai/agents/router.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { agentRegistry } from './registry';

const routingSchema = z.object({
  agentId: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export async function routeToAgent(userMessage: string) {
  const availableAgents = agentRegistry.list();
  
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-5'),
    schema: routingSchema,
    prompt: `You are a routing agent. Analyze this user message and select the most appropriate specialized agent.

User message: "${userMessage}"

Available agents:
${availableAgents.map(a => `- ${a.id}: ${a.description}`).join('\n')}

Select the best agent and explain your reasoning.`,
  });

  return object;
}
```

**Update API Route:**

```typescript
// app/api/chat/route.ts (add routing)
import { routeToAgent } from '@/lib/ai/agents/router';
import { agentRegistry } from '@/lib/ai/agents/registry';

const routing = await routeToAgent(messages[messages.length - 1].content);
const agentConfig = agentRegistry.get(routing.agentId);
const agent = createAgent(agentConfig);

const result = agent.stream({
  messages: convertToModelMessages(messages),
});
```

### Module 3.4: Add Multi-Agent Orchestration

**Objective:** Implement parallel and sequential agent patterns

**Copy this prompt to Claude/GPT:**

```
Implement multi-agent orchestration:
1. Create orchestrator-worker pattern
2. Implement parallel agent execution
3. Add sequential agent chaining
4. Create agent collaboration workflows
5. Implement result aggregation
6. Add conflict resolution for competing responses
7. Include error handling for agent failures

Provide examples of each orchestration pattern.
```

**Expected Code:**

```typescript
// lib/ai/agents/orchestrator.ts
import { generateText } from 'ai';

export async function parallelAgentExecution(
  task: string,
  agents: Array<{ agent: any; subtask: string }>
) {
  const results = await Promise.all(
    agents.map(async ({ agent, subtask }) => {
      const { text } = await agent.generate({
        prompt: subtask,
      });
      return { agent: agent.id, result: text };
    })
  );

  return results;
}

export async function sequentialAgentChain(
  initialTask: string,
  agentChain: any[]
) {
  let currentInput = initialTask;
  const results = [];

  for (const agent of agentChain) {
    const { text } = await agent.generate({
      prompt: currentInput,
    });
    results.push({ agent: agent.id, result: text });
    currentInput = text; // Output becomes next input
  }

  return results;
}
```

**Verification:**

```bash
- [ ] Test agent selection with different queries
- [ ] Verify correct agent handles each request
- [ ] Test multi-agent workflows
- [ ] Check agent handoff functionality
```

---

## Phase 4: Computer Use

**Goal:** Implement computer control capabilities safely

**Time Estimate:** 2-3 hours

### Module 4.1: Set Up E2B Sandbox

**Objective:** Configure E2B for safe computer use execution

**Copy this prompt to Claude/GPT:**

```
Set up E2B desktop sandbox:
1. Install @e2b/desktop package
2. Create E2B account and get API key
3. Create sandbox initialization utility
4. Implement sandbox lifecycle management
5. Add screenshot capture functionality
6. Create cleanup procedures
7. Add error handling and retries

Include detailed security considerations.
```

**Manual Steps:**

```bash
- [ ] npm install @e2b/desktop
- [ ] Sign up at https://e2b.dev
- [ ] Get API key from dashboard
```

**Environment Setup:**

```env
# .env.local (add)
E2B_API_KEY=your_e2b_api_key
```

**Expected Code:**

```typescript
// lib/computer-use/sandbox.ts
import { DesktopSandbox } from '@e2b/desktop';

export class ComputerUseSandbox {
  private sandbox: DesktopSandbox | null = null;

  async initialize() {
    this.sandbox = await DesktopSandbox.create({
      apiKey: process.env.E2B_API_KEY,
    });
    return this.sandbox;
  }

  async screenshot() {
    if (!this.sandbox) throw new Error('Sandbox not initialized');
    return await this.sandbox.screenshot();
  }

  async executeAction(action: string, params: any) {
    if (!this.sandbox) throw new Error('Sandbox not initialized');
    
    switch (action) {
      case 'click':
        return await this.sandbox.click(params.x, params.y);
      case 'type':
        return await this.sandbox.type(params.text);
      case 'screenshot':
        return await this.screenshot();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async cleanup() {
    if (this.sandbox) {
      await this.sandbox.close();
      this.sandbox = null;
    }
  }
}
```

### Module 4.2: Implement Computer Use Tools

**Objective:** Create Anthropic computer use tools

**Copy this prompt to Claude/GPT:**

```
Implement Anthropic computer use tools:
1. Create computer tool for mouse/keyboard control
2. Implement bash tool for terminal commands
3. Add text editor tool for file operations
4. Integrate with E2B sandbox
5. Add proper input validation
6. Implement security restrictions
7. Add comprehensive error handling

Include safety checks and sandboxing.
```

**Expected Code:**

```typescript
// lib/computer-use/tools.ts
import { anthropic } from '@ai-sdk/anthropic';
import { ComputerUseSandbox } from './sandbox';

export function createComputerTools(sandbox: ComputerUseSandbox) {
  const computerTool = anthropic.tools.computer_20250124({
    displayWidthPx: 1024,
    displayHeightPx: 768,
    execute: async ({ action, coordinate, text }) => {
      switch (action) {
        case 'screenshot':
          const screenshot = await sandbox.screenshot();
          return {
            type: 'image',
            data: screenshot,
          };
        case 'mouse_move':
        case 'left_click':
        case 'right_click':
          await sandbox.executeAction(action, { x: coordinate?.[0], y: coordinate?.[1] });
          return 'Action executed';
        case 'type':
          await sandbox.executeAction('type', { text });
          return 'Text typed';
        case 'key':
          await sandbox.executeAction('key', { key: text });
          return 'Key pressed';
        default:
          throw new Error(`Unknown computer action: ${action}`);
      }
    },
    toModelOutput(result) {
      return typeof result === 'string'
        ? [{ type: 'text', text: result }]
        : [{ type: 'image', data: result.data, mediaType: 'image/png' }];
    },
  });

  const bashTool = anthropic.tools.bash_20250124({
    execute: async ({ command }) => {
      // Execute in sandbox, not host!
      const result = await sandbox.executeAction('bash', { command });
      return result;
    },
  });

  return { computerTool, bashTool };
}
```

### Module 4.3: Create Computer Use Agent

**Objective:** Build specialized agent for computer control tasks

**Copy this prompt to Claude/GPT:**

```
Create computer use agent:
1. Define agent with computer tools
2. Add safety constraints in system prompt
3. Implement approval workflow for sensitive actions
4. Add step-by-step execution logging
5. Create UI for viewing computer actions
6. Implement abort/pause functionality
7. Add session recording

Include security best practices.
```

**Expected Code:**

```typescript
// lib/ai/agents/computer-agent.ts
import { Agent, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createComputerTools } from '@/lib/computer-use/tools';
import { ComputerUseSandbox } from '@/lib/computer-use/sandbox';

export async function createComputerAgent() {
  const sandbox = new ComputerUseSandbox();
  await sandbox.initialize();
  
  const { computerTool, bashTool } = createComputerTools(sandbox);

  return new Agent({
    model: anthropic('claude-sonnet-4-5'),
    system: `You are a careful computer use agent. Rules:
1. Always take a screenshot before acting
2. Verify you're on the correct page/app
3. Only perform requested actions
4. Report each step clearly
5. Stop immediately if anything unexpected occurs
6. Never access sensitive information without permission`,
    tools: {
      computer: computerTool,
      bash: bashTool,
    },
    stopWhen: stepCountIs(20),
  });
}
```

### Module 4.4: Add Security Layer

**Objective:** Implement security controls for computer use

**Copy this prompt to Claude/GPT:**

```
Add security layer for computer use:
1. Create approval system for dangerous operations
2. Implement action whitelist/blacklist
3. Add rate limiting
4. Create audit logging
5. Implement prompt injection detection
6. Add network isolation options
7. Create security alert system

Follow OWASP best practices.
```

**Expected Code:**

```typescript
// lib/computer-use/security.ts
const DANGEROUS_ACTIONS = [
  'delete', 'rm', 'format', 'sudo', 
  'chmod', 'chown', 'kill'
];

const BLOCKED_DOMAINS = [
  'banking.com', 'payment-processor.com'
];

export async function validateComputerAction(
  action: string, 
  params: any
): Promise<{ approved: boolean; reason?: string }> {
  // Check for dangerous commands
  if (DANGEROUS_ACTIONS.some(cmd => action.includes(cmd))) {
    return { 
      approved: false, 
      reason: 'Action requires user approval' 
    };
  }

  // Check URL access
  if (params.url && BLOCKED_DOMAINS.some(d => params.url.includes(d))) {
    return { 
      approved: false, 
      reason: 'Domain access blocked' 
    };
  }

  return { approved: true };
}

export function auditLog(action: string, params: any, result: any) {
  console.log('[COMPUTER USE AUDIT]', {
    timestamp: new Date().toISOString(),
    action,
    params,
    result,
  });
}
```

**Verification:**

```bash
- [ ] Test sandbox initialization
- [ ] Verify screenshot capture works
- [ ] Test basic computer actions
- [ ] Verify security blocks dangerous actions
- [ ] Test audit logging
```

---

## Phase 5: Custom Apps

**Goal:** Build specialized applications using AI capabilities

**Time Estimate:** 2-3 hours

### Module 5.1: Create Code Review App

**Objective:** Build automated code review application

**Copy this prompt to Claude/GPT:**

```
Create code review application:
1. Create /app/code-review page
2. Implement file upload for code
3. Create specialized code review agent
4. Add multi-aspect review (security, performance, style)
5. Display results with Code Block component
6. Add download review report feature
7. Implement suggestion application workflow

Use parallel agent pattern for multiple review aspects.
```

**Expected Code Structure:**

```typescript
// app/code-review/page.tsx
'use client';

import { useState } from 'react';
import { CodeBlock } from '@/components/ai-elements/code-block';

export default function CodeReviewPage() {
  const [code, setCode] = useState('');
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleReview = async () => {
    setLoading(true);
    const response = await fetch('/api/code-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const result = await response.json();
    setReview(result);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Code Review</h1>
      
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code here..."
        className="w-full h-64 p-4 border rounded font-mono"
      />
      
      <button 
        onClick={handleReview}
        disabled={loading || !code}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Reviewing...' : 'Review Code'}
      </button>

      {review && (
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Security</h2>
            <p>{review.security}</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3">Performance</h2>
            <p>{review.performance}</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3">Code Style</h2>
            <p>{review.style}</p>
          </section>
        </div>
      )}
    </div>
  );
}
```

```typescript
// app/api/code-review/route.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const reviewSchema = z.object({
  security: z.string(),
  performance: z.string(),
  style: z.string(),
  overall_score: z.number().min(0).max(10),
});

export async function POST(req: Request) {
  const { code } = await req.json();

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-5'),
    schema: reviewSchema,
    system: 'You are an expert code reviewer.',
    prompt: `Review this code for security, performance, and style:\n\n${code}`,
  });

  return Response.json(object);
}
```

### Module 5.2: Build Content Generator App

**Objective:** Create multi-format content generation tool

**Copy this prompt to Claude/GPT:**

```
Create content generator application:
1. Create /app/content-generator page
2. Support multiple formats (blog, tweet, email, docs)
3. Add tone selection (professional, casual, technical)
4. Implement content refinement loop
5. Add export options (markdown, HTML, PDF)
6. Create content template library
7. Add SEO optimization suggestions

Use evaluator-optimizer pattern for quality improvement.
```

### Module 5.3: Create Data Analysis App

**Objective:** Build AI-powered data analysis dashboard

**Copy this prompt to Claude/GPT:**

```
Create data analysis application:
1. Create /app/data-analysis page
2. Implement CSV/JSON file upload
3. Add automatic data profiling
4. Create natural language query interface
5. Generate visualizations with charts
6. Provide insights and recommendations
7. Add export analysis report feature

Use structured object generation for analysis results.
```

**Verification:**

```bash
- [ ] Test each custom app
- [ ] Verify file uploads work
- [ ] Test analysis quality
- [ ] Check export functionality
```

---

## Phase 6: RAG Implementation

**Goal:** Implement Retrieval Augmented Generation

**Time Estimate:** 2-3 hours

### Module 6.1: Set Up Vector Database

**Objective:** Configure Pinecone or similar vector store

**Copy this prompt to Claude/GPT:**

```
Set up vector database for RAG:
1. Choose vector DB (Pinecone, Weaviate, or Qdrant)
2. Install required packages
3. Create database initialization script
4. Implement embedding generation
5. Create indexing utilities
6. Add similarity search function
7. Implement vector store management

Include error handling and connection pooling.
```

**Manual Steps (Pinecone example):**

```bash
- [ ] npm install @pinecone-database/pinecone
- [ ] Sign up at https://www.pinecone.io/
- [ ] Create index in Pinecone dashboard
- [ ] Get API key
```

**Environment Setup:**

```env
# .env.local (add)
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=your_index_name
```

**Expected Code:**

```typescript
// lib/rag/vector-store.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX!);

export async function embedText(text: string) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

export async function storeDocument(doc: { id: string; text: string; metadata: any }) {
  const embedding = await embedText(doc.text);
  
  await index.upsert([{
    id: doc.id,
    values: embedding,
    metadata: {
      text: doc.text,
      ...doc.metadata,
    },
  }]);
}

export async function searchSimilar(query: string, topK: number = 5) {
  const queryEmbedding = await embedText(query);
  
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });
  
  return results.matches;
}
```

### Module 6.2: Create Document Ingestion Pipeline

**Objective:** Build system for processing and indexing documents

**Copy this prompt to Claude/GPT:**

```
Create document ingestion pipeline:
1. Support multiple formats (PDF, TXT, MD, DOCX)
2. Implement text extraction
3. Add chunking strategy (semantic or fixed-size)
4. Create metadata extraction
5. Implement batch processing
6. Add progress tracking
7. Create re-indexing functionality

Handle large documents efficiently.
```

**Expected Code:**

```typescript
// lib/rag/ingestion.ts
import { storeDocument } from './vector-store';

export async function chunkText(text: string, chunkSize: number = 500): Promise<string[]> {
  const words = text.split(' ');
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  
  return chunks;
}

export async function ingestDocument(doc: {
  filename: string;
  content: string;
  metadata?: any;
}) {
  const chunks = await chunkText(doc.content);
  
  for (let i = 0; i < chunks.length; i++) {
    await storeDocument({
      id: `${doc.filename}-chunk-${i}`,
      text: chunks[i],
      metadata: {
        filename: doc.filename,
        chunkIndex: i,
        totalChunks: chunks.length,
        ...doc.metadata,
      },
    });
  }
}
```

### Module 6.3: Implement RAG Chat

**Objective:** Integrate RAG into chat interface

**Copy this prompt to Claude/GPT:**

```
Integrate RAG into chat:
1. Create RAG-enabled API route
2. Implement query → retrieve → generate flow
3. Add source citation display
4. Show relevance scores
5. Implement context window management
6. Add fallback when no relevant docs found
7. Create document management UI

Use AI Elements Sources component for citations.
```

**Expected Code:**

```typescript
// app/api/chat-rag/route.ts
import { streamText, convertToModelMessages } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { searchSimilar } from '@/lib/rag/vector-store';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];
  
  // Retrieve relevant documents
  const relevantDocs = await searchSimilar(lastMessage.content, 5);
  
  // Build context from retrieved documents
  const context = relevantDocs
    .map(doc => doc.metadata.text)
    .join('\n\n');
  
  const systemPrompt = `You are a helpful assistant. Use the following context to answer questions:

${context}

If the context doesn't contain relevant information, say so clearly.`;

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
  });
  
  return result.toUIMessageStreamResponse({
    sendSources: true,
  });
}
```

### Module 6.4: Add Document Management UI

**Objective:** Create interface for managing RAG knowledge base

**Copy this prompt to Claude/GPT:**

```
Create document management interface:
1. Create /app/knowledge-base page
2. Implement file upload with progress
3. Show indexed documents list
4. Add document deletion
5. Display indexing status
6. Show vector count and stats
7. Add search testing interface

Include proper error handling and validation.
```

**Verification:**

```bash
- [ ] Upload test documents
- [ ] Verify chunks are created
- [ ] Test RAG chat with indexed docs
- [ ] Verify source citations appear
- [ ] Test document deletion
```

---

## Deployment Guide

### Module 7.1: Prepare for Production

**Objective:** Production-ready configuration

**Copy this prompt to Claude/GPT:**

```
Prepare application for production:
1. Add environment variable validation
2. Implement rate limiting
3. Add request caching
4. Configure error monitoring (Sentry)
5. Add analytics (PostHog or similar)
6. Implement health check endpoints
7. Add logging infrastructure
8. Create deployment documentation

Include security hardening steps.
```

**Checklist:**

```bash
- [ ] All API keys in environment variables
- [ ] Rate limiting configured
- [ ] Error boundaries added
- [ ] Logging implemented
- [ ] Security headers configured
- [ ] CORS properly set
- [ ] Analytics integrated
```

### Module 7.2: Deploy to Vercel

**Objective:** Deploy application to Vercel

**Manual Steps:**

```bash
- [ ] Install Vercel CLI: npm i -g vercel
- [ ] Run: vercel login
- [ ] Run: vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up preview deployments
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring
```

### Module 7.3: Set Up CI/CD

**Objective:** Automated testing and deployment

**Copy this prompt to Claude/GPT:**

```
Set up CI/CD pipeline:
1. Create GitHub Actions workflow
2. Add automated testing
3. Configure automatic deployments
4. Add preview deployments for PRs
5. Implement deployment notifications
6. Add rollback procedures
7. Create deployment checklist

Use GitHub Actions for Vercel.
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: MCP Server Won't Connect

**Solution:**
```bash
# Check if MCP server is running
ps aux | grep mcp

# Test MCP server directly
mcp dev path/to/server.py

# Verify python environment
which python3
```

#### Issue: Streaming Stops Prematurely

**Solution:**
```typescript
// Increase timeout in API route
export const maxDuration = 60; // Increase from 30

// Check for unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
```

#### Issue: Computer Use Sandbox Fails

**Solution:**
```bash
# Verify E2B API key
echo $E2B_API_KEY

# Check E2B account limits
# Visit https://e2b.dev/dashboard

# Test sandbox creation
node -e "require('@e2b/desktop').DesktopSandbox.create().then(console.log)"
```

#### Issue: RAG Retrieval Returns Irrelevant Results

**Solution:**
```typescript
// Adjust similarity threshold
const results = await index.query({
  vector: queryEmbedding,
  topK: 10,
  includeMetadata: true,
  filter: { score: { $gte: 0.7 } } // Only high relevance
});

// Improve chunking strategy
export async function semanticChunk(text: string) {
  // Use AI to create semantic chunks
}
```

---

## Next Steps and Extensions

### Additional Features to Implement

1. **Multi-modal Support**
   - Image generation with DALL-E 3
   - Image understanding with vision models
   - Audio transcription with Whisper

2. **Advanced Agent Patterns**
   - Long-term memory systems
   - Agent learning from feedback
   - Multi-agent debates

3. **Enhanced Security**
   - Prompt injection detection
   - Content filtering
   - Usage monitoring

4. **Performance Optimization**
   - Response caching
   - Streaming optimization
   - Database query optimization

5. **User Management**
   - Authentication (NextAuth.js)
   - User preferences
   - Chat history per user
   - Usage tracking

### Creating New Tutorials

**Template for New Feature Tutorials:**

```markdown
## Feature Name

**Goal:** [Clear objective]
**Time Estimate:** [Hours needed]

### Module X.1: Setup
**Objective:** [Specific goal]

**Copy this prompt to Claude/GPT:**
[Detailed prompt for AI coding agent]

**Manual Steps:**
- [ ] Step 1
- [ ] Step 2

**Expected Code:**
[Code example with comments]

**Verification:**
- [ ] Test 1
- [ ] Test 2
```

---

## Resources

### Official Documentation
- AI SDK v5: https://ai-sdk.dev
- AI Elements: https://ai-sdk.dev/elements  
- MCP Specification: https://modelcontextprotocol.io
- Anthropic Docs: https://docs.anthropic.com
- OpenAI Docs: https://platform.openai.com/docs

### Community Resources
- AI SDK GitHub: https://github.com/vercel/ai
- AI SDK Discord: [Join via website]
- MCP Examples: https://github.com/modelcontextprotocol/servers

### Tools and Libraries
- E2B: https://e2b.dev
- Cursor IDE: https://cursor.sh
- Smithery: https://smithery.ai
- Composio: https://composio.dev

---

## Conclusion

You now have a complete, production-ready AI application with:
- ✅ Streaming chat with reasoning display
- ✅ MCP integration for tool connectivity
- ✅ Pluggable agent system
- ✅ Computer use capabilities
- ✅ Custom specialized applications
- ✅ RAG for knowledge augmentation

Each module can be extended independently. The KISSS principle ensures your foundation remains simple while supporting complex features through composition.

**Recommended Learning Path:**
1. Master Phase 1 (chat basics) thoroughly
2. Add one MCP server at a time in Phase 2
3. Experiment with agent patterns in Phase 3
4. Approach computer use (Phase 4) carefully with security focus
5. Build custom apps (Phase 5) based on your needs
6. Add RAG (Phase 6) when you need knowledge augmentation

**For Help:**
- Check troubleshooting section first
- Review official docs for detailed API references
- Join AI SDK Discord for community support
- Use Cursor's AI features to debug issues

Happy building! 🚀