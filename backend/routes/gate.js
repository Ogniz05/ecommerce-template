const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { optionalAuth } = require('../middleware/auth');
const { resolveAccessCode, recordVisit } = require('../services/betaAccess');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

router.post('/verify', async (req, res) => {
  try {
    const code = (req.body?.token || '').trim();
    const match = await resolveAccessCode(code);

    if (!match) return res.redirect('/?error=1');

    // Marks the invite as used, which is how you tell an invite that was sent
    // from one that was acted on.
    if (match.kind === 'tester') await recordVisit(match.testerId);

    res.cookie('visa_token', code, COOKIE_OPTS);
    res.redirect('/');
  } catch (error) {
    console.error('Gate verify failed:', error.message);
    res.redirect('/?error=1');
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('visa_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.redirect('/');
});

/**
 * POST /api/gate/feedback
 *
 * Where testers report what they found. Previously there was nowhere: the gate
 * let people in and the programme ended there, so findings arrived as messages
 * to whoever happened to be around, or not at all.
 *
 * Open to anyone past the gate — a tester who cannot get in is exactly the
 * person with something to report, and requiring an account to file a bug
 * loses the reports that matter most.
 */
router.post('/feedback', optionalAuth, async (req, res, next) => {
  try {
    const { kind, message, pageUrl, viewport } = req.body || {};

    const text = String(message || '').trim();
    if (text.length < 5) {
      return res.status(400).json({ success: false, message: 'Scrivi qualche parola in più.' });
    }

    const allowedKinds = ['bug', 'idea', 'confusing', 'praise'];
    const resolvedKind = allowedKinds.includes(kind) ? kind : 'bug';

    // Ties the report to the tester whose invite is in the cookie, so you know
    // who hit what without asking them to identify themselves in the form.
    const cookieCode = req.cookies?.visa_token
      || (req.headers.cookie || '').split(';')
          .map(c => c.trim().split('='))
          .find(([k]) => k === 'visa_token')?.[1];

    let testerId = null;
    if (cookieCode) {
      const match = await resolveAccessCode(decodeURIComponent(cookieCode));
      if (match?.kind === 'tester') testerId = match.testerId;
    }

    await sequelize.query(
      `INSERT INTO beta_feedback (tester_id, user_id, kind, message, page_url, viewport, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          testerId,
          req.user?.id || null,
          resolvedKind,
          text.slice(0, 5000),
          String(pageUrl || '').slice(0, 500) || null,
          String(viewport || '').slice(0, 32) || null,
          String(req.headers['user-agent'] || '').slice(0, 255) || null
        ],
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({ success: true, message: 'Grazie: la segnalazione è arrivata.' });
  } catch (error) { next(error); }
});

module.exports = router;
