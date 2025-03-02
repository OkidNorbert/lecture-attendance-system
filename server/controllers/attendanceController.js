const Attendance = require('../models/Attendance');
const Session = require('../models/Session');

// Export individual functions
const markAttendance = async (req, res) => {
    try {
        const { studentId, lectureId } = req.body;
        
        // Check if attendance already marked
        const existingAttendance = await Attendance.findOne({
            student: studentId,
            lecture: lectureId
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'Attendance already marked' });
        }

        // Create new attendance record
        const attendance = new Attendance({
            student: studentId,
            lecture: lectureId,
            timestamp: new Date()
        });

        await attendance.save();
        res.status(201).json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error: error.message });
    }
};

const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const attendance = await Attendance.find({ student: studentId })
            .populate('lecture')
            .sort({ timestamp: -1 });
        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

const getLectureAttendance = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const attendance = await Attendance.find({ lecture: lectureId })
            .populate('student')
            .sort({ timestamp: -1 });
        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

// Export all functions
module.exports = {
    markAttendance,
    getStudentAttendance,
    getLectureAttendance
}; 