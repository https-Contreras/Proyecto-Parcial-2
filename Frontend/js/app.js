// --- Elementos del DOM ---
const modal = document.getElementById("login-modal");
const authButton = document.getElementById("auth-button");
const userDisplay = document.getElementById("user-account-display");
const loginForm = document.getElementById("login-form");

const API_BASE_URL = "http://localhost:3000/api";

// Variable global para almacenar las preguntas del examen
let currentExam = null;
let examTimer = null;
let timeRemaining = 0;

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

/** Actualiza la interfaz de usuario del header (Login/Logout, cuenta activa). */
function updateAuthUI() {
  const token = localStorage.getItem("token");
  const userAccount = localStorage.getItem("userAccount");
  const nombre = localStorage.getItem("userName");

  if (token && userAccount) {
    userDisplay.textContent = `Hola, ${nombre}`;
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
async function handleLogout() {
  const token = localStorage.getItem("token");

  try {
    if (token) {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.warn("Error al notificar al backend sobre el logout:", error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userAccount");
    updateAuthUI();
    showAlert("¡Adiós!", "Has cerrado la sesión con éxito.", "success");
  }
}

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
      console.warn("Respuesta no JSON del servidor.", parseErr);
      data = {};
    }

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.nombre);
      localStorage.setItem("userAccount", data.user.cuenta);

      updateAuthUI();
      showAlert(
        "¡Acceso Permitido!",
        `Bienvenido, ${data.user.nombre}.`,
        "success"
      );

      if (window.location.pathname.includes("certificaciones.html")) {
        loadCertifications();
      }
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
      "No se pudo conectar con el servicio de autenticación.",
      "error"
    );
  }
}

// ===================== FUNCIONES PARA CERTIFICACIONES =====================

