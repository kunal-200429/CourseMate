const crypto = require('crypto');

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const secret = process.env.AUTH_SECRET;

function signature(value) {
  if (!secret) throw new Error('AUTH_SECRET is not configured.');
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function createToken(studentId) {
  const payload = Buffer.from(JSON.stringify({
    sub: String(studentId),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  })).toString('base64url');
  const unsigned = `v1.${payload}`;
  return `${unsigned}.${signature(unsigned)}`;
}

function readToken(token) {
  const [version, payload, suppliedSignature, extra] = (token || '').split('.');
  if (version !== 'v1' || !payload || !suppliedSignature || extra) return null;
  const unsigned = `${version}.${payload}`;
  const expected = signature(unsigned);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.sub || !Number.isFinite(data.exp) || data.exp <= Date.now() / 1000) return null;
    return data;
  } catch {
    return null;
  }
}

module.exports = { createToken, readToken };
