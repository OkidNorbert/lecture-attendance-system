const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Session = require('../models/Session');
const Course = require('../models/Course');
const mongoose = require('mongoose');
const moment = require('moment');

// @route   GET api/attendance/trends/daily/:courseId
// @desc    Get daily attendance patterns with time slots
// @access  Private
router.get('/daily/:courseId', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      courseId: mongoose.Types.ObjectId(req.params.courseId),
      lecturerId: mongoose.Types.ObjectId(req.user.id)
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const dailyData = await Session.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            timeSlot: {
              $switch: {
                branches: [
                  { case: { $lt: [{ $hour: "$createdAt" }, 12] }, then: "Morning" },
                  { case: { $lt: [{ $hour: "$createdAt" }, 17] }, then: "Afternoon" },
                  { case: { $lt: [{ $hour: "$createdAt" }, 21] }, then: "Evening" }
                ],
                default: "Night"
              }
            }
          },
          attendanceRate: {
            $avg: { $divide: ["$presentCount", "$totalStudents"] }
          },
          totalSessions: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id.date",
          timeSlot: "$_id.timeSlot",
          attendanceRate: { $multiply: ["$attendanceRate", 100] },
          totalSessions: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(dailyData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/trends/monthly-comparison
// @desc    Get monthly comparison across different courses
// @access  Private
router.get('/monthly-comparison', protect, async (req, res) => {
  try {
    const monthlyData = await Session.aggregate([
      {
        $match: {
          lecturerId: mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            course: "$courseId"
          },
          avgAttendance: {
            $avg: { $divide: ["$presentCount", "$totalStudents"] }
          }
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id.course",
          foreignField: "_id",
          as: "courseInfo"
        }
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          course: { $arrayElemAt: ["$courseInfo.name", 0] },
          attendanceRate: { $multiply: ["$avgAttendance", 100] },
          _id: 0
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    res.json(monthlyData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/trends/student-performance/:courseId
// @desc    Get student attendance performance trends
// @access  Private
router.get('/student-performance/:courseId', protect, async (req, res) => {
  try {
    const performanceData = await Session.aggregate([
      {
        $match: {
          courseId: mongoose.Types.ObjectId(req.params.courseId),
          lecturerId: mongoose.Types.ObjectId(req.user.id)
        }
      },
      { $unwind: "$attendees" },
      {
        $group: {
          _id: "$attendees.studentId",
          totalSessions: { $sum: 1 },
          presentSessions: {
            $sum: {
              $cond: [{ $eq: ["$attendees.status", "present"] }, 1, 0]
            }
          },
          lateSessions: {
            $sum: {
              $cond: [{ $eq: ["$attendees.status", "late"] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      {
        $project: {
          student: { $arrayElemAt: ["$studentInfo.name", 0] },
          attendanceRate: {
            $multiply: [
              { $divide: ["$presentSessions", "$totalSessions"] },
              100
            ]
          },
          lateRate: {
            $multiply: [
              { $divide: ["$lateSessions", "$totalSessions"] },
              100
            ]
          },
          _id: 0
        }
      },
      { $sort: { attendanceRate: -1 } }
    ]);

    res.json(performanceData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/trends/real-time/:sessionId
// @desc    Get real-time attendance updates for active session
// @access  Private
router.get('/real-time/:sessionId', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('attendees.studentId', 'name');

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    const realTimeData = {
      totalStudents: session.totalStudents,
      presentCount: session.presentCount,
      recentCheckins: session.attendees
        .filter(a => moment(a.checkInTime).isAfter(moment().subtract(5, 'minutes')))
        .map(a => ({
          student: a.studentId.name,
          time: a.checkInTime,
          status: a.status
        })),
      attendanceRate: (session.presentCount / session.totalStudents) * 100,
      lastUpdate: new Date()
    };

    res.json(realTimeData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/trends/hourly/:courseId
// @desc    Get hourly attendance patterns
// @access  Private
router.get('/hourly/:courseId', protect, async (req, res) => {
  try {
    const hourlyData = await Session.aggregate([
      {
        $match: {
          courseId: mongoose.Types.ObjectId(req.params.courseId),
          lecturerId: mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $unwind: '$attendees'
      },
      {
        $group: {
          _id: {
            $hour: '$attendees.checkInTime'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          hour: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { hour: 1 }
      }
    ]);

    res.json(hourlyData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/trends/weekly/:courseId
// @desc    Get weekly attendance trends
// @access  Private
router.get('/weekly/:courseId', protect, async (req, res) => {
  try {
    const weeklyData = await Session.aggregate([
      {
        $match: {
          courseId: mongoose.Types.ObjectId(req.params.courseId),
          lecturerId: mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $group: {
          _id: {
            week: { $week: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          attendance: { $avg: { $divide: ['$presentCount', '$totalStudents'] } },
          totalSessions: { $sum: 1 }
        }
      },
      {
        $project: {
          week: '$_id.week',
          year: '$_id.year',
          attendance: { $multiply: ['$attendance', 100] },
          average: { $multiply: [{ $divide: ['$presentCount', '$totalStudents'] }, 100] },
          _id: 0
        }
      },
      {
        $sort: { year: 1, week: 1 }
      }
    ]);

    res.json(weeklyData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/trends/program-comparison
// @desc    Get attendance comparison across programs
// @access  Private
router.get('/program-comparison', protect, async (req, res) => {
  try {
    const programData = await Session.aggregate([
      {
        $match: {
          lecturerId: mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $group: {
          _id: '$program',
          totalPresent: { $sum: '$presentCount' },
          totalStudents: { $sum: '$totalStudents' }
        }
      },
      {
        $project: {
          program: '$_id',
          rate: {
            $multiply: [
              { $divide: ['$totalPresent', '$totalStudents'] },
              100
            ]
          },
          _id: 0
        }
      }
    ]);

    res.json(programData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/export/chart/:sessionId/:type
// @desc    Export chart as image
// @access  Private
router.get('/export/chart/:sessionId/:type', protect, async (req, res) => {
  try {
    const { sessionId, type } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
    let chartData;
    let chartConfig;

    switch (type) {
      case 'attendance':
        chartData = {
          labels: ['Present', 'Absent', 'Late'],
          datasets: [{
            data: [
              session.presentCount,
              session.totalStudents - session.presentCount,
              session.attendees.filter(a => a.status === 'late').length
            ],
            backgroundColor: ['#4CAF50', '#f44336', '#FFA726']
          }]
        };
        chartConfig = {
          type: 'pie',
          data: chartData,
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Attendance Distribution'
              }
            }
          }
        };
        break;

      case 'timeline':
        // Process check-in timeline data
        const timelineData = session.attendees
          .filter(a => a.checkInTime)
          .reduce((acc, curr) => {
            const hour = new Date(curr.checkInTime).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
          }, {});

        chartConfig = {
          type: 'bar',
          data: {
            labels: Object.keys(timelineData),
            datasets: [{
              label: 'Check-ins',
              data: Object.values(timelineData),
              backgroundColor: '#2196F3'
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Check-in Timeline'
              }
            }
          }
        };
        break;

      default:
        return res.status(400).json({ msg: 'Invalid chart type' });
    }

    const image = await chartJSNodeCanvas.renderToBuffer(chartConfig);
    res.type('image/png').send(image);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 