/** Carga las certificaciones desde el backend */
async function loadCertifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/certifications`);

    if (!response.ok) {
      throw new Error("Error al cargar certificaciones");
    }

    const data = await response.json();
    renderCertifications(data.certificaciones);
  } catch (error) {
    console.error("Error cargando certificaciones:", error);
    showAlert("Error", "No se pudieron cargar las certificaciones", "error");
  }
}

/** Renderiza las tarjetas de certificación dinámicamente */
function renderCertifications(certifications) {
  const container = document.querySelector(".certifications-grid");

  if (!container) {
    console.warn("No se encontró el contenedor de certificaciones");
    return;
  }

  container.innerHTML = "";

  certifications.forEach((cert) => {
    const card = createCertificationCard(cert);
    container.appendChild(card);
  });
}

/** Crea una tarjeta individual de certificación */
function createCertificationCard(cert) {
  const article = document.createElement("article");
  article.className = `certification-card ${
    cert.activa ? "enabled" : "disabled"
  }`;
  article.dataset.certId = cert.id;

  let availabilityText = "";
  if (cert.activa) {
    availabilityText =
      '<p class="availability-info success-info">✓ Disponible Inmediatamente</p>';
  } else if (cert.disponibleDesde) {
    const fecha = new Date(cert.disponibleDesde);
    const opciones = { year: "numeric", month: "long", day: "numeric" };
    const fechaFormateada = fecha.toLocaleDateString("es-MX", opciones);
    availabilityText = `<p class="availability-info">⏳ Disponible a partir del ${fechaFormateada}</p>`;
  } else {
    availabilityText = '<p class="availability-info">⏳ Próximamente</p>';
  }

  article.innerHTML = `
        <div class="card-header">
            <h3>${cert.nombre}</h3>
        </div>
        <div class="card-body">
            <p class="description">${cert.descripcion}</p>
            <ul>
                <li><strong class="label">Puntuación Mínima:</strong> ${
                  cert.puntajeMinimo
                }/100</li>
                <li><strong class="label">Tiempo de Examen:</strong> ${
                  cert.tiempo
                } minutos</li>
                <li><strong class="label">Costo:</strong> $${
                  cert.costo
                } MXN</li>
            </ul>
            ${availabilityText}
        </div>
        <div class="card-actions">
            <button class="btn-pay" data-cert-id="${cert.id}" ${
    !cert.activa ? "disabled" : ""
  }>
                Pagar Examen
            </button>
            <button class="btn-start" data-cert-id="${cert.id}" disabled>
                Iniciar Examen
            </button>
        </div>
    `;

  const btnPay = article.querySelector(".btn-pay");
  const btnStart = article.querySelector(".btn-start");

  if (btnPay && cert.activa) {
    btnPay.addEventListener("click", () => handlePayment(cert.id));
  }

  if (btnStart) {
    btnStart.addEventListener("click", () => handleStartExam(cert.id));
  }

  return article;
}

/** Maneja el pago de una certificación */
async function handlePayment(certId) {
  const token = localStorage.getItem("token");

  if (!token) {
    showAlert(
      "Autenticación Requerida",
      "Debes iniciar sesión para pagar un examen",
      "warning"
    );
    openLoginModal();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ certId }),
    });

    const data = await response.json();

    if (response.ok) {
      showAlert(
        "¡Pago Exitoso!",
        `Has pagado la certificación "${data.certificacion}". Ahora puedes iniciar el examen.`,
        "success"
      );

      const btnStart = document.querySelector(
        `.btn-start[data-cert-id="${certId}"]`
      );
      if (btnStart) {
        btnStart.disabled = false;
      }

      const btnPay = document.querySelector(
        `.btn-pay[data-cert-id="${certId}"]`
      );
      if (btnPay) {
        btnPay.disabled = true;
        btnPay.textContent = "✓ Pagado";
      }
    } else {
      showAlert(
        "Error en el Pago",
        data.error || "No se pudo procesar el pago",
        "error"
      );
    }
  } catch (error) {
    console.error("Error en el pago:", error);
    showAlert(
      "Error de Conexión",
      "No se pudo conectar con el servidor",
      "error"
    );
  }
}

/** Maneja el inicio de un examen */
async function handleStartExam(certId) {
  const token = localStorage.getItem("token");

  if (!token) {
    showAlert(
      "Autenticación Requerida",
      "Debes iniciar sesión para comenzar el examen",
      "warning"
    );
    openLoginModal();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/exams/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      currentExam = {
        certId: certId,
        preguntas: data.preguntas,
        certificacion: data.certificacion,
      };

      // Mostrar las preguntas del examen
      displayExamQuestions(data);
    } else {
      showAlert("Error", data.error || "No se pudo iniciar el examen", "error");
    }
  } catch (error) {
    console.error("Error al iniciar examen:", error);
    showAlert(
      "Error de Conexión",
      "No se pudo conectar con el servidor",
      "error"
    );
  }
}

/** Muestra las preguntas del examen en la página */
function displayExamQuestions(examData) {
  const container = document.querySelector(".certifications-grid");

  if (!container) {
    console.error("No se encontró el contenedor");
    return;
  }

  // Limpiar el contenedor
  container.innerHTML = "";

  // Crear sección del examen
  const examSection = document.createElement("div");
  examSection.className = "exam-container";
  examSection.style.gridColumn = "1 / -1";

  // Encabezado del examen con temporizador
  const examHeader = document.createElement("div");
  examHeader.className = "exam-header";

  const headerHTML = `
        <h2>📝 ${examData.certificacion.nombre}</h2>
        <div class="timer-container" id="exam-timer">
            <div class="timer-icon">⏰</div>
            <div class="timer-display">
                <span id="timer-minutes">00</span>:<span id="timer-seconds">00</span>
            </div>
            <div class="timer-label">Tiempo restante</div>
        </div>
        <p><strong>Puntuación mínima:</strong> ${examData.certificacion.puntajeMinimo}%</p>
        <p class="exam-instructions">Responde todas las preguntas. El examen se enviará automáticamente al finalizar el tiempo.</p>
    `;

  examHeader.innerHTML = headerHTML;

  examSection.appendChild(examHeader);

  // Crear formulario para las preguntas
  const form = document.createElement("form");
  form.id = "exam-form";
  form.className = "exam-form";

  examData.preguntas.forEach((pregunta, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-card";

    const questionTitle = document.createElement("h3");
    questionTitle.textContent = `${index + 1}. ${pregunta.pregunta}`;
    questionDiv.appendChild(questionTitle);

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options-container";

    pregunta.opciones.forEach((opcion, optIndex) => {
      const optionLabel = document.createElement("label");
      optionLabel.className = "option-label";

      const radioInput = document.createElement("input");
      radioInput.type = "radio";
      radioInput.name = `pregunta-${pregunta.id}`;
      radioInput.value = opcion;
      radioInput.required = true;
      radioInput.dataset.questionId = pregunta.id;

      optionLabel.appendChild(radioInput);
      optionLabel.appendChild(document.createTextNode(` ${opcion}`));

      optionsDiv.appendChild(optionLabel);
    });

    questionDiv.appendChild(optionsDiv);
    form.appendChild(questionDiv);
  });

  // Botón de enviar
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.id = "submit-exam-btn";
  submitButton.className = "btn-submit-exam";
  submitButton.textContent = "📤 Enviar Respuestas";

  form.appendChild(submitButton);
  examSection.appendChild(form);
  container.appendChild(examSection);

  // Event listener para el envío del formulario
  form.addEventListener("submit", handleSubmitExam);

  // Iniciar el temporizador
  startExamTimer(examData.certificacion.tiempo);

  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Maneja el envío de respuestas del examen */
async function handleSubmitExam(e) {
  e.preventDefault();

  // Detener el temporizador
  if (examTimer) {
    clearInterval(examTimer);
    examTimer = null;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    showAlert("Error", "Token no encontrado", "error");
    return;
  }

  // Recolectar todas las respuestas
  const respuestas = [];
  const form = e.target;

  currentExam.preguntas.forEach((pregunta) => {
    const selectedOption = form.querySelector(
      `input[name="pregunta-${pregunta.id}"]:checked`
    );
    if (selectedOption) {
      respuestas.push({
        id: pregunta.id,
        respuesta: selectedOption.value,
      });
    }
  });

  // Verificar que todas las preguntas fueron respondidas
  if (respuestas.length !== currentExam.preguntas.length) {
    showAlert(
      "Preguntas sin responder",
      "Por favor responde todas las preguntas antes de enviar",
      "warning"
    );
    // Reiniciar temporizador si aún hay tiempo
    if (timeRemaining > 0) {
      startExamTimer(Math.ceil(timeRemaining / 60));
    }
    return;
  }

  // Deshabilitar el botón de envío para evitar múltiples envíos
  const submitBtn = document.getElementById("submit-exam-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Enviando...";
  }

  try {
    const response = await fetch(`${API_BASE_URL}/exams/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ respuestas }),
    });

    const data = await response.json();

    if (response.ok) {
      displayExamResults(data);
    } else {
      showAlert(
        "Error",
        data.error || "No se pudieron enviar las respuestas",
        "error"
      );
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "📤 Enviar Respuestas";
      }
    }
  } catch (error) {
    console.error("Error al enviar respuestas:", error);
    showAlert(
      "Error de Conexión",
      "No se pudo conectar con el servidor",
      "error"
    );
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "📤 Enviar Respuestas";
    }
  }
}

