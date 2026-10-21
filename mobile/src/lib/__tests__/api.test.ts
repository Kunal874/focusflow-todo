import { ApiClient, ApiError } from '../api';

const response = (status: number, body?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn(async () => (body === undefined ? '' : JSON.stringify(body))),
  } as unknown as Response);
const fetchMock = jest.fn();
beforeEach(() => {
  globalThis.fetch = fetchMock;
  fetchMock.mockReset();
});

it('sends bearer credentials and parses a successful JSON response', async () => {
  fetchMock.mockResolvedValue(response(200, { tasks: [] }));
  const result = await new ApiClient(
    'https://example.com/api',
    'token',
  ).request('/tasks');
  expect(result).toEqual({ tasks: [] });
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('https://example.com/api/tasks');
  expect(options.headers).toMatchObject({
    Authorization: 'Bearer token',
    'Content-Type': 'application/json',
  });
});
it('does not parse a 204 delete response', async () => {
  const empty = response(204);
  fetchMock.mockResolvedValue(empty);
  await expect(
    new ApiClient('https://example.com/api').request('/tasks/id', {
      method: 'DELETE',
    }),
  ).resolves.toBeUndefined();
  expect(empty.text).not.toHaveBeenCalled();
});
it('preserves structured field errors and expires only confirmed unauthorized sessions', async () => {
  const expire = jest.fn();
  const client = new ApiClient('https://example.com/api', 'token', expire);
  fetchMock.mockResolvedValueOnce(
    response(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Check dates',
        fields: { deadlineAt: 'Too early' },
      },
    }),
  );
  await expect(client.request('/tasks')).rejects.toMatchObject({
    status: 400,
    fields: { deadlineAt: 'Too early' },
  });
  expect(expire).not.toHaveBeenCalled();
  fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
  await expect(client.request('/tasks')).rejects.toMatchObject({
    code: 'NETWORK_ERROR',
  });
  expect(expire).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(
    response(401, { error: { code: 'UNAUTHORIZED', message: 'Sign in' } }),
  );
  await expect(client.request('/tasks')).rejects.toBeInstanceOf(ApiError);
  expect(expire).toHaveBeenCalledTimes(1);
});
