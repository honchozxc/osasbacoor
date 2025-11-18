let allSelectedFiles = [];
let existingImages = [];
let imagesToRemove = [];

// ------------------------------------ Create/Add Announcement Function -----------------------------------------------
let quill;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Quill editor
    quill = new Quill('#quillEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'font': [] }],
                [{ 'align': [] }],
                ['clean'],
                ['link', 'image']
            ]
        },
        placeholder: 'Write your announcement content here...',
        bounds: '#quillEditor'
    });

    // Update hidden input with Quill content before form submission
    document.getElementById('announcementCreateForm').addEventListener('submit', function(e) {
        const contentInput = document.getElementById('id_content');
        contentInput.value = quill.root.innerHTML;

        // Additional validation for Quill content
        const quillContent = quill.getText().trim();
        if (!quillContent) {
            e.preventDefault();
            showFieldError('quillEditor', 'Content is required');
            document.querySelector('.ql-editor').focus();
            return;
        }
    });
});

function toggleAnnouncementFields(category) {
    // Hide all fields except Category
    const fieldsToHide = [
        'id_content', 'id_link', 'id_titles',
        'enrollmentFields', 'eventFields', 'suspensionFields', 'emergencyFields',
        'id_is_published', 'announcementImagesInput', 'quillEditorContainer'
    ];

    fieldsToHide.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.closest('.form-group')?.style.setProperty('display', 'none', 'important');
        }
    });

    // Hide all category-specific fields and make them not required
    document.querySelectorAll('.category-fields').forEach(field => {
        field.style.display = 'none';
        field.querySelectorAll('[required]').forEach(input => {
            input.removeAttribute('required');
        });
    });

    // Show fields for the selected category and make them required
    if (category) {
        // Show Basic Fields
        document.getElementById('id_titles').closest('.form-group').style.display = 'block';
        document.getElementById('id_content').closest('.form-group').style.display = 'block';
        document.getElementById('id_link').closest('.form-group').style.display = 'block';
        document.getElementById('announcementImagesInput').closest('.form-group').style.display = 'block';
        document.getElementById('id_is_published').closest('.form-group').style.display = 'block';

        // Show fields for the selected category and make them required
        if (category === 'ENROLLMENT') {
            document.getElementById('enrollmentFields').style.display = 'block';
            document.getElementById('enrollmentFields').querySelectorAll('input, textarea').forEach(input => {
                if (input.name === 'enrollment_start' || input.name === 'enrollment_end') {
                    input.setAttribute('required', 'required');
                }
            });
        } else if (category === 'EVENT') {
            document.getElementById('eventFields').style.display = 'block';
            document.getElementById('eventFields').querySelectorAll('input, textarea').forEach(input => {
                if (input.name === 'event_date' || input.name === 'location') {
                    input.setAttribute('required', 'required');
                }
            });
        } else if (category === 'SUSPENSION') {
            document.getElementById('suspensionFields').style.display = 'block';
            document.getElementById('suspensionFields').querySelectorAll('input, textarea').forEach(input => {
                if (input.name === 'suspension_date') {
                    input.setAttribute('required', 'required');
                }
            });
        } else if (category === 'EMERGENCY') {
            document.getElementById('emergencyFields').style.display = 'block';
            document.getElementById('emergencyFields').querySelectorAll('input, textarea').forEach(input => {
                if (input.name === 'contact_info') {
                    input.setAttribute('required', 'required');
                }
            });
        } else if (category === 'SCHOLARSHIP') {
        document.getElementById('scholarshipFields').style.display = 'block';
        //document.getElementById('id_application_start').setAttribute('required', 'required');
        //document.getElementById('id_application_end').setAttribute('required', 'required');

        // Scholarship select change handler
        const scholarshipSelect = document.getElementById('id_scholarship');
        scholarshipSelect.addEventListener('change', function() {
            const requirements = document.getElementById('id_requirements');
            const benefits = document.getElementById('id_benefits');

            if (this.value) {
                requirements.removeAttribute('required');
                benefits.removeAttribute('required');
            } else {
                requirements.setAttribute('required', 'required');
                benefits.setAttribute('required', 'required');
            }
        });
    } else if (category === 'BASIC') {
            // Already show basic/default Fields
        }
    }
}

function openAnnouncementCreateModal() {
    const modal = document.getElementById('announcementCreateModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setupCourseSelection();

    // Hide all fields except Category
    toggleAnnouncementFields(null);
}

function toggleAllCourses() {
    const checkboxes = document.querySelectorAll('input[name="courses"]');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);

    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
}

function closeAnnouncementCreateModal() {
    const modal = document.getElementById('announcementCreateModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form
    document.getElementById('announcementCreateForm').reset();
    document.getElementById('announcementFormResponse').innerHTML = '';
    document.getElementById('imagePreviews').innerHTML = '';
    document.getElementById('announcementImagesNameDisplay').textContent = 'No images selected';

    // Reset the global files array
    allSelectedFiles = [];

    // Hide all category fields
    document.querySelectorAll('.category-fields').forEach(field => {
        field.style.display = 'none';
    });
}

// Handle image selection for announcements
document.getElementById('announcementImagesInput').addEventListener('change', function(e) {
    const newFiles = Array.from(e.target.files);
    const previewContainer = document.getElementById('imagePreviews');
    const nameDisplay = document.getElementById('announcementImagesNameDisplay');

    if (allSelectedFiles.length + newFiles.length > 30) {
        const message = `You can upload a maximum of 30 images. You already have ${allSelectedFiles.length} selected.`;
        showErrorToast(message);
        this.value = '';
        return;
    }

    for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];

        if (!file.type.match('image.*')) {
            const message = `File "${file.name}" is not an image. Only image files are allowed.`;
            showErrorToast(message);
            continue;
        }

        if (file.size > 2 * 1024 * 1024) {
            const message = `Image "${file.name}" is too large (max 2MB)`;
            showErrorToast(message);
            continue;
        }

        allSelectedFiles.push(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.dataset.index = allSelectedFiles.length - 1;
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <span class="image-name">${file.name}</span>
                <button type="button" class="remove-image" onclick="removeAnnouncementImage(this, ${allSelectedFiles.length - 1})">&times;</button>
            `;
            previewContainer.appendChild(preview);
            updateImageCountDisplay();
        };
        reader.readAsDataURL(file);
    }

    this.value = '';
});

function updateFileInput() {
    const dataTransfer = new DataTransfer();
    allSelectedFiles.forEach(file => dataTransfer.items.add(file));

    const fileInput = document.getElementById('announcementImagesInput');
    fileInput.files = dataTransfer.files;
}

function removeAnnouncementImage(button, index) {
    allSelectedFiles.splice(index, 1);
    updateFileInput();
    button.closest('.image-preview').remove();
    reassignPreviewIndices();
}

function reassignPreviewIndices() {
    const previews = document.querySelectorAll('#imagePreviews .image-preview');
    previews.forEach((preview, newIndex) => {
        preview.dataset.index = newIndex;
        const removeButton = preview.querySelector('.remove-image');
        removeButton.onclick = () => removeAnnouncementImage(removeButton, newIndex);
    });
}

function rebuildImagePreviews() {
    return new Promise((resolve) => {
        const previewContainer = document.getElementById('imagePreviews');
        previewContainer.innerHTML = '';

        if (allSelectedFiles.length === 0) {
            resolve();
            return;
        }

        let loadedCount = 0;

        allSelectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.dataset.index = index;
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <span class="image-name">${file.name}</span>
                    <button type="button" class="remove-image" onclick="removeAnnouncementImage(this, ${index})">&times;</button>
                `;
                previewContainer.appendChild(preview);

                loadedCount++;
                if (loadedCount === allSelectedFiles.length) {
                    resolve();
                }
            };
            reader.readAsDataURL(file);
        });
    });
}

