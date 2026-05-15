import { z } from 'zod';

export function addWebhookTools(server, apiClient) {
  server.registerTool(
    'create-webhook',
    {
      title: 'Create Webhook',
      description: 'Create a new webhook in your workspace. URL must be HTTPS and is validated against SSRF.',
      inputSchema: {
        name: z.string().nonempty().describe('Unique name within the workspace.'),
        url: z.string().url().describe('HTTPS endpoint URL.'),
        all_events: z.boolean().optional().describe('Subscribe to all event types (default: false).'),
        enabled: z.boolean().optional().describe('Whether the webhook is active (default: true).'),
        events: z
          .array(z.string())
          .optional()
          .describe(
            'Array of event type names to subscribe to. Ignored if all_events is true. Examples: email.delivered, email.bounced, contact.created',
          ),
      },
    },
    async ({ name, url, all_events, enabled, events }) => {
      const body = { name, url };
      if (all_events !== undefined) body.all_events = all_events;
      if (enabled !== undefined) body.enabled = enabled;
      if (events !== undefined) body.events = events;

      const data = await apiClient.request('POST', '/webhooks', { body });

      return {
        content: [
          { type: 'text', text: 'Webhook created successfully.' },
          {
            type: 'text',
            text: `Name: ${data.name}\nID: ${data.id}\nURL: ${data.url}\nEnabled: ${data.enabled}\nAll Events: ${data.all_events}\nEvents: ${(data.events || []).join(', ') || 'N/A'}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'get-webhook',
    {
      title: 'Get Webhook',
      description: 'Retrieve information about a specific webhook.',
      inputSchema: {
        id: z.string().nonempty().describe('The webhook ID (wh_xxx).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/webhooks/${encodeURIComponent(id)}`);

      return {
        content: [
          {
            type: 'text',
            text: `Name: ${data.name}\nID: ${data.id}\nURL: ${data.url}\nEnabled: ${data.enabled}\nAll Events: ${data.all_events}\nEvents: ${(data.events || []).join(', ') || 'N/A'}\nLast Used: ${data.last_used_at || 'Never'}\nCreated: ${data.created_at}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'list-webhooks',
    {
      title: 'List Webhooks',
      description: 'List all webhooks in your workspace.',
      inputSchema: {
        page: z.number().min(1).optional().describe('Page number (default: 1).'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (default: 10, max: 100).'),
      },
    },
    async ({ page, limit }) => {
      const data = await apiClient.request('GET', '/webhooks', { query: { page, limit } });
      const webhooks = data.data || [];

      if (webhooks.length === 0) {
        return { content: [{ type: 'text', text: 'No webhooks found.' }] };
      }

      return {
        content: [
          { type: 'text', text: `Found ${webhooks.length} webhook(s):` },
          ...webhooks.map((w) => ({
            type: 'text',
            text: `Name: ${w.name}\nID: ${w.id}\nURL: ${w.url}\nEnabled: ${w.enabled}\nEvents: ${(w.events || []).join(', ') || 'All'}`,
          })),
          ...(data.next_page_url
            ? [{ type: 'text', text: 'More webhooks available. Increase the page number to see more.' }]
            : []),
        ],
      };
    },
  );

  server.registerTool(
    'update-webhook',
    {
      title: 'Update Webhook',
      description: 'Update an existing webhook. Can be identified by ID (wh_xxx) or name. At least one field must be provided.',
      inputSchema: {
        id: z.string().nonempty().describe('The webhook ID (wh_xxx) or name.'),
        name: z.string().optional().describe('New name for the webhook.'),
        url: z.string().url().optional().describe('New URL (SSRF-validated).'),
        all_events: z.boolean().optional().describe('Subscribe to all events. Setting true clears specific events.'),
        enabled: z.boolean().optional().describe('Enable or disable the webhook.'),
        events: z
          .array(z.string())
          .optional()
          .describe('Replace subscribed event types. Ignored when all_events is true.'),
      },
    },
    async ({ id, name, url, all_events, enabled, events }) => {
      const body = {};
      if (name !== undefined) body.name = name;
      if (url !== undefined) body.url = url;
      if (all_events !== undefined) body.all_events = all_events;
      if (enabled !== undefined) body.enabled = enabled;
      if (events !== undefined) body.events = events;

      const data = await apiClient.request('POST', `/webhooks/${encodeURIComponent(id)}`, { body });

      return {
        content: [
          { type: 'text', text: 'Webhook updated successfully.' },
          { type: 'text', text: `Name: ${data.name}\nID: ${data.id}\nEnabled: ${data.enabled}` },
        ],
      };
    },
  );

  server.registerTool(
    'delete-webhook',
    {
      title: 'Delete Webhook',
      description:
        'Delete a webhook from your workspace. Before using this tool, you MUST double-check with the user. Can be identified by ID (wh_xxx) or name.',
      inputSchema: {
        id: z.string().nonempty().describe('The webhook ID (wh_xxx) or name.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('DELETE', `/webhooks/${encodeURIComponent(id)}`);

      return {
        content: [{ type: 'text', text: `Webhook "${data.name}" deleted successfully.` }],
      };
    },
  );
}
