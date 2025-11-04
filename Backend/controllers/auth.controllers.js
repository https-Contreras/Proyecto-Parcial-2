const users = require("../data/users.json");
const { createSession, deleteSession } = require("../middleware/auth.middleware");
const attempts = new Map();


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





//controlador para empezar examen
exports.start = (req, res) => {
    // ¡PRUEBA DE QUE EL CANDADO FUNCIONA!
    // req.userId fue adjuntado por tu middleware authRequired
    const userId = req.userId; 
    
    console.log(`[EXAM START] Solicitud recibida del usuario: ${userId}`);

    // --- Lógica de Yael (pendiente) ---
    // 1. Verificar si el usuario ya pagó (requiere lógica de pago de Raúl)
    // 2. Verificar si el usuario ya hizo el examen 1 vez (buscar en 'attempts')
    // 3. Generar 8 preguntas aleatorias de 'data/questions.js'
    // 4. Barajar opciones
    // 5. Guardar el intento en 'attempts'
    
    // Respuesta temporal (stub)
    res.status(501).json({ 
        message: "Endpoint 'start' no implementado.",
        solicitud_de_usuario: userId 
    });
};