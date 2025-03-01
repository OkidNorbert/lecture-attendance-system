const express = require('express');
const router = express.Router();

// Lecturer Management
router.post('/lecturers', createLecturer);
router.get('/lecturers', getAllLecturers);
router.put('/lecturers/:id', updateLecturer);
router.delete('/lecturers/:id', deleteLecturer);

// Course Assignments
router.post('/assignments', createAssignment);
router.get('/assignments', getAssignments);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);

// Reports
router.get('/reports/lecturers', getLecturerReports);
router.get('/reports/courses', getCourseReports); 