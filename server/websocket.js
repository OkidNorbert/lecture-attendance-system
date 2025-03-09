const WebSocket = require('ws');
const Session = require('./models/Session');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    let sessionId = null;

    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe') {
        sessionId = data.sessionId;
        startSessionUpdates(ws, sessionId);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return wss;
}

async function startSessionUpdates(ws, sessionId) {
  const interval = setInterval(async () => {
    try {
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
}

module.exports = setupWebSocket; 