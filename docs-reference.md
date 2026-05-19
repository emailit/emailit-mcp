# Emailit MCP Server — Documentation Reference

This document provides all the information needed to write articles and guides about the Emailit MCP Server. It covers what it is, how to install and configure it, all available tools with their parameters, and usage examples for each supported MCP client.

---

## What is the Emailit MCP Server?

The Emailit MCP Server is an open-source [Model Context Protocol](https://modelcontextprotocol.io/) server that connects AI assistants (Claude, Cursor, and other MCP-compatible clients) directly to the [Emailit](https://emailit.com/) email platform. It allows AI agents to send emails, manage contacts, domains, templates, and more through natural language.

- **Package name:** `@emailit/emailit-mcp`
- **Runtime:** Node.js >= 18
- **Language:** Pure JavaScript (ESM)
- **License:** MIT
- **Repository:** https://github.com/emailit/emailit-mcp
- **npm:** `npx -y @emailit/emailit-mcp`

---

## Prerequisites

1. A free Emailit account — sign up at https://emailit.com
2. An API key — [How to get an API key](https://emailit.com/docs/guides/how-to-get-an-api-key/)
3. A verified sending domain — [Creating a domain](https://emailit.com/docs/guides/creating-a-domain/)
4. Node.js 18 or later installed

---

## Transport Modes

The server supports two transport modes:

### 1. Stdio (Default)

The standard input/output transport is the simplest way to connect. The MCP client starts the server as a subprocess and communicates over stdin/stdout. The API key is passed via environment variable or CLI argument.

### 2. HTTP (Streamable HTTP)

For remote or web-based integrations, the server can run as an HTTP server using Fastify with Streamable HTTP transport. Clients authenticate per-session by passing their API key as a Bearer token in the `Authorization` header. The endpoint is exposed at `/mcp`.

---

## Installation & Configuration

### Claude Code (Stdio)

```bash
claude mcp add emailit -e EMAILIT_API_KEY=your_api_key -- npx -y @emailit/emailit-mcp
```

### Claude Code (HTTP)

First start the server:

```bash
npx -y @emailit/emailit-mcp --http --port 3000
```

Then register it:

```bash
claude mcp add emailit --transport http http://127.0.0.1:3000/mcp --header "Authorization: Bearer your_api_key"
```

### Cursor (Stdio)

Open the command palette and choose **Cursor Settings > MCP > Add new global MCP server**, then paste:

```json
{
  "mcpServers": {
    "emailit": {
      "command": "npx",
      "args": ["-y", "emailit-mcp"],
      "env": {
        "EMAILIT_API_KEY": "your_api_key"
      }
    }
  }
}
```

### Cursor (HTTP)

First start the server, then add:

```json
{
  "mcpServers": {
    "emailit": {
      "url": "http://127.0.0.1:3000/mcp",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

### Claude Desktop (Stdio)

Open **Claude Desktop settings > Developer tab > Edit Config**, then paste:

```json
{
  "mcpServers": {
    "emailit": {
      "command": "npx",
      "args": ["-y", "emailit-mcp"],
      "env": {
        "EMAILIT_API_KEY": "your_api_key"
      }
    }
  }
}
```

---

## CLI Options

| Option | Description |
|--------|-------------|
| `--key <key>` | Emailit API key (stdio mode only; HTTP uses Bearer token) |
| `--sender <email>` | Default sender email address from a verified domain |
| `--reply-to <email>` | Default reply-to address (can be specified multiple times) |
| `--http` | Use HTTP transport instead of stdio |
| `--port <port>` | HTTP port (default: 3000) |
| `-h, --help` | Show help message |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `EMAILIT_API_KEY` | API key (required for stdio, optional for HTTP) |
| `SENDER_EMAIL_ADDRESS` | Default sender address from a verified domain |
| `REPLY_TO_EMAIL_ADDRESSES` | Comma-separated reply-to addresses |
| `MCP_PORT` | HTTP port (default: 3000) |

> **Tip:** If you don't provide a sender email address, the MCP server will ask for one each time you send an email.

---

## Complete Tool Reference

The server exposes **47 tools** across 8 categories.

---

### Emails (10 tools)

#### `send-email`

Send an email via Emailit. Supports HTML, plain text, templates, variables, attachments, CC/BCC, scheduling, and tracking.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | No | Sender in RFC format: `email@domain.com` or `Display Name <email@domain.com>`. Uses default sender if not provided. |
| `to` | string or string[] | Yes | Recipient(s). Maximum 50. |
| `subject` | string | No | Subject line. Required unless a template provides it. |
| `html` | string | No | HTML content. |
| `text` | string | No | Plain text content. |
| `reply_to` | string or string[] | No | Reply-to address(es). |
| `cc` | string or string[] | No | CC recipients. Maximum 50. |
| `bcc` | string or string[] | No | BCC recipients. Maximum 50. |
| `template` | string | No | Template alias or ID (`tem_xxx`). |
| `variables` | object | No | Template variables using `{{variable}}` syntax. |
| `attachments` | array | No | Array of attachment objects (see below). |
| `headers` | object | No | Custom email headers as key-value pairs. |
| `meta` | object | No | Metadata as key-value string pairs. |
| `scheduled_at` | string | No | Schedule time. Accepts ISO 8601, Unix timestamp, or natural language like "tomorrow at 9am". |
| `tracking` | boolean or object | No | Override domain tracking defaults. Object form: `{ loads: bool, clicks: bool }`. |

**Attachment object:**

| Field | Type | Description |
|-------|------|-------------|
| `filename` | string | File name with extension. |
| `content` | string | Base64 encoded content. Mutually exclusive with `url`. |
| `url` | string | URL to fetch attachment from. Mutually exclusive with `content`. |
| `content_type` | string | MIME type. Required when using `content`. |
| `content_id` | string | Content-ID for inline images. |

#### `list-emails`

List emails with pagination and optional filtering.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1). |
| `limit` | number | No | Results per page (default: 10, max: 100). |
| `type` | string | No | Filter: `inbound` or `outbound`. |

#### `get-email`

Retrieve a single email by ID, including headers, parsed body content, and attachments.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Email ID (`em_xxx` format). |

#### `get-email-raw`

Returns the full raw MIME message string along with email metadata.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Email ID (`em_xxx` format). |

#### `get-email-body`

Returns only the parsed body content (text and HTML) for an email.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Email ID (`em_xxx` format). |

#### `get-email-attachments`

Returns the attachment list with base64-encoded content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Email ID (`em_xxx` format). |

#### `get-email-meta`

Returns email metadata with attachment info but without attachment content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Email ID (`em_xxx` format). |

#### `update-email`

Update a scheduled email's send time. Only works for emails with status "scheduled" and only if the scheduled time is at least 3 minutes in the future.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Email ID (`em_xxx` format). |
| `scheduled_at` | string | Yes | New scheduled time. Must be at least 3 minutes in the future. |

#### `cancel-email`

Cancel a scheduled or pending email. Cancellation is only allowed if the scheduled time is at least 3 minutes in the future.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Email ID (`em_xxx` format). |

#### `retry-email`

Retry an email that hard failed, errored, or was held. Creates a duplicate with a new ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Email ID (`em_xxx` format). |

---

### Domains (6 tools)

#### `create-domain`

Create a new domain. Returns DNS records that must be configured for verification.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Domain name (e.g., `mail.yourdomain.com`). |
| `track_loads` | boolean | No | Track email opens (default: false). |
| `track_clicks` | boolean | No | Track link clicks (default: false). |

#### `get-domain`

Retrieve information about a domain including DNS records and verification status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Domain ID. |

#### `list-domains`

List all domains in your account.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1). |
| `limit` | number | No | Results per page (max: 100). |

#### `update-domain`

Update a domain's tracking and configuration settings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Domain ID. |
| `track_loads` | boolean | No | Track email opens. |
| `track_clicks` | boolean | No | Track link clicks. |
| `tracking_key` | string | No | Custom subdomain key for tracking CNAME. |
| `inbound_key` | string | No | Custom subdomain key for inbound MX. |

#### `delete-domain`

Delete a domain. Irreversible — stops all email sending/receiving for that domain.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Domain ID. |

#### `verify-domain`

Trigger DNS verification. Checks MX, SPF, DKIM, DMARC records and updates verification status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Domain ID. |

---

### API Keys (5 tools)

#### `create-api-key`

Create a new API key. The key value is only shown once upon creation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Name for identification. |
| `scope` | string | No | `full` or `sending` (default: `full`). |
| `sending_domain_id` | number | No | Restrict key to a specific domain. |

#### `get-api-key`

Retrieve information about a specific API key.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | API key ID. |

#### `list-api-keys`

List all API keys in your account.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1). |
| `limit` | number | No | Results per page (max: 100). |

#### `update-api-key`

Update an API key's name.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | API key ID. |
| `name` | string | Yes | New name. |

#### `delete-api-key`

Delete an API key. Irreversible — any services using it will lose access.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | API key ID. |

---

### Audiences (5 tools)

#### `create-audience`

Create a new audience for campaigns.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Audience name. |

#### `get-audience`

Retrieve details of a specific audience.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Audience ID. |

#### `list-audiences`

List all audiences.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1). |
| `limit` | number | No | Results per page (max: 100). |

#### `update-audience`

Update an audience's name.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Audience ID. |
| `name` | string | Yes | New name. |

#### `delete-audience`

Delete an audience and all its subscribers.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Audience ID. |

---

### Contacts (5 tools)

#### `create-contact`

Create a new contact.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Valid email address. |
| `first_name` | string | No | First name. |
| `last_name` | string | No | Last name. |
| `custom_fields` | object | No | Arbitrary key-value pairs. |
| `audiences` | string[] | No | Audience IDs to subscribe to. |
| `unsubscribed` | boolean | No | Global unsubscribe status (default: false). |

#### `get-contact`

Retrieve a contact. Can be identified by ID (`con_xxx`) or email address.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Contact ID or email address. |

#### `list-contacts`

List all contacts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1). |
| `limit` | number | No | Results per page (default: 10, max: 100). |

#### `update-contact`

Update an existing contact. Can be identified by ID or email address.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Contact ID or email. |
| `email` | string | No | New email address. |
| `first_name` | string | No | New first name. |
| `last_name` | string | No | New last name. |
| `custom_fields` | object | No | Replace custom fields. |
| `unsubscribed` | boolean | No | Global unsubscribe status. |

#### `delete-contact`

Delete a contact and all associated subscriber records.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Contact ID or email address. |

---

### Templates (6 tools)

#### `create-template`

Create a new email template. Automatically published if the alias doesn't exist yet; otherwise saved as a draft.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Template name (max 191 chars). |
| `alias` | string | Yes | Alias for grouping versions. Lowercase, numbers, underscores, hyphens. |
| `from` | string | No | From address in RFC format. |
| `subject` | string | No | Subject line (max 191 chars). |
| `reply_to` | string or string[] | No | Reply-to address(es). |
| `html` | string | No | HTML content. |
| `text` | string | No | Plain text content. |
| `editor` | string | No | Editor type: `html`, `tiptap`, or `dragit` (default: `html`). |

#### `get-template`

Retrieve a template by ID with full content and all other versions sharing the same alias.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Template ID (`tem_xxx`). |

#### `list-templates`

List all published templates. Supports filtering and sorting.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `per_page` | number | No | Items per page (default: 25, max: 100). |
| `page` | number | No | Page number (default: 1). |
| `filter[name]` | string | No | Filter by name (partial match). |
| `filter[alias]` | string | No | Filter by alias (exact match). |
| `filter[editor]` | string | No | Filter by editor type. |
| `sort` | string | No | Sort field: `name`, `alias`, `created_at`, `updated_at`, `published_at`. |
| `order` | string | No | Sort order: `asc` or `desc` (default: `desc`). |

#### `update-template`

Update an existing template. Does not change published status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Template ID (`tem_xxx`). |
| `name` | string | No | New name. |
| `alias` | string | No | New alias. |
| `from` | string | No | New from address. |
| `subject` | string | No | New subject. |
| `reply_to` | string or string[] | No | New reply-to. |
| `html` | string | No | New HTML content. |
| `text` | string | No | New plain text content. |
| `editor` | string | No | New editor type. |

#### `delete-template`

Delete a template permanently. If it's the published version, no template will be published for that alias until another is published.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Template ID (`tem_xxx`). |

#### `publish-template`

Publish a template. Automatically unpublishes all other templates with the same alias. Only one template per alias can be published at a time.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Template ID (`tem_xxx`). |

---

### Suppressions (5 tools)

#### `create-suppression`

Add an email address to the suppression list to prevent sending to it.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Email address to suppress. |
| `type` | string | No | `recipient`, `bounce`, `complaint`, or `unsubscribe` (default: `recipient`). |
| `reason` | string | No | Human-readable reason. |
| `keep_until` | string | No | Expiration in ISO 8601. Null/omitted for permanent. |

#### `get-suppression`

Retrieve a suppression by ID or email address.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Suppression ID (`sup_xxx`) or email. |

#### `list-suppressions`

List all suppressions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1). |
| `limit` | number | No | Results per page (default: 10, max: 100). |

#### `update-suppression`

Update an existing suppression.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Suppression ID or email. |
| `email` | string | No | New email address. |
| `type` | string | No | New type. |
| `reason` | string | No | New reason. |
| `keep_until` | string or null | No | New expiration (null = permanent). |

#### `delete-suppression`

Remove a suppression to allow sending to that address again.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Suppression ID or email. |

---

### Webhooks (5 tools)

#### `create-webhook`

Create a new webhook. URL must be HTTPS and is validated against SSRF.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Unique name within the workspace. |
| `url` | string | Yes | HTTPS endpoint URL. |
| `all_events` | boolean | No | Subscribe to all event types (default: false). |
| `enabled` | boolean | No | Whether active (default: true). |
| `events` | string[] | No | Event types to subscribe to. Examples: `email.delivered`, `email.bounced`, `contact.created`. Ignored if `all_events` is true. |

#### `get-webhook`

Retrieve information about a webhook.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Webhook ID (`wh_xxx`). |

#### `list-webhooks`

List all webhooks.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1). |
| `limit` | number | No | Results per page (default: 10, max: 100). |

#### `update-webhook`

Update a webhook. Can be identified by ID or name.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Webhook ID (`wh_xxx`) or name. |
| `name` | string | No | New name. |
| `url` | string | No | New URL (SSRF-validated). |
| `all_events` | boolean | No | Subscribe to all events. |
| `enabled` | boolean | No | Enable or disable. |
| `events` | string[] | No | Replace subscribed event types. |

#### `delete-webhook`

Delete a webhook. Can be identified by ID or name.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Webhook ID (`wh_xxx`) or name. |

---

## Usage Examples

### Sending a simple email

> "Send a welcome email to john@example.com from hello@mydomain.com with the subject 'Welcome!' and a nice HTML body."

The AI will call `send-email` with:
```json
{
  "from": "hello@mydomain.com",
  "to": "john@example.com",
  "subject": "Welcome!",
  "html": "<h1>Welcome!</h1><p>Thanks for signing up.</p>"
}
```

### Sending with a template and variables

> "Send the 'welcome-email' template to sarah@example.com with her name as Sarah."

```json
{
  "from": "hello@mydomain.com",
  "to": "sarah@example.com",
  "template": "welcome-email",
  "variables": { "name": "Sarah" }
}
```

### Scheduling an email

> "Schedule a reminder email to team@company.com for tomorrow at 9am."

```json
{
  "from": "reminders@mydomain.com",
  "to": "team@company.com",
  "subject": "Daily Standup Reminder",
  "text": "Don't forget the standup at 9:30!",
  "scheduled_at": "tomorrow at 9am"
}
```

### Sending with attachments

> "Send an email to accounting@company.com with the invoice PDF attached."

```json
{
  "from": "billing@mydomain.com",
  "to": "accounting@company.com",
  "subject": "Monthly Invoice",
  "html": "<p>Please find the invoice attached.</p>",
  "attachments": [
    {
      "filename": "invoice-2026-05.pdf",
      "url": "https://mybucket.s3.amazonaws.com/invoices/2026-05.pdf"
    }
  ]
}
```

### Managing domains

> "Add my domain mail.example.com and show me the DNS records I need to set up."

The AI calls `create-domain` and displays the required DNS records (MX, SPF, DKIM, DMARC) for the user to configure with their DNS provider.

> "Verify my domain."

The AI calls `verify-domain` to check DNS propagation and reports back the verification status.

### Managing contacts

> "Add a new contact: Jane Smith, jane@example.com, subscribed to audience aud_abc123."

```json
{
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "audiences": ["aud_abc123"]
}
```

### Managing templates

> "Create a newsletter template with alias 'monthly-newsletter' and subject 'Monthly Update {{month}}'."

```json
{
  "name": "Monthly Newsletter",
  "alias": "monthly-newsletter",
  "subject": "Monthly Update {{month}}",
  "html": "<h1>{{month}} Update</h1><p>Here's what happened this month...</p>"
}
```

### Managing suppressions

> "Suppress bounced@example.com because of too many hard bounces."

```json
{
  "email": "bounced@example.com",
  "type": "bounce",
  "reason": "too many hard bounces"
}
```

### Working with webhooks

> "Create a webhook called 'Delivery Tracker' that sends delivery and bounce events to https://myapp.com/webhooks/email."

```json
{
  "name": "Delivery Tracker",
  "url": "https://myapp.com/webhooks/email",
  "events": ["email.delivered", "email.bounced"]
}
```

---

## Architecture

```
emailit-mcp/
├── src/
│   ├── index.js              # CLI entrypoint (#!/usr/bin/env node)
│   ├── server.js             # MCP server factory — registers all tools
│   ├── cli/
│   │   └── index.js          # Argument parsing & config resolution
│   ├── lib/
│   │   └── api-client.js     # Thin HTTP client wrapping Emailit API v2
│   ├── tools/
│   │   ├── index.js          # Re-exports all tool modules
│   │   ├── emails.js         # 10 email tools
│   │   ├── domains.js        # 6 domain tools
│   │   ├── api-keys.js       # 5 API key tools
│   │   ├── audiences.js      # 5 audience tools
│   │   ├── contacts.js       # 5 contact tools
│   │   ├── templates.js      # 6 template tools
│   │   ├── suppressions.js   # 5 suppression tools
│   │   └── webhooks.js       # 5 webhook tools
│   └── transports/
│       ├── stdio.js          # Stdio transport (StdioServerTransport)
│       └── http.js           # HTTP transport (Fastify + StreamableHTTPServerTransport)
├── package.json
├── LICENSE
└── README.md
```

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP protocol — `McpServer`, `StdioServerTransport`, `StreamableHTTPServerTransport` |
| `fastify` | HTTP server for the Streamable HTTP transport |
| `minimist` | CLI argument parsing |
| `zod` | Input schema validation for tool parameters |

---

## Local Development

```bash
git clone https://github.com/emailit/emailit-mcp.git
cd emailit-mcp
npm install

# Run in stdio mode
EMAILIT_API_KEY=your_key node src/index.js

# Run in HTTP mode
node src/index.js --http --port 3000
```

---

## ID Format Reference

All Emailit resources use prefixed IDs:

| Resource | Prefix | Example |
|----------|--------|---------|
| Email | `em_` | `em_4DimrphCktQKBVmHDZJupAX9lPd` |
| Domain | `dom_` | `dom_48kSRNGdIOwBiiDbCXhSV1MnIMt` |
| API Key | `key_` | `key_4DilQU1vMmqs6G0cbjj9MEokkqd` |
| Audience | `aud_` | `aud_4DimEKHUXL7rOb3GleiQZALr8MV` |
| Contact | `con_` | `con_4DimKbqkK2JVkebhHFuWq8BUfHR` |
| Template | `tem_` | `tem_4DimOvgEXgkNrQnsQAbXzgJBzM8` |
| Suppression | `sup_` | `sup_4DimWqXKnAMpQaFky4XqYZSGDTA` |
| Webhook | `wh_` | `wh_4DimiEcz2FueQVPU0VXbjFxgDJk` |

---

## Security Notes

- API keys should never be committed to version control.
- In stdio mode, the API key is stored in the MCP client's configuration.
- In HTTP mode, clients pass the API key per-session via the `Authorization: Bearer` header, so the server itself doesn't store keys.
- Webhook URLs are validated against SSRF before creation.
- Delete operations in the MCP server include safety prompts instructing the AI to confirm with the user before proceeding.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key required for stdio mode" | Set `EMAILIT_API_KEY` env var or pass `--key` |
| Domain not verified | Configure DNS records from `create-domain` output, then call `verify-domain` |
| Email rejected / not sending | Ensure domain is verified and sender address uses that domain |
| Scheduled email can't be canceled | Must be at least 3 minutes before scheduled time |
| Retry fails | Only hard-failed, errored, held, or suppressed emails can be retried |
