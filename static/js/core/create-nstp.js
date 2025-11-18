document.addEventListener('DOMContentLoaded', function() {
    // Initialize floating labels
    const floatingInputs = document.querySelectorAll('.floating-input input, .floating-input select, .floating-input textarea');

    floatingInputs.forEach(input => {
        // Check if input has value on load
        if (input.value || input.tagName === 'SELECT' && input.value) {
            activateLabel(input);
        }

        // Add focus/blur events
        input.addEventListener('focus', function() {
            activateLabel(this);
        });

        input.addEventListener('blur', function() {
            if (!this.value && this.type !== 'date' && this.tagName !== 'SELECT') {
                resetLabel(this);
            }
        });

        // Handle input changes
        input.addEventListener('input', function() {
            if (this.value) {
                activateLabel(this);
            } else if (this.type !== 'date' && this.tagName !== 'SELECT') {
                resetLabel(this);
            }
        });

        // Special handling for date inputs
        if (input.type === 'date') {
            input.addEventListener('change', function() {
                if (this.value) {
                    activateLabel(this);
                } else {
                    resetLabel(this);
                }
            });
        }
    });

    // Format academic year as user types
    const academicYearField = document.getElementById('{{ form.academic_year.id_for_label }}');
    if (academicYearField) {
        academicYearField.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 4) {
                value = value.substring(0, 4) + '-' + value.substring(4, 8);
            }
            e.target.value = value;
        });
    }

    // Add animation to form sections on scroll
    const formSections = document.querySelectorAll('.form-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    formSections.forEach(section => {
        observer.observe(section);
    });

    // Add hover effect to submit button
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('mouseenter', function() {
            this.querySelector('.btn-icon').style.transform = 'translateX(3px)';
        });

        submitBtn.addEventListener('mouseleave', function() {
            this.querySelector('.btn-icon').style.transform = 'translateX(0)';
        });
    }

    // Mark fields with errors and activate their labels
    document.querySelectorAll('.error-message').forEach(errorElement => {
        const formGroup = errorElement.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('is-invalid');
            const input = formGroup.querySelector('input, select, textarea');
            if (input) {
                activateLabel(input);
            }
        }
    });

    // Helper functions
    function activateLabel(input) {
        const formGroup = input.closest('.form-group');
        const label = input.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.classList.add('active');
            label.style.top = '-0.5rem';
            label.style.left = '0.8rem';
            label.style.fontSize = '0.75rem';
            label.style.color = formGroup.classList.contains('is-invalid') ? '#dc3545' : '#003366';
            label.style.background = '#ffffff';
            label.style.padding = '0 0.3rem';
            label.style.zIndex = '1';
        }
    }

    function resetLabel(input) {
        const label = input.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.classList.remove('active');
            label.style.top = '1rem';
            label.style.left = '1rem';
            label.style.fontSize = '1rem';
            label.style.color = '#999';
            label.style.background = 'transparent';
            label.style.padding = '0';
            label.style.zIndex = '0';
        }
    }
});