document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const studentTypeSelect = document.getElementById('id_student_type');
    const basicInfoSection = document.getElementById('basicInfoSection');
    const currentGrade12Section = document.getElementById('currentGrade12Section');
    const shsGraduateSection = document.getElementById('shsGraduateSection');
    const transfereeSection = document.getElementById('transfereeSection');

    // Navigation elements
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    const progressSteps = document.querySelectorAll('.progress-step');

    // File upload elements
    const fileInputs = document.querySelectorAll('.file-input');
    const uploadButtons = document.querySelectorAll('.upload-btn');

    // Checkbox element
    const admissionCheckbox = document.getElementById('id_admission_portal_registration');
    const admissionCheckboxLabel = admissionCheckbox.nextElementSibling;

    // Hide all requirement sections initially
    [currentGrade12Section, shsGraduateSection, transfereeSection].forEach(section => {
        section.classList.remove('active');
    });

    // Next button click handler
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (validateCurrentSection(basicInfoSection)) {
                // Hide basic info section
                basicInfoSection.classList.remove('active');

                // Show the appropriate requirements section based on student type
                const selectedType = studentTypeSelect.value;
                if (selectedType === 'current_grade12') {
                    currentGrade12Section.classList.add('active');
                } else if (selectedType === 'shs_graduate') {
                    shsGraduateSection.classList.add('active');
                } else if (selectedType === 'transferee') {
                    transfereeSection.classList.add('active');
                }

                // Update progress steps
                updateProgressSteps(2);
            }
        });
    });

    // Back button click handler
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Hide all requirements sections
            [currentGrade12Section, shsGraduateSection, transfereeSection].forEach(section => {
                section.classList.remove('active');
            });

            // Show basic info section
            basicInfoSection.classList.add('active');

            // Update progress steps
            updateProgressSteps(1);
        });
    });

    // Update progress steps
    function updateProgressSteps(activeStep) {
        progressSteps.forEach((step, index) => {
            if (index < activeStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // File upload button click handler
    uploadButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            fileInputs[index].click();
        });
    });

    // File input change handler
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.files.length > 0) {
                const fileName = this.files[0].name;
                const uploadBtn = this.closest('.file-upload-card').querySelector('.upload-btn');
                uploadBtn.textContent = fileName.length > 20 ?
                    fileName.substring(0, 17) + '...' : fileName;
                uploadBtn.classList.add('file-selected');
            }
        });
    });

    // Form validation
    function validateCurrentSection(section) {
        let isValid = true;
        const requiredInputs = section.querySelectorAll('[required]');

        requiredInputs.forEach(input => {
            if (input.type === 'checkbox') {
                // Special validation for checkbox
                if (!input.checked) {
                    // Add error class to the label
                    admissionCheckboxLabel.classList.add('error');
                    isValid = false;

                    // Add error message if not exists
                    if (!admissionCheckboxLabel.nextElementSibling || !admissionCheckboxLabel.nextElementSibling.classList.contains('error-message')) {
                        const errorMessage = document.createElement('div');
                        errorMessage.className = 'error-message';
                        errorMessage.textContent = 'You must complete the Admission Portal Registration to proceed';
                        errorMessage.style.color = 'var(--error-red)';
                        errorMessage.style.fontSize = '0.8rem';
                        errorMessage.style.marginTop = '5px';
                        admissionCheckboxLabel.parentNode.insertBefore(errorMessage, admissionCheckboxLabel.nextSibling);
                    }
                } else {
                    // Remove error if checkbox is checked
                    admissionCheckboxLabel.classList.remove('error');
                    if (admissionCheckboxLabel.nextElementSibling && admissionCheckboxLabel.nextElementSibling.classList.contains('error-message')) {
                        admissionCheckboxLabel.nextElementSibling.remove();
                    }
                }
            } else {
                // Standard validation for other input types
                if (!input.value) {
                    input.classList.add('error');
                    isValid = false;

                    // Add error message if not exists
                    if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('error-message')) {
                        const errorMessage = document.createElement('div');
                        errorMessage.className = 'error-message';
                        errorMessage.textContent = 'This field is required';
                        errorMessage.style.color = 'var(--error-red)';
                        errorMessage.style.fontSize = '0.8rem';
                        errorMessage.style.marginTop = '5px';
                        input.parentNode.insertBefore(errorMessage, input.nextSibling);
                    }
                } else {
                    input.classList.remove('error');
                    if (input.nextElementSibling && input.nextElementSibling.classList.contains('error-message')) {
                        input.nextElementSibling.remove();
                    }
                }
            }
        });

        return isValid;
    }

    // Initialize progress steps
    updateProgressSteps(1);

    // Initialize floating labels for prefilled values
    document.querySelectorAll('.form-control').forEach(input => {
        if (input.value) {
            input.nextElementSibling.style.top = '-10px';
            input.nextElementSibling.style.fontSize = '0.8rem';
            input.nextElementSibling.style.color = 'var(--primary-blue)';
        }
    });

    // Add event listener to checkbox to clear error when checked
    admissionCheckbox.addEventListener('change', function() {
        if (this.checked) {
            admissionCheckboxLabel.classList.remove('error');
            if (admissionCheckboxLabel.nextElementSibling && admissionCheckboxLabel.nextElementSibling.classList.contains('error-message')) {
                admissionCheckboxLabel.nextElementSibling.remove();
            }
        }
    });
});