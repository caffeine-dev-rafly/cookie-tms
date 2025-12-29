const buildBaseUrl = () => {
  const env = import.meta?.env || {};
  return (
    env.VITE_TRACCAR_SOCKET_URL ||
    env.VITE_SOCKET_URL ||
    env.VITE_TRACCAR_BASE ||
    'http://localhost:8082'
  );
};

const buildCredentials = () => {
  const env = import.meta?.env || {};
  return {
    username:
      env.VITE_TRACCAR_WS_USER ||
      env.VITE_TRACCAR_USER ||
      'admin@admin.com',
    password:
      env.VITE_TRACCAR_WS_PASSWORD ||
      env.VITE_TRACCAR_PASSWORD ||
      'admin',
  };
};

const toHttpProtocol = (url) => url.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:');
const toWsProtocol = (url) => url.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

export const buildTraccarSocketUrl = () => {
  const base = buildBaseUrl();

  try {
    const parsed = new URL(toWsProtocol(base));
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    parsed.pathname = parsed.pathname.endsWith('/api/socket')
      ? parsed.pathname
      : `${parsed.pathname.replace(/\/$/, '')}/api/socket`;

    // Rely on the session cookie instead of embedding credentials in the URL.
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    const host = window?.location?.hostname || 'localhost';
    const protocol = window?.location?.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${host}:8082/api/socket`;
  }
};

// Keep one in-flight session request so multiple callers don't spam the server.
let sessionPromise;
const ensureTraccarSession = async () => {
  if (sessionPromise) return sessionPromise;

  const { username, password } = buildCredentials();
  const base = toHttpProtocol(buildBaseUrl());
  const sessionUrl = `${base.replace(/\/$/, '')}/api/session`;
  const body = new URLSearchParams({ email: username, password });

  sessionPromise = fetch(sessionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`Traccar session failed (${res.status})`);
    }
    return true;
  }).catch((err) => {
    sessionPromise = null;
    throw err;
  });

  return sessionPromise;
};

export const startTraccarSocket = ({ onStatus, onPayload, onError } = {}) => {
  let socket;
  let stopped = false;
  let reconnectTimer;

  const reportStatus = (status) => {
    if (!stopped && typeof onStatus === 'function') {
      onStatus(status);
    }
  };

  const connect = async () => {
    const url = buildTraccarSocketUrl();
    reportStatus('connecting');

    try {
      await ensureTraccarSession();
      if (stopped) return;
      socket = new WebSocket(url);
    } catch (err) {
      console.error('Traccar WebSocket init failed', err);
      reportStatus('error');
      if (typeof onError === 'function') onError(err);
      reconnectTimer = setTimeout(connect, 4000);
      return;
    }

    socket.onopen = () => reportStatus('connected');

    socket.onmessage = (event) => {
      if (stopped) return;
      try {
        const payload = JSON.parse(event.data);
        if (typeof onPayload === 'function') onPayload(payload);
      } catch (err) {
        console.error('Failed to parse Traccar socket payload', err);
      }
    };

    socket.onerror = (err) => {
      if (stopped) return;
      console.error('Traccar WebSocket error', err);
      reportStatus('error');
      if (typeof onError === 'function') onError(err);
    };

    socket.onclose = () => {
      if (stopped) return;
      reportStatus('retrying');
      reconnectTimer = setTimeout(connect, 4000);
    };
  };

  connect();

  return () => {
    stopped = true;
    clearTimeout(reconnectTimer);
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close(1000, 'component cleanup');
    }
  };
};
