const users = require("../data/users.json");
const questions = require("../data/questions");
const certs = require("../data/certs");
const { createSession, deleteSession } = require("../middleware/auth.middleware");

// Almacenamiento en memoria
const attempts = new Map(); // Guarda intentos de examen: userId -> { questions, answers, passed, score }
const payments = new Map(); // Guarda pagos: userId -> { certId, paid: true }

// ============= LOGIN (ya lo tenías) =============
exports.login = (req, res) => {
    console.log("Entro a login");
    const { cuenta, password } = req.body || {}; 

    if (!cuenta || !password) {
        return res.status(400).json({
            error: "Faltan campos obligatorios: 'cuenta' y 'password'.",
            ejemplo: { cuenta: "Jhon_Doe", password: "123" }
        });
    }

    const match = users.find(u => u.cuenta === cuenta && u.password === password); 

    if (!match) {
        return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // Crear sesión con la CUENTA como userId (ya que no tienen 'id' en users.json)
    const token = createSession(match.cuenta);

    console.log(`[LOGIN] Usuario: ${match.cuenta} | Token: ${token}`);

    return res.status(200).json({
        mensaje: "Acceso permitido",
        token: token,
        user: { 
            cuenta: match.cuenta,
            nombre: match.nombre
        } 
    });
};

// ============= LOGOUT =============
exports.logout = (req, res) => {
    const userId = req.userId; // Del middleware
    deleteSession(userId);
    console.log(`[LOGOUT] Usuario: ${userId} cerró sesión`);
    return res.status(200).json({ mensaje: "Sesión cerrada" });
};

// ============= PAGO (simulado) =============
exports.payment = (req, res) => {
    const userId = req.userId; // Del middleware authRequired
    const { certId } = req.body;

    if (!certId) {
        return res.status(400).json({ error: "Falta el ID de certificación" });
    }

    // Verificar que la certificación existe
    const cert = certs.find(c => c.id === certId);
    if (!cert) {
        return res.status(404).json({ error: "Certificación no encontrada" });
    }

    // Verificar si ya pagó
    if (payments.has(userId)) {
        return res.status(400).json({ error: "Ya has pagado esta certificación" });
    }

    // Registrar el pago
    payments.set(userId, { certId, paid: true });
    console.log(`[PAYMENT] Usuario: ${userId} pagó certificación ${certId}`);

    return res.status(200).json({ 
        mensaje: "Pago exitoso",
        certificacion: cert.nombre 
    });
};

// ============= INICIAR EXAMEN (Tarea 3 de Yael) =============
exports.start = (req, res) => {
    const userId = req.userId; // Del middleware
    
    console.log(`[EXAM START] Usuario: ${userId}`);

    // 1. Verificar si ya pagó
    if (!payments.has(userId)) {
        return res.status(403).json({ 
            error: "Debes pagar la certificación antes de iniciar el examen" 
        });
    }

    // 2. Verificar si ya hizo el examen
    if (attempts.has(userId)) {
        return res.status(403).json({ 
            error: "El examen solo se puede aplicar una vez" 
        });
    }

    // 3. Seleccionar 8 preguntas aleatorias de las 16
    const selectedQuestions = selectRandomQuestions(questions, 8);

    // 4. Barajar las opciones de cada pregunta
    const questionsWithShuffledOptions = selectedQuestions.map(q => ({
        id: q.id,
        pregunta: q.pregunta,
        opciones: shuffleArray([...q.opciones]) // Barajamos las opciones
    }));

    // 5. Guardar el intento en memoria (con las respuestas correctas originales)
    attempts.set(userId, {
        questions: selectedQuestions, // Guardamos las preguntas originales con respuestas correctas
        answers: null, // Aún no ha respondido
        passed: null,
        score: null,
        startTime: new Date()
    });

    console.log(`[EXAM START] Examen generado para ${userId} con ${questionsWithShuffledOptions.length} preguntas`);

    // 6. Devolver las preguntas (SIN las respuestas correctas)
    return res.status(200).json({
        mensaje: "Examen iniciado",
        certificacion: certs.find(c => c.id === payments.get(userId).certId),
        preguntas: questionsWithShuffledOptions // Solo id, pregunta y opciones barajadas
    });
};

// ============= ENVIAR RESPUESTAS (Tarea 4 de Yael) =============
exports.submit = (req, res) => {
    const userId = req.userId;
    const { respuestas } = req.body; // Array de { id: number, respuesta: string }

    console.log(`[EXAM SUBMIT] Usuario: ${userId}`);

    // 1. Verificar que existe un intento
    if (!attempts.has(userId)) {
        return res.status(400).json({ 
            error: "No tienes un examen activo" 
        });
    }

    const attempt = attempts.get(userId);

    // 2. Verificar que no haya sido calificado ya
    if (attempt.answers !== null) {
        return res.status(400).json({ 
            error: "Este examen ya fue enviado y calificado" 
        });
    }

    // 3. Calificar las respuestas
    let correctas = 0;
    const totalPreguntas = attempt.questions.length;

    attempt.questions.forEach(preguntaOriginal => {
        const respuestaUsuario = respuestas.find(r => r.id === preguntaOriginal.id);
        
        if (respuestaUsuario && respuestaUsuario.respuesta === preguntaOriginal.correcta) {
            correctas++;
        }
    });

    const score = (correctas / totalPreguntas) * 100;
    const certId = payments.get(userId).certId;
    const cert = certs.find(c => c.id === certId);
    const passed = score >= cert.puntajeMinimo;

    // 4. Actualizar el intento
    attempt.answers = respuestas;
    attempt.score = score;
    attempt.passed = passed;
    attempt.endTime = new Date();

    console.log(`[EXAM SUBMIT] Usuario: ${userId} | Score: ${score}% | Aprobado: ${passed}`);

    // 5. Respuesta
    return res.status(200).json({
        mensaje: passed ? "¡Felicidades! Has aprobado" : "No aprobaste",
        score: Math.round(score),
        correctas: correctas,
        total: totalPreguntas,
        aprobado: passed,
        puntajeMinimo: cert.puntajeMinimo
    });
};

// ============= OBTENER INFO DE CERTIFICACIONES =============
exports.getCertifications = (req, res) => {
    return res.status(200).json({ certificaciones: certs });
};

// ============= FUNCIONES AUXILIARES =============

// Seleccionar N preguntas aleatorias sin repetir
function selectRandomQuestions(allQuestions, count) {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Barajar un array (Fisher-Yates)
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}