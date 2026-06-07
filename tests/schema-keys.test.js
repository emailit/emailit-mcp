import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../src/server.js';

const ANTHROPIC_KEY_PATTERN = /^[a-zA-Z0-9_.-]{1,64}$/;

describe('Tool input schema property keys', () => {
  it('all property keys match Anthropic pattern ^[a-zA-Z0-9_.-]{1,64}$', () => {
    const fakeClient = { request: () => {} };
    const options = { senderEmailAddress: '', replierEmailAddresses: [] };
    const server = createMcpServer(fakeClient, options);
    const tools = server._registeredTools;
    const violations = [];

    for (const [name, tool] of Object.entries(tools)) {
      const schema = tool.inputSchema;
      if (schema && schema.shape) {
        for (const key of Object.keys(schema.shape)) {
          if (!ANTHROPIC_KEY_PATTERN.test(key)) {
            violations.push(`${name}: "${key}"`);
          }
        }
      }
    }

    expect(violations, `Invalid property keys:\n${violations.join('\n')}`).toEqual([]);
  });

  it('exposes 47 tools', () => {
    const fakeClient = { request: () => {} };
    const options = { senderEmailAddress: '', replierEmailAddresses: [] };
    const server = createMcpServer(fakeClient, options);
    expect(Object.keys(server._registeredTools).length).toBe(47);
  });
});
