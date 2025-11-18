document.addEventListener('DOMContentLoaded', function() {
    // Form steps navigation
    const formSteps = document.querySelectorAll('.form-step');
    const stepButtons = document.querySelectorAll('.step');
    const progressBar = document.querySelector('.progress-bar');
    const complaintForm = document.getElementById('complaintForm');
    const topHomeBtn = document.getElementById('top-home-btn');
    const errorSummary = document.getElementById('errorSummary');
    const errorList = document.getElementById('errorList');

    let currentStep = 0;
    let isSubmitting = false;

    // Initialize form
    updateStepProgress();
    setupEventListeners();
    updateTopHomeButton();

    function setupEventListeners() {
        // Next button click handler
        document.querySelectorAll('.next-step').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                if (validateStep(currentStep)) {
                    currentStep++;
                    updateStepProgress();
                    updateTopHomeButton();
                }
            });
        });

        // Previous button click handler
        document.querySelectorAll('.prev-step').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                currentStep--;
                updateStepProgress();
                updateTopHomeButton();
            });
        });

        // Handle respondent type change
        const respondentType = document.getElementById('id_respondent_type');
        if (respondentType) {
            respondentType.addEventListener('change', function() {
                const studentFields = document.querySelector('.student-fields');
                const facultyFields = document.querySelector('.faculty-fields');

                if (this.value === 'student') {
                    studentFields.style.display = 'flex';
                    facultyFields.style.display = 'none';
                } else if (this.value === 'faculty_staff') {
                    studentFields.style.display = 'none';
                    facultyFields.style.display = 'block';
                } else {
                    studentFields.style.display = 'none';
                    facultyFields.style.display = 'none';
                }
            });

            // Trigger change event on page load if value is set
            if (respondentType.value) {
                respondentType.dispatchEvent(new Event('change'));
            }
        }

        document.getElementById('downloadComplaint').addEventListener('click', function(e) {
            e.preventDefault();

            const complaintId = document.getElementById('complaint-id').textContent;
            if (!complaintId) {
                alert('Please submit the complaint first before downloading');
                return;
            }

            // Show loading state
            const btn = this;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating PDF...';
            btn.disabled = true;

            // Call the server-side PDF generation endpoint
            fetch(`/complaint/pdf/${complaintId}/`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to generate PDF');
                }
                return response.blob();
            })
            .then(blob => {
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Complaint_Report_${complaintId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to generate PDF. Please try again.');
            })
            .finally(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        });

        // Form submission handler
        if (complaintForm) {
            complaintForm.addEventListener('submit', function(e) {
                e.preventDefault();

                if (isSubmitting) return;
                isSubmitting = true;

                const formData = new FormData(this);
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerHTML;

                // Clear previous errors
                errorSummary.style.display = 'none';
                errorList.innerHTML = '';
                document.querySelectorAll('.is-invalid').forEach(el => {
                    el.classList.remove('is-invalid');
                });

                // Show loading state
                submitBtn.classList.add('btn-loading');
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Processing...</span>';
                submitBtn.disabled = true;

                fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': formData.get('csrfmiddlewaretoken')
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        currentStep = formSteps.length - 1;
                        updateStepProgress();
                        updateTopHomeButton();

                        if (!IS_EDIT_MODE && data.complaint_id) {
                            document.getElementById('complaint-id').textContent = data.complaint_id;
                        }
                    } else {
                        if (data.errors) {
                            const errors = [];
                            Object.entries(data.errors).forEach(([field, fieldErrors]) => {
                                const input = document.getElementById(`id_${field}`);
                                if (input) {
                                    input.classList.add('is-invalid');
                                    errors.push(fieldErrors[0]);
                                }
                            });

                            // Display all errors
                            errors.forEach(error => {
                                const li = document.createElement('li');
                                li.textContent = error;
                                errorList.appendChild(li);
                            });
                            errorSummary.style.display = 'block';
                            errorSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
                })
                .finally(() => {
                    isSubmitting = false;
                    submitBtn.classList.remove('btn-loading');
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                });
            });
        }

        // File upload preview functionality
        setupFileUploadPreviews();
    }

    function updateTopHomeButton() {
        if (currentStep === formSteps.length - 1) {
            // On success page (last step)
            topHomeBtn.style.display = 'none';
        } else {
            // On all other pages
            topHomeBtn.style.display = 'inline-flex';
        }
    }

    // File upload preview functionality
    function setupFileUploadPreviews() {
        // Handle document uploads
        const documentInput = document.getElementById('documents');
        const documentPreview = document.getElementById('document-preview');
        const documentPreviewList = documentPreview.querySelector('.file-preview-list');

        // Handle image uploads
        const imageInput = document.getElementById('images');
        const imagePreview = document.getElementById('image-preview');
        const imagePreviewList = imagePreview.querySelector('.file-preview-list');

        // Setup for each file type
        setupFileInput(documentInput, documentPreview, documentPreviewList, 'documents');
        setupFileInput(imageInput, imagePreview, imagePreviewList, 'images');

        // Clear all functionality
        document.querySelectorAll('.clear-all').forEach(clearBtn => {
            clearBtn.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                const input = document.getElementById(target);
                const previewContainer = document.getElementById(`${target}-preview`);

                input.value = '';
                previewContainer.querySelector('.file-preview-list').innerHTML = '';
                previewContainer.querySelector('.file-preview-header span:first-child').textContent =
                    `Selected ${target.charAt(0).toUpperCase() + target.slice(1)} (0)`;
                previewContainer.style.display = 'none';
            });
        });
    }

    function setupFileInput(input, previewContainer, previewList, type) {
        input.addEventListener('change', function() {
            const files = Array.from(this.files);

            if (files.length === 0) {
                previewContainer.style.display = 'none';
                return;
            }

            // Update header count
            previewContainer.querySelector('.file-preview-header span:first-child').textContent =
                `Selected ${type.charAt(0).toUpperCase() + type.slice(1)} (${files.length})`;

            // Clear existing previews
            previewList.innerHTML = '';

            // Add each file to preview
            files.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';

                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-preview-info';

                const fileIcon = document.createElement('i');
                fileIcon.className = 'file-preview-icon';

                // Set icon based on file type
                if (type === 'images') {
                    fileIcon.className += ' fas fa-image';
                } else if (type === 'videos') {
                    fileIcon.className += ' fas fa-video';
                } else {
                    // For documents, use more specific icons based on file type
                    const ext = file.name.split('.').pop().toLowerCase();
                    if (['pdf'].includes(ext)) {
                        fileIcon.className += ' fas fa-file-pdf';
                    } else if (['doc', 'docx'].includes(ext)) {
                        fileIcon.className += ' fas fa-file-word';
                    } else if (['xls', 'xlsx'].includes(ext)) {
                        fileIcon.className += ' fas fa-file-excel';
                    } else if (['ppt', 'pptx'].includes(ext)) {
                        fileIcon.className += ' fas fa-file-powerpoint';
                    } else if (['zip', 'rar', '7z'].includes(ext)) {
                        fileIcon.className += ' fas fa-file-archive';
                    } else {
                        fileIcon.className += ' fas fa-file-alt';
                    }
                }

                const fileName = document.createElement('span');
                fileName.className = 'file-preview-name';
                fileName.textContent = file.name;

                const fileSize = document.createElement('span');
                fileSize.className = 'file-preview-size';
                fileSize.textContent = formatFileSize(file.size);

                const removeBtn = document.createElement('i');
                removeBtn.className = 'file-preview-remove fas fa-times';
                removeBtn.addEventListener('click', () => {
                    removeFileFromInput(input, index);
                    fileItem.remove();
                    updatePreviewCount(previewContainer, type, input.files.length);
                    if (input.files.length === 0) {
                        previewContainer.style.display = 'none';
                    }
                });

                fileInfo.appendChild(fileIcon);
                fileInfo.appendChild(fileName);
                fileInfo.appendChild(fileSize);

                fileItem.appendChild(fileInfo);
                fileItem.appendChild(removeBtn);

                previewList.appendChild(fileItem);
            });

            previewContainer.style.display = 'block';
        });
    }

    function removeFileFromInput(input, indexToRemove) {
        const files = Array.from(input.files);
        files.splice(indexToRemove, 1);

        // Create new DataTransfer to hold remaining files
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));

        // Replace input files with new list
        input.files = dataTransfer.files;
    }

    function updatePreviewCount(previewContainer, type, count) {
        previewContainer.querySelector('.file-preview-header span:first-child').textContent =
            `Selected ${type.charAt(0).toUpperCase() + type.slice(1)} (${count})`;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Step validation
    function validateStep(step) {
        let isValid = true;
        const currentFormStep = formSteps[step];

        // Clear previous errors
        errorSummary.style.display = 'none';
        errorList.innerHTML = '';
        currentFormStep.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });

        if (step === formSteps.length - 1) return true;

        const errors = [];

        // Validate required fields
        const inputs = currentFormStep.querySelectorAll('input[required], select[required], textarea[required]');
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
                const label = input.closest('.form-group').querySelector('.form-label').textContent.trim();
                errors.push(`${label} is required`);
            }
        });

        // Step 1 specific validations (Complainant Information)
        if (step === 0) {
            // First name validation (letters only)
            const firstName = document.getElementById('id_complainant_first_name');
            if (firstName && firstName.value && !/^[a-zA-Z\s]+$/.test(firstName.value)) {
                firstName.classList.add('is-invalid');
                errors.push('First name should contain only letters and spaces');
                isValid = false;
            }

            // Last name validation (letters and spaces)
            const lastName = document.getElementById('id_complainant_last_name');
            if (lastName && lastName.value && !/^[a-zA-Z\s]+$/.test(lastName.value)) {
                lastName.classList.add('is-invalid');
                errors.push('Last name should contain only letters and spaces');
                isValid = false;
            }

            // Email validation (must contain @)
            const email = document.getElementById('id_complainant_email');
            if (email && email.value && !email.value.includes('@')) {
                email.classList.add('is-invalid');
                errors.push('Please enter a valid email address');
                isValid = false;
            }

            // Phone validation (numbers only)
            const phone = document.getElementById('id_complainant_phone');
            if (phone && phone.value && !/^\d+$/.test(phone.value)) {
                phone.classList.add('is-invalid');
                errors.push('Phone number should contain only numbers');
                isValid = false;
            }
        }

        // Step 2 specific validations (Respondent Information)
        if (step === 1) {
            const respondentType = document.getElementById('id_respondent_type').value;

            // Validate student fields if respondent is student
            if (respondentType === 'student') {
                const course = document.getElementById('id_respondent_course');
                const year = document.getElementById('id_respondent_year');
                const section = document.getElementById('id_respondent_section');

                if (!course.value) {
                    course.classList.add('is-invalid');
                    errors.push('Course is required');
                    isValid = false;
                }

                if (!year.value) {
                    year.classList.add('is-invalid');
                    errors.push('Year is required');
                    isValid = false;
                }

                if (!section.value) {
                    section.classList.add('is-invalid');
                    errors.push('Section is required');
                    isValid = false;
                }
            }
            // Validate department if respondent is faculty/staff
            else if (respondentType === 'faculty_staff') {
                const department = document.getElementById('id_respondent_department');
                if (!department.value) {
                    department.classList.add('is-invalid');
                    errors.push('Department is required');
                    isValid = false;
                }
            }
        }

        // Step 3 specific validations (Complaint Details)
        if (step === 2) {
            // Incident date cannot be in the future
            const incidentDate = document.getElementById('id_incident_date');
            if (incidentDate && incidentDate.value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const selectedDateParts = incidentDate.value.split('-');
                const selectedDate = new Date(
                    parseInt(selectedDateParts[0]),
                    parseInt(selectedDateParts[1]) - 1,
                    parseInt(selectedDateParts[2])
                );

                if (selectedDate > today) {
                    incidentDate.classList.add('is-invalid');
                    errors.push('Incident date cannot be in the future');
                    isValid = false;
                }
            }
        }


        // Display all errors if any
        if (!isValid) {
            errors.forEach(error => {
                const li = document.createElement('li');
                li.textContent = error;
                errorList.appendChild(li);
            });
            errorSummary.style.display = 'block';

            // Scroll to the error summary
            errorSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        return isValid;
    }

    // Update step progress
    function updateStepProgress() {
        formSteps.forEach(step => {
            step.classList.remove('active');
        });

        formSteps[currentStep].classList.add('active');

        const progressPercentage = (currentStep / (formSteps.length - 2)) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        stepButtons.forEach((step, index) => {
            step.classList.remove('active', 'completed');

            if (index < currentStep && index < formSteps.length - 2) {
                step.classList.add('completed');
            } else if (index === currentStep && index < formSteps.length - 2) {
                step.classList.add('active');
            }
        });

        const prevButtons = document.querySelectorAll('.prev-step');
        const nextButtons = document.querySelectorAll('.next-step');
        const submitButtons = document.querySelectorAll('button[type="submit"]');

        if (currentStep === 0) {
            prevButtons.forEach(btn => btn.disabled = true);
        } else {
            prevButtons.forEach(btn => btn.disabled = false);
        }

        if (currentStep === formSteps.length - 2) {
            nextButtons.forEach(btn => btn.style.display = 'none');
            submitButtons.forEach(btn => btn.style.display = 'inline-block');
        } else if (currentStep === formSteps.length - 1) {
            prevButtons.forEach(btn => btn.style.display = 'none');
            nextButtons.forEach(btn => btn.style.display = 'none');
            submitButtons.forEach(btn => btn.style.display = 'none');
        } else {
            nextButtons.forEach(btn => btn.style.display = 'inline-block');
            submitButtons.forEach(btn => btn.style.display = 'none');
        }
    }
});