// ------------------------------------------- OJT Reports Table Functions ---------------------------------------------
let currentReportPage = 1;
let currentReportSearch = '';
let currentStatusFilter = '';
let currentTypeFilter = '';

// Load reports on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for filters
    document.getElementById('report-search').addEventListener('input', debounce(handleReportSearch, 300));
    document.getElementById('status-filter').addEventListener('change', handleReportFilterChange);
    document.getElementById('type-filter').addEventListener('change', handleReportFilterChange);
});

function loadReportsPage(page, search = '', status = '', type = '') {
    const tbody = document.getElementById('reports-tbody');
    const paginationContainer = document.getElementById('report-pagination-container');

    // Show loading state
    tbody.innerHTML = `
        <tr id="loading-row">
            <td colspan="9" style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                Loading reports...
            </td>
        </tr>
    `;

    // Build query parameters
    const params = new URLSearchParams({
        'get_filtered_ojt_reports': '1',
        'page': page,
        'search': search,
        'status': status,
        'type': type
    });

    fetch(`?${params.toString()}`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        updateReportsTable(data);
        updateReportsPagination(data.pagination, page);

        // Update current state
        currentReportPage = page;
        currentReportSearch = search;
        currentStatusFilter = status;
        currentTypeFilter = type;
    })
    .catch(error => {
        console.error('Error loading reports:', error);
        tbody.innerHTML = `
            <tr id="error-row">
                <td colspan="9" style="text-align: center; padding: 20px; color: #dc3545; font-weight: 500;">
                    <i class='bx bx-error'></i> Error loading data. Please try again.
                </td>
            </tr>
        `;
    });
}

function updateReportsTable(data) {
    const tbody = document.getElementById('reports-tbody');

    if (!data.ojt_reports || data.ojt_reports.length === 0) {
        tbody.innerHTML = `
            <tr id="no-data-row">
                <td colspan="9" style="text-align: center; padding: 40px; font-style: italic; color: #6c757d;">
                    <i class='bx bx-file' style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No reports found matching your criteria
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    data.ojt_reports.forEach(report => {
        const reportDate = new Date(report.report_date);
        const formattedDate = reportDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        html += `
            <tr>
                <td>${report.id}</td>
                <td>
                    <strong>${escapeHtml(report.title)}</strong>
                    ${report.is_complaint_report ? '<span class="complaint-badge">Complaint</span>' : ''}
                </td>
                <td>
                    <span class="type-badge type-${report.report_type}">
                        ${escapeHtml(report.report_type_display)}
                    </span>
                </td>
                <td>${escapeHtml(report.student_name)}</td>
                <td>${escapeHtml(report.company_name)}</td>
                <td>${formattedDate}</td>
                <td>
                    <span class="status-badge status-${report.status}">
                        ${escapeHtml(report.status_display)}
                    </span>
                </td>
                <td>
                    ${report.has_attachment ?
                        '<i class=\'bx bx-file\' title="Has attachment"></i>' :
                        '<span class="text-muted">None</span>'
                    }
                </td>
                <td class="action-buttons">
                    <!-- View button - always visible -->
                    <button class="btn-action view-btn" onclick="openReportViewModal(${report.id})" title="View">
                        <i class='bx bx-show'></i>
                    </button>

                    <!-- Edit button -->
                    ${report.can_edit ? `
                    <button class="btn-action edit-btn" onclick="openReportEditModal(${report.id})" title="Edit">
                        <i class='bx bx-edit'></i>
                    </button>
                    ` : ''}

                    <!-- Review button -->
                    ${report.can_review ? `
                    <button class="btn-action review-btn" onclick="openReportReviewModal(${report.id})" title="Review">
                        <i class='bx bx-check'></i>
                    </button>
                    ` : ''}

                    <!-- Archive button -->
                    ${report.can_archive ? `
                    <button class="btn-action archive-btn" onclick="openReportArchiveModal(${report.id})" title="Archive">
                        <i class='bx bx-archive'></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function updateReportsPagination(pagination, currentPage) {
    const container = document.getElementById('report-pagination-container');

    if (!pagination || pagination.count === 0) {
        container.innerHTML = `
            <div class="pagination-info">
                No reports found
            </div>
        `;
        return;
    }

    const totalCount = pagination.count || 0;
    const startIndex = pagination.start_index || 1;
    const endIndex = pagination.end_index || totalCount;

    if (pagination.num_pages <= 1) {
        container.innerHTML = `
            <div class="pagination-info">
                Showing ${totalCount} report${totalCount === 1 ? '' : 's'}
            </div>
        `;
        return;
    }

    let paginationHTML = `
        <div class="pagination-info">
            Showing ${startIndex} to ${endIndex} of ${totalCount} entries
        </div>
        <div class="pagination-controls">
    `;

    // Previous buttons
    if (pagination.has_previous) {
        paginationHTML += `
            <a href="javascript:void(0)" class="pagination-btn first-page" title="First Page" onclick="loadReportsPageWithCurrentFilters(1)">
                <i class='bx bx-chevrons-left'></i>
            </a>
            <a href="javascript:void(0)" class="pagination-btn prev-page" title="Previous Page" onclick="loadReportsPageWithCurrentFilters(${currentPage - 1})">
                <i class='bx bx-chevron-left'></i>
            </a>
        `;
    } else {
        paginationHTML += `
            <span class="pagination-btn first-page disabled" title="First Page">
                <i class='bx bx-chevrons-left'></i>
            </span>
            <span class="pagination-btn prev-page disabled" title="Previous Page">
                <i class='bx bx-chevron-left'></i>
            </span>
        `;
    }

    // Page numbers
    paginationHTML += `<div class="page-numbers">`;

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(pagination.num_pages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<span class="pagination-btn current-page active">${i}</span>`;
        } else {
            paginationHTML += `<a href="javascript:void(0)" class="pagination-btn page-number" onclick="loadReportsPageWithCurrentFilters(${i})">${i}</a>`;
        }
    }

    paginationHTML += `</div>`;

    // Next buttons
    if (pagination.has_next) {
        paginationHTML += `
            <a href="javascript:void(0)" class="pagination-btn next-page" title="Next Page" onclick="loadReportsPageWithCurrentFilters(${currentPage + 1})">
                <i class='bx bx-chevron-right'></i>
            </a>
            <a href="javascript:void(0)" class="pagination-btn last-page" title="Last Page" onclick="loadReportsPageWithCurrentFilters(${pagination.num_pages})">
                <i class='bx bx-chevrons-right'></i>
            </a>
        `;
    } else {
        paginationHTML += `
            <span class="pagination-btn next-page disabled" title="Next Page">
                <i class='bx bx-chevron-right'></i>
            </span>
            <span class="pagination-btn last-page disabled" title="Last Page">
                <i class='bx bx-chevrons-right'></i>
            </span>
        `;
    }

    paginationHTML += `</div>`;
    container.innerHTML = paginationHTML;
}

