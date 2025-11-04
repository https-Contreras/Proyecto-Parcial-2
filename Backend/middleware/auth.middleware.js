const crypto = require('crypto');

// 1. Almacén de sesiones activas en memoria
// ¡CAMBIO IMPORTANTE!
// Ahora guardamos un OBJETO en lugar de solo el userId.
// Guarda: { token => { userId: string, hasPaid: boolean } }
const sessions = new Map();

/**
 * Crea un nuevo token de sesión único y lo asocia con el userId.
 * @param {string} userId - El ID único del usuario (ej: 'u001').
 * @returns {string} El token de sesión generado.
 */
exports.createSession = (userId) => {
    const token = crypto.randomUUID();
    
    // ¡CAMBIO IMPORTANTE!
    // Guardamos el objeto de sesión completo.
    const sessionData = {
        userId: userId,
        hasPaid: false // El pago se inicializa en falso
    };
    
    sessions.set(token, sessionData);
    
    console.log(`[SESSION] Sesión creada para ${userId}. Total: ${sessions.size}`);
    return token;
};


exports.authRequired = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Acceso no autorizado. Falta token." });
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: "Token malformado. Debe ser 'Bearer <token>'." });
    }

    const token = parts[1];

    if (!sessions.has(token)) {
        return res.status(401).json({ error: "Token inválido o sesión expirada." });
    }

    // ¡CAMBIO IMPORTANTE!
    // Obtenemos el objeto de sesión completo
    const sessionData = sessions.get(token);

    // Adjuntamos los datos a la solicitud (req) para que los controladores los usen
    req.userId = sessionData.userId;     // Para mantener la compatibilidad
    req.sessionData = sessionData; // Adjuntamos la sesión completa (incluye hasPaid)

    next(); 
};
