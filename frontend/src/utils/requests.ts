const BASE_URL = "https://susnet.co.za/api";

export async function post(endpoint: string, body: object) {
  return await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
}

export async function get(endpoint: string) {
  return await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}

export async function getFedi(limit?: number, cursor?: string, sort?: 'top' | 'new' | 'hot') {
  return await post('/posts/fedi', {
    limit: limit || 20,
    cursor: cursor || '',
    sort: sort || 'new'
  });
}
