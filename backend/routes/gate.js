const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.post('/verify', (req, res) => {
  const token = (req.body?.token || '').trim();
  const expected = process.env.ACCESS_TOKEN;

  if (!expected || !token) {
    return res.redirect('/?error=1');
  }

  let valid = false;
  if (token.length === expected.length) {
    try {
      valid = crypto.timingSafeEqual(
        Buffer.from(token, 'utf8'),
        Buffer.from(expected, 'utf8')
      );
    } catch (_) {}
  }

  if (!valid) {
    return res.redirect('/?error=1');
  }

  res.cookie('visa_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.redirect('/');
});

router.post('/logout', (req, res) => {
  res.clearCookie('visa_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.redirect('/');
});

module.exports = router;
