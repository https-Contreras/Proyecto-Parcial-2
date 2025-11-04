const express = require("express");
const router = express.Router();
const login = require("../controllers/auth.controllers")
const { authRequired } = require('../middleware/auth.middleware');
const authcontrollers = require("../controllers/auth.controllers");


//Rutas normales y de acceso publico
//ruta pára el login, llama a controlador "login"
router.post("/login",login.login);




// Todas las rutas aquí requieren un token válido.
//rutas protegidas
/**
 * @route   POST /api/exams/start
 * @desc    Inicia un nuevo intento de examen (genera 8 preguntas).
 * @access  Protegido
*/

router.post(
    '/start',
    authRequired,         // 1ro: Pasa por el "candado" que revisa si estas logeado o tienes un token
    authcontrollers.start // 2do: Si pasa, ejecuta el controlador
);

module.exports=router;