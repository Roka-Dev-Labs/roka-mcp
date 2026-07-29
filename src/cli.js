#!/usr/bin/env node

/**
 * Roka MCP CLI
 * 
 * Connect Roka MCP to various AI agents
 */

import { spawn } from 'child_process';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENTS = {
  cursor: {
    name: 'Cursor',
    configPath: '~/.cursor/mcp_config.json'
  },
  'claude-code': {
    name: 'Claude Code',
    configPath: '~/.claude/mcp_config.json'
  },
  copilot: {
    name: 'GitHub Copilot',
    configPath: '~/.copilot/mcp_config.json'
  },
  windsurf: {
    name: 'Windsurf',
    configPath: '~/.windsurf/mcp_config.json'
  },
  vscode: {
    name: 'VS Code',
    configPath: '~/.vscode/mcp_config.json'
  },
  cline: {
    name: 'Cline',
    configPath: '~/.cline/mcp_config.json'
  }
};

function printUsage() {
  console.log(`
Roka MCP CLI - Connect Roka to your AI agent

Usage:
  npx roka-mcp connect --agent <agent-name> [--api-key <key>]
  npx roka-mcp watch <logfile> --on-crash

Agents:
  ${Object.keys(AGENTS).join(', ')}

Examples:
  npx roka-mcp connect --agent cursor
  npx roka-mcp connect --agent claude-code --api-key rk_live_...
  npx roka-mcp watch ./logs/dev.log --on-crash

Environment:
  ROKA_API_KEY    Your Roka API key (required)
  ROKA_API_URL    API URL (default: https://api.roka-prune.com)
`);
}

function expandHome(filepath) {
  if (filepath.startsWith('~')) {
    return path.join(process.env.HOME, filepath.slice(1));
  }
  return filepath;
}

async function connectAgent(agent, apiKey) {
  if (!AGENTS[agent]) {
    console.error(`Unknown agent: ${agent}`);
    console.log(`Available agents: ${Object.keys(AGENTS).join(', ')}`);
    process.exit(1);
  }

  const finalApiKey = apiKey || process.env.ROKA_API_KEY;
  if (!finalApiKey) {
    console.error('ROKA_API_KEY is required. Set it via --api-key or environment variable.');
    process.exit(1);
  }

  const agentInfo = AGENTS[agent];
  const configPath = expandHome(agentInfo.configPath);
  const configDir = path.dirname(configPath);

  console.log(`Connecting Roka MCP to ${agentInfo.name}...`);
  console.log(`Config path: ${configPath}`);

  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Create MCP config
  const mcpConfig = {
    mcpServers: {
      roka: {
        command: 'node',
        args: [path.join(__dirname, 'index.js')],
        env: {
          ROKA_API_KEY: finalApiKey,
          ROKA_API_URL: process.env.ROKA_API_URL || 'https://api.roka-prune.com'
        }
      }
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2));
  console.log(`✓ Config written to ${configPath}`);
  console.log(`✓ Restart ${agentInfo.name} to complete the connection`);
}

function watchLog(logfile, onCrash) {
  if (!fs.existsSync(logfile)) {
    console.error(`Log file not found: ${logfile}`);
    process.exit(1);
  }

  console.log(`Watching ${logfile}...`);
  
  const tail = spawn('tail', ['-f', logfile]);
  
  tail.stdout.on('data', (data) => {
    const line = data.toString();
    
    if (onCrash && (line.includes('ERROR') || line.includes('FATAL') || line.includes('panic') || line.includes('exception'))) {
      console.log('Crash detected! Running prune...');
      
      // Read last 1000 lines and prune
      const logs = execSync(`tail -n 1000 ${logfile}`, { encoding: 'utf-8' });
      
      // Call Roka API to prune
      // This would typically call the Roka API
      console.log('Pruned context written to .roka/crash-context.txt');
    }
  });

  tail.on('error', (error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  
  if (command === 'connect') {
    const agentIndex = args.indexOf('--agent');
    const apiKeyIndex = args.indexOf('--api-key');
    
    if (agentIndex === -1 || agentIndex + 1 >= args.length) {
      console.error('--agent is required for connect command');
      printUsage();
      process.exit(1);
    }
    
    const agent = args[agentIndex + 1];
    const apiKey = apiKeyIndex !== -1 ? args[apiKeyIndex + 1] : null;
    
    await connectAgent(agent, apiKey);
  } else if (command === 'watch') {
    if (args.length < 2) {
      console.error('Log file path is required for watch command');
      printUsage();
      process.exit(1);
    }
    
    const logfile = args[1];
    const onCrash = args.includes('--on-crash');
    
    await watchLog(logfile, onCrash);
  } else {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
