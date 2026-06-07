import { z } from 'zod';

export function addTemplateTools(server, apiClient) {
  server.registerTool(
    'create-template',
    {
      title: 'Create Template',
      description:
        'Create a new email template. Templates are automatically published if the alias doesn\'t exist yet; otherwise they remain as drafts.',
      inputSchema: {
        name: z.string().nonempty().max(191).describe('Template name (max 191 characters).'),
        alias: z
          .string()
          .nonempty()
          .max(191)
          .describe('Template alias for grouping versions. Lowercase letters, numbers, underscores, hyphens only.'),
        from: z
          .string()
          .optional()
          .describe('From email address in RFC format (e.g., Name <email@domain.com>).'),
        subject: z.string().optional().describe('Email subject line (max 191 characters).'),
        reply_to: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe('Reply-to email address(es).'),
        html: z.string().optional().describe('HTML content for the email template.'),
        text: z.string().optional().describe('Plain text content for the email template.'),
        editor: z
          .enum(['html', 'tiptap', 'dragit'])
          .optional()
          .describe('Editor type (default: "html").'),
      },
    },
    async ({ name, alias, from, subject, reply_to, html, text, editor }) => {
      const body = { name, alias };
      if (from !== undefined) body.from = from;
      if (subject !== undefined) body.subject = subject;
      if (reply_to !== undefined) body.reply_to = reply_to;
      if (html !== undefined) body.html = html;
      if (text !== undefined) body.text = text;
      if (editor !== undefined) body.editor = editor;

      const data = await apiClient.request('POST', '/templates', { body });
      const tpl = data.data || data;

      return {
        content: [
          { type: 'text', text: data.message || 'Template created successfully.' },
          {
            type: 'text',
            text: `Name: ${tpl.name}\nID: ${tpl.id}\nAlias: ${tpl.alias}\nEditor: ${tpl.editor}\nPublished: ${tpl.published_at ? 'Yes' : 'Draft'}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'get-template',
    {
      title: 'Get Template',
      description: 'Retrieve a template by ID with full content and all other versions sharing the same alias.',
      inputSchema: {
        id: z.string().nonempty().describe('Template ID (tem_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/templates/${encodeURIComponent(id)}`);
      const tpl = data.data || data;

      const parts = [
        `Name: ${tpl.name}\nID: ${tpl.id}\nAlias: ${tpl.alias}\nFrom: ${tpl.from || 'N/A'}\nSubject: ${tpl.subject || 'N/A'}\nEditor: ${tpl.editor}\nPublished: ${tpl.published_at || 'Draft'}\nCreated: ${tpl.created_at}`,
      ];

      if (tpl.html) parts.push(`HTML:\n${tpl.html}`);
      if (tpl.text) parts.push(`Text:\n${tpl.text}`);

      if (tpl.versions && tpl.versions.length > 0) {
        parts.push(
          `Other versions:\n${tpl.versions.map((v) => `  ${v.name} (${v.id}) - Published: ${v.published_at || 'Draft'}`).join('\n')}`,
        );
      }

      return { content: parts.map((text) => ({ type: 'text', text })) };
    },
  );

  server.registerTool(
    'list-templates',
    {
      title: 'List Templates',
      description: 'List all published templates. Supports filtering by name, alias, and editor type.',
      inputSchema: {
        per_page: z.number().min(1).max(100).optional().describe('Items per page (default: 25, max: 100).'),
        page: z.number().min(1).optional().describe('Page number (default: 1).'),
        filter_name: z.string().optional().describe('Filter by name (partial match).'),
        filter_alias: z.string().optional().describe('Filter by alias (exact match).'),
        filter_editor: z.enum(['html', 'tiptap', 'dragit']).optional().describe('Filter by editor type.'),
        sort: z
          .enum(['name', 'alias', 'created_at', 'updated_at', 'published_at'])
          .optional()
          .describe('Sort field (default: created_at).'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort order (default: desc).'),
      },
    },
    async (params) => {
      const query = {};
      if (params.per_page !== undefined) query.per_page = params.per_page;
      if (params.page !== undefined) query.page = params.page;
      if (params.filter_name) query['filter[name]'] = params.filter_name;
      if (params.filter_alias) query['filter[alias]'] = params.filter_alias;
      if (params.filter_editor) query['filter[editor]'] = params.filter_editor;
      if (params.sort) query.sort = params.sort;
      if (params.order) query.order = params.order;

      const data = await apiClient.request('GET', '/templates', { query });
      const templates = data.data || [];

      if (templates.length === 0) {
        return { content: [{ type: 'text', text: 'No templates found.' }] };
      }

      return {
        content: [
          { type: 'text', text: `Found ${templates.length} template(s) (page ${data.current_page}/${data.total_pages}):` },
          ...templates.map((t) => ({
            type: 'text',
            text: `Name: ${t.name}\nID: ${t.id}\nAlias: ${t.alias}\nSubject: ${t.subject || 'N/A'}\nEditor: ${t.editor}\nPublished: ${t.published_at || 'Draft'}`,
          })),
          ...(data.current_page < data.total_pages
            ? [{ type: 'text', text: 'More templates available. Increase the page number to see more.' }]
            : []),
        ],
      };
    },
  );

  server.registerTool(
    'update-template',
    {
      title: 'Update Template',
      description: 'Update an existing template. All fields are optional. Does not change published status.',
      inputSchema: {
        id: z.string().nonempty().describe('Template ID (tem_xxx format).'),
        name: z.string().max(191).optional().describe('New template name.'),
        alias: z.string().max(191).optional().describe('New template alias.'),
        from: z.string().optional().describe('New from email address.'),
        subject: z.string().optional().describe('New subject line.'),
        reply_to: z.union([z.string(), z.array(z.string())]).optional().describe('New reply-to address(es).'),
        html: z.string().optional().describe('New HTML content.'),
        text: z.string().optional().describe('New plain text content.'),
        editor: z.enum(['html', 'tiptap', 'dragit']).optional().describe('New editor type.'),
      },
    },
    async ({ id, ...rest }) => {
      const body = {};
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined) body[key] = value;
      }

      const data = await apiClient.request('POST', `/templates/${encodeURIComponent(id)}`, { body });
      const tpl = data.data || data;

      return {
        content: [
          { type: 'text', text: data.message || 'Template updated successfully.' },
          { type: 'text', text: `Name: ${tpl.name}\nID: ${tpl.id}\nAlias: ${tpl.alias}` },
        ],
      };
    },
  );

  server.registerTool(
    'delete-template',
    {
      title: 'Delete Template',
      description:
        'Delete a template permanently. Before using this tool, you MUST double-check with the user. If it\'s the published version, no template will be published for that alias until another is published.',
      inputSchema: {
        id: z.string().nonempty().describe('Template ID (tem_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('DELETE', `/templates/${encodeURIComponent(id)}`);

      return {
        content: [{ type: 'text', text: data.message || 'Template deleted successfully.' }],
      };
    },
  );

  server.registerTool(
    'publish-template',
    {
      title: 'Publish Template',
      description:
        'Publish a template and automatically unpublish all other templates with the same alias. Only one template per alias can be published at a time.',
      inputSchema: {
        id: z.string().nonempty().describe('Template ID (tem_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('POST', `/templates/${encodeURIComponent(id)}/publish`);
      const tpl = data.data || data;

      return {
        content: [
          { type: 'text', text: data.message || 'Template published successfully.' },
          { type: 'text', text: `Name: ${tpl.name}\nID: ${tpl.id}\nAlias: ${tpl.alias}\nPublished: ${tpl.published_at}` },
        ],
      };
    },
  );
}
