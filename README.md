# Emailit MCP Server

An MCP server for the [Emailit](https://emailit.com/) platform. Send emails, manage contacts, domains, templates, and more, directly from any MCP client like Claude Desktop, Cursor, or Claude Code.

## Features

- **Emails** — Send, list, get, cancel, update, and retry emails. Supports HTML, plain text, attachments, CC/BCC, reply-to, scheduling, tags, templates, and tracking.
- **Domains** — Create, list, get, update, delete, and verify sender domains. Configure tracking and view DNS records.
- **API Keys** — Create, list, get, update, and delete API keys.
- **Audiences** — Create, list, get, update, and delete audiences for campaigns.
- **Contacts** — Create, list, get, update, and delete contacts. Manage custom fields and audience subscriptions.
- **Templates** — Create, list, get, update, delete, and publish reusable email templates.
- **Suppressions** — Create, list, get, update, and delete email suppressions.
- **Webhooks** — Create, list, get, update, and delete webhooks for event notifications.

## Setup

Create a free Emailit account and [create an API key](https://emailit.com/dashboard). To send to addresses outside of your own, you'll need to [verify your domain](https://emailit.com/dashboard).

## Usage

The server supports two transport modes: stdio (default) and HTTP.

### Stdio Transport (Default)

#### Claude Code

```bash
claude mcp add emailit -e EMAILIT_API_KEY=em_xxx -- npx -y emailit-mcp
```

#### Cursor

Open the command palette and choose "Cursor Settings" > "MCP" > "Add new global MCP server".

```json
{
  "mcpServers": {
    "emailit": {
      "command": "npx",
      "args": ["-y", "emailit-mcp"],
      "env": {
        "EMAILIT_API_KEY": "em_xxx"
      }
    }
  }
}
```

#### Claude Desktop

Open Claude Desktop settings > "Developer" tab > "Edit Config".

```json
{
  "mcpServers": {
    "emailit": {
      "command": "npx",
      "args": ["-y", "emailit-mcp"],
      "env": {
        "EMAILIT_API_KEY": "em_xxx"
      }
    }
  }
}
```

### HTTP Transport

Run the server over HTTP for remote or web-based integrations. In HTTP mode, each client authenticates by passing their Emailit API key as a Bearer token in the `Authorization` header.

Start the server:

```bash
npx -y emailit-mcp --http --port 3000
```

The server will listen on `http://127.0.0.1:3000` and expose the MCP endpoint at `/mcp` using Streamable HTTP.

#### Claude Code

```bash
claude mcp add emailit --transport http http://127.0.0.1:3000/mcp --header "Authorization: Bearer em_xxx"
```

#### Cursor

```json
{
  "mcpServers": {
    "emailit": {
      "url": "http://127.0.0.1:3000/mcp",
      "headers": {
        "Authorization": "Bearer em_xxx"
      }
    }
  }
}
```

You can also set the port via the `MCP_PORT` environment variable:

```bash
MCP_PORT=3000 npx -y emailit-mcp --http
```

### Options

You can pass additional arguments to configure the server:

- `--key`: Your Emailit API key (stdio mode only; HTTP mode uses the Bearer token from the client)
- `--sender`: Default sender email address from a verified domain
- `--reply-to`: Default reply-to email address (can be specified multiple times)
- `--http`: Use HTTP transport instead of stdio (default: stdio)
- `--port`: HTTP port when using `--http` (default: 3000, or `MCP_PORT` env var)

Environment variables:

- `EMAILIT_API_KEY`: Your Emailit API key (required for stdio, optional for HTTP since clients pass it via Bearer token)
- `SENDER_EMAIL_ADDRESS`: Default sender email address from a verified domain (optional)
- `REPLY_TO_EMAIL_ADDRESSES`: Comma-separated reply-to email addresses (optional)
- `MCP_PORT`: HTTP port when using `--http` (optional)

> **Note:** If you don't provide a sender email address, the MCP server will ask you to provide one each time you send an email.

## Local Development

1. Clone this project and install dependencies:

```bash
git clone https://github.com/emailit/emailit-mcp.git
cd emailit-mcp
npm install
```

1. Run locally:

```bash
EMAILIT_API_KEY=em_xxx node src/index.js
```

1. For HTTP mode:

```bash
node src/index.js --http --port 3000
```

## License

MIT