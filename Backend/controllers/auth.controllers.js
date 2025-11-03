const users = require("../data/users.json"); // NOTA: Si usaste un .json, cambia a .js (como en la respuesta anterior)
const { createSession, deleteSession } = require("../middleware/auth.middleware");

/**
 * Maneja la lógica de Login.
 * Valida credenciales, genera un token y devuelve los datos del usuario.
 */
exports.login = (req, res) => {
    console.log("Entro a login");
    // Extrae 'cuenta' y 'password' del body de la petición
    const { cuenta, password } = req.body || {}; 

    // 1. Valida que vengan ambos campos requeridos
    if (!cuenta || !password) {
        // Responde 400 Bad Request si faltan datos
        return res.status(400).json({
            error: "Faltan campos obligatorios: 'cuenta' y 'password'.",
            ejemplo: { cuenta: "Jhon_Doe", password: "123" }
        });
    }

    // 2. Busca un usuario que coincida exactamente con cuenta Y password (CORRECCIÓN)
    // Se usa u.password para coincidir con el campo en data/users.js
    const match = users.find(u => u.cuenta === cuenta && u.password === password); 

    // 3. Si no encuentra coincidencia, credenciales incorrectas
    if (!match) {
        // Responde 401 Unauthorized
        return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // 4. Login exitoso: generar token de sesión
    const token = createSession(match.id); // Usamos 'id' como userId para ser más seguro

    console.log(`[LOGIN] Usuario: ${match.cuenta} | Token: ${token} | Procede el login`);

    // 5. Devolver la respuesta al Frontend (Ajustado para js/auth.js)
    return res.status(200).json({
        mensaje: "Acceso permitido",
        token: token, // Token de sesión
        // El Front espera un objeto 'user' con 'cuenta' y 'nombreCompleto'
        user: { 
            cuenta: match.cuenta,
            nombre: match.nombre // AGREGADO: Necesario para el mensaje de bienvenida
        } 
    });
};
