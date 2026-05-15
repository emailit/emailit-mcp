import { z } from 'zod';

function formatDnsRecords(records) {
  if (!records || records.length === 0) return 'No DNS records.';
  return records
    .map(
      (r) =>
        `${r.type} (${r.status}):\n  Name: ${r.name}\n  Value: ${r.value}\n  TTL: ${r.ttl}\n  Required: ${r.required}${r.priority !== null && r.priority !== undefined ? `\n  Priority: ${r.priority}` : ''}${r.error ? `\n  Error: ${r.error}` : ''}`,
    )
    .join('\n\n');
}

export function addDomainTools(server, apiClient) {
  server.registerTool(
    'create-domain',
    {
      title: 'Create Domain',
      description:
        'Create a new domain in Emailit. Returns DNS records that must be configured with your DNS provider for verification. You MUST display the DNS records to the user.',
      inputSchema: {
        name: z.string().nonempty().describe('The domain name (e.g., mail.yourdomain.com).'),
        track_loads: z.boolean().optional().describe('Whether to track email loads (default: false).'),
        track_clicks: z.boolean().optional().describe('Whether to track email clicks (default: false).'),
      },
    },
    async ({ name, track_loads, track_clicks }) => {
      const body = { name };
      if (track_loads !== undefined) body.track_loads = track_loads;
      if (track_clicks !== undefined) body.track_clicks = track_clicks;

      const data = await apiClient.request('POST', '/domains', { body });

      return {
        content: [
          { type: 'text', text: 'Domain created successfully.' },
          {
            type: 'text',
            text: `Name: ${data.name}\nID: ${data.id}\nUUID: ${data.uuid}\nTrack Loads: ${data.track_loads}\nTrack Clicks: ${data.track_clicks}`,
          },
          { type: 'text', text: `DNS Records to configure:\n\n${formatDnsRecords(data.dns_records)}` },
          {
            type: 'text',
            text: 'IMPORTANT: Display the DNS records above to the user so they can configure them with their DNS provider. After configuration, use verify-domain to start verification.',
          },
        ],
      };
    },
  );

  server.registerTool(
    'get-domain',
    {
      title: 'Get Domain',
      description: 'Retrieve information about a specific domain including DNS records and verification status.',
      inputSchema: {
        id: z.string().nonempty().describe('The domain ID (sd_xxx format or numeric ID).'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('GET', `/domains/${encodeURIComponent(id)}`);

      return {
        content: [
          {
            type: 'text',
            text: `Name: ${data.name}\nID: ${data.id}\nUUID: ${data.uuid}\nVerified: ${data.verified_at ? `Yes (${data.verified_at})` : 'No'}\nSPF: ${data.spf_status || 'N/A'}\nDKIM: ${data.dkim_status || 'N/A'}\nMX: ${data.mx_status || 'N/A'}\nDMARC: ${data.dmarc_status || 'N/A'}\nTrack Loads: ${data.track_loads}\nTrack Clicks: ${data.track_clicks}`,
          },
          { type: 'text', text: `DNS Records:\n\n${formatDnsRecords(data.dns_records)}` },
        ],
      };
    },
  );

  server.registerTool(
    'list-domains',
    {
      title: 'List Domains',
      description: 'List all domains in your Emailit account.',
      inputSchema: {
        page: z.number().min(1).optional().describe('Page number (default: 1).'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (max: 100).'),
      },
    },
    async ({ page, limit }) => {
      const data = await apiClient.request('GET', '/domains', { query: { page, limit } });
      const domains = data.data || [];

      if (domains.length === 0) {
        return { content: [{ type: 'text', text: 'No domains found.' }] };
      }

      return {
        content: [
          { type: 'text', text: `Found ${domains.length} domain(s):` },
          ...domains.map((d) => ({
            type: 'text',
            text: `Name: ${d.name}\nID: ${d.id}\nUUID: ${d.uuid}\nTrack Loads: ${d.track_loads}\nTrack Clicks: ${d.track_clicks}\nCreated: ${d.created_at}`,
          })),
          ...(data.next_page_url
            ? [{ type: 'text', text: 'More domains available. Increase the page number to see more.' }]
            : []),
        ],
      };
    },
  );

  server.registerTool(
    'update-domain',
    {
      title: 'Update Domain',
      description: 'Update an existing domain\'s tracking and configuration settings.',
      inputSchema: {
        id: z.string().nonempty().describe('The domain ID.'),
        track_loads: z.boolean().optional().describe('Whether to track email loads.'),
        track_clicks: z.boolean().optional().describe('Whether to track email clicks.'),
        tracking_key: z
          .string()
          .optional()
          .describe('Custom subdomain key for the tracking CNAME record.'),
        inbound_key: z
          .string()
          .optional()
          .describe('Custom subdomain key for the inbound MX record.'),
      },
    },
    async ({ id, track_loads, track_clicks, tracking_key, inbound_key }) => {
      const body = {};
      if (track_loads !== undefined) body.track_loads = track_loads;
      if (track_clicks !== undefined) body.track_clicks = track_clicks;
      if (tracking_key !== undefined) body.tracking_key = tracking_key;
      if (inbound_key !== undefined) body.inbound_key = inbound_key;

      const data = await apiClient.request('POST', `/domains/${encodeURIComponent(id)}`, { body });

      return {
        content: [
          { type: 'text', text: 'Domain updated successfully.' },
          { type: 'text', text: `Name: ${data.name}\nID: ${data.id}` },
        ],
      };
    },
  );

  server.registerTool(
    'delete-domain',
    {
      title: 'Delete Domain',
      description:
        'Delete a domain from your Emailit account. Before using this tool, you MUST double-check with the user that they want to delete this domain. Warn that this is irreversible and will stop all email sending/receiving for that domain.',
      inputSchema: {
        id: z.string().nonempty().describe('The domain ID.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('DELETE', `/domains/${encodeURIComponent(id)}`);

      return {
        content: [{ type: 'text', text: `Domain "${data.name}" deleted successfully.` }],
      };
    },
  );

  server.registerTool(
    'verify-domain',
    {
      title: 'Verify Domain',
      description:
        'Trigger domain DNS verification. Checks all DNS records (MX, SPF, DKIM, DMARC) and updates the domain\'s verification status.',
      inputSchema: {
        id: z.string().nonempty().describe('The domain ID.'),
      },
    },
    async ({ id }) => {
      const data = await apiClient.request('POST', `/domains/${encodeURIComponent(id)}/verify`);

      const verified = data.verified_at ? 'Yes' : 'No';
      return {
        content: [
          { type: 'text', text: 'Domain verification initiated.' },
          {
            type: 'text',
            text: `Name: ${data.name}\nVerified: ${verified}\nSPF: ${data.spf_status || 'N/A'}\nDKIM: ${data.dkim_status || 'N/A'}\nMX: ${data.mx_status || 'N/A'}\nDMARC: ${data.dmarc_status || 'N/A'}`,
          },
          { type: 'text', text: `DNS Records:\n\n${formatDnsRecords(data.dns_records)}` },
        ],
      };
    },
  );
}
