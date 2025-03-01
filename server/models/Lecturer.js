const lecturerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  specialization: String,
  employmentStatus: {
    type: String,
    enum: ['FULL_TIME', 'PART_TIME'],
    default: 'FULL_TIME'
  },
  joinDate: Date,
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }]
}); 