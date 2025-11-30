function switchToLogin() {
    const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
    loginTab.show();
}

function switchToRegister() {
    const registerTab = new bootstrap.Tab(document.getElementById('register-tab'));
    registerTab.show();
}

function mostrarAlerta(tipo, mensaje) {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    // Auto-cerrar la alerta después de 5 segundos
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Procesar parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    const tab = urlParams.get('tab');
    
    // Cambiar de tab si es necesario
    if (tab === 'register') {
        switchToRegister();
    } else if (tab === 'login' || success) {
        switchToLogin();
    }
    
    // Mostrar mensajes
    if (error) {
        const errores = {
            1: 'Credenciales incorrectas. Verifica tu email y contraseña.',
            2: 'Error del servidor. Intenta más tarde.',
            3: 'Datos incompletos o las contraseñas no coinciden.',
            4: 'Este email ya está registrado. Usa otro o inicia sesión.',
            5: 'Error al crear la cuenta. Intenta nuevamente.'
        };
        mostrarAlerta('danger', errores[error] || 'Error desconocido');
    } else if (success) {
        mostrarAlerta('success', '¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
    }
    
    // Validar formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const passwordInput = registerForm.querySelector('input[name="password"]');
        const confirmPasswordInput = registerForm.querySelector('input[name="confirmar_password"]');
        
        if (confirmPasswordInput && passwordInput) {
            // Validación en tiempo real
            const validatePasswords = function() {
                if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
                    confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden');
                    confirmPasswordInput.classList.add('is-invalid');
                } else {
                    confirmPasswordInput.setCustomValidity('');
                    confirmPasswordInput.classList.remove('is-invalid');
                }
            };
            
            passwordInput.addEventListener('change', validatePasswords);
            passwordInput.addEventListener('keyup', validatePasswords);
            confirmPasswordInput.addEventListener('change', validatePasswords);
            confirmPasswordInput.addEventListener('keyup', validatePasswords);
        }
        
        // Validación del formulario al enviar
        registerForm.addEventListener('submit', function(e) {
            // Verificar que contraseñas coincidan
            if (passwordInput.value !== confirmPasswordInput.value) {
                e.preventDefault();
                e.stopPropagation();
                mostrarAlerta('danger', 'Las contraseñas no coinciden.');
                return false;
            }
            
            if (!this.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            this.classList.add('was-validated');
        });
    }
    
    // Limpiar parámetros de URL después de mostrar mensajes
    if (error || success || tab) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});
