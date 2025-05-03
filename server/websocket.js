const WebSocket = require('ws');
const Session = require('./models/Session');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws',
    clientTracking: true
  });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection from:', req.socket.remoteAddress);
    let sessionId = null;
    let updateInterval = null;

    ws.on('message', async (message) => {
      try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe') {
        sessionId = data.sessionId;
          if (updateInterval) {
            clearInterval(updateInterval);
          }
        startSessionUpdates(ws, sessionId);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });
  });

  return wss;
}

async function startSessionUpdates(ws, sessionId) {
  const interval = setInterval(async () => {
    try {
      if (ws.readyState !== WebSocket.OPEN) {
        clearInterval(interval);
        return;
      }

      const session = await Session.findById(sessionId)
        .populate('attendees.studentId', 'name');

      if (!session) {
        clearInterval(interval);
        return;
      }

      const realTimeData = {
        type: 'sessionUpdate',
        data: {
          totalStudents: session.totalStudents,
          presentCount: session.presentCount,
          recentCheckins: session.attendees
            .filter(a => new Date(a.checkInTime) > new Date(Date.now() - 5 * 60000))
            .map(a => ({
              student: a.studentId.name,
              time: a.checkInTime,
              status: a.status
            })),
          attendanceRate: (session.presentCount / session.totalStudents) * 100,
          lastUpdate: new Date()
        }
      };

      ws.send(JSON.stringify(realTimeData));
    } catch (error) {
      console.error('Error sending session update:', error);
      clearInterval(interval);
    }
  }, 5000); // Update every 5 seconds

  return interval;
}

module.exports = setupWebSocket; 