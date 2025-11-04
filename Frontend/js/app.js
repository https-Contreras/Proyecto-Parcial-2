// --- Elementos del DOM ---
const modal = document.getElementById('login-modal');
const authButton = document.getElementById('auth-button');
const userDisplay = document.getElementById('user-account-display');


const API_BASE_URL = "http://localhost:3000/api";

/** Muestra el modal de login */
function openLoginModal() {
    modal.style.display = 'flex';
    loginForm.reset(); 
}

/** Oculta el modal de login */
function closeLoginModal() {
    modal.style.display = 'none';
}

/** Muestra alertas usando SweetAlert2*/
function showAlert(title, text, icon) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonColor: '#8e2de2'
        });
    } else {
        console.warn('SweetAlert2 no está cargado. Usando console.log.');
        console.log(`${title}: ${text}`);
    }
}

/** Actualiza la interfaz de usuario del header (Login/Logout, cuenta activa). */
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const userAccount = localStorage.getItem('userAccount'); 
    const nombre = localStorage.getItem('userName');
    
    if (token && userAccount) {
        userDisplay.textContent = `Hola, ${nombre}`; 
        userDisplay.style.display = 'inline';
        authButton.textContent = 'Logout';
        authButton.classList.add('logout');
    } else {
        userDisplay.style.display = 'none';
        authButton.textContent = 'Login';
        authButton.classList.remove('logout');
    }
}


/* Maneja la lógica de cerrar sesión */

async function handleLogout() {
    const token = localStorage.getItem('token');

    try {
        if (token) {
            // 1. Notificar al backend que cierre la sesión (ruta protegida)
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    // 2. ENVIAR EL TOKEN para que authRequired lo valide
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        // No importa si el backend falla, el front DEBE cerrar sesión
        console.warn("Error al notificar al backend sobre el logout:", error);
    } finally {
        // 3. (MUY IMPORTANTE) Limpiar el frontend SIEMPRE
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userAccount');
        
        // 4. Actualizar la interfaz
        updateAuthUI();
        
        // 5. Mostrar alerta de éxito
        showAlert("¡Adiós!", "Has cerrado la sesión con éxito.", "success");
    }
}


async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const cuenta = document.getElementById('cuenta').value;
    const password = document.getElementById('password').value;

    closeLoginModal(); 

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cuenta, password }) 
        });

        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            console.warn("Respuesta no JSON del servidor.", parseErr);
            data = {};
        }
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.nombre); 
            localStorage.setItem('userAccount', data.user.cuenta); 
            
            updateAuthUI();
            showAlert("¡Acceso Permitido!", `Bienvenido, ${data.user.nombre}.`, "success");

            // Recargar certificaciones si estamos en esa página
            if (window.location.pathname.includes('certificaciones.html')) {
                loadCertifications();
            }

        } else if (response.status === 401) {
            showAlert("Error en las Credenciales", "La cuenta o la contraseña son incorrectas.", "error");
        } else {
            showAlert("Error del Servidor", data.message || "Ocurrió un error inesperado en el servidor.", "error");
        }

    } catch (error) {
        console.error('Error al realizar la petición de login:', error);
        showAlert("Error de Conexión", "No se pudo conectar con el servicio de autenticación.", "error");
    }
}

// ===================== FUNCIONES PARA CERTIFICACIONES =====================

