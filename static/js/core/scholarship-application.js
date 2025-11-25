document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const form = document.getElementById('scholarshipForm');
    const steps = document.querySelectorAll('.form-step');
    const progressBar = document.querySelector('.progress-bar');
    const stepElements = document.querySelectorAll('.step');
    let currentStep = 0;

    // File validation constants
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];

    // Initialize form steps
    function initializeSteps() {
        steps.forEach((step, index) => {
            if (index === 0) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        updateProgressBar();
    }

    // Update progress bar
    function updateProgressBar() {
        const progress = (currentStep / (steps.length - 1)) * 100;
        progressBar.style.width = `${progress}%`;

        stepElements.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    // Show scholarship info when selected
    function showScholarshipInfo(scholarshipId) {
        const scholarshipSelect = document.getElementById('scholarship');
        const selectedOption = scholarshipSelect.options[scholarshipSelect.selectedIndex];
        const infoDiv = document.getElementById('scholarshipInfo');

        if (scholarshipId) {
            document.getElementById('scholarshipName').textContent = selectedOption.text;
            document.getElementById('scholarshipType').textContent = selectedOption.getAttribute('data-type');
            document.getElementById('scholarshipDescription').textContent = selectedOption.getAttribute('data-description');
            document.getElementById('scholarshipBenefits').textContent = selectedOption.getAttribute('data-benefits');
            document.getElementById('scholarshipRequirements').textContent = selectedOption.getAttribute('data-requirements');

            infoDiv.style.display = 'block';

            // Update review section
            updateReviewSection();
        } else {
            infoDiv.style.display = 'none';
        }
    }

    // Handle file previews and validation
    function setupFilePreviews() {
        const fileInputs = document.querySelectorAll('input[type="file"]');

        fileInputs.forEach(input => {
            const uploadLabel = input.nextElementSibling;

            input.addEventListener('change', function() {
                const previewId = this.id + 'Preview';
                const previewDiv = document.getElementById(previewId);
                const parentCard = this.closest('.document-card') || this.closest('.form-group');

                // Reset validation state
                this.classList.remove('is-invalid');
                if (parentCard) {
                    parentCard.classList.remove('invalid-document');
                }

                // Clear previous error message
                const existingError = parentCard.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }

                if (this.files && this.files.length > 0) {
                    previewDiv.innerHTML = '';
                    let allFilesValid = true;

                    // Validate each file
                    for (let i = 0; i < this.files.length; i++) {
                        const file = this.files[i];
                        const fileItem = document.createElement('div');
                        fileItem.className = 'file-preview-item';

                        // Validate file type
                        const isFileTypeValid = ALLOWED_FILE_TYPES.includes(file.type);

                        // Validate file size
                        const isFileSizeValid = file.size <= MAX_FILE_SIZE;

                        if (!isFileTypeValid || !isFileSizeValid) {
                            allFilesValid = false;
                            fileItem.classList.add('invalid-file');
                        }

                        const fileIcon = document.createElement('i');
                        fileIcon.className = 'file-preview-icon fas ' +
                            (file.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image');

                        const fileDetails = document.createElement('div');
                        fileDetails.className = 'file-preview-details';

                        const fileName = document.createElement('div');
                        fileName.className = 'file-preview-name';
                        fileName.textContent = file.name;

                        const fileSize = document.createElement('div');
                        fileSize.className = 'file-preview-size';
                        fileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;

                        if (!isFileTypeValid || !isFileSizeValid) {
                            const errorText = document.createElement('div');
                            errorText.className = 'file-error-text';

                            if (!isFileTypeValid) {
                                errorText.textContent = 'Invalid file type (PDF, JPG, PNG only)';
                            } else {
                                errorText.textContent = 'File too large (max 5MB)';
                            }

                            fileDetails.appendChild(errorText);
                        }

                        fileDetails.appendChild(fileName);
                        fileDetails.appendChild(fileSize);

                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'file-preview-remove';
                        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                        removeBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fileItem.remove();
                            const dataTransfer = new DataTransfer();
                            for (let j = 0; j < this.files.length; j++) {
                                if (j !== i) {
                                    dataTransfer.items.add(this.files[j]);
                                }
                            }
                            this.files = dataTransfer.files;

                            if (this.files.length === 0) {
                                previewDiv.classList.remove('active');
                                resetUploadLabel(uploadLabel);
                                const event = new Event('change');
                                this.dispatchEvent(event);
                            }
                        });

                        fileItem.appendChild(fileIcon);
                        fileItem.appendChild(fileDetails);
                        fileItem.appendChild(removeBtn);
                        previewDiv.appendChild(fileItem);
                    }

                    if (!allFilesValid) {
                        this.classList.add('is-invalid');
                        if (parentCard) {
                            parentCard.classList.add('invalid-document');
                            const errorMessage = document.createElement('div');
                            errorMessage.className = 'error-message';
                            errorMessage.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please upload valid files (PDF or images, max 5MB)';
                            parentCard.appendChild(errorMessage);
                        }
                    } else {
                        previewDiv.classList.add('active');
                        updateUploadLabel(uploadLabel, true);
                    }

                    if (currentStep === 2) {
                        updateReviewSection();
                    }
                } else {
                    previewDiv.classList.remove('active');
                    resetUploadLabel(uploadLabel);
                }
            });
        });
    }

    // Helper function to update upload label to success state
    function updateUploadLabel(label, success) {
        if (label) {
            if (success) {
                label.classList.add('upload-success');
                const icon = label.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-check-circle';
                }
                label.querySelector('.button-text').textContent = 'File Uploaded';
            } else {
                resetUploadLabel(label);
            }
        }
    }

    // Helper function to reset upload label to default state
    function resetUploadLabel(label) {
        if (label) {
            label.classList.remove('upload-success');
            const icon = label.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-upload';
            }
            let textSpan = label.querySelector('.button-text');
            if (!textSpan) {
                textSpan = document.createElement('span');
                textSpan.className = 'button-text';
                const children = Array.from(label.childNodes).filter(node =>
                    node.nodeType === Node.TEXT_NODE ||
                    (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() !== 'i')
                );
                children.forEach(child => {
                    label.removeChild(child);
                    textSpan.appendChild(child);
                });
                label.appendChild(textSpan);
            }
            textSpan.textContent = textSpan.textContent.trim() || 'Upload File';
        }
    }

    // Update review section with selected values
    function updateReviewSection() {
        const scholarshipSelect = document.getElementById('scholarship');
        if (scholarshipSelect && scholarshipSelect.value) {
            const selectedOption = scholarshipSelect.options[scholarshipSelect.selectedIndex];
            document.getElementById('reviewScholarship').innerHTML = `
                <p><strong>Program:</strong> ${selectedOption.text}</p>
                <p><strong>Type:</strong> ${selectedOption.getAttribute('data-type')}</p>
                <p><strong>Description:</strong> ${selectedOption.getAttribute('data-description')}</p>
            `;
        }

        const documentList = document.getElementById('reviewDocuments');
        if (documentList) {
            const docItems = [
                { id: 'application_form', label: 'Application Form' },
                { id: 'cog', label: 'Certificate of Grades' },
                { id: 'cor', label: 'Certificate of Registration' },
                { id: 'id_photo', label: 'ID Photo' }
            ];

            let docListHTML = '';
            docItems.forEach(doc => {
                const input = document.getElementById(doc.id);
                const status = input && input.files.length > 0 ?
                    `<span class="text-success">Uploaded (${input.files[0].name})</span>` :
                    `<span class="text-danger">Not uploaded</span>`;

                docListHTML += `<li>${doc.label}: ${status}</li>`;
            });

            const otherDocsInput = document.getElementById('other_documents');
            if (otherDocsInput && otherDocsInput.files.length > 0) {
                docListHTML += `<li>Additional Documents: <span class="text-success">${otherDocsInput.files.length} files uploaded</span></li>`;
            }

            documentList.innerHTML = docListHTML;
        }
    }

    // Navigation functions
    function goToStep(step) {
        steps[currentStep].classList.remove('active');
        currentStep = step;
        steps[currentStep].classList.add('active');
        updateProgressBar();

        window.scrollTo({
            top: form.offsetTop - 20,
            behavior: 'smooth'
        });
    }

    function nextStep() {
        if (validateStep(currentStep)) {
            if (currentStep < steps.length - 1) {
                goToStep(currentStep + 1);
            }
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    }

    // Step validation
    function validateStep(step) {
        let isValid = true;
        const currentStepElement = steps[step];
        const requiredFields = currentStepElement.querySelectorAll('[required]');

        currentStepElement.querySelectorAll('.error-message').forEach(el => el.remove());
        currentStepElement.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        currentStepElement.querySelectorAll('.invalid-document').forEach(el => el.classList.remove('invalid-document'));

        requiredFields.forEach(field => {
            const parentCard = field.closest('.document-card') || field.closest('.form-group');

            if (field.type === 'file') {
                if (!field.files || field.files.length === 0) {
                    markFieldInvalid(field, parentCard, 'This document is required');
                    isValid = false;
                } else {
                    for (let i = 0; i < field.files.length; i++) {
                        const file = field.files[i];
                        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                            markFieldInvalid(field, parentCard, 'Invalid file type (PDF, JPG, PNG only)');
                            isValid = false;
                            break;
                        }
                        if (file.size > MAX_FILE_SIZE) {
                            markFieldInvalid(field, parentCard, 'File too large (max 5MB)');
                            isValid = false;
                            break;
                        }
                    }
                }
            } else if (field.type === 'checkbox') {
                if (!field.checked) {
                    markFieldInvalid(field, parentCard, 'You must accept the terms and conditions');
                    isValid = false;
                }
            } else if (!field.value.trim()) {
                markFieldInvalid(field, parentCard, 'This field is required');
                isValid = false;
            }
        });

        if (step === 1) {
            const scholarshipSelect = document.getElementById('scholarship');
            if (!scholarshipSelect.value) {
                markFieldInvalid(scholarshipSelect, scholarshipSelect.closest('.form-group'), 'Please select a scholarship program');
                isValid = false;
            } else {
                const selectedOption = scholarshipSelect.options[scholarshipSelect.selectedIndex];
                if (selectedOption.getAttribute('data-existing') === 'true') {
                    markFieldInvalid(scholarshipSelect, scholarshipSelect.closest('.form-group'), 'You have already applied for this scholarship program');
                    isValid = false;
                }
            }
        }

        if (isValid && step === 2) {
            updateReviewSection();
        }

        return isValid;
    }

    // Helper function to mark fields invalid
    function markFieldInvalid(field, parentElement, message) {
        field.classList.add('is-invalid');

        if (parentElement) {
            parentElement.classList.add('invalid-document');

            if (!parentElement.querySelector('.error-message')) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

                const insertAfter = field.nextElementSibling || field.parentNode.nextElementSibling || parentElement;
                insertAfter.parentNode.insertBefore(errorMessage, insertAfter.nextSibling);
            }
        }
    }

    // Form submission handler
    function handleFormSubmit(e) {
        e.preventDefault();

        let allStepsValid = true;
        for (let i = 0; i < steps.length; i++) {
            if (!validateStep(i)) {
                allStepsValid = false;
                if (i < currentStep) {
                    goToStep(i);
                }
                break;
            }
        }

        if (allStepsValid) {
            const termsCheckbox = document.getElementById('terms');
            if (!termsCheckbox.checked) {
                markFieldInvalid(termsCheckbox, termsCheckbox.closest('.checkbox-wrapper'), 'You must accept the terms and conditions');
                goToStep(3);
                return;
            }

            form.submit();
        }
    }

    // Initialize event listeners
    function setupEventListeners() {
        document.querySelectorAll('.next-step').forEach(button => {
            button.addEventListener('click', nextStep);
        });

        document.querySelectorAll('.prev-step').forEach(button => {
            button.addEventListener('click', prevStep);
        });

        const scholarshipSelect = document.getElementById('scholarship');
        if (scholarshipSelect) {
            scholarshipSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];

                this.classList.remove('is-invalid');
                const errorMessage = this.parentElement.querySelector('.error-message');
                if (errorMessage) {
                    errorMessage.remove();
                }

                if (selectedOption.getAttribute('data-existing') === 'true') {
                    this.classList.add('is-invalid');
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> You have already applied for this scholarship program';
                    this.parentElement.appendChild(errorDiv);

                    document.querySelector('#form-step2 .next-step').disabled = true;
                } else {
                    document.querySelector('#form-step2 .next-step').disabled = false;
                    showScholarshipInfo(this.value);
                }
            });

            if (scholarshipSelect.value) {
                const selectedOption = scholarshipSelect.options[scholarshipSelect.selectedIndex];
                if (selectedOption.getAttribute('data-existing') === 'true') {
                    scholarshipSelect.classList.add('is-invalid');
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> You have already applied for this scholarship program';
                    scholarshipSelect.parentElement.appendChild(errorDiv);
                    document.querySelector('#form-step2 .next-step').disabled = true;
                }
            }
        }

        form.addEventListener('submit', handleFormSubmit);
    }

    // Initialize the form
    initializeSteps();
    setupFilePreviews();
    setupEventListeners();
});