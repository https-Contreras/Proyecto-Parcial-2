const users = require("../data/users.json"); // NOTA: Si usaste un .json, cambia a .js (como en la respuesta anterior)
const { createSession, deleteSession } = require("../middleware/auth.middleware");

// Almacenamiento en memoria
const attempts = new Map(); // userId -> { questions, answers, passed, score }
const payments = new Map(); // userId -> { certId, paid: true }

// ============= LOGIN =============
exports.login = (req, res) => {
    console.log("Entro a login");
    // Extrae 'cuenta' y 'password' del body de la petición
    const { cuenta, password } = req.body || {}; 

    // 1. Valida que vengan ambos campos requeridos
    if (!cuenta || !password) {
        // Responde 400 Bad Request si faltan datos
        return res.status(400).json({
            error: "Faltan campos obligatorios: 'cuenta' y 'password'.",
            ejemplo: { cuenta: "jael_contreras", password: "jael123" }
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


    const token = createSession(match.cuenta);

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


// ============= LOGOUT =============
exports.logout = (req, res) => {
    const userId = req.userId;
    const token = req.token; // Del middleware
    
    deleteSession(token);
    console.log(`[LOGOUT] Usuario: ${userId} cerró sesión`);
    
    return res.status(200).json({ mensaje: "Sesión cerrada exitosamente" });
};

// ============= PAGO (simulado) =============
exports.payment = (req, res) => {
    const userId = req.userId;
    const { certId } = req.body;

    if (!certId) {
        return res.status(400).json({ error: "Falta el ID de certificación" });
    }

    const cert = certs.find(c => c.id === certId);
    if (!cert) {
        return res.status(404).json({ error: "Certificación no encontrada" });
    }

    if (!cert.activa) {
        return res.status(400).json({ 
            error: "Esta certificación aún no está disponible",
            disponibleDesde: cert.disponibleDesde
        });
    }

    // Verificar si ya pagó
    if (payments.has(userId)) {
        return res.status(400).json({ error: "Ya has pagado esta certificación" });
    }

    // Registrar el pago
    payments.set(userId, { certId, paid: true, fecha: new Date() });
    console.log(`[PAYMENT] Usuario: ${userId} pagó certificación ${certId}`);

    return res.status(200).json({ 
        mensaje: "Pago exitoso",
        certificacion: cert.nombre,
        costo: cert.costo
    });
};

// ============= INICIAR EXAMEN =============
exports.start = (req, res) => {
    const userId = req.userId;
    
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
        opciones: shuffleArray([...q.opciones])
    }));

    // 5. Guardar el intento en memoria
    attempts.set(userId, {
        questions: selectedQuestions, // Con respuestas correctas
        answers: null,
        passed: null,
        score: null,
        startTime: new Date()
    });

    const certId = payments.get(userId).certId;
    const cert = certs.find(c => c.id === certId);

    console.log(`[EXAM START] Examen generado para ${userId}`);

    // 6. Devolver las preguntas (SIN respuestas correctas)
    return res.status(200).json({
        mensaje: "Examen iniciado",
        certificacion: {
            nombre: cert.nombre,
            tiempo: cert.tiempo,
            puntajeMinimo: cert.puntajeMinimo
        },
        preguntas: questionsWithShuffledOptions
    });
};

// ============= ENVIAR RESPUESTAS =============
exports.submit = (req, res) => {
    const userId = req.userId;
    const { respuestas } = req.body; // [{ id: 1, respuesta: "opcion" }, ...]

    console.log(`[EXAM SUBMIT] Usuario: ${userId}`);

    if (!attempts.has(userId)) {
        return res.status(400).json({ 
            error: "No tienes un examen activo" 
        });
    }

    const attempt = attempts.get(userId);

    if (attempt.answers !== null) {
        return res.status(400).json({ 
            error: "Este examen ya fue enviado y calificado" 
        });
    }

    // Calificar
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

    // Actualizar intento
    attempt.answers = respuestas;
    attempt.score = score;
    attempt.passed = passed;
    attempt.endTime = new Date();

    console.log(`[EXAM SUBMIT] ${userId} | Score: ${score}% | Aprobado: ${passed}`);

    return res.status(200).json({
        mensaje: passed ? "¡Felicidades! Has aprobado" : "No aprobaste el examen",
        score: Math.round(score),
        correctas: correctas,
        total: totalPreguntas,
        aprobado: passed,
        puntajeMinimo: cert.puntajeMinimo
    });
};

// ============= OBTENER CERTIFICACIONES =============
exports.getCertifications = (req, res) => {
    return res.status(200).json({ certificaciones: certs });
};

// ============= FUNCIONES AUXILIARES =============
function selectRandomQuestions(allQuestions, count) {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
// ============= DESCARGAR CERTIFICADO PDF =============
exports.downloadCertificate = (req, res) => {
    const userId = req.userId;
    const PDFDocument = require('pdfkit');
    const path = require('path');

    console.log(`[PDF] Solicitud de certificado para: ${userId}`);

    // 1. Verificar que el usuario tenga un intento
    if (!attempts.has(userId)) {
        return res.status(400).json({ 
            error: "No has realizado ningún examen" 
        });
    }

    const attempt = attempts.get(userId);

    // 2. Verificar que haya aprobado
    if (!attempt.passed) {
        return res.status(403).json({ 
            error: "No aprobaste el examen. No puedes descargar el certificado" 
        });
    }

    // 3. Obtener información del usuario y certificación
    const user = users.find(u => u.cuenta === userId);
    const certId = payments.get(userId).certId;
    const cert = certs.find(c => c.id === certId);

    // 4. Crear el documento PDF
    const doc = new PDFDocument({ 
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // 5. Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificado-${userId}.pdf`);

    // 6. Pipe del PDF a la respuesta
    doc.pipe(res);

    // 7. Diseño del certificado
    
    // Borde decorativo
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(3)
       .stroke('#2c3e50');

    // Logo (opcional - si tienes la imagen)
    try {
        doc.image(path.join(__dirname, '../assets/logo.png'), 250, 60, { width: 100 });
    } catch (err) {
        console.log('[PDF] Logo no encontrado, continuando sin logo');
    }

    // Título
    doc.fontSize(32)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('CERTIFICADO DE', 50, 180, { align: 'center' });
    
    doc.fontSize(28)
       .fillColor('#e74c3c')
       .text('APROBACIÓN', 50, 220, { align: 'center' });

    // Línea decorativa
    doc.moveTo(150, 270)
       .lineTo(doc.page.width - 150, 270)
       .lineWidth(2)
       .stroke('#3498db');

    // Texto "Se otorga a"
    doc.fontSize(14)
       .fillColor('#34495e')
       .font('Helvetica')
       .text('Se otorga el presente certificado a:', 50, 300, { align: 'center' });

    // Nombre del usuario
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(user.nombre.toUpperCase(), 50, 330, { align: 'center' });

    // Línea bajo el nombre
    doc.moveTo(120, 365)
       .lineTo(doc.page.width - 120, 365)
       .lineWidth(1)
       .stroke('#95a5a6');

    // Texto de certificación
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#34495e')
       .text('Por haber aprobado satisfactoriamente el examen de certificación:', 50, 390, { 
           align: 'center',
           width: doc.page.width - 100
       });

    // Nombre de la certificación
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#e74c3c')
       .text(cert.nombre, 50, 420, { 
           align: 'center',
           width: doc.page.width - 100
       });

    // Información del examen
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Calificación obtenida: ${Math.round(attempt.score)}%`, 50, 470, { align: 'center' });

    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}`, 50, 490, { align: 'center' });

    doc.text('Ciudad: Aguascalientes, México', 50, 510, { align: 'center' });

    // Línea decorativa inferior
    doc.moveTo(150, 550)
       .lineTo(doc.page.width - 150, 550)
       .lineWidth(2)
       .stroke('#3498db');

    // Firmas
    const firmaY = 580;

    // Firma del Instructor (izquierda)
    try {
        doc.image(path.join(__dirname, '../assets/firma-instructor.png'), 100, firmaY, { 
            width: 100,
            height: 40
        });
    } catch (err) {
        console.log('[PDF] Firma instructor no encontrada');
    }

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Dra. Georgina Salazar Partida', 80, firmaY + 50, { width: 150, align: 'center' });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text('Instructora Certificada', 80, firmaY + 65, { width: 150, align: 'center' });

    // Línea de firma
    doc.moveTo(80, firmaY + 45)
       .lineTo(230, firmaY + 45)
       .lineWidth(1)
       .stroke('#95a5a6');

    // Firma del CEO (derecha)
    try {
        doc.image(path.join(__dirname, '../assets/firma-ceo.png'), 380, firmaY, { 
            width: 100,
            height: 40
        });
    } catch (err) {
        console.log('[PDF] Firma CEO no encontrada');
    }

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Tu Empresa Certificadora', 360, firmaY + 50, { width: 150, align: 'center' });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text('Director General', 360, firmaY + 65, { width: 150, align: 'center' });

    // Línea de firma
    doc.moveTo(360, firmaY + 45)
       .lineTo(510, firmaY + 45)
       .lineWidth(1)
       .stroke('#95a5a6');

    // Footer
    doc.fontSize(8)
       .fillColor('#95a5a6')
       .text('Este certificado es válido y verificable', 50, doc.page.height - 80, { align: 'center' });
    
    doc.text(`ID de verificación: ${userId}-${Date.now()}`, 50, doc.page.height - 65, { align: 'center' });

    // Finalizar el PDF
    doc.end();

    console.log(`[PDF] Certificado generado exitosamente para ${userId}`);
};