function closeAnnouncementCreateModal() {
    const modal = document.getElementById('announcementCreateModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form
    document.getElementById('announcementCreateForm').reset();
    document.getElementById('announcementFormResponse').innerHTML = '';
    document.getElementById('imagePreviews').innerHTML = '';

    // Reset the global files array
    allSelectedFiles = [];

    // Hide all category fields
    document.querySelectorAll('.category-fields').forEach(field => {
        field.style.display = 'none';
    });
}


document.getElementById('announcementCreateForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const form = this;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('announcementFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Validate category-specific fields
    const category = document.getElementById('id_category').value;
    let isValid = true;

    function showFieldError(fieldId, message) {
        let field;
        if (fieldId === 'quillEditor') {
            field = document.querySelector('.ql-editor');
        } else {
            field = document.getElementById(fieldId);
        }

        if (field) {
            field.classList.add('error');
            // Remove existing error message if any
            const existingError = field.closest('.form-group').querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }

            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;

            if (fieldId === 'quillEditor') {
                document.querySelector('.ql-toolbar').after(errorElement);
            } else {
                field.closest('.form-group').appendChild(errorElement);
            }
        }
        isValid = false;
    }

    function validateDateRange(startFieldId, endFieldId, errorMessage) {
        const startField = document.getElementById(startFieldId);
        const endField = document.getElementById(endFieldId);
        const startValue = startField.value;
        const endValue = endField.value;

        // Clear previous errors
        startField.classList.remove('error');
        endField.classList.remove('error');
        document.querySelectorAll(`#${startFieldId} ~ .error-message, #${endFieldId} ~ .error-message`).forEach(el => el.remove());

        // Check if fields are empty
        if (!startValue || !endValue) {
            if (!startValue) showFieldError(startFieldId, 'This field is required');
            if (!endValue) showFieldError(endFieldId, 'This field is required');
            return false;
        }

        // Parse dates
        const startDate = new Date(startValue);
        const endDate = new Date(endValue);

        // Validate date range
        if (startDate >= endDate) {
            showFieldError(startFieldId, errorMessage);
            showFieldError(endFieldId, errorMessage);
            return false;
        }

        return true;
    }

    if (category === 'ENROLLMENT') {
        const courseCheckboxes = document.querySelectorAll('input[name="courses"]:checked');
        const courses = Array.from(courseCheckboxes).map(cb => cb.value);

        if (courses.length === 0) {
            showFieldError('id_enrollment_start', 'Please select at least one course');
            isValid = false;
        } else if (courses.includes('ALL') && courses.length > 1) {
            showFieldError('id_enrollment_start', 'You cannot select "All Courses" with other courses');
            isValid = false;
        }

        // Validate enrollment dates
        if (!validateDateRange(
            'id_enrollment_start',
            'id_enrollment_end',
            'Enrollment end date must be after start date'
        )) {
            isValid = false;
        }
    }
    else if (category === 'EVENT') {
        const eventDate = document.getElementById('id_event_date').value;
        const location = document.getElementById('id_location').value;

        if (!eventDate) showFieldError('id_event_date', 'Event date is required');
        if (!location) showFieldError('id_location', 'Location is required');
        if (!eventDate || !location) isValid = false;

        // Additional check if event date is in the past
        if (eventDate) {
            const now = new Date();
            const selectedDate = new Date(eventDate);
            if (selectedDate < now) {
                showFieldError('id_event_date', 'Event date cannot be in the past');
                isValid = false;
            }
        }
    }
    else if (category === 'SUSPENSION') {
        const suspensionDate = document.getElementById('id_suspension_date').value;
        const untilDate = document.getElementById('id_until_suspension_date').value;

        if (!suspensionDate) {
            showFieldError('id_suspension_date', 'Suspension date is required');
            isValid = false;
        }

        if (untilDate) {
            if (!suspensionDate) {
                showFieldError('id_until_suspension_date', 'Please set suspension date first');
                isValid = false;
            } else {
                const suspensionDateObj = new Date(suspensionDate);
                const untilDateObj = new Date(untilDate);

                if (suspensionDateObj > untilDateObj) {
                    showFieldError('id_until_suspension_date', 'Until date must be after suspension date');
                    isValid = false;
                }
            }
        }
    }
    else if (category === 'SCHOLARSHIP') {
        const scholarship = document.getElementById('id_scholarship').value;
        const requirements = document.getElementById('id_requirements').value;
        const benefits = document.getElementById('id_benefits').value;
        const appStart = document.getElementById('id_application_start').value;
        const appEnd = document.getElementById('id_application_end').value;

        // Only validate dates if they're provided
        if (appStart || appEnd) {
            if (!appStart) {
                showFieldError('id_application_start', 'Please provide both start and end dates');
                isValid = false;
            } else if (!appEnd) {
                showFieldError('id_application_end', 'Please provide both start and end dates');
                isValid = false;
            } else {
                // Validate date range only if both dates are provided
                const startDate = new Date(appStart);
                const endDate = new Date(appEnd);

                if (startDate >= endDate) {
                    showFieldError('id_application_start', 'Application end date must be after start date');
                    showFieldError('id_application_end', 'Application end date must be after start date');
                    isValid = false;
                }

                if (startDate < new Date()) {
                    showFieldError('id_application_start', 'Application period cannot start in the past');
                    isValid = false;
                }
            }
        }

        if (!scholarship && (!requirements || !benefits)) {
            if (!requirements) showFieldError('id_requirements', 'Requirements are required when no scholarship is selected');
            if (!benefits) showFieldError('id_benefits', 'Benefits are required when no scholarship is selected');
            isValid = false;
        }
    }

    // Basic validation for all announcements
    const title = document.getElementById('id_titles').value;
    const quillContent = quill.getText().trim();
    const quillHtmlContent = quill.root.innerHTML;

    if (!title) {
        showFieldError('id_titles', 'Title is required');
        isValid = false;
    }

    if (!quillContent) {
        showFieldError('quillEditor', 'Content is required');
        isValid = false;
    } else {
        // Update hidden input with Quill content
        document.getElementById('id_content').value = quillHtmlContent;
    }

    if (!isValid) {
        submitBtn.classList.remove('is-loading');

        // Scroll to the first error
        const firstError = document.querySelector('.error-message');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return;
    }


    // Proceed with form submission if validation passes
    const formData = new FormData(form);
    allSelectedFiles.forEach((file, index) => {
        formData.append('images', file);
    });

    // Manually add course selections to formData
    const courseCheckboxes = document.querySelectorAll('input[name="courses"]:checked');
    courseCheckboxes.forEach(checkbox => {
        formData.append('courses', checkbox.value);
    });

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (response.status === 400) {
            // This handles Django's form validation errors
            return response.json().then(data => {
                if (data.errors) {
                    // If the response has errors field, use that
                    throw { errors: data.errors, message: data.message || 'Please correct the errors below' };
                } else {
                    // If the response is the form errors directly
                    throw { errors: data, message: 'Please correct the errors below' };
                }
            });
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast('Announcement created successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Announcement created successfully! This window will close shortly...
                </div>
            `;
            setTimeout(() => {
                closeAnnouncementCreateModal();
                window.location.reload();
            }, 1500);
        } else {
            throw new Error(data.message || 'Failed to create announcement');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.errors) {
            showFormErrors(form, error.errors);
            if (error.message) {
                showErrorToast(error.message);
            }
        } else {
            showErrorToast(error.message || 'An unexpected error occurred');
            formResponse.innerHTML = `
                <div class="response-message response-error">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    ${error.message || 'An unexpected error occurred'}
                </div>
            `;
        }
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

function showFormErrors(form, errors) {
    // Clear previous errors
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Display new errors
    for (const fieldName in errors) {
        // Handle both field names and field IDs
        let field;
        if (fieldName.startsWith('id_')) {
            field = document.getElementById(fieldName);
        } else {
            field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) {
                // Try with id_ prefix if not found
                field = document.getElementById(`id_${fieldName}`);
            }
        }

        if (field) {
            field.classList.add('error');
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';

            // Handle array errors (join them with commas)
            const errorMessages = Array.isArray(errors[fieldName]) ?
                errors[fieldName].join(', ') :
                errors[fieldName];

            errorElement.textContent = errorMessages;

            // Find the appropriate container for the error message
            const container = field.closest('.form-group') || field.closest('.form-row') || field.parentElement;
            container.appendChild(errorElement);
        }
    }

    // Scroll to the first error
    const firstError = document.querySelector('.error-message');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Handle course selection logic
    const courseCheckboxes = document.querySelectorAll('input[name="courses"]');
    const allCoursesCheckbox = document.querySelector('input[name="courses"][value="ALL"]');

    if (allCoursesCheckbox) {
        allCoursesCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Uncheck all other boxes when "All Courses" is selected
                courseCheckboxes.forEach(checkbox => {
                    if (checkbox.value !== 'ALL') {
                        checkbox.checked = false;
                    }
                });
            }
        });
    }
});

// Add this to your existing JavaScript
document.getElementById('id_scholarship').addEventListener('change', function() {
    const scholarshipId = this.value;
    const requirementsField = document.getElementById('id_requirements');
    const benefitsField = document.getElementById('id_benefits');

    if (scholarshipId) {
        // Show loading state
        requirementsField.value = "Loading...";
        benefitsField.value = "Loading...";

        fetch(`/api/scholarships/${scholarshipId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.scholarship) {
                    requirementsField.value = data.scholarship.requirements || '';
                    benefitsField.value = data.scholarship.benefits || '';
                } else {
                    requirementsField.value = '';
                    benefitsField.value = '';
                    showErrorToast('Failed to load scholarship details');
                }
            })
            .catch(error => {
                console.error('Error fetching scholarship details:', error);
                requirementsField.value = '';
                benefitsField.value = '';
                showErrorToast('Error loading scholarship details');
            });
    } else {
        // Clear fields if no scholarship selected
        requirementsField.value = '';
        benefitsField.value = '';
    }
});

