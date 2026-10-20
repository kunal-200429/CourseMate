
const express = require('express');
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');

const router = express.Router();

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Pending', 'Completed'];
const ALLOWED_FIELDS = [
  'title',
  'subject',
  'description',
  'dueDate',
  'priority',
  'status',
];

function validateAssignment(body, partial = false) {
  const errors = [];

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      errors.push('Title is required.');
    } else if (body.title.trim().length > 100) {
      errors.push('Title cannot exceed 100 characters.');
    }
  }

  if (!partial || body.subject !== undefined) {
    if (typeof body.subject !== 'string' || !body.subject.trim()) {
      errors.push('Subject is required.');
    } else if (body.subject.trim().length > 100) {
      errors.push('Subject cannot exceed 100 characters.');
    }
  }

  if (!partial || body.dueDate !== undefined) {
    if (
      !body.dueDate ||
      Number.isNaN(Date.parse(body.dueDate))
    ) {
      errors.push('A valid due date is required.');
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      errors.push('Description must be text.');
    } else if (body.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters.');
    }
  }

  if (
    body.priority !== undefined &&
    !VALID_PRIORITIES.includes(body.priority)
  ) {
    errors.push('Priority must be Low, Medium or High.');
  }

  if (
    body.status !== undefined &&
    !VALID_STATUSES.includes(body.status)
  ) {
    errors.push('Status must be Pending or Completed.');
  }

  return errors;
}

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: 'Invalid assignment ID.',
    });
  }

  next();
}

// GET: Fetch all assignments
router.get('/', async (req, res, next) => {
  try {
    const assignments = await Assignment.find().sort({ dueDate: 1 });
    return res.status(200).json(assignments);
  } catch (error) {
    return next(error);
  }
});

// POST: Create an assignment
router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateAssignment(body);

    if (errors.length) {
      return res.status(400).json({
        message: 'Please correct the submitted data.',
        errors,
      });
    }

    const assignment = await Assignment.create({
      title: body.title.trim(),
      subject: body.subject.trim(),
      description: (body.description || '').trim(),
      dueDate: new Date(body.dueDate),
      priority: body.priority || 'Medium',
      status: body.status || 'Pending',
    });

    return res.status(201).json(assignment);
  } catch (error) {
    return next(error);
  }
});

// PUT: Update an assignment or its status
router.put('/:id', validId, async (req, res, next) => {
  try {
    const body = req.body || {};
    const keys = Object.keys(body);

    if (
      keys.length === 0 ||
      keys.some((key) => !ALLOWED_FIELDS.includes(key))
    ) {
      return res.status(400).json({
        message: 'Provide valid assignment fields to update.',
      });
    }

    const errors = validateAssignment(body, true);

    if (errors.length) {
      return res.status(400).json({
        message: 'Please correct the submitted data.',
        errors,
      });
    }

    const updates = { ...body };

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    if (updates.subject !== undefined) {
      updates.subject = updates.subject.trim();
    }

    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }

    if (updates.dueDate !== undefined) {
      updates.dueDate = new Date(updates.dueDate);
    }

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!assignment) {
      return res.status(404).json({
        message: 'Assignment not found.',
      });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    return next(error);
  }
});

// DELETE: Remove an assignment
router.delete('/:id', validId, async (req, res, next) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: 'Assignment not found.',
      });
    }

    return res.status(200).json({
      message: 'Assignment deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