/** Muestra los resultados del examen */
function displayExamResults(results) {
  const resultIcon = results.aprobado ? "🎉" : "😔";
  const resultClass = results.aprobado ? "success" : "error";

  Swal.fire({
    title: `${resultIcon} ${results.mensaje}`,
    html: `
            <div style="text-align: left; margin: 20px;">
                <p><strong>Puntuación:</strong> ${results.score}%</p>
                <p><strong>Respuestas correctas:</strong> ${
                  results.correctas
                } de ${results.total}</p>
                <p><strong>Puntuación mínima requerida:</strong> ${
                  results.puntajeMinimo
                }%</p>
                ${
                  results.aprobado
                    ? '<p style="color: green; font-weight: bold;">✓ Has aprobado la certificación</p>'
                    : '<p style="color: red;">✗ No alcanzaste la puntuación mínima</p>'
                }
            </div>
        `,
    icon: resultClass,
    confirmButtonText: results.aprobado ? "Descargar Certificado" : "Cerrar",
    confirmButtonColor: "#8e2de2",
  }).then((result) => {
    if (result.isConfirmed && results.aprobado) {
      downloadCertificate();
    } else {
      loadCertifications(); // Recargar página de certificaciones
    }
  });
}

/** Descarga el certificado en PDF */
async function downloadCertificate() {
  const token = localStorage.getItem("token");

  if (!token) {
    showAlert("Error", "Token no encontrado", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/exams/certificate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificado-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showAlert(
        "¡Descarga Exitosa!",
        "Tu certificado ha sido descargado",
        "success"
      );

      // Recargar certificaciones después de descargar
      setTimeout(() => {
        loadCertifications();
      }, 1500);
    } else {
      const data = await response.json();
      showAlert(
        "Error",
        data.error || "No se pudo descargar el certificado",
        "error"
      );
    }
  } catch (error) {
    console.error("Error al descargar certificado:", error);
    showAlert("Error", "No se pudo descargar el certificado", "error");
  }
}

