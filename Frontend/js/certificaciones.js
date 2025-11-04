const API_PAGO_URL = "http://localhost:3000/api/pago/simular";

// js/certifications.js

/**
 * Realiza la petición POST al Back-end para simular el pago.
 * @param {string} certId - El ID de la certificación (ej: 'node-js').
 * @param {number} costo - El costo del examen.
 */
async function realizarPagoSimulado(certId, costo) {
  // 1. Obtener datos del usuario (simulados por ahora, luego vendrán del login/auth.js)
  const datosPago = {
    certId: certId,
    monto: costo,
    // En una aplicación real, el ID de usuario vendría del estado de sesión
    userId: localStorage.getItem("currentUserId") || "USER_SIMULADO_123",
    timestamp: new Date().toISOString(), // Para evitar reintentos accidentales
  };

  try {
    const respuesta = await fetch(API_PAGO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': 'Bearer ' + tokenDeUsuario // Añadir si Jael requiere un token
      },
      body: JSON.stringify(datosPago),
    });

    const resultado = await respuesta.json();

    // Llama a la función que maneja la respuesta
    manejarRespuestaDePago(resultado, certId);
  } catch (error) {
    console.error("Error al conectar con el servidor de pago:", error);
    alert(" Error de conexión. El servidor de pago no está disponible.");
  }
}

/**
 * Procesa la respuesta de la API de pago y actualiza la UI.
 * @param {Object} resultado - Objeto de respuesta del Back-end.
 * @param {string} certId - El ID de la certificación.
 */
function manejarRespuestaDePago(resultado, certId) {
  const cardActions = document.querySelector(
    `.certification-card[data-cert-id="${certId}"] .card-actions`
  );
  const btnPagar = cardActions.querySelector(".btn-pay");
  const btnIniciar = cardActions.querySelector(".btn-start");

  if (resultado.estado === "COMPLETADO") {
    alert(" Pago Exitoso. ¡Ya puedes iniciar tu examen!");

    // Desactivar botón de Pago y Activar botón de Inicio
    btnPagar.disabled = true;
    btnPagar.textContent = "Pago Registrado";
    btnIniciar.disabled = false;

    // Opcional: Almacenar el estado de pago en el Front-end (Ej: LocalStorage)
    localStorage.setItem(`pago_${certId}_status`, "paid");
  } else if (resultado.estado === "PAGO_DUPLICADO") {
    // Implementación directa del manejo del alert de doble pago
    alert(
      " ¡ALERTA DE DOBLE PAGO! Ya existe un pago registrado y validado para esta certificación."
    );
    console.warn("Intento de doble pago detectado por el Back-end (Jael).");
  } else if (resultado.estado === "FONDOS_INSUFICIENTES") {
    alert("❌ Error: Fondos insuficientes en la simulación de pago.");
  } else {
    alert(
      ` Error desconocido al procesar el pago. Código: ${ resultado.codigoError || "N/A"
      }`
    );
  }
}

// js/certifications.js

// 5. Asignar el Event Listener al botón
document.addEventListener('DOMContentLoaded', () => {
    const btnPayNode = document.getElementById('btn-pay-node');

    if (btnPayNode) {
        btnPayNode.addEventListener('click', () => {
            // El costo es $89 USD para la certificación Node.js
            const costoNode = 89; 
            realizarPagoSimulado('node-js', costoNode);
        });
    }

    // Opcional: Manejar el botón de iniciar examen para el siguiente punto (Punto 3)
    const btnStartNode = document.getElementById('btn-start-node');
    if (btnStartNode) {
        btnStartNode.addEventListener('click', () => {
            // Lógica para redirigir a examen.html (Punto 3 del plan)
            console.log('Iniciando examen Node.js...');
            // window.location.href = 'examen.html?cert=node-js';
        });
    }

    // Opcional: Cargar estado de pago al cargar la página (para persistencia)
    if (localStorage.getItem('pago_node-js_status') === 'paid') {
        const btnPagar = document.getElementById('btn-pay-node');
        const btnIniciar = document.getElementById('btn-start-node');
        if(btnPagar && btnIniciar){
             btnPagar.disabled = true;
             btnPagar.textContent = 'Pago Registrado';
             btnIniciar.disabled = false;
        }
    }
});

