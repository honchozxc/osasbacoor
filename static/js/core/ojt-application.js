class OJTApplication {
    constructor() {
        this.requirementCount = document.querySelectorAll('.requirement-item').length;
        this.maxRequirements = 13;
        this.companyData = this.loadCompanyDataFromTable();
        this.init();
    }

    init() {
        this.bindEvents();
        this.initDateValidation();
        this.loadCompanyData();
        this.updateRequirementsSummary();
        this.updateFormSetManagement();
        this.initializeFileUploads();
        this.updateCompanyAvailability();
    }

    loadCompanyDataFromTable() {
        const companyData = {};
        const companyRows = document.querySelectorAll('.companies-section tbody tr');

        companyRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const companyId = row.dataset.companyId;
            const name = cells[0].querySelector('strong').textContent.trim();
            const address = cells[1].textContent.trim();
            const slots = cells[2].textContent.trim();
            const status = cells[3].textContent.trim();
            const description = cells[4].textContent.trim();

            const [available, total] = slots.split('/').map(Number);
            const filled = total - available;

            companyData[companyId] = {
                name,
                address,
                totalSlots: total,
                filledSlots: filled,
                availableSlots: available,
                status,
                description: description === 'No description available' ? '' : description
            };
        });

        return companyData;
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('ojt-application-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Requirements events
        this.bindRequirementsEvents();
    }

    bindRequirementsEvents() {
        // Add requirement button
        const addRequirementBtn = document.getElementById('add-requirement');
        if (addRequirementBtn) {
            addRequirementBtn.addEventListener('click', () => this.addRequirement());
        }

        // File input changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[type="file"]')) {
                this.handleFileSelect(e.target);
            }
        });

        // Remove requirement buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-requirement')) {
                this.removeRequirement(e.target.closest('.requirement-item'));
            }
        });

        // Drag and drop
        this.initDragAndDrop();
    }

    initializeFileUploads() {
        // Initialize existing file inputs
        const fileInputs = document.querySelectorAll('.file-input');
        fileInputs.forEach(input => {
            this.initializeFileInput(input);
        });
    }

    initializeFileInput(fileInput) {
        const wrapper = fileInput.closest('.file-upload-wrapper');
        const uploadBtn = wrapper.querySelector('.file-upload-btn');
        const fileNameDisplay = wrapper.querySelector('.file-name-display');

        // Update button text when file is selected
        if (fileInput.files.length > 0) {
            uploadBtn.textContent = 'Change File';
            uploadBtn.classList.add('has-file');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = fileInput.files[0].name;
                fileNameDisplay.style.display = 'block';
            }
        }

        // Add click event to trigger file input
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }

    addRequirement() {
        if (this.requirementCount >= this.maxRequirements) {
            this.showNotification('Maximum number of requirements reached', 'error');
            return;
        }

        this.requirementCount++;
        const requirementsContainer = document.getElementById('requirements-container');
        const totalForms = document.getElementById('id_requirements-TOTAL_FORMS');

        const requirementHtml = `
            <div class="requirement-item slide-in" data-requirement-id="${this.requirementCount}">
                <div class="requirement-header">
                    <h4 class="requirement-title">Requirement #${this.requirementCount}</h4>
                    <span class="requirement-status status-pending">Pending</span>
                </div>
                <div class="requirement-fields">
                    <div class="form-group">
                        <label class="form-label">Document Type *</label>
                        <select name="requirements-${this.requirementCount - 1}-requirement_type" class="form-control requirement-type" required>
                            <option value="">Select requirement type...</option>
                            <option value="resume">Resume/CV</option>
                            <option value="application_form">Application Form</option>
                            <option value="parent_consent">Parent Consent Form</option>
                            <option value="medical_certificate">Medical Certificate</option>
                            <option value="barangay_clearance">Barangay Clearance</option>
                            <option value="police_clearance">Police Clearance</option>
                            <option value="nbi_clearance">NBI Clearance</option>
                            <option value="photo_2x2">2x2 Photo</option>
                            <option value="registration_form">Registration Form</option>
                            <option value="endorsement_letter">Endorsement Letter</option>
                            <option value="waiver">Waiver Form</option>
                            <option value="academic_records">Academic Records</option>
                            <option value="other">Other Document</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">File *</label>
                        <div class="file-upload-wrapper">
                            <input type="file" name="requirements-${this.requirementCount - 1}-file"
                                   class="file-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required>
                            <div class="file-upload-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                Choose File
                            </div>
                            <div class="file-name-display"></div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline remove-requirement">
                        Remove Requirement
                    </button>
                </div>
            </div>
        `;

        requirementsContainer.insertAdjacentHTML('beforeend', requirementHtml);

        // Initialize the new file input
        const newFileInput = requirementsContainer.querySelector('.requirement-item:last-child .file-input');
        this.initializeFileInput(newFileInput);

        this.updateFormSetManagement();
        this.updateRequirementsSummary();
    }

    removeRequirement(item) {
        if (this.requirementCount <= 1) {
            this.showNotification('You must have at least one requirement', 'error');
            return;
        }

        item.remove();
        this.requirementCount--;
        this.updateFormSetManagement();
        this.updateRequirementsSummary();
    }

    updateFormSetManagement() {
        const totalForms = document.getElementById('id_requirements-TOTAL_FORMS');
        if (totalForms) {
            totalForms.value = this.requirementCount;
        }
    }

    handleFileSelect(input) {
        const file = input.files[0];
        if (!file) return;

        // Validate file
        if (!this.validateFile(file)) {
            input.value = '';
            this.updateFileDisplay(input, null);
            return;
        }

        // Update UI
        this.updateFileDisplay(input, file);
        this.updateRequirementsSummary();
    }

    validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];

        if (file.size > maxSize) {
            this.showNotification('File size must be less than 5MB', 'error');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Please upload PDF, DOC, DOCX, JPG, or PNG files only', 'error');
            return false;
        }

        return true;
    }

    updateFileDisplay(fileInput, file) {
        const wrapper = fileInput.closest('.file-upload-wrapper');
        const uploadBtn = wrapper.querySelector('.file-upload-btn');
        const fileNameDisplay = wrapper.querySelector('.file-name-display');
        const requirementItem = fileInput.closest('.requirement-item');
        const status = requirementItem.querySelector('.requirement-status');

        if (file) {
            // File is selected
            uploadBtn.textContent = 'Change File';
            uploadBtn.classList.add('has-file');

            if (fileNameDisplay) {
                fileNameDisplay.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
                fileNameDisplay.style.display = 'block';
            }

            status.textContent = 'Ready';
            status.className = 'requirement-status status-uploaded';
            requirementItem.classList.add('has-file');
        } else {
            // No file selected
            uploadBtn.textContent = 'Choose File';
            uploadBtn.classList.remove('has-file');

            if (fileNameDisplay) {
                fileNameDisplay.textContent = '';
                fileNameDisplay.style.display = 'none';
            }

            status.textContent = 'Pending';
            status.className = 'requirement-status status-pending';
            requirementItem.classList.remove('has-file');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    initDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.highlightDropZone(), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.unhighlightDropZone(), false);
        });

        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlightDropZone() {
        const dropZone = document.getElementById('drop-zone');
        dropZone.classList.add('active');
    }

    unhighlightDropZone() {
        const dropZone = document.getElementById('drop-zone');
        dropZone.classList.remove('active');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            // Add a new requirement for each dropped file
            for (let i = 0; i < files.length; i++) {
                if (this.requirementCount >= this.maxRequirements) {
                    this.showNotification('Maximum number of requirements reached', 'error');
                    break;
                }

                this.addRequirement();
                const latestRequirement = document.querySelector('.requirement-item:last-child .file-input');
                if (latestRequirement && this.validateFile(files[i])) {
                    this.setFileInput(latestRequirement, files[i]);
                }
            }
        }
    }

    setFileInput(input, file) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;

        // Trigger change event
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    }

    validateRequirements() {
        const requirementItems = document.querySelectorAll('.requirement-item');

        if (requirementItems.length === 0) {
            this.showNotification('Please add at least one requirement', 'error');
            return false;
        }

        let isValid = true;
        requirementItems.forEach((item, index) => {
            const typeSelect = item.querySelector('.requirement-type');
            const fileInput = item.querySelector('input[type="file"]');

            // Clear previous validation
            this.clearInvalidRequirement(item);

            // Validate both fields
            if (!typeSelect.value || !fileInput.files[0]) {
                this.highlightInvalidRequirement(item);
                isValid = false;
            }
        });

        return isValid;
    }

    highlightInvalidRequirement(item) {
        item.style.border = '2px solid #dc2626';
        item.style.background = '#fef2f2';
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    clearInvalidRequirement(item) {
        item.style.border = '';
        item.style.background = '';
    }

    updateRequirementsSummary() {
        const totalElements = document.querySelectorAll('.requirement-item').length;
        const uploadedElements = document.querySelectorAll('.requirement-item.has-file').length;

        const totalEl = document.getElementById('total-requirements');
        const uploadedEl = document.getElementById('uploaded-requirements');
        const pendingEl = document.getElementById('pending-requirements');
        const progressEl = document.getElementById('completion-progress');
        const progressText = document.getElementById('progress-text');

        if (totalEl) totalEl.textContent = totalElements;
        if (uploadedEl) uploadedEl.textContent = uploadedElements;
        if (pendingEl) pendingEl.textContent = totalElements - uploadedElements;

        // Update progress
        const progress = totalElements > 0 ? (uploadedElements / totalElements) * 100 : 0;
        if (progressEl) {
            progressEl.style.width = progress + '%';
            progressEl.setAttribute('data-progress', Math.round(progress));
        }
        if (progressText) {
            progressText.textContent = Math.round(progress) + '%';
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        // Validate main form
        if (!this.validateForm()) {
            this.showNotification('Please correct the form errors', 'error');
            return;
        }

        // Validate requirements
        if (!this.validateRequirements()) {
            this.showNotification('Please complete all requirement fields', 'error');
            return;
        }

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Add loading state
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';
        submitBtn.disabled = true;
        form.classList.add('loading');

        try {
            // Submit the form
            form.submit();
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Error submitting application', 'error');
            this.resetSubmitButton(submitBtn);
            form.classList.remove('loading');
        }
    }

    validateForm() {
        let isValid = true;
        const form = document.getElementById('ojt-application-form');
        const requiredFields = form.querySelectorAll('[required]');

        // Clear previous errors
        requiredFields.forEach(field => {
            field.classList.remove('error');
            const errorDisplay = field.closest('.form-group')?.querySelector('.field-error');
            if (errorDisplay) {
                errorDisplay.remove();
            }
        });

        // Validate required fields
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');

                // Add error message
                const formGroup = field.closest('.form-group');
                if (formGroup && !formGroup.querySelector('.field-error')) {
                    const errorEl = document.createElement('div');
                    errorEl.className = 'field-error';
                    errorEl.textContent = 'This field is required';
                    formGroup.appendChild(errorEl);
                }
            }
        });

        // Validate dates
        if (!this.validateDates()) {
            isValid = false;
        }

        return isValid;
    }

    resetSubmitButton(submitBtn) {
        submitBtn.innerHTML = 'Submit Application';
        submitBtn.disabled = false;
    }

    showNotification(message, type = 'success') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} toast-notification`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    // Date validation methods
    initDateValidation() {
        const startDateInput = document.querySelector('input[name="proposed_start_date"]');
        const endDateInput = document.querySelector('input[name="proposed_end_date"]');

        if (startDateInput && endDateInput) {
            startDateInput.addEventListener('change', () => this.validateDates());
            endDateInput.addEventListener('change', () => this.validateDates());
        }
    }

    validateDates() {
        const startDateInput = document.querySelector('input[name="proposed_start_date"]');
        const endDateInput = document.querySelector('input[name="proposed_end_date"]');

        if (!startDateInput.value || !endDateInput.value) return true;

        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Clear previous errors
        startDateInput.classList.remove('error');
        endDateInput.classList.remove('error');
        this.clearDateErrors();

        let isValid = true;

        if (startDate < today) {
            this.showDateError(startDateInput, 'Start date must be in the future');
            isValid = false;
        }

        if (endDate <= startDate) {
            this.showDateError(endDateInput, 'End date must be after start date');
            isValid = false;
        }

        // Validate duration
        const duration = (endDate - startDate) / (1000 * 60 * 60 * 24);
        if (duration < 30) {
            this.showDateError(endDateInput, 'OJT duration should be at least 30 days');
            isValid = false;
        }
        if (duration > 365) {
            this.showDateError(endDateInput, 'OJT duration cannot exceed 1 year');
            isValid = false;
        }

        return isValid;
    }

    showDateError(input, message) {
        input.classList.add('error');
        const formGroup = input.closest('.form-group');
        let errorEl = formGroup.querySelector('.field-error');

        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            formGroup.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    clearDateErrors() {
        const dateGroups = document.querySelectorAll('.date-input-group');
        dateGroups.forEach(group => {
            const errorEl = group.querySelector('.field-error');
            if (errorEl) {
                errorEl.remove();
            }
        });
    }

    // Company data loading
    loadCompanyData() {
        const companySelect = document.querySelector('select[name="company"]');
        if (companySelect) {
            companySelect.addEventListener('change', (e) => this.handleCompanyChange(e.target.value));
        }
    }

    handleCompanyChange(companyId) {
        const companyInfo = document.getElementById('company-info');

        if (companyId) {
            this.updateCompanyInfo(companyId);
            companyInfo.style.display = 'block';
        } else {
            companyInfo.style.display = 'none';
        }
    }

    updateCompanyInfo(companyId) {
        const companyData = this.companyData[companyId];

        if (companyData) {
            document.getElementById('company-name').textContent = companyData.name;
            document.getElementById('company-address').textContent = companyData.address;
            document.getElementById('company-contact').textContent = 'See company details';
            document.getElementById('company-total-slots').textContent = companyData.totalSlots;
            document.getElementById('company-available-slots').textContent = companyData.availableSlots;
            document.getElementById('company-filled-slots').textContent = companyData.filledSlots;
            document.getElementById('company-description').textContent = companyData.description || 'No description available';

            // Update status badge
            const statusBadge = document.getElementById('company-status-badge');
            statusBadge.textContent = companyData.status;
            statusBadge.className = `badge badge-${companyData.status.toLowerCase()}`;
        }
    }

    updateCompanyAvailability() {
        const companySelect = document.querySelector('select[name="company"]');
        const submitBtn = document.querySelector('#submit-btn');

        if (companySelect && submitBtn) {
            companySelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const companyId = e.target.value;
                const companyData = this.companyData[companyId];

                if (companyData && companyData.availableSlots === 0) {
                    this.showNotification('This company has no available slots. Your application will be waitlisted.', 'warning');
                }
            });
        }
    }
}

// Initialize app globally
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new OJTApplication();
});