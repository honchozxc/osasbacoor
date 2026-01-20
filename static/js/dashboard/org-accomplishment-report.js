// ------------------------------- Accomplishment Report Search and Filter Function ------------------------------------

class AccomplishmentReportFilter {
    constructor() {
        this.currentFilters = {
            search: '',
            reportType: 'all',
            semester: 'all',
            schoolYear: 'all'
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.populateSchoolYearFilter();
        this.loadReports(); // Load initial data
    }

    bindEvents() {
        // Search input with debounce
        const searchInput = document.getElementById('accomplishmentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.search = searchInput.value.trim();
                this.loadReports();
            }, 300));
        }

        // Filter change events - auto-apply when changed
        const reportTypeFilter = document.getElementById('reportTypeFilter');
        if (reportTypeFilter) {
            reportTypeFilter.addEventListener('change', (e) => {
                this.currentFilters.reportType = e.target.value;
                this.loadReports();
            });
        }

        const semesterFilter = document.getElementById('semesterFilter');
        if (semesterFilter) {
            semesterFilter.addEventListener('change', (e) => {
                this.currentFilters.semester = e.target.value;
                this.loadReports();
            });
        }

        const schoolYearFilter = document.getElementById('schoolYearFilter');
        if (schoolYearFilter) {
            schoolYearFilter.addEventListener('change', (e) => {
                this.currentFilters.schoolYear = e.target.value;
                this.loadReports();
            });
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    populateSchoolYearFilter() {
        const schoolYearSelect = document.getElementById('schoolYearFilter');
        if (!schoolYearSelect) return;

        // Get current year
        const currentYear = new Date().getFullYear();

        // Generate school years (e.g., 2020-2021 to current year + 1)
        const startYear = 2020; // Adjust as needed
        const years = [];

        for (let year = startYear; year <= currentYear + 1; year++) {
            years.push(`${year}-${year + 1}`);
        }

        // Clear existing options except the first one
        while (schoolYearSelect.options.length > 1) {
            schoolYearSelect.remove(1);
        }

        // Add options in reverse chronological order
        years.reverse().forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            schoolYearSelect.appendChild(option);
        });
    }

    async loadReports() {
        this.showLoading();

        try {
            const params = new URLSearchParams();

            // Add filters to params
            if (this.currentFilters.search) {
                params.append('search', this.currentFilters.search);
            }
            if (this.currentFilters.reportType !== 'all') {
                params.append('report_type', this.currentFilters.reportType);
            }
            if (this.currentFilters.semester !== 'all') {
                params.append('semester', this.currentFilters.semester);
            }
            if (this.currentFilters.schoolYear !== 'all') {
                params.append('school_year', this.currentFilters.schoolYear);
            }

            // Add pagination
            params.append('accomplishment_page', '1');
            params.append('get_filtered_accomplishment_reports', '1');

            const response = await fetch(`?${params.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.updateTable(data.accomplishment_reports);
                this.updatePagination(data.pagination);
            } else {
                throw new Error(data.error || 'Failed to load reports');
            }
        } catch (error) {
            console.error('Error loading accomplishment reports:', error);
            this.showError('Failed to load reports. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    updateTable(reports) {
        const tableBody = document.querySelector('#accomplishment-reports-table tbody');
        if (!tableBody) return;

        if (!reports || reports.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table">
                        <div class="empty-state">
                            <i class='bx bxs-report'></i>
                            <p>No accomplishment reports found matching your filters</p>
                            <button class="secondary-btn" onclick="clearAccomplishmentFilters()">
                                <i class='bx bx-reset'></i> Clear Filters
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        reports.forEach(report => {
            const typeClass = this.getTypeClass(report.record_type);

            html += `
                <tr>
                    <td>
                        <div class="report-title-cell">
                            <strong class="report-title">${this.escapeHtml(report.title)}</strong>
                        </div>
                    </td>

                    <td>
                        <span class="type-badge ${typeClass}">
                            ${this.escapeHtml(report.record_type_display)}
                        </span>
                    </td>

                    <td>
                        <span class="semester-info">
                            ${this.escapeHtml(report.semester_display)}<br>
                            <small>${this.escapeHtml(report.school_year)}</small>
                        </span>
                    </td>

                    <td>
                        <span class="date-conducted">
                            ${this.formatDate(report.date_conducted)}
                        </span>
                    </td>

                    <td>
                        <span class="participant-count">
                            👥 ${report.number_of_participants}
                        </span>
                    </td>

                    <td class="actions-cell">
                        <div class="action-buttons">
                            <button class="btn-icon btn-view-ar" onclick="openAccomplishmentViewModal(${report.id})" title="View Report">
                                <i class="ri-eye-fill"></i>
                            </button>

                            ${report.can_edit ? `
                                <button class="btn-icon btn-edit-ar" onclick="openEditAccomplishmentModal(${report.id})" title="Edit Report">
                                    <i class='bx bx-edit'></i>
                                </button>

                                <button class="btn-icon btn-archive-ar" onclick="openArchiveAccomplishmentModal(${report.id}, '${this.escapeHtml(report.title)}')" title="Archive Report">
                                    <i class='bx bxs-archive'></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    updatePagination(pagination) {
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) return;

        if (!pagination || pagination.total_count === 0) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <div class="pagination-info">
                Showing ${pagination.start_index} to ${pagination.end_index} of ${pagination.total_count} entries
            </div>
            <div class="pagination-controls">
        `;

        // Previous buttons
        if (pagination.has_previous) {
            paginationHTML += `
                <a href="javascript:void(0)" class="pagination-btn first-page" onclick="accomplishmentFilter.loadPage(1)" title="First Page">
                    <i class='bx bx-chevrons-left'></i>
                </a>
                <a href="javascript:void(0)" class="pagination-btn prev-page" onclick="accomplishmentFilter.loadPage(${pagination.current_page - 1})" title="Previous Page">
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
        paginationHTML += '<div class="page-numbers">';

        // Show limited page numbers around current page
        const startPage = Math.max(1, pagination.current_page - 2);
        const endPage = Math.min(pagination.num_pages, pagination.current_page + 2);

        for (let i = startPage; i <= endPage; i++) {
            if (i === pagination.current_page) {
                paginationHTML += `<span class="pagination-btn current-page active">${i}</span>`;
            } else {
                paginationHTML += `<a href="javascript:void(0)" class="pagination-btn page-number" onclick="accomplishmentFilter.loadPage(${i})">${i}</a>`;
            }
        }

        paginationHTML += '</div>';

        // Next buttons
        if (pagination.has_next) {
            paginationHTML += `
                <a href="javascript:void(0)" class="pagination-btn next-page" onclick="accomplishmentFilter.loadPage(${pagination.current_page + 1})" title="Next Page">
                    <i class='bx bx-chevron-right'></i>
                </a>
                <a href="javascript:void(0)" class="pagination-btn last-page" onclick="accomplishmentFilter.loadPage(${pagination.num_pages})" title="Last Page">
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

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    async loadPage(pageNumber) {
        this.showLoading();

        try {
            const params = new URLSearchParams();

            // Add current filters
            Object.entries(this.currentFilters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    params.append(key, value);
                }
            });

            // Add pagination
            params.append('accomplishment_page', pageNumber.toString());
            params.append('get_filtered_accomplishment_reports', '1');

            const response = await fetch(`?${params.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.updateTable(data.accomplishment_reports);
                this.updatePagination(data.pagination);
                // Scroll to table
                const tableContainer = document.getElementById('accomplishment-reports-table-container');
                if (tableContainer) {
                    tableContainer.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            } else {
                throw new Error(data.error || 'Failed to load reports');
            }
        } catch (error) {
            console.error('Error loading accomplishment reports:', error);
            this.showError('Failed to load reports. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    clearFilters() {
        // Reset form elements
        const searchInput = document.getElementById('accomplishmentSearch');
        const reportTypeFilter = document.getElementById('reportTypeFilter');
        const semesterFilter = document.getElementById('semesterFilter');
        const schoolYearFilter = document.getElementById('schoolYearFilter');

        if (searchInput) searchInput.value = '';
        if (reportTypeFilter) reportTypeFilter.value = 'all';
        if (semesterFilter) semesterFilter.value = 'all';
        if (schoolYearFilter) schoolYearFilter.value = 'all';

        // Reset current filters
        this.currentFilters = {
            search: '',
            reportType: 'all',
            semester: 'all',
            schoolYear: 'all'
        };

        this.loadReports();
    }

    getTypeClass(recordType) {
        const classMap = {
            'event': 'event',
            'meeting': 'meeting',
            'training': 'training',
            'community': 'community',
            'achievement': 'achievement',
            'other': 'other'
        };

        return classMap[recordType] || 'other';
    }

    showLoading() {
        const tableContainer = document.getElementById('accomplishment-reports-table-container');
        if (!tableContainer) return;

        // Remove existing loading overlay
        const existingOverlay = tableContainer.querySelector('.loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create new loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';

        tableContainer.style.position = 'relative';
        tableContainer.appendChild(overlay);
    }

    hideLoading() {
        const tableContainer = document.getElementById('accomplishment-reports-table-container');
        if (!tableContainer) return;

        const overlay = tableContainer.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    showError(message) {
        // You can implement a toast notification system here
        console.error('Filter Error:', message);

        // Show error in a more user-friendly way
        const tableBody = document.querySelector('#accomplishment-reports-table tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table">
                        <div class="empty-state">
                            <i class='bx bx-error'></i>
                            <p>${message}</p>
                            <button class="secondary-btn" onclick="accomplishmentFilter.loadReports()">
                                <i class='bx bx-refresh'></i> Try Again
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return '-';
        }
    }
}

// Initialize the filter system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the accomplishment reports page
    const reportsContainer = document.querySelector('.accomplishment-reports-container');
    if (reportsContainer) {
        window.accomplishmentFilter = new AccomplishmentReportFilter();
    }
});

// Global function to clear filters (for use in empty state)
function clearAccomplishmentFilters() {
    if (window.accomplishmentFilter) {
        window.accomplishmentFilter.clearFilters();
    }
}

// ------------------------------------ Create Accomplishment Report Functions -----------------------------------------
function openAccomplishmentCreateModal() {
    const modal = document.getElementById('accomplishmentCreateModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Set current date as max for date conducted
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('id_date_conducted').max = today;

    // Set current school year as default
    const currentYear = new Date().getFullYear();
    document.getElementById('id_school_year').value = `${currentYear}-${currentYear + 1}`;
}

function closeAccomplishmentCreateModal() {
    const modal = document.getElementById('accomplishmentCreateModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('accomplishmentCreateForm').reset();
    document.getElementById('accomplishmentFormResponse').innerHTML = '';
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Reset file displays
    document.getElementById('mainReportFileName').textContent = 'No file selected';
    document.getElementById('mainReportFileSize').textContent = '';
    document.getElementById('removeMainReportFile').style.display = 'none';

    document.getElementById('supportingFilesName').textContent = 'No files selected';
    document.getElementById('supportingFilesCount').style.display = 'none';
    document.getElementById('supportingFilesSize').textContent = '';
    document.getElementById('removeSupportingFiles').style.display = 'none';
}

// Main report file handling
document.getElementById('mainReportFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileNameDisplay = document.getElementById('mainReportFileName');
    const fileSizeDisplay = document.getElementById('mainReportFileSize');
    const removeFileBtn = document.getElementById('removeMainReportFile');

    if (file) {
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = formatFileSize(file.size);
        removeFileBtn.style.display = 'block';
    }
});

function removeMainReportFile() {
    const fileInput = document.getElementById('mainReportFileInput');
    const fileNameDisplay = document.getElementById('mainReportFileName');
    const fileSizeDisplay = document.getElementById('mainReportFileSize');
    const removeFileBtn = document.getElementById('removeMainReportFile');

    fileInput.value = '';
    fileNameDisplay.textContent = 'No file selected';
    fileSizeDisplay.textContent = '';
    removeFileBtn.style.display = 'none';
}

// Supporting files handling
document.getElementById('supportingFilesInput').addEventListener('change', function(e) {
    const files = e.target.files;
    const fileNameDisplay = document.getElementById('supportingFilesName');
    const fileCountDisplay = document.getElementById('supportingFilesCount');
    const fileSizeDisplay = document.getElementById('supportingFilesSize');
    const removeFileBtn = document.getElementById('removeSupportingFiles');

    if (files && files.length > 0) {
        if (files.length === 1) {
            fileNameDisplay.textContent = files[0].name;
            fileCountDisplay.style.display = 'none';
            fileSizeDisplay.textContent = formatFileSize(files[0].size);
        } else {
            fileNameDisplay.textContent = `${files.length} files selected`;
            fileCountDisplay.textContent = `Files: ${Array.from(files).map(f => f.name).join(', ')}`;
            fileCountDisplay.style.display = 'block';

            const totalSize = Array.from(files).reduce((total, file) => total + file.size, 0);
            fileSizeDisplay.textContent = `Total size: ${formatFileSize(totalSize)}`;
        }
        removeFileBtn.style.display = 'block';
    } else {
        fileNameDisplay.textContent = 'No files selected';
        fileCountDisplay.style.display = 'none';
        fileSizeDisplay.textContent = '';
        removeFileBtn.style.display = 'none';
    }
});

function removeSupportingFiles() {
    const fileInput = document.getElementById('supportingFilesInput');
    const fileNameDisplay = document.getElementById('supportingFilesName');
    const fileCountDisplay = document.getElementById('supportingFilesCount');
    const fileSizeDisplay = document.getElementById('supportingFilesSize');
    const removeFileBtn = document.getElementById('removeSupportingFiles');

    fileInput.value = '';
    fileNameDisplay.textContent = 'No files selected';
    fileCountDisplay.style.display = 'none';
    fileSizeDisplay.textContent = '';
    removeFileBtn.style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Form submission handling - SIMPLIFIED
document.getElementById('accomplishmentCreateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('accomplishmentFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        }
    });

    if (!isValid) {
        showErrorToast('Please fill in all required fields');
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate school year format
    const schoolYear = document.getElementById('id_school_year').value;
    const schoolYearPattern = /^\d{4}-\d{4}$/;
    if (!schoolYearPattern.test(schoolYear)) {
        showErrorToast('School year must be in format: YYYY-YYYY (e.g., 2024-2025)');
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate date conducted is not in future
    const dateConducted = new Date(document.getElementById('id_date_conducted').value);
    const today = new Date();
    if (dateConducted > today) {
        showErrorToast('Date conducted cannot be in the future');
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate main report file
    const mainReportFile = document.getElementById('mainReportFileInput').files[0];
    if (!mainReportFile) {
        showErrorToast('Main report document is required');
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate file sizes for all files
    const allFileInputs = form.querySelectorAll('input[type="file"]');
    let hasFileErrors = false;

    allFileInputs.forEach(input => {
        const files = input.files;
        if (files) {
            for (let file of files) {
                if (file.size > 10 * 1024 * 1024) {
                    showErrorToast(`File "${file.name}" exceeds 10MB size limit`);
                    hasFileErrors = true;
                }
            }
        }
    });

    if (hasFileErrors) {
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
        if (data.success) {
            showSuccessToast('Accomplishment report submitted successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Accomplishment report submitted successfully! This window will close shortly...
                </div>
            `;
            setTimeout(() => {
                closeAccomplishmentCreateModal();
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

// Helper function to show form errors
function showFormErrors(form, errors) {
    Object.keys(errors).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = errors[fieldName].join('<br>');
            field.parentNode.appendChild(errorDiv);
        }
    });
}

// Toast notification functions (make sure these exist in your main JS)
function showSuccessToast(message) {
    // Your existing toast implementation
    console.log('Success:', message);
}

function showErrorToast(message) {
    // Your existing toast implementation
    console.log('Error:', message);
}

// ------------------------------------ Accomplishment Report View Modal Function --------------------------------------
function openAccomplishmentViewModal(reportId) {
    console.log('DEBUG: Opening accomplishment view modal for ID:', reportId);
    showAccomplishmentLoadingState(true);

    fetch(`/accomplishment-reports/${reportId}/view/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleAccomplishmentResponse)
    .then(data => {
        console.log('DEBUG: Received accomplishment data:', data);
        if (data.success) {
            populateAccomplishmentModalData(data.report);
            showAccomplishmentModal();
        } else {
            throw new Error(data.error || 'Failed to load accomplishment details');
        }
    })
    .catch(handleAccomplishmentError)
    .finally(() => {
        showAccomplishmentLoadingState(false);
    });
}

function populateAccomplishmentModalData(report) {
    console.log('DEBUG: Populating modal with accomplishment data:', report);

    // Basic Report Information
    document.getElementById('viewAccomplishmentTitle').textContent = report.title || '-';
    document.getElementById('viewAccomplishmentType').textContent = report.record_type_display || '-';
    document.getElementById('viewSemester').textContent = report.semester_display || '-';
    document.getElementById('viewDateConducted').textContent = formatDate(report.date_conducted) || '-';
    document.getElementById('viewAccomplishmentSubmitter').textContent = report.submitted_by_name || '-';
    document.getElementById('viewOrganization').textContent = report.organization_name || 'N/A';
    document.getElementById('viewAccomplishmentSubmitDate').textContent = formatDateTime(report.created_at) || '-';

    // Style badges
    styleAccomplishmentBadges(report.record_type, report.semester);

    // Academic Information - Replace school year with date conducted
    document.getElementById('viewSemesterDetail').textContent = report.semester_display || '-';

    // Simply use the formatted date conducted instead of school year
    const schoolYearElement = document.getElementById('viewSchoolYear');
    schoolYearElement.textContent = formatDate(report.date_conducted) || 'Not specified';

    document.getElementById('viewVenue').textContent = report.venue || 'Not specified';

    // Quantitative Data
    document.getElementById('viewParticipants').textContent = report.number_of_participants || '0';
    document.getElementById('viewDuration').textContent = report.duration_hours ? `${report.duration_hours} hours` : '0 hours';
    document.getElementById('viewBudget').textContent = report.budget_utilized ?
        `₱${parseFloat(report.budget_utilized).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0.00';

    // Content Sections
    populateAccomplishmentContent(report.objectives, report.outcomes);

    // Files
    populateAccomplishmentFiles(report.main_report, report.supporting_files, report.has_supporting_files);
}

function styleAccomplishmentBadges(recordType, semester) {
    const typeBadge = document.getElementById('viewAccomplishmentType');
    const semesterBadge = document.getElementById('viewSemester');

    // Style record type badge
    typeBadge.className = 'accomplishment-type-badge';
    typeBadge.classList.add(`type-${recordType}`);

    // Style semester badge
    semesterBadge.className = 'semester-badge';
    semesterBadge.classList.add(`semester-${semester}`);
}

// Updated function - removed description parameter
function populateAccomplishmentContent(objectives, outcomes) {
    const objectivesElement = document.getElementById('viewObjectives');
    const outcomesElement = document.getElementById('viewOutcomes');

    // Hide the description section since it's no longer used
    const descriptionElement = document.getElementById('viewDescription');
    if (descriptionElement) {
        descriptionElement.style.display = 'none';
        descriptionElement.closest('.content-card').style.display = 'none';
    }

    // Populate objectives
    if (objectives && objectives.trim()) {
        objectivesElement.innerHTML = `
            <div class="content-text-inner">
                ${escapeHtml(objectives).replace(/\n/g, '<br>')}
            </div>
        `;
    } else {
        objectivesElement.innerHTML = `
            <div class="no-content-message">
                <i class='bx bx-target-lock'></i>
                <p>No objectives provided</p>
            </div>
        `;
    }

    // Populate outcomes
    if (outcomes && outcomes.trim()) {
        outcomesElement.innerHTML = `
            <div class="content-text-inner">
                ${escapeHtml(outcomes).replace(/\n/g, '<br>')}
            </div>
        `;
    } else {
        outcomesElement.innerHTML = `
            <div class="no-content-message">
                <i class='bx bx-check-circle'></i>
                <p>No outcomes provided</p>
            </div>
        `;
    }
}

function populateAccomplishmentFiles(mainReport, supportingFiles, hasSupportingFiles) {
    const mainReportElement = document.getElementById('viewMainReportFile');
    const supportingFilesList = document.getElementById('viewSupportingFiles');
    const supportingFilesCount = document.getElementById('viewSupportingFilesCount');

    // Main Report File
    if (mainReport && mainReport.file_url) {
        const fileSize = formatFileSize(mainReport.file_size);
        const fileExtension = mainReport.file_name.split('.').pop().toUpperCase();

        mainReportElement.innerHTML = `
            <div class="file-item-content main-report-file">
                <div class="file-icon">
                    <i class='bx bxs-file-pdf'></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${escapeHtml(mainReport.file_name)}</div>
                    <div class="file-meta">
                        <span class="file-type">${fileExtension}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <a href="${mainReport.file_url}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="file-download-btn"
                       title="Download main report">
                        <i class='bx bx-download'></i>
                        Download
                    </a>
                </div>
            </div>
        `;
    } else {
        mainReportElement.innerHTML = `
            <div class="no-file-message">
                <i class='bx bx-file-blank'></i>
                <p>No main report file</p>
            </div>
        `;
    }

    // Supporting Files
    if (hasSupportingFiles && supportingFiles && supportingFiles.length > 0) {
        supportingFilesCount.textContent = `${supportingFiles.length} file${supportingFiles.length !== 1 ? 's' : ''}`;

        let html = '';
        supportingFiles.forEach(file => {
            const fileSize = formatFileSize(file.file_size);
            const fileExtension = file.file_name.split('.').pop().toLowerCase();
            const fileIcon = getFileIcon(fileExtension);

            html += `
                <div class="supporting-file-item">
                    <div class="file-icon">
                        <i class='${fileIcon}'></i>
                    </div>
                    <div class="file-info">
                        <div class="file-name">${escapeHtml(file.file_name)}</div>
                        <div class="file-meta">
                            <span class="file-size">${fileSize}</span>
                            ${file.description ? `<span class="file-description">${escapeHtml(file.description)}</span>` : ''}
                        </div>
                    </div>
                    <div class="file-actions">
                        <a href="${file.file_url}"
                           target="_blank"
                           rel="noopener noreferrer"
                           class="file-download"
                           title="Download file">
                            <i class='bx bx-download'></i>
                        </a>
                    </div>
                </div>
            `;
        });
        supportingFilesList.innerHTML = html;
    } else {
        supportingFilesCount.textContent = '0 files';
        supportingFilesList.innerHTML = `
            <div class="no-files-message">
                <i class='bx bx-paperclip'></i>
                <p>No supporting files</p>
                <small class="no-files-subtext">No additional documents attached</small>
            </div>
        `;
    }
}

function getFileIcon(fileExtension) {
    const iconMap = {
        'pdf': 'bx bxs-file-pdf',
        'doc': 'bx bxs-file-doc',
        'docx': 'bx bxs-file-doc',
        'jpg': 'bx bxs-file-image',
        'jpeg': 'bx bxs-file-image',
        'png': 'bx bxs-file-image',
        'xls': 'bx bxs-file-spreadsheet',
        'xlsx': 'bx bxs-file-spreadsheet',
        'zip': 'bx bxs-file-archive',
        'mp4': 'bx bxs-file-video',
        'avi': 'bx bxs-file-video',
        'mov': 'bx bxs-file-video'
    };
    return iconMap[fileExtension] || 'bx bxs-file';
}

function showAccomplishmentModal() {
    const modal = document.getElementById('accomplishmentViewModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAccomplishmentViewModal() {
    const modal = document.getElementById('accomplishmentViewModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear previous data
    clearAccomplishmentModalData();
}

function clearAccomplishmentModalData() {
    const elementsToClear = [
        'viewAccomplishmentTitle', 'viewAccomplishmentType', 'viewSemester',
        'viewDateConducted', 'viewAccomplishmentSubmitter', 'viewOrganization',
        'viewAccomplishmentSubmitDate', 'viewSemesterDetail', 'viewSchoolYear',
        'viewVenue', 'viewParticipants', 'viewDuration', 'viewBudget',
        'viewObjectives', 'viewOutcomes'
    ];

    elementsToClear.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '';
    });

    // Clear files
    document.getElementById('viewMainReportFile').innerHTML = '';
    document.getElementById('viewSupportingFiles').innerHTML = '';
    document.getElementById('viewSupportingFilesCount').textContent = '0 files';
}

function showAccomplishmentLoadingState(show) {
    const modal = document.getElementById('accomplishmentViewModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#accomplishmentModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'accomplishmentModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading accomplishment details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#accomplishmentModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleAccomplishmentResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleAccomplishmentError(error) {
    console.error('Error loading accomplishment details:', error);
    showErrorToast(error.message || 'Failed to load accomplishment details');
}

// Make functions globally available
window.openAccomplishmentViewModal = openAccomplishmentViewModal;
window.closeAccomplishmentViewModal = closeAccomplishmentViewModal;

// ------------------------------------ Accomplishment Report Edit Modal Function --------------------------------------
function openEditAccomplishmentModal(reportId) {
    console.log('DEBUG: Opening accomplishment edit modal for ID:', reportId);
    showAccomplishmentEditLoadingState(true);

    fetch(`/accomplishment-reports/${reportId}/edit/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        console.log('DEBUG: Raw response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('DEBUG: Received accomplishment data for editing:', data);
        if (data.success) {
            populateAccomplishmentEditForm(data.report);
            showAccomplishmentEditModal();
        } else {
            throw new Error(data.error || 'Failed to load accomplishment details for editing');
        }
    })
    .catch(error => {
        console.error('DEBUG: Error in fetch:', error);
        handleAccomplishmentError(error);
    })
    .finally(() => {
        showAccomplishmentEditLoadingState(false);
    });
}

function populateAccomplishmentEditForm(report) {
    console.log('DEBUG: Populating edit form with accomplishment data:', report);
    console.log('DEBUG: Full report structure:', JSON.stringify(report, null, 2));

    // Set form values with better null handling
    document.getElementById('editAccomplishmentId').value = report.id || '';
    document.getElementById('editAccomplishmentTitle').value = report.title || '';
    document.getElementById('editAccomplishmentType').value = report.record_type || '';
    document.getElementById('editDateConducted').value = report.date_conducted || '';
    document.getElementById('editSemester').value = report.semester || '';
    document.getElementById('editSchoolYear').value = report.school_year || '';
    document.getElementById('editVenue').value = report.venue || '';
    document.getElementById('editParticipants').value = report.number_of_participants || 0;
    document.getElementById('editDuration').value = report.duration_hours || '0.00';
    document.getElementById('editBudget').value = report.budget_utilized || '0.00';

    // Removed description field population
    document.getElementById('editObjectives').value = report.objectives || '';
    document.getElementById('editOutcomes').value = report.outcomes || '';

    // Set submission info
    document.getElementById('editSubmittedByName').textContent = report.submitted_by_name || '-';
    document.getElementById('editOrganizationName').textContent = report.organization_name || 'N/A';
    document.getElementById('editSubmittedAt').textContent = formatDateTime(report.created_at) || '-';
    document.getElementById('editUpdatedAt').textContent = formatDateTime(report.updated_at) || '-';

    // Populate organizations dropdown
    populateOrganizationsDropdown(report.organization_id);

    // Populate current files
    populateCurrentFiles(report.main_report, report.supporting_files, report.has_supporting_files);

    // Set form action
    const form = document.getElementById('accomplishmentEditForm');
    form.action = `/accomplishment-reports/${report.id}/edit/`;

    // Set current date as max for date conducted
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('editDateConducted').max = today;
}

function populateOrganizationsDropdown(currentOrganizationId) {
    const organizationsSelect = document.getElementById('editOrganization');
    const organizationSection = document.getElementById('editOrganizationSection');

    console.log('DEBUG: Populating organizations dropdown for current organization:', currentOrganizationId);

    // Clear existing options except the first one
    while (organizationsSelect.options.length > 1) {
        organizationsSelect.remove(1);
    }

    // Get organizations data from the template
    const availableOrganizations = window.availableOrganizations || [];
    console.log('DEBUG: Available organizations:', availableOrganizations);

    // Hide organization section for organization users (it will be auto-set)
    const userType = window.currentUserType || 0;
    if (userType === 15) { // Organization user
        organizationSection.style.display = 'none';
        return;
    }

    if (availableOrganizations && availableOrganizations.length > 0) {
        availableOrganizations.forEach(org => {
            const option = document.createElement('option');
            option.value = org.id;
            option.textContent = `${org.acronym} - ${org.name}`;
            option.selected = (org.id == currentOrganizationId);
            organizationsSelect.appendChild(option);
        });
        console.log('DEBUG: Successfully populated', availableOrganizations.length, 'organizations');
    } else {
        console.warn('DEBUG: No organizations found in template context');
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No organizations found";
        option.disabled = true;
        organizationsSelect.appendChild(option);
    }
}

function populateCurrentFiles(mainReport, supportingFiles, hasSupportingFiles) {
    // Current Main Report
    const mainReportContainer = document.getElementById('editCurrentMainReport');

    if (mainReport && mainReport.file_url) {
        const fileSize = formatFileSize(mainReport.file_size);
        const fileExtension = mainReport.file_name.split('.').pop().toUpperCase();

        mainReportContainer.innerHTML = `
            <div class="current-file-item main-report">
                <div class="file-icon">
                    <i class='bx bxs-file-pdf'></i>
                </div>
                <div class="file-details">
                    <span class="file-name">${escapeHtml(mainReport.file_name)}</span>
                    <span class="file-meta">${fileExtension} • ${fileSize}</span>
                </div>
                <div class="file-actions">
                    <a href="${mainReport.file_url}" target="_blank" class="file-download" title="Download">
                        <i class='bx bx-download'></i>
                    </a>
                    <button type="button" class="file-remove" onclick="removeCurrentMainReport(${mainReport.id})" title="Remove">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        mainReportContainer.innerHTML = `
            <div class="no-file-message">
                <i class='bx bx-file-blank'></i>
                <span>No main report file</span>
            </div>
        `;
    }

    // Current Supporting Files
    const supportingFilesContainer = document.getElementById('editCurrentSupportingFiles');

    if (hasSupportingFiles && supportingFiles && supportingFiles.length > 0) {
        let html = '<div class="current-files-list">';

        supportingFiles.forEach(file => {
            const fileSize = formatFileSize(file.file_size);
            const fileExtension = file.file_name.split('.').pop().toLowerCase();
            const fileIcon = getFileIcon(fileExtension);

            html += `
                <div class="current-file-item supporting-file" data-file-id="${file.id}">
                    <div class="file-icon">
                        <i class='${fileIcon}'></i>
                    </div>
                    <div class="file-details">
                        <span class="file-name">${escapeHtml(file.file_name)}</span>
                        <span class="file-meta">${fileSize} • ${formatDateTime(file.uploaded_at)}</span>
                        ${file.description ? `<span class="file-description">${escapeHtml(file.description)}</span>` : ''}
                    </div>
                    <div class="file-actions">
                        <a href="${file.file_url}" target="_blank" class="file-download" title="Download">
                            <i class='bx bx-download'></i>
                        </a>
                        <button type="button" class="file-remove" onclick="removeCurrentSupportingFile(${file.id})" title="Remove">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        supportingFilesContainer.innerHTML = html;
    } else {
        supportingFilesContainer.innerHTML = `
            <div class="no-file-message">
                <i class='bx bx-paperclip'></i>
                <span>No supporting files</span>
            </div>
        `;
    }
}

function removeCurrentMainReport(fileId) {
    if (!confirm('Are you sure you want to remove the main report file? You must upload a new main report file to save changes.')) {
        return;
    }

    // This will be handled in the form submission by clearing the current file
    // For now, we'll just show a message
    const mainReportContainer = document.getElementById('editCurrentMainReport');
    mainReportContainer.innerHTML = `
        <div class="file-removed-message">
            <i class='bx bx-info-circle'></i>
            <span>Main report file will be removed. Please upload a new file.</span>
        </div>
    `;

    // Set a flag to indicate main report should be cleared
    document.getElementById('editAccomplishmentId').dataset.clearMainReport = 'true';
}

function removeCurrentSupportingFile(fileId) {
    if (!confirm('Are you sure you want to remove this supporting file? This action cannot be undone.')) {
        return;
    }

    showAccomplishmentEditLoadingState(true);

    fetch(`/accomplishment-reports/supporting-files/${fileId}/delete/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessToast('Supporting file removed successfully!');
            // Remove the file from the UI
            const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
            if (fileElement) {
                fileElement.remove();
            }

            // Check if no supporting files left
            const supportingFilesContainer = document.getElementById('editCurrentSupportingFiles');
            const remainingFiles = supportingFilesContainer.querySelectorAll('.supporting-file');
            if (remainingFiles.length === 0) {
                supportingFilesContainer.innerHTML = `
                    <div class="no-file-message">
                        <i class='bx bx-paperclip'></i>
                        <span>No supporting files</span>
                    </div>
                `;
            }
        } else {
            throw new Error(data.error || 'Failed to remove supporting file');
        }
    })
    .catch(error => {
        console.error('Error removing supporting file:', error);
        showErrorToast(error.message || 'Failed to remove supporting file');
    })
    .finally(() => {
        showAccomplishmentEditLoadingState(false);
    });
}

function showAccomplishmentEditModal() {
    const modal = document.getElementById('accomplishmentEditModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialize file upload handlers
    initializeEditFileUploads();

    // Focus on first input field
    setTimeout(() => {
        document.getElementById('editAccomplishmentTitle').focus();
    }, 300);
}

function closeAccomplishmentEditModal() {
    const modal = document.getElementById('accomplishmentEditModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear form and errors
    document.getElementById('accomplishmentEditForm').reset();
    document.getElementById('accomplishmentEditFormResponse').innerHTML = '';
    document.querySelectorAll('#accomplishmentEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#accomplishmentEditModal .error-message').forEach(el => el.remove());

    // Reset file displays
    document.getElementById('editMainReportFileInfo').style.display = 'none';
    document.getElementById('editSupportingFilesInfo').style.display = 'none';

    // Clear any flags
    const reportIdInput = document.getElementById('editAccomplishmentId');
    if (reportIdInput.dataset.clearMainReport) {
        delete reportIdInput.dataset.clearMainReport;
    }
}

function initializeEditFileUploads() {
    // Main Report File Upload
    const mainReportInput = document.getElementById('editMainReport');
    const mainReportUploadBox = document.getElementById('editMainReportUploadBox');
    const mainReportFileInfo = document.getElementById('editMainReportFileInfo');
    const mainReportFileName = document.getElementById('editMainReportFileName');
    const mainReportFileSize = document.getElementById('editMainReportFileSize');

    mainReportUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        mainReportUploadBox.classList.add('dragover');
    });

    mainReportUploadBox.addEventListener('dragleave', () => {
        mainReportUploadBox.classList.remove('dragover');
    });

    mainReportUploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        mainReportUploadBox.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleEditMainReportFile(e.dataTransfer.files[0]);
        }
    });

    mainReportUploadBox.addEventListener('click', () => {
        mainReportInput.click();
    });

    mainReportInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleEditMainReportFile(e.target.files[0]);
        }
    });

    // Supporting Files Upload
    const supportingFilesInput = document.getElementById('editSupportingFiles');
    const supportingFilesUploadBox = document.getElementById('editSupportingFilesUploadBox');
    const supportingFilesInfo = document.getElementById('editSupportingFilesInfo');
    const supportingFilesName = document.getElementById('editSupportingFilesName');
    const supportingFilesCount = document.getElementById('editSupportingFilesCount');
    const supportingFilesSize = document.getElementById('editSupportingFilesSize');

    supportingFilesUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        supportingFilesUploadBox.classList.add('dragover');
    });

    supportingFilesUploadBox.addEventListener('dragleave', () => {
        supportingFilesUploadBox.classList.remove('dragover');
    });

    supportingFilesUploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        supportingFilesUploadBox.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleEditSupportingFiles(e.dataTransfer.files);
        }
    });

    supportingFilesUploadBox.addEventListener('click', () => {
        supportingFilesInput.click();
    });

    supportingFilesInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleEditSupportingFiles(e.target.files);
        }
    });
}

