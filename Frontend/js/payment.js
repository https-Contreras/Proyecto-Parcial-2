const API_BASE_URL = "http://localhost:3000/api";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Recuperar el botón de pago específico
    const payButton = document.getElementById('btn-pay-node');
    
    if (payButton) {
        payButton.addEventListener('click', handlePaymentSubmit);
    }
});

/**
 * Maneja el envío del formulario de Pago Simulado
 */
async function handlePaymentSubmit(e) {
    const button = e.currentTarget;

    // 2. Obtener el token de localStorage (necesario para authRequired)
    const token = localStorage.getItem('token');

    // 3. Validar que el usuario esté logueado
    if (!token) {
        // Asumo que showAlert() está disponible globalmente desde js/auth.js
        showAlert("Acceso Requerido", "Debes iniciar sesión para poder pagar.", "warning");
        return;
    }

    // 4. Obtener el ID de la certificación desde el HTML (usando data-attributes)
    const card = button.closest('.certification-card');
    const certId = card ? card.dataset.certId : null; // Asumo que tu HTML tiene <article data-cert-id="node-js">

    if (!certId) {
        showAlert("Error", "No se pudo identificar la certificación. Contacta a soporte.", "error");
        return;
    }

    button.disabled = true;
    button.textContent = 'Procesando...';

    try {
        // 5. Enviar la petición POST a la ruta protegida
        const response = await fetch(`${API_BASE_URL}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 6. Enviar el token en el header para el "candado" authRequired
                'Authorization': `Bearer ${token}`
            },
            // 7. Enviar el certId que el controlador espera
            body: JSON.stringify({ certId: certId }) 
        });

        const data = await response.json();

        if (response.ok) {
            // ¡Éxito!
            showAlert("¡Pago Exitoso!", data.mensaje, "success");
            button.textContent = "Pagado";
            button.classList.add('paid'); // (Opcional, para cambiar el estilo a verde)

            // 8. Habilitar el botón de "Iniciar Examen"
            const startButton = card.querySelector('.btn-start'); // Asumo que el botón de inicio tiene la clase .btn-start
            if (startButton) {
                startButton.disabled = false;
            }
        } else {
            // Manejar errores del backend (ej: "Ya has pagado")
            showAlert("Error de Pago", data.error || "Ocurrió un error inesperado.", "error");
            button.disabled = false;
            button.textContent = 'Pagar Examen';
        }

    } catch (error) {
        console.error('Error al procesar el pago:', error);
        showAlert("Error de Conexión", "No se pudo conectar con el servicio de pago.", "error");
        button.disabled = false;
        button.textContent = 'Pagar Examen';
    }
}
