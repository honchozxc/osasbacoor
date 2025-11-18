// ------------------------------------------- OJT Companies Table Functions -------------------------------------------
let currentCompanyPage = 1;
let currentCompanySearch = '';
let currentAvailabilityFilter = '';
let currentStudentCountFilter = '';
let currentSortOrder = 'name_asc';

// Load companies on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCompaniesData();

    // Add event listeners for filters
    document.getElementById('company-search').addEventListener('input', debounce(handleCompanySearch, 300));
    document.getElementById('availability-filter').addEventListener('change', handleFilterChange);
    document.getElementById('student-count-filter').addEventListener('change', handleFilterChange);
    document.getElementById('sort-order').addEventListener('change', handleSortChange);
});

function loadCompaniesData() {
    const searchTerm = document.getElementById('company-search').value;
    const availabilityFilter = document.getElementById('availability-filter').value;
    const studentCountFilter = document.getElementById('student-count-filter').value;
    const sortOrder = document.getElementById('sort-order').value;

    // Update current state
    currentCompanySearch = searchTerm;
    currentAvailabilityFilter = availabilityFilter;
    currentStudentCountFilter = studentCountFilter;
    currentSortOrder = sortOrder;

    loadCompaniesPage(1, searchTerm, availabilityFilter, studentCountFilter, sortOrder);
}

function loadCompaniesPage(page, search = '', availabilityFilter = '', studentCountFilter = '', sortOrder = 'name_asc') {
    const tbody = document.getElementById('companies-tbody');
    const paginationContainer = document.getElementById('company-pagination-container');

    // Show loading state
    tbody.innerHTML = `
        <tr id="loading-row">
            <td colspan="8" style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                Loading companies...
            </td>
        </tr>
    `;

    // Build query parameters
    const params = new URLSearchParams({
        'get_filtered_ojt_companies': '1',
        'page': page,
        'search': search,
        'availability_filter': availabilityFilter,
        'student_count_filter': studentCountFilter,
        'sort_order': sortOrder
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
        updateCompaniesTable(data);
        updateCompaniesPagination(data.pagination, page);

        // Update current state
        currentCompanyPage = page;
    })
    .catch(error => {
        console.error('Error loading companies:', error);
        tbody.innerHTML = `
            <tr id="error-row">
                <td colspan="8" style="text-align: center; padding: 20px; color: #dc3545; font-weight: 500;">
                    <i class='bx bx-error'></i> Error loading data. Please try again.
                </td>
            </tr>
        `;
    });
}

