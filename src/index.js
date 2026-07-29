#!/usr/bin/env node

/**
 * Roka MCP Server
 * 
 * MCP integration for Roka — connect Cursor, Claude Code, Codex, or Copilot 
 * to prune logs inside your agent.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const ROKA_API_URL = process.env.ROKA_API_URL || 'https://api.roka-prune.com';
const ROKA_API_KEY = process.env.ROKA_API_KEY;

if (!ROKA_API_KEY) {
  console.error('ROKA_API_KEY environment variable is required');
  process.exit(1);
}

const server = new Server(
  {
    name: 'roka-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'prune_logs',
        description: 'Prune raw log text to fit within token budget while preserving critical information',
        inputSchema: {
          type: 'object',
          properties: {
            logs: {
              type: 'string',
              description: 'Raw log text to prune'
            },
            query: {
              type: 'string',
              description: 'What to focus on — plain English or keywords',
              default: 'summarize'
            },
            budget: {
              type: 'number',
              description: 'Token budget for the output',
              default: 8000
            }
          },
          required: ['logs']
        }
      },
      {
        name: 'prune_file',
        description: 'Prune a log file by path',
        inputSchema: {
          type: 'object',
          properties: {
            filepath: {
              type: 'string',
              description: 'Path to the log file'
            },
            query: {
              type: 'string',
              description: 'What to focus on — plain English or keywords',
              default: 'summarize'
            },
            budget: {
              type: 'number',
              description: 'Token budget for the output',
              default: 8000
            }
          },
          required: ['filepath']
        }
      },
      {
        name: 'prune_tail',
        description: 'Prune the last N lines of a live log',
        inputSchema: {
          type: 'object',
          properties: {
            filepath: {
              type: 'string',
              description: 'Path to the log file'
            },
            lines: {
              type: 'number',
              description: 'Number of lines to read from the end',
              default: 1000
            },
            query: {
              type: 'string',
              description: 'What to focus on — plain English or keywords',
              default: 'summarize'
            },
            budget: {
              type: 'number',
              description: 'Token budget for the output',
              default: 8000
            }
          },
          required: ['filepath']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    
    switch (name) {
      case 'prune_logs':
        result = await pruneLogs(args.logs, args.query, args.budget);
        break;
      case 'prune_file':
        result = await pruneFile(args.filepath, args.query, args.budget);
        break;
      case 'prune_tail':
        result = await pruneTail(args.filepath, args.lines, args.query, args.budget);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

async function callRokaAPI(logs, query = 'summarize', budget = 8000) {
  const response = await fetch(`${ROKA_API_URL}/prune`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ROKA_API_KEY}`
    },
    body: JSON.stringify({
      logs,
      query,
      budget
    })
  });

  if (!response.ok) {
    throw new Error(`Roka API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.pruned_logs || data.result || data;
}

async function pruneLogs(logs, query, budget) {
  return await callRokaAPI(logs, query, budget);
}

async function pruneFile(filepath, query, budget) {
  const fs = await import('fs');
  const logs = fs.readFileSync(filepath, 'utf-8');
  return await callRokaAPI(logs, query, budget);
}

async function pruneTail(filepath, lines, query, budget) {
  const fs = await import('fs');
  const { execSync } = await import('child_process');
  
  const logs = execSync(`tail -n ${lines} ${filepath}`, { encoding: 'utf-8' });
  return await callRokaAPI(logs, query, budget);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Roka MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
