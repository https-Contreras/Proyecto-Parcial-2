// --- Elementos del DOM ---
const modal = document.getElementById("login-modal");
const authButton = document.getElementById("auth-button");
const userDisplay = document.getElementById("user-account-display");
const loginForm = document.getElementById("login-form");
const pay = document.getElementById("btn-pay-node");

const API_BASE_URL = "http://localhost:3000/api";
pay.addEventListener("click", () => {
  realizarPagoSimulado("node-js", 89)
    .then((resultado) => {
      alert(`Resultado del pago: ${JSON.stringify(resultado)}`);
    })
    .catch((err) => {
      console.error("Error al realizar el pago simulado:", err);
    });
});

/** Muestra el modal de login */
function openLoginModal() {
  modal.style.display = "flex";
  loginForm.reset();
}
/** Oculta el modal de login */
function closeLoginModal() {
  modal.style.display = "none";
}

/** Muestra alertas usando SweetAlert2*/
function showAlert(title, text, icon) {
  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: title,
      text: text,
      icon: icon,
      confirmButtonColor: "#8e2de2",
    });
  } else {
    console.warn("SweetAlert2 no está cargado. Usando console.log.");
    console.log(`${title}: ${text}`);
  }
}

/** * Actualiza la interfaz de usuario del header (Login/Logout, cuenta activa).
 * Se llama al cargar la página y después de cualquier cambio de sesión.
 */
function updateAuthUI() {
  const token = localStorage.getItem("token");
  const userAccount = localStorage.getItem("userAccount");

  if (token && userAccount) {
    userDisplay.textContent = `Hola, ${userAccount}`;
    userDisplay.style.display = "inline";
    authButton.textContent = "Logout";
    authButton.classList.add("logout");
  } else {
    userDisplay.style.display = "none";
    authButton.textContent = "Login";
    authButton.classList.remove("logout");
  }
}

/* Maneja la lógica de cerrar sesión */
function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userAccount");

  updateAuthUI();

  showAlert("¡Adiós!", "Has cerrado la sesión con éxito.", "success");
}

/* Maneja el envío del formulario de Login */
async function handleLoginSubmit(e) {
  e.preventDefault();

  const cuenta = document.getElementById("cuenta").value;
  const password = document.getElementById("password").value;

  closeLoginModal();

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cuenta, password }),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.warn(
        "Respuesta no JSON del servidor. Posible error interno o 401 sin cuerpo.",
        parseErr
      );
      data = {};
    }
    console.log(data);
    if (response.ok) {
      // Acceso permitido
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.nombre);
      localStorage.setItem("userAccount", data.user.cuenta);

      updateAuthUI();

      showAlert(
        "¡Acceso Permitido!",
        `Bienvenido, ${data.user.nombre}.`,
        "success"
      );
    } else if (response.status === 401) {
      showAlert(
        "Error en las Credenciales",
        "La cuenta o la contraseña son incorrectas.",
        "error"
      );
    } else {
      showAlert(
        "Error del Servidor",
        data.message || "Ocurrió un error inesperado en el servidor.",
        "error"
      );
    }
  } catch (error) {
    console.error("Error al realizar la petición de login:", error);
    showAlert(
      "Error de Conexión",
      "No se pudo conectar con el servicio de autenticación. Asegúrate de que el backend esté corriendo en el puerto 3000.",
      "error"
    );
  }
}

// Inicialización y Listeners
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();

  authButton.addEventListener("click", () => {
    const token = localStorage.getItem("token");
    if (token) {
      handleLogout();
    } else {
      openLoginModal();
    }
  });

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  const closeButton = document.querySelector(".modal-content .close-button");
  if (closeButton) {
    closeButton.addEventListener("click", closeLoginModal);
  }

  // Cerrar modal si se hace clic fuera de él
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeLoginModal();
    }
  });
});

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
      ` Error desconocido al procesar el pago. Código: ${
        resultado.codigoError || "N/A"
      }`
    );
  }
}

// js/certifications.js

// 5. Asignar el Event Listener al botón
document.addEventListener("DOMContentLoaded", () => {
  const btnPayNode = document.getElementById("btn-pay-node");

  if (btnPayNode) {
    btnPayNode.addEventListener("click", () => {
      // El costo es $89 USD para la certificación Node.js
      const costoNode = 89;
      realizarPagoSimulado("node-js", costoNode);
    });
  }

  // Opcional: Manejar el botón de iniciar examen para el siguiente punto (Punto 3)
  const btnStartNode = document.getElementById("btn-start-node");
  if (btnStartNode) {
    btnStartNode.addEventListener("click", () => {
      // Lógica para redirigir a examen.html (Punto 3 del plan)
      console.log("Iniciando examen Node.js...");
      // window.location.href = 'examen.html?cert=node-js';
    });
  }

  // Opcional: Cargar estado de pago al cargar la página (para persistencia)
  if (localStorage.getItem("pago_node-js_status") === "paid") {
    const btnPagar = document.getElementById("btn-pay-node");
    const btnIniciar = document.getElementById("btn-start-node");
    if (btnPagar && btnIniciar) {
      btnPagar.disabled = true;
      btnPagar.textContent = "Pago Registrado";
      btnIniciar.disabled = false;
    }
  }
});
