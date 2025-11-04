const express = require("express");
const router = express.Router();

// 1. Importar el "candado" (middleware de seguridad)
// (Asegúrate de que la ruta a tu middleware sea correcta)
const { authRequired } = require("../middleware/auth.middleware");
const authExams = require("../controllers/exams.controllers");

// 2. Importar el controlador que tienes en pantalla
// (Asegúrate de que la ruta a tu controlador sea correcta)
//const examsController = require('../controllers/exams.controller');

// --- Definición de Rutas Protegidas ---
// Todas las rutas aquí requieren un token válido.

/**
 * @route   POST /api/exams/start
 * @desc    Inicia un nuevo intento de examen (genera 8 preguntas).
 * @access  Protegido
 */
router.post(
  "/start",
  authRequired, // 1ro: Pasa por el "candado"
  authExams.start // 2do: Si pasa, ejecuta el controlador
);

router.post(
  "/simular_pago",
  authRequired, // 1ro: Pasa por el "candado"
  authExams.simularPago // 2do: Si pasa, ejecuta el controlador
);

module.exports = router;
