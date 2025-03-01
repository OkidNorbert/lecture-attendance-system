export const validateLecturerForm = (data) => {
  const errors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.department.trim()) {
    errors.department = 'Department is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCourseAssignment = (data) => {
  const errors = {};

  if (!data.lecturerId) {
    errors.lecturerId = 'Lecturer selection is required';
  }

  if (!data.courseName.trim()) {
    errors.courseName = 'Course name is required';
  }

  if (!data.courseCode.trim()) {
    errors.courseCode = 'Course code is required';
  }

  if (!data.courseUnit || data.courseUnit < 1 || data.courseUnit > 6) {
    errors.courseUnit = 'Course units must be between 1 and 6';
  }

  if (!data.academicYear.trim()) {
    errors.academicYear = 'Academic year is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 