/** Carga las certificaciones desde el backend */
async function loadCertifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/certifications`);
        
        if (!response.ok) {
            throw new Error('Error al cargar certificaciones');
        }

        const data = await response.json();
        renderCertifications(data.certificaciones);

    } catch (error) {
        console.error('Error cargando certificaciones:', error);
        showAlert("Error", "No se pudieron cargar las certificaciones", "error");
    }
}

/** Renderiza las tarjetas de certificación dinámicamente */
function renderCertifications(certifications) {
    const container = document.querySelector('.certifications-grid');
    
    if (!container) {
        console.warn('No se encontró el contenedor de certificaciones');
        return;
    }

    // Limpiar contenido existente
    container.innerHTML = '';

    certifications.forEach(cert => {
        const card = createCertificationCard(cert);
        container.appendChild(card);
    });
}

/** Crea una tarjeta individual de certificación */
function createCertificationCard(cert) {
    const article = document.createElement('article');
    article.className = `certification-card ${cert.activa ? 'enabled' : 'disabled'}`;
    article.dataset.certId = cert.id;

    // Formatear fecha de disponibilidad
    let availabilityText = '';
    if (cert.activa) {
        availabilityText = '<p class="availability-info success-info">✓ Disponible Inmediatamente</p>';
    } else if (cert.disponibleDesde) {
        const fecha = new Date(cert.disponibleDesde);
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        const fechaFormateada = fecha.toLocaleDateString('es-MX', opciones);
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
                <li><strong class="label">Puntuación Mínima:</strong> ${cert.puntajeMinimo}/100</li>
                <li><strong class="label">Tiempo de Examen:</strong> ${cert.tiempo} minutos</li>
                <li><strong class="label">Costo:</strong> $${cert.costo} MXN</li>
            </ul>
            ${availabilityText}
        </div>
        <div class="card-actions">
            <button class="btn-pay" data-cert-id="${cert.id}" ${!cert.activa ? 'disabled' : ''}>
                Pagar Examen
            </button>
            <button class="btn-start" data-cert-id="${cert.id}" disabled>
                Iniciar Examen
            </button>
        </div>
    `;

    // Agregar event listeners a los botones
    const btnPay = article.querySelector('.btn-pay');
    const btnStart = article.querySelector('.btn-start');

    if (btnPay && cert.activa) {
        btnPay.addEventListener('click', () => handlePayment(cert.id));
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => handleStartExam(cert.id));
    }

    return article;
}

/** Maneja el pago de una certificación */
async function handlePayment(certId) {
    const token = localStorage.getItem('token');

    if (!token) {
        showAlert("Autenticación Requerida", "Debes iniciar sesión para pagar un examen", "warning");
        openLoginModal();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ certId })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(
                "¡Pago Exitoso!", 
                `Has pagado la certificación "${data.certificacion}". Ahora puedes iniciar el examen.`, 
                "success"
            );
            
            // Habilitar botón de iniciar examen
            const btnStart = document.querySelector(`.btn-start[data-cert-id="${certId}"]`);
            if (btnStart) {
                btnStart.disabled = false;
            }

            // Deshabilitar botón de pago
            const btnPay = document.querySelector(`.btn-pay[data-cert-id="${certId}"]`);
            if (btnPay) {
                btnPay.disabled = true;
                btnPay.textContent = "✓ Pagado";
            }

        } else {
            showAlert("Error en el Pago", data.error || "No se pudo procesar el pago", "error");
        }

    } catch (error) {
        console.error('Error en el pago:', error);
        showAlert("Error de Conexión", "No se pudo conectar con el servidor", "error");
    }
}

/** Maneja el inicio de un examen */
async function handleStartExam(certId) {
    const token = localStorage.getItem('token');

    if (!token) {
        showAlert("Autenticación Requerida", "Debes iniciar sesión para comenzar el examen", "warning");
        openLoginModal();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/exams/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(
                "¡Examen Iniciado!", 
                `Tienes ${data.certificacion.tiempo} minutos para completar el examen`, 
                "info"
            );
            
            // Aquí podrías redirigir a una página de examen
            console.log('Preguntas del examen:', data.preguntas);
            
            // TODO: Implementar página de examen
            // window.location.href = `examen.html?certId=${certId}`;

        } else {
            showAlert("Error", data.error || "No se pudo iniciar el examen", "error");
        }

    } catch (error) {
        console.error('Error al iniciar examen:', error);
        showAlert("Error de Conexión", "No se pudo conectar con el servidor", "error");
    }
}

// ===================== INICIALIZACIÓN =====================

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    
    // Cargar certificaciones si estamos en esa página
    if (window.location.pathname.includes('certificaciones.html')) {
        loadCertifications();
    }
    
    authButton.addEventListener("click", () => {
        const token = localStorage.getItem('token');
        if (token) {
            handleLogout(); // Llamar a la función de logout
        } else {
            openLoginModal(); // Llamar a la función de login
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    const closeButton = document.querySelector('.modal-content .close-button');
    if (closeButton) {
        closeButton.addEventListener('click', closeLoginModal);
    }
    
    // Cerrar modal si se hace clic fuera de él
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModalModal();
        }
    });
});