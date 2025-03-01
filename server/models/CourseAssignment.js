const courseAssignmentSchema = new Schema({
  lecturer: {
    type: Schema.Types.ObjectId,
    ref: 'Lecturer',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    enum: [1, 2]
  },
  academicYear: {
    type: String,
    required: true
  },
  studentYear: {
    type: Number,
    required: true
  },
  courseUnit: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  }
}); 