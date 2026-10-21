export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
export class ApiClient {
  constructor(
    private baseUrl: string,
    private token?: string,
    private onUnauthorized?: () => void,
  ) {}
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    // Free demo hosts can take about a minute to resume after idling.
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(this.baseUrl + path, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}),
        },
      });
      if (response.status === 401) this.onUnauthorized?.();
      if (response.status === 204) return undefined as T;
      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        throw new ApiError(
          response.status,
          'INVALID_RESPONSE',
          'The server returned an unreadable response. Please try again.',
        );
      }
      if (!response.ok) {
        throw new ApiError(
          response.status,
          body.error?.code ?? 'HTTP_ERROR',
          body.error?.message ??
            'Unable to complete your request. Please try again.',
          body.error?.fields,
        );
      }
      return body as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        controller.signal.aborted
          ? 'The server took too long. Check your connection and try again.'
          : 'Cannot reach your server. Check your connection and server address.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
