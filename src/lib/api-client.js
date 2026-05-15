const BASE_URL = 'https://api.emailit.com/v2';

export class EmailitApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async request(method, path, { body, query } = {}) {
    let url = `${BASE_URL}${path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.set(k, String(v));
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const hasBody = body && (method === 'POST' || method === 'PATCH' || method === 'PUT');

    const opts = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    };

    if (hasBody) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const msg = data.error
        ? typeof data.error === 'string'
          ? data.error
          : JSON.stringify(data.error)
        : data.message || JSON.stringify(data);
      throw new Error(msg);
    }

    return data;
  }
}
