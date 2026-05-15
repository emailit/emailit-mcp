import { z } from 'zod';

export function addApiKeyTools(server, apiClient) {
  server.registerTool(
    'create-api-key',
    {
      title: 'Create API Key',
      description:
        'Create a new API key in Emailit. The key value is only shown once upon creation, so you MUST display it to the user.',
      inputSchema: {
        name: z.string().nonempty().describe('The name of the API key for identification.'),
        scope: z
          .enum(['full', 'sending'])
          .optional()
          .describe('The scope of the API key (default: "full").'),
        sending_domain_id: z
          .number()
          .optional()
          .describe('Restrict this key to a specific sending domain ID.'),
      },
    },
    async ({ name, scope, sending_domain_id }) => {
      const body = { name };
      if (scope) body.scope = scope;
      if (sending_domain_id !== undefined) body.sending_domain_id = sending_domain_id;

      const data = await apiClient.request('POST', '/api-keys', { body });

      return {
        content: [
          { type: 'text', text: 'API key created successfully.' },
          { type: 'text', text: `Name: ${data.name}\nID: ${data.id}\nScope: ${data.scope}\nKey: ${data.key}` },
          {
            type: 'text',
            text: 'IMPORTANT: The key above is only shown once. You MUST display it to the user so they can save it.',
          },
        ],
      };
    },
  );

  server.registerTool(
    'get-api-key',
    {
      title: 'Get API Key',
      description: 'Retrieve information about a specific API key.',
      inputSchema: {
        id: z.string().nonempty().describe('The API key ID.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/api-keys/${encodeURIComponent(id)}`);

      return {
        content: [
          {
            type: 'text',
            text: `Name: ${data.name}\nID: ${data.id}\nScope: ${data.scope}\nLast Used: ${data.last_used_at || 'Never'}\nCreated: ${data.created_at}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'list-api-keys',
    {
      title: 'List API Keys',
      description: 'List all API keys in your Emailit account.',
      inputSchema: {
        page: z.number().min(1).optional().describe('Page number (default: 1).'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (max: 100).'),
      },
    },
    async ({ page, limit }) => {
      const data = await apiClient.request('GET', '/api-keys', { query: { page, limit } });
      const keys = data.data || [];

      if (keys.length === 0) {
        return { content: [{ type: 'text', text: 'No API keys found.' }] };
      }

      return {
        content: [
          { type: 'text', text: `Found ${keys.length} API key(s):` },
          ...keys.map((k) => ({
            type: 'text',
            text: `Name: ${k.name}\nID: ${k.id}\nScope: ${k.scope}\nLast Used: ${k.last_used_at || 'Never'}\nCreated: ${k.created_at}`,
          })),
          ...(data.next_page_url
            ? [{ type: 'text', text: 'More API keys available. Increase the page number to see more.' }]
            : []),
        ],
      };
    },
  );

  server.registerTool(
    'update-api-key',
    {
      title: 'Update API Key',
      description: 'Update the name of an existing API key.',
      inputSchema: {
        id: z.string().nonempty().describe('The API key ID.'),
        name: z.string().nonempty().describe('The new name for the API key.'),
      },
    },
    async ({ id, name }) => {
      const data = await apiClient.request('POST', `/api-keys/${encodeURIComponent(id)}`, {
        body: { name },
      });

      return {
        content: [
          { type: 'text', text: 'API key updated successfully.' },
          { type: 'text', text: `Name: ${data.name}\nID: ${data.id}` },
        ],
      };
    },
  );

  server.registerTool(
    'delete-api-key',
    {
      title: 'Delete API Key',
      description:
        'Delete an API key from your Emailit account. Before using this tool, you MUST double-check with the user. Warn that this is irreversible and any services using it will lose access.',
      inputSchema: {
        id: z.string().nonempty().describe('The API key ID.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('DELETE', `/api-keys/${encodeURIComponent(id)}`);

      return {
        content: [{ type: 'text', text: `API key "${data.name}" deleted successfully.` }],
      };
    },
  );
}
