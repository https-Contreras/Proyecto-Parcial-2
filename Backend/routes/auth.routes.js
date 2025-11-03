const express = require("express");
const router = express.Router();
const login = require("../controllers/auth.controllers")

//ruta pára el login, llama a controlador "login"
router.post("/login",login.login);


module.exports=router;