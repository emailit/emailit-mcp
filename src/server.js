import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  addEmailTools,
  addDomainTools,
  addApiKeyTools,
  addAudienceTools,
  addContactTools,
  addTemplateTools,
  addSuppressionTools,
  addWebhookTools,
} from './tools/index.js';

export function createMcpServer(apiClient, options) {
  const server = new McpServer({
    name: 'emailit',
    version: '1.0.0',
  });

  addEmailTools(server, apiClient, options);
  addDomainTools(server, apiClient);
  addApiKeyTools(server, apiClient);
  addAudienceTools(server, apiClient);
  addContactTools(server, apiClient);
  addTemplateTools(server, apiClient);
  addSuppressionTools(server, apiClient);
  addWebhookTools(server, apiClient);

  return server;
}