// Add this to your DOMContentLoaded or initialization code
document.addEventListener('DOMContentLoaded', function() {
    // Real-time validation for date ranges
    const datePairs = [
        { start: 'id_enrollment_start', end: 'id_enrollment_end', message: 'Enrollment end date must be after start date' },
        { start: 'id_application_start', end: 'id_application_end', message: 'Application end date must be after start date' }
    ];

    datePairs.forEach(pair => {
        const startField = document.getElementById(pair.start);
        const endField = document.getElementById(pair.end);

        if (startField && endField) {
            startField.addEventListener('change', () => validateDateRange(pair.start, pair.end, pair.message));
            endField.addEventListener('change', () => validateDateRange(pair.start, pair.end, pair.message));
        }
    });

    // Validate event date not in past
    const eventDateField = document.getElementById('id_event_date');
    if (eventDateField) {
        eventDateField.addEventListener('change', function() {
            const field = this;
            const value = field.value;
            field.classList.remove('error');
            const errorElement = field.closest('.form-group').querySelector('.error-message');
            if (errorElement) errorElement.remove();

            if (value) {
                const now = new Date();
                const selectedDate = new Date(value);
                if (selectedDate < now) {
                    showFieldError('id_event_date', 'Event date cannot be in the past');
                }
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Real-time validation for date ranges
    function setupDateValidation(startId, endId, errorMessage) {
        const startField = document.getElementById(startId);
        const endField = document.getElementById(endId);

        if (startField && endField) {
            const validate = () => {
                const startValue = startField.value;
                const endValue = endField.value;

                // Clear errors
                startField.classList.remove('error');
                endField.classList.remove('error');
                document.querySelectorAll(`#${startId} ~ .error-message, #${endId} ~ .error-message`).forEach(el => el.remove());

                // Only validate if both dates are provided
                if (startValue && endValue) {
                    const startDate = new Date(startValue);
                    const endDate = new Date(endValue);

                    if (startDate >= endDate) {
                        const errorElement = document.createElement('div');
                        errorElement.className = 'error-message';
                        errorElement.textContent = errorMessage;

                        startField.classList.add('error');
                        endField.classList.add('error');

                        const startContainer = startField.closest('.form-group') || startField.parentElement;
                        const endContainer = endField.closest('.form-group') || endField.parentElement;

                        startContainer.appendChild(errorElement.cloneNode(true));
                        endContainer.appendChild(errorElement);
                    }
                }
            };

            startField.addEventListener('change', validate);
            endField.addEventListener('change', validate);
        }
    }

    // Set up validation for all date pairs
    setupDateValidation('id_enrollment_start', 'id_enrollment_end', 'End date must be after start date');
    setupDateValidation('id_application_start', 'id_application_end', 'End date must be after start date');

    // Validate event date not in past
    const eventDateField = document.getElementById('id_event_date');
    if (eventDateField) {
        eventDateField.addEventListener('change', function() {
            const value = this.value;
            this.classList.remove('error');
            const errorElement = this.closest('.form-group').querySelector('.error-message');
            if (errorElement) errorElement.remove();

            if (value) {
                const now = new Date();
                const selectedDate = new Date(value);
                if (selectedDate < now) {
                    this.classList.add('error');
                    const errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    errorElement.textContent = 'Event date cannot be in the past';
                    this.closest('.form-group').appendChild(errorElement);
                }
            }
        });
    }
});

// -------------------------------------------- View Announcemnent Function --------------------------------------------
function viewAnnouncement(announcementId) {
    fetch(`/announcements/${announcementId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
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
            const announcement = data.announcement;
            const modal = document.getElementById('announcementViewModal');

            // Basic info
            document.getElementById('viewAnnouncementTitle').textContent = announcement.title;
            document.getElementById('viewAnnouncementCategory').textContent = announcement.category;
            document.getElementById('viewAnnouncementCategory').className = `announcement-category ${announcement.category_value.toLowerCase()}`;
            document.getElementById('viewAnnouncementDate').textContent = formatDate(announcement.created_at);
            document.getElementById('viewAnnouncementAuthor').textContent = `By ${announcement.author_name}`;
            document.getElementById('viewAnnouncementStatus').textContent = announcement.is_published ? 'Published' : 'Draft';
            document.getElementById('viewAnnouncementStatus').className = announcement.is_published ? 'status-badge active' : 'status-badge inactive';

            // Content
            document.getElementById('viewAnnouncementContent').innerHTML = announcement.content.replace(/\n/g, '<br>');

            // Link
            const linkContainer = document.getElementById('viewAnnouncementLinkContainer');
            const linkElement = document.getElementById('viewAnnouncementLink');
            if (announcement.link) {
                linkElement.href = announcement.link;
                linkElement.textContent = announcement.link;
                linkContainer.style.display = 'block';
            } else {
                linkContainer.style.display = 'none';
            }

            // Hide all category details first
            document.querySelectorAll('.category-details').forEach(field => {
                field.style.display = 'none';
            });

            // Show appropriate category details
            switch(announcement.category_value) {
                case 'ENROLLMENT':
                    document.getElementById('viewEnrollmentFields').style.display = 'block';
                    document.getElementById('viewAnnouncementCourses').textContent =
                        announcement.courses && announcement.courses.length > 0 ?
                        announcement.courses.join(', ') : 'Not specified';
                    document.getElementById('viewAnnouncementEnrollmentPeriod').textContent =
                        `${formatDateTime(announcement.enrollment_start)} to ${formatDateTime(announcement.enrollment_end)}`;
                    break;
                case 'EVENT':
                    document.getElementById('viewEventFields').style.display = 'block';
                    document.getElementById('viewAnnouncementEventDate').textContent =
                        formatDateTime(announcement.event_date);
                    document.getElementById('viewAnnouncementLocation').textContent =
                        announcement.location || 'Not specified';
                    break;
                case 'SUSPENSION':
                    document.getElementById('viewSuspensionFields').style.display = 'block';
                    document.getElementById('viewAnnouncementSuspensionDate').textContent =
                        formatDate(announcement.suspension_date);
                    document.getElementById('viewAnnouncementUntilDate').textContent =
                        announcement.until_suspension_date ? formatDate(announcement.until_suspension_date) : 'Not specified';
                    break;
                case 'EMERGENCY':
                    document.getElementById('viewEmergencyFields').style.display = 'block';
                    document.getElementById('viewAnnouncementContactInfo').textContent =
                        announcement.contact_info || 'Not specified';
                    break;
                case 'SCHOLARSHIP':
                    document.getElementById('viewScholarshipFields').style.display = 'block';

                    // Scholarship program
                    const scholarshipName = announcement.scholarship?.name || 'Custom Scholarship';
                    document.getElementById('viewAnnouncementScholarship').textContent = scholarshipName;

                    // Application period
                    document.getElementById('viewAnnouncementApplicationPeriod').textContent =
                        `${formatDateTime(announcement.application_start)} to ${formatDateTime(announcement.application_end)}`;

                    // Requirements and benefits
                    document.getElementById('viewAnnouncementRequirements').textContent =
                        announcement.requirements || 'Not specified';
                    document.getElementById('viewAnnouncementBenefits').textContent =
                        announcement.benefits || 'Not specified';
                    break;
            }

            // Images
            const imagesContainer = document.getElementById('viewAnnouncementImages');
            const gallery = document.getElementById('announcementImageGallery');
            gallery.innerHTML = '';

            if (announcement.images && announcement.images.length > 0) {
                gallery.innerHTML = '';

                const firstImage = announcement.images[0];
                const imgElement = document.createElement('div');
                imgElement.className = 'gallery-item' + (announcement.images.length > 1 ? ' stack' : '');

                imgElement.innerHTML = `
                    <img src="${firstImage.url}" alt="Announcement Image" class="gallery-image">
                    ${firstImage.caption ? `<div class="image-caption">${firstImage.caption}</div>` : ''}
                    ${announcement.images.length > 1 ? `<div class="image-count-badge">+${announcement.images.length - 1}</div>` : ''}
                `;

                imgElement.addEventListener('click', () => {
                    openLightbox(announcement.images, 0);
                });

                gallery.appendChild(imgElement);
                imagesContainer.style.display = 'block';
            } else {
                imagesContainer.style.display = 'none';
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            showErrorToast('Failed to load announcement details: ' + (data.error || 'Unknown error'));
            console.error('Failed to fetch announcement details:', data.error);
        }
    })
    .catch(error => {
        showErrorToast('Failed to load announcement details. Please try again.');
        console.error('Error fetching announcement details:', error);
    });
}

function openLightbox(images, startIndex) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-container">
            <img src="${images[startIndex].url}" class="lightbox-image">
            ${images[startIndex].caption ? `<div class="lightbox-caption">${images[startIndex].caption}</div>` : ''}
            <div class="lightbox-nav">
                <button class="lightbox-prev">&larr;</button>
                <button class="lightbox-next">&rarr;</button>
            </div>
            <button class="lightbox-close">&times;</button>
            <div class="lightbox-counter">${startIndex + 1} / ${images.length}</div>
        </div>
    `;

    document.body.appendChild(lightbox);

    setTimeout(() => lightbox.classList.add('active'), 10);

    let currentIndex = startIndex;

    function updateImage(index) {
        if (index < 0) index = images.length - 1;
        if (index >= images.length) index = 0;

        currentIndex = index;
        const container = lightbox.querySelector('.lightbox-container');
        container.innerHTML = `
            <img src="${images[currentIndex].url}" class="lightbox-image">
            ${images[currentIndex].caption ? `<div class="lightbox-caption">${images[currentIndex].caption}</div>` : ''}
            <div class="lightbox-nav">
                <button class="lightbox-prev">&larr;</button>
                <button class="lightbox-next">&rarr;</button>
            </div>
            <button class="lightbox-close">&times;</button>
            <div class="lightbox-counter">${currentIndex + 1} / ${images.length}</div>
        `;

        lightbox.querySelector('.lightbox-prev').addEventListener('click', () => updateImage(currentIndex - 1));
        lightbox.querySelector('.lightbox-next').addEventListener('click', () => updateImage(currentIndex + 1));
        lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    }

    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => updateImage(currentIndex - 1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => updateImage(currentIndex + 1));
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyDown);

    function handleKeyDown(e) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') updateImage(currentIndex - 1);
        if (e.key === 'ArrowRight') updateImage(currentIndex + 1);
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(lightbox);
            document.removeEventListener('keydown', handleKeyDown);
        }, 300);
    }
}

function closeAnnouncementViewModal() {
    const modal = document.getElementById('announcementViewModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format date with time
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'Not specified';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ------------------------------------------ Edit Announcement Function -----------------------------------------------
function editAnnouncement(announcementId) {
    fetch(`/announcements/${announcementId}/edit/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
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
            const announcement = data.announcement;
            const modal = document.getElementById('announcementEditModal');

            // Initialize Quill editor with enhanced controls if not already done
            if (!window.quillEdit) {
                const toolbarOptions = [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
                    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
                    [{ 'direction': 'rtl' }],                         // text direction
                    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    ['link', 'image', 'video'],
                    ['clean']                                         // remove formatting button
                ];

                window.quillEdit = new Quill('#quillEditEditor', {
                    theme: 'snow',
                    modules: {
                        toolbar: toolbarOptions
                    },
                    placeholder: 'Write your announcement content here...',
                    bounds: '#quillEditEditor'
                });

                // Handle image uploads in Quill
                window.quillEdit.getModule('toolbar').addHandler('image', function() {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();

                    input.onchange = async function() {
                        const file = input.files[0];
                        if (!file) return;

                        if (file.size > 2 * 1024 * 1024) {
                            showErrorToast('Image size exceeds 2MB limit');
                            return;
                        }

                        try {
                            // You would typically upload the image to your server here
                            // For now we'll create a data URL
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                const range = window.quillEdit.getSelection();
                                window.quillEdit.insertEmbed(range.index, 'image', e.target.result);
                            };
                            reader.readAsDataURL(file);
                        } catch (error) {
                            showErrorToast('Error uploading image');
                            console.error('Image upload error:', error);
                        }
                    };
                });

                // Set up form submission handler for Quill content
                document.getElementById('announcementEditForm').addEventListener('submit', function(e) {
                    const content = window.quillEdit.root.innerHTML;
                    // Sanitize content if needed (you might want to use DOMPurify here)
                    document.getElementById('edit_content').value = content;
                });

                // Add word counter
                const editorContainer = document.querySelector('#quillEditEditor').parentElement;
                const wordCounter = document.createElement('div');
                wordCounter.className = 'word-counter';
                wordCounter.textContent = '0 words';
                editorContainer.appendChild(wordCounter);

                // Update word count on text change
                window.quillEdit.on('text-change', function() {
                    const text = window.quillEdit.getText().trim();
                    const wordCount = text ? text.split(/\s+/).length : 0;
                    wordCounter.textContent = `${wordCount} words`;
                });
            }

            // Reset global image arrays
            allSelectedFiles = [];
            existingImages = [];
            imagesToRemove = [];

            // Set form action URL
            document.getElementById('announcementEditForm').action = `/announcements/${announcementId}/edit/`;
            document.getElementById('editAnnouncementId').value = announcementId;

            // Basic info
            document.getElementById('edit_category').value = announcement.category;
            document.getElementById('edit_title').value = announcement.title;

            // Set Quill editor content instead of textarea
            if (window.quillEdit && announcement.content) {
                window.quillEdit.root.innerHTML = announcement.content;
                // Trigger word count update
                const event = new Event('text-change');
                window.quillEdit.root.dispatchEvent(event);
            }

            document.getElementById('edit_link').value = announcement.link || '';
            document.getElementById('edit_is_published').checked = announcement.is_published;

            toggleEditAnnouncementFields(announcement.category);

            if (announcement.category === 'ENROLLMENT') {
                // Set courses
                const courses = announcement.courses || [];
                document.querySelectorAll('#editCoursesContainer input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = courses.includes(checkbox.value);
                });

                if (announcement.enrollment_start) {
                    document.getElementById('edit_enrollment_start').value = formatDateTimeForInput(announcement.enrollment_start);
                }
                if (announcement.enrollment_end) {
                    document.getElementById('edit_enrollment_end').value = formatDateTimeForInput(announcement.enrollment_end);
                }
            } else if (announcement.category === 'EVENT') {
                if (announcement.event_date) {
                    document.getElementById('edit_event_date').value = formatDateTimeForInput(announcement.event_date);
                }
                document.getElementById('edit_location').value = announcement.location || '';
            } else if (announcement.category === 'SUSPENSION') {
                if (announcement.suspension_date) {
                    document.getElementById('edit_suspension_date').value = formatDateForInput(announcement.suspension_date);
                }
                if (announcement.until_suspension_date) {
                    document.getElementById('edit_until_suspension_date').value = formatDateForInput(announcement.until_suspension_date);
                }
            } else if (announcement.category === 'EMERGENCY') {
                document.getElementById('edit_contact_info').value = announcement.contact_info || '';
            } else if (announcement.category === 'SCHOLARSHIP') {
                // Set scholarship fields
                if (announcement.scholarship) {
                    document.getElementById('edit_scholarship').value = announcement.scholarship;
                }
                if (announcement.application_start) {
                    document.getElementById('edit_application_start').value = formatDateTimeForInput(announcement.application_start);
                }
                if (announcement.application_end) {
                    document.getElementById('edit_application_end').value = formatDateTimeForInput(announcement.application_end);
                }
                document.getElementById('edit_requirements').value = announcement.requirements || '';
                document.getElementById('edit_benefits').value = announcement.benefits || '';
            }

            // Handle images
            const imagesContainer = document.getElementById('editImagePreviews');
            imagesContainer.innerHTML = '';

            if (announcement.images && announcement.images.length > 0) {
                existingImages = announcement.images;
                announcement.images.forEach((image, index) => {
                    const preview = document.createElement('div');
                    preview.className = 'image-preview';
                    preview.dataset.index = index;
                    preview.dataset.imageId = image.id;
                    preview.innerHTML = `
                        <img src="${image.url}" alt="Preview">
                        <span class="image-name">${image.filename}</span>
                        <button type="button" class="remove-image" onclick="removeAnnouncementImage(this, ${index}, true)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    `;
                    imagesContainer.appendChild(preview);
                });
            }

            updateEditImageCountDisplay();

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            showErrorToast('Failed to load announcement details: ' + (data.error || 'Unknown error'));
            console.error('Failed to fetch announcement details:', data.error);
        }

        const scholarshipSelect = document.getElementById('edit_scholarship');
        if (scholarshipSelect) {
            scholarshipSelect.addEventListener('change', function() {
                const requirements = document.getElementById('edit_requirements');
                const benefits = document.getElementById('edit_benefits');

                if (this.value) {
                    fetch(`/announcements/${announcementId}/edit/?get_scholarship=true&scholarship_id=${this.value}`, {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            requirements.value = data.requirements;
                            benefits.value = data.benefits;
                            requirements.removeAttribute('required');
                            benefits.removeAttribute('required');
                        }
                    });
                }
            });
        }
    })
    .catch(error => {
        showErrorToast('Failed to load announcement details. Please try again.');
        console.error('Error fetching announcement details:', error);
    });
}

