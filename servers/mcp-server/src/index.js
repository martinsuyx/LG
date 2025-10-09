const fs = require('fs');
const path = require('path');
const readline = require('readline');

const conversationFile = path.join(__dirname, '..', 'data', 'conversation.json');

function loadConversation() {
  if (!fs.existsSync(conversationFile)) {
    return { entries: [] };
  }
  try {
    const raw = fs.readFileSync(conversationFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.entries)) {
      return parsed;
    }
  } catch (error) {
    console.error('[mcp-server] Failed to read conversation log, starting fresh.', error);
  }
  return { entries: [] };
}

function persistConversation(state) {
  const payload = JSON.stringify(state, null, 2);
  fs.writeFileSync(conversationFile, payload, 'utf8');
}

function appendConversationEntry(entry) {
  conversationState.entries.push(entry);
  persistConversation(conversationState);
}

const conversationState = loadConversation();

const requestHandlers = {
  initialize(request) {
    state.initialized = true;
    return {
      protocolVersion: '0.1.0',
      serverInfo: {
        name: 'demo-admin-mcp-server',
        version: '0.1.0'
      },
      capabilities: {
        tools: { list: true, call: true },
        resources: { list: true, read: true }
      }
    };
  },

  ping() {
    return { timestamp: new Date().toISOString() };
  },

  'tools/list'() {
    return {
      tools: [
        {
          name: 'log_message',
          description: 'Append a message to the conversation log stored by the MCP server.',
          inputSchema: {
            type: 'object',
            required: ['role', 'content'],
            properties: {
              role: {
                type: 'string',
                enum: ['system', 'user', 'assistant', 'tool']
              },
              content: {
                type: 'string'
              },
              metadata: {
                type: 'object',
                additionalProperties: true
              }
            },
            additionalProperties: false
          }
        },
        {
          name: 'export_conversation',
          description: 'Return the full conversation log as a JSON string.',
          inputSchema: {
            type: 'object',
            additionalProperties: false
          }
        }
      ]
    };
  },

  'tools/call'(request) {
    const params = request.params || {};
    const toolName = params.name;
    const args = params.arguments || {};

    if (toolName === 'log_message') {
      const { role, content, metadata } = args;
      if (typeof role !== 'string' || typeof content !== 'string') {
        return {
          error: {
            code: -32602,
            message: 'Invalid arguments for log_message. Expected string role and content.'
          }
        };
      }

      const entry = {
        role,
        content,
        metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
        timestamp: new Date().toISOString()
      };
      appendConversationEntry(entry);
      return { success: true, entry };
    }

    if (toolName === 'export_conversation') {
      return {
        success: true,
        conversation: conversationState.entries
      };
    }

    return {
      error: {
        code: -32601,
        message: `Tool "${toolName}" is not registered.`
      }
    };
  },

  'resources/list'() {
    return {
      resources: [
        {
          uri: 'conversation://latest',
          name: 'Conversation Log',
          description: 'Chronological log of interactions recorded by the MCP server.',
          mimeType: 'application/json'
        }
      ]
    };
  },

  'resources/read'(request) {
    const params = request.params || {};
    if (params.uri !== 'conversation://latest') {
      return {
        error: {
          code: -32602,
          message: `Unknown resource URI "${params.uri}".`
        }
      };
    }
    return {
      resource: {
        uri: 'conversation://latest',
        mimeType: 'application/json',
        data: JSON.stringify(conversationState.entries, null, 2)
      }
    };
  },

  shutdown() {
    state.initialized = false;
    return { ok: true };
  }
};

const state = {
  initialized: false
};

function sendResponse(id, result) {
  const payload = {
    jsonrpc: '2.0',
    id,
    result
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function sendError(id, code, message, data) {
  const payload = {
    jsonrpc: '2.0',
    id: typeof id === 'undefined' ? null : id,
    error: { code, message, data }
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function handleRequest(request) {
  const { id, method } = request;

  if (typeof method !== 'string') {
    sendError(id, -32600, 'Invalid request method.');
    return;
  }

  const handler = requestHandlers[method];

  if (!handler) {
    sendError(id, -32601, `Method "${method}" not found.`);
    return;
  }

  const outcome = handler(request);

  if (outcome && outcome.error) {
    const error = outcome.error;
    sendError(id, error.code || -32000, error.message || 'Unhandled error.', error.data);
    return;
  }

  if (typeof id !== 'undefined') {
    sendResponse(id, outcome);
  }
}

function handleMessage(line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return;
  }

  let message;
  try {
    message = JSON.parse(trimmed);
  } catch (parseError) {
    console.error('[mcp-server] Failed to parse message', parseError);
    sendError(undefined, -32700, 'Invalid JSON received by MCP server.');
    return;
  }

  if (Array.isArray(message)) {
    message.forEach(handleRequest);
    return;
  }

  if (message && message.jsonrpc === '2.0') {
    handleRequest(message);
    return;
  }

  sendError(message && message.id, -32600, 'Invalid request.');
}

process.stdin.setEncoding('utf8');

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

rl.on('line', handleMessage);

rl.on('close', () => {
  if (state.initialized) {
    state.initialized = false;
  }
  process.exit(0);
});

console.error('[mcp-server] Listening for MCP messages on STDIN.');
