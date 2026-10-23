const crypto = require('crypto');
const express = require('express');
const { promisify } = require('util');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const requireStudent = require('../middleware/requireStudent');
const { createToken } = require('../auth/token');

const router = express.Router();
const scrypt = promisify(crypto.scrypt);
const PASSWORD_BYTES = 64;

function publicStudent(student) {
  return { id: String(student._id), name: student.name, email: student.email };
}

async function passwordDigest(password, salt) {
  return (await scrypt(password, salt, PASSWORD_BYTES)).toString('hex');
}

function validEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/signup', async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.length < 2 || name.length > 60) return res.status(400).json({ message: 'Enter your name (2–60 characters).' });
    if (!validEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Use a password between 8 and 128 characters.' });

    const existing = await Student.findOne({ email }).select('_id');
    if (existing) return res.status(409).json({ message: 'An account already exists with this email. Sign in instead.' });

    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await passwordDigest(password, passwordSalt);
    const student = await Student.create({ name, email, passwordSalt, passwordHash });

    // Keep the coursework already stored in this project by assigning legacy rows
    // to the first student account created after authentication is enabled.
    if (await Student.countDocuments() === 1) {
      await Assignment.updateMany({ ownerId: { $exists: false } }, { $set: { ownerId: student._id } });
    }

    return res.status(201).json({ token: createToken(student._id), student: publicStudent(student) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account already exists with this email. Sign in instead.' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!validEmail(email) || !password) return res.status(400).json({ message: 'Enter your email and password.' });

    const student = await Student.findOne({ email }).select('+passwordHash +passwordSalt');
    if (!student) return res.status(401).json({ message: 'Email or password is incorrect.' });
    const candidate = Buffer.from(await passwordDigest(password, student.passwordSalt), 'hex');
    const saved = Buffer.from(student.passwordHash, 'hex');
    if (candidate.length !== saved.length || !crypto.timingSafeEqual(candidate, saved)) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    return res.status(200).json({ token: createToken(student._id), student: publicStudent(student) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireStudent, (req, res) => res.status(200).json({ student: publicStudent(req.student) }));

module.exports = router;
