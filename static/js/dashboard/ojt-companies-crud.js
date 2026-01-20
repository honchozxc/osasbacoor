// ------------------------------------------- OJT Companies Table Functions -------------------------------------------
let currentCompanyPage = 1;
let currentCompanySearch = '';
let currentStatusFilter = '';
let currentSortOrder = 'name_asc';

// Load companies on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCompaniesData();

    // Add event listeners for filters if they exist
    const companySearch = document.getElementById('company-search');
    const statusFilter = document.getElementById('status-filter');
    const sortOrder = document.getElementById('sort-order');

    if (companySearch) {
        companySearch.addEventListener('input', debounce(handleCompanySearch, 300));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
    }

    if (sortOrder) {
        sortOrder.addEventListener('change', handleSortChange);
    }
});

function loadCompaniesData() {
    const searchTerm = document.getElementById('company-search') ?
        document.getElementById('company-search').value : '';

    // Check if elements exist before getting values
    const statusFilter = document.getElementById('status-filter') ?
        document.getElementById('status-filter').value : '';

    const sortOrder = document.getElementById('sort-order') ?
        (document.getElementById('sort-order').value || 'created_desc') : 'created_desc';

    // Update current state
    currentCompanySearch = searchTerm;
    currentStatusFilter = statusFilter;
    currentSortOrder = sortOrder;

    loadCompaniesPage(1, searchTerm, statusFilter, sortOrder);
}