function handleEditMainReportFile(file) {
    if (!validateFile(file, ['pdf', 'doc', 'docx'])) {
        return;
    }

    const mainReportFileName = document.getElementById('editMainReportFileName');
    const mainReportFileSize = document.getElementById('editMainReportFileSize');
    const mainReportFileInfo = document.getElementById('editMainReportFileInfo');

    mainReportFileName.textContent = file.name;
    mainReportFileSize.textContent = formatFileSize(file.size);
    mainReportFileInfo.style.display = 'flex';
}

function handleEditSupportingFiles(files) {
    const supportingFilesName = document.getElementById('editSupportingFilesName');
    const supportingFilesCount = document.getElementById('editSupportingFilesCount');
    const supportingFilesSize = document.getElementById('editSupportingFilesSize');
    const supportingFilesInfo = document.getElementById('editSupportingFilesInfo');

    let validFiles = Array.from(files).filter(file =>
        validateFile(file, ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xls', 'xlsx', 'mp4', 'avi', 'mov', 'zip'])
    );

    if (validFiles.length === 0) return;

    if (validFiles.length === 1) {
        supportingFilesName.textContent = validFiles[0].name;
        supportingFilesCount.style.display = 'none';
        supportingFilesSize.textContent = formatFileSize(validFiles[0].size);
    } else {
        supportingFilesName.textContent = `${validFiles.length} files selected`;
        supportingFilesCount.textContent = `Files: ${validFiles.map(f => f.name).join(', ')}`;
        supportingFilesCount.style.display = 'block';

        const totalSize = validFiles.reduce((total, file) => total + file.size, 0);
        supportingFilesSize.textContent = `Total size: ${formatFileSize(totalSize)}`;
    }

    supportingFilesInfo.style.display = 'flex';
}

function removeEditMainReportFile() {
    const mainReportInput = document.getElementById('editMainReport');
    const mainReportFileInfo = document.getElementById('editMainReportFileInfo');

    mainReportInput.value = '';
    mainReportFileInfo.style.display = 'none';
}

function removeEditSupportingFiles() {
    const supportingFilesInput = document.getElementById('editSupportingFiles');
    const supportingFilesInfo = document.getElementById('editSupportingFilesInfo');

    supportingFilesInput.value = '';
    supportingFilesInfo.style.display = 'none';
}

function showAccomplishmentEditLoadingState(show) {
    const modal = document.getElementById('accomplishmentEditModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#accomplishmentEditModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'accomplishmentEditModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading accomplishment details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#accomplishmentEditModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

// Handle edit form submission
document.getElementById('accomplishmentEditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('accomplishmentEditFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('#accomplishmentEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#accomplishmentEditModal .error-message').forEach(el => el.remove());

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
        }
    });

    if (hasEmptyFields) {
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
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate school year format
    const schoolYear = document.getElementById('editSchoolYear').value;
    const schoolYearPattern = /^\d{4}-\d{4}$/;
    if (!schoolYearPattern.test(schoolYear)) {
        document.getElementById('editSchoolYear').classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'School year must be in format: YYYY-YYYY (e.g., 2024-2025)';
        document.getElementById('editSchoolYear').parentNode.appendChild(errorDiv);
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate date conducted is not in future
    const dateConducted = new Date(document.getElementById('editDateConducted').value);
    const today = new Date();
    if (dateConducted > today) {
        document.getElementById('editDateConducted').classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Date conducted cannot be in the future';
        document.getElementById('editDateConducted').parentNode.appendChild(errorDiv);
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate file sizes
    const fileInputs = form.querySelectorAll('input[type="file"]');
    let hasFileErrors = false;

    fileInputs.forEach(input => {
        const files = input.files;
        if (files) {
            for (let file of files) {
                if (file.size > 10 * 1024 * 1024) {
                    showErrorToast(`File "${file.name}" exceeds 10MB size limit`);
                    hasFileErrors = true;
                }
            }
        }
    });

    if (hasFileErrors) {
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
        console.log('DEBUG: Server response for accomplishment edit:', data);
        if (data.success) {
            showSuccessToast('Accomplishment report updated successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Accomplishment report updated successfully! Refreshing data...
                </div>
            `;

            setTimeout(() => {
                closeAccomplishmentEditModal();
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
        console.error('Error updating accomplishment report:', error);
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

// File validation helper
function validateFile(file, allowedExtensions) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (file.size > maxSize) {
        showErrorToast(`File "${file.name}" exceeds 10MB size limit`);
        return false;
    }

    if (!allowedExtensions.includes(fileExtension)) {
        showErrorToast(`File type "${fileExtension}" not supported. Please upload ${allowedExtensions.join(', ')} files.`);
        return false;
    }

    return true;
}

// Make functions globally available
window.openEditAccomplishmentModal = openEditAccomplishmentModal;
window.closeAccomplishmentEditModal = closeAccomplishmentEditModal;
window.removeCurrentMainReport = removeCurrentMainReport;
window.removeCurrentSupportingFile = removeCurrentSupportingFile;
window.removeEditMainReportFile = removeEditMainReportFile;
window.removeEditSupportingFiles = removeEditSupportingFiles;

// ------------------------------------- Accomplishment Report Archive Function ----------------------------------------
function openArchiveAccomplishmentModal(reportId, reportTitle = '') {
    console.log('DEBUG: Opening accomplishment archive modal for ID:', reportId);
    showAccomplishmentArchiveLoadingState(true);

    // Reset archive reason field
    document.getElementById('archiveReason').value = '';
    updateArchiveReasonCount();

    // Use GET request to fetch report details
    fetch(`/accomplishment-reports/${reportId}/archive/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleAccomplishmentArchiveResponse)
    .then(data => {
        console.log('DEBUG: Received accomplishment data for archiving:', data);
        if (data.success) {
            populateAccomplishmentArchiveModal(data.report);
            showAccomplishmentArchiveModal();
        } else {
            throw new Error(data.error || 'Failed to load accomplishment details for archiving');
        }
    })
    .catch(handleAccomplishmentArchiveError)
    .finally(() => {
        showAccomplishmentArchiveLoadingState(false);
    });
}

function populateAccomplishmentArchiveModal(report) {
    console.log('DEBUG: Populating archive modal with accomplishment data:', report);

    // Set report ID
    document.getElementById('archiveAccomplishmentId').value = report.id;

    // Update modal description
    const description = document.getElementById('accomplishmentArchiveDescription');
    description.textContent = `Are you sure you want to archive "${report.title}"?`;

    // Populate report preview
    document.getElementById('archiveAccomplishmentTitle').textContent = report.title;
    document.getElementById('archiveAccomplishmentSubmitter').textContent = report.submitted_by_name || '-';
    document.getElementById('archiveAccomplishmentOrganization').textContent = report.organization_name || 'N/A';
    document.getElementById('archiveAccomplishmentDate').textContent = formatDate(report.date_conducted) || '-';
    document.getElementById('archiveAccomplishmentVenue').textContent = report.venue || 'Not specified';
    document.getElementById('archiveAccomplishmentParticipants').textContent = report.number_of_participants || '0';
    document.getElementById('archiveAccomplishmentDuration').textContent = report.duration_hours ? `${report.duration_hours} hours` : '0 hours';
    document.getElementById('archiveAccomplishmentBudget').textContent = report.budget_utilized ?
        `₱${parseFloat(report.budget_utilized).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0.00';
    document.getElementById('archiveAccomplishmentSubmittedAt').textContent = formatDateTime(report.created_at) || '-';

    // Set type badge
    const typeElement = document.getElementById('archiveAccomplishmentType');
    typeElement.textContent = report.record_type_display || report.record_type || '-';
    typeElement.className = 'type-badge';
    typeElement.classList.add(`type-${report.record_type}`);

    // Set semester badge
    const semesterElement = document.getElementById('archiveAccomplishmentSemester');
    semesterElement.textContent = report.semester_display || report.semester || '-';
    semesterElement.className = 'semester-badge';
    semesterElement.classList.add(`semester-${report.semester}`);

    // Academic period
    document.getElementById('archiveAccomplishmentPeriod').textContent =
        `${report.semester_display || report.semester} Semester, ${report.school_year || '-'}`;

    // Remove description preview section since description field is removed
    const descriptionSection = document.querySelector('.description-preview-section');
    if (descriptionSection) {
        descriptionSection.style.display = 'none';
    }

    // Handle files information
    document.getElementById('archiveAccomplishmentMainReport').textContent =
        report.main_report ? 'Available' : 'Not available';

    const supportingFilesCount = report.supporting_files_count || 0;
    document.getElementById('archiveAccomplishmentSupportingFiles').textContent =
        supportingFilesCount > 0 ? `${supportingFilesCount} file(s)` : 'No supporting files';

    // Show/hide organization impact warning
    const organizationImpact = document.getElementById('organizationImpact');
    if (report.organization_id) {
        organizationImpact.style.display = 'flex';
    } else {
        organizationImpact.style.display = 'none';
    }

    // Set form action
    const form = document.getElementById('accomplishmentArchiveForm');
    form.action = `/accomplishment-reports/${report.id}/archive/`;
}

function showAccomplishmentArchiveModal() {
    const modal = document.getElementById('accomplishmentArchiveModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('DEBUG: Modal shown successfully');
    } else {
        console.error('DEBUG: Modal element not found');
    }
}

function closeAccomplishmentArchiveModal() {
    const modal = document.getElementById('accomplishmentArchiveModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Clear form response
        const formResponse = document.getElementById('accomplishmentArchiveFormResponse');
        if (formResponse) {
            formResponse.innerHTML = '';
        }
        console.log('DEBUG: Modal closed successfully');
    }
}

function showAccomplishmentArchiveLoadingState(show) {
    const modal = document.getElementById('accomplishmentArchiveModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-container');
    if (!modalContent) return;

    if (show) {
        if (!modal.querySelector('#accomplishmentArchiveModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'accomplishmentArchiveModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading accomplishment details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#accomplishmentArchiveModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleAccomplishmentArchiveResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleAccomplishmentArchiveError(error) {
    console.error('Error loading accomplishment details for archiving:', error);
    showErrorToast(error.message || 'Failed to load accomplishment details for archiving');
}

// Add character counter for archive reason
function updateArchiveReasonCount() {
    const textarea = document.getElementById('archiveReason');
    const counter = document.getElementById('archiveReasonCount');
    if (!textarea || !counter) return;

    const count = textarea.value.length;
    counter.textContent = count;

    if (count > 450) {
        counter.style.color = 'var(--warning)';
    } else {
        counter.style.color = 'var(--text-secondary)';
    }
}

// Initialize archive reason counter when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const archiveReason = document.getElementById('archiveReason');
    if (archiveReason) {
        archiveReason.addEventListener('input', updateArchiveReasonCount);
    }
});

// Handle archive form submission
document.addEventListener('DOMContentLoaded', function() {
    const archiveForm = document.getElementById('accomplishmentArchiveForm');
    if (archiveForm) {
        archiveForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const form = this;
            const reportId = document.getElementById('archiveAccomplishmentId').value;
            const reportTitle = document.getElementById('archiveAccomplishmentTitle').textContent;
            const archiveReason = document.getElementById('archiveReason').value;
            const submitBtn = form.querySelector('button[type="submit"]');
            const formResponse = document.getElementById('accomplishmentArchiveFormResponse');

            if (!submitBtn) return;

            submitBtn.classList.add('is-loading');
            if (formResponse) formResponse.innerHTML = '';

            const formData = new FormData();
            formData.append('accomplishment_id', reportId);
            formData.append('archive_reason', archiveReason);
            formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);

            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw {
                            userFriendly: true,
                            message: err.error || 'Failed to archive accomplishment report'
                        };
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showSuccessToast(data.message || `"${reportTitle}" has been archived successfully!`);
                    if (formResponse) {
                        formResponse.innerHTML = `
                            <div class="response-message response-success">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                ${data.message || 'Accomplishment report archived successfully! This window will close shortly...'}
                            </div>
                        `;
                    }

                    setTimeout(() => {
                        closeAccomplishmentArchiveModal();
                        window.location.reload();
                    }, 1500);
                } else {
                    showErrorToast(data.error || `Failed to archive "${reportTitle}"`);
                    showAccomplishmentArchiveError(data.error || 'Failed to archive accomplishment report');
                }
            })
            .catch(error => {
                console.error('Error archiving accomplishment report:', error);
                const errorMessage = error.userFriendly ?
                    error.message :
                    'An unexpected error occurred while processing your request.';
                showErrorToast(errorMessage);
                showAccomplishmentArchiveError(errorMessage);
            })
            .finally(() => {
                submitBtn.classList.remove('is-loading');
            });
        });
    }
});

function showAccomplishmentArchiveError(message) {
    const formResponse = document.getElementById('accomplishmentArchiveFormResponse');
    if (formResponse) {
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
}

// Make functions globally available
window.openArchiveAccomplishmentModal = openArchiveAccomplishmentModal;
window.closeAccomplishmentArchiveModal = closeAccomplishmentArchiveModal;

// Utility functions (make sure these exist)
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}