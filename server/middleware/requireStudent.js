const mongoose = require('mongoose');
const Student = require('../models/Student');
const { readToken } = require('../auth/token');

async function requireStudent(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const claims = readToken(token);

  if (!claims || !mongoose.isValidObjectId(claims.sub)) {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }

  try {
    const student = await Student.findById(claims.sub).select('_id name email');
    if (!student) return res.status(401).json({ message: 'Your account could not be found. Please sign in again.' });
    req.student = student;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = requireStudent;
