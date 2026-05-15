#!/usr/bin/env node

import { parseArgs, resolveConfigOrExit } from './cli/index.js';
import { EmailitApiClient } from './lib/api-client.js';
import { runStdio } from './transports/stdio.js';
import { runHttp } from './transports/http.js';

const parsed = parseArgs(process.argv.slice(2));
const config = resolveConfigOrExit(parsed, process.env);

const serverOptions = {
  senderEmailAddress: config.senderEmailAddress,
  replierEmailAddresses: config.replierEmailAddresses,
};

function onFatal(err) {
  console.error('Fatal error:', err instanceof Error ? err.message : 'unexpected error');
  process.exit(1);
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

if (config.transport === 'http') {
  runHttp(serverOptions, config.port).catch(onFatal);
} else {
  const apiClient = new EmailitApiClient(config.apiKey);
  runStdio(apiClient, serverOptions).catch(onFatal);
}
