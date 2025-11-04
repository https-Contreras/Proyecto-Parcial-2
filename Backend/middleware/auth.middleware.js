
const crypto = require('crypto');

// Almacén de sesiones activas en memoria
// Guarda: { token => { userId: string } }

const sessions = new Map();

/**
 * Crea un nuevo token de sesión único y lo asocia con el userId.
<<<<<<< HEAD
 * @param {string} userId - El ID único del usuario (ej: 'u001').
=======
 * @param {string} userId - El ID único del usuario (ej: 'jael_contreras').

 * @returns {string} El token de sesión generado.
 */
exports.createSession = (userId) => {
    const token = crypto.randomUUID();
    

    const sessionData = {
        userId: userId,
        createdAt: new Date()

    };
    
    sessions.set(token, sessionData);
    
    console.log(`[SESSION] Sesión creada para ${userId}. Total: ${sessions.size}`);
    return token;
};


/**
 * Elimina una sesión activa (logout)
 * @param {string} token - El token de la sesión a eliminar
 */
exports.deleteSession = (token) => {
    if (sessions.has(token)) {
        const sessionData = sessions.get(token);
        sessions.delete(token);
        console.log(`[SESSION] Sesión eliminada para ${sessionData.userId}. Total: ${sessions.size}`);
        return true;
    }
    return false;
};

/**
 * Middleware de autenticación
 * Verifica que el token sea válido y adjunta userId al request
 */

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


    const sessionData = sessions.get(token);

    // Adjuntamos los datos a la solicitud
    req.userId = sessionData.userId;
    req.token = token; // Para poder hacer logout después
    req.sessionData = sessionData;

    next(); 
};


