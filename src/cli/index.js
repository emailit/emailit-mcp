import minimist from 'minimist';

export function parseArgs(argv) {
  return minimist(argv, {
    string: ['key', 'sender', 'reply-to', 'port'],
    boolean: ['help', 'http'],
    alias: { h: 'help' },
  });
}

function parseReplierAddresses(parsed, env) {
  if (Array.isArray(parsed['reply-to'])) return parsed['reply-to'];
  if (typeof parsed['reply-to'] === 'string') return [parsed['reply-to']];
  const v = env.REPLY_TO_EMAIL_ADDRESSES;
  if (typeof v === 'string' && v.trim()) {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

const HELP_TEXT = `
Emailit MCP Server

Usage:
  emailit-mcp [options]

Options:
  --key <key>         Emailit API key (or EMAILIT_API_KEY env var)
  --sender <email>    Default sender email address (or SENDER_EMAIL_ADDRESS env var)
  --reply-to <email>  Default reply-to address (repeatable, or REPLY_TO_EMAIL_ADDRESSES env var)
  --http              Use HTTP transport instead of stdio
  --port <port>       HTTP port (default: 3000, or MCP_PORT env var)
  -h, --help          Show this help message
`.trim();

export function resolveConfig(parsed, env) {
  const transport = parsed.http ? 'http' : 'stdio';
  const apiKey = parsed.key || env.EMAILIT_API_KEY || '';
  const senderEmailAddress = parsed.sender || env.SENDER_EMAIL_ADDRESS || '';
  const replierEmailAddresses = parseReplierAddresses(parsed, env);
  const port = parseInt(parsed.port || env.MCP_PORT || '3000', 10);

  if (transport === 'stdio' && !apiKey) {
    return { ok: false, error: 'API key is required for stdio mode. Use --key or set EMAILIT_API_KEY.' };
  }

  return {
    ok: true,
    config: {
      transport,
      apiKey,
      senderEmailAddress,
      replierEmailAddresses,
      port,
    },
  };
}

export function resolveConfigOrExit(parsed, env = process.env) {
  if (parsed.help === true || parsed.h === true) {
    console.error(HELP_TEXT);
    process.exit(0);
  }

  const result = resolveConfig(parsed, env);
  if (!result.ok) {
    console.error('Error:', result.error);
    process.exit(1);
  }
  return result.config;
}