// Helper function to load page with current filters
function loadReportsPageWithCurrentFilters(page) {
    loadReportsPage(
        page,
        currentReportSearch,
        currentStatusFilter,
        currentTypeFilter
    );
}

function handleReportSearch() {
    currentReportPage = 1;
    currentReportSearch = document.getElementById('report-search').value;
    loadReportsPageWithCurrentFilters(1);
}

function handleReportFilterChange() {
    currentReportPage = 1;
    currentStatusFilter = document.getElementById('status-filter').value;
    currentTypeFilter = document.getElementById('type-filter').value;
    loadReportsPageWithCurrentFilters(1);
}

// Refresh reports table after successful operations
function refreshReportsTable() {
    loadReportsPageWithCurrentFilters(currentReportPage);
}

// -------------------------------------------- Create/Add Report Functions -------------------------------------------
function openReportCreateModal() {
    const modal = document.getElementById('reportCreateModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialize file upload
    initializeFileUpload();

    // Set up report type change handler
    setupReportTypeHandler();

    // Focus on first input field
    setTimeout(() => {
        document.getElementById('id_title').focus();
    }, 300);
}

function closeReportCreateModal() {
    const modal = document.getElementById('reportCreateModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('reportCreateForm').reset();
    document.getElementById('reportFormResponse').innerHTML = '';
    document.getElementById('fileList').innerHTML = '';
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Reset period fields visibility
    togglePeriodFieldsVisibility();
}

function setupReportTypeHandler() {
    const reportTypeSelect = document.getElementById('id_report_type');
    reportTypeSelect.addEventListener('change', togglePeriodFieldsVisibility);
    togglePeriodFieldsVisibility(); // Initial state
}

function togglePeriodFieldsVisibility() {
    const reportType = document.getElementById('id_report_type').value;
    const periodFields = document.querySelector('.period-fields');
    const periodInputs = document.querySelectorAll('#id_period_start, #id_period_end');

    if (reportType === 'weekly' || reportType === 'monthly') {
        periodFields.style.display = 'block';
        periodInputs.forEach(input => input.required = true);
    } else {
        periodFields.style.display = 'none';
        periodInputs.forEach(input => input.required = false);
    }
}

function initializeFileUpload() {
    const fileInput = document.getElementById('id_attachments');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileList = document.getElementById('fileList');

    // Drag and drop functionality
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });
}

function handleFiles(files) {
    const fileList = document.getElementById('fileList');

    Array.from(files).forEach(file => {
        if (validateFile(file)) {
            addFileToList(file);
        }
    });
}

function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    if (file.size > maxSize) {
        showErrorToast('File size must be less than 10MB');
        return false;
    }

    if (!allowedTypes.includes(file.type)) {
        showErrorToast('File type not supported. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
        return false;
    }

    return true;
}

function addFileToList(file) {
    const fileList = document.getElementById('fileList');
    const fileId = 'file-' + Date.now();

    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <div class="file-info">
            <span class="file-icon">${getFileIcon(file.type)}</span>
            <div class="file-details">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
        </div>
        <button type="button" class="file-remove" onclick="removeFile('${fileId}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    fileItem.id = fileId;
    fileItem.dataset.fileName = file.name;

    fileList.appendChild(fileItem);
}

function removeFile(fileId) {
    const fileItem = document.getElementById(fileId);
    if (fileItem) {
        fileItem.remove();
    }
}

