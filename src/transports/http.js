import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { EmailitApiClient } from '../lib/api-client.js';
import { createMcpServer } from '../server.js';

const sessions = {};

function extractBearerToken(request) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export async function runHttp(options, port) {
  const fastify = Fastify({ logger: false });

  fastify.get('/health', async () => ({ status: 'ok' }));

  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      done(null, body ? JSON.parse(body) : undefined);
    } catch (err) {
      done(err);
    }
  });

  async function mcpHandler(request, reply) {
    const sessionId = request.headers['mcp-session-id'];
    let transport;

    if (sessionId && sessions[sessionId]) {
      transport = sessions[sessionId];
    } else if (!sessionId && request.method === 'POST' && isInitializeRequest(request.body)) {
      const apiKey = extractBearerToken(request);
      if (!apiKey) {
        return reply.code(401).send({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Unauthorized: provide an Emailit API key via Authorization: Bearer' },
          id: null,
        });
      }

      const apiClient = new EmailitApiClient(apiKey);

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          sessions[sid] = transport;
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && sessions[sid]) delete sessions[sid];
      };

      const server = createMcpServer(apiClient, options);
      await server.connect(transport);
    } else if (sessionId && !sessions[sessionId]) {
      return reply.code(404).send({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Session not found' },
        id: null,
      });
    } else {
      return reply.code(400).send({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
        id: null,
      });
    }

    const nodeReq = request.raw;
    nodeReq.body = request.body;
    await transport.handleRequest(nodeReq, reply.raw, request.body);
  }

  fastify.post('/mcp', mcpHandler);
  fastify.get('/mcp', mcpHandler);
  fastify.delete('/mcp', mcpHandler);

  await fastify.listen({ port, host: '127.0.0.1' });
  console.error(`Emailit MCP server listening on http://127.0.0.1:${port}`);
  console.error('  Streamable HTTP: POST/GET/DELETE /mcp');

  const shutdown = async () => {
    for (const sid of Object.keys(sessions)) {
      try { await sessions[sid].close(); } catch { /* ignore */ }
      delete sessions[sid];
    }
    await fastify.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
