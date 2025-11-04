const sessions = new Map();

exports.createSession = (userId) => {
    const crypto = require('crypto');
    const token = (typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : crypto.randomBytes(32).toString('hex');
    sessions.set(token, userId);
    return token;
};


exports.authRequired = (req, res, next) => {
    // 1. Obtener el token del header (ej: "Bearer <token>")
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        // No se proporcionó el header
        return res.status(401).json({ error: "Acceso no autorizado. Falta token." });
    }

    // 2. Separar "Bearer" del token
    const parts = authHeader.split(' '); // Separa ["Bearer", "<token>"]
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        // El formato del header es incorrecto
        return res.status(401).json({ error: "Token malformado. Debe ser 'Bearer <token>'." });
    }

    const token = parts[1]; // Este es el token puro

    // 3. Validar el token en nuestro almacén de sesiones
    if (!sessions.has(token)) {
        // El token no existe en nuestras sesiones activas
        return res.status(401).json({ error: "Token inválido o sesión expirada." });
    }

    // 4. ¡Acceso Permitido! Adjuntar el userId a la solicitud
    const userId = sessions.get(token);
    req.userId = userId; // <-- ¡MUY IMPORTANTE!

    // 5. Continuar al siguiente middleware o al controlador
    next(); 
};

