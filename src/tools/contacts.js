import { z } from 'zod';

export function addContactTools(server, apiClient) {
  server.registerTool(
    'create-contact',
    {
      title: 'Create Contact',
      description: 'Create a new contact in your workspace.',
      inputSchema: {
        email: z.string().email().describe('Email address (must be valid).'),
        first_name: z.string().optional().describe('First name.'),
        last_name: z.string().optional().describe('Last name.'),
        custom_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe('Arbitrary key-value pairs for custom fields.'),
        audiences: z
          .array(z.string())
          .optional()
          .describe('Array of audience IDs to subscribe to.'),
        unsubscribed: z.boolean().optional().describe('Global unsubscribe status (default: false).'),
      },
    },
    async ({ email, first_name, last_name, custom_fields, audiences, unsubscribed }) => {
      const body = { email };
      if (first_name !== undefined) body.first_name = first_name;
      if (last_name !== undefined) body.last_name = last_name;
      if (custom_fields !== undefined) body.custom_fields = custom_fields;
      if (audiences !== undefined) body.audiences = audiences;
      if (unsubscribed !== undefined) body.unsubscribed = unsubscribed;

      const data = await apiClient.request('POST', '/contacts', { body });

      return {
        content: [
          { type: 'text', text: 'Contact created successfully.' },
          {
            type: 'text',
            text: `Email: ${data.email}\nID: ${data.id}\nFirst Name: ${data.first_name || 'N/A'}\nLast Name: ${data.last_name || 'N/A'}\nUnsubscribed: ${data.unsubscribed}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'get-contact',
    {
      title: 'Get Contact',
      description: 'Retrieve information about a specific contact. Can be identified by ID (con_xxx) or email address.',
      inputSchema: {
        id: z.string().nonempty().describe('The contact ID (con_xxx) or email address.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/contacts/${encodeURIComponent(id)}`);

      const parts = [
        `Email: ${data.email}\nID: ${data.id}\nFirst Name: ${data.first_name || 'N/A'}\nLast Name: ${data.last_name || 'N/A'}\nUnsubscribed: ${data.unsubscribed}\nCreated: ${data.created_at}`,
      ];

      if (data.audiences && data.audiences.length > 0) {
        parts.push(
          `Audiences:\n${data.audiences.map((a) => `  ${a.name} (${a.id}) - Subscribed: ${a.subscribed ?? (a.subscriber?.subscribed ?? 'N/A')}`).join('\n')}`,
        );
      }

      if (data.custom_fields && Object.keys(data.custom_fields).length > 0) {
        parts.push(`Custom Fields: ${JSON.stringify(data.custom_fields)}`);
      }

      return { content: parts.map((text) => ({ type: 'text', text })) };
    },
  );

  server.registerTool(
    'list-contacts',
    {
      title: 'List Contacts',
      description: 'List all contacts in your workspace.',
      inputSchema: {
        page: z.number().min(1).optional().describe('Page number (default: 1).'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (default: 10, max: 100).'),
      },
    },
    async ({ page, limit }) => {
      const data = await apiClient.request('GET', '/contacts', { query: { page, limit } });
      const contacts = data.data || [];

      if (contacts.length === 0) {
        return { content: [{ type: 'text', text: 'No contacts found.' }] };
      }

      return {
        content: [
          { type: 'text', text: `Found ${contacts.length} contact(s):` },
          ...contacts.map((c) => ({
            type: 'text',
            text: `Email: ${c.email}\nID: ${c.id}\nName: ${c.first_name || ''} ${c.last_name || ''}\nUnsubscribed: ${c.unsubscribed}`,
          })),
          ...(data.next_page_url
            ? [{ type: 'text', text: 'More contacts available. Increase the page number to see more.' }]
            : []),
        ],
      };
    },
  );

  server.registerTool(
    'update-contact',
    {
      title: 'Update Contact',
      description: 'Update an existing contact. Can be identified by ID (con_xxx) or email address.',
      inputSchema: {
        id: z.string().nonempty().describe('The contact ID (con_xxx) or email address.'),
        email: z.string().email().optional().describe('New email address.'),
        first_name: z.string().optional().describe('New first name.'),
        last_name: z.string().optional().describe('New last name.'),
        custom_fields: z.record(z.string(), z.any()).optional().describe('Replace custom fields.'),
        unsubscribed: z.boolean().optional().describe('Global unsubscribe status.'),
      },
    },
    async ({ id, email, first_name, last_name, custom_fields, unsubscribed }) => {
      const body = {};
      if (email !== undefined) body.email = email;
      if (first_name !== undefined) body.first_name = first_name;
      if (last_name !== undefined) body.last_name = last_name;
      if (custom_fields !== undefined) body.custom_fields = custom_fields;
      if (unsubscribed !== undefined) body.unsubscribed = unsubscribed;

      const data = await apiClient.request('POST', `/contacts/${encodeURIComponent(id)}`, { body });

      return {
        content: [
          { type: 'text', text: 'Contact updated successfully.' },
          { type: 'text', text: `Email: ${data.email}\nID: ${data.id}` },
        ],
      };
    },
  );

  server.registerTool(
    'delete-contact',
    {
      title: 'Delete Contact',
      description:
        'Delete a contact and all associated subscriber records. Before using this tool, you MUST double-check with the user. Warn that this also deletes all subscriber records for this contact.',
      inputSchema: {
        id: z.string().nonempty().describe('The contact ID (con_xxx) or email address.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('DELETE', `/contacts/${encodeURIComponent(id)}`);

      return {
        content: [{ type: 'text', text: `Contact "${data.email}" deleted successfully.` }],
      };
    },
  );
}
