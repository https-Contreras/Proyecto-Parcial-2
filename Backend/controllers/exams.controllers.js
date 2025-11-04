const attempts = new Map();

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
    solicitud_de_usuario: userId,
  });
};

exports.simularPago = (req, res) => {
  const { certId, costo } = req.body; // { certId: <id_del_certificado> }
  // Lógica de simulación de pago pendiente (Raúl)
  //   manejarRespuestaDePago(
  //     { estado: "COMPLETADO" }, // Simulamos un pago exitoso
  //     certId
  //   );

  res.status(200).json({
    message: "pago procesado exitosamente",
    estado: "COMPLETADO",
  });
};
