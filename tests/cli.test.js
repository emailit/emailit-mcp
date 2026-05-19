import { describe, it, expect } from 'vitest';
import { parseArgs, resolveConfig } from '../src/cli/index.js';

describe('CLI', () => {
  it('parses --key argument', () => {
    const parsed = parseArgs(['--key', 'secret_abc']);
    expect(parsed.key).toBe('secret_abc');
  });

  it('parses --http flag', () => {
    const parsed = parseArgs(['--http']);
    expect(parsed.http).toBe(true);
  });

  it('parses --port argument', () => {
    const parsed = parseArgs(['--port', '4000']);
    expect(parsed.port).toBe('4000');
  });

  it('parses --sender argument', () => {
    const parsed = parseArgs(['--sender', 'hello@example.com']);
    expect(parsed.sender).toBe('hello@example.com');
  });

  it('parses --reply-to argument', () => {
    const parsed = parseArgs(['--reply-to', 'reply@example.com']);
    expect(parsed['reply-to']).toBe('reply@example.com');
  });

  it('parses multiple --reply-to arguments', () => {
    const parsed = parseArgs(['--reply-to', 'a@x.com', '--reply-to', 'b@x.com']);
    expect(parsed['reply-to']).toEqual(['a@x.com', 'b@x.com']);
  });

  it('parses -h as help', () => {
    const parsed = parseArgs(['-h']);
    expect(parsed.help).toBe(true);
  });
});

describe('resolveConfig', () => {
  it('resolves stdio config from args', () => {
    const parsed = parseArgs(['--key', 'secret_abc', '--sender', 'hi@x.com']);
    const result = resolveConfig(parsed, {});
    expect(result.ok).toBe(true);
    expect(result.config.transport).toBe('stdio');
    expect(result.config.apiKey).toBe('secret_abc');
    expect(result.config.senderEmailAddress).toBe('hi@x.com');
  });

  it('resolves stdio config from env vars', () => {
    const parsed = parseArgs([]);
    const result = resolveConfig(parsed, {
      EMAILIT_API_KEY: 'secret_env',
      SENDER_EMAIL_ADDRESS: 'env@x.com',
      REPLY_TO_EMAIL_ADDRESSES: 'r1@x.com,r2@x.com',
    });
    expect(result.ok).toBe(true);
    expect(result.config.apiKey).toBe('secret_env');
    expect(result.config.senderEmailAddress).toBe('env@x.com');
    expect(result.config.replierEmailAddresses).toEqual(['r1@x.com', 'r2@x.com']);
  });

  it('fails when stdio has no API key', () => {
    const parsed = parseArgs([]);
    const result = resolveConfig(parsed, {});
    expect(result.ok).toBe(false);
    expect(result.error).toContain('API key is required');
  });

  it('allows HTTP mode without API key', () => {
    const parsed = parseArgs(['--http']);
    const result = resolveConfig(parsed, {});
    expect(result.ok).toBe(true);
    expect(result.config.transport).toBe('http');
    expect(result.config.apiKey).toBe('');
  });

  it('resolves port from env var', () => {
    const parsed = parseArgs(['--http']);
    const result = resolveConfig(parsed, { MCP_PORT: '5000' });
    expect(result.ok).toBe(true);
    expect(result.config.port).toBe(5000);
  });

  it('uses default port 3000', () => {
    const parsed = parseArgs(['--http']);
    const result = resolveConfig(parsed, {});
    expect(result.config.port).toBe(3000);
  });
});
