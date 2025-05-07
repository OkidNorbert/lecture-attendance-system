import { useState, useEffect, useCallback, useRef } from 'react';

const useRealTimeUpdates = (channel) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [socket, setSocket] = useState(null);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    try {
      // Create WebSocket connection
      const ws = new WebSocket(`${import.meta.env.VITE_WS_URL || 'ws://localhost:5000'}/ws`);
      
      ws.onopen = () => {
        console.log('WebSocket Connected');
        // Subscribe to the channel
        ws.send(JSON.stringify({ 
          type: 'subscribe',
          channel: channel // Send channel name instead of sessionId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        // Clean up current socket
        setSocket(null);
        // Attempt to reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 5000);
      };

      setSocket(ws);

      // Clean up existing socket
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      // Attempt to reconnect after error
      reconnectTimeout.current = setTimeout(() => {
        console.log('Attempting to reconnect after error...');
        connect();
      }, 5000);
    }
  }, [channel]);

  useEffect(() => {
    const cleanup = connect();

    return () => {
      if (cleanup) cleanup();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  return { lastMessage, socket };
};

export default useRealTimeUpdates;