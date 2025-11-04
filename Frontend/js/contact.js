const API_BASE_URL = "http://localhost:3000/api"; 

// --- Copia de la función de Alerta (necesaria en esta página) ---
function showAlert(title, text, icon) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonColor: '#8e2de2'
        });
    } else {
        console.warn('SweetAlert2 no está cargado.');
        console.log(`${title}: ${text}`);
    }
}

/**
 * Maneja el envío del formulario de Contacto
 */
async function handleContactSubmit(e) {
    e.preventDefault(); // Evita que la página se recargue
    
    // 1. Recuperar los datos del formulario
    const form = e.target;
    const nombre = form.querySelector('#nombre').value;
    const correo = form.querySelector('#correo').value;
    const pregunta = form.querySelector('#pregunta').value; // Asumo que el textarea tiene id="pregunta"
    
    // Deshabilitar el botón de envío para evitar clics múltiples
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
        // 2. Hacer un POST a la ruta pública
        const response = await fetch(`${API_BASE_URL}/contacto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, correo, pregunta }) 
        });

        if (response.ok) {
            // 3. Mostrar alerta de éxito (Requisito del examen)
            showAlert("¡Mensaje Enviado!", "Gracias por contactarnos, te responderemos pronto.", "success");
            form.reset(); // Limpia el formulario
        } else {
            // Manejar errores del servidor
            showAlert("Error", "No se pudo enviar tu mensaje. Intenta más tarde.", "error");
        }

    } catch (error) {
        console.error('Error al enviar formulario de contacto:', error);
        showAlert("Error de Conexión", "No se pudo conectar con el servidor.", "error");
    } finally {
        // Volver a habilitar el botón
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar Mensaje';
    }
}

// --- Inicialización y Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Recuperar el form
    const contactForm = document.getElementById('contact-form'); // Asumo que tu form tiene id="contact-form"
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    } else {
        console.warn('No se encontró el #contact-form en esta página.');
    }
});
