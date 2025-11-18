document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('.nav-button');
    const loginModal = document.getElementById('loginModal');
    const loginModalClose = document.getElementById('loginModalClose');
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('id_username');
    const passwordInput = document.getElementById('id_password');

    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            clearAllErrors();
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (loginModalClose) {
        loginModalClose.addEventListener('click', function() {
            loginModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    loginModal.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });

        let isValid = true;

        if (!usernameInput.value.trim()) {
            document.getElementById('username-error').textContent = 'Username is required';
            document.getElementById('username-error').style.display = 'block';
            isValid = false;
        }

        if (!passwordInput.value.trim()) {
            document.getElementById('password-error').textContent = 'Password is required';
            document.getElementById('password-error').style.display = 'block';
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
            document.getElementById('password-error').style.display = 'block';
            isValid = false;
        }

        if (isValid) {
            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.classList.add('loading');

            submitLoginForm()
                .finally(() => {
                    submitButton.disabled = false;
                    submitButton.classList.remove('loading');
                });
        }
    });
}

    if (usernameInput) {
        usernameInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                document.getElementById('username-error').textContent = 'Username is required';
                document.getElementById('username-error').style.display = 'block';
            } else {
                document.getElementById('username-error').style.display = 'none';
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                document.getElementById('password-error').textContent = 'Password is required';
                document.getElementById('password-error').style.display = 'block';
            } else if (this.value.length < 6) {
                document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
                document.getElementById('password-error').style.display = 'block';
            } else {
                document.getElementById('password-error').style.display = 'none';
            }
        });
    }

    function submitLoginForm() {
    return new Promise((resolve, reject) => {
        const formData = new FormData(loginForm);

        fetch(loginForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': formData.get('csrfmiddlewaretoken')
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = data.redirect_url || '/';
                }, 1500);
            } else {
                // Show the error message in a toast
                if (data.error) {
                    showToast(data.error, 'error');
                } else {
                    showToast('An error occurred during login', 'error');
                }

                // Show field errors if they exist
                if (data.field_errors) {
                    for (const field in data.field_errors) {
                        const errorElement = document.getElementById(`${field}-error`);
                        if (errorElement) {
                            errorElement.textContent = data.field_errors[field];
                            errorElement.style.display = 'block';
                        }
                    }
                }
            }
            resolve();
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred. Please try again.', 'error');
            reject(error);
        });
    });
}

    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
});

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent = '';
            el.style.display = 'none';
            el.style.opacity = '1';
        }, 300);
    });
}