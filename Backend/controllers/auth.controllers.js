const users = require("../data/users.json");
const { createSession, deleteSession } = require("../middleware/auth.middleware");


exports.login = (req, res) => {
    console.log("Entro a login");
    // Extrae 'cuenta' y 'password' del body de la petición
    const { cuenta, password } = req.body || {}; 

    
    if (!cuenta || !password) {
        // Responde 400 Bad Request si faltan datos
        return res.status(400).json({
            error: "Faltan campos obligatorios: 'cuenta' y 'password'.",
            ejemplo: { cuenta: "Jhon_Doe", password: "123" }
        });
    }

    const match = users.find(u => u.cuenta === cuenta && u.password === password); 

    if (!match) {
        // Responde 401 Unauthorized
        return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // 4. Login exitoso: generar token de sesión
    const token = createSession(match.id); // Usamos 'id' como userId para ser más seguro

    console.log(`[LOGIN] Usuario: ${match.cuenta} | Token: ${token} | Procede el login`);

    // 5. Devolver la respuesta al Frontend
    return res.status(200).json({
        mensaje: "Acceso permitido",
        token: token, // Token de sesión
        user: { 
            cuenta: match.cuenta,
            nombre: match.nombre // AGREGADO: para mensaje de bienvenida
        } 
    });
};
