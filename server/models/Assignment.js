
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true,
      default: undefined,
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: 100
    },

    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },

    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