function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Handle form submission
document.getElementById('reportCreateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('reportFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    let hasEmptyFields = false;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'This field is required';
            field.parentNode.appendChild(errorDiv);
            hasEmptyFields = true;

            if (!formResponse.querySelector('.response-error')) {
                formResponse.innerHTML = `
                    <div class="response-message response-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        Please fill in all required fields.
                    </div>
                `;
            }
        }
    });

    // Validate period dates for weekly/monthly reports
    const reportType = document.getElementById('id_report_type').value;
    const periodStart = document.getElementById('id_period_start').value;
    const periodEnd = document.getElementById('id_period_end').value;

    if ((reportType === 'weekly' || reportType === 'monthly') && (!periodStart || !periodEnd)) {
        formResponse.innerHTML = `
            <div class="response-message response-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Period start and end dates are required for ${reportType} reports.
            </div>
        `;
        submitBtn.classList.remove('is-loading');
        return;
    }

    if (periodStart && periodEnd && new Date(periodEnd) <= new Date(periodStart)) {
        document.getElementById('id_period_end').classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Period end date must be after start date';
        document.getElementById('id_period_end').parentNode.appendChild(errorDiv);
        submitBtn.classList.remove('is-loading');
        return;
    }

    if (hasEmptyFields) {
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Create FormData - let the browser handle file inputs automatically
    const formData = new FormData(form);

    // Debug: Log files before submission
    const fileInput = document.getElementById('id_attachments');
    console.log('DEBUG: Files in input:', fileInput.files.length);
    console.log('DEBUG: File names:', Array.from(fileInput.files).map(f => f.name));

    fetch(form.action, {
        method: 'POST',
        body: formData, // Let FormData handle files automatically
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
        console.log('DEBUG: Server response:', data);
        if (data.success) {
            showSuccessToast('Report submitted successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Report submitted successfully! Refreshing data...
                </div>
            `;

            setTimeout(() => {
                closeReportCreateModal();
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

// ------------------------------------------------ View Report Functions ----------------------------------------------
function openReportViewModal(reportId) {
    console.log('DEBUG: Opening report view modal for ID:', reportId);
    showReportLoadingState(true);

    fetch(`/ojt-reports/${reportId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleReportResponse)
    .then(data => {
        console.log('DEBUG: Received report data:', data);
        if (data.success) {
            populateReportModalData(data.report);
            showReportModal();
        } else {
            throw new Error(data.error || 'Failed to load report details');
        }
    })
    .catch(handleReportError)
    .finally(() => {
        showReportLoadingState(false);
    });
}

function populateReportModalData(report) {
    console.log('DEBUG: Populating modal with report data:', report);

    // Basic Report Information
    document.getElementById('viewReportTitle').textContent = report.title || '-';
    document.getElementById('viewReportType').textContent = report.report_type_display || '-';
    document.getElementById('viewReportStatus').textContent = report.status_display || '-';
    document.getElementById('viewReportDate').textContent = formatDate(report.report_date) || '-';
    document.getElementById('viewReportSubmitter').textContent = report.submitted_by || '-';
    document.getElementById('viewReportSubmitDate').textContent = formatDateTime(report.submitted_at) || '-';

    // Style report type and status badges
    if (report.report_type && report.status) {
        styleReportBadges(report.report_type, report.status);
    }

    // Student Information
    document.getElementById('viewStudentName').textContent = report.student_name || '-';
    document.getElementById('viewStudentCourse').textContent = report.student_course || 'Not specified';
    document.getElementById('viewStudentYearSection').textContent =
        `${report.student_year_level || 'N/A'} - ${report.student_section || 'N/A'}`;

    // Reporting Period (for weekly/monthly reports)
    populateReportingPeriod(report);

    // Report Content
    populateReportContent(report.description, report.issues_challenges);

    // Review Information
    populateReviewInformation(report);

    // Attachments
    populateAttachments(report.attachments, report.total_attachments);
}

function styleReportBadges(reportType, status) {
    const typeBadge = document.getElementById('viewReportType');
    const statusBadge = document.getElementById('viewReportStatus');

    // Style report type badge
    typeBadge.className = 'report-type-badge';
    typeBadge.classList.add(`type-${reportType}`);

    // Style status badge
    statusBadge.className = 'report-status-badge';
    statusBadge.classList.add(`status-${status}`);
}

function populateReportingPeriod(report) {
    const periodSection = document.getElementById('viewReportPeriodSection');

    if (report.period_start && report.period_end) {
        document.getElementById('viewPeriodStart').textContent = formatDate(report.period_start);
        document.getElementById('viewPeriodEnd').textContent = formatDate(report.period_end);
        document.getElementById('viewPeriodDuration').textContent = report.period_duration ? `${report.period_duration} days` : 'N/A';
        periodSection.style.display = 'block';
    } else {
        periodSection.style.display = 'none';
    }
}

function populateReportContent(description, issues) {
    const descriptionElement = document.getElementById('viewReportDescription');
    const issuesSection = document.getElementById('viewIssuesSection');
    const issuesElement = document.getElementById('viewReportIssues');

    // Populate description
    if (description && description.trim()) {
        descriptionElement.innerHTML = `
            <div class="content-text-inner">
                ${escapeHtml(description).replace(/\n/g, '<br>')}
            </div>
        `;
    } else {
        descriptionElement.innerHTML = `
            <div class="no-content-message">
                <i class='bx bx-note'></i>
                <p>No description provided</p>
            </div>
        `;
    }

    // Populate issues & challenges
    if (issues && issues.trim()) {
        issuesElement.innerHTML = `
            <div class="content-text-inner">
                ${escapeHtml(issues).replace(/\n/g, '<br>')}
            </div>
        `;
        issuesSection.style.display = 'block';
    } else {
        issuesSection.style.display = 'none';
    }
}

function populateReviewInformation(report) {
    const reviewSection = document.getElementById('viewReviewSection');

    if (report.reviewed_by && report.status === 'reviewed') {
        document.getElementById('viewReviewedBy').textContent = report.reviewed_by;
        document.getElementById('viewReviewedAt').textContent = formatDateTime(report.reviewed_at);

        const feedbackElement = document.getElementById('viewReviewFeedback');
        if (report.feedback && report.feedback.trim()) {
            feedbackElement.innerHTML = `
                <div class="feedback-text">
                    ${escapeHtml(report.feedback).replace(/\n/g, '<br>')}
                </div>
            `;
        } else {
            feedbackElement.innerHTML = `
                <div class="no-feedback-message">
                    <i class='bx bx-message-rounded'></i>
                    <span>No feedback provided</span>
                </div>
            `;
        }
        reviewSection.style.display = 'block';
    } else {
        reviewSection.style.display = 'none';
    }
}

function populateAttachments(attachments, totalAttachments) {
    const attachmentsList = document.getElementById('viewReportAttachments');
    const attachmentsCount = document.getElementById('viewAttachmentsCount');

    // Update attachments count
    attachmentsCount.textContent = `${totalAttachments} file${totalAttachments !== 1 ? 's' : ''}`;

    if (totalAttachments === 0) {
        attachmentsList.innerHTML = `
            <div class="no-attachments-message">
                <i class='bx bx-file-blank'></i>
                <p>No attachments</p>
                <small class="no-attachments-subtext">This report has no attached files</small>
            </div>
        `;
        return;
    }

    let html = '';

    attachments.forEach(attachment => {
        const fileSize = formatFileSize(attachment.file_size);

        html += `
            <div class="attachment-item">
                <div class="attachment-icon">
                    <i class='${attachment.file_type_icon}'></i>
                </div>
                <div class="attachment-info">
                    <div class="attachment-name">${escapeHtml(attachment.file_name)}</div>
                    <div class="attachment-meta">
                        <span class="attachment-size">${fileSize}</span>
                        <span class="attachment-date">${formatDateTime(attachment.uploaded_at)}</span>
                    </div>
                </div>
                <div class="attachment-actions">
                    <a href="${attachment.file_url}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="attachment-download"
                       title="Download file">
                        <i class='bx bx-download'></i>
                    </a>
                </div>
            </div>
        `;
    });

    attachmentsList.innerHTML = html;
}

function formatFileSize(bytes) {
    if (!bytes) return '0 bytes';

    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

function showReportModal() {
    const modal = document.getElementById('reportViewModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReportViewModal() {
    const modal = document.getElementById('reportViewModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear previous data
    clearReportModalData();
}

function clearReportModalData() {
    const elementsToClear = [
        'viewReportTitle', 'viewReportType', 'viewReportStatus', 'viewReportDate',
        'viewReportSubmitter', 'viewReportSubmitDate', 'viewStudentName',
        'viewStudentCourse', 'viewStudentYearSection', 'viewPeriodStart',
        'viewPeriodEnd', 'viewPeriodDuration', 'viewReportDescription',
        'viewReportIssues', 'viewReviewedBy', 'viewReviewedAt',
        'viewReviewFeedback', 'viewAttachmentsCount', 'viewReportAttachments'
    ];

    elementsToClear.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '';
    });

    // Hide optional sections
    const optionalSections = [
        'viewReportPeriodSection',
        'viewIssuesSection',
        'viewReviewSection'
    ];

    optionalSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

function showReportLoadingState(show) {
    const modal = document.getElementById('reportViewModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#reportModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'reportModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading report details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#reportModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleReportResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleReportError(error) {
    console.error('Error loading report details:', error);
    showErrorToast(error.message || 'Failed to load report details');
}

// Utility functions
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '-';

    try {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateTimeString;
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.openReportViewModal = openReportViewModal;
window.closeReportViewModal = closeReportViewModal;

// ------------------------------------------- Edit Modal Functions -----------------------------------------------------
function openReportEditModal(reportId) {
    console.log('DEBUG: Opening report edit modal for ID:', reportId);
    showReportEditLoadingState(true);

    fetch(`/ojt-reports/${reportId}/edit/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        console.log('DEBUG: Fetch response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('DEBUG: Received report data for editing:', data);
        if (data.success) {
            populateReportEditForm(data.report);
            showReportEditModal();
        } else {
            throw new Error(data.error || 'Failed to load report details for editing');
        }
    })
    .catch(error => {
        console.error('Error loading report details for editing:', error);
        showErrorToast(error.message || 'Failed to load report details for editing');
    })
    .finally(() => {
        showReportEditLoadingState(false);
    });
}

function populateReportEditForm(report) {
    console.log('DEBUG: Populating edit form with report data:', report);

    // Set form values
    document.getElementById('editReportId').value = report.id;
    document.getElementById('editReportTitle').value = report.title || '';
    document.getElementById('editReportType').value = report.report_type || '';
    document.getElementById('editReportDate').value = report.report_date || '';
    document.getElementById('editReportDescription').value = report.description || '';
    document.getElementById('editReportIssues').value = report.issues_challenges || '';

    // Set period dates
    if (report.period_start) {
        document.getElementById('editPeriodStart').value = report.period_start;
    }
    if (report.period_end) {
        document.getElementById('editPeriodEnd').value = report.period_end;
    }

    // Set current status display
    const statusElement = document.getElementById('editReportCurrentStatus');
    statusElement.textContent = report.status_display || 'Submitted';
    statusElement.className = 'status-badge';
    statusElement.classList.add(`status-${report.status || 'submitted'}`);

    // Set submission info
    document.getElementById('editReportSubmittedBy').textContent = report.submitted_by || '-';
    document.getElementById('editReportSubmittedAt').textContent = formatDateTime(report.submitted_at) || '-';

    // Populate applications dropdown - FIXED: Remove .then() since it's not a Promise
    populateApplicationsDropdown(report.application_id);

    // Toggle period fields based on report type
    toggleEditPeriodFieldsVisibility();

    // Populate current attachments
    populateCurrentAttachments(report.attachments);

    // Set form action
    const form = document.getElementById('reportEditForm');
    form.action = `/ojt-reports/${report.id}/edit/`;
}

function populateApplicationsDropdown(currentApplicationId) {
    const applicationsSelect = document.getElementById('editReportApplication');
    console.log('DEBUG: Populating applications dropdown for current application:', currentApplicationId);

    // Clear existing options except the first one
    while (applicationsSelect.options.length > 1) {
        applicationsSelect.remove(1);
    }

    // Get applications data from the template (passed from Django context)
    const approvedApplications = window.ojtApprovedApplications || [];
    console.log('DEBUG: Available approved applications:', approvedApplications);

    if (approvedApplications && approvedApplications.length > 0) {
        approvedApplications.forEach(app => {
            const option = document.createElement('option');
            option.value = app.id;
            // Use the correct field names based on your Django model
            option.textContent = `${app.company.name} - ${app.student.get_full_name()}`;
            option.selected = (app.id == currentApplicationId);
            applicationsSelect.appendChild(option);
        });
        console.log('DEBUG: Successfully populated', approvedApplications.length, 'applications');
    } else {
        console.warn('DEBUG: No approved applications found in template context');
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No approved applications found";
        option.disabled = true;
        applicationsSelect.appendChild(option);
    }

    // Return a resolved promise for compatibility
    return Promise.resolve();
}

function populateCurrentAttachments(attachments) {
    const attachmentsContainer = document.getElementById('editCurrentAttachments');

    if (!attachments || attachments.length === 0) {
        attachmentsContainer.innerHTML = `
            <div class="no-attachments-message">
                <i class='bx bx-file-blank'></i>
                <span>No attachments</span>
            </div>
        `;
        return;
    }

    let html = '<div class="attachments-list">';

    attachments.forEach(attachment => {
        const fileSize = formatFileSize(attachment.file_size);

        html += `
            <div class="attachment-item existing-attachment" data-attachment-id="${attachment.id}">
                <div class="attachment-info">
                    <div class="attachment-icon">
                        <i class='${attachment.file_type_icon}'></i>
                    </div>
                    <div class="attachment-details">
                        <span class="attachment-name">${escapeHtml(attachment.file_name)}</span>
                        <span class="attachment-meta">${fileSize} • ${formatDateTime(attachment.uploaded_at)}</span>
                    </div>
                </div>
                <div class="attachment-actions">
                    <a href="${attachment.file_url}" target="_blank" class="attachment-download" title="Download">
                        <i class='bx bx-download'></i>
                    </a>
                    <button type="button" class="attachment-remove" onclick="removeExistingAttachment(${attachment.id})" title="Remove">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    attachmentsContainer.innerHTML = html;
}

function removeExistingAttachment(attachmentId) {
    if (!confirm('Are you sure you want to remove this attachment? This action cannot be undone.')) {
        return;
    }

    showReportEditLoadingState(true);

    fetch(`/ojt-reports/attachments/${attachmentId}/delete/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessToast('Attachment removed successfully!');
            // Remove the attachment from the UI
            const attachmentElement = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
            if (attachmentElement) {
                attachmentElement.remove();
            }

            // Check if no attachments left
            const attachmentsContainer = document.getElementById('editCurrentAttachments');
            const remainingAttachments = attachmentsContainer.querySelectorAll('.existing-attachment');
            if (remainingAttachments.length === 0) {
                attachmentsContainer.innerHTML = `
                    <div class="no-attachments-message">
                        <i class='bx bx-file-blank'></i>
                        <span>No attachments</span>
                    </div>
                `;
            }
        } else {
            throw new Error(data.error || 'Failed to remove attachment');
        }
    })
    .catch(error => {
        console.error('Error removing attachment:', error);
        showErrorToast(error.message || 'Failed to remove attachment');
    })
    .finally(() => {
        showReportEditLoadingState(false);
    });
}

function showReportEditModal() {
    const modal = document.getElementById('reportEditModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialize file upload for new attachments
    initializeEditFileUpload();

    // Set up report type change handler
    setupEditReportTypeHandler();

    // Focus on first input field
    setTimeout(() => {
        document.getElementById('editReportTitle').focus();
    }, 300);
}

function closeReportEditModal() {
    const modal = document.getElementById('reportEditModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear form and errors
    document.getElementById('reportEditForm').reset();
    document.getElementById('reportEditFormResponse').innerHTML = '';
    document.getElementById('editFileList').innerHTML = '';
    document.querySelectorAll('#reportEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#reportEditModal .error-message').forEach(el => el.remove());

    // Reset period fields visibility
    toggleEditPeriodFieldsVisibility();
}

function setupEditReportTypeHandler() {
    const reportTypeSelect = document.getElementById('editReportType');
    reportTypeSelect.addEventListener('change', toggleEditPeriodFieldsVisibility);
}

function toggleEditPeriodFieldsVisibility() {
    const reportType = document.getElementById('editReportType').value;
    const periodFields = document.getElementById('periodFieldsEdit');
    const periodInputs = document.querySelectorAll('#editPeriodStart, #editPeriodEnd');

    if (reportType === 'weekly' || reportType === 'monthly') {
        periodFields.style.display = 'block';
        periodInputs.forEach(input => input.required = true);
    } else {
        periodFields.style.display = 'none';
        periodInputs.forEach(input => input.required = false);
    }
}

function initializeEditFileUpload() {
    const fileInput = document.getElementById('editReportAttachments');
    const fileUploadArea = document.getElementById('editFileUploadArea');
    const fileList = document.getElementById('editFileList');

    // Clear existing event listeners
    const newUploadArea = fileUploadArea.cloneNode(true);
    fileUploadArea.parentNode.replaceChild(newUploadArea, fileUploadArea);

    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    // Reinitialize event listeners
    const currentUploadArea = document.getElementById('editFileUploadArea');
    const currentFileInput = document.getElementById('editReportAttachments');

    currentUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        currentUploadArea.classList.add('dragover');
    });

    currentUploadArea.addEventListener('dragleave', () => {
        currentUploadArea.classList.remove('dragover');
    });

    currentUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        currentUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleEditFiles(e.dataTransfer.files);
        }
    });

    currentUploadArea.addEventListener('click', () => {
        currentFileInput.click();
    });

    currentFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleEditFiles(e.target.files);
        }
    });
}

function handleEditFiles(files) {
    const fileList = document.getElementById('editFileList');

    Array.from(files).forEach(file => {
        if (validateFile(file)) {
            addEditFileToList(file);
        }
    });
}

function addEditFileToList(file) {
    const fileList = document.getElementById('editFileList');
    const fileId = 'edit-file-' + Date.now();

    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <div class="file-info">
            <span class="file-icon">${getFileIcon(file.type)}</span>
            <div class="file-details">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
        </div>
        <button type="button" class="file-remove" onclick="removeEditFile('${fileId}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    fileItem.id = fileId;
    fileItem.dataset.fileName = file.name;

    fileList.appendChild(fileItem);
}

function removeEditFile(fileId) {
    const fileItem = document.getElementById(fileId);
    if (fileItem) {
        fileItem.remove();
    }
}

function showReportEditLoadingState(show) {
    const modal = document.getElementById('reportEditModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#reportEditModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'reportEditModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading report details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#reportEditModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

// Handle edit form submission
document.getElementById('reportEditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('reportEditFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('#reportEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#reportEditModal .error-message').forEach(el => el.remove());

    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    let hasEmptyFields = false;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'This field is required';
            field.parentNode.appendChild(errorDiv);
            hasEmptyFields = true;

            if (!formResponse.querySelector('.response-error')) {
                formResponse.innerHTML = `
                    <div class="response-message response-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        Please fill in all required fields.
                    </div>
                `;
            }
        }
    });

    // Validate period dates for weekly/monthly reports
    const reportType = document.getElementById('editReportType').value;
    const periodStart = document.getElementById('editPeriodStart').value;
    const periodEnd = document.getElementById('editPeriodEnd').value;

    if ((reportType === 'weekly' || reportType === 'monthly') && (!periodStart || !periodEnd)) {
        formResponse.innerHTML = `
            <div class="response-message response-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Period start and end dates are required for ${reportType} reports.
            </div>
        `;
        submitBtn.classList.remove('is-loading');
        return;
    }

    if (periodStart && periodEnd && new Date(periodEnd) <= new Date(periodStart)) {
        document.getElementById('editPeriodEnd').classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Period end date must be after start date';
        document.getElementById('editPeriodEnd').parentNode.appendChild(errorDiv);
        submitBtn.classList.remove('is-loading');
        return;
    }

    if (hasEmptyFields) {
        submitBtn.classList.remove('is-loading');
        return;
    }

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
        console.log('DEBUG: Server response for edit:', data);
        if (data.success) {
            showSuccessToast('Report updated successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Report updated successfully! Refreshing data...
                </div>
            `;

            setTimeout(() => {
                closeReportEditModal();
                window.location.reload(); // Refresh the page to show updated data
            }, 1500);
        } else {
            showFormErrors(form, data.errors);
            if (data.message) {
                showErrorToast(data.message);
            }
        }
    })
    .catch(error => {
        console.error('Error updating report:', error);
        if (error.errors) {
            showFormErrors(form, error.errors);
        } else {
            showErrorToast(error.message || 'An unexpected error occurred while updating report');
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

// Make functions globally available
window.openReportEditModal = openReportEditModal;
window.closeReportEditModal = closeReportEditModal;
window.removeExistingAttachment = removeExistingAttachment;

// Utility functions (make sure these exist)
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return 'bx bxs-file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'bx bxs-file-doc';
    if (fileType.includes('image')) return 'bx bxs-file-image';
    if (fileType.includes('sheet')) return 'bx bxs-file-spreadsheet';
    return 'bx bxs-file';
}

function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

    if (file.size > maxSize) {
        showErrorToast('File size must be less than 10MB');
        return false;
    }

    if (!allowedTypes.includes(file.type)) {
        showErrorToast('File type not supported. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
        return false;
    }

    return true;
}

function showFormErrors(form, errors) {
    // Clear previous errors
    document.querySelectorAll('#reportEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#reportEditModal .error-message').forEach(el => el.remove());

    // Add new errors
    Object.keys(errors).forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errors[field].join(', ');
            input.parentNode.appendChild(errorDiv);
        }
    });
}

// --------------------------------------------- OJT Report Archive Functions ------------------------------------------
function openReportArchiveModal(reportId) {
    showReportArchiveLoadingState(true);

    fetch(`/ojt-reports/${reportId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleReportArchiveResponse)
    .then(data => {
        if (data.success) {
            populateReportArchiveModal(data.report);
            showReportArchiveModal();
        } else {
            throw new Error(data.error || 'Failed to load report details for archiving');
        }
    })
    .catch(handleReportArchiveError)
    .finally(() => {
        showReportArchiveLoadingState(false);
    });
}

function populateReportArchiveModal(report) {
    // Set report ID
    document.getElementById('archiveReportId').value = report.id;

    // Update modal description
    const description = document.getElementById('reportArchiveDescription');
    description.textContent = `Are you sure you want to archive "${report.title}"?`;

    // Populate report preview
    document.getElementById('archiveReportTitle').textContent = report.title;
    document.getElementById('archiveReportStudent').textContent = report.student_name || 'Not specified';
    document.getElementById('archiveReportCompany').textContent = report.company_name || 'Not specified';
    document.getElementById('archiveReportDate').textContent = formatDate(report.report_date) || '-';
    document.getElementById('archiveReportSubmittedBy').textContent = report.submitted_by || '-';
    document.getElementById('archiveReportSubmittedAt').textContent = formatDateTime(report.submitted_at) || '-';

    // Handle attachments count
    const attachmentsCount = report.total_attachments || 0;
    document.getElementById('archiveReportAttachments').textContent =
        attachmentsCount > 0 ? `${attachmentsCount} file(s)` : 'No attachments';

    // Set type badge
    const typeElement = document.getElementById('archiveReportType');
    typeElement.textContent = report.report_type_display || report.report_type || '-';
    typeElement.className = 'type-badge';
    typeElement.classList.add(`type-${report.report_type}`);

    // Set status badge
    const statusElement = document.getElementById('archiveReportStatus');
    statusElement.textContent = report.status_display || report.status || '-';
    statusElement.className = 'status-badge';
    statusElement.classList.add(`status-${report.status}`);

    // Handle period information for weekly/monthly reports
    const periodInfo = document.getElementById('archivePeriodInfo');
    const periodElement = document.getElementById('archiveReportPeriod');

    if (report.period_start && report.period_end) {
        periodElement.textContent = `${formatDate(report.period_start)} to ${formatDate(report.period_end)}`;
        periodInfo.style.display = 'block';
    } else {
        periodInfo.style.display = 'none';
    }

    // Handle description preview
    const descriptionElement = document.getElementById('archiveReportDescription');
    if (report.description && report.description.trim()) {
        const truncatedDescription = report.description.length > 150 ?
            report.description.substring(0, 150) + '...' : report.description;
        descriptionElement.textContent = truncatedDescription;
    } else {
        descriptionElement.textContent = 'No description provided';
        descriptionElement.style.fontStyle = 'italic';
        descriptionElement.style.color = '#6b7280';
    }

    // Show/hide review status warning
    const reviewWarning = document.getElementById('reviewStatusWarning');
    if (report.status === 'reviewed') {
        reviewWarning.style.display = 'flex';
    } else {
        reviewWarning.style.display = 'none';
    }

    // Set form action
    const form = document.getElementById('reportArchiveForm');
    form.action = `/ojt-reports/${report.id}/archive/`;
}

function showReportArchiveModal() {
    const modal = document.getElementById('reportArchiveModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReportArchiveModal() {
    const modal = document.getElementById('reportArchiveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear form response
    document.getElementById('reportArchiveFormResponse').innerHTML = '';
}

function showReportArchiveLoadingState(show) {
    const modal = document.getElementById('reportArchiveModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#reportArchiveModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'reportArchiveModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading report details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#reportArchiveModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleReportArchiveResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleReportArchiveError(error) {
    console.error('Error loading report details for archiving:', error);
    showErrorToast(error.message || 'Failed to load report details for archiving');
}

// Handle archive form submission
document.getElementById('reportArchiveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const reportId = document.getElementById('archiveReportId').value;
    const reportTitle = document.getElementById('archiveReportTitle').textContent;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('reportArchiveFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Removed confirmation dialog since the modal itself serves as the confirmation

    fetch(form.action, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw {
                    userFriendly: true,
                    message: err.error || 'Failed to archive report'
                };
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast(data.message || `"${reportTitle}" has been archived successfully!`);
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    ${data.message || 'Report archived successfully! This window will close shortly...'}
                </div>
            `;

            setTimeout(() => {
                closeReportArchiveModal();
                // Reload the page to reflect changes
                window.location.reload();
            }, 1500);
        } else {
            showErrorToast(data.error || `Failed to archive "${reportTitle}"`);
            showReportArchiveError(data.error || 'Failed to archive report');
        }
    })
    .catch(error => {
        console.error('Error archiving report:', error);
        const errorMessage = error.userFriendly ?
            error.message :
            'An unexpected error occurred while processing your request.';
        showErrorToast(errorMessage);
        showReportArchiveError(errorMessage);
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

function showReportArchiveError(message) {
    const formResponse = document.getElementById('reportArchiveFormResponse');
    formResponse.innerHTML = `
        <div class="response-message response-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            ${message}
        </div>
    `;
}

// Make functions globally available
window.openReportArchiveModal = openReportArchiveModal;
window.closeReportArchiveModal = closeReportArchiveModal;

// --------------------------------------------- OJT Report Review Functions ------------------------------------------
function openReportReviewModal(reportId) {
    showReportReviewLoadingState(true);

    fetch(`/ojt-reports/${reportId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleReportReviewResponse)
    .then(data => {
        if (data.success) {
            populateReportReviewModal(data.report);
            showReportReviewModal();
        } else {
            throw new Error(data.error || 'Failed to load report details for review');
        }
    })
    .catch(handleReportReviewError)
    .finally(() => {
        showReportReviewLoadingState(false);
    });
}

function populateReportReviewModal(report) {
    // Set report ID
    document.getElementById('reviewReportId').value = report.id;

    // Update modal description
    const description = document.getElementById('reportReviewDescription');
    description.textContent = `Review and provide feedback for "${report.title}"`;

    // Populate report preview
    document.getElementById('reviewReportTitle').textContent = report.title;
    document.getElementById('reviewReportStudent').textContent = report.student_name || 'Not specified';
    document.getElementById('reviewReportCompany').textContent = report.company_name || 'Not specified';
    document.getElementById('reviewReportDate').textContent = formatDate(report.report_date) || '-';
    document.getElementById('reviewReportSubmittedBy').textContent = report.submitted_by || '-';
    document.getElementById('reviewReportSubmittedAt').textContent = formatDateTime(report.submitted_at) || '-';

    // Handle attachments count
    const attachmentsCount = report.total_attachments || 0;
    document.getElementById('reviewReportAttachments').textContent =
        attachmentsCount > 0 ? `${attachmentsCount} file(s)` : 'No attachments';

    // Set type badge
    const typeElement = document.getElementById('reviewReportType');
    typeElement.textContent = report.report_type_display || report.report_type || '-';
    typeElement.className = 'type-badge';
    typeElement.classList.add(`type-${report.report_type}`);

    // Handle period information for weekly/monthly reports
    const periodInfo = document.getElementById('reviewPeriodInfo');
    const periodElement = document.getElementById('reviewReportPeriod');

    if (report.period_start && report.period_end) {
        periodElement.textContent = `${formatDate(report.period_start)} to ${formatDate(report.period_end)}`;
        periodInfo.style.display = 'block';
    } else {
        periodInfo.style.display = 'none';
    }

    // Handle description preview
    const descriptionElement = document.getElementById('reviewReportDescription');
    if (report.description && report.description.trim()) {
        const truncatedDescription = report.description.length > 150 ?
            report.description.substring(0, 150) + '...' : report.description;
        descriptionElement.textContent = truncatedDescription;
    } else {
        descriptionElement.textContent = 'No description provided';
        descriptionElement.style.fontStyle = 'italic';
        descriptionElement.style.color = '#6b7280';
    }

    // Clear previous feedback
    document.getElementById('reviewFeedback').value = '';

    // Set form action
    const form = document.getElementById('reportReviewForm');
    form.action = `/ojt-reports/${report.id}/review/`;
}

function showReportReviewModal() {
    const modal = document.getElementById('reportReviewModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReportReviewModal() {
    const modal = document.getElementById('reportReviewModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear form response
    document.getElementById('reportReviewFormResponse').innerHTML = '';
}

function showReportReviewLoadingState(show) {
    const modal = document.getElementById('reportReviewModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#reportReviewModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'reportReviewModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading report details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#reportReviewModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleReportReviewResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleReportReviewError(error) {
    console.error('Error loading report details for review:', error);
    showErrorToast(error.message || 'Failed to load report details for review');
}

// Handle review form submission
document.getElementById('reportReviewForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const reportId = document.getElementById('reviewReportId').value;
    const reportTitle = document.getElementById('reviewReportTitle').textContent;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('reportReviewFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    fetch(form.action, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: new FormData(form)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw {
                    userFriendly: true,
                    message: err.error || 'Failed to review report'
                };
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast(data.message || `"${reportTitle}" has been marked as reviewed successfully!`);
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    ${data.message || 'Report reviewed successfully! This window will close shortly...'}
                </div>
            `;

            setTimeout(() => {
                closeReportReviewModal();
                // Reload the page to reflect changes
                window.location.reload();
            }, 1500);
        } else {
            showErrorToast(data.error || `Failed to review "${reportTitle}"`);
            showReportReviewError(data.error || 'Failed to review report');
        }
    })
    .catch(error => {
        console.error('Error reviewing report:', error);
        const errorMessage = error.userFriendly ?
            error.message :
            'An unexpected error occurred while processing your request.';
        showErrorToast(errorMessage);
        showReportReviewError(errorMessage);
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

function showReportReviewError(message) {
    const formResponse = document.getElementById('reportReviewFormResponse');
    formResponse.innerHTML = `
        <div class="response-message response-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            ${message}
        </div>
    `;
}

// Make functions globally available
window.openReportReviewModal = openReportReviewModal;
window.closeReportReviewModal = closeReportReviewModal;

// ----------------------------------------------- Export Modal Functions -----------------------------------------------
let exportReportsUrl = '';

function openReportExportModal() {
    console.log('Opening report export modal...');

    // Set current time
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleString();

    // Get the export URL from the button data attribute
    const exportBtn = document.getElementById('export-report-btn');
    if (exportBtn && exportBtn.dataset.exportUrl) {
        exportReportsUrl = exportBtn.dataset.exportUrl;
    } else {
        console.error('Export URL not found');
        showErrorToast('Export configuration error');
        return;
    }

    // Reset form to show all data by default
    resetExportForm();

    // Update preview
    updateExportPreview();

    const modal = document.getElementById('reportExportModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    console.log('Modal opened successfully');
}

function closeReportExportModal() {
    const modal = document.getElementById('reportExportModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form response
    document.getElementById('reportExportFormResponse').innerHTML = '';
}

function resetExportForm() {
    console.log('Resetting export form...');

    // Reset to show all data
    document.querySelectorAll('input[name^="status_"]').forEach(checkbox => {
        checkbox.checked = true;
    });

    document.querySelectorAll('input[name^="type_"]').forEach(checkbox => {
        checkbox.checked = true;
    });

    document.getElementById('exportReportTitle').value = 'OJT Reports Export';
    document.getElementById('includeAttachments').checked = false;
    document.getElementById('includeReviewDetails').checked = true;
    document.getElementById('enableDateRange').checked = false;

    // Hide date range section
    document.getElementById('dateRangeSection').style.display = 'none';

    // Clear date inputs
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';

    // Clear any existing errors
    const formResponse = document.getElementById('reportExportFormResponse');
    formResponse.innerHTML = '';

    // Enable submit button
    const submitBtn = document.getElementById('exportSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.title = '';

    console.log('Form reset complete - showing all data');
}

function applyPreset(preset) {
    console.log('Applying preset:', preset);

    // Reset all first
    document.querySelectorAll('input[name^="status_"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    document.querySelectorAll('input[name^="type_"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Apply preset
    switch(preset) {
        case 'all':
            // All status and all types
            document.querySelectorAll('input[name^="status_"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            document.querySelectorAll('input[name^="type_"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            break;

        case 'submitted':
            // Only submitted status, all types
            document.querySelector('input[name="status_submitted"]').checked = true;
            document.querySelectorAll('input[name^="type_"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            break;

        case 'reviewed':
            // Only reviewed status, all types
            document.querySelector('input[name="status_reviewed"]').checked = true;
            document.querySelectorAll('input[name^="type_"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            break;

        case 'weekly':
            // All status, only weekly type
            document.querySelectorAll('input[name^="status_"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            document.querySelector('input[name="type_weekly"]').checked = true;
            break;

        case 'monthly':
            // All status, only monthly type
            document.querySelectorAll('input[name^="status_"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            document.querySelector('input[name="type_monthly"]').checked = true;
            break;

        case 'final':
            // All status, only final type
            document.querySelectorAll('input[name^="status_"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            document.querySelector('input[name="type_final"]').checked = true;
            break;

        case 'incident':
            // All status, only incident type
            document.querySelectorAll('input[name^="status_"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            document.querySelector('input[name="type_incident"]').checked = true;
            break;

        case 'complaint':
            // All status, only complaint type
            document.querySelectorAll('input[name^="status_"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            document.querySelector('input[name="type_complaint"]').checked = true;
            break;
    }

    updateExportPreview();
    showSuccessToast(`Preset applied: ${getPresetDisplayName(preset)}`);
}

function getPresetDisplayName(preset) {
    const displayMap = {
        'all': 'All Reports',
        'submitted': 'Submitted Only',
        'reviewed': 'Reviewed Only',
        'weekly': 'Weekly Reports Only',
        'monthly': 'Monthly Reports Only',
        'final': 'Final Reports Only',
        'incident': 'Incident Reports Only',
        'complaint': 'Complaint Reports Only'
    };
    return displayMap[preset] || preset;
}

function updateExportPreview() {
    const includeAttachments = document.getElementById('includeAttachments').checked;
    const includeReviewDetails = document.getElementById('includeReviewDetails').checked;
    const enableDateRange = document.getElementById('enableDateRange').checked;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const exportTitle = document.getElementById('exportReportTitle').value || 'OJT Reports Export';

    // Get selected status
    const selectedStatus = [];
    document.querySelectorAll('input[name^="status_"]:checked').forEach(checkbox => {
        const status = checkbox.value;
        selectedStatus.push(status.charAt(0).toUpperCase() + status.slice(1));
    });

    // Get selected types
    const selectedTypes = [];
    document.querySelectorAll('input[name^="type_"]:checked').forEach(checkbox => {
        const type = checkbox.value;
        const typeMap = {
            'weekly': 'Weekly',
            'monthly': 'Monthly',
            'final': 'Final',
            'incident': 'Incident',
            'complaint': 'Complaint'
        };
        selectedTypes.push(typeMap[type] || type);
    });

    // Update preview texts
    document.getElementById('previewStatus').textContent = selectedStatus.length > 0 ? selectedStatus.join(', ') : 'None';
    document.getElementById('previewReportTypes').textContent = selectedTypes.length > 0 ? selectedTypes.join(', ') : 'None';
    document.getElementById('previewAttachments').textContent = includeAttachments ? 'Yes' : 'No';
    document.getElementById('previewReviewDetails').textContent = includeReviewDetails ? 'Yes' : 'No';
    document.getElementById('previewDateRange').textContent = getDateRangeDisplay(enableDateRange, startDate, endDate);
    document.getElementById('previewFilters').textContent = getFiltersSummary(selectedStatus, selectedTypes);

    // Update submit button state
    const submitBtn = document.getElementById('exportSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.title = '';

    // Validate selections
    if (selectedStatus.length === 0 && selectedTypes.length === 0) {
        submitBtn.disabled = true;
        submitBtn.title = 'Please select at least one status or report type';
    }

    // Validate date range if enabled
    if (enableDateRange) {
        if (!startDate || !endDate) {
            submitBtn.disabled = true;
            submitBtn.title = 'Please select both start and end dates';
        } else if (new Date(startDate) > new Date(endDate)) {
            submitBtn.disabled = true;
            submitBtn.title = 'Start date cannot be after end date';
        }
    }
}

function getDateRangeDisplay(enableDateRange, startDate, endDate) {
    if (!enableDateRange) return 'All Dates';
    if (!startDate || !endDate) return 'Invalid Date Range';
    return `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`;
}

function getFiltersSummary(selectedStatus, selectedTypes) {
    const filters = [];

    if (selectedStatus.length === 2) {
        filters.push('All Status');
    } else if (selectedStatus.length === 1) {
        filters.push(selectedStatus[0] + ' Only');
    } else if (selectedStatus.length === 0) {
        filters.push('No Status');
    }

    if (selectedTypes.length === 5) {
        filters.push('All Types');
    } else if (selectedTypes.length > 0) {
        filters.push(selectedTypes.length + ' Type(s)');
    } else {
        filters.push('No Types');
    }

    return filters.join(' + ');
}

function formatDisplayDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function validateExportForm() {
    const exportTitle = document.getElementById('exportReportTitle').value.trim();
    const enableDateRange = document.getElementById('enableDateRange').checked;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Check if at least one status or type is selected
    const hasStatus = document.querySelectorAll('input[name^="status_"]:checked').length > 0;
    const hasType = document.querySelectorAll('input[name^="type_"]:checked').length > 0;

    if (!hasStatus && !hasType) {
        return 'Please select at least one status or report type to export';
    }

    if (!exportTitle) {
        return 'Please enter a report title';
    }

    if (exportTitle.length > 100) {
        return 'Report title must be less than 100 characters';
    }

    if (enableDateRange) {
        if (!startDate || !endDate) {
            return 'Please select both start and end dates for date range filter';
        }

        if (new Date(startDate) > new Date(endDate)) {
            return 'Start date cannot be after end date';
        }
    }

    return null;
}

// Handle form submission
document.getElementById('reportExportForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (!exportReportsUrl) {
        showErrorToast('Export URL not configured');
        return;
    }

    const form = this;
    const formData = new FormData(form);

    // Enhanced debug logging
    console.log('=== EXPORT FORM DATA DEBUG ===');
    const formDataObj = {};
    for (let [key, value] of formData.entries()) {
        formDataObj[key] = value;
        console.log(`${key}: ${value}`);
    }
    console.log('Form data object:', formDataObj);
    console.log('=== END DEBUG ===');

    const submitBtn = document.getElementById('exportSubmitBtn');
    const formResponse = document.getElementById('reportExportFormResponse');

    // Validate form
    const validationError = validateExportForm();
    if (validationError) {
        showErrorToast(validationError);
        return;
    }

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Add loading state to form
    form.classList.add('is-submitting');

    fetch(exportReportsUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || `Export failed (${response.status})`);
                } catch {
                    if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
                        throw new Error(`Server error ${response.status}. Please try again.`);
                    }
                    throw new Error(text || `Export failed (${response.status})`);
                }
            });
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
                throw new Error(data.error || 'Export returned error response');
            });
        }

        return response.blob();
    })
    .then(blob => {
        if (!blob || blob.size === 0) {
            throw new Error('Export returned empty file');
        }

        if (blob.type.includes('application/json')) {
            return blob.text().then(text => {
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || 'Export failed');
            });
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        // Generate filename based on filters
        const selectedStatus = [];
        document.querySelectorAll('input[name^="status_"]:checked').forEach(checkbox => {
            selectedStatus.push(checkbox.value);
        });

        const selectedTypes = [];
        document.querySelectorAll('input[name^="type_"]:checked').forEach(checkbox => {
            selectedTypes.push(checkbox.value);
        });

        let filename = 'OJT_Reports';

        if (selectedStatus.length === 1) {
            filename += `_${selectedStatus[0]}`;
        }

        if (selectedTypes.length === 1) {
            filename += `_${selectedTypes[0]}`;
        } else if (selectedTypes.length < 5) {
            filename += `_${selectedTypes.length}types`;
        }

        const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '_');
        filename += `_${timestamp}.xlsx`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showSuccessToast('Export completed successfully!');
        closeReportExportModal();
    })
    .catch(error => {
        console.error('Export error:', error);
        const errorMessage = error.message || 'Export failed. Please try again.';
        showErrorToast(errorMessage);

        formResponse.innerHTML = `
            <div class="response-message response-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                ${errorMessage}
            </div>
        `;
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
        form.classList.remove('is-submitting');
    });
});

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing export modal event listeners...');

    const exportBtn = document.getElementById('export-report-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', openReportExportModal);
        console.log('Export button event listener added');
    }

    // Update preview when any filter changes
    document.querySelectorAll('input[name^="status_"], input[name^="type_"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateExportPreview);
    });

    document.getElementById('includeAttachments').addEventListener('change', updateExportPreview);
    document.getElementById('includeReviewDetails').addEventListener('change', updateExportPreview);
    document.getElementById('exportReportTitle').addEventListener('input', updateExportPreview);

    // Date range handling
    document.getElementById('enableDateRange').addEventListener('change', function() {
        const dateRangeSection = document.getElementById('dateRangeSection');
        dateRangeSection.style.display = this.checked ? 'block' : 'none';
        updateExportPreview();
    });

    document.getElementById('startDate').addEventListener('change', updateExportPreview);
    document.getElementById('endDate').addEventListener('change', updateExportPreview);

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeReportExportModal();
        }
    });

    console.log('All export modal event listeners initialized');
});

// Make functions globally available
window.openReportExportModal = openReportExportModal;
window.closeReportExportModal = closeReportExportModal;
window.applyPreset = applyPreset;