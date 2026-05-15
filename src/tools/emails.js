import { z } from 'zod';

export function addEmailTools(server, apiClient, options) {
  const { senderEmailAddress, replierEmailAddresses } = options;

  server.registerTool(
    'send-email',
    {
      title: 'Send Email',
      description:
        'Send an email via Emailit. Supports HTML, plain text, templates, variables, attachments, CC/BCC, scheduling, and tracking.',
      inputSchema: {
        from: z
          .string()
          .optional()
          .describe(
            'Sender email in RFC format: email@domain.com or Display Name <email@domain.com>. Uses the default sender if not provided.',
          ),
        to: z
          .union([z.string(), z.array(z.string())])
          .describe('Recipient email address(es). Maximum 50 recipients.'),
        subject: z
          .string()
          .optional()
          .describe('Email subject line. Required unless a template provides it.'),
        html: z
          .string()
          .optional()
          .describe('HTML content of the email.'),
        text: z
          .string()
          .optional()
          .describe('Plain text content of the email.'),
        reply_to: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe('Reply-to email address(es).'),
        cc: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe('CC recipients. Maximum 50.'),
        bcc: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe('BCC recipients. Maximum 50.'),
        template: z
          .string()
          .optional()
          .describe('Template alias or ID (tem_xxx format).'),
        variables: z
          .record(z.string(), z.string())
          .optional()
          .describe('Variables for template substitution using {{variable}} syntax.'),
        attachments: z
          .array(
            z.object({
              filename: z.string().describe('File name with extension.'),
              content: z.string().optional().describe('Base64 encoded content. Mutually exclusive with url.'),
              url: z.string().optional().describe('URL to fetch attachment from. Mutually exclusive with content.'),
              content_type: z.string().optional().describe('MIME type. Required when using content.'),
              content_id: z.string().optional().describe('Content-ID for inline images.'),
            }),
          )
          .optional()
          .describe('Array of attachment objects.'),
        headers: z
          .record(z.string(), z.string())
          .optional()
          .describe('Custom email headers as key-value pairs.'),
        meta: z
          .record(z.string(), z.string())
          .optional()
          .describe('Metadata as key-value string pairs.'),
        scheduled_at: z
          .string()
          .optional()
          .describe('Schedule send time. Accepts ISO 8601, Unix timestamp, or natural language like "tomorrow at 9am".'),
        tracking: z
          .union([
            z.boolean(),
            z.object({
              loads: z.boolean().optional(),
              clicks: z.boolean().optional(),
            }),
          ])
          .optional()
          .describe('Override domain tracking defaults.'),
      },
    },
    async (params) => {
      const from = params.from || senderEmailAddress;
      if (!from) {
        throw new Error(
          'No sender email address provided. Pass "from" or configure a default sender with --sender or SENDER_EMAIL_ADDRESS.',
        );
      }

      const body = { ...params, from };
      if (!body.reply_to && replierEmailAddresses.length > 0) {
        body.reply_to = replierEmailAddresses;
      }

      const data = await apiClient.request('POST', '/emails', { body });

      return {
        content: [
          { type: 'text', text: 'Email sent successfully.' },
          {
            type: 'text',
            text: `ID: ${data.id}\nStatus: ${data.status}${data.scheduled_at ? `\nScheduled at: ${data.scheduled_at}` : ''}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'list-emails',
    {
      title: 'List Emails',
      description: 'List emails in your workspace with pagination and optional filtering by type (inbound/outbound).',
      inputSchema: {
        page: z.number().min(1).optional().describe('Page number (default: 1).'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (default: 10, max: 100).'),
        type: z.enum(['inbound', 'outbound']).optional().describe('Filter by email type.'),
      },
    },
    async ({ page, limit, type }) => {
      const data = await apiClient.request('GET', '/emails', { query: { page, limit, type } });
      const emails = data.data || [];

      if (emails.length === 0) {
        return { content: [{ type: 'text', text: 'No emails found.' }] };
      }

      return {
        content: [
          { type: 'text', text: `Found ${emails.length} email(s):` },
          ...emails.map((e) => ({
            type: 'text',
            text: `ID: ${e.id}\nType: ${e.type}\nFrom: ${e.from}\nTo: ${e.to}\nSubject: ${e.subject}\nStatus: ${e.status}\nCreated: ${e.created_at}`,
          })),
          ...(data.next_page_url
            ? [{ type: 'text', text: 'More emails available. Increase the page number to see more.' }]
            : []),
        ],
      };
    },
  );

  server.registerTool(
    'get-email',
    {
      title: 'Get Email',
      description: 'Retrieve a single email by ID, including headers, parsed body content, and attachments.',
      inputSchema: {
        id: z.string().nonempty().describe('The email ID (em_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/emails/${encodeURIComponent(id)}`);

      const parts = [
        `ID: ${data.id}\nType: ${data.type}\nFrom: ${data.from}\nTo: ${data.to}\nSubject: ${data.subject}\nStatus: ${data.status}\nSize: ${data.size} bytes\nCreated: ${data.created_at}`,
      ];

      if (data.body) {
        if (data.body.text) parts.push(`Text body:\n${data.body.text}`);
        if (data.body.html) parts.push(`HTML body:\n${data.body.html}`);
      }

      if (data.attachments && data.attachments.length > 0) {
        parts.push(
          `Attachments: ${data.attachments.map((a) => `${a.filename} (${a.content_type}, ${a.size} bytes)`).join(', ')}`,
        );
      }

      return { content: parts.map((text) => ({ type: 'text', text })) };
    },
  );

  server.registerTool(
    'get-email-raw',
    {
      title: 'Get Email Raw',
      description: 'Returns the full raw MIME message string along with email metadata.',
      inputSchema: {
        id: z.string().nonempty().describe('The email ID (em_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/emails/${encodeURIComponent(id)}/raw`);
      return {
        content: [
          { type: 'text', text: `ID: ${data.id}\nStatus: ${data.status}` },
          { type: 'text', text: `Raw MIME:\n${data.raw}` },
        ],
      };
    },
  );

  server.registerTool(
    'get-email-body',
    {
      title: 'Get Email Body',
      description: 'Returns only the parsed body content (text and HTML) for an email.',
      inputSchema: {
        id: z.string().nonempty().describe('The email ID (em_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/emails/${encodeURIComponent(id)}/body`);
      const parts = [];
      if (data.text) parts.push({ type: 'text', text: `Text:\n${data.text}` });
      if (data.html) parts.push({ type: 'text', text: `HTML:\n${data.html}` });
      if (parts.length === 0) parts.push({ type: 'text', text: 'Email body is empty.' });
      return { content: parts };
    },
  );

  server.registerTool(
    'get-email-attachments',
    {
      title: 'Get Email Attachments',
      description: 'Returns the attachment list for an email, with base64-encoded content.',
      inputSchema: {
        id: z.string().nonempty().describe('The email ID (em_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/emails/${encodeURIComponent(id)}/attachments`);
      const attachments = data.data || [];

      if (attachments.length === 0) {
        return { content: [{ type: 'text', text: 'No attachments found.' }] };
      }

      return {
        content: [
          { type: 'text', text: `Found ${attachments.length} attachment(s):` },
          ...attachments.map((a) => ({
            type: 'text',
            text: `Filename: ${a.filename}\nType: ${a.content_type}\nSize: ${a.size} bytes\nDisposition: ${a.content_disposition}`,
          })),
        ],
      };
    },
  );

  server.registerTool(
    'get-email-meta',
    {
      title: 'Get Email Meta',
      description:
        'Returns email metadata with attachment info but without attachment content. Useful for inspecting without downloading large attachments.',
      inputSchema: {
        id: z.string().nonempty().describe('The email ID (em_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/emails/${encodeURIComponent(id)}/meta`);

      const parts = [
        `ID: ${data.id}\nType: ${data.type}\nFrom: ${data.from}\nTo: ${data.to}\nSubject: ${data.subject}\nStatus: ${data.status}\nSize: ${data.size} bytes\nCreated: ${data.created_at}`,
      ];

      if (data.attachments && data.attachments.length > 0) {
        parts.push(
          `Attachments:\n${data.attachments.map((a) => `  ${a.filename} (${a.content_type}, ${a.size} bytes)`).join('\n')}`,
        );
      }

      return { content: parts.map((text) => ({ type: 'text', text })) };
    },
  );

  server.registerTool(
    'update-email',
    {
      title: 'Update Scheduled Email',
      description:
        'Update a scheduled email\'s send time. Only works for emails with status "scheduled" and only if the current scheduled time is at least 3 minutes in the future.',
      inputSchema: {
        id: z.string().nonempty().describe('The email ID (em_xxx format).'),
        scheduled_at: z
          .string()
          .describe(
            'New scheduled time. Accepts ISO 8601, Unix timestamp, or natural language like "tomorrow at 9am". Must be at least 3 minutes in the future.',
          ),
      },
    },
    async ({ id, scheduled_at }) => {
      const data = await apiClient.request('POST', `/emails/${encodeURIComponent(id)}`, {
        body: { scheduled_at },
      });

      return {
        content: [
          { type: 'text', text: data.message || 'Email schedule updated successfully.' },
          { type: 'text', text: `ID: ${data.id}\nStatus: ${data.status}\nScheduled at: ${data.scheduled_at}` },
        ],
      };
    },
  );

  server.registerTool(
    'cancel-email',
    {
      title: 'Cancel Email',
      description:
        'Cancel a scheduled or pending email. For scheduled emails, cancellation is only allowed if the scheduled time is at least 3 minutes in the future.',
      inputSchema: {
        id: z.string().nonempty().describe('The email ID (em_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('POST', `/emails/${encodeURIComponent(id)}/cancel`);

      return {
        content: [
          { type: 'text', text: data.message || 'Email canceled successfully.' },
          { type: 'text', text: `ID: ${data.id}\nStatus: ${data.status}` },
        ],
      };
    },
  );

  server.registerTool(
    'retry-email',
    {
      title: 'Retry Email',
      description:
        'Retry an email that hard failed, errored, or was held. Creates a duplicate of the original email and sends it again with a new ID.',
      inputSchema: {
        id: z.string().nonempty().describe('The email ID (em_xxx format).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('POST', `/emails/${encodeURIComponent(id)}/retry`);

      return {
        content: [
          { type: 'text', text: data.message || 'Email retry initiated.' },
          { type: 'text', text: `New ID: ${data.id}\nStatus: ${data.status}` },
        ],
      };
    },
  );
}
