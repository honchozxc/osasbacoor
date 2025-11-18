class ProfileManager {
    constructor() {
        this.currentEditTab = 'basic';
        this.initElements();
        this.bindEvents();
        this.initFromUrl();
    }

    initElements() {
        this.editButton = document.getElementById('editProfileBtn');
        this.toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        this.loadingOverlay = document.getElementById('formLoadingOverlay') || this.createLoadingOverlay();
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'formLoadingOverlay';
        overlay.className = 'form-loading-overlay';
        overlay.innerHTML = `
            <div class="form-loading-spinner">
                <div class="spinner"></div>
                <p>Saving changes...</p>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    bindEvents() {
        // Form & Buttons submissions
        document.getElementById('zen-profile-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm(e.target, 'update_profile');
        });

        document.getElementById('accountForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm(e.target, 'update_account_info');
        });

        document.getElementById('passwordForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm(e.target, 'password_change');
        });

        document.getElementById('cancelProfileEditBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleEditMode(false);
        });

        document.getElementById('cancelAccountEditBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleEditMode(false);
        });

        this.addNameValidationListeners();

        // Tab switching
        document.querySelectorAll('.zen-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = btn.getAttribute('onclick').match(/showProfileTab\('(.*?)'\)/)[1];
                this.showProfileTab(tabName);
            });
        });

        // Edit button
        this.editButton?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleEditMode(!this.isInEditMode());
        });

        // Profile picture upload
        document.getElementById('id_profile_picture')?.addEventListener('change', (e) => {
            this.previewProfilePicture(e.target);
        });

        const passwordInput = document.getElementById('id_new_password1');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                const input = e.target;
                const strengthBar = input.parentNode.querySelector('.password-strength .password-strength-bar');
                if (strengthBar) {
                    this.updatePasswordStrength(input.value, strengthBar);
                }
            });
        }
    }


    addNameValidationListeners() {
        const firstNameInput = document.getElementById('id_first_name');
        const lastNameInput = document.getElementById('id_last_name');

        if (firstNameInput) {
            firstNameInput.addEventListener('input', (e) =>
                this.validateNameField(e.target, 'First Name'));
        }

        if (lastNameInput) {
            lastNameInput.addEventListener('input', (e) =>
                this.validateNameField(e.target, 'Last Name'));
        }
    }

    addValidationListeners() {
        this.addFieldValidation('id_first_name', this.validateName.bind(this, 'First Name'));
        this.addFieldValidation('id_last_name', this.validateName.bind(this, 'Last Name'));
        this.addFieldValidation('id_phone_number', this.validatePhoneNumber.bind(this));
        this.addFieldValidation('id_email', this.validateEmail.bind(this));
        this.addFieldValidation('id_username', this.validateUsername.bind(this));
        this.addFieldValidation('id_unit', this.validateUnit.bind(this));
        this.addFieldValidation('id_new_password1', this.validatePassword.bind(this));
        this.addFieldValidation('id_new_password2', this.validatePasswordConfirm.bind(this));
    }

    addFieldValidation(fieldId, validationFn) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', (e) => {
                this.validateField(e.target, validationFn);
            });
            // Validate initial value
            this.validateField(field, validationFn);
        }
    }

    validateField(field, validationFn) {
        const { isValid, message } = validationFn(field.value);
        if (!isValid) {
            this.showFieldError(field, message);
        } else {
            this.clearFieldError(field);
        }
        return isValid;
    }

    // Validation functions
    validateName(fieldName, value) {
        const isValid = !/\d/.test(value) && value.trim().length >= 2;
        return {
            isValid,
            message: isValid ? '' : `${fieldName} must be at least 2 characters without numbers`
        };
    }

    validatePhoneNumber(value) {
        const isValid = /^[0-9]{7,15}$/.test(value);
        return {
            isValid,
            message: isValid ? '' : 'Phone number must be 7-15 digits'
        };
    }

    validateEmail(value) {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        return {
            isValid,
            message: isValid ? '' : 'Please enter a valid email address'
        };
    }

    validateUsername(value) {
        const isValid = /^[a-zA-Z0-9_]{3,30}$/.test(value);
        return {
            isValid,
            message: isValid ? '' : 'Username must be 3-30 characters (letters, numbers, underscores)'
        };
    }

    validateUnit(value) {
        const isValid = value !== "";
        return {
            isValid,
            message: isValid ? '' : 'Please select a unit'
        };
    }

    validatePassword(value) {
    if (!value) return { isValid: false, message: 'Password is required' };

    const hasMinLength = value.length >= 8;
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const isValid = hasMinLength && hasLower && hasUpper && hasNumber && hasSpecial;
    const message = isValid ? '' : 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character';

    return { isValid, message };
    }

    updatePasswordStrength(password, strengthBar) {
        const strength = this.calculatePasswordStrength(password);
        let width, colorClass;

        switch (strength) {
            case 'empty':
                width = '0%';
                colorClass = '';
                break;
            case 'weak':
                width = '30%';
                colorClass = 'password-strength-weak';
                break;
            case 'medium':
                width = '60%';
                colorClass = 'password-strength-medium';
                break;
            case 'strong':
                width = '100%';
                colorClass = 'password-strength-strong';
                break;
            default:
                width = '0%';
                colorClass = '';
        }

        strengthBar.style.width = width;
        strengthBar.className = `password-strength-bar ${colorClass}`;
    }

    calculatePasswordStrength(password) {
        if (password.length === 0) return 'empty';

        let score = 0;

        // Length
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Character types
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
        return 'strong';
    }

    validatePasswordConfirm(value) {
        const password = document.getElementById('id_new_password1')?.value;
        const isValid = value === password;
        return {
            isValid,
            message: isValid ? '' : 'Passwords do not match'
        };
    }

    validateForm(form) {
        let isValid = true;

        // Basic Info
        if(form.id === 'zen-profile-form') {
            isValid &= this.validateFieldById(form, 'id_first_name', this.validateName.bind(this, 'First Name'));
            isValid &= this.validateFieldById(form, 'id_last_name', this.validateName.bind(this, 'Last Name'));
            isValid &= this.validateFieldById(form, 'id_phone_number', this.validatePhoneNumber.bind(this));
        }

        // Account Info
        if(form.id === 'accountForm') {
            isValid &= this.validateFieldById(form, 'id_email', this.validateEmail.bind(this));
            isValid &= this.validateFieldById(form, 'id_username', this.validateUsername.bind(this));
        }

        // Password Change
        if(form.id === 'passwordForm') {
            isValid &= this.validateFieldById(form, 'id_new_password1', this.validatePassword.bind(this));
            isValid &= this.validateFieldById(form, 'id_new_password2', this.validatePasswordConfirm.bind(this));
        }

        return isValid;
    }

    validateFieldById(form, fieldId, validationFn) {
        const field = form.querySelector(`#${fieldId}`);
        if (!field) return true;
        return this.validateField(field, validationFn);
    }

    showFieldError(field, message) {
        let errorContainer = field.parentNode.querySelector('.error-message');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'error-message';
            field.parentNode.insertBefore(errorContainer, field.nextSibling);
        }
        errorContainer.textContent = message;
        field.classList.add('error');
    }

    clearFieldError(field) {
        const errorContainer = field.parentNode.querySelector('.error-message');
        if (errorContainer) {
            errorContainer.remove();
        }
        field.classList.remove('error');
    }

    initFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const activeTab = urlParams.get('tab') || 'basic';
        this.showProfileTab(activeTab);
    }

    isInEditMode() {
        if (this.currentEditTab === 'basic') {
            const form = document.getElementById('zen-profile-form');
            return form ? form.style.display === 'block' : false;
        } else if (this.currentEditTab === 'account') {
            const form = document.getElementById('accountForm');
            return form ? form.style.display === 'block' : false;
        }
        return false;
    }

    toggleEditMode(show = true) {
        const viewMode = document.getElementById(`${this.currentEditTab}-info-view`);
        const editMode = document.getElementById(this.currentEditTab === 'basic' ? 'zen-profile-form' : 'accountForm');

        if (show) {
            if (viewMode) viewMode.style.display = 'none';
            if (editMode) editMode.style.display = 'block';
            if (this.editButton) {
                this.editButton.innerHTML = '<i class="ri-close-line"></i> Cancel';
                this.editButton.classList.remove('zen-btn-primary');
                this.editButton.classList.add('zen-btn-secondary');
            }
        } else {
            if (viewMode) viewMode.style.display = 'block';
            if (editMode) editMode.style.display = 'none';
            if (this.editButton) {
                this.editButton.innerHTML = '<i class="ri-edit-line"></i> Edit Profile';
                this.editButton.classList.remove('zen-btn-secondary');
                this.editButton.classList.add('zen-btn-primary');
            }
        }
    }

    showProfileTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.zen-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Deactivate all tab buttons
        document.querySelectorAll('.zen-tab-btn').forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab
        const tabToShow = document.getElementById(`${tabName}-tab`);
        if (tabToShow) tabToShow.classList.add('active');

        // Activate selected tab button
        const activeButton = document.querySelector(`.zen-tab-btn[onclick="showProfileTab('${tabName}')"]`);
        if (activeButton) activeButton.classList.add('active');

        // Update current edit tab
        this.currentEditTab = tabName;

        // Reset edit button state when switching tabs
        if (this.isInEditMode()) {
            this.toggleEditMode(false);
        }

        // Update URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabName);
        window.history.pushState({}, '', url);
    }

    previewProfilePicture(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            const profileImg = document.getElementById('profilePicture');

            reader.onload = (e) => {
                if (profileImg) profileImg.src = e.target.result;
                this.showToast({
                    message: 'Profile picture updated successfully!',
                    type: 'success'
                });
            };

            reader.readAsDataURL(input.files[0]);
        }
    }

    async submitForm(form, endpoint) {
    const url = form.action;
    let loadingMessage = 'Saving changes...';
    if (url.includes('update_profile')) loadingMessage = 'Updating profile...';
    if (url.includes('update_account_info')) loadingMessage = 'Updating account information...';
    if (url.includes('password_change')) loadingMessage = 'Updating password...';

    // Validate form before proceeding
    if (endpoint === 'password_change') {
        const passwordValid = this.validateFieldById(form, 'id_new_password1', this.validatePassword.bind(this));
        const confirmValid = this.validateFieldById(form, 'id_new_password2', this.validatePasswordConfirm.bind(this));

        if (!passwordValid || !confirmValid) {
            this.showToast({
                message: 'Please correct the password validation errors',
                type: 'error'
            });
            return;
        }
    } else if (endpoint === 'update_profile' && !this.validateForm(form)) {
        this.showToast({
            message: 'Please correct validation errors',
            type: 'error'
        });
        return;
    }

    // Only show loading if validation passed
    this.showLoading(true, loadingMessage);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: new FormData(form),
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        });

        if (endpoint === 'password_change') {
            const data = await response.json();
            if (data.success) {
                this.showToast({
                    message: 'Password updated successfully. Logging out...',
                    type: 'success',
                    duration: 3000
                });
                setTimeout(() => {
                    window.location.href = '/logout/';
                }, 3000);
            } else {
                this.showFormErrors(form, data.errors);
                this.showToast({
                    message: data.message || 'Error updating password. Please check the form.',
                    type: 'error'
                });
            }
            return;
        }

        const data = await response.json();

        if (data.success) {
            this.showToast({
                message: data.message || 'Changes saved successfully!',
                type: 'success'
            });

            this.toggleEditMode(false);

            if (data.user) {
                this.updateViewMode(data.user, endpoint);
            }

            if (data.profile_picture_url) {
                const profileImg = document.getElementById('profilePicture');
                if (profileImg) profileImg.src = data.profile_picture_url;
            }
        } else {
            this.showFormErrors(form, data.errors);
            this.showToast({
                message: data.message || 'Please correct the errors at the field.',
                type: 'error'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        this.showToast({
            message: 'An error occurred. Please try again.',
            type: 'error'
        });
    } finally {
        this.showLoading(false);
    }
}

    updateViewMode(userData, endpoint) {
        const fieldMappings = {
            'update_profile': {
                'first_name': 'First Name:',
                'last_name': 'Last Name:',
                'gender_display': 'Gender:',
                'birth_date': 'Birth Date:',
                'address': 'Address:',
                'phone_number': 'Phone Number:',
                'position': 'Position:',
                'unit': 'Unit:',
                'bio': 'Bio:'
            },
            'update_account_info': {
                'username': 'Username:',
                'email': 'Email:',
                'user_type_display': 'Account Type:',
                'is_active': 'Account Status:'
            }
        };

        const currentMapping = fieldMappings[endpoint];
        if (!currentMapping) return;

        Object.entries(currentMapping).forEach(([dataKey, labelText]) => {
            const value = userData[dataKey];
            if (value === undefined) return;

            const labelSpan = Array.from(document.querySelectorAll('.zen-detail-label'))
                .find(el => el.textContent.trim() === labelText);

            if (labelSpan) {
                const valueElement = labelSpan.nextElementSibling;
                if (valueElement && valueElement.classList.contains('zen-detail-value')) {
                    if (dataKey === 'is_active') {
                        const badge = valueElement.querySelector('.zen-status-badge');
                        if (badge) {
                            badge.textContent = value ? 'Active' : 'Inactive';
                            badge.classList.toggle('active', value);
                            badge.classList.toggle('inactive', !value);
                        }
                    } else {
                        valueElement.textContent = value || 'Not specified';
                    }
                }
            }
        });
    }

    showFormErrors(form, errors) {
        if (!form) return;

        // Remove errors
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.zen-form-input').forEach(el => el.classList.remove('error'));

        // Add new errors
        if (errors) {
            Object.entries(errors).forEach(([field, errorList]) => {
                const input = form.querySelector(`[name="${field}"]`);
                if (input) {
                    input.classList.add('error');
                    const errorContainer = document.createElement('div');
                    errorContainer.className = 'error-message';
                    errorContainer.textContent = errorList[0]?.message || 'This field is invalid';
                    input.parentNode.insertBefore(errorContainer, input.nextSibling);
                }
            });
        }
    }

    showToast({ message, type = 'info', duration = 5000 }) {
        if (!this.toastContainer) return;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        toast.style.setProperty('--toast-color', this.getToastColor(type));

        toast.innerHTML = `
            <i class="toast-icon ${this.getToastIcon(type)}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close">
                <i class="ri-close-line"></i>
            </button>
        `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'ri-checkbox-circle-fill',
            'error': 'ri-close-circle-fill',
            'info': 'ri-information-fill',
            'warning': 'ri-alert-fill'
        };
        return icons[type] || 'ri-information-fill';
    }

    getToastColor(type) {
        const colors = {
            'success': '#32CD32',
            'error': 'var(--danger)',
            'info': 'var(--info)',
            'warning': 'var(--warning)'
        };
        return colors[type] || 'var(--primary)';
    }

    showLoading(show, message = 'Saving changes...') {
        if (!this.loadingOverlay) return;

        if (show) {
            const messageElement = this.loadingOverlay.querySelector('p');
            if (messageElement) messageElement.textContent = message;
            this.loadingOverlay.style.display = 'flex';
        } else {
            this.loadingOverlay.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const profileManager = new ProfileManager();
});