/** Inicia el temporizador del examen */
function startExamTimer(minutes) {
  // Convertir minutos a segundos
  timeRemaining = minutes * 60;

  const timerMinutes = document.getElementById("timer-minutes");
  const timerSeconds = document.getElementById("timer-seconds");
  const timerContainer = document.getElementById("exam-timer");

  if (!timerMinutes || !timerSeconds) {
    console.error("Elementos del temporizador no encontrados");
    return;
  }

  // Actualizar display inicial
  updateTimerDisplay(timerMinutes, timerSeconds, timeRemaining);

  // Limpiar cualquier temporizador existente
  if (examTimer) {
    clearInterval(examTimer);
  }

  // Crear nuevo temporizador que se ejecuta cada segundo
  examTimer = setInterval(() => {
    timeRemaining--;

    // Actualizar display
    updateTimerDisplay(timerMinutes, timerSeconds, timeRemaining);

    // Cambiar color según el tiempo restante
    if (timeRemaining <= 300 && timeRemaining > 60) {
      // 5 minutos
      timerContainer.classList.add("timer-warning");
      timerContainer.classList.remove("timer-critical");

      // Alerta a los 5 minutos (solo una vez)
      if (timeRemaining === 300) {
        showAlert(
          "⏰ Tiempo",
          "Te quedan 5 minutos para terminar el examen",
          "warning"
        );
      }
    } else if (timeRemaining <= 60) {
      // 1 minuto
      timerContainer.classList.add("timer-critical");
      timerContainer.classList.remove("timer-warning");

      // Alerta al minuto (solo una vez)
      if (timeRemaining === 60) {
        showAlert(
          "⚠️ ¡Último minuto!",
          "Te queda 1 minuto para terminar el examen",
          "error"
        );
      }
    }

    // Cuando el tiempo se acaba
    if (timeRemaining <= 0) {
      clearInterval(examTimer);
      examTimer = null;
      autoSubmitExam();
    }
  }, 1000);
}

/** Actualiza el display del temporizador */
function updateTimerDisplay(minutesElement, secondsElement, totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  minutesElement.textContent = mins.toString().padStart(2, "0");
  secondsElement.textContent = secs.toString().padStart(2, "0");
}

/** Envía automáticamente el examen cuando el tiempo se acaba */
async function autoSubmitExam() {
  showAlert(
    "⏰ Tiempo Agotado",
    "El tiempo del examen ha finalizado. Tus respuestas se enviarán automáticamente.",
    "warning"
  );

  // Esperar 2 segundos para que el usuario vea la alerta
  setTimeout(() => {
    const form = document.getElementById("exam-form");
    if (form) {
      // Crear un evento de submit
      const submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);
    }
  }, 2000);
}

// ===================== INICIALIZACIÓN =====================

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();

  if (window.location.pathname.includes("certificaciones.html")) {
    loadCertifications();
  }

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

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeLoginModal();
    }
  });
});