// Update the toggle function to include scholarship fields
function toggleEditAnnouncementFields(category) {
    document.querySelectorAll('.category-fields').forEach(field => {
        field.style.display = 'none';
        field.querySelectorAll('[required]').forEach(input => {
            input.removeAttribute('required');
        });
    });

    if (category === 'ENROLLMENT') {
        document.getElementById('editEnrollmentFields').style.display = 'block';
        document.getElementById('editEnrollmentFields').querySelectorAll('input, textarea').forEach(input => {
            if (input.name === 'enrollment_start' || input.name === 'enrollment_end') {
                input.setAttribute('required', 'required');
            }
        });
    } else if (category === 'EVENT') {
        document.getElementById('editEventFields').style.display = 'block';
        document.getElementById('editEventFields').querySelectorAll('input, textarea').forEach(input => {
            if (input.name === 'event_date' || input.name === 'location') {
                input.setAttribute('required', 'required');
            }
        });
    } else if (category === 'SUSPENSION') {
        document.getElementById('editSuspensionFields').style.display = 'block';
        document.getElementById('editSuspensionFields').querySelectorAll('input, textarea').forEach(input => {
            if (input.name === 'suspension_date') {
                input.setAttribute('required', 'required');
            }
        });
    } else if (category === 'EMERGENCY') {
        document.getElementById('editEmergencyFields').style.display = 'block';
        document.getElementById('editEmergencyFields').querySelectorAll('input, textarea').forEach(input => {
            if (input.name === 'contact_info') {
                input.setAttribute('required', 'required');
            }
        });
    } else if (category === 'SCHOLARSHIP') {
        document.getElementById('editScholarshipFields').style.display = 'block';

        // Handle scholarship select change
        const scholarshipSelect = document.getElementById('edit_scholarship');
        scholarshipSelect.addEventListener('change', function() {
            const requirements = document.getElementById('edit_requirements');
            const benefits = document.getElementById('edit_benefits');

            if (this.value) {
                // Fetch scholarship details
                fetch(`/announcements/${document.getElementById('editAnnouncementId').value}/edit/?get_scholarship=true&scholarship_id=${this.value}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        requirements.value = data.requirements;
                        benefits.value = data.benefits;
                        requirements.removeAttribute('required');
                        benefits.removeAttribute('required');
                    } else {
                        showErrorToast('Failed to load scholarship details: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Error fetching scholarship details:', error);
                    showErrorToast('Failed to load scholarship details. Please try again.');
                });
            } else {
                requirements.value = '';
                benefits.value = '';
                requirements.setAttribute('required', 'required');
                benefits.setAttribute('required', 'required');
            }
        });
    }
}

function updateEditImageCount(input) {
    const newFiles = Array.from(input.files);
    const previewContainer = document.getElementById('editImagePreviews');

    const remainingExistingImages = existingImages.length - imagesToRemove.length;
    const totalImages = remainingExistingImages + allSelectedFiles.length + newFiles.length;

    if (totalImages > 30) {
        const message = `You can upload a maximum of 30 images. You already have ${remainingExistingImages + allSelectedFiles.length} selected.`;
        showErrorToast(message);
        input.value = '';
        return;
    }

    // Validate each new file
    for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];

        if (!file.type.match('image.*')) {
            const message = `File "${file.name}" is not an image. Only image files are allowed.`;
            showErrorToast(message);
            continue;
        }

        if (file.size > 2 * 1024 * 1024) {
            const message = `Image "${file.name}" is too large (max 2MB)`;
            showErrorToast(message);
            continue;
        }

        // Add to our global files array
        allSelectedFiles.push(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.dataset.index = allSelectedFiles.length - 1;
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <span class="image-name">${file.name}</span>
                <button type="button" class="remove-image" onclick="removeAnnouncementImage(this, ${allSelectedFiles.length - 1}, false)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            previewContainer.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    updateEditImageCountDisplay();
    updateEditFileInput();
    input.value = '';
}

function updateEditImageCountDisplay() {
    const nameDisplay = document.getElementById('editAnnouncementImagesNameDisplay');
    const remainingExistingImages = existingImages.length - imagesToRemove.length;
    const totalImages = remainingExistingImages + allSelectedFiles.length;

    nameDisplay.textContent = `${totalImages} image(s) selected (max 30)`;
    if (totalImages >= 30) {
        nameDisplay.style.color = '#f5222d';
        showSuccessToast('Maximum of 30 images reached');
    } else {
        nameDisplay.style.color = '';
    }
}

function removeAnnouncementImage(button, index, isExistingImage) {
    const previewContainer = document.getElementById('editImagePreviews');
    const previewDiv = button.closest('.image-preview');

    if (isExistingImage) {
        // existing image from the server/db
        const imageId = previewDiv.dataset.imageId;
        if (!imagesToRemove.includes(imageId)) {
            imagesToRemove.push(imageId);
        }

        // Hidden input to track this removal
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'remove_images';
        hiddenInput.value = imageId;
        document.getElementById('announcementEditForm').appendChild(hiddenInput);
    } else {
        allSelectedFiles.splice(index, 1);
    }

    previewDiv.remove();

    updateEditFileInput();

    updateEditImageCountDisplay();
}

function updateEditFileInput() {
    const dataTransfer = new DataTransfer();
    allSelectedFiles.forEach(file => dataTransfer.items.add(file));

    const fileInput = document.getElementById('editAnnouncementImagesInput');
    fileInput.files = dataTransfer.files;
}

function toggleAllEditCourses() {
    const checkboxes = document.querySelectorAll('#editCoursesContainer input[name="courses"]');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);

    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
}

function closeAnnouncementEditModal() {
    const modal = document.getElementById('announcementEditModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form
    document.getElementById('announcementEditForm').reset();
    document.getElementById('announcementEditFormResponse').innerHTML = '';
    document.getElementById('editImagePreviews').innerHTML = '';
    document.getElementById('editAnnouncementImagesNameDisplay').textContent = 'No images selected';

    // Reset the global files arrays
    allSelectedFiles = [];
    existingImages = [];
    imagesToRemove = [];

    // Hide all category fields
    document.querySelectorAll('.category-fields').forEach(field => {
        field.style.display = 'none';
    });
}

// Handle form submission for edit
document.getElementById('announcementEditForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const form = this;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('announcementEditFormResponse');
    const announcementId = document.getElementById('editAnnouncementId').value;
    const quillContent = window.quillEdit.root.innerHTML;
    document.getElementById('edit_content').value = quillContent || '';

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Validate category-specific fields
    const category = document.getElementById('edit_category').value;
    let isValid = true;

    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('error');
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            field.closest('.form-group').appendChild(errorElement);
        }
        isValid = false;
    }

    function validateDateRange(startFieldId, endFieldId, errorMessage) {
        const startField = document.getElementById(startFieldId);
        const endField = document.getElementById(endFieldId);
        const startValue = startField.value;
        const endValue = endField.value;

        // Clear previous errors
        startField.classList.remove('error');
        endField.classList.remove('error');
        document.querySelectorAll(`#${startFieldId} ~ .error-message, #${endFieldId} ~ .error-message`).forEach(el => el.remove());

        // Check if fields are empty
        if (!startValue || !endValue) {
            if (!startValue) showFieldError(startFieldId, 'This field is required');
            if (!endValue) showFieldError(endFieldId, 'This field is required');
            return false;
        }

        // Parse dates
        const startDate = new Date(startValue);
        const endDate = new Date(endValue);

        // Validate date range
        if (startDate >= endDate) {
            showFieldError(startFieldId, errorMessage);
            showFieldError(endFieldId, errorMessage);
            return false;
        }

        return true;
    }

    if (category === 'ENROLLMENT') {
        const courseCheckboxes = document.querySelectorAll('#editCoursesContainer input[name="courses"]:checked');
        const courses = Array.from(courseCheckboxes).map(cb => cb.value);

        if (courses.length === 0) {
            showFieldError('edit_enrollment_start', 'Please select at least one course');
            isValid = false;
        } else if (courses.includes('ALL') && courses.length > 1) {
            showFieldError('edit_enrollment_start', 'You cannot select "All Courses" with other courses');
            isValid = false;
        }

        if (!validateDateRange(
            'edit_enrollment_start',
            'edit_enrollment_end',
            'Enrollment end date must be after start date'
        )) {
            isValid = false;
        }
    }
    else if (category === 'EVENT') {
        const eventDate = document.getElementById('edit_event_date').value;
        const location = document.getElementById('edit_location').value;

        if (!eventDate) showFieldError('edit_event_date', 'Event date is required');
        if (!location) showFieldError('edit_location', 'Location is required');
        if (!eventDate || !location) isValid = false;
    }
    else if (category === 'SUSPENSION') {
        const suspensionDate = document.getElementById('edit_suspension_date').value;
        const untilDate = document.getElementById('edit_until_suspension_date').value;

        if (!suspensionDate) {
            showFieldError('edit_suspension_date', 'Suspension date is required');
            isValid = false;
        }

        if (untilDate) {
            if (!suspensionDate) {
                showFieldError('edit_until_suspension_date', 'Please set suspension date first');
                isValid = false;
            } else {
                const suspensionDateObj = new Date(suspensionDate);
                const untilDateObj = new Date(untilDate);

                if (suspensionDateObj > untilDateObj) {
                    showFieldError('edit_until_suspension_date', 'Until date must be after suspension date');
                    isValid = false;
                }
            }
        }
    }
    else if (category === 'EMERGENCY') {
        const contactInfo = document.getElementById('edit_contact_info').value;
        if (!contactInfo) {
            showFieldError('edit_contact_info', 'Contact information is required');
            isValid = false;
        }
    }
    else if (category === 'SCHOLARSHIP') {
        const scholarship = document.getElementById('edit_scholarship').value;
        const requirements = document.getElementById('edit_requirements').value;
        const benefits = document.getElementById('edit_benefits').value;

        // Only validate dates if both are provided (removed the requirement)
        const appStart = document.getElementById('edit_application_start').value;
        const appEnd = document.getElementById('edit_application_end').value;

        if (appStart && appEnd) {
            const startDate = new Date(appStart);
            const endDate = new Date(appEnd);

            if (startDate >= endDate) {
                showFieldError('edit_application_start', 'Application end date must be after start date');
                showFieldError('edit_application_end', 'Application end date must be after start date');
                isValid = false;
            }

            if (startDate < new Date()) {
                showFieldError('edit_application_start', 'Application period cannot start in the past');
                isValid = false;
            }
        }

        if (!scholarship && (!requirements || !benefits)) {
            if (!requirements) showFieldError('edit_requirements', 'Requirements are required when no scholarship is selected');
            if (!benefits) showFieldError('edit_benefits', 'Benefits are required when no scholarship is selected');
            isValid = false;
        }
    }

    // Basic validation for all announcements
    const title = document.getElementById('edit_title').value;
    const content = document.getElementById('edit_content').value;

    if (!title) {
        showFieldError('edit_title', 'Title is required');
        isValid = false;
    }

//    if (!content) {
//        showFieldError('edit_content', 'Content is required');
//        isValid = false;
//    }

    if (!isValid) {
        submitBtn.classList.remove('is-loading');

        // Scroll to the first error
        const firstError = document.querySelector('.error-message');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return;
    }

    const formData = new FormData(form);

    // Append each selected file individually
    allSelectedFiles.forEach((file, index) => {
        formData.append('images', file);
    });

    // Append images to remove
    imagesToRemove.forEach(imageId => {
        formData.append('remove_images', imageId);
    });

    // Manually add course selections to formData
    const courseCheckboxes = document.querySelectorAll('#editCoursesContainer input[name="courses"]:checked');
    courseCheckboxes.forEach(checkbox => {
        formData.append('courses', checkbox.value);
    });

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast('Announcement updated successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Announcement updated successfully! This window will close shortly...
                </div>
            `;
            setTimeout(() => {
                closeAnnouncementEditModal();
                window.location.reload();
            }, 1500);
        } else {
            showFormErrors(form, data.errors);
            if (data.message) {
                showErrorToast(data.message);
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.errors) {
            showFormErrors(form, error.errors);
        } else {
            showErrorToast(error.message || 'An unexpected error occurred');
            formResponse.innerHTML = `
                <div class="response-message response-error">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    ${error.message || 'An unexpected error occurred'}
                </div>
            `;
        }
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

// Format date for datetime-local input
function formatDateTimeForInput(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const pad = num => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Format date for date input
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const pad = num => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ----------------------------------------- Archive Announcement Function ----------------------------------------------
function archiveAnnouncement(announcementId, announcementTitle) {
    const modal = document.getElementById('announcementArchiveModal');
    const archiveIdInput = document.getElementById('archiveAnnouncementId');
    const responseDiv = document.getElementById('announcementArchiveFormResponse');

    archiveIdInput.value = announcementId;

    const description = modal.querySelector('.header-description');
    description.textContent = `Are you sure you want to archive the announcement "${announcementTitle}"?`;

    responseDiv.innerHTML = '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAnnouncementArchiveModal() {
    const modal = document.getElementById('announcementArchiveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Handle form submission
document.getElementById('announcementArchiveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const submitBtn = form.querySelector('button[type="submit"]');
    const responseDiv = document.getElementById('announcementArchiveFormResponse');
    const announcementId = document.getElementById('archiveAnnouncementId').value;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    submitBtn.classList.add('is-loading');
    responseDiv.innerHTML = '';

    fetch(`/announcements/${announcementId}/archive/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
        }
    })
    .then(response => {
        if (response.status === 403) {
            throw new Error('You do not have permission to archive this announcement');
        }
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch {
                    throw new Error(text || 'Failed to archive announcement');
                }
            });
        }
        return response.json();
    })
    .then(data => {
        if (data && data.success) {
            showSuccessToast(data.message || 'Announcement archived successfully!');
            closeAnnouncementArchiveModal();
            window.location.reload();
        } else {
            throw new Error(data?.message || 'Failed to archive announcement');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        responseDiv.innerHTML = `
            <div class="response-message response-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                ${error.message || 'An unexpected error occurred'}
            </div>
        `;
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

// ------------------------------------------ Sorting and Search Function ----------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    initAnnouncementsTable();
});

let fetchAndDisplayAnnouncements;

function initAnnouncementsTable() {
    const table = document.getElementById('announcements-table');
    const searchInput = document.getElementById('announcements-search');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const sortableHeaders = table.querySelectorAll('th[data-sort]');
    const tbody = table.querySelector('tbody');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Create a no data row element
    const noDataRow = document.createElement('tr');
    noDataRow.id = 'announcements-no-data-row';
    const noDataCell = document.createElement('td');
    noDataCell.colSpan = table.querySelectorAll('th').length;
    noDataCell.textContent = 'No announcements found matching your criteria';
    noDataCell.style.textAlign = 'center';
    noDataCell.style.padding = '20px';
    noDataCell.style.fontStyle = 'italic';
    noDataCell.style.color = '#888';
    noDataRow.appendChild(noDataCell);
    noDataRow.style.display = 'none';
    tbody.appendChild(noDataRow);

    let currentSortColumn = 'created_at';
    let currentSortDirection = 'desc';

    // Initialize sorting for headers
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');

            // If clicking the same column, reverse the direction
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }

            // Update sort indicators
            sortableHeaders.forEach(h => {
                const icon = h.querySelector('i');
                if (h === header) {
                    icon.className = currentSortDirection === 'asc' ? 'bx bx-sort-up' : 'bx bx-sort-down';
                } else {
                    icon.className = 'bx bx-sort';
                }
            });

            fetchAndDisplayAnnouncements();
        });
    });

    // Initialize search and filter events
    searchInput.addEventListener('input', debounce(function() {
        fetchAndDisplayAnnouncements();
    }, 300));

    categoryFilter.addEventListener('change', function() {
        fetchAndDisplayAnnouncements();
    });

    statusFilter.addEventListener('change', function() {
        fetchAndDisplayAnnouncements();
    });

    dateFilter.addEventListener('change', function() {
        fetchAndDisplayAnnouncements();
    });

    // Define the function that will be called
    fetchAndDisplayAnnouncements = function() {
        const searchTerm = searchInput.value;
        const categoryFilterValue = categoryFilter.value;
        const statusFilterValue = statusFilter.value;
        const dateFilterValue = dateFilter.value;
        const currentPage = new URLSearchParams(window.location.search).get('announcement_page') || 1;

        // Show loading indicator
        const loadingElement = document.getElementById('announcements-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }

        // Make AJAX request with pagination
        fetch(`?get_filtered_announcements=1&search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(categoryFilterValue)}&status=${encodeURIComponent(statusFilterValue)}&date=${encodeURIComponent(dateFilterValue)}&sort=${currentSortColumn}&direction=${currentSortDirection}&announcement_page=${currentPage}&per_page=10`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateAnnouncementsTableWithData(data.announcements);
            updateAnnouncementsPaginationControls(data);

            // Hide loading indicator
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching announcement data:', error);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">Error loading announcements</td></tr>';

            // Hide loading indicator even on error
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        });
    }

    function updateAnnouncementsPaginationControls(data) {
        let paginationContainer = document.querySelector('.pagination-container');

        // If pagination container doesn't exist, create it
        if (!paginationContainer) {
            const tableContainer = document.getElementById('announcements-table-container');
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-container';
            tableContainer.appendChild(paginationContainer);
        }

        // Clear existing content
        paginationContainer.innerHTML = '';

        // Only show pagination if there are multiple pages
        if (data.pagination.num_pages > 1) {
            const paginationInfo = document.createElement('div');
            paginationInfo.className = 'pagination-info';
            paginationInfo.textContent = `Showing ${data.pagination.start_index} to ${data.pagination.end_index} of ${data.pagination.total_count} entries`;
            paginationContainer.appendChild(paginationInfo);

            const paginationControls = document.createElement('div');
            paginationControls.className = 'pagination-controls';

            // First page button
            if (data.pagination.has_previous) {
                const firstPageBtn = document.createElement('a');
                firstPageBtn.href = 'javascript:void(0);';
                firstPageBtn.className = 'pagination-btn first-page';
                firstPageBtn.title = 'First Page';
                firstPageBtn.setAttribute('data-page', 1);
                firstPageBtn.innerHTML = '<i class="bx bx-chevrons-left"></i>';
                paginationControls.appendChild(firstPageBtn);
            } else {
                const firstPageBtn = document.createElement('span');
                firstPageBtn.className = 'pagination-btn first-page disabled';
                firstPageBtn.title = 'First Page';
                firstPageBtn.innerHTML = '<i class="bx bx-chevrons-left"></i>';
                paginationControls.appendChild(firstPageBtn);
            }

            // Previous page button
            if (data.pagination.has_previous) {
                const prevPageBtn = document.createElement('a');
                prevPageBtn.href = 'javascript:void(0);';
                prevPageBtn.className = 'pagination-btn prev-page';
                prevPageBtn.title = 'Previous Page';
                prevPageBtn.setAttribute('data-page', data.pagination.current_page - 1);
                prevPageBtn.innerHTML = '<i class="bx bx-chevron-left"></i>';
                paginationControls.appendChild(prevPageBtn);
            } else {
                const prevPageBtn = document.createElement('span');
                prevPageBtn.className = 'pagination-btn prev-page disabled';
                prevPageBtn.title = 'Previous Page';
                prevPageBtn.innerHTML = '<i class="bx bx-chevron-left"></i>';
                paginationControls.appendChild(prevPageBtn);
            }

            // Page numbers
            const pageNumbers = document.createElement('div');
            pageNumbers.className = 'page-numbers';

            // Show limited page numbers around current page
            const startPage = Math.max(1, data.pagination.current_page - 2);
            const endPage = Math.min(data.pagination.num_pages, data.pagination.current_page + 2);

            for (let i = startPage; i <= endPage; i++) {
                if (i === data.pagination.current_page) {
                    const currentPageBtn = document.createElement('span');
                    currentPageBtn.className = 'pagination-btn current-page active';
                    currentPageBtn.textContent = i;
                    pageNumbers.appendChild(currentPageBtn);
                } else {
                    const pageBtn = document.createElement('a');
                    pageBtn.href = 'javascript:void(0);';
                    pageBtn.className = 'pagination-btn page-number';
                    pageBtn.setAttribute('data-page', i);
                    pageBtn.textContent = i;
                    pageNumbers.appendChild(pageBtn);
                }
            }

            paginationControls.appendChild(pageNumbers);

            // Next page button
            if (data.pagination.has_next) {
                const nextPageBtn = document.createElement('a');
                nextPageBtn.href = 'javascript:void(0);';
                nextPageBtn.className = 'pagination-btn next-page';
                nextPageBtn.title = 'Next Page';
                nextPageBtn.setAttribute('data-page', data.pagination.current_page + 1);
                nextPageBtn.innerHTML = '<i class="bx bx-chevron-right"></i>';
                paginationControls.appendChild(nextPageBtn);
            } else {
                const nextPageBtn = document.createElement('span');
                nextPageBtn.className = 'pagination-btn next-page disabled';
                nextPageBtn.title = 'Next Page';
                nextPageBtn.innerHTML = '<i class="bx bx-chevron-right"></i>';
                paginationControls.appendChild(nextPageBtn);
            }

            // Last page button
            if (data.pagination.has_next) {
                const lastPageBtn = document.createElement('a');
                lastPageBtn.href = 'javascript:void(0);';
                lastPageBtn.className = 'pagination-btn last-page';
                lastPageBtn.title = 'Last Page';
                lastPageBtn.setAttribute('data-page', data.pagination.num_pages);
                lastPageBtn.innerHTML = '<i class="bx bx-chevrons-right"></i>';
                paginationControls.appendChild(lastPageBtn);
            } else {
                const lastPageBtn = document.createElement('span');
                lastPageBtn.className = 'pagination-btn last-page disabled';
                lastPageBtn.title = 'Last Page';
                lastPageBtn.innerHTML = '<i class="bx bx-chevrons-right"></i>';
                paginationControls.appendChild(lastPageBtn);
            }

            paginationContainer.appendChild(paginationControls);

            // Add event listeners to pagination buttons
            paginationContainer.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
                btn.addEventListener('click', function() {
                    const page = this.getAttribute('data-page');
                    // Update URL without reloading
                    const url = new URL(window.location);
                    url.searchParams.set('announcement_page', page);
                    window.history.pushState({}, '', url);

                    // Fetch data for the new page
                    fetchAndDisplayAnnouncements();
                });
            });
        }
    }

    function updateAnnouncementsTableWithData(announcements) {
        // Clear existing rows (except no data row)
        const existingRows = tbody.querySelectorAll('tr:not(#announcements-no-data-row)');
        existingRows.forEach(row => row.remove());

        if (announcements.length === 0) {
            noDataRow.style.display = '';
            return;
        }

        noDataRow.style.display = 'none';

        // Add new rows
        announcements.forEach(announcement => {
            const row = document.createElement('tr');
            row.dataset.id = announcement.id;
            row.dataset.created = announcement.created_at;

            // ID
            const idCell = document.createElement('td');
            idCell.textContent = announcement.id;
            row.appendChild(idCell);

            // Title
            const titleCell = document.createElement('td');
            titleCell.textContent = announcement.title;
            row.appendChild(titleCell);

            // Category
            const categoryCell = document.createElement('td');
            categoryCell.textContent = announcement.category;
            row.appendChild(categoryCell);

            // Author
            const authorCell = document.createElement('td');
            authorCell.textContent = announcement.author_name;
            row.appendChild(authorCell);

            // Date Created
            const dateCell = document.createElement('td');
            const createdDate = new Date(announcement.created_at);
            dateCell.textContent = createdDate.toLocaleString();
            row.appendChild(dateCell);

            // Status
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge ${announcement.is_published ? 'active' : 'inactive'}`;
            statusBadge.textContent = announcement.is_published ? 'Published' : 'Draft';
            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);

            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions';

            // View button
            if (announcement.can_view) {
                const viewBtn = document.createElement('button');
                viewBtn.className = 'btn-view-announcement btn-icon view';
                viewBtn.title = 'View';
                viewBtn.onclick = function() {
                    viewAnnouncement(announcement.id);
                };
                viewBtn.innerHTML = '<i class="ri-eye-fill"></i>';
                actionsCell.appendChild(viewBtn);
            }

            // Edit button
            if (announcement.can_edit) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-edit-announcement btn-icon edit-announcement';
                editBtn.title = 'Edit';
                editBtn.onclick = function() {
                    editAnnouncement(announcement.id);
                };
                editBtn.innerHTML = '<i class="bx bx-edit"></i>';
                actionsCell.appendChild(editBtn);
            }

            // Archive button
            if (announcement.can_delete) {
                const archiveBtn = document.createElement('button');
                archiveBtn.className = 'btn-icon-announcement btn-icon archive';
                archiveBtn.title = 'Archive';
                archiveBtn.onclick = function() {
                    archiveAnnouncement(announcement.id, announcement.title);
                };
                archiveBtn.innerHTML = '<i class="bx bxs-archive"></i>';
                actionsCell.appendChild(archiveBtn);
            }

            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    }

    // Initial load
    fetchAndDisplayAnnouncements();
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function() {
    if (typeof fetchAndDisplayAnnouncements === 'function') {
        fetchAndDisplayAnnouncements();
    }
});

// -------------------------------------- Success/Error Toast Notification ---------------------------------------------
function showToast(message, type = 'success', duration = 5000) {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);

  if (duration) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }

  return toast;
}

function removeToast(toast) {
  toast.style.animation = 'slideOut 0.3s ease-out forwards';
  setTimeout(() => {
    toast.remove();
  }, 300);
}

function showSuccessToast(message, duration = 5000) {
  return showToast(message, 'success', duration);
}

function showErrorToast(message, duration = 5000) {
  return showToast(message, 'error', duration);
}

function showWarningToast(message, duration = 5000) {
  return showToast(message, 'warning', duration);
}

function showInfoToast(message, duration = 5000) {
  return showToast(message, 'info', duration);
}

// ------------------------------------------ Refresh Table Dynamically ------------------------------------------------
function refreshAnnouncementsTable() {
    const searchTerm = document.getElementById('announcements-search').value;
    const currentSort = getCurrentSortState();

    let url = '/announcements/';
    const params = new URLSearchParams();

    if (searchTerm) params.append('search', searchTerm);
    if (currentSort.column) params.append('sort', currentSort.column);
    if (currentSort.direction) params.append('direction', currentSort.direction);

    if (params.toString()) url += `?${params.toString()}`;

    fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        const tbody = document.querySelector('#announcements-table tbody');
        if (!tbody) {
            console.error('Announcements table body not found');
            return;
        }

        tbody.innerHTML = '';

        data.announcements.forEach(announcement => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', announcement.id);
            row.setAttribute('data-created', announcement.created_at);

            row.innerHTML = `
                <td>${announcement.id}</td>
                <td>${announcement.title}</td>
                <td>${announcement.category_display}</td>
                <td>${announcement.author_name}</td>
                <td>${announcement.created_at}</td>
                <td>
                    <span class="status-badge ${announcement.is_published ? 'active' : 'inactive'}">
                        ${announcement.is_published ? 'Published' : 'Draft'}
                    </span>
                </td>
                <td class="actions">
                    ${announcement.permissions.view ?
                        `<button class="btn-view-announcement btn-icon view" onclick="viewAnnouncement(${announcement.id})">
                            <i class="ri-eye-fill"></i>
                        </button>` : ''}
                    ${announcement.permissions.change ?
                        `<button class="btn-edit-announcement btn-icon edit" onclick="editAnnouncement(${announcement.id})">
                            <i class='bx bx-edit'></i>
                        </button>` : ''}
                    ${announcement.permissions.delete ?
                        `<button class="btn-icon-announcement btn-icon danger" onclick="deleteAnnouncement(${announcement.id}, '${announcement.title.replace(/'/g, "\\'")}')">
                            <i class='bx bx-trash'></i>
                        </button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Reinitialize sorting and search functionality
        initAnnouncementsTable();
    })
    .catch(error => {
        console.error('Error refreshing announcements table:', error);
        showErrorToast('Failed to refresh announcements. Please try again.');
    });
}

// Helper function to get current sort state
function getCurrentSortState() {
    const table = document.getElementById('announcements-table');
    const activeSortHeader = table.querySelector('th.sort-asc, th.sort-desc');

    if (!activeSortHeader) return { column: null, direction: null };

    return {
        column: activeSortHeader.getAttribute('data-sort'),
        direction: activeSortHeader.classList.contains('sort-asc') ? 'asc' : 'desc'
    };
}