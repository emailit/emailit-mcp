import { z } from 'zod';

export function addAudienceTools(server, apiClient) {
  server.registerTool(
    'create-audience',
    {
      title: 'Create Audience',
      description: 'Create a new audience for campaigns.',
      inputSchema: {
        name: z.string().nonempty().describe('The name of the audience.'),
      },
    },
    async ({ name }) => {
      const data = await apiClient.request('POST', '/audiences', { body: { name } });

      return {
        content: [
          { type: 'text', text: 'Audience created successfully.' },
          { type: 'text', text: `Name: ${data.name}\nID: ${data.id}\nToken: ${data.token}\nCreated: ${data.created_at}` },
        ],
      };
    },
  );

  server.registerTool(
    'get-audience',
    {
      title: 'Get Audience',
      description: 'Retrieve details of a specific audience.',
      inputSchema: {
        id: z.string().nonempty().describe('The audience ID.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/audiences/${encodeURIComponent(id)}`);

      return {
        content: [
          {
            type: 'text',
            text: `Name: ${data.name}\nID: ${data.id}\nToken: ${data.token}\nCreated: ${data.created_at}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'list-audiences',
    {
      title: 'List Audiences',
      description: 'List all audiences in your Emailit account.',
      inputSchema: {
        page: z.number().min(1).optional().describe('Page number (default: 1).'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (max: 100).'),
      },
    },
    async ({ page, limit }) => {
      const data = await apiClient.request('GET', '/audiences', { query: { page, limit } });
      const audiences = data.data || [];

      if (audiences.length === 0) {
        return { content: [{ type: 'text', text: 'No audiences found.' }] };
      }

      return {
        content: [
          { type: 'text', text: `Found ${audiences.length} audience(s):` },
          ...audiences.map((a) => ({
            type: 'text',
            text: `Name: ${a.name}\nID: ${a.id}\nCreated: ${a.created_at}`,
          })),
          ...(data.next_page_url
            ? [{ type: 'text', text: 'More audiences available. Increase the page number to see more.' }]
            : []),
        ],
      };
    },
  );

  server.registerTool(
    'update-audience',
    {
      title: 'Update Audience',
      description: 'Update an audience\'s name.',
      inputSchema: {
        id: z.string().nonempty().describe('The audience ID.'),
        name: z.string().nonempty().describe('The new name for the audience.'),
      },
    },
    async ({ id, name }) => {
      const data = await apiClient.request('POST', `/audiences/${encodeURIComponent(id)}`, {
        body: { name },
      });

      return {
        content: [
          { type: 'text', text: 'Audience updated successfully.' },
          { type: 'text', text: `Name: ${data.name}\nID: ${data.id}` },
        ],
      };
    },
  );

  server.registerTool(
    'delete-audience',
    {
      title: 'Delete Audience',
      description:
        'Delete an audience and all its subscribers. Before using this tool, you MUST double-check with the user. Warn that this deletes all subscribers in the audience.',
      inputSchema: {
        id: z.string().nonempty().describe('The audience ID.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('DELETE', `/audiences/${encodeURIComponent(id)}`);

      return {
        content: [{ type: 'text', text: `Audience "${data.name}" deleted successfully.` }],
      };
    },
  );
}