function loadCompaniesPage(page, search = '', statusFilter = '', sortOrder = 'name_asc') {
    const tbody = document.getElementById('companies-tbody');
    const paginationContainer = document.getElementById('company-pagination-container');

    // Show loading state
    tbody.innerHTML = `
        <tr id="loading-row">
            <td colspan="7" style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                Loading companies...
            </td>
        </tr>
    `;

    // Build query parameters - include status_filter only if it has a value
    const params = new URLSearchParams({
        'get_filtered_ojt_companies': '1',
        'page': page,
        'search': search,
        'sort_order': sortOrder
    });

    // Only add status_filter if it exists and has a value
    if (statusFilter && statusFilter.trim() !== '') {
        params.append('status_filter', statusFilter);
    }

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
                <td colspan="7" style="text-align: center; padding: 20px; color: #dc3545; font-weight: 500;">
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
                <td colspan="7" style="text-align: center; padding: 40px; font-style: italic; color: #6c757d;">
                    <i class='bx bx-building-house' style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No companies found matching your criteria
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    data.companies.forEach(company => {
        // Truncate long addresses for better display
        const truncatedAddress = company.address.length > 50 ?
            company.address.substring(0, 50) + '...' : company.address;

        // Truncate name if too long
        const truncatedName = company.name.length > 30 ?
            company.name.substring(0, 30) + '...' : company.name;

        // Check permissions for this company
        const canEdit = company.can_edit || (data.current_user_type && [1, 13, 16].includes(data.current_user_type));
        const canArchive = company.can_archive || (data.current_user_type && [1, 13, 16].includes(data.current_user_type));

        // Determine status class based on actual status
        let statusClass = '';
        let statusText = '';

        // For students, we should only see active companies (archived are hidden in backend)
        if (company.is_archived) {
            statusClass = 'status-archived';
            statusText = 'Archived';
        } else if (company.status === 'active') {
            statusClass = 'status-active';
            statusText = 'Active';
        } else if (company.status === 'inactive') {
            statusClass = 'status-inactive';
            statusText = 'Inactive';
        } else {
            // Fallback for any other status
            statusClass = 'status-inactive';
            statusText = company.status_display || 'Inactive';
        }

        // For students, only show view button
        const isStudent = data.current_user_type && ![1, 13, 16].includes(data.current_user_type);

        html += `
            <tr>
                <td>${company.id}</td>
                <td title="${escapeHtml(company.name)}">${escapeHtml(truncatedName)}</td>
                <td title="${escapeHtml(company.address)}">${escapeHtml(truncatedAddress)}</td>
                <td>${escapeHtml(company.contact_number)}</td>
                <td>${escapeHtml(company.email || '-')}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="action-buttons">
                    <!-- View button - always visible -->
                    <button class="btn-action view-btn" onclick="openCompanyViewModal(${company.id})" title="View Details">
                        <i class='bx bx-show'></i>
                    </button>

                    <!-- Edit button - only for user type 1, 13, and 16 (admin, job placement, OJT Adviser) -->
                    ${!isStudent && canEdit ? `
                    <button class="btn-action edit-btn" onclick="openCompanyEditModal(${company.id})" title="Edit Company">
                        <i class='bx bx-edit'></i>
                    </button>
                    ` : ''}

                    <!-- Archive/Unarchive button - only for user type 1, 13, and 16 (admin, job placement, OJT Adviser) -->
                    ${!isStudent && canArchive ? `
                    ${company.is_archived ?
                        `<button class="btn-action unarchive-btn" onclick="openCompanyUnarchiveModal(${company.id})" title="Unarchive Company">
                            <i class='bx bx-undo'></i>
                        </button>` :
                        `<button class="btn-action archive-btn" onclick="openCompanyArchiveModal(${company.id})" title="Archive Company">
                            <i class='bx bx-archive'></i>
                        </button>`
                    }
                    ` : ''}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
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
        currentStatusFilter,
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

// Export companies data - for admin, job placement, and OJT Adviser
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-company-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openCompanyExportModal();
        });
    }
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

function refreshCompaniesTable() {
    loadCompaniesPageWithCurrentFilters(currentCompanyPage);
}

function resetCompanyFilters() {
    const companySearch = document.getElementById('company-search');
    const statusFilter = document.getElementById('status-filter');
    const sortOrder = document.getElementById('sort-order');

    if (companySearch) companySearch.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sortOrder) sortOrder.value = 'name_asc';

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

// Auto-format website URL
document.getElementById('id_website').addEventListener('blur', function(e) {
    const input = e.target;
    let value = input.value.trim();

    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        value = 'https://' + value;
        input.value = value;
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

// -------------------------------------------- View Company Functions -------------------------------------------
function openCompanyViewModal(companyId) {
    const modal = document.getElementById('companyViewModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Clear previous content
    document.getElementById('viewCompanyName').textContent = '-';
    document.getElementById('viewCompanyAddress').textContent = '-';
    document.getElementById('viewCompanyContact').textContent = '-';
    document.getElementById('viewCompanyContactLinks').innerHTML = '';
    document.getElementById('viewCompanyStatus').textContent = '-';
    document.getElementById('viewCompanyDescription').innerHTML = '';
    document.getElementById('viewCompanyPhone').textContent = '-';
    document.getElementById('viewCompanyEmail').textContent = '-';
    document.getElementById('viewCompanyWebsite').textContent = '-';
    document.getElementById('viewCompanyCreatedAt').textContent = '-';
    document.getElementById('viewCompanyUpdatedAt').textContent = '-';

    // Hide description section initially
    const descriptionSection = document.getElementById('viewCompanyDescriptionSection');
    descriptionSection.style.display = 'none';

    // Fetch company data
    fetch(`/ojt-company/${companyId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const company = data.company;

            // Basic Information
            document.getElementById('viewCompanyName').textContent = company.name;
            document.getElementById('viewCompanyAddress').textContent = company.address;
            document.getElementById('viewCompanyContact').textContent = company.contact_number;

            // Contact Links
            const contactLinksDiv = document.getElementById('viewCompanyContactLinks');
            if (company.email) {
                contactLinksDiv.innerHTML += `
                    <a href="mailto:${company.email}" class="contact-link email-link">
                        <i class='bx bx-envelope'></i> ${company.email}
                    </a>
                `;
            }
            if (company.website) {
                contactLinksDiv.innerHTML += `
                    <a href="${company.website}" target="_blank" class="contact-link website-link">
                        <i class='bx bx-globe'></i> Visit Website
                    </a>
                `;
            }

            // Status
            const statusBadge = document.getElementById('viewCompanyStatus');
            statusBadge.textContent = company.status;
            statusBadge.className = 'status-badge ' + (company.is_archived ? 'status-archived' : 'status-available');

            // Description
            if (company.description) {
                descriptionSection.style.display = 'block';
                document.getElementById('viewCompanyDescription').innerHTML = company.description;
            }

            // Contact Details
            document.getElementById('viewCompanyPhone').textContent = company.contact_number || '-';
            document.getElementById('viewCompanyEmail').textContent = company.email || '-';
            document.getElementById('viewCompanyWebsite').innerHTML = company.website ?
                `<a href="${company.website}" target="_blank">${company.website}</a>` : '-';

            // Timeline
            document.getElementById('viewCompanyCreatedAt').textContent = company.created_at || '-';
            document.getElementById('viewCompanyUpdatedAt').textContent = company.updated_at || '-';
        } else {
            showErrorToast('Failed to load company details');
            closeCompanyViewModal();
        }
    })
    .catch(error => {
        console.error('Error fetching company details:', error);
        showErrorToast('Failed to load company details');
        closeCompanyViewModal();
    });
}

