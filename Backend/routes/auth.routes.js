const express = require("express");
const router = express.Router();


//ruta pára el login, llama a controlador "login"
router.get("/login", (req, res)=>{
    return res.status(200).json({message: "funciona"});
});


module.exports=router;