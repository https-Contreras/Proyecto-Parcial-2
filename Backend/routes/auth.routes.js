const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controllers");
const { authRequired } = require('../middleware/auth.middleware');

// ============= RUTAS PÚBLICAS (no requieren token) =============
router.post("/login", authController.login);
router.get("/certifications", authController.getCertifications);

// ============= RUTAS PROTEGIDAS (requieren token) =============
router.post("/logout", authRequired, authController.logout);
router.post("/payment", authRequired, authController.payment);
router.post("/exams/start", authRequired, authController.start);
router.post("/exams/submit", authRequired, authController.submit);
router.get("/exams/certificate", authRequired, authController.downloadCertificate);

module.exports = router;