function closeCompanyViewModal() {
    const modal = document.getElementById('companyViewModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

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
    document.getElementById('editCompanyEmail').value = company.email || '';
    document.getElementById('editCompanyDescription').value = company.description || '';
    document.getElementById('editCompanyWebsite').value = company.website || '';

    // Set status select value
    const statusSelect = document.getElementById('editCompanyStatus');
    if (statusSelect) {
        statusSelect.value = company.status;
    }

    // Set current status display
    const statusElement = document.getElementById('editCompanyCurrentStatus');
    if (statusElement) {
        statusElement.textContent = company.status.charAt(0).toUpperCase() + company.status.slice(1);

        // Set status badge class
        let statusClass = '';
        if (company.is_archived) {
            statusClass = 'status-archived';
        } else if (company.status === 'active') {
            statusClass = 'status-active';
        } else if (company.status === 'inactive') {
            statusClass = 'status-inactive';
        }
        statusElement.className = 'status-badge ' + statusClass;
    }

    // Set form action
    const form = document.getElementById('companyEditForm');
    form.action = `/ojt-company/${company.id}/edit/`;

    // Initialize status change warning
    initializeStatusChangeWarning();
}

function initializeStatusChangeWarning() {
    const statusSelect = document.getElementById('editCompanyStatus');
    const currentStatusElement = document.getElementById('editCompanyCurrentStatus');
    const warningDiv = document.getElementById('statusChangeWarning');
    const warningText = document.getElementById('statusWarningText');

    if (!statusSelect || !currentStatusElement || !warningDiv || !warningText) {
        return;
    }

    const currentStatus = currentStatusElement.textContent.toLowerCase();
    const initialStatus = statusSelect.value;

    // Set initial state
    if (initialStatus && initialStatus !== currentStatus) {
        showStatusWarning(currentStatus, initialStatus);
    } else {
        warningDiv.style.display = 'none';
    }

    // Listen for changes
    statusSelect.addEventListener('change', function() {
        if (this.value && this.value !== currentStatus) {
            showStatusWarning(currentStatus, this.value);
        } else {
            warningDiv.style.display = 'none';
        }
    });
}

function showStatusWarning(currentStatus, newStatus) {
    const warningDiv = document.getElementById('statusChangeWarning');
    const warningText = document.getElementById('statusWarningText');

    if (!warningDiv || !warningText) {
        return;
    }

    if (currentStatus === 'active' && newStatus === 'inactive') {
        warningText.textContent = 'Setting company to inactive will hide it from student selections and reduce its visibility.';
        warningDiv.style.display = 'flex';
    } else if (currentStatus === 'inactive' && newStatus === 'active') {
        warningText.textContent = 'Setting company to active will make it available for student selections and increase its visibility.';
        warningDiv.style.display = 'flex';
    } else {
        warningDiv.style.display = 'none';
    }
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
    const warningDiv = document.getElementById('statusChangeWarning');
    if (warningDiv) {
        warningDiv.style.display = 'none';
    }

    document.querySelectorAll('#companyEditModal .form-input, #companyEditModal .form-select').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#companyEditModal .error-message').forEach(el => el.remove());

    // Reset status warning
    const warningText = document.getElementById('statusWarningText');
    if (warningText) {
        warningText.textContent = '';
    }
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
    document.querySelectorAll('#companyEditModal .form-input, #companyEditModal .form-select').forEach(el => el.classList.remove('error'));
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

    // Validate status field
    const statusSelect = document.getElementById('editCompanyStatus');
    if (statusSelect && !statusSelect.value) {
        statusSelect.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Please select a status for the company';
        statusSelect.parentNode.appendChild(errorDiv);
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
            let successMessage = 'Company updated successfully!';
            if (data.status_changed) {
                successMessage = 'Company updated successfully! Status has been changed.';
            }

            showSuccessToast(successMessage);
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    ${successMessage} Refreshing data...
                </div>
            `;

            setTimeout(() => {
                closeCompanyEditModal();
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

// Add status validation for edit form
const statusSelect = document.getElementById('editCompanyStatus');
if (statusSelect) {
    statusSelect.addEventListener('change', function(e) {
        const input = e.target;
        const value = input.value.trim();

        if (!value) {
            input.classList.add('error');
            const existingError = input.parentNode.querySelector('.error-message');
            if (!existingError) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = 'Please select a status';
                input.parentNode.appendChild(errorDiv);
            }
        } else {
            input.classList.remove('error');
            const existingError = input.parentNode.querySelector('.error-message');
            if (existingError) existingError.remove();
        }
    });
}

// Auto-format website URL for edit form
document.getElementById('editCompanyWebsite').addEventListener('blur', function(e) {
    const input = e.target;
    let value = input.value.trim();

    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        value = 'https://' + value;
        input.value = value;
    }
});

// Inject CSS for status badges and styling
function injectStatusStyles() {
    if (document.getElementById('company-status-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'company-status-styles';
    style.textContent = `
        .status-badge.status-active {
            background-color: #f6ffed;
            color: #52c41a;
            border: 1px solid #b7eb8f;
        }
        .status-badge.status-inactive {
            background-color: #fff7e6;
            color: #fa8c16;
            border: 1px solid #ffd591;
        }
        .status-badge.status-archived {
            background-color: #fff2f0;
            color: #ff4d4f;
            border: 1px solid #ffccc7;
        }
        .form-section {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid var(--border-color);
        }
        .form-section-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }
        .alert-warning {
            background-color: #fff7e6;
            border: 1px solid #ffd591;
            color: #fa8c16;
            padding: 12px 16px;
            border-radius: 8px;
            margin-top: 16px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 14px;
        }
        .alert-warning svg {
            flex-shrink: 0;
            margin-top: 2px;
        }
        .current-status {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .current-status .help-text {
            color: var(--text-secondary);
            font-size: 12px;
        }
        .form-select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background-color: white;
            font-size: 14px;
            color: var(--text-primary);
            transition: border-color 0.2s;
        }
        .form-select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .form-select.error {
            border-color: #f5222d;
        }
    `;
    document.head.appendChild(style);
}

// Inject styles when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStatusStyles);
} else {
    injectStatusStyles();
}

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

    // Truncate description if too long
    const descriptionText = company.description || 'No description provided';
    const truncatedDescription = descriptionText.length > 100 ?
        descriptionText.substring(0, 100) + '...' : descriptionText;
    document.getElementById('archiveCompanyDescription').textContent = truncatedDescription;

    // Set status badge
    const statusElement = document.getElementById('archiveCompanyStatus');
    statusElement.textContent = company.is_archived ? 'Archived' : 'Active';
    statusElement.className = 'status-badge ' + (company.is_archived ? 'status-archived' : 'status-available');

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
                window.location.reload();
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
let exportCompaniesUrl = '';

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

    // Reset form and update preview
    resetExportForm();
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
    document.getElementById('statusFilter').value = 'active';
    document.getElementById('exportCompanyTitle').value = 'OJT Companies Report';
    document.getElementById('statusFilterSection').style.display = 'none';

    // Clear any existing errors
    const formResponse = document.getElementById('companyExportFormResponse');
    formResponse.innerHTML = '';

    // Enable submit button
    const submitBtn = document.getElementById('exportSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.title = '';
}

function handleExportTypeChange() {
    const exportType = document.getElementById('exportType').value;
    const statusFilterSection = document.getElementById('statusFilterSection');

    if (exportType === 'by_status') {
        statusFilterSection.style.display = 'block';
    } else {
        statusFilterSection.style.display = 'none';
    }
    updateExportPreview();
}

function updateExportPreview() {
    const exportType = document.getElementById('exportType').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const exportTitle = document.getElementById('exportCompanyTitle').value || 'OJT Companies Report';

    // Update preview texts
    const exportTypeDisplay = exportType === 'all' ? 'All Companies' : 'By Status';
    document.getElementById('previewExportType').textContent = exportTypeDisplay;

    const statusFilterDisplay = exportType === 'by_status'
        ? (statusFilter === 'active' ? 'Active Companies' : 'Inactive Companies')
        : '-';
    document.getElementById('previewStatusFilter').textContent = statusFilterDisplay;

    // Template has these 5 columns based on your model
    document.getElementById('previewColumns').textContent =
    'Name, Address, Contact No, Email, Description, Status, Website';

    // Update submit button state
    const submitBtn = document.getElementById('exportSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.title = '';

    // Update summary information
    updateExportSummary(exportType, exportTitle, statusFilter);
}

function updateExportSummary(exportType, exportTitle, statusFilter) {
    // Update format info in summary
    const formatElement = document.querySelector('.summary-item:first-child div');
    if (formatElement) {
        let formatText = 'Professional Template';
        if (exportType === 'by_status') {
            const statusText = statusFilter === 'active' ? 'Active' : 'Inactive';
            formatText += ` (${statusText} Only)`;
        }
        formatElement.innerHTML = `<strong>Format:</strong> ${formatText}`;
    }
}

function validateExportForm() {
    const exportType = document.getElementById('exportType').value;
    const exportTitle = document.getElementById('exportCompanyTitle').value.trim();

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

    // Add export_option for backward compatibility with Django view
    const exportType = document.getElementById('exportType').value;
    const statusFilter = document.getElementById('statusFilter').value;

    if (exportType === 'all') {
        formData.append('export_option', 'all');
    } else {
        formData.append('export_option', statusFilter); // 'active' or 'inactive'
    }

    // Debug the form data
    console.log('Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

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

        // Generate filename based on export type
        const exportType = document.getElementById('exportType').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filename = 'OJT_Companies';
        if (exportType === 'all') {
            filename += '_All';
        } else {
            filename += `_${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`;
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
    document.getElementById('statusFilter').addEventListener('change', updateExportPreview);
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