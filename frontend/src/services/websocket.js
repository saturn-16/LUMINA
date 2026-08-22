/**
 * WebSocket client helper for real-time seat status updates per show.
 */
export function connectShowWebSocket(showId, onMessage, onError) {
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  const wsHost = isVercel ? 'lumina-16hr.onrender.com' : window.location.host;
  const protocol = isVercel || window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${wsHost}/ws/shows/${showId}`;

  let ws;
  let isClosedManually = false;

  function initSocket() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Send ping every 30s to keep alive
      ws.pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (err) {
        // Ping response or non-JSON
      }
    };

    ws.onerror = (err) => {
      if (onError) onError(err);
    };

    ws.onclose = () => {
      clearInterval(ws.pingInterval);
      if (!isClosedManually) {
        // Reconnect after 3 seconds
        setTimeout(() => {
          if (!isClosedManually) initSocket();
        }, 3000);
      }
    };
  }

  initSocket();

  return {
    close: () => {
      isClosedManually = true;
      if (ws) {
        clearInterval(ws.pingInterval);
        ws.close();
      }
    },
  };
}
