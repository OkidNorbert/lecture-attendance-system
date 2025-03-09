import { useState, useEffect } from 'react';

const useRealTimeUpdates = (sessionId) => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        sessionId
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sessionUpdate') {
        setRealTimeData(data.data);
      }
    };

    ws.onerror = (error) => {
      setError('WebSocket connection error');
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  return { realTimeData, error };
};

export default useRealTimeUpdates; 