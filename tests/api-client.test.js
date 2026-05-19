import { describe, it, expect } from 'vitest';
import { EmailitApiClient } from '../src/lib/api-client.js';

describe('EmailitApiClient', () => {
  it('constructs with API key', () => {
    const client = new EmailitApiClient('secret_test');
    expect(client.apiKey).toBe('secret_test');
  });

  it('has a request method', () => {
    const client = new EmailitApiClient('secret_test');
    expect(typeof client.request).toBe('function');
  });
});
