const sessions = new Map();

exports.createSession = (userId) => {
    const crypto = require('crypto');
    // Usar crypto.randomUUID cuando esté disponible (Node 14.17+).
    // Si no está disponible, hacer fallback a randomBytes para compatibilidad.
    const token = (typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : crypto.randomBytes(32).toString('hex');
    sessions.set(token, userId);
    return token;
};
