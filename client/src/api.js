const BASE = '/api';

const headers = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  get:    (path)       => fetch(`${BASE}${path}`, { headers: headers() }).then(handle),
  post:   (path, body) => fetch(`${BASE}${path}`, { method: 'POST',   headers: headers(), body: JSON.stringify(body) }).then(handle),
  put:    (path, body) => fetch(`${BASE}${path}`, { method: 'PUT',    headers: headers(), body: JSON.stringify(body) }).then(handle),
  delete: (path)       => fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() }).then(handle),
};
