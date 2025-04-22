import { useState, useEffect } from 'react';

const useRealTimeUpdates = (sessionId) => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Don't attempt to connect if sessionId is invalid
    if (!sessionId) {
      setError('Invalid session ID');
      return;
    }

    let ws = null;
    
    try {
      ws = new WebSocket('ws://localhost:5000');
      
      ws.onopen = () => {
        console.log('WebSocket connected for session:', sessionId);
        setIsConnected(true);
        setError(null);
        
        try {
          ws.send(JSON.stringify({
            type: 'subscribe',
            sessionId
          }));
        } catch (err) {
          console.error('Error sending subscription message:', err);
          setError('Failed to subscribe to session updates');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sessionUpdate') {
            setRealTimeData(data.data);
          } else if (data.type === 'error') {
            setError(data.message || 'Error from server');
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Error processing real-time data');
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        if (!event.wasClean) {
          setError(`Connection closed unexpectedly (code: ${event.code})`);
        }
      };
    } catch (err) {
      console.error('WebSocket initialization error:', err);
      setError('Failed to establish WebSocket connection');
    }

    // Cleanup function
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [sessionId]);

  return { realTimeData, error, isConnected };
};

export default useRealTimeUpdates; 