import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/server.js';

describe('createMcpServer', () => {
  it('creates a server instance', () => {
    const fakeClient = { request: () => {} };
    const options = { senderEmailAddress: '', replierEmailAddresses: [] };
    const server = createMcpServer(fakeClient, options);
    expect(server).toBeDefined();
  });
});
