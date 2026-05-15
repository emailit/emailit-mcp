import { z } from 'zod';

export function addSuppressionTools(server, apiClient) {
  server.registerTool(
    'create-suppression',
    {
      title: 'Create Suppression',
      description: 'Add an email address to the suppression list to prevent sending emails to that address.',
      inputSchema: {
        email: z.string().email().describe('Email address to suppress.'),
        type: z
          .enum(['recipient', 'bounce', 'complaint', 'unsubscribe'])
          .optional()
          .describe('Suppression type (default: "recipient").'),
        reason: z.string().optional().describe('Human-readable reason for the suppression.'),
        keep_until: z
          .string()
          .optional()
          .describe('Expiration timestamp in ISO 8601 format. Null for permanent suppression.'),
      },
    },
    async ({ email, type, reason, keep_until }) => {
      const body = { email };
      if (type !== undefined) body.type = type;
      if (reason !== undefined) body.reason = reason;
      if (keep_until !== undefined) body.keep_until = keep_until;

      const data = await apiClient.request('POST', '/suppressions', { body });

      return {
        content: [
          { type: 'text', text: 'Suppression created successfully.' },
          {
            type: 'text',
            text: `Email: ${data.email}\nID: ${data.id}\nType: ${data.type}\nReason: ${data.reason || 'N/A'}\nKeep Until: ${data.keep_until || 'Permanent'}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'get-suppression',
    {
      title: 'Get Suppression',
      description: 'Retrieve a single suppression by ID or email address.',
      inputSchema: {
        id: z.string().nonempty().describe('Suppression ID (sup_xxx) or email address.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/suppressions/${encodeURIComponent(id)}`);

      return {
        content: [
          {
            type: 'text',
            text: `Email: ${data.email}\nID: ${data.id}\nType: ${data.type}\nReason: ${data.reason || 'N/A'}\nTimestamp: ${data.timestamp}\nKeep Until: ${data.keep_until || 'Permanent'}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'list-suppressions',
    {
      title: 'List Suppressions',
      description: 'List all suppressions in your workspace.',
      inputSchema: {
        page: z.number().min(1).optional().describe('Page number (default: 1).'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (default: 10, max: 100).'),
      },
    },
    async ({ page, limit }) => {
      const data = await apiClient.request('GET', '/suppressions', { query: { page, limit } });
      const suppressions = data.data || [];

      if (suppressions.length === 0) {
        return { content: [{ type: 'text', text: 'No suppressions found.' }] };
      }

      return {
        content: [
          { type: 'text', text: `Found ${suppressions.length} suppression(s):` },
          ...suppressions.map((s) => ({
            type: 'text',
            text: `Email: ${s.email}\nID: ${s.id}\nType: ${s.type}\nReason: ${s.reason || 'N/A'}\nTimestamp: ${s.timestamp}`,
          })),
          ...(data.next_page_url
            ? [{ type: 'text', text: 'More suppressions available. Increase the page number to see more.' }]
            : []),
        ],
      };
    },
  );

  server.registerTool(
    'update-suppression',
    {
      title: 'Update Suppression',
      description: 'Update an existing suppression. At least one field must be provided.',
      inputSchema: {
        id: z.string().nonempty().describe('Suppression ID (sup_xxx) or email address.'),
        email: z.string().email().optional().describe('New email address.'),
        type: z
          .enum(['recipient', 'bounce', 'complaint', 'unsubscribe'])
          .optional()
          .describe('New suppression type.'),
        reason: z.string().optional().describe('New reason for the suppression.'),
        keep_until: z
          .string()
          .nullable()
          .optional()
          .describe('New expiration timestamp (ISO 8601) or null for permanent.'),
      },
    },
    async ({ id, email, type, reason, keep_until }) => {
      const body = {};
      if (email !== undefined) body.email = email;
      if (type !== undefined) body.type = type;
      if (reason !== undefined) body.reason = reason;
      if (keep_until !== undefined) body.keep_until = keep_until;

      const data = await apiClient.request('POST', `/suppressions/${encodeURIComponent(id)}`, { body });

      return {
        content: [
          { type: 'text', text: 'Suppression updated successfully.' },
          { type: 'text', text: `Email: ${data.email}\nID: ${data.id}\nType: ${data.type}` },
        ],
      };
    },
  );

  server.registerTool(
    'delete-suppression',
    {
      title: 'Delete Suppression',
      description:
        'Remove a suppression to allow sending emails to that address again. Before using this tool, confirm with the user.',
      inputSchema: {
        id: z.string().nonempty().describe('Suppression ID (sup_xxx) or email address.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('DELETE', `/suppressions/${encodeURIComponent(id)}`);

      return {
        content: [{ type: 'text', text: `Suppression for "${data.email}" deleted successfully.` }],
      };
    },
  );
}
