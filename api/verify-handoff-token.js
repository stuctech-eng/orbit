const jwt = require('jsonwebtoken');

// Fase D — stateless verificatie. Geen Firestore-toegang, geen
// Firebase Admin SDK, geen kennis van entitlements of accounts. Deze
// functie controleert uitsluitend: is dit token ondertekend met het
// gedeelde secret, is het nog niet verlopen, en is het bedoeld voor
// DEZE game. De daadwerkelijke entitlement-check gebeurt uitsluitend
// op het platform (orbit-platform/api/issue-access-token.js) — zie
// Fase D-ontwerp, punt 1 van het addendum.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ valid: false, error: 'Method not allowed' });
    return;
  }

  const { token } = req.body || {};

  if (!token || typeof token !== 'string') {
    res.status(400).json({ valid: false, error: 'Token ontbreekt' });
    return;
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    res.status(500).json({ valid: false, error: 'Server-configuratie ontbreekt (ACCESS_TOKEN_SECRET)' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (decoded.gameId !== 'orbit') {
      res.status(403).json({ valid: false, error: 'Token niet geldig voor dit spel' });
      return;
    }

    res.status(200).json({ valid: true });
  } catch (err) {
    // Verlopen en ongeldig/vervalst geven bewust dezelfde foutmelding —
    // geen onderscheid lekken naar de client (zie Fase D security-tests).
    res.status(401).json({ valid: false, error: 'Ongeldig of verlopen token' });
  }
};
