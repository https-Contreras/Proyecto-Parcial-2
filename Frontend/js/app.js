// --- Elementos del DOM ---
const modal = document.getElementById('login-modal');
const authButton = document.getElementById('auth-button');
const userDisplay = document.getElementById('user-account-display');
const loginForm = document.getElementById('login-form');

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

/** * Actualiza la interfaz de usuario del header (Login/Logout, cuenta activa). 
 * Se llama al cargar la página y después de cualquier cambio de sesión.
 */
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
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAccount');
    
    updateAuthUI();
    
    showAlert("¡Adiós!", "Has cerrado la sesión con éxito.", "success");
}

/* Maneja el envío del formulario de Login */
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
            console.warn("Respuesta no JSON del servidor. Posible error interno o 401 sin cuerpo.", parseErr);
            data = {};
        }
        
        if (response.ok) {
            // Acceso permitido
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.nombre); 
            localStorage.setItem('userAccount', data.user.cuenta); 
            
            updateAuthUI();
            
            showAlert("¡Acceso Permitido!", `Bienvenido, ${data.user.nombre}.`, "success");

        } else if (response.status === 401) {
            showAlert("Error en las Credenciales", "La cuenta o la contraseña son incorrectas.", "error");
        } else {
            showAlert("Error del Servidor", data.message || "Ocurrió un error inesperado en el servidor.", "error");
        }

    } catch (error) {
        console.error('Error al realizar la petición de login:', error);
        showAlert("Error de Conexión", "No se pudo conectar con el servicio de autenticación. Asegúrate de que el backend esté corriendo en el puerto 3000.", "error");
    }
}

// Inicialización y Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    
    authButton.addEventListener("click", () => {
        const token = localStorage.getItem('token');
        if (token) {
            handleLogout();
        } else {
            openLoginModal();
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
            closeLoginModal();
        }
    });
});