function updateCompaniesTable(data) {
    const tbody = document.getElementById('companies-tbody');

    if (!data.companies || data.companies.length === 0) {
        tbody.innerHTML = `
            <tr id="no-data-row">
                <td colspan="8" style="text-align: center; padding: 40px; font-style: italic; color: #6c757d;">
                    <i class='bx bx-building-house' style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No companies found matching your criteria
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    data.companies.forEach(company => {
        // Use the utilization_rate from backend or calculate it
        const utilizationRate = company.utilization_rate || (company.filled_slots > 0 ? (company.filled_slots / company.available_slots) * 100 : 0);
        const statusClass = getStatusClass(company.status);

        // Truncate long addresses for better display
        const truncatedAddress = company.address.length > 50 ?
            company.address.substring(0, 50) + '...' : company.address;

        // Check permissions for this company
        const canEdit = company.can_edit || (data.current_user_type && [1, 13].includes(data.current_user_type));
        const canArchive = company.can_archive || (data.current_user_type && [1, 13].includes(data.current_user_type));

        html += `
            <tr>
                <td>${company.id}</td>
                <td>
                    <div class="company-name">
                        <strong>${escapeHtml(company.name)}</strong>
                        ${company.description ? `<br><small class="text-muted">${escapeHtml(company.description.substring(0, 60))}${company.description.length > 60 ? '...' : ''}</small>` : ''}
                    </div>
                </td>
                <td title="${escapeHtml(company.address)}">${escapeHtml(truncatedAddress)}</td>
                <td>${escapeHtml(company.contact_number)}</td>
                <td>
                    <div class="slot-indicator">
                        <span class="slot-count">${company.remaining_slots}/${company.available_slots}</span>
                        <div class="slot-progress">
                            <div class="slot-progress-bar ${getProgressBarClass(utilizationRate)}"
                                 style="width: ${Math.min(utilizationRate, 100)}%"
                                 title="${utilizationRate.toFixed(1)}% utilized">
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="student-count ${company.student_count > 0 ? 'has-students' : ''}">
                        ${company.student_count}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        <i class='bx ${getStatusIcon(company.status)}'></i>
                        ${company.status}
                    </span>
                </td>
                <td class="action-buttons">
                    <!-- View button - always visible -->
                    <button class="btn-action view-btn" onclick="openCompanyViewModal(${company.id})" title="View Details">
                        <i class='bx bx-show'></i>
                    </button>

                    <!-- Edit button - only for user type 1 and 13 -->
                    ${canEdit ? `
                    <button class="btn-action edit-btn" onclick="openCompanyEditModal(${company.id})" title="Edit Company">
                        <i class='bx bx-edit'></i>
                    </button>
                    ` : ''}

                    <!-- Archive button - only for user type 1 and 13 -->
                    ${canArchive ? `
                    <button class="btn-action ${company.is_archived ? 'unarchive-btn' : 'archive-btn'}"
                            onclick="${company.is_archived ? 'openCompanyUnarchiveModal' : 'openCompanyArchiveModal'}(${company.id})"
                            title="${company.is_archived ? 'Unarchive Company' : 'Archive Company'}">
                        <i class='bx ${company.is_archived ? 'bx-reset' : 'bx-archive'}'></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    switch(statusLower) {
        case 'available': return 'status-available';
        case 'limited': return 'status-limited';
        case 'full': return 'status-full';
        case 'archived': return 'status-archived';
        default: return 'status-unknown';
    }
}

function getStatusIcon(status) {
    const statusLower = status.toLowerCase();
    switch(statusLower) {
        case 'available': return 'bx-check-circle';
        case 'limited': return 'bx-time';
        case 'full': return 'bx-x-circle';
        case 'archived': return 'bx-archive';
        default: return 'bx-help-circle';
    }
}

function getProgressBarClass(utilizationRate) {
    if (utilizationRate >= 90) return 'progress-danger';
    if (utilizationRate >= 75) return 'progress-warning';
    if (utilizationRate >= 50) return 'progress-info';
    return 'progress-success';
}

function updateCompaniesPagination(pagination, currentPage) {
    const container = document.getElementById('company-pagination-container');

    if (!pagination || pagination.total_count === 0) {
        container.innerHTML = `
            <div class="pagination-info">
                No companies found
            </div>
        `;
        return;
    }

    const totalCount = pagination.total_count || pagination.count || 0;
    const startIndex = pagination.start_index || 1;
    const endIndex = pagination.end_index || totalCount;

    if (pagination.num_pages <= 1) {
        container.innerHTML = `
            <div class="pagination-info">
                Showing ${totalCount} compan${totalCount === 1 ? 'y' : 'ies'}
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
            <a href="javascript:void(0)" class="pagination-btn first-page" title="First Page" onclick="loadCompaniesPageWithCurrentFilters(1)">
                <i class='bx bx-chevrons-left'></i>
            </a>
            <a href="javascript:void(0)" class="pagination-btn prev-page" title="Previous Page" onclick="loadCompaniesPageWithCurrentFilters(${currentPage - 1})">
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
            paginationHTML += `<a href="javascript:void(0)" class="pagination-btn page-number" onclick="loadCompaniesPageWithCurrentFilters(${i})">${i}</a>`;
        }
    }

    paginationHTML += `</div>`;

    // Next buttons
    if (pagination.has_next) {
        paginationHTML += `
            <a href="javascript:void(0)" class="pagination-btn next-page" title="Next Page" onclick="loadCompaniesPageWithCurrentFilters(${currentPage + 1})">
                <i class='bx bx-chevron-right'></i>
            </a>
            <a href="javascript:void(0)" class="pagination-btn last-page" title="Last Page" onclick="loadCompaniesPageWithCurrentFilters(${pagination.num_pages})">
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
function loadCompaniesPageWithCurrentFilters(page) {
    loadCompaniesPage(
        page,
        currentCompanySearch,
        currentAvailabilityFilter,
        currentStudentCountFilter,
        currentSortOrder
    );
}

function handleCompanySearch() {
    currentCompanyPage = 1; // Reset to first page when searching
    loadCompaniesData();
}

function handleFilterChange() {
    currentCompanyPage = 1; // Reset to first page when filter changes
    loadCompaniesData();
}

function handleSortChange() {
    currentCompanyPage = 1; // Reset to first page when sort changes
    loadCompaniesData();
}

// Export companies data
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-company-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openCompanyExportModal();
        });
    }

    // Your other existing event listeners...
    document.getElementById('company-search').addEventListener('input', debounce(handleCompanySearch, 300));
    document.getElementById('availability-filter').addEventListener('change', handleFilterChange);
    document.getElementById('student-count-filter').addEventListener('change', handleFilterChange);
    document.getElementById('sort-order').addEventListener('change', handleSortChange);

    // Export modal event listeners
    document.getElementById('exportType').addEventListener('change', updateExportPreview);
    document.getElementById('includeStudents').addEventListener('change', updateExportPreview);
    document.getElementById('specificCompany').addEventListener('change', updateExportPreview);
    document.getElementById('exportCompanyTitle').addEventListener('input', updateExportPreview);
});

// Utility functions
function debounce(func, wait) {
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

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

// Refresh companies table after successful operations
function refreshCompaniesTable() {
    loadCompaniesPageWithCurrentFilters(currentCompanyPage);
}

// Reset filters
function resetCompanyFilters() {
    document.getElementById('company-search').value = '';
    document.getElementById('availability-filter').value = '';
    document.getElementById('student-count-filter').value = '';
    document.getElementById('sort-order').value = 'name_asc';

    loadCompaniesData();
}

// -------------------------------------------- Create/Add Company Functions -------------------------------------------
function openCompanyCreateModal() {
    const modal = document.getElementById('companyCreateModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus on first input field
    setTimeout(() => {
        document.getElementById('id_name').focus();
    }, 300);
}

function closeCompanyCreateModal() {
    const modal = document.getElementById('companyCreateModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('companyCreateForm').reset();
    document.getElementById('companyFormResponse').innerHTML = '';
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());
}

// Handle form submission
document.getElementById('companyCreateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('companyFormResponse');

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

    if (hasEmptyFields) {
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate contact number format
    const contactInput = document.getElementById('id_contact_number');
    const contactValue = contactInput.value.trim();
    if (contactValue && !/^[\d-]+$/.test(contactValue)) {
        contactInput.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Contact number can only contain numbers and hyphens.';
        contactInput.parentNode.appendChild(errorDiv);
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate website URL format if provided
    const websiteInput = document.getElementById('id_website');
    const websiteValue = websiteInput.value.trim();
    if (websiteValue && !isValidUrl(websiteValue)) {
        websiteInput.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Please enter a valid website URL (e.g., https://example.com)';
        websiteInput.parentNode.appendChild(errorDiv);
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate email format if provided
    const emailInput = document.getElementById('id_email');
    const emailValue = emailInput.value.trim();
    if (emailValue && !isValidEmail(emailValue)) {
        emailInput.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Please enter a valid email address';
        emailInput.parentNode.appendChild(errorDiv);
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
            showSuccessToast('Company created successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Company created successfully! Refreshing data...
                </div>
            `;

            setTimeout(() => {
                closeCompanyCreateModal();
                refreshCompaniesTable(); // Refresh the table instead of reloading the page
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

// Add contact number validation
document.getElementById('id_contact_number').addEventListener('input', function(e) {
    const input = e.target;
    const value = input.value;

    // Remove any characters that are not numbers or hyphens
    const cleaned = value.replace(/[^\d-]/g, '');

    // Prevent consecutive hyphens
    const noConsecutiveHyphens = cleaned.replace(/--+/g, '-');

    // Prevent starting or ending with hyphen
    let finalValue = noConsecutiveHyphens;
    if (finalValue.startsWith('-')) {
        finalValue = finalValue.substring(1);
    }
    if (finalValue.endsWith('-')) {
        finalValue = finalValue.slice(0, -1);
    }

    if (value !== finalValue) {
        input.value = finalValue;
    }

    // Update validation styling
    const isValid = /^[\d-]+$/.test(finalValue) &&
                   !finalValue.startsWith('-') &&
                   !finalValue.endsWith('-') &&
                   !finalValue.includes('--');

    updateFieldValidation(input, isValid, 'Only numbers and hyphens are allowed. Cannot start/end with hyphen or have consecutive hyphens.');
});

// Add website URL validation
document.getElementById('id_website').addEventListener('blur', function(e) {
    const input = e.target;
    const value = input.value.trim();

    if (value) {
        const isValid = isValidUrl(value);
        updateFieldValidation(input, isValid, 'Please enter a valid website URL (e.g., https://example.com)');
    } else {
        // Clear validation if field is empty
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();
    }
});

// Add email validation
document.getElementById('id_email').addEventListener('blur', function(e) {
    const input = e.target;
    const value = input.value.trim();

    if (value) {
        const isValid = isValidEmail(value);
        updateFieldValidation(input, isValid, 'Please enter a valid email address');
    } else {
        // Clear validation if field is empty
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();
    }
});

// Utility function to update field validation
function updateFieldValidation(input, isValid, errorMessage) {
    if (!isValid) {
        input.classList.add('error');
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = errorMessage;
        input.parentNode.appendChild(errorDiv);
    } else {
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();
    }
}

// Utility function to validate URL
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Utility function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Utility function to show form errors
function showFormErrors(form, errors) {
    for (const [field, messages] of Object.entries(errors)) {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = messages.join('<br>');
            input.parentNode.appendChild(errorDiv);
        }
    }
}

// Auto-format website URL
document.getElementById('id_website').addEventListener('blur', function(e) {
    const input = e.target;
    let value = input.value.trim();

    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        value = 'https://' + value;
        input.value = value;
    }
});

// ------------------------------------------------ View Functions -----------------------------------------------------
function openCompanyViewModal(companyId) {
    showCompanyLoadingState(true);

    fetch(`/ojt-company/${companyId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleCompanyResponse)
    .then(data => {
        if (data.success) {
            populateCompanyModalData(data.company);
            showCompanyModal();
        } else {
            throw new Error(data.error || 'Failed to load company details');
        }
    })
    .catch(handleCompanyError)
    .finally(() => {
        showCompanyLoadingState(false);
    });
}

function populateCompanyModalData(company) {
    // Basic Information
    document.getElementById('viewCompanyName').textContent = company.name;
    document.getElementById('viewCompanyAddress').textContent = company.address;
    document.getElementById('viewCompanyContact').textContent = company.contact_number;

    // New Contact Links (Email and Website)
    populateContactLinks(company.email, company.website);

    // Company Description
    populateCompanyDescription(company.description);

    // OJT Capacity
    document.getElementById('viewCompanyTotalSlots').textContent = company.available_slots;
    document.getElementById('viewCompanyFilledSlots').textContent = company.filled_slots;
    document.getElementById('viewCompanyAvailableSlots').textContent = company.remaining_slots;
    document.getElementById('viewCompanyUtilization').textContent = `${company.utilization_rate}%`;

    // Status & Timeline
    document.getElementById('viewCompanyStatus').textContent = company.status;
    document.getElementById('viewCompanyCreatedAt').textContent = formatDateTime(company.created_at);
    document.getElementById('viewCompanyUpdatedAt').textContent = formatDateTime(company.updated_at);

    // Style the status badge
    const statusElement = document.getElementById('viewCompanyStatus');
    statusElement.className = 'status-badge';
    switch(company.status.toLowerCase()) {
        case 'available':
            statusElement.classList.add('status-available');
            break;
        case 'limited':
            statusElement.classList.add('status-limited');
            break;
        case 'full':
            statusElement.classList.add('status-full');
            break;
        case 'archived':
            statusElement.classList.add('status-archived');
            break;
        default:
            statusElement.classList.add('status-unknown');
    }

    // Current Students
    populateStudentsList(company.current_students, company.total_students);
}

function populateContactLinks(email, website) {
    const contactLinksContainer = document.getElementById('viewCompanyContactLinks');
    let html = '';

    if (email) {
        html += `
            <div class="contact-link">
                <i class='bx bx-envelope'></i>
                <a href="mailto:${escapeHtml(email)}" class="contact-link-item">
                    ${escapeHtml(email)}
                </a>
            </div>
        `;
    }

    if (website) {
        // Ensure website has proper protocol
        let websiteUrl = website;
        if (!website.startsWith('http://') && !website.startsWith('https://')) {
            websiteUrl = 'https://' + website;
        }

        html += `
            <div class="contact-link">
                <i class='bx bx-globe'></i>
                <a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer" class="contact-link-item">
                    ${escapeHtml(website)}
                </a>
            </div>
        `;
    }

    if (html) {
        contactLinksContainer.innerHTML = html;
    } else {
        contactLinksContainer.innerHTML = `
            <div class="no-contact-info">
                <i class='bx bx-info-circle'></i>
                No additional contact information provided
            </div>
        `;
    }
}

function populateCompanyDescription(description) {
    const descriptionSection = document.getElementById('viewCompanyDescriptionSection');
    const descriptionContent = document.getElementById('viewCompanyDescription');

    if (description && description.trim()) {
        descriptionContent.innerHTML = `
            <div class="description-text">
                ${escapeHtml(description).replace(/\n/g, '<br>')}
            </div>
        `;
        descriptionSection.style.display = 'block';
    } else {
        descriptionSection.style.display = 'none';
    }
}

function populateStudentsList(students, totalStudents) {
    const studentsList = document.getElementById('viewCompanyStudentsList');
    const studentsCount = document.getElementById('viewStudentsCount');

    // Update students count
    studentsCount.textContent = `${totalStudents} student${totalStudents !== 1 ? 's' : ''}`;

    if (totalStudents === 0) {
        studentsList.innerHTML = `
            <div class="no-students-message">
                <i class='bx bx-user-x'></i>
                <p>No current OJT students</p>
                <small class="no-students-subtext">This company has no active OJT placements</small>
            </div>
        `;
        return;
    }

    let html = '';

    students.forEach(student => {
        const statusClass = getStudentStatusClass(student.status);
        const yearSection = student.section ? `${student.year} - ${student.section}` : student.year;

        html += `
            <div class="student-row">
                <div class="student-col name">
                    <div class="student-avatar">
                        <i class='bx bx-user'></i>
                    </div>
                    <div class="student-info">
                        <span class="student-name">${escapeHtml(student.name)}</span>
                        <small class="student-email">${escapeHtml(student.email || '')}</small>
                    </div>
                </div>
                <div class="student-col id">
                    <span class="student-id">${escapeHtml(student.student_id)}</span>
                </div>
                <div class="student-col course">
                    <span class="student-course">${escapeHtml(student.course)}</span>
                </div>
                <div class="student-col year-section">
                    <span class="student-year">${escapeHtml(yearSection)}</span>
                </div>
                <div class="student-col duration">
                    <div class="duration-info">
                        <span class="duration-days">${student.duration_days} days</span>
                        <small class="date-range">${formatDate(student.start_date)} - ${formatDate(student.end_date)}</small>
                    </div>
                </div>
                <div class="student-col status">
                    <span class="student-status ${statusClass}">
                        <i class='bx ${getStudentStatusIcon(student.status)}'></i>
                        ${student.status || 'Active'}
                    </span>
                </div>
            </div>
        `;
    });

    studentsList.innerHTML = html;
}

function getStudentStatusClass(status) {
    const statusLower = (status || 'active').toLowerCase();
    switch(statusLower) {
        case 'active': return 'status-active';
        case 'completed': return 'status-completed';
        case 'terminated': return 'status-terminated';
        case 'on_leave': return 'status-on-leave';
        default: return 'status-unknown';
    }
}

function getStudentStatusIcon(status) {
    const statusLower = (status || 'active').toLowerCase();
    switch(statusLower) {
        case 'active': return 'bx-check-circle';
        case 'completed': return 'bx-award';
        case 'terminated': return 'bx-x-circle';
        case 'on_leave': return 'bx-time';
        default: return 'bx-help-circle';
    }
}

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

function showCompanyModal() {
    const modal = document.getElementById('companyViewModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCompanyViewModal() {
    const modal = document.getElementById('companyViewModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear previous data
    clearCompanyModalData();
}

function clearCompanyModalData() {
    const elementsToClear = [
        'viewCompanyName', 'viewCompanyAddress', 'viewCompanyContact',
        'viewCompanyTotalSlots', 'viewCompanyFilledSlots', 'viewCompanyAvailableSlots',
        'viewCompanyUtilization', 'viewCompanyStatus', 'viewCompanyCreatedAt',
        'viewCompanyUpdatedAt', 'viewCompanyContactLinks', 'viewCompanyDescription',
        'viewStudentsCount', 'viewCompanyStudentsList'
    ];

    elementsToClear.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '';
    });

    // Hide description section
    const descriptionSection = document.getElementById('viewCompanyDescriptionSection');
    if (descriptionSection) descriptionSection.style.display = 'none';
}

function showCompanyLoadingState(show) {
    const modal = document.getElementById('companyViewModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#companyModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'companyModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading company details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#companyModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleCompanyResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleCompanyError(error) {
    console.error('Error loading company details:', error);
    showErrorToast(error.message || 'Failed to load company details');
}

// Make functions globally available
window.openCompanyViewModal = openCompanyViewModal;
window.closeCompanyViewModal = closeCompanyViewModal;

// --------------------------------------------- OJT Company Edit Function ---------------------------------------------
function openCompanyEditModal(companyId) {
    showCompanyEditLoadingState(true);

    fetch(`/ojt-company/${companyId}/edit/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleCompanyEditResponse)
    .then(data => {
        if (data.success) {
            populateCompanyEditForm(data.company);
            showCompanyEditModal();
        } else {
            throw new Error(data.error || 'Failed to load company details for editing');
        }
    })
    .catch(handleCompanyEditError)
    .finally(() => {
        showCompanyEditLoadingState(false);
    });
}

function populateCompanyEditForm(company) {
    // Set form values
    document.getElementById('editCompanyId').value = company.id;
    document.getElementById('editCompanyName').value = company.name;
    document.getElementById('editCompanyAddress').value = company.address;
    document.getElementById('editCompanyContactNumber').value = company.contact_number;
    document.getElementById('editCompanyAvailableSlots').value = company.available_slots;
    document.getElementById('editCompanyEmail').value = company.email || '';
    document.getElementById('editCompanyDescription').value = company.description || '';
    document.getElementById('editCompanyWebsite').value = company.website || '';

    // Set current status display
    const statusElement = document.getElementById('editCompanyCurrentStatus');
    statusElement.textContent = company.status;
    statusElement.className = 'status-badge';
    switch(company.status.toLowerCase()) {
        case 'available':
            statusElement.classList.add('status-available');
            break;
        case 'limited':
            statusElement.classList.add('status-limited');
            break;
        case 'full':
            statusElement.classList.add('status-full');
            break;
        case 'archived':
            statusElement.classList.add('status-archived');
            break;
        default:
            statusElement.classList.add('status-unknown');
    }

    // Set capacity statistics
    document.getElementById('editCompanyTotalSlots').textContent = company.available_slots;
    document.getElementById('editCompanyFilledSlots').textContent = company.filled_slots;
    document.getElementById('editCompanyRemainingSlots').textContent = company.remaining_slots;
    document.getElementById('editCompanyUtilizationRate').textContent = `${company.utilization_rate}%`;

    // Set form action
    const form = document.getElementById('companyEditForm');
    form.action = `/ojt-company/${company.id}/edit/`;
}

function showCompanyEditModal() {
    const modal = document.getElementById('companyEditModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus on first input field
    setTimeout(() => {
        document.getElementById('editCompanyName').focus();
    }, 300);
}

function closeCompanyEditModal() {
    const modal = document.getElementById('companyEditModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear form and errors
    document.getElementById('companyEditFormResponse').innerHTML = '';
    document.querySelectorAll('#companyEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#companyEditModal .error-message').forEach(el => el.remove());
}

function showCompanyEditLoadingState(show) {
    const modal = document.getElementById('companyEditModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#companyEditModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'companyEditModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading company details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#companyEditModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleCompanyEditResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleCompanyEditError(error) {
    console.error('Error loading company details for editing:', error);
    showErrorToast(error.message || 'Failed to load company details for editing');
}

// Handle edit form submission
document.getElementById('companyEditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('companyEditFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('#companyEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#companyEditModal .error-message').forEach(el => el.remove());

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

    if (hasEmptyFields) {
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate contact number format
    const contactInput = document.getElementById('editCompanyContactNumber');
    const contactValue = contactInput.value.trim();
    if (contactValue && !/^[\d-]+$/.test(contactValue)) {
        contactInput.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Contact number can only contain numbers and hyphens.';
        contactInput.parentNode.appendChild(errorDiv);
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate website URL format if provided
    const websiteInput = document.getElementById('editCompanyWebsite');
    const websiteValue = websiteInput.value.trim();
    if (websiteValue && !isValidUrl(websiteValue)) {
        websiteInput.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Please enter a valid website URL (e.g., https://example.com)';
        websiteInput.parentNode.appendChild(errorDiv);
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate email format if provided
    const emailInput = document.getElementById('editCompanyEmail');
    const emailValue = emailInput.value.trim();
    if (emailValue && !isValidEmail(emailValue)) {
        emailInput.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Please enter a valid email address';
        emailInput.parentNode.appendChild(errorDiv);
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
            showSuccessToast('Company updated successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Company updated successfully! Refreshing data...
                </div>
            `;

            setTimeout(() => {
                closeCompanyEditModal();
                refreshCompaniesTable(); // Refresh the table instead of reloading the page
            }, 1500);
        } else {
            showFormErrors(form, data.errors);
            if (data.message) {
                showErrorToast(data.message);
            }
        }
    })
    .catch(error => {
        console.error('Error updating company:', error);
        if (error.errors) {
            showFormErrors(form, error.errors);
        } else {
            showErrorToast(error.message || 'An unexpected error occurred while updating company');
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

// Add contact number validation for edit form
document.getElementById('editCompanyContactNumber').addEventListener('input', function(e) {
    const input = e.target;
    const value = input.value;

    // Remove any characters that are not numbers or hyphens
    const cleaned = value.replace(/[^\d-]/g, '');

    // Prevent consecutive hyphens
    const noConsecutiveHyphens = cleaned.replace(/--+/g, '-');

    // Prevent starting or ending with hyphen
    let finalValue = noConsecutiveHyphens;
    if (finalValue.startsWith('-')) {
        finalValue = finalValue.substring(1);
    }
    if (finalValue.endsWith('-')) {
        finalValue = finalValue.slice(0, -1);
    }

    if (value !== finalValue) {
        input.value = finalValue;
    }

    // Update validation styling
    const isValid = /^[\d-]+$/.test(finalValue) &&
                   !finalValue.startsWith('-') &&
                   !finalValue.endsWith('-') &&
                   !finalValue.includes('--');

    updateFieldValidation(input, isValid, 'Only numbers and hyphens are allowed. Cannot start/end with hyphen or have consecutive hyphens.');
});

// Add website URL validation for edit form
document.getElementById('editCompanyWebsite').addEventListener('blur', function(e) {
    const input = e.target;
    const value = input.value.trim();

    if (value) {
        const isValid = isValidUrl(value);
        updateFieldValidation(input, isValid, 'Please enter a valid website URL (e.g., https://example.com)');
    } else {
        // Clear validation if field is empty
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();
    }
});

// Add email validation for edit form
document.getElementById('editCompanyEmail').addEventListener('blur', function(e) {
    const input = e.target;
    const value = input.value.trim();

    if (value) {
        const isValid = isValidEmail(value);
        updateFieldValidation(input, isValid, 'Please enter a valid email address');
    } else {
        // Clear validation if field is empty
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();
    }
});

// Auto-format website URL for edit form
document.getElementById('editCompanyWebsite').addEventListener('blur', function(e) {
    const input = e.target;
    let value = input.value.trim();

    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        value = 'https://' + value;
        input.value = value;
    }
});

// Make functions globally available
window.openCompanyEditModal = openCompanyEditModal;
window.closeCompanyEditModal = closeCompanyEditModal;

// --------------------------------------------- OJT Company Archive Function ------------------------------------------
function openCompanyArchiveModal(companyId) {
    showCompanyArchiveLoadingState(true);

    fetch(`/ojt-company/${companyId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleCompanyArchiveResponse)
    .then(data => {
        if (data.success) {
            populateCompanyArchiveModal(data.company);
            showCompanyArchiveModal();
        } else {
            throw new Error(data.error || 'Failed to load company details for archiving');
        }
    })
    .catch(handleCompanyArchiveError)
    .finally(() => {
        showCompanyArchiveLoadingState(false);
    });
}

function populateCompanyArchiveModal(company) {
    // Set company ID
    document.getElementById('archiveCompanyId').value = company.id;

    // Update modal description
    const description = document.getElementById('companyArchiveDescription');
    description.textContent = `Are you sure you want to archive "${company.name}"?`;

    // Populate company preview
    document.getElementById('archiveCompanyName').textContent = company.name;
    document.getElementById('archiveCompanyAddress').textContent = company.address || 'Not provided';
    document.getElementById('archiveCompanyContact').textContent = company.contact_number || 'Not provided';
    document.getElementById('archiveCompanyEmail').textContent = company.email || 'Not provided';
    document.getElementById('archiveCompanyWebsite').textContent = company.website || 'Not provided';
    document.getElementById('archiveCompanyStudents').textContent = company.total_students || 0;
    document.getElementById('archiveCompanySlots').textContent = `${company.remaining_slots || 0}/${company.available_slots || 0}`;

    // Truncate description if too long
    const descriptionText = company.description || 'No description provided';
    const truncatedDescription = descriptionText.length > 100 ?
        descriptionText.substring(0, 100) + '...' : descriptionText;
    document.getElementById('archiveCompanyDescription').textContent = truncatedDescription;

    // Set status badge
    const statusElement = document.getElementById('archiveCompanyStatus');
    statusElement.textContent = company.status;
    statusElement.className = 'status-badge';
    switch(company.status.toLowerCase()) {
        case 'available':
            statusElement.classList.add('status-available');
            break;
        case 'limited':
            statusElement.classList.add('status-limited');
            break;
        case 'full':
            statusElement.classList.add('status-full');
            break;
        case 'archived':
            statusElement.classList.add('status-archived');
            break;
        default:
            statusElement.classList.add('status-unknown');
    }

    // Show/hide active students warning
    const activeStudentsWarning = document.getElementById('activeStudentsWarning');
    const activeStudentsCount = document.getElementById('activeStudentsCount');
    const totalStudents = company.total_students || 0;

    if (totalStudents > 0) {
        activeStudentsCount.textContent = totalStudents;
        activeStudentsWarning.style.display = 'flex';

        // Update button text to reflect impact
        const submitBtn = document.getElementById('archiveSubmitBtn');
        submitBtn.querySelector('.btn-text').textContent = `Archive (${totalStudents} Active Students)`;
    } else {
        activeStudentsWarning.style.display = 'none';
    }

    // Set form action
    const form = document.getElementById('companyArchiveForm');
    form.action = `/ojt-company/${company.id}/archive/`;
}

function showCompanyArchiveModal() {
    const modal = document.getElementById('companyArchiveModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCompanyArchiveModal() {
    const modal = document.getElementById('companyArchiveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear form response and reset button text
    document.getElementById('companyArchiveFormResponse').innerHTML = '';
    const submitBtn = document.getElementById('archiveSubmitBtn');
    submitBtn.querySelector('.btn-text').textContent = 'Archive Company';
}

function showCompanyArchiveLoadingState(show) {
    const modal = document.getElementById('companyArchiveModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#companyArchiveModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'companyArchiveModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading company details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#companyArchiveModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleCompanyArchiveResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleCompanyArchiveError(error) {
    console.error('Error loading company details for archiving:', error);
    showErrorToast(error.message || 'Failed to load company details for archiving');
}

// Handle archive form submission
document.getElementById('companyArchiveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const companyId = document.getElementById('archiveCompanyId').value;
    const companyName = document.getElementById('archiveCompanyName').textContent;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('companyArchiveFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Show confirmation for companies with active students
    const totalStudents = parseInt(document.getElementById('archiveCompanyStudents').textContent) || 0;
    if (totalStudents > 0) {
        const confirmed = confirm(`This company has ${totalStudents} active student(s). Are you sure you want to archive it? Existing student records will be preserved.`);
        if (!confirmed) {
            submitBtn.classList.remove('is-loading');
            return;
        }
    }

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
                    message: err.error || 'Failed to archive company'
                };
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast(data.message || `"${companyName}" has been archived successfully!`);
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    ${data.message || 'Company archived successfully! This window will close shortly...'}
                </div>
            `;

            setTimeout(() => {
                closeCompanyArchiveModal();
                refreshCompaniesTable(); // Refresh the table instead of reloading the page
            }, 1500);
        } else {
            showErrorToast(data.error || `Failed to archive "${companyName}"`);
            showCompanyArchiveError(data.error || 'Failed to archive company');
        }
    })
    .catch(error => {
        console.error('Error archiving company:', error);
        const errorMessage = error.userFriendly ?
            error.message :
            'An unexpected error occurred while processing your request.';
        showErrorToast(errorMessage);
        showCompanyArchiveError(errorMessage);
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

function showCompanyArchiveError(message) {
    const formResponse = document.getElementById('companyArchiveFormResponse');
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
window.openCompanyArchiveModal = openCompanyArchiveModal;
window.closeCompanyArchiveModal = closeCompanyArchiveModal;

// ------------------------------------------- Company Export Function -------------------------------------------------
let availableCompanies = [];
let exportCompaniesUrl = '';
let isCompaniesLoading = false;

function openCompanyExportModal() {
    // Set current time
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleString();

    // Get the export URL from the button data attribute
    const exportBtn = document.getElementById('export-company-btn');
    if (exportBtn && exportBtn.dataset.exportUrl) {
        exportCompaniesUrl = exportBtn.dataset.exportUrl;
    } else {
        console.error('Export URL not found');
        showErrorToast('Export configuration error');
        return;
    }

    // Reset form and load companies
    resetExportForm();
    loadAvailableCompanies();
    updateExportPreview();

    const modal = document.getElementById('companyExportModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCompanyExportModal() {
    const modal = document.getElementById('companyExportModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form response
    document.getElementById('companyExportFormResponse').innerHTML = '';
}

function resetExportForm() {
    // Reset form to default state
    document.getElementById('exportType').value = 'all';
    document.getElementById('specificCompany').value = '';
    document.getElementById('exportCompanyTitle').value = 'OJT Companies Report';
    document.getElementById('includeStudents').checked = true;
    document.getElementById('specificCompanySection').style.display = 'none';

    // Clear any existing errors
    const formResponse = document.getElementById('companyExportFormResponse');
    formResponse.innerHTML = '';

    // Enable submit button
    const submitBtn = document.getElementById('exportSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.title = '';
}

function loadAvailableCompanies() {
    if (!exportCompaniesUrl) {
        console.error('Export URL not set');
        return;
    }

    // Prevent multiple simultaneous requests
    if (isCompaniesLoading) {
        return;
    }

    isCompaniesLoading = true;
    const dropdown = document.getElementById('specificCompany');
    const url = `${exportCompaniesUrl}?get_companies=true`;

    // Show loading state in dropdown
    dropdown.innerHTML = '<option value="">Loading companies...</option>';
    dropdown.disabled = true;

    fetch(url, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Companies data received:', data);

        // Handle different response formats
        if (data.success && data.companies) {
            availableCompanies = data.companies;
        } else if (Array.isArray(data)) {
            availableCompanies = data;
        } else if (data.companies && Array.isArray(data.companies)) {
            availableCompanies = data.companies;
        } else {
            throw new Error('Invalid companies data format');
        }

        populateCompanyDropdown();
    })
    .catch(error => {
        console.error('Error loading companies:', error);
        showErrorToast('Failed to load companies list: ' + error.message);

        // Show error in dropdown
        dropdown.innerHTML = '<option value="">Error loading companies</option>';
        dropdown.disabled = true;
    })
    .finally(() => {
        isCompaniesLoading = false;
    });
}

function populateCompanyDropdown() {
    const dropdown = document.getElementById('specificCompany');
    if (!dropdown) {
        console.error('Specific company dropdown not found');
        return;
    }

    dropdown.innerHTML = '<option value="">Select a company...</option>';
    dropdown.disabled = false;

    if (!availableCompanies || availableCompanies.length === 0) {
        console.warn('No companies available for dropdown');
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No companies available';
        option.disabled = true;
        dropdown.appendChild(option);
        dropdown.disabled = true;
        return;
    }

    console.log('Populating dropdown with', availableCompanies.length, 'companies');

    // Sort companies alphabetically
    availableCompanies.sort((a, b) => a.name.localeCompare(b.name));

    availableCompanies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.name;
        dropdown.appendChild(option);
    });

    // Update preview if specific company is selected
    updateExportPreview();
}

function handleExportTypeChange() {
    const exportType = document.getElementById('exportType').value;
    const specificCompanySection = document.getElementById('specificCompanySection');

    if (exportType === 'specific') {
        specificCompanySection.style.display = 'block';
        // Load companies if not already loaded or if empty
        if (availableCompanies.length === 0) {
            loadAvailableCompanies();
        }
    } else {
        specificCompanySection.style.display = 'none';
    }
    updateExportPreview();
}

function updateExportPreview() {
    const exportType = document.getElementById('exportType').value;
    const includeStudents = document.getElementById('includeStudents').checked;
    const specificCompany = document.getElementById('specificCompany');
    const selectedCompanyName = specificCompany.options[specificCompany.selectedIndex]?.text || '-';
    const exportTitle = document.getElementById('exportCompanyTitle').value || 'OJT Companies Report';

    // Update preview texts
    document.getElementById('previewExportType').textContent = getExportTypeDisplay(exportType);
    document.getElementById('previewSelectedCompany').textContent = selectedCompanyName;
    document.getElementById('previewIncludesStudents').textContent = includeStudents ? 'Yes' : 'No';

    // Update submit button state
    const submitBtn = document.getElementById('exportSubmitBtn');
    if (exportType === 'specific' && !specificCompany.value) {
        submitBtn.disabled = true;
        submitBtn.title = 'Please select a company';
    } else {
        submitBtn.disabled = false;
        submitBtn.title = '';
    }

    // Update summary information
    updateExportSummary(exportType, includeStudents, exportTitle);
}

function updateExportSummary(exportType, includeStudents, exportTitle) {
    const summaryItems = document.querySelectorAll('.summary-item');

    // Update format info based on selections
    let formatText = 'Professional Excel report';
    if (exportType === 'specific') {
        formatText += ' (Single Company)';
    }

    // Update includes info
    let includesText = 'Company info, slots, status';
    if (includeStudents) {
        includesText += ', students';
    }

    // You can update specific summary items here if needed
    console.log('Export Summary:', { exportType, includeStudents, exportTitle });
}

function getExportTypeDisplay(exportType) {
    const displayMap = {
        'all': 'All Companies',
        'available': 'Available Companies Only',
        'not_available': 'Not Available Companies Only',
        'specific': 'Specific Company Only'
    };
    return displayMap[exportType] || exportType;
}

function validateExportForm() {
    const exportType = document.getElementById('exportType').value;
    const specificCompany = document.getElementById('specificCompany').value;
    const exportTitle = document.getElementById('exportCompanyTitle').value.trim();

    if (exportType === 'specific' && !specificCompany) {
        return 'Please select a company to export';
    }

    if (!exportTitle) {
        return 'Please enter a report title';
    }

    if (exportTitle.length > 100) {
        return 'Report title must be less than 100 characters';
    }

    return null;
}

// Handle form submission
document.getElementById('companyExportForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (!exportCompaniesUrl) {
        showErrorToast('Export URL not configured');
        return;
    }

    const form = this;
    const formData = new FormData(form);

    // FIX: Debug the form data
    console.log('Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    // FIX: Manually set include_students value to ensure it's correct
    const includeStudentsCheckbox = document.getElementById('includeStudents');
    formData.set('include_students', includeStudentsCheckbox.checked ? 'true' : 'false');
    console.log('include_students after manual set:', formData.get('include_students'));

    const submitBtn = document.getElementById('exportSubmitBtn');
    const formResponse = document.getElementById('companyExportFormResponse');

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

    fetch(exportCompaniesUrl, {
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

        // Generate filename
        const exportType = document.getElementById('exportType').value;
        let filename = `OJT_Companies_${exportType}`;

        if (exportType === 'specific') {
            const companyName = document.getElementById('specificCompany').options[document.getElementById('specificCompany').selectedIndex].text;
            filename += `_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }

        const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '_');
        filename += `_${timestamp}.xlsx`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showSuccessToast('Export completed successfully!');
        closeCompanyExportModal();
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

// Add event listeners for real-time preview updates
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-company-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', openCompanyExportModal);
    }

    // Update preview when options change
    document.getElementById('exportType').addEventListener('change', updateExportPreview);
    document.getElementById('includeStudents').addEventListener('change', updateExportPreview);
    document.getElementById('specificCompany').addEventListener('change', updateExportPreview);
    document.getElementById('exportCompanyTitle').addEventListener('input', updateExportPreview);

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCompanyExportModal();
        }
    });
});

// Make functions globally available
window.openCompanyExportModal = openCompanyExportModal;
window.closeCompanyExportModal = closeCompanyExportModal;
window.handleExportTypeChange = handleExportTypeChange;