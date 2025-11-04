const crypto = require('crypto');

// 1. Almacén de sesiones activas en memoria
// Usamos un Map para que sea eficiente buscar (get) y borrar (delete) tokens.
// Guarda: { token => userId }
const sessions = new Map();

/**
 * Crea un nuevo token de sesión único y lo asocia con el userId.
 * @param {string} userId - El ID único del usuario (ej: 'u001').
 * @returns {string} El token de sesión generado.
 */
exports.createSession = (userId) => {
    // Generar un UUID aleatorio para el token (Requisito del examen)
    const token = crypto.randomUUID();
    
    // Almacenar el token como clave y el userId como valor
    sessions.set(token, userId);
    
    console.log(`[SESSION] Sesión creada para ${userId}. Total: ${sessions.size}`);
    return token;
};

// =================================================================
// 2. EL MIDDLEWARE "CANDADO" (authRequired)
// =================================================================

/**
 * Middleware para proteger rutas.
 * Verifica si se proporciona un token válido en el header "Authorization".
 * Si es válido, adjunta el userId a la solicitud (req.userId).
 * Si no es válido, responde con 401 Unauthorized.
 */
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

/**
 * Función para eliminar sesión (para el Logout)
 */
exports.deleteSession = (token) => {
    const wasDeleted = sessions.delete(token);
    console.log(`[SESSION] Sesión eliminada: ${wasDeleted}. Total: ${sessions.size}`);
    return wasDeleted;
};

// Exportamos las sesiones por si otro módulo necesita consultarlas (aunque no es común)
exports.sessions = sessions;