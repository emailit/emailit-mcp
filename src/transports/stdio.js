import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from '../server.js';

export async function runStdio(apiClient, options) {
  const server = createMcpServer(apiClient, options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Emailit MCP Server running on stdio');
}
