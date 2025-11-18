// ------------------------------------------- Search and Filters Function ---------------------------------------------
let currentOrganizationFilters = {
    search: '',
    type: 'all',
    status: 'all'
};

let organizationSearchTimeout;

// Initialize organization search and filters
function initializeOrganizationFilters() {
    console.log('Initializing organization filters...');

    // Search input handler with debounce
    const searchInput = document.getElementById('organizationSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            currentOrganizationFilters.search = e.target.value.trim();
            clearTimeout(organizationSearchTimeout);
            organizationSearchTimeout = setTimeout(() => {
                loadOrganizationsWithFilters();
            }, 500);
        });
    }

    // Type filter handler
    const typeFilter = document.getElementById('organizationTypeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', function(e) {
            currentOrganizationFilters.type = e.target.value;
            loadOrganizationsWithFilters();
        });
    }

    // Status filter handler
    const statusFilter = document.getElementById('organizationStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function(e) {
            currentOrganizationFilters.status = e.target.value;
            loadOrganizationsWithFilters();
        });
    }

    // Reset filters
    const resetBtn = document.getElementById('resetOrganizationFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetOrganizationFilters);
    }
}

// Load organizations with current filters
function loadOrganizationsWithFilters() {
    console.log('Loading organizations with filters:', currentOrganizationFilters);
    showOrganizationLoadingState(true);

    const params = new URLSearchParams({
        get_filtered_organizations: '1',
        search: currentOrganizationFilters.search,
        type: currentOrganizationFilters.type,
        status: currentOrganizationFilters.status,
        organization_page: getCurrentOrganizationPage() || 1
    });

    fetch(`?${params.toString()}`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateOrganizationTable(data.organizations);
            updateOrganizationPagination(data.pagination);
        } else {
            throw new Error(data.error || 'Failed to load organizations');
        }
    })
    .catch(error => {
        console.error('Error loading organizations:', error);
        showErrorToast('Failed to load organizations');
    })
    .finally(() => {
        showOrganizationLoadingState(false);
    });
}

// Update organization table with new data
function updateOrganizationTable(organizations) {
    const tbody = document.querySelector('#organizations-table tbody');
    const emptyRow = document.querySelector('#organizations-table .empty-table');

    if (!tbody) return;

    if (organizations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table">
                    <div class="empty-state">
                        <i class='bx bxs-group'></i>
                        <p>No organizations found matching your criteria</p>
                        ${document.querySelector('.empty-table .primary-btn') ?
                          document.querySelector('.empty-table .primary-btn').outerHTML :
                          '<button class="primary-btn" onclick="resetOrganizationFilters()">Clear Filters</button>'}
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    organizations.forEach(organization => {
        html += `
            <tr data-created-at="${organization.created_at}" data-status="${organization.organization_status}">
                <td>
                    <div class="organization-info">
                        ${organization.organization_logo_url ?
                            `<img src="${organization.organization_logo_url}" alt="${organization.organization_name}" class="organization-logo">` :
                            `<div class="organization-logo placeholder">
                                <i class='bx bxs-group'></i>
                            </div>`
                        }
                        <div class="organization-details">
                            <strong>${escapeHtml(organization.organization_name)}</strong>
                            <small>${escapeHtml(organization.organization_email)}</small>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(organization.organization_acronym)}</td>
                <td>
                    <span class="type-badge ${organization.organization_type === 'student' ? 'student' : 'sociocultural'}">
                        ${escapeHtml(organization.organization_type_display)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${getStatusBadgeClass(organization.organization_status)}">
                        ${escapeHtml(organization.organization_status_display)}
                    </span>
                    ${organization.organization_status === 'pending' ? `
                        <br>
                        <small class="requirements-status ${organization.all_requirements_submitted ? 'requirements-complete' : 'requirements-incomplete'}">
                            ${organization.all_requirements_submitted ? '✓ Ready for approval' : '⚠ Requirements incomplete'}
                        </small>
                    ` : ''}
                </td>
                <td>
                    ${organization.organization_valid_until ? `
                        <span class="${organization.organization_needs_renewal ? 'expired-text' : ''}">
                            ${formatDate(organization.organization_valid_until)}
                        </span>
                        ${organization.organization_needs_renewal ? `
                            <br><small class="renewal-notice">Needs Renewal</small>
                        ` : ''}
                    ` : '-'}
                </td>
                <td>
                    <div class="renewal-count">
                        <span class="renewal-badge ${organization.renew_count > 0 ? 'has-renewals' : 'no-renewals'}">
                            <i class='bx bx-refresh'></i>
                            ${organization.renew_count}
                        </span>
                        ${organization.renew_count > 0 ? `
                            <small class="renewal-text">renewal${organization.renew_count !== 1 ? 's' : ''}</small>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <span class="member-count">
                        ${organization.organization_member_count} members
                    </span>
                </td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="btn-icon btn-view-organization" onclick="openOrganizationViewModal(${organization.id})" title="View Organization">
                            <i class="ri-eye-fill"></i>
                        </button>

                        ${organization.can_edit ? `
                            <button class="btn-icon btn-edit-organization" onclick="openEditOrganizationModal(${organization.id})" title="Edit Organization">
                                <i class='bx bx-edit'></i>
                            </button>
                        ` : ''}

                        ${organization.organization_status === 'pending' && organization.all_requirements_submitted && organization.can_edit ? `
                            <button class="btn-icon btn-approve-organization" onclick="openApproveOrganizationModal(${organization.id}, '${escapeHtml(organization.organization_name)}')" title="Approve Organization">
                                <i class='bx bx-check'></i>
                            </button>
                        ` : ''}

                        ${organization.organization_status === 'cancelled' && organization.can_edit ? `
                            <button class="btn-icon btn-reactivate-organization" onclick="openReactivateOrganizationModal(${organization.id}, '${escapeHtml(organization.organization_name)}')" title="Reactivate Organization">
                                <i class='bx bx-reset'></i>
                            </button>
                        ` : ''}

                        ${(organization.organization_status === 'expired' || organization.organization_needs_renewal) && organization.can_edit ? `
                            <button class="btn-icon btn-renew-organization" onclick="openRenewOrganizationModal(${organization.id}, '${escapeHtml(organization.organization_name)}')" title="Renew Organization">
                                <i class='bx bx-refresh'></i>
                            </button>
                        ` : ''}

                        ${organization.can_edit ? `
                            <button class="btn-icon btn-archive-organization" onclick="openArchiveOrganizationModal(${organization.id}, '${escapeHtml(organization.organization_name)}')" title="Archive Organization">
                                <i class='bx bxs-archive'></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Update pagination
function updateOrganizationPagination(pagination) {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;

    let html = `
        <div class="pagination-info">
            Showing ${pagination.start_index} to ${pagination.end_index} of ${pagination.total_count} entries
        </div>
        <div class="pagination-controls">
    `;

    // Previous buttons
    if (pagination.has_previous) {
        html += `
            <a href="javascript:void(0)" onclick="goToOrganizationPage(1)" class="pagination-btn first-page" title="First Page">
                <i class='bx bx-chevrons-left'></i>
            </a>
            <a href="javascript:void(0)" onclick="goToOrganizationPage(${pagination.current_page - 1})" class="pagination-btn prev-page" title="Previous Page">
                <i class='bx bx-chevron-left'></i>
            </a>
        `;
    } else {
        html += `
            <span class="pagination-btn first-page disabled" title="First Page">
                <i class='bx bx-chevrons-left'></i>
            </span>
            <span class="pagination-btn prev-page disabled" title="Previous Page">
                <i class='bx bx-chevron-left'></i>
            </span>
        `;
    }

    // Page numbers
    html += '<div class="page-numbers">';
    const startPage = Math.max(1, pagination.current_page - 2);
    const endPage = Math.min(pagination.num_pages, pagination.current_page + 2);

    for (let i = startPage; i <= endPage; i++) {
        if (i === pagination.current_page) {
            html += `<span class="pagination-btn current-page active">${i}</span>`;
        } else {
            html += `<a href="javascript:void(0)" onclick="goToOrganizationPage(${i})" class="pagination-btn page-number">${i}</a>`;
        }
    }
    html += '</div>';

    // Next buttons
    if (pagination.has_next) {
        html += `
            <a href="javascript:void(0)" onclick="goToOrganizationPage(${pagination.current_page + 1})" class="pagination-btn next-page" title="Next Page">
                <i class='bx bx-chevron-right'></i>
            </a>
            <a href="javascript:void(0)" onclick="goToOrganizationPage(${pagination.num_pages})" class="pagination-btn last-page" title="Last Page">
                <i class='bx bx-chevrons-right'></i>
            </a>
        `;
    } else {
        html += `
            <span class="pagination-btn next-page disabled" title="Next Page">
                <i class='bx bx-chevron-right'></i>
            </span>
            <span class="pagination-btn last-page disabled" title="Last Page">
                <i class='bx bx-chevrons-right'></i>
            </span>
        `;
    }

    html += '</div>';
    paginationContainer.innerHTML = html;
}

// Go to specific page
function goToOrganizationPage(page) {
    currentOrganizationFilters.page = page;
    loadOrganizationsWithFilters();
}

// Get current page
function getCurrentOrganizationPage() {
    return currentOrganizationFilters.page || 1;
}

// Reset all filters
function resetOrganizationFilters() {
    currentOrganizationFilters = {
        search: '',
        type: 'all',
        status: 'all',
        page: 1
    };

    // Reset form elements
    const searchInput = document.getElementById('organizationSearch');
    const typeFilter = document.getElementById('organizationTypeFilter');
    const statusFilter = document.getElementById('organizationStatusFilter');

    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';

    loadOrganizationsWithFilters();
}

// Get status badge class
function getStatusBadgeClass(status) {
    const statusClasses = {
        'active': 'active',
        'pending': 'pending',
        'expired': 'expired',
        'rejected': 'rejected',
        'cancelled': 'cancelled',
        'inactive': 'inactive'
    };
    return statusClasses[status] || 'inactive';
}

// Show/hide loading state
function showOrganizationLoadingState(show) {
    const loadingOverlay = document.getElementById('organizations-loading');
    const tableContainer = document.getElementById('organizations-table-container');

    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    if (tableContainer) {
        tableContainer.style.opacity = show ? '0.6' : '1';
    }
}

// ------------------------------------------- Renew Organization Function ---------------------------------------------
let currentRenewOrganizationId = null;
let currentRenewCount = 0;

function openRenewOrganizationModal(organizationId, organizationName = null) {
    console.log('DEBUG: Opening renew organization modal for ID:', organizationId);
    currentRenewOrganizationId = organizationId;
    showOrganizationRenewLoadingState(true);

    fetch(`/organizations/${organizationId}/view/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleOrganizationRenewResponse)
    .then(data => {
        console.log('DEBUG: Received organization data for renewal:', data);
        if (data.success) {
            populateOrganizationRenewModal(data.organization);
            showOrganizationRenewModal();
        } else {
            throw new Error(data.error || 'Failed to load organization details for renewal');
        }
    })
    .catch(handleOrganizationRenewError)
    .finally(() => {
        showOrganizationRenewLoadingState(false);
    });
}

function populateOrganizationRenewModal(organization) {
    console.log('DEBUG: Populating renew modal with organization data:', organization);

    document.getElementById('renewOrganizationId').value = organization.id;

    currentRenewCount = organization.renew_count || 0;

    // Basic Organization Information
    document.getElementById('renewOrganizationName').textContent = organization.organization_name || '-';
    document.getElementById('renewOrganizationAcronym').textContent = organization.organization_acronym || '-';
    document.getElementById('renewOrganizationType').textContent = organization.organization_type_display || '-';
    document.getElementById('currentRenewCount').textContent = currentRenewCount;
    document.getElementById('currentRenewCountDisplay').textContent = currentRenewCount;
    document.getElementById('newRenewCount').textContent = currentRenewCount + 1;
    document.getElementById('renewMemberCount').textContent = organization.organization_member_count || '0';

    // Current validity period
    document.getElementById('currentValidUntil').textContent = formatDate(organization.organization_valid_until) || '-';

    // Current status
    const currentStatus = organization.organization_status_display || organization.organization_status || '-';
    document.getElementById('currentStatusDisplay').textContent = currentStatus;

    // Organization Logo
    const logoElement = document.getElementById('renewOrganizationLogo');
    if (organization.organization_logo_url) {
        logoElement.innerHTML = `<img src="${organization.organization_logo_url}" alt="${organization.organization_name}" class="organization-logo-preview-img">`;
        logoElement.classList.remove('logo-placeholder');
    } else {
        logoElement.innerHTML = `<i class='bx bxs-group'></i>`;
        logoElement.classList.add('logo-placeholder');
    }

    // Populate optional fields with current data
    document.getElementById('renew_organization_description').value = organization.organization_description || '';
    document.getElementById('renew_organization_mission').value = organization.organization_mission || '';
    document.getElementById('renew_organization_vision').value = organization.organization_vision || '';

    // Set default dates (today for valid from, +1 year for valid until)
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    document.getElementById('renew_organization_valid_from').value = today.toISOString().split('T')[0];
    document.getElementById('renew_organization_valid_until').value = oneYearLater.toISOString().split('T')[0];

    // Update renewal date display
    document.getElementById('renewalDateDisplay').textContent = `Today (${formatDate(today.toISOString().split('T')[0])})`;
    document.getElementById('newValidUntilDisplay').textContent = formatDate(oneYearLater.toISOString().split('T')[0]);

    // Show/hide student organization specific requirements
    toggleRenewOrganizationRequirements(organization.organization_type);

    console.log('DEBUG: Renew modal populated successfully');
}

// Toggle organization requirements based on type
function toggleRenewOrganizationRequirements(organizationType) {
    const studentRequirements = document.getElementById('studentOrgRequirements');

    if (organizationType === 'student') {
        studentRequirements.style.display = 'block';
    } else {
        studentRequirements.style.display = 'none';
    }
}

// Calculate valid until date based on valid from date
function calculateRenewValidUntil() {
    const validFromInput = document.getElementById('renew_organization_valid_from');
    const validUntilInput = document.getElementById('renew_organization_valid_until');
    const newValidUntilDisplay = document.getElementById('newValidUntilDisplay');

    if (validFromInput && validFromInput.value) {
        const validFrom = new Date(validFromInput.value);
        const validUntil = new Date(validFrom);
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        validUntilInput.value = validUntil.toISOString().split('T')[0];

        // Update the summary display
        if (newValidUntilDisplay) {
            newValidUntilDisplay.textContent = formatDate(validUntilInput.value);
        }
    }
}

// Handle file selection for renew modal
function handleRenewFileSelection(input) {
    const file = input.files[0];
    const fileNameDisplay = document.getElementById(input.id + 'FileName');
    const uploadBox = input.closest('.file-upload-box');

    if (!fileNameDisplay || !uploadBox) {
        console.error('File name display or upload box not found for:', input.id);
        return;
    }

    if (file) {
        // Validate file size based on file type
        let maxSize;
        if (input.accept.includes('image')) {
            maxSize = 5 * 1024 * 1024; // 5MB for images
        } else {
            maxSize = 10 * 1024 * 1024; // 10MB for documents
        }

        if (file.size > maxSize) {
            const sizeText = maxSize === 5 * 1024 * 1024 ? '5MB' : '10MB';
            showErrorToast(`File size too large. Maximum size is ${sizeText}`);
            input.value = '';
            fileNameDisplay.textContent = 'No file selected';
            fileNameDisplay.style.color = '#64748b';
            clearRenewFileIndicator(input);
            uploadBox.style.borderColor = '#e2e8f0';
            uploadBox.style.backgroundColor = '';
            return;
        }

        // Show file name with success styling
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.style.color = '#059669';
        fileNameDisplay.style.fontWeight = '600';

        // Update upload box to show success state
        uploadBox.style.borderColor = '#10b981';
        uploadBox.style.backgroundColor = '#f0fdf4';

        // Create file indicator
        createRenewFileIndicator(input, file);

        console.log('File selected for renewal:', file.name, 'for input:', input.id);
    } else {
        fileNameDisplay.textContent = 'No file selected';
        fileNameDisplay.style.color = '#64748b';
        fileNameDisplay.style.fontWeight = 'normal';
        clearRenewFileIndicator(input);
        uploadBox.style.borderColor = '#e2e8f0';
        uploadBox.style.backgroundColor = '';
    }
}

// Create file indicator for renew modal
function createRenewFileIndicator(input, file) {
    clearRenewFileIndicator(input);

    const indicatorContainer = document.createElement('div');
    indicatorContainer.className = 'file-indicator';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-indicator-content';

    const fileIcon = document.createElement('div');
    fileIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    `;

    const fileDetails = document.createElement('div');
    fileDetails.className = 'file-indicator-details';

    const fileName = document.createElement('div');
    fileName.className = 'file-indicator-name';
    fileName.textContent = file.name;

    const fileSize = document.createElement('div');
    fileSize.className = 'file-indicator-size';
    fileSize.textContent = formatFileSize(file.size);

    fileDetails.appendChild(fileName);
    fileDetails.appendChild(fileSize);

    fileInfo.appendChild(fileIcon);
    fileInfo.appendChild(fileDetails);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'file-indicator-remove';
    removeBtn.innerHTML = '<i class="bx bx-x"></i>';
    removeBtn.title = 'Remove file';
    removeBtn.onclick = function() {
        input.value = '';
        const fileNameDisplay = document.getElementById(input.id + 'FileName');
        const uploadBox = input.closest('.file-upload-box');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = 'No file selected';
            fileNameDisplay.style.color = '#64748b';
            fileNameDisplay.style.fontWeight = 'normal';
        }
        if (uploadBox) {
            uploadBox.style.borderColor = '#e2e8f0';
            uploadBox.style.backgroundColor = '';
        }
        clearRenewFileIndicator(input);
    };

    indicatorContainer.appendChild(fileInfo);
    indicatorContainer.appendChild(removeBtn);

    const fileInfoContainer = input.closest('.file-upload-container').querySelector('.file-info');
    if (fileInfoContainer) {
        fileInfoContainer.appendChild(indicatorContainer);
    }
}

// Clear file indicator for renew modal
function clearRenewFileIndicator(input) {
    const fileInfo = input.closest('.file-upload-container');
    if (fileInfo) {
        const existingIndicator = fileInfo.querySelector('.file-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
}

// Show renew modal
function showOrganizationRenewModal() {
    const modal = document.getElementById('organizationRenewModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close renew modal
function closeOrganizationRenewModal() {
    const modal = document.getElementById('organizationRenewModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetOrganizationRenewForm();
    }
}

// Reset renew form
function resetOrganizationRenewForm() {
    const form = document.getElementById('organizationRenewForm');
    if (!form) return;

    form.reset();

    // Clear file inputs
    const fileInputs = form.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.value = '';
    });

    // Clear file indicators
    const fileIndicators = form.querySelectorAll('.file-indicator');
    fileIndicators.forEach(indicator => {
        indicator.remove();
    });

    // Reset file name displays
    const fileNames = form.querySelectorAll('[id$="FileName"]');
    fileNames.forEach(el => {
        el.textContent = 'No file selected';
        el.style.color = '#64748b';
        el.style.fontWeight = 'normal';
    });

    // Reset upload boxes
    const uploadBoxes = form.querySelectorAll('.file-upload-box');
    uploadBoxes.forEach(box => {
        box.style.borderColor = '#e2e8f0';
        box.style.backgroundColor = '';
    });

    // Hide student requirements section
    const studentRequirements = document.getElementById('studentOrgRequirements');
    if (studentRequirements) {
        studentRequirements.style.display = 'none';
    }

    // Clear form response
    const formResponse = document.getElementById('organizationRenewFormResponse');
    if (formResponse) {
        formResponse.innerHTML = '';
    }

    currentRenewOrganizationId = null;
    currentRenewCount = 0;
}

// Submit organization renewal
function submitOrganizationRenewal() {
    const organizationId = document.getElementById('renewOrganizationId').value;
    const organizationName = document.getElementById('renewOrganizationName').textContent;
    const validFrom = document.getElementById('renew_organization_valid_from').value;
    const validUntil = document.getElementById('renew_organization_valid_until').value;

    const submitBtn = document.querySelector('#organizationRenewModal .btn-primary');
    const formResponse = document.getElementById('organizationRenewFormResponse');

    if (!organizationId) {
        showErrorToast('Organization ID not found');
        return;
    }

    // Validate required fields
    if (!validFrom || !validUntil) {
        showErrorToast('Please provide both Valid From and Valid Until dates');
        return;
    }

    // Validate date range (should be exactly 1 year)
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);
    const diffTime = Math.abs(untilDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays !== 365) {
        showErrorToast('Organization registration must be exactly 1 year (365 days)');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bx bx-loader-circle bx-spin"></i> Processing Renewal...';
    formResponse.innerHTML = '';

    const formData = new FormData(document.getElementById('organizationRenewForm'));
    formData.append('csrfmiddlewaretoken', getCSRFToken());
    formData.append('renew_count', currentRenewCount + 1);

    // Add all file fields that might be present
    const allFileFields = [
        'organization_calendar_activities',
        'organization_cbl',
        'organization_ar',
        'organization_cog',
        'organization_adviser_cv',
        'organization_group_picture',
        'organization_list_members',
        'organization_acceptance_letter',
        'organization_previous_calendar',
        'organization_good_moral',
        'organization_member_biodata',
        'organization_financial_report',
        'organization_coa'
    ];

    // Add any files that were selected
    allFileFields.forEach(field => {
        const fileInput = document.getElementById(`renew_${field}`);
        if (fileInput && fileInput.files[0]) {
            formData.append(field, fileInput.files[0]);
        }
    });

    fetch(`/organizations/${organizationId}/renew/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <i class='bx bx-check-circle'></i>
                    ${data.message || 'Organization renewal submitted successfully!'}
                    <br><br>
                    <small>The organization status has been set to "Pending" and will require re-approval.</small>
                </div>
            `;

            showSuccessToast(data.message || `"${organizationName}" renewal submitted successfully!`);

            setTimeout(() => {
                closeOrganizationRenewModal();
                window.location.reload();
            }, 3000);

        } else {
            throw new Error(data.error || 'Renewal failed');
        }
    })
    .catch(error => {
        console.error('Renewal error:', error);
        formResponse.innerHTML = `
            <div class="response-message response-error">
                <i class='bx bx-error-circle'></i>
                ${error.message || 'Failed to submit organization renewal'}
            </div>
        `;
        showErrorToast(error.message || 'Renewal failed');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bx bx-refresh"></i> Submit Renewal';
    });
}

// Loading state for renew modal
function showOrganizationRenewLoadingState(show) {
    const modal = document.getElementById('organizationRenewModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#organizationRenewModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'organizationRenewModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading organization details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#organizationRenewModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

// Response handlers for renew
function handleOrganizationRenewResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleOrganizationRenewError(error) {
    console.error('Error loading organization details for renewal:', error);
    showErrorToast(error.message || 'Failed to load organization details for renewal');
}

// ----------------------------------------- Approve Organization Function ---------------------------------------------
let currentApproveOrganizationId = null;

// Open approve modal
function openApproveOrganizationModal(organizationId, organizationName = null) {
    console.log('Opening approve modal for organization:', organizationId);
    currentApproveOrganizationId = organizationId;

    // Set current date for certificate
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('certificateDate').value = today;
    updateCertificatePreview();

    // Fetch organization details
    fetch(`/organizations/${organizationId}/view/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network error');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            populateApproveModal(data.organization);
            showApproveModal();
        } else {
            throw new Error(data.error || 'Failed to load organization');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorToast('Failed to load organization details');
        if (organizationName) {
            document.getElementById('approveOrganizationName').textContent = organizationName;
        }
        showApproveModal();
    });
}

// Populate modal with organization data
function populateApproveModal(organization) {
    document.getElementById('approveOrganizationId').value = organization.id;
    document.getElementById('approveOrganizationName').textContent = organization.organization_name || 'Unknown';
    document.getElementById('approveOrganizationAcronym').textContent = organization.organization_acronym || 'N/A';
    document.getElementById('approveOrganizationType').textContent = organization.organization_type_display || '';

    // Adviser information
    document.getElementById('approveAdviserName').textContent = organization.organization_adviser_name || 'Not specified';
    document.getElementById('approveAdviserDepartment').textContent = organization.organization_adviser_department || 'Not specified';

    // Dates
    document.getElementById('approveValidFrom').textContent = organization.organization_valid_from || 'Not set';
    document.getElementById('approveValidUntil').textContent = organization.organization_valid_until || 'Not set';

    // Member count and school year
    document.getElementById('approveMemberCount').textContent = organization.organization_member_count || '0';
    document.getElementById('approveSchoolYear').textContent = organization.current_school_year || 'N/A';

    // Set logo if available
    const logoElement = document.querySelector('#organizationApproveModal .org-logo');
    if (organization.organization_logo_url) {
        logoElement.innerHTML = `<img src="${organization.organization_logo_url}" alt="${organization.organization_name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
    }

    // Update certificate preview
    updateCertificatePreview();
}

// Update certificate preview
function updateCertificatePreview() {
    const orgName = document.getElementById('approveOrganizationName').textContent;
    const validFrom = document.getElementById('approveValidFrom').textContent;
    const validUntil = document.getElementById('approveValidUntil').textContent;
    const certDate = document.getElementById('certificateDate').value;

    document.getElementById('previewOrgName').textContent = orgName;
    document.getElementById('previewValidPeriod').textContent = `${validFrom} to ${validUntil}`;
    document.getElementById('previewApprovalDate').textContent = certDate || new Date().toLocaleDateString();
}

// Show modal
function showApproveModal() {
    const modal = document.getElementById('organizationApproveModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeOrganizationApproveModal() {
    const modal = document.getElementById('organizationApproveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentApproveOrganizationId = null;

    // Clear form response
    const formResponse = document.getElementById('organizationApproveFormResponse');
    if (formResponse) {
        formResponse.innerHTML = '';
    }
}

// Submit approval
function submitOrganizationApproval() {
    const organizationId = document.getElementById('approveOrganizationId').value;
    const organizationName = document.getElementById('approveOrganizationName').textContent;
    const generateCertificate = document.getElementById('generateCertificate').checked;
    const certificateDate = document.getElementById('certificateDate').value;
    const certificateVenue = document.getElementById('certificateVenue').value;

    const submitBtn = document.querySelector('#organizationApproveModal .btn-approve');
    const formResponse = document.getElementById('organizationApproveFormResponse');

    if (!organizationId) {
        showErrorToast('Organization ID not found');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    formResponse.innerHTML = '';

    const formData = new FormData();
    formData.append('organization_id', organizationId);
    formData.append('generate_certificate', generateCertificate);
    formData.append('certificate_date', certificateDate);
    formData.append('certificate_venue', certificateVenue);
    formData.append('csrfmiddlewaretoken', getCSRFToken());

    fetch(`/organizations/${organizationId}/approve/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            formResponse.innerHTML = `
                <div class="response-success">
                    <i class='bx bx-check-circle'></i>
                    ${data.message || 'Organization approved successfully!'}
                    ${data.certificate_url ? `
                        <br><br>
                        <div class="certificate-actions">
                            <a href="${data.certificate_url}" target="_blank" class="btn-approve" style="text-decoration:none; margin-right: 10px;">
                                <i class='bx bx-download'></i> Download Certificate
                            </a>
                            <a href="${data.certificate_url}" class="btn-view" target="_blank" style="text-decoration:none;">
                                <i class='bx bx-show'></i> View Certificate
                            </a>
                        </div>
                    ` : ''}
                </div>
            `;

            showSuccessToast(data.message || `"${organizationName}" approved successfully!`);

            setTimeout(() => {
                closeOrganizationApproveModal();
                window.location.reload();
            }, 3000);

        } else {
            throw new Error(data.error || 'Approval failed');
        }
    })
    .catch(error => {
        console.error('Approval error:', error);
        formResponse.innerHTML = `
            <div class="response-error">
                <i class='bx bx-error-circle'></i>
                ${error.message || 'Failed to approve organization'}
            </div>
        `;
        showErrorToast(error.message || 'Approval failed');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    });
}

// Event listeners for certificate options
document.addEventListener('DOMContentLoaded', function() {
    const certCheckbox = document.getElementById('generateCertificate');
    const certOptions = document.getElementById('certificateOptions');

    if (certCheckbox && certOptions) {
        certCheckbox.addEventListener('change', function() {
            certOptions.style.display = this.checked ? 'block' : 'none';
        });
        certOptions.style.display = certCheckbox.checked ? 'block' : 'none';
    }

    // Update preview when date changes
    const certDate = document.getElementById('certificateDate');
    if (certDate) {
        certDate.addEventListener('change', updateCertificatePreview);
    }
});

// -------------------------------------------- Create Organization Function -------------------------------------------
// Simple Organization Create Functionality
let organizationMembers = [];

// Open modal
function openOrganizationCreateModal() {
    const modal = document.getElementById('organizationCreateModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Add first member row
        if (organizationMembers.length === 0) {
            addMemberRow();
        }
    }
}

// Close modal
function closeOrganizationCreateModal() {
    const modal = document.getElementById('organizationCreateModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetOrganizationForm();
    }
}

// Reset form completely
function resetOrganizationForm() {
    const form = document.getElementById('organizationCreateForm');
    if (!form) return;

    // Reset the form
    form.reset();

    // Clear file inputs manually
    const fileInputs = form.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.value = '';
    });

    // Clear file indicators
    const fileIndicators = form.querySelectorAll('.file-indicator');
    fileIndicators.forEach(indicator => {
        indicator.remove();
    });

    // Reset file name displays
    const fileNames = form.querySelectorAll('[id$="FileName"]');
    fileNames.forEach(el => {
        el.textContent = 'No file selected';
        el.style.color = '#64748b';
        el.classList.remove('has-file');
    });

    // Reset upload box styles
    const uploadBoxes = form.querySelectorAll('.file-upload-box');
    uploadBoxes.forEach(box => {
        box.style.borderColor = '#e2e8f0';
        box.style.backgroundColor = '';
        box.classList.remove('has-file');
    });

    // Reset members
    organizationMembers = [];
    const membersTableBody = document.getElementById('membersTableBody');
    if (membersTableBody) {
        membersTableBody.innerHTML = '';
    }
    updateMemberCount();
    updateMembersJSON();

    // Hide student requirements
    const studentReqs = document.getElementById('studentOrgRequirements');
    if (studentReqs) {
        studentReqs.style.display = 'none';
    }

    // Clear form response
    const formResponse = document.getElementById('organizationFormResponse');
    if (formResponse) {
        formResponse.innerHTML = '';
    }

    // Clear any field error messages
    document.querySelectorAll('.field-error-message').forEach(el => el.remove());
    document.querySelectorAll('.form-input').forEach(input => {
        input.style.borderColor = '';
    });
}

// Handle file selection with indicator and validation
function handleFileSelection(input) {
    const file = input.files[0];
    const fileNameDisplay = document.getElementById(input.id + 'FileName');
    const uploadBox = input.closest('.file-upload-box');

    if (!fileNameDisplay || !uploadBox) {
        console.error('File name display or upload box not found for:', input.id);
        return;
    }

    if (file) {
        // Validate file size
        const maxSize = input.accept.includes('image') ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            const fileType = input.accept.includes('image') ? '5MB' : '10MB';
            showErrorToast(`File size too large. Maximum size is ${fileType}`);
            input.value = '';
            fileNameDisplay.textContent = 'No file selected';
            fileNameDisplay.style.color = '#64748b';
            fileNameDisplay.classList.remove('has-file');
            clearFileIndicator(input);
            uploadBox.style.borderColor = '#dc2626';
            uploadBox.style.backgroundColor = '#fef2f2';
            uploadBox.classList.remove('has-file');
            return;
        }

        // Validate file type
        const allowedExtensions = input.accept.includes('image') ?
            ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] :
            ['pdf', 'doc', 'docx'];
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            const allowedTypes = input.accept.includes('image') ? 'images (JPG, JPEG, PNG, GIF, BMP, WEBP)' : 'documents (PDF, DOC, DOCX)';
            showErrorToast(`Invalid file type. Please upload ${allowedTypes}`);
            input.value = '';
            fileNameDisplay.textContent = 'No file selected';
            fileNameDisplay.style.color = '#64748b';
            fileNameDisplay.classList.remove('has-file');
            clearFileIndicator(input);
            uploadBox.style.borderColor = '#dc2626';
            uploadBox.style.backgroundColor = '#fef2f2';
            uploadBox.classList.remove('has-file');
            return;
        }

        // Show file name with success styling
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.style.color = '#059669';
        fileNameDisplay.style.fontWeight = '600';
        fileNameDisplay.classList.add('has-file');

        // Update upload box to show success state
        uploadBox.style.borderColor = '#10b981';
        uploadBox.style.backgroundColor = '#f0fdf4';
        uploadBox.classList.add('has-file');

        // Create file indicator
        createFileIndicator(input, file);

        console.log('File selected:', file.name, 'for input:', input.id);
    } else {
        fileNameDisplay.textContent = 'No file selected';
        fileNameDisplay.style.color = '#64748b';
        fileNameDisplay.style.fontWeight = 'normal';
        fileNameDisplay.classList.remove('has-file');
        clearFileIndicator(input);
        uploadBox.style.borderColor = '#e2e8f0';
        uploadBox.style.backgroundColor = '';
        uploadBox.classList.remove('has-file');
    }
}

// Create file indicator
function createFileIndicator(input, file) {
    clearFileIndicator(input);

    const indicatorContainer = document.createElement('div');
    indicatorContainer.className = 'file-indicator';

    // File info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-indicator-content';

    // File icon
    const fileIcon = document.createElement('div');
    if (file.type.startsWith('image/')) {
        fileIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `;
    } else {
        fileIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        `;
    }

    // File details
    const fileDetails = document.createElement('div');
    fileDetails.className = 'file-indicator-details';

    const fileName = document.createElement('div');
    fileName.className = 'file-indicator-name';
    fileName.textContent = file.name;

    const fileSize = document.createElement('div');
    fileSize.className = 'file-indicator-size';
    fileSize.textContent = formatFileSize(file.size);

    fileDetails.appendChild(fileName);
    fileDetails.appendChild(fileSize);

    fileInfo.appendChild(fileIcon);
    fileInfo.appendChild(fileDetails);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'file-indicator-remove';
    removeBtn.innerHTML = '<i class="bx bx-x"></i>';
    removeBtn.title = 'Remove file';
    removeBtn.onclick = function() {
        input.value = '';
        const fileNameDisplay = document.getElementById(input.id + 'FileName');
        const uploadBox = input.closest('.file-upload-box');

        if (fileNameDisplay) {
            fileNameDisplay.textContent = 'No file selected';
            fileNameDisplay.style.color = '#64748b';
            fileNameDisplay.style.fontWeight = 'normal';
            fileNameDisplay.classList.remove('has-file');
        }
        if (uploadBox) {
            uploadBox.style.borderColor = '#e2e8f0';
            uploadBox.style.backgroundColor = '';
            uploadBox.classList.remove('has-file');
        }
        clearFileIndicator(input);
    };

    indicatorContainer.appendChild(fileInfo);
    indicatorContainer.appendChild(removeBtn);

    // Add indicator to file info container
    const fileInfoContainer = input.closest('.file-upload-container').querySelector('.file-info');
    if (fileInfoContainer) {
        fileInfoContainer.appendChild(indicatorContainer);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Clear file indicator
function clearFileIndicator(input) {
    const fileInfo = input.closest('.file-upload-container');
    if (fileInfo) {
        const existingIndicator = fileInfo.querySelector('.file-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Get CSRF token
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

// Add member row with updated position options
function addMemberRow() {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    const memberId = organizationMembers.length;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="text" class="form-input sm" name="member_first_name" placeholder="First Name" oninput="updateMemberData(${memberId}, this)">
        </td>
        <td>
            <input type="text" class="form-input sm" name="member_last_name" placeholder="Last Name" oninput="updateMemberData(${memberId}, this)">
        </td>
        <td>
            <select class="form-input sm" name="member_position" onchange="updateMemberData(${memberId}, this)">
                <option value="">Select Position</option>
                <!-- Alphabetically Sorted Positions A-Z -->
                <option value="1st_year_board_director">1st Year Board of Director</option>
                <option value="1st_year_board_member">1st Year Board Member</option>
                <option value="2nd_year_board_director">2nd Year Board of Director</option>
                <option value="2nd_year_board_member">2nd Year Board Member</option>
                <option value="2nd_year_chairperson">2nd Year Chairperson</option>
                <option value="2nd_year_senator">2nd Year Senator</option>
                <option value="3rd_year_board_director">3rd Year Board of Director</option>
                <option value="3rd_year_board_member">3rd Year Board Member</option>
                <option value="3rd_year_chairperson">3rd Year Chairperson</option>
                <option value="4th_year_board_director">4th Year Board of Director</option>
                <option value="4th_year_board_member">4th Year Board Member</option>
                <option value="4th_year_chairperson">4th Year Chairperson</option>
                <option value="4th_year_senator">4th Year Senator</option>
                <option value="admin_custodian">Admin Custodian</option>
                <option value="asst_business_manager">Assistant Business Manager</option>
                <option value="asst_public_information_officer">Assistant Public Information Officer for all social media</option>
                <option value="asst_public_relations_officer">Assistant Public Relations Officer</option>
                <option value="asst_secretary">Asst. Secretary</option>
                <option value="asst_treasurer">Asst. Treasurer</option>
                <option value="assistant_coach">Assistant Coach</option>
                <option value="assistant_secretary">Assistant Secretary</option>
                <option value="associate_editor_external">Associate Editor - External</option>
                <option value="associate_editor_internal">Associate Editor - Internal</option>
                <option value="associate_secretary">Associate Secretary</option>
                <option value="auditor">Auditor</option>
                <option value="batch_representative">Batch Representative</option>
                <option value="board_director">Board of Directors</option>
                <option value="bookkeeper">Bookkeeper</option>
                <option value="business_manager">Business Manager</option>
                <option value="cartoonist">Cartoonist</option>
                <option value="chairman_board">Chairman of the Board</option>
                <option value="chairperson">Chairperson</option>
                <option value="copy_editor">Copy Editor</option>
                <option value="copy_editor_photojournalist">Copy Editor / Photojournalist</option>
                <option value="corporate_society">Corporate Society</option>
                <option value="creatives">Creatives</option>
                <option value="creative_and_logistics">Creative And Logistics</option>
                <option value="deputy_director_external_affairs">Deputy Director of External Affairs</option>
                <option value="deputy_director_internal_affairs">Deputy Director of Internal Affairs</option>
                <option value="deputy_director_multimedia_publications">Deputy Director of Multimedia Publications</option>
                <option value="deputy_director_resource_assembly">Deputy Director of Resource Assembly</option>
                <option value="deputy_director_resource_management">Deputy Director of Resource Management</option>
                <option value="digital_media">Digital Media</option>
                <option value="director_external_affairs">Director of External Affairs</option>
                <option value="director_internal_affairs">Director of Internal Affairs</option>
                <option value="director_multimedia_publications">Director of Multimedia Publications</option>
                <option value="director_resource_assembly">Director of Resource Assembly</option>
                <option value="director_resource_management">Director of Resource Management</option>
                <option value="editor_in_chief">Editor-in-Chief</option>
                <option value="editorial_manager">Editorial Manager</option>
                <option value="english_1st_year_rep">English 1st Year Representative</option>
                <option value="english_2nd_year_rep">English 2nd Year Representative</option>
                <option value="english_3rd_year_rep">English 3rd Year Representative</option>
                <option value="english_4th_year_rep">English 4th Year Representative</option>
                <option value="events_management">Events Management</option>
                <option value="executive_board_secretary">Executive Board Secretary</option>
                <option value="executive_president">Executive President</option>
                <option value="executive_secretary">Executive Secretary</option>
                <option value="executive_vice_president">Executive Vice President</option>
                <option value="executive_vice_president_external_affairs">Executive Vice President for External Affairs</option>
                <option value="executive_vice_president_internal_affairs">Executive Vice President for Internal Affairs</option>
                <option value="external_vice_president">External Vice President</option>
                <option value="financial_director">Financial Director</option>
                <option value="gad_representative">GAD Representative</option>
                <option value="gender_development_representative">Gender and Development Representative</option>
                <option value="gourmet_committee">Gourmet Committee</option>
                <option value="head_multimedia_committee">Head Multimedia Committee</option>
                <option value="head_photojournalist">Head Photojournalist</option>
                <option value="head_sentinel">Head Sentinel</option>
                <option value="head_stage_design">Head of Stage and Design</option>
                <option value="internal_vice_president">Internal Vice President</option>
                <option value="layout_graphic_artist">Layout and Graphic Artist</option>
                <option value="legislative_secretary">Legislative Secretary</option>
                <option value="logistics">Logistics</option>
                <option value="math_1st_year_rep">Math 1st Year Representative</option>
                <option value="math_2nd_year_rep">Math 2nd Year Representative</option>
                <option value="math_3rd_year_rep">Math 3rd Year Representative</option>
                <option value="math_4th_year_rep">Math 4th Year Representative</option>
                <option value="member">Member</option>
                <option value="multimedia_committee">Multimedia Committee</option>
                <option value="multimedia_manager">Multimedia Manager</option>
                <option value="news_presenter">News Presenter</option>
                <option value="page_communication_officer">Page Communication Officer</option>
                <option value="photojournalist">Photojournalist</option>
                <option value="pod">POD</option>
                <option value="president">President</option>
                <option value="procurement_committee">Procurement Committee</option>
                <option value="property_custodian">Property Custodian</option>
                <option value="pro">PRO</option>
                <option value="public_image_officer">Public Image Officer</option>
                <option value="public_information_officer">Public Information Officer</option>
                <option value="public_relations_officer">Public Relations Officer</option>
                <option value="publication_officer">Publication Officer</option>
                <option value="research_finance_committee">Research and Finance Committee</option>
                <option value="secretariat">Secretariat</option>
                <option value="secretary">Secretary</option>
                <option value="senate_president">Senate President</option>
                <option value="senator_academic_affairs">Senator for Academic Affairs</option>
                <option value="senator_audit">Senator for Audit</option>
                <option value="senator_constitutional_amendments">Senator for Constitutional and Amendments</option>
                <option value="senator_creatives_publication">Senator for Creatives and Publication</option>
                <option value="senator_finance_budgeting">Senator for Finance and Budgeting</option>
                <option value="senator_student_rights_welfare">Senator for Student Rights and Welfare</option>
                <option value="senator_gender_development">Senator on Gender and Development</option>
                <option value="senator_sports_youth_development">Senator on Sports and Youth Development</option>
                <option value="sentinel">Sentinel</option>
                <option value="social_media_support">Social Media Support</option>
                <option value="stage_design_committee">Stage and Design Committee</option>
                <option value="staff_administrative">Staff on Administrative</option>
                <option value="staff_creative_content_development">Staff on Creative Content Development</option>
                <option value="staff_creative_media_development">Staff on Creative Media Development</option>
                <option value="staff_internal_rights_welfare">Staff on Internal Rights and Welfare</option>
                <option value="staff_technical_operations_support">Staff on Technical Operations and Support</option>
                <option value="section_writer">Section Writer</option>
                <option value="team_coach">Team Coach</option>
                <option value="technical">Technical</option>
                <option value="technical_committee">Technical Committee</option>
                <option value="technical_support">Technical Support</option>
                <option value="technical_support_committee">Technical and Support Committee</option>
                <option value="treasurer">Treasurer</option>
                <option value="vice_chairperson">Vice Chairperson</option>
                <option value="vice_president">Vice President</option>
                <option value="vice_president_external">Vice President for External Affairs</option>
                <option value="vice_president_internal">Vice President for Internal Affairs</option>
                <option value="vice_president_external_administration">Vice President for External Administration</option>
                <option value="vice_president_external_operation">Vice President for External Operation</option>
                <option value="vice_president_internal_affairs">Vice President for Internal Affairs</option>
            </select>
        </td>
        <td>
            <input type="email" class="form-input sm" name="member_email" placeholder="Email" oninput="updateMemberData(${memberId}, this)">
        </td>
        <td>
            <input type="text" class="form-input sm" name="member_student_id" placeholder="Student ID" oninput="updateMemberData(${memberId}, this)">
        </td>
        <td>
            <button type="button" class="btn-icon btn-danger" onclick="removeMember(${memberId})">
                <i class='bx bx-trash'></i>
            </button>
        </td>
    `;

    tbody.appendChild(row);

    organizationMembers.push({
        id: memberId,
        first_name: '',
        last_name: '',
        position: '',
        email: '',
        student_id: ''
    });

    updateMemberCount();
    updateMembersJSON();
}

function updateMemberData(memberId, element) {
    if (organizationMembers[memberId]) {
        const field = element.name.replace('member_', '');
        organizationMembers[memberId][field] = element.value;
        updateMembersJSON();
    }
}

function removeMember(memberId) {
    if (organizationMembers[memberId]) {
        organizationMembers.splice(memberId, 1);
        rebuildMembersTable();
        updateMemberCount();
        updateMembersJSON();
    }
}

function rebuildMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    organizationMembers.forEach((member, index) => {
        member.id = index;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" class="form-input sm" name="member_first_name" value="${member.first_name || ''}" placeholder="First Name" oninput="updateMemberData(${index}, this)">
            </td>
            <td>
                <input type="text" class="form-input sm" name="member_last_name" value="${member.last_name || ''}" placeholder="Last Name" oninput="updateMemberData(${index}, this)">
            </td>
            <td>
                <select class="form-input sm" name="member_position" onchange="updateMemberData(${index}, this)">
                    <option value="">Select Position</option>
                    <!-- Alphabetically Sorted Positions A-Z -->
                    <option value="1st_year_board_director" ${member.position === '1st_year_board_director' ? 'selected' : ''}>1st Year Board of Director</option>
                    <option value="1st_year_board_member" ${member.position === '1st_year_board_member' ? 'selected' : ''}>1st Year Board Member</option>
                    <option value="2nd_year_board_director" ${member.position === '2nd_year_board_director' ? 'selected' : ''}>2nd Year Board of Director</option>
                    <option value="2nd_year_board_member" ${member.position === '2nd_year_board_member' ? 'selected' : ''}>2nd Year Board Member</option>
                    <option value="2nd_year_chairperson" ${member.position === '2nd_year_chairperson' ? 'selected' : ''}>2nd Year Chairperson</option>
                    <option value="2nd_year_senator" ${member.position === '2nd_year_senator' ? 'selected' : ''}>2nd Year Senator</option>
                    <option value="3rd_year_board_director" ${member.position === '3rd_year_board_director' ? 'selected' : ''}>3rd Year Board of Director</option>
                    <option value="3rd_year_board_member" ${member.position === '3rd_year_board_member' ? 'selected' : ''}>3rd Year Board Member</option>
                    <option value="3rd_year_chairperson" ${member.position === '3rd_year_chairperson' ? 'selected' : ''}>3rd Year Chairperson</option>
                    <option value="4th_year_board_director" ${member.position === '4th_year_board_director' ? 'selected' : ''}>4th Year Board of Director</option>
                    <option value="4th_year_board_member" ${member.position === '4th_year_board_member' ? 'selected' : ''}>4th Year Board Member</option>
                    <option value="4th_year_chairperson" ${member.position === '4th_year_chairperson' ? 'selected' : ''}>4th Year Chairperson</option>
                    <option value="4th_year_senator" ${member.position === '4th_year_senator' ? 'selected' : ''}>4th Year Senator</option>
                    <option value="admin_custodian" ${member.position === 'admin_custodian' ? 'selected' : ''}>Admin Custodian</option>
                    <option value="asst_business_manager" ${member.position === 'asst_business_manager' ? 'selected' : ''}>Assistant Business Manager</option>
                    <option value="asst_public_information_officer" ${member.position === 'asst_public_information_officer' ? 'selected' : ''}>Assistant Public Information Officer for all social media</option>
                    <option value="asst_public_relations_officer" ${member.position === 'asst_public_relations_officer' ? 'selected' : ''}>Assistant Public Relations Officer</option>
                    <option value="asst_secretary" ${member.position === 'asst_secretary' ? 'selected' : ''}>Asst. Secretary</option>
                    <option value="asst_treasurer" ${member.position === 'asst_treasurer' ? 'selected' : ''}>Asst. Treasurer</option>
                    <option value="assistant_coach" ${member.position === 'assistant_coach' ? 'selected' : ''}>Assistant Coach</option>
                    <option value="assistant_secretary" ${member.position === 'assistant_secretary' ? 'selected' : ''}>Assistant Secretary</option>
                    <option value="associate_editor_external" ${member.position === 'associate_editor_external' ? 'selected' : ''}>Associate Editor - External</option>
                    <option value="associate_editor_internal" ${member.position === 'associate_editor_internal' ? 'selected' : ''}>Associate Editor - Internal</option>
                    <option value="associate_secretary" ${member.position === 'associate_secretary' ? 'selected' : ''}>Associate Secretary</option>
                    <option value="auditor" ${member.position === 'auditor' ? 'selected' : ''}>Auditor</option>
                    <option value="batch_representative" ${member.position === 'batch_representative' ? 'selected' : ''}>Batch Representative</option>
                    <option value="board_director" ${member.position === 'board_director' ? 'selected' : ''}>Board of Directors</option>
                    <option value="bookkeeper" ${member.position === 'bookkeeper' ? 'selected' : ''}>Bookkeeper</option>
                    <option value="business_manager" ${member.position === 'business_manager' ? 'selected' : ''}>Business Manager</option>
                    <option value="cartoonist" ${member.position === 'cartoonist' ? 'selected' : ''}>Cartoonist</option>
                    <option value="chairman_board" ${member.position === 'chairman_board' ? 'selected' : ''}>Chairman of the Board</option>
                    <option value="chairperson" ${member.position === 'chairperson' ? 'selected' : ''}>Chairperson</option>
                    <option value="copy_editor" ${member.position === 'copy_editor' ? 'selected' : ''}>Copy Editor</option>
                    <option value="copy_editor_photojournalist" ${member.position === 'copy_editor_photojournalist' ? 'selected' : ''}>Copy Editor / Photojournalist</option>
                    <option value="corporate_society" ${member.position === 'corporate_society' ? 'selected' : ''}>Corporate Society</option>
                    <option value="creatives" ${member.position === 'creatives' ? 'selected' : ''}>Creatives</option>
                    <option value="creative_and_logistics" ${member.position === 'creative_and_logistics' ? 'selected' : ''}>Creative And Logistics</option>
                    <option value="deputy_director_external_affairs" ${member.position === 'deputy_director_external_affairs' ? 'selected' : ''}>Deputy Director of External Affairs</option>
                    <option value="deputy_director_internal_affairs" ${member.position === 'deputy_director_internal_affairs' ? 'selected' : ''}>Deputy Director of Internal Affairs</option>
                    <option value="deputy_director_multimedia_publications" ${member.position === 'deputy_director_multimedia_publications' ? 'selected' : ''}>Deputy Director of Multimedia Publications</option>
                    <option value="deputy_director_resource_assembly" ${member.position === 'deputy_director_resource_assembly' ? 'selected' : ''}>Deputy Director of Resource Assembly</option>
                    <option value="deputy_director_resource_management" ${member.position === 'deputy_director_resource_management' ? 'selected' : ''}>Deputy Director of Resource Management</option>
                    <option value="digital_media" ${member.position === 'digital_media' ? 'selected' : ''}>Digital Media</option>
                    <option value="director_external_affairs" ${member.position === 'director_external_affairs' ? 'selected' : ''}>Director of External Affairs</option>
                    <option value="director_internal_affairs" ${member.position === 'director_internal_affairs' ? 'selected' : ''}>Director of Internal Affairs</option>
                    <option value="director_multimedia_publications" ${member.position === 'director_multimedia_publications' ? 'selected' : ''}>Director of Multimedia Publications</option>
                    <option value="director_resource_assembly" ${member.position === 'director_resource_assembly' ? 'selected' : ''}>Director of Resource Assembly</option>
                    <option value="director_resource_management" ${member.position === 'director_resource_management' ? 'selected' : ''}>Director of Resource Management</option>
                    <option value="editor_in_chief" ${member.position === 'editor_in_chief' ? 'selected' : ''}>Editor-in-Chief</option>
                    <option value="editorial_manager" ${member.position === 'editorial_manager' ? 'selected' : ''}>Editorial Manager</option>
                    <option value="english_1st_year_rep" ${member.position === 'english_1st_year_rep' ? 'selected' : ''}>English 1st Year Representative</option>
                    <option value="english_2nd_year_rep" ${member.position === 'english_2nd_year_rep' ? 'selected' : ''}>English 2nd Year Representative</option>
                    <option value="english_3rd_year_rep" ${member.position === 'english_3rd_year_rep' ? 'selected' : ''}>English 3rd Year Representative</option>
                    <option value="english_4th_year_rep" ${member.position === 'english_4th_year_rep' ? 'selected' : ''}>English 4th Year Representative</option>
                    <option value="events_management" ${member.position === 'events_management' ? 'selected' : ''}>Events Management</option>
                    <option value="executive_board_secretary" ${member.position === 'executive_board_secretary' ? 'selected' : ''}>Executive Board Secretary</option>
                    <option value="executive_president" ${member.position === 'executive_president' ? 'selected' : ''}>Executive President</option>
                    <option value="executive_secretary" ${member.position === 'executive_secretary' ? 'selected' : ''}>Executive Secretary</option>
                    <option value="executive_vice_president" ${member.position === 'executive_vice_president' ? 'selected' : ''}>Executive Vice President</option>
                    <option value="executive_vice_president_external_affairs" ${member.position === 'executive_vice_president_external_affairs' ? 'selected' : ''}>Executive Vice President for External Affairs</option>
                    <option value="executive_vice_president_internal_affairs" ${member.position === 'executive_vice_president_internal_affairs' ? 'selected' : ''}>Executive Vice President for Internal Affairs</option>
                    <option value="external_vice_president" ${member.position === 'external_vice_president' ? 'selected' : ''}>External Vice President</option>
                    <option value="financial_director" ${member.position === 'financial_director' ? 'selected' : ''}>Financial Director</option>
                    <option value="gad_representative" ${member.position === 'gad_representative' ? 'selected' : ''}>GAD Representative</option>
                    <option value="gender_development_representative" ${member.position === 'gender_development_representative' ? 'selected' : ''}>Gender and Development Representative</option>
                    <option value="gourmet_committee" ${member.position === 'gourmet_committee' ? 'selected' : ''}>Gourmet Committee</option>
                    <option value="head_multimedia_committee" ${member.position === 'head_multimedia_committee' ? 'selected' : ''}>Head Multimedia Committee</option>
                    <option value="head_photojournalist" ${member.position === 'head_photojournalist' ? 'selected' : ''}>Head Photojournalist</option>
                    <option value="head_sentinel" ${member.position === 'head_sentinel' ? 'selected' : ''}>Head Sentinel</option>
                    <option value="head_stage_design" ${member.position === 'head_stage_design' ? 'selected' : ''}>Head of Stage and Design</option>
                    <option value="internal_vice_president" ${member.position === 'internal_vice_president' ? 'selected' : ''}>Internal Vice President</option>
                    <option value="layout_graphic_artist" ${member.position === 'layout_graphic_artist' ? 'selected' : ''}>Layout and Graphic Artist</option>
                    <option value="legislative_secretary" ${member.position === 'legislative_secretary' ? 'selected' : ''}>Legislative Secretary</option>
                    <option value="logistics" ${member.position === 'logistics' ? 'selected' : ''}>Logistics</option>
                    <option value="math_1st_year_rep" ${member.position === 'math_1st_year_rep' ? 'selected' : ''}>Math 1st Year Representative</option>
                    <option value="math_2nd_year_rep" ${member.position === 'math_2nd_year_rep' ? 'selected' : ''}>Math 2nd Year Representative</option>
                    <option value="math_3rd_year_rep" ${member.position === 'math_3rd_year_rep' ? 'selected' : ''}>Math 3rd Year Representative</option>
                    <option value="math_4th_year_rep" ${member.position === 'math_4th_year_rep' ? 'selected' : ''}>Math 4th Year Representative</option>
                    <option value="member" ${member.position === 'member' ? 'selected' : ''}>Member</option>
                    <option value="multimedia_committee" ${member.position === 'multimedia_committee' ? 'selected' : ''}>Multimedia Committee</option>
                    <option value="multimedia_manager" ${member.position === 'multimedia_manager' ? 'selected' : ''}>Multimedia Manager</option>
                    <option value="news_presenter" ${member.position === 'news_presenter' ? 'selected' : ''}>News Presenter</option>
                    <option value="page_communication_officer" ${member.position === 'page_communication_officer' ? 'selected' : ''}>Page Communication Officer</option>
                    <option value="photojournalist" ${member.position === 'photojournalist' ? 'selected' : ''}>Photojournalist</option>
                    <option value="pod" ${member.position === 'pod' ? 'selected' : ''}>POD</option>
                    <option value="president" ${member.position === 'president' ? 'selected' : ''}>President</option>
                    <option value="procurement_committee" ${member.position === 'procurement_committee' ? 'selected' : ''}>Procurement Committee</option>
                    <option value="property_custodian" ${member.position === 'property_custodian' ? 'selected' : ''}>Property Custodian</option>
                    <option value="pro" ${member.position === 'pro' ? 'selected' : ''}>PRO</option>
                    <option value="public_image_officer" ${member.position === 'public_image_officer' ? 'selected' : ''}>Public Image Officer</option>
                    <option value="public_information_officer" ${member.position === 'public_information_officer' ? 'selected' : ''}>Public Information Officer</option>
                    <option value="public_relations_officer" ${member.position === 'public_relations_officer' ? 'selected' : ''}>Public Relations Officer</option>
                    <option value="publication_officer" ${member.position === 'publication_officer' ? 'selected' : ''}>Publication Officer</option>
                    <option value="research_finance_committee" ${member.position === 'research_finance_committee' ? 'selected' : ''}>Research and Finance Committee</option>
                    <option value="secretariat" ${member.position === 'secretariat' ? 'selected' : ''}>Secretariat</option>
                    <option value="secretary" ${member.position === 'secretary' ? 'selected' : ''}>Secretary</option>
                    <option value="senate_president" ${member.position === 'senate_president' ? 'selected' : ''}>Senate President</option>
                    <option value="senator_academic_affairs" ${member.position === 'senator_academic_affairs' ? 'selected' : ''}>Senator for Academic Affairs</option>
                    <option value="senator_audit" ${member.position === 'senator_audit' ? 'selected' : ''}>Senator for Audit</option>
                    <option value="senator_constitutional_amendments" ${member.position === 'senator_constitutional_amendments' ? 'selected' : ''}>Senator for Constitutional and Amendments</option>
                    <option value="senator_creatives_publication" ${member.position === 'senator_creatives_publication' ? 'selected' : ''}>Senator for Creatives and Publication</option>
                    <option value="senator_finance_budgeting" ${member.position === 'senator_finance_budgeting' ? 'selected' : ''}>Senator for Finance and Budgeting</option>
                    <option value="senator_student_rights_welfare" ${member.position === 'senator_student_rights_welfare' ? 'selected' : ''}>Senator for Student Rights and Welfare</option>
                    <option value="senator_gender_development" ${member.position === 'senator_gender_development' ? 'selected' : ''}>Senator on Gender and Development</option>
                    <option value="senator_sports_youth_development" ${member.position === 'senator_sports_youth_development' ? 'selected' : ''}>Senator on Sports and Youth Development</option>
                    <option value="sentinel" ${member.position === 'sentinel' ? 'selected' : ''}>Sentinel</option>
                    <option value="social_media_support" ${member.position === 'social_media_support' ? 'selected' : ''}>Social Media Support</option>
                    <option value="stage_design_committee" ${member.position === 'stage_design_committee' ? 'selected' : ''}>Stage and Design Committee</option>
                    <option value="staff_administrative" ${member.position === 'staff_administrative' ? 'selected' : ''}>Staff on Administrative</option>
                    <option value="staff_creative_content_development" ${member.position === 'staff_creative_content_development' ? 'selected' : ''}>Staff on Creative Content Development</option>
                    <option value="staff_creative_media_development" ${member.position === 'staff_creative_media_development' ? 'selected' : ''}>Staff on Creative Media Development</option>
                    <option value="staff_internal_rights_welfare" ${member.position === 'staff_internal_rights_welfare' ? 'selected' : ''}>Staff on Internal Rights and Welfare</option>
                    <option value="staff_technical_operations_support" ${member.position === 'staff_technical_operations_support' ? 'selected' : ''}>Staff on Technical Operations and Support</option>
                    <option value="section_writer" ${member.position === 'section_writer' ? 'selected' : ''}>Section Writer</option>
                    <option value="team_coach" ${member.position === 'team_coach' ? 'selected' : ''}>Team Coach</option>
                    <option value="technical" ${member.position === 'technical' ? 'selected' : ''}>Technical</option>
                    <option value="technical_committee" ${member.position === 'technical_committee' ? 'selected' : ''}>Technical Committee</option>
                    <option value="technical_support" ${member.position === 'technical_support' ? 'selected' : ''}>Technical Support</option>
                    <option value="technical_support_committee" ${member.position === 'technical_support_committee' ? 'selected' : ''}>Technical and Support Committee</option>
                    <option value="treasurer" ${member.position === 'treasurer' ? 'selected' : ''}>Treasurer</option>
                    <option value="vice_chairperson" ${member.position === 'vice_chairperson' ? 'selected' : ''}>Vice Chairperson</option>
                    <option value="vice_president" ${member.position === 'vice_president' ? 'selected' : ''}>Vice President</option>
                    <option value="vice_president_external" ${member.position === 'vice_president_external' ? 'selected' : ''}>Vice President for External Affairs</option>
                    <option value="vice_president_internal" ${member.position === 'vice_president_internal' ? 'selected' : ''}>Vice President for Internal Affairs</option>
                    <option value="vice_president_external_administration" ${member.position === 'vice_president_external_administration' ? 'selected' : ''}>Vice President for External Administration</option>
                    <option value="vice_president_external_operation" ${member.position === 'vice_president_external_operation' ? 'selected' : ''}>Vice President for External Operation</option>
                    <option value="vice_president_internal_affairs" ${member.position === 'vice_president_internal_affairs' ? 'selected' : ''}>Vice President for Internal Affairs</option>
                </select>
            </td>
            <td>
                <input type="email" class="form-input sm" name="member_email" value="${member.email || ''}" placeholder="Email" oninput="updateMemberData(${index}, this)">
            </td>
            <td>
                <input type="text" class="form-input sm" name="member_student_id" value="${member.student_id || ''}" placeholder="Student ID" oninput="updateMemberData(${index}, this)">
            </td>
            <td>
                <button type="button" class="btn-icon btn-danger" onclick="removeMember(${index})">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateMemberCount() {
    const countEl = document.getElementById('memberCount');
    if (countEl) {
        countEl.textContent = `${organizationMembers.length} members added`;

        const validationEl = document.getElementById('membersValidation');
        if (validationEl) {
            if (organizationMembers.length >= 3) {
                validationEl.innerHTML = `
                    <div class="validation-message success">
                        <i class='bx bx-check-circle'></i>
                        <span>Minimum member requirement met (${organizationMembers.length}/3)</span>
                    </div>
                `;
            } else {
                validationEl.innerHTML = `
                    <div class="validation-message warning">
                        <i class='bx bx-info-circle'></i>
                        <span>Minimum 3 members required. Currently ${organizationMembers.length}/3 members.</span>
                    </div>
                `;
            }
        }
    }
}

function updateMembersJSON() {
    const jsonField = document.getElementById('organization_members_json');
    if (jsonField) {
        jsonField.value = JSON.stringify(organizationMembers);
    }
}

// Calculate validity period
function calculateValidUntil() {
    const validFromInput = document.getElementById('id_organization_valid_from');
    const validUntilInput = document.getElementById('id_organization_valid_until');

    if (validFromInput && validUntilInput && validFromInput.value) {
        const validFrom = new Date(validFromInput.value);
        const validUntil = new Date(validFrom);
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        validUntilInput.value = validUntil.toISOString().split('T')[0];
    }
}

// Toggle requirements
function toggleOrganizationRequirements(orgType) {
    const studentRequirements = document.getElementById('studentOrgRequirements');
    if (!studentRequirements) return;

    if (orgType === 'student') {
        studentRequirements.style.display = 'block';
    } else {
        studentRequirements.style.display = 'none';
    }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('organizationCreateForm');
    if (form) {
        // Form submission handler
        form.addEventListener('submit', function(event) {
            event.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const formResponse = document.getElementById('organizationFormResponse');

            submitBtn.classList.add('is-loading');
            formResponse.innerHTML = '';

            // Update members JSON
            updateMembersJSON();

            // Client-side validation
            const formData = new FormData(form);
            const validationErrors = validateOrganizationForm(formData);

            if (Object.keys(validationErrors).length > 0) {
                // Display validation errors
                let errorHtml = '<div class="response-message response-error"><i class="bx bx-error-circle"></i><strong>Please fix the following errors:</strong><ul>';
                for (const [field, error] of Object.entries(validationErrors)) {
                    errorHtml += `<li>${error}</li>`;
                }
                errorHtml += '</ul></div>';

                formResponse.innerHTML = errorHtml;
                submitBtn.classList.remove('is-loading');
                return;
            }

            console.log('Submitting form data...');

            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                console.log('Response status:', response.status);

                if (!response.ok) {
                    // If it's a 400 error, try to parse the JSON error response
                    if (response.status === 400) {
                        return response.json().then(errorData => {
                            // Add status to error data so we can identify it
                            errorData._status = response.status;
                            throw errorData;
                        });
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showSuccessToast(data.message);
                    formResponse.innerHTML = `
                        <div class="response-message response-success">
                            <i class='bx bx-check-circle'></i>
                            ${data.message}
                        </div>
                    `;
                    setTimeout(() => {
                        closeOrganizationCreateModal();
                        window.location.reload();
                    }, 2000);
                } else {
                    showErrorToast(data.message || 'An error occurred');
                    displayFormErrors(data);
                }
            })
            .catch(error => {
                console.error('Error:', error);

                if (error._status === 400) {
                    // This is our structured error response from Django
                    displayFormErrors(error);
                } else if (error.message) {
                    // This is a generic error
                    formResponse.innerHTML = `
                        <div class="response-message response-error">
                            <i class='bx bx-error-circle'></i>
                            An error occurred while creating the organization: ${error.message}
                        </div>
                    `;
                } else {
                    // Fallback for any other error type
                    formResponse.innerHTML = `
                        <div class="response-message response-error">
                            <i class='bx bx-error-circle'></i>
                            An unexpected error occurred. Please try again.
                        </div>
                    `;
                }
            })
            .finally(() => {
                submitBtn.classList.remove('is-loading');
            });
        });

        // Function to display form errors in a user-friendly way
        function displayFormErrors(errorData) {
            const formResponse = document.getElementById('organizationFormResponse');

            console.log('Displaying form errors:', errorData);

            // Clear any previous field-specific errors
            document.querySelectorAll('.field-error-message').forEach(el => el.remove());
            document.querySelectorAll('.form-input').forEach(input => {
                input.style.borderColor = '';
            });

            let errorHtml = '<div class="response-message response-error">';
            errorHtml += '<i class="bx bx-error-circle"></i>';

            if (errorData.message) {
                errorHtml += `<strong>${errorData.message}</strong>`;
            } else {
                errorHtml += '<strong>Please fix the following errors:</strong>';
            }

            if (errorData.errors) {
                errorHtml += '<ul>';

                // Process Django form errors structure
                for (const [field, errors] of Object.entries(errorData.errors)) {
                    console.log(`Processing field ${field}:`, errors);

                    // Handle different error structures
                    if (Array.isArray(errors)) {
                        errors.forEach(errorObj => {
                            const errorMessage = errorObj.message || errorObj;
                            errorHtml += `<li>${errorMessage}</li>`;

                            // Map field names to actual input fields
                            highlightFieldError(field, errorMessage);
                        });
                    } else if (typeof errors === 'string') {
                        errorHtml += `<li>${errors}</li>`;
                        highlightFieldError(field, errors);
                    } else if (errors && typeof errors === 'object') {
                        // Handle nested error objects
                        Object.values(errors).forEach(nestedError => {
                            const errorMessage = nestedError.message || nestedError;
                            if (Array.isArray(errorMessage)) {
                                errorMessage.forEach(msg => {
                                    errorHtml += `<li>${msg}</li>`;
                                    highlightFieldError(field, msg);
                                });
                            } else {
                                errorHtml += `<li>${errorMessage}</li>`;
                                highlightFieldError(field, errorMessage);
                            }
                        });
                    }
                }

                errorHtml += '</ul>';
            } else if (errorData.message) {
                // Single error message
                errorHtml += `<p>${errorData.message}</p>`;
            }

            errorHtml += '</div>';
            formResponse.innerHTML = errorHtml;

            // Scroll to the response area
            formResponse.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Helper function to highlight specific field errors
        function highlightFieldError(fieldName, errorMessage) {
            let inputField;

            // Map Django field names to actual input IDs
            switch(fieldName) {
                case 'username':
                    inputField = document.getElementById('id_username');
                    break;
                case 'email':
                    inputField = document.getElementById('id_email');
                    break;
                case 'organization_name':
                    inputField = document.getElementById('id_organization_name');
                    break;
                case 'organization_acronym':
                    inputField = document.getElementById('id_organization_acronym');
                    break;
                case 'organization_email':
                    inputField = document.getElementById('id_organization_email');
                    break;
                default:
                    // Try to find by name
                    inputField = document.querySelector(`[name="${fieldName}"]`);
            }

            if (inputField) {
                inputField.style.borderColor = '#dc2626';

                // Add error message near the field
                const fieldGroup = inputField.closest('.form-group');
                if (fieldGroup) {
                    // Remove existing error
                    const existingError = fieldGroup.querySelector('.field-error-message');
                    if (existingError) existingError.remove();

                    // Add new error
                    const errorElement = document.createElement('div');
                    errorElement.className = 'field-error-message';
                    errorElement.style.color = '#dc2626';
                    errorElement.style.fontSize = '0.875rem';
                    errorElement.style.marginTop = '0.25rem';
                    errorElement.style.display = 'flex';
                    errorElement.style.alignItems = 'center';
                    errorElement.style.gap = '0.5rem';
                    errorElement.innerHTML = `<i class="bx bx-error-circle"></i> ${errorMessage}`;
                    fieldGroup.appendChild(errorElement);
                }
            }
        }
    }
});

// Enhanced form validation
function validateOrganizationForm(formData) {
    const errors = {};

    // Organization name validation
    const orgName = formData.get('organization_name');
    if (!orgName || orgName.trim().length < 2) {
        errors.organization_name = "Organization name is required and must be at least 2 characters long.";
    }

    // Organization acronym validation
    const orgAcronym = formData.get('organization_acronym');
    if (!orgAcronym || orgAcronym.trim().length < 2) {
        errors.organization_acronym = "Organization acronym is required and must be at least 2 characters long.";
    }

    // Email validation
    const email = formData.get('email');
    if (!email || !isValidEmail(email)) {
        errors.email = "Please enter a valid email address.";
    }

    const orgEmail = formData.get('organization_email');
    if (!orgEmail || !isValidEmail(orgEmail)) {
        errors.organization_email = "Please enter a valid organization email address.";
    }

    // Password validation
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');

    if (!password || password.length < 8) {
        errors.password = "Password must be at least 8 characters long.";
    }

    if (!confirmPassword) {
        errors.confirm_password = "Please confirm your password.";
    } else if (password !== confirmPassword) {
        errors.confirm_password = "Passwords do not match.";
    }

    // Adviser name validation (letters and spaces only)
    const adviserName = formData.get('organization_adviser_name');
    if (!adviserName) {
        errors.organization_adviser_name = "Adviser name is required.";
    } else if (!/^[A-Za-z\s]+$/.test(adviserName)) {
        errors.organization_adviser_name = "Adviser name can only contain letters and spaces.";
    } else {
        // Check if adviser name has both first and last name
        const names = adviserName.trim().split(/\s+/);
        if (names.length < 2) {
            errors.organization_adviser_name = "Please provide both first name and last name for the adviser.";
        }
    }

    // Adviser department validation
    const adviserDepartment = formData.get('organization_adviser_department');
    if (!adviserDepartment) {
        errors.organization_adviser_department = "Adviser department is required.";
    }

    // Adviser email validation
    const adviserEmail = formData.get('organization_adviser_email');
    if (!adviserEmail) {
        errors.organization_adviser_email = "Adviser email is required.";
    } else if (!isValidEmail(adviserEmail)) {
        errors.organization_adviser_email = "Please enter a valid adviser email address.";
    }

    // Adviser phone validation (numbers and hyphens only)
    const adviserPhone = formData.get('organization_adviser_phone');
    if (!adviserPhone) {
        errors.organization_adviser_phone = "Adviser phone number is required.";
    } else if (!/^[\d\s\-\(\)\+]+$/.test(adviserPhone)) {
        errors.organization_adviser_phone = "Phone number can only contain numbers, hyphens, spaces, and parentheses.";
    } else {
        // Check minimum digits
        const digitsOnly = adviserPhone.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
            errors.organization_adviser_phone = "Please enter a valid phone number with at least 10 digits.";
        }
    }

    // Co-Adviser validation (optional)
    const coadviserName = formData.get('organization_coadviser_name');
    const coadviserEmail = formData.get('organization_coadviser_email');
    const coadviserDepartment = formData.get('organization_coadviser_department');
    const coadviserPhone = formData.get('organization_coadviser_phone');

    // If co-adviser name is provided, validate it
    if (coadviserName && coadviserName.trim()) {
        if (!/^[A-Za-z\s]+$/.test(coadviserName)) {
            errors.organization_coadviser_name = "Co-adviser name can only contain letters and spaces.";
        } else {
            const names = coadviserName.trim().split(/\s+/);
            if (names.length < 2) {
                errors.organization_coadviser_name = "Please provide both first name and last name for the co-adviser.";
            }
        }

        // If co-adviser name is provided but email is not
        if (!coadviserEmail) {
            errors.organization_coadviser_email = "Co-adviser email is required when co-adviser name is provided.";
        } else if (!isValidEmail(coadviserEmail)) {
            errors.organization_coadviser_email = "Please enter a valid co-adviser email address.";
        }

        // If co-adviser name is provided but department is not
        if (!coadviserDepartment) {
            errors.organization_coadviser_department = "Co-adviser department is required when co-adviser name is provided.";
        }
    }

    // If co-adviser email is provided but name is not
    if (coadviserEmail && !coadviserName) {
        errors.organization_coadviser_name = "Co-adviser name is required when co-adviser email is provided.";
    }

    // If co-adviser department is provided but name is not
    if (coadviserDepartment && !coadviserName) {
        errors.organization_coadviser_name = "Co-adviser name is required when co-adviser department is provided.";
    }

    // Co-adviser phone validation (if provided)
    if (coadviserPhone && coadviserPhone.trim()) {
        if (!/^[\d\s\-\(\)\+]+$/.test(coadviserPhone)) {
            errors.organization_coadviser_phone = "Co-adviser phone number can only contain numbers, hyphens, spaces, and parentheses.";
        } else {
            const digitsOnly = coadviserPhone.replace(/\D/g, '');
            if (digitsOnly.length < 10) {
                errors.organization_coadviser_phone = "Please enter a valid co-adviser phone number with at least 10 digits.";
            }
        }
    }

    // Member names validation
    const membersJson = formData.get('organization_members_json');
    if (!membersJson) {
        errors.organization_members_json = "Organization members are required.";
    } else {
        try {
            const members = JSON.parse(membersJson);

            if (members.length < 3) {
                errors.organization_members_json = "Organization must have at least 3 members.";
            }

            // Validate individual member fields
            members.forEach((member, index) => {
                const firstName = member.first_name || '';
                const lastName = member.last_name || '';

                if (!firstName.trim()) {
                    errors[`member_${index}_first_name`] = `Member ${index + 1}: First name is required.`;
                } else if (!/^[A-Za-z\s]+$/.test(firstName)) {
                    errors[`member_${index}_first_name`] = `Member ${index + 1}: First name can only contain letters and spaces.`;
                }

                if (!lastName.trim()) {
                    errors[`member_${index}_last_name`] = `Member ${index + 1}: Last name is required.`;
                } else if (!/^[A-Za-z\s]+$/.test(lastName)) {
                    errors[`member_${index}_last_name`] = `Member ${index + 1}: Last name can only contain letters and spaces.`;
                }

                if (!member.position) {
                    errors[`member_${index}_position`] = `Member ${index + 1}: Position is required.`;
                }

                // Validate member email if provided
                const memberEmail = member.email || '';
                if (memberEmail && !isValidEmail(memberEmail)) {
                    errors[`member_${index}_email`] = `Member ${index + 1}: Please enter a valid email address.`;
                }
            });

        } catch (e) {
            errors.organization_members_json = "Invalid members data format.";
        }
    }

    // Organization type validation
    const orgType = formData.get('organization_type');
    if (!orgType) {
        errors.organization_type = "Organization type is required.";
    }

    // Organization description validation
    const orgDescription = formData.get('organization_description');
    if (!orgDescription || orgDescription.trim().length < 10) {
        errors.organization_description = "Organization description is required and must be at least 10 characters long.";
    }

    // Organization mission validation
    const orgMission = formData.get('organization_mission');
    if (!orgMission || orgMission.trim().length < 10) {
        errors.organization_mission = "Organization mission is required and must be at least 10 characters long.";
    }

    // Organization vision validation
    const orgVision = formData.get('organization_vision');
    if (!orgVision || orgVision.trim().length < 10) {
        errors.organization_vision = "Organization vision is required and must be at least 10 characters long.";
    }

    // Organization type specific validations
    if (orgType === 'student') {
        // Check if financial report and COA are provided for student organizations
        const financialReport = formData.get('organization_financial_report');
        const coa = formData.get('organization_coa');

        if (!financialReport || financialReport.size === 0) {
            errors.organization_financial_report = "Financial Report is required for student organizations.";
        }
        if (!coa || coa.size === 0) {
            errors.organization_coa = "Certificate of Assessment (COA) is required for student organizations.";
        }
    }

    // Date validation
    const validFrom = formData.get('organization_valid_from');
    const validUntil = formData.get('organization_valid_until');

    if (!validFrom) {
        errors.organization_valid_from = "Valid from date is required.";
    }

    if (!validUntil) {
        errors.organization_valid_until = "Valid until date is required.";
    }

    // Validate date range (valid until must be after valid from)
    if (validFrom && validUntil) {
        const fromDate = new Date(validFrom);
        const untilDate = new Date(validUntil);

        if (untilDate <= fromDate) {
            errors.organization_valid_until = "Valid until date must be after valid from date.";
        }

        // Validate that the period is exactly 1 year
        const oneYearLater = new Date(fromDate);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

        // Allow 1 day tolerance for date comparison
        const dayInMs = 24 * 60 * 60 * 1000;
        if (Math.abs(untilDate - oneYearLater) > dayInMs) {
            errors.organization_valid_until = "Organization registration must be exactly 1 year from the valid from date.";
        }
    }

    // Required document validation
    const requiredDocuments = [
        'organization_calendar_activities',
        'organization_adviser_cv',
        'organization_cog',
        'organization_group_picture',
        'organization_cbl',
        'organization_list_members',
        'organization_acceptance_letter',
        'organization_ar',
        'organization_previous_calendar',
        'organization_good_moral',
        'organization_member_biodata'
    ];

    requiredDocuments.forEach(docField => {
        const file = formData.get(docField);
        if (!file || file.size === 0) {
            const fieldName = docField.replace('organization_', '').replace(/_/g, ' ');
            errors[docField] = `${fieldName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} is required.`;
        }
    });

    // Organization logo validation
    const orgLogo = formData.get('organization_logo');
    if (!orgLogo || orgLogo.size === 0) {
        errors.organization_logo = "Organization logo is required.";
    } else if (orgLogo && orgLogo.size > 5 * 1024 * 1024) {
        errors.organization_logo = "Organization logo must be less than 5MB.";
    } else if (orgLogo && !orgLogo.type.startsWith('image/')) {
        errors.organization_logo = "Organization logo must be an image file (JPG, PNG, etc.).";
    }

    return errors;
}

// ---------------------------------------------- View Organization Functions ------------------------------------------
function openOrganizationViewModal(organizationId) {
    console.log('DEBUG: Opening organization view modal for ID:', organizationId);
    showOrganizationLoadingState(true);

    fetch(`/organizations/${organizationId}/view/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleOrganizationResponse)
    .then(data => {
        console.log('DEBUG: Received organization data:', data);
        if (data.success) {
            populateOrganizationModalData(data.organization);
            showOrganizationModal();
        } else {
            throw new Error(data.error || 'Failed to load organization details');
        }
    })
    .catch(handleOrganizationError)
    .finally(() => {
        showOrganizationLoadingState(false);
    });
}

function populateOrganizationModalData(organization) {
    console.log('DEBUG: Populating modal with organization data:', organization);

    // Basic Organization Information
    document.getElementById('viewOrganizationName').textContent = organization.organization_name || '-';
    document.getElementById('viewOrganizationAcronym').textContent = organization.organization_acronym || '-';
    document.getElementById('viewOrganizationType').textContent = organization.organization_type_display || '-';
    document.getElementById('viewOrganizationStatus').textContent = organization.organization_status_display || '-';
    document.getElementById('viewOrganizationEmail').textContent = organization.organization_email || '-';
    document.getElementById('viewOrganizationUsername').textContent = organization.username || '-';

    // Style organization type and status badges
    if (organization.organization_type && organization.organization_status) {
        styleOrganizationBadges(organization.organization_type, organization.organization_status);
    }

    // Organization Logo
    const logoElement = document.getElementById('viewOrganizationLogo');
    if (organization.organization_logo_url) {
        logoElement.innerHTML = `<img src="${organization.organization_logo_url}" alt="${organization.organization_name}" class="organization-logo-large">`;
    } else {
        logoElement.innerHTML = `<div class="organization-logo-large placeholder"><i class='bx bxs-group'></i></div>`;
    }

    // Organization Description
    document.getElementById('viewOrganizationDescription').innerHTML = formatTextContent(organization.organization_description);
    document.getElementById('viewOrganizationMission').innerHTML = formatTextContent(organization.organization_mission);
    document.getElementById('viewOrganizationVision').innerHTML = formatTextContent(organization.organization_vision);

    // Adviser Information
    document.getElementById('viewAdviserName').textContent = organization.organization_adviser_name || '-';
    document.getElementById('viewAdviserDepartment').textContent = organization.organization_adviser_department || '-';
    document.getElementById('viewAdviserEmail').textContent = organization.organization_adviser_email || '-';
    document.getElementById('viewAdviserPhone').textContent = organization.organization_adviser_phone || '-';

    // Co-Adviser Information (NEW)
    document.getElementById('viewCoAdviserName').textContent = organization.organization_coadviser_name || '-';
    document.getElementById('viewCoAdviserDepartment').textContent = organization.organization_coadviser_department || '-';
    document.getElementById('viewCoAdviserEmail').textContent = organization.organization_coadviser_email || '-';
    document.getElementById('viewCoAdviserPhone').textContent = organization.organization_coadviser_phone || '-';

    // Show/hide co-adviser section based on whether co-adviser exists
    const coAdviserSection = document.getElementById('viewCoAdviserSection');
    if (organization.organization_coadviser_name) {
        coAdviserSection.style.display = 'block';
    } else {
        coAdviserSection.style.display = 'none';
    }

    // Validity Period
    document.getElementById('viewValidFrom').textContent = formatDate(organization.organization_valid_from) || '-';
    document.getElementById('viewValidUntil').textContent = formatDate(organization.organization_valid_until) || '-';
    document.getElementById('viewSchoolYear').textContent = organization.current_school_year || '-';
    document.getElementById('viewMemberCount').textContent = `${organization.organization_member_count} members`;

    // Approval Information
    populateApprovalInformation(organization);

    // Members
    populateMembersList(organization.organization_members, organization.organization_member_count);

    // Documents
    populateDocumentsList(organization.documents, organization.total_documents);
}

function styleOrganizationBadges(orgType, status) {
    const typeBadge = document.getElementById('viewOrganizationType');
    const statusBadge = document.getElementById('viewOrganizationStatus');

    // Style organization type badge
    typeBadge.className = 'organization-type-badge';
    typeBadge.classList.add(`type-${orgType}`);

    // Style status badge
    statusBadge.className = 'organization-status-badge';
    statusBadge.classList.add(`status-${status}`);
}

function populateApprovalInformation(organization) {
    const approvalSection = document.getElementById('viewApprovalSection');
    const rejectionSection = document.getElementById('viewRejectionSection');

    if (organization.organization_approved_by && organization.organization_status === 'active') {
        document.getElementById('viewApprovedBy').textContent = organization.organization_approved_by;
        document.getElementById('viewApprovedAt').textContent = formatDateTime(organization.organization_approved_at);
        approvalSection.style.display = 'block';
        rejectionSection.style.display = 'none';
    } else if (organization.organization_status === 'rejected' && organization.organization_rejection_reason) {
        document.getElementById('viewRejectionReason').innerHTML = formatTextContent(organization.organization_rejection_reason);
        approvalSection.style.display = 'block';
        rejectionSection.style.display = 'block';
    } else {
        approvalSection.style.display = 'none';
    }
}

function populateMembersList(members, memberCount) {
    const membersList = document.getElementById('viewMembersList');
    const membersCount = document.getElementById('viewMembersCount');

    // Update members count
    membersCount.textContent = `${memberCount} member${memberCount !== 1 ? 's' : ''}`;

    if (!members || members.length === 0) {
        membersList.innerHTML = `
            <tr>
                <td colspan="4" class="no-members-message">
                    <div class="no-content-message">
                        <i class='bx bx-user-x'></i>
                        <p>No members added</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';

    members.forEach(member => {
        if (member && member.first_name && member.last_name) {
            const fullName = `${member.first_name} ${member.last_name}`;
            const position = getPositionDisplay(member.position);

            html += `
                <tr>
                    <td>
                        <div class="member-name">
                            <strong>${escapeHtml(fullName)}</strong>
                        </div>
                    </td>
                    <td>
                        <span class="member-position ${member.position || 'member'}">
                            ${escapeHtml(position)}
                        </span>
                    </td>
                    <td>${escapeHtml(member.email || '-')}</td>
                    <td>${escapeHtml(member.student_id || '-')}</td>
                </tr>
            `;
        }
    });

    membersList.innerHTML = html;
}

function getPositionDisplay(position) {
    const positionMap = {
        '1st_year_board_director': '1st Year Board of Director',
        '1st_year_board_member': '1st Year Board Member',
        '2nd_year_board_director': '2nd Year Board of Director',
        '2nd_year_board_member': '2nd Year Board Member',
        '2nd_year_chairperson': '2nd Year Chairperson',
        '2nd_year_senator': '2nd Year Senator',
        '3rd_year_board_director': '3rd Year Board of Director',
        '3rd_year_board_member': '3rd Year Board Member',
        '3rd_year_chairperson': '3rd Year Chairperson',
        '4th_year_board_director': '4th Year Board of Director',
        '4th_year_board_member': '4th Year Board Member',
        '4th_year_chairperson': '4th Year Chairperson',
        '4th_year_senator': '4th Year Senator',
        'admin_custodian': 'Admin Custodian',
        'asst_business_manager': 'Assistant Business Manager',
        'asst_public_information_officer': 'Assistant Public Information Officer for all social media',
        'asst_public_relations_officer': 'Assistant Public Relations Officer',
        'asst_secretary': 'Asst. Secretary',
        'asst_treasurer': 'Asst. Treasurer',
        'assistant_coach': 'Assistant Coach',
        'assistant_secretary': 'Assistant Secretary',
        'associate_editor_external': 'Associate Editor - External',
        'associate_editor_internal': 'Associate Editor - Internal',
        'associate_secretary': 'Associate Secretary',
        'auditor': 'Auditor',
        'batch_representative': 'Batch Representative',
        'board_director': 'Board of Directors',
        'bookkeeper': 'Bookkeeper',
        'business_manager': 'Business Manager',
        'cartoonist': 'Cartoonist',
        'chairman_board': 'Chairman of the Board',
        'chairperson': 'Chairperson',
        'copy_editor': 'Copy Editor',
        'copy_editor_photojournalist': 'Copy Editor / Photojournalist',
        'corporate_society': 'Corporate Society',
        'creatives': 'Creatives',
        'creative_and_logistics': 'Creative And Logistics',
        'deputy_director_external_affairs': 'Deputy Director of External Affairs',
        'deputy_director_internal_affairs': 'Deputy Director of Internal Affairs',
        'deputy_director_multimedia_publications': 'Deputy Director of Multimedia Publications',
        'deputy_director_resource_assembly': 'Deputy Director of Resource Assembly',
        'deputy_director_resource_management': 'Deputy Director of Resource Management',
        'digital_media': 'Digital Media',
        'director_external_affairs': 'Director of External Affairs',
        'director_internal_affairs': 'Director of Internal Affairs',
        'director_multimedia_publications': 'Director of Multimedia Publications',
        'director_resource_assembly': 'Director of Resource Assembly',
        'director_resource_management': 'Director of Resource Management',
        'editor_in_chief': 'Editor-in-Chief',
        'editorial_manager': 'Editorial Manager',
        'english_1st_year_rep': 'English 1st Year Representative',
        'english_2nd_year_rep': 'English 2nd Year Representative',
        'english_3rd_year_rep': 'English 3rd Year Representative',
        'english_4th_year_rep': 'English 4th Year Representative',
        'events_management': 'Events Management',
        'executive_board_secretary': 'Executive Board Secretary',
        'executive_president': 'Executive President',
        'executive_secretary': 'Executive Secretary',
        'executive_vice_president': 'Executive Vice President',
        'executive_vice_president_external_affairs': 'Executive Vice President for External Affairs',
        'executive_vice_president_internal_affairs': 'Executive Vice President for Internal Affairs',
        'external_vice_president': 'External Vice President',
        'financial_director': 'Financial Director',
        'gad_representative': 'GAD Representative',
        'gender_development_representative': 'Gender and Development Representative',
        'gourmet_committee': 'Gourmet Committee',
        'head_multimedia_committee': 'Head Multimedia Committee',
        'head_photojournalist': 'Head Photojournalist',
        'head_sentinel': 'Head Sentinel',
        'head_stage_design': 'Head of Stage and Design',
        'internal_vice_president': 'Internal Vice President',
        'layout_graphic_artist': 'Layout and Graphic Artist',
        'legislative_secretary': 'Legislative Secretary',
        'logistics': 'Logistics',
        'math_1st_year_rep': 'Math 1st Year Representative',
        'math_2nd_year_rep': 'Math 2nd Year Representative',
        'math_3rd_year_rep': 'Math 3rd Year Representative',
        'math_4th_year_rep': 'Math 4th Year Representative',
        'member': 'Member',
        'multimedia_committee': 'Multimedia Committee',
        'multimedia_manager': 'Multimedia Manager',
        'news_presenter': 'News Presenter',
        'page_communication_officer': 'Page Communication Officer',
        'photojournalist': 'Photojournalist',
        'pod': 'POD',
        'president': 'President',
        'procurement_committee': 'Procurement Committee',
        'property_custodian': 'Property Custodian',
        'pro': 'PRO',
        'public_image_officer': 'Public Image Officer',
        'public_information_officer': 'Public Information Officer',
        'public_relations_officer': 'Public Relations Officer',
        'publication_officer': 'Publication Officer',
        'research_finance_committee': 'Research and Finance Committee',
        'secretariat': 'Secretariat',
        'secretary': 'Secretary',
        'senate_president': 'Senate President',
        'senator_academic_affairs': 'Senator for Academic Affairs',
        'senator_audit': 'Senator for Audit',
        'senator_constitutional_amendments': 'Senator for Constitutional and Amendments',
        'senator_creatives_publication': 'Senator for Creatives and Publication',
        'senator_finance_budgeting': 'Senator for Finance and Budgeting',
        'senator_student_rights_welfare': 'Senator for Student Rights and Welfare',
        'senator_gender_development': 'Senator on Gender and Development',
        'senator_sports_youth_development': 'Senator on Sports and Youth Development',
        'sentinel': 'Sentinel',
        'social_media_support': 'Social Media Support',
        'stage_design_committee': 'Stage and Design Committee',
        'staff_administrative': 'Staff on Administrative',
        'staff_creative_content_development': 'Staff on Creative Content Development',
        'staff_creative_media_development': 'Staff on Creative Media Development',
        'staff_internal_rights_welfare': 'Staff on Internal Rights and Welfare',
        'staff_technical_operations_support': 'Staff on Technical Operations and Support',
        'section_writer': 'Section Writer',
        'team_coach': 'Team Coach',
        'technical': 'Technical',
        'technical_committee': 'Technical Committee',
        'technical_support': 'Technical Support',
        'technical_support_committee': 'Technical and Support Committee',
        'treasurer': 'Treasurer',
        'vice_chairperson': 'Vice Chairperson',
        'vice_president': 'Vice President',
        'vice_president_external': 'Vice President for External Affairs',
        'vice_president_internal': 'Vice President for Internal Affairs',
        'vice_president_external_administration': 'Vice President for External Administration',
        'vice_president_external_operation': 'Vice President for External Operation',
        'vice_president_internal_affairs': 'Vice President for Internal Affairs'
    };
    return positionMap[position] || 'Member';
}

function populateDocumentsList(documents, totalDocuments) {
    const documentsList = document.getElementById('viewDocumentsList');
    const documentsCount = document.getElementById('viewDocumentsCount');

    // Update documents count
    documentsCount.textContent = `${totalDocuments} document${totalDocuments !== 1 ? 's' : ''}`;

    if (totalDocuments === 0) {
        documentsList.innerHTML = `
            <div class="no-documents-message">
                <i class='bx bx-file-blank'></i>
                <p>No documents uploaded</p>
                <small class="no-documents-subtext">This organization has no uploaded documents</small>
            </div>
        `;
        return;
    }

    let html = '';

    documents.forEach(doc => {
        const fileSize = formatFileSize(doc.file_size);
        const fileIcon = getFileIcon(doc.field_name);

        html += `
            <div class="document-item">
                <div class="document-icon">
                    <i class='${fileIcon}'></i>
                </div>
                <div class="document-info">
                    <div class="document-name">${escapeHtml(doc.name)}</div>
                    <div class="document-meta">
                        <span class="document-filename">${escapeHtml(doc.file_name)}</span>
                        <span class="document-size">${fileSize}</span>
                        ${doc.uploaded_at ? `<span class="document-date">${formatDateTime(doc.uploaded_at)}</span>` : ''}
                    </div>
                </div>
                <div class="document-actions">
                    <a href="${doc.file_url}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="document-download"
                       title="Download document">
                        <i class='bx bx-download'></i>
                    </a>
                </div>
            </div>
        `;
    });

    documentsList.innerHTML = html;
}

function getFileIcon(fieldName) {
    if (fieldName.includes('logo') || fieldName.includes('picture')) {
        return 'bx bx-image';
    } else if (fieldName.includes('cv') || fieldName.includes('biodata')) {
        return 'bx bx-user-circle';
    } else {
        return 'bx bx-file';
    }
}

function formatTextContent(text) {
    if (!text || !text.trim()) {
        return `
            <div class="no-content-message">
                <i class='bx bx-note'></i>
                <p>No content provided</p>
            </div>
        `;
    }
    return `<div class="content-text-inner">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
}

function showOrganizationModal() {
    const modal = document.getElementById('organizationViewModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeOrganizationViewModal() {
    const modal = document.getElementById('organizationViewModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear previous data
    clearOrganizationModalData();
}

function clearOrganizationModalData() {
    const elementsToClear = [
        'viewOrganizationName', 'viewOrganizationAcronym', 'viewOrganizationType',
        'viewOrganizationStatus', 'viewOrganizationEmail', 'viewOrganizationUsername',
        'viewOrganizationDescription', 'viewOrganizationMission', 'viewOrganizationVision',
        'viewAdviserName', 'viewAdviserDepartment', 'viewAdviserEmail', 'viewAdviserPhone',
        'viewCoAdviserName', 'viewCoAdviserDepartment', 'viewCoAdviserEmail', 'viewCoAdviserPhone', // NEW
        'viewValidFrom', 'viewValidUntil', 'viewSchoolYear', 'viewMemberCount',
        'viewApprovedBy', 'viewApprovedAt', 'viewRejectionReason',
        'viewMembersCount', 'viewDocumentsCount'
    ];

    elementsToClear.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '';
    });

    // Clear dynamic content
    document.getElementById('viewMembersList').innerHTML = '';
    document.getElementById('viewDocumentsList').innerHTML = '';

    // Reset logo
    const logoElement = document.getElementById('viewOrganizationLogo');
    logoElement.innerHTML = `<div class="organization-logo-large placeholder"><i class='bx bxs-group'></i></div>`;

    // Hide optional sections
    const optionalSections = ['viewApprovalSection', 'viewCoAdviserSection']; // UPDATED
    optionalSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

function showOrganizationLoadingState(show) {
    const modal = document.getElementById('organizationViewModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#organizationModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'organizationModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading organization details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#organizationModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleOrganizationResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleOrganizationError(error) {
    console.error('Error loading organization details:', error);
    showErrorToast(error.message || 'Failed to load organization details');
}

// Utility functions (reuse from existing)
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

function formatFileSize(bytes) {
    if (!bytes) return '0 bytes';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Make functions globally available
window.openOrganizationViewModal = openOrganizationViewModal;
window.closeOrganizationViewModal = closeOrganizationViewModal;

// --------------------------------------------- Edit Organization Function --------------------------------------------
let editOrganizationMembers = [];
let currentOrganizationData = null;

// Open edit modal
function openEditOrganizationModal(organizationId) {
    console.log('DEBUG: Opening edit organization modal for ID:', organizationId);
    showEditOrganizationLoadingState(true);

    fetch(`/organizations/${organizationId}/edit/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleEditOrganizationResponse)
    .then(data => {
        console.log('DEBUG: Received organization data for edit:', data);
        if (data.success) {
            currentOrganizationData = data.organization;
            populateEditOrganizationForm(data.organization);
            showEditOrganizationModal();
        } else {
            throw new Error(data.error || 'Failed to load organization details for editing');
        }
    })
    .catch(handleEditOrganizationError)
    .finally(() => {
        showEditOrganizationLoadingState(false);
    });
}

// Populate edit form with organization data
function populateEditOrganizationForm(organization) {
    console.log('DEBUG: Populating edit form with organization data:', organization);

    // Set organization ID and update form action
    document.getElementById('editOrganizationId').value = organization.id;
    const form = document.getElementById('organizationEditForm');
    if (form) {
        const currentAction = form.getAttribute('action');
        const newAction = currentAction.replace('/0/', `/${organization.id}/`);
        form.setAttribute('action', newAction);
        console.log('DEBUG: Updated form action to:', newAction);
    }

    // Account Information - Now optional
    document.getElementById('edit_username').value = organization.username || '';
    document.getElementById('edit_username').readOnly = false;
    document.getElementById('edit_username').style.backgroundColor = '';
    document.getElementById('edit_username').style.cursor = 'text';
    document.getElementById('edit_username').placeholder = 'Leave blank to keep current username';

    document.getElementById('edit_email').value = organization.email || '';
    document.getElementById('edit_email').placeholder = 'Leave blank to keep current email address';
    document.getElementById('edit_organization_email').value = organization.organization_email || '';

    // Organization Information
    document.getElementById('edit_organization_name').value = organization.organization_name || '';
    document.getElementById('edit_organization_acronym').value = organization.organization_acronym || '';
    document.getElementById('edit_organization_type').value = organization.organization_type || '';
    document.getElementById('edit_organization_description').value = organization.organization_description || '';
    document.getElementById('edit_organization_mission').value = organization.organization_mission || '';
    document.getElementById('edit_organization_vision').value = organization.organization_vision || '';

    // Adviser Information
    document.getElementById('edit_organization_adviser_name').value = organization.organization_adviser_name || '';
    document.getElementById('edit_organization_adviser_department').value = organization.organization_adviser_department || '';
    document.getElementById('edit_organization_adviser_email').value = organization.organization_adviser_email || '';
    document.getElementById('edit_organization_adviser_phone').value = organization.organization_adviser_phone || '';

    // Co-Adviser Information (Optional)
    document.getElementById('edit_organization_coadviser_name').value = organization.organization_coadviser_name || '';
    document.getElementById('edit_organization_coadviser_department').value = organization.organization_coadviser_department || '';
    document.getElementById('edit_organization_coadviser_email').value = organization.organization_coadviser_email || '';
    document.getElementById('edit_organization_coadviser_phone').value = organization.organization_coadviser_phone || '';

    // Validity Period
    document.getElementById('edit_organization_valid_from').value = organization.organization_valid_from || '';
    document.getElementById('edit_organization_valid_until').value = organization.organization_valid_until || '';

    // Members
    populateEditMembersList(organization.organization_members || []);

    // Current Files
    populateCurrentFiles(organization.documents || []);

    // Toggle student requirements
    toggleEditOrganizationRequirements(organization.organization_type);

    console.log('DEBUG: Edit form populated successfully');
}

// Populate members list for editing with updated position options
function populateEditMembersList(members) {
    editOrganizationMembers = [];
    const tbody = document.getElementById('editMembersTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (members && members.length > 0) {
        members.forEach((member, index) => {
            if (member && member.first_name && member.last_name) {
                editOrganizationMembers.push({
                    id: index,
                    first_name: member.first_name || '',
                    last_name: member.last_name || '',
                    position: member.position || '',
                    email: member.email || '',
                    student_id: member.student_id || ''
                });

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <input type="text" class="form-input sm" name="member_first_name" value="${escapeHtml(member.first_name || '')}" placeholder="First Name" oninput="updateEditMemberData(${index}, this)">
                    </td>
                    <td>
                        <input type="text" class="form-input sm" name="member_last_name" value="${escapeHtml(member.last_name || '')}" placeholder="Last Name" oninput="updateEditMemberData(${index}, this)">
                    </td>
                    <td>
                        <select class="form-input sm" name="member_position" onchange="updateEditMemberData(${index}, this)">
                            <option value="">Select Position</option>
                            <!-- Alphabetically Sorted Positions A-Z -->
                            <option value="1st_year_board_director" ${member.position === '1st_year_board_director' ? 'selected' : ''}>1st Year Board of Director</option>
                            <option value="1st_year_board_member" ${member.position === '1st_year_board_member' ? 'selected' : ''}>1st Year Board Member</option>
                            <option value="2nd_year_board_director" ${member.position === '2nd_year_board_director' ? 'selected' : ''}>2nd Year Board of Director</option>
                            <option value="2nd_year_board_member" ${member.position === '2nd_year_board_member' ? 'selected' : ''}>2nd Year Board Member</option>
                            <option value="2nd_year_chairperson" ${member.position === '2nd_year_chairperson' ? 'selected' : ''}>2nd Year Chairperson</option>
                            <option value="2nd_year_senator" ${member.position === '2nd_year_senator' ? 'selected' : ''}>2nd Year Senator</option>
                            <option value="3rd_year_board_director" ${member.position === '3rd_year_board_director' ? 'selected' : ''}>3rd Year Board of Director</option>
                            <option value="3rd_year_board_member" ${member.position === '3rd_year_board_member' ? 'selected' : ''}>3rd Year Board Member</option>
                            <option value="3rd_year_chairperson" ${member.position === '3rd_year_chairperson' ? 'selected' : ''}>3rd Year Chairperson</option>
                            <option value="4th_year_board_director" ${member.position === '4th_year_board_director' ? 'selected' : ''}>4th Year Board of Director</option>
                            <option value="4th_year_board_member" ${member.position === '4th_year_board_member' ? 'selected' : ''}>4th Year Board Member</option>
                            <option value="4th_year_chairperson" ${member.position === '4th_year_chairperson' ? 'selected' : ''}>4th Year Chairperson</option>
                            <option value="4th_year_senator" ${member.position === '4th_year_senator' ? 'selected' : ''}>4th Year Senator</option>
                            <option value="admin_custodian" ${member.position === 'admin_custodian' ? 'selected' : ''}>Admin Custodian</option>
                            <option value="asst_business_manager" ${member.position === 'asst_business_manager' ? 'selected' : ''}>Assistant Business Manager</option>
                            <option value="asst_public_information_officer" ${member.position === 'asst_public_information_officer' ? 'selected' : ''}>Assistant Public Information Officer for all social media</option>
                            <option value="asst_public_relations_officer" ${member.position === 'asst_public_relations_officer' ? 'selected' : ''}>Assistant Public Relations Officer</option>
                            <option value="asst_secretary" ${member.position === 'asst_secretary' ? 'selected' : ''}>Asst. Secretary</option>
                            <option value="asst_treasurer" ${member.position === 'asst_treasurer' ? 'selected' : ''}>Asst. Treasurer</option>
                            <option value="assistant_coach" ${member.position === 'assistant_coach' ? 'selected' : ''}>Assistant Coach</option>
                            <option value="assistant_secretary" ${member.position === 'assistant_secretary' ? 'selected' : ''}>Assistant Secretary</option>
                            <option value="associate_editor_external" ${member.position === 'associate_editor_external' ? 'selected' : ''}>Associate Editor - External</option>
                            <option value="associate_editor_internal" ${member.position === 'associate_editor_internal' ? 'selected' : ''}>Associate Editor - Internal</option>
                            <option value="associate_secretary" ${member.position === 'associate_secretary' ? 'selected' : ''}>Associate Secretary</option>
                            <option value="auditor" ${member.position === 'auditor' ? 'selected' : ''}>Auditor</option>
                            <option value="batch_representative" ${member.position === 'batch_representative' ? 'selected' : ''}>Batch Representative</option>
                            <option value="board_director" ${member.position === 'board_director' ? 'selected' : ''}>Board of Directors</option>
                            <option value="bookkeeper" ${member.position === 'bookkeeper' ? 'selected' : ''}>Bookkeeper</option>
                            <option value="business_manager" ${member.position === 'business_manager' ? 'selected' : ''}>Business Manager</option>
                            <option value="cartoonist" ${member.position === 'cartoonist' ? 'selected' : ''}>Cartoonist</option>
                            <option value="chairman_board" ${member.position === 'chairman_board' ? 'selected' : ''}>Chairman of the Board</option>
                            <option value="chairperson" ${member.position === 'chairperson' ? 'selected' : ''}>Chairperson</option>
                            <option value="copy_editor" ${member.position === 'copy_editor' ? 'selected' : ''}>Copy Editor</option>
                            <option value="copy_editor_photojournalist" ${member.position === 'copy_editor_photojournalist' ? 'selected' : ''}>Copy Editor / Photojournalist</option>
                            <option value="corporate_society" ${member.position === 'corporate_society' ? 'selected' : ''}>Corporate Society</option>
                            <option value="creatives" ${member.position === 'creatives' ? 'selected' : ''}>Creatives</option>
                            <option value="creative_and_logistics" ${member.position === 'creative_and_logistics' ? 'selected' : ''}>Creative And Logistics</option>
                            <option value="deputy_director_external_affairs" ${member.position === 'deputy_director_external_affairs' ? 'selected' : ''}>Deputy Director of External Affairs</option>
                            <option value="deputy_director_internal_affairs" ${member.position === 'deputy_director_internal_affairs' ? 'selected' : ''}>Deputy Director of Internal Affairs</option>
                            <option value="deputy_director_multimedia_publications" ${member.position === 'deputy_director_multimedia_publications' ? 'selected' : ''}>Deputy Director of Multimedia Publications</option>
                            <option value="deputy_director_resource_assembly" ${member.position === 'deputy_director_resource_assembly' ? 'selected' : ''}>Deputy Director of Resource Assembly</option>
                            <option value="deputy_director_resource_management" ${member.position === 'deputy_director_resource_management' ? 'selected' : ''}>Deputy Director of Resource Management</option>
                            <option value="digital_media" ${member.position === 'digital_media' ? 'selected' : ''}>Digital Media</option>
                            <option value="director_external_affairs" ${member.position === 'director_external_affairs' ? 'selected' : ''}>Director of External Affairs</option>
                            <option value="director_internal_affairs" ${member.position === 'director_internal_affairs' ? 'selected' : ''}>Director of Internal Affairs</option>
                            <option value="director_multimedia_publications" ${member.position === 'director_multimedia_publications' ? 'selected' : ''}>Director of Multimedia Publications</option>
                            <option value="director_resource_assembly" ${member.position === 'director_resource_assembly' ? 'selected' : ''}>Director of Resource Assembly</option>
                            <option value="director_resource_management" ${member.position === 'director_resource_management' ? 'selected' : ''}>Director of Resource Management</option>
                            <option value="editor_in_chief" ${member.position === 'editor_in_chief' ? 'selected' : ''}>Editor-in-Chief</option>
                            <option value="editorial_manager" ${member.position === 'editorial_manager' ? 'selected' : ''}>Editorial Manager</option>
                            <option value="english_1st_year_rep" ${member.position === 'english_1st_year_rep' ? 'selected' : ''}>English 1st Year Representative</option>
                            <option value="english_2nd_year_rep" ${member.position === 'english_2nd_year_rep' ? 'selected' : ''}>English 2nd Year Representative</option>
                            <option value="english_3rd_year_rep" ${member.position === 'english_3rd_year_rep' ? 'selected' : ''}>English 3rd Year Representative</option>
                            <option value="english_4th_year_rep" ${member.position === 'english_4th_year_rep' ? 'selected' : ''}>English 4th Year Representative</option>
                            <option value="events_management" ${member.position === 'events_management' ? 'selected' : ''}>Events Management</option>
                            <option value="executive_board_secretary" ${member.position === 'executive_board_secretary' ? 'selected' : ''}>Executive Board Secretary</option>
                            <option value="executive_president" ${member.position === 'executive_president' ? 'selected' : ''}>Executive President</option>
                            <option value="executive_secretary" ${member.position === 'executive_secretary' ? 'selected' : ''}>Executive Secretary</option>
                            <option value="executive_vice_president" ${member.position === 'executive_vice_president' ? 'selected' : ''}>Executive Vice President</option>
                            <option value="executive_vice_president_external_affairs" ${member.position === 'executive_vice_president_external_affairs' ? 'selected' : ''}>Executive Vice President for External Affairs</option>
                            <option value="executive_vice_president_internal_affairs" ${member.position === 'executive_vice_president_internal_affairs' ? 'selected' : ''}>Executive Vice President for Internal Affairs</option>
                            <option value="external_vice_president" ${member.position === 'external_vice_president' ? 'selected' : ''}>External Vice President</option>
                            <option value="financial_director" ${member.position === 'financial_director' ? 'selected' : ''}>Financial Director</option>
                            <option value="gad_representative" ${member.position === 'gad_representative' ? 'selected' : ''}>GAD Representative</option>
                            <option value="gender_development_representative" ${member.position === 'gender_development_representative' ? 'selected' : ''}>Gender and Development Representative</option>
                            <option value="gourmet_committee" ${member.position === 'gourmet_committee' ? 'selected' : ''}>Gourmet Committee</option>
                            <option value="head_multimedia_committee" ${member.position === 'head_multimedia_committee' ? 'selected' : ''}>Head Multimedia Committee</option>
                            <option value="head_photojournalist" ${member.position === 'head_photojournalist' ? 'selected' : ''}>Head Photojournalist</option>
                            <option value="head_sentinel" ${member.position === 'head_sentinel' ? 'selected' : ''}>Head Sentinel</option>
                            <option value="head_stage_design" ${member.position === 'head_stage_design' ? 'selected' : ''}>Head of Stage and Design</option>
                            <option value="internal_vice_president" ${member.position === 'internal_vice_president' ? 'selected' : ''}>Internal Vice President</option>
                            <option value="layout_graphic_artist" ${member.position === 'layout_graphic_artist' ? 'selected' : ''}>Layout and Graphic Artist</option>
                            <option value="legislative_secretary" ${member.position === 'legislative_secretary' ? 'selected' : ''}>Legislative Secretary</option>
                            <option value="logistics" ${member.position === 'logistics' ? 'selected' : ''}>Logistics</option>
                            <option value="math_1st_year_rep" ${member.position === 'math_1st_year_rep' ? 'selected' : ''}>Math 1st Year Representative</option>
                            <option value="math_2nd_year_rep" ${member.position === 'math_2nd_year_rep' ? 'selected' : ''}>Math 2nd Year Representative</option>
                            <option value="math_3rd_year_rep" ${member.position === 'math_3rd_year_rep' ? 'selected' : ''}>Math 3rd Year Representative</option>
                            <option value="math_4th_year_rep" ${member.position === 'math_4th_year_rep' ? 'selected' : ''}>Math 4th Year Representative</option>
                            <option value="member" ${member.position === 'member' ? 'selected' : ''}>Member</option>
                            <option value="multimedia_committee" ${member.position === 'multimedia_committee' ? 'selected' : ''}>Multimedia Committee</option>
                            <option value="multimedia_manager" ${member.position === 'multimedia_manager' ? 'selected' : ''}>Multimedia Manager</option>
                            <option value="news_presenter" ${member.position === 'news_presenter' ? 'selected' : ''}>News Presenter</option>
                            <option value="page_communication_officer" ${member.position === 'page_communication_officer' ? 'selected' : ''}>Page Communication Officer</option>
                            <option value="photojournalist" ${member.position === 'photojournalist' ? 'selected' : ''}>Photojournalist</option>
                            <option value="pod" ${member.position === 'pod' ? 'selected' : ''}>POD</option>
                            <option value="president" ${member.position === 'president' ? 'selected' : ''}>President</option>
                            <option value="procurement_committee" ${member.position === 'procurement_committee' ? 'selected' : ''}>Procurement Committee</option>
                            <option value="property_custodian" ${member.position === 'property_custodian' ? 'selected' : ''}>Property Custodian</option>
                            <option value="pro" ${member.position === 'pro' ? 'selected' : ''}>PRO</option>
                            <option value="public_image_officer" ${member.position === 'public_image_officer' ? 'selected' : ''}>Public Image Officer</option>
                            <option value="public_information_officer" ${member.position === 'public_information_officer' ? 'selected' : ''}>Public Information Officer</option>
                            <option value="public_relations_officer" ${member.position === 'public_relations_officer' ? 'selected' : ''}>Public Relations Officer</option>
                            <option value="publication_officer" ${member.position === 'publication_officer' ? 'selected' : ''}>Publication Officer</option>
                            <option value="research_finance_committee" ${member.position === 'research_finance_committee' ? 'selected' : ''}>Research and Finance Committee</option>
                            <option value="secretariat" ${member.position === 'secretariat' ? 'selected' : ''}>Secretariat</option>
                            <option value="secretary" ${member.position === 'secretary' ? 'selected' : ''}>Secretary</option>
                            <option value="senate_president" ${member.position === 'senate_president' ? 'selected' : ''}>Senate President</option>
                            <option value="senator_academic_affairs" ${member.position === 'senator_academic_affairs' ? 'selected' : ''}>Senator for Academic Affairs</option>
                            <option value="senator_audit" ${member.position === 'senator_audit' ? 'selected' : ''}>Senator for Audit</option>
                            <option value="senator_constitutional_amendments" ${member.position === 'senator_constitutional_amendments' ? 'selected' : ''}>Senator for Constitutional and Amendments</option>
                            <option value="senator_creatives_publication" ${member.position === 'senator_creatives_publication' ? 'selected' : ''}>Senator for Creatives and Publication</option>
                            <option value="senator_finance_budgeting" ${member.position === 'senator_finance_budgeting' ? 'selected' : ''}>Senator for Finance and Budgeting</option>
                            <option value="senator_student_rights_welfare" ${member.position === 'senator_student_rights_welfare' ? 'selected' : ''}>Senator for Student Rights and Welfare</option>
                            <option value="senator_gender_development" ${member.position === 'senator_gender_development' ? 'selected' : ''}>Senator on Gender and Development</option>
                            <option value="senator_sports_youth_development" ${member.position === 'senator_sports_youth_development' ? 'selected' : ''}>Senator on Sports and Youth Development</option>
                            <option value="sentinel" ${member.position === 'sentinel' ? 'selected' : ''}>Sentinel</option>
                            <option value="social_media_support" ${member.position === 'social_media_support' ? 'selected' : ''}>Social Media Support</option>
                            <option value="stage_design_committee" ${member.position === 'stage_design_committee' ? 'selected' : ''}>Stage and Design Committee</option>
                            <option value="staff_administrative" ${member.position === 'staff_administrative' ? 'selected' : ''}>Staff on Administrative</option>
                            <option value="staff_creative_content_development" ${member.position === 'staff_creative_content_development' ? 'selected' : ''}>Staff on Creative Content Development</option>
                            <option value="staff_creative_media_development" ${member.position === 'staff_creative_media_development' ? 'selected' : ''}>Staff on Creative Media Development</option>
                            <option value="staff_internal_rights_welfare" ${member.position === 'staff_internal_rights_welfare' ? 'selected' : ''}>Staff on Internal Rights and Welfare</option>
                            <option value="staff_technical_operations_support" ${member.position === 'staff_technical_operations_support' ? 'selected' : ''}>Staff on Technical Operations and Support</option>
                            <option value="section_writer" ${member.position === 'section_writer' ? 'selected' : ''}>Section Writer</option>
                            <option value="team_coach" ${member.position === 'team_coach' ? 'selected' : ''}>Team Coach</option>
                            <option value="technical" ${member.position === 'technical' ? 'selected' : ''}>Technical</option>
                            <option value="technical_committee" ${member.position === 'technical_committee' ? 'selected' : ''}>Technical Committee</option>
                            <option value="technical_support" ${member.position === 'technical_support' ? 'selected' : ''}>Technical Support</option>
                            <option value="technical_support_committee" ${member.position === 'technical_support_committee' ? 'selected' : ''}>Technical and Support Committee</option>
                            <option value="treasurer" ${member.position === 'treasurer' ? 'selected' : ''}>Treasurer</option>
                            <option value="vice_chairperson" ${member.position === 'vice_chairperson' ? 'selected' : ''}>Vice Chairperson</option>
                            <option value="vice_president" ${member.position === 'vice_president' ? 'selected' : ''}>Vice President</option>
                            <option value="vice_president_external" ${member.position === 'vice_president_external' ? 'selected' : ''}>Vice President for External Affairs</option>
                            <option value="vice_president_internal" ${member.position === 'vice_president_internal' ? 'selected' : ''}>Vice President for Internal Affairs</option>
                            <option value="vice_president_external_administration" ${member.position === 'vice_president_external_administration' ? 'selected' : ''}>Vice President for External Administration</option>
                            <option value="vice_president_external_operation" ${member.position === 'vice_president_external_operation' ? 'selected' : ''}>Vice President for External Operation</option>
                            <option value="vice_president_internal_affairs" ${member.position === 'vice_president_internal_affairs' ? 'selected' : ''}>Vice President for Internal Affairs</option>
                        </select>
                    </td>
                    <td>
                        <input type="email" class="form-input sm" name="member_email" value="${escapeHtml(member.email || '')}" placeholder="Email" oninput="updateEditMemberData(${index}, this)">
                    </td>
                    <td>
                        <input type="text" class="form-input sm" name="member_student_id" value="${escapeHtml(member.student_id || '')}" placeholder="Student ID" oninput="updateEditMemberData(${index}, this)">
                    </td>
                    <td>
                        <button type="button" class="btn-icon btn-danger" onclick="removeEditMember(${index})">
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            }
        });
    }

    updateEditMemberCount();
    updateEditMembersJSON();
}

// Add edit member row with updated position options
function addEditMemberRow() {
    const tbody = document.getElementById('editMembersTableBody');
    if (!tbody) return;

    const memberId = editOrganizationMembers.length;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="text" class="form-input sm" name="member_first_name" placeholder="First Name" oninput="updateEditMemberData(${memberId}, this)">
        </td>
        <td>
            <input type="text" class="form-input sm" name="member_last_name" placeholder="Last Name" oninput="updateEditMemberData(${memberId}, this)">
        </td>
        <td>
            <select class="form-input sm" name="member_position" onchange="updateEditMemberData(${memberId}, this)">
                <option value="">Select Position</option>
                <!-- Alphabetically Sorted Positions A-Z -->
                <option value="1st_year_board_director">1st Year Board of Director</option>
                <option value="1st_year_board_member">1st Year Board Member</option>
                <option value="2nd_year_board_director">2nd Year Board of Director</option>
                <option value="2nd_year_board_member">2nd Year Board Member</option>
                <option value="2nd_year_chairperson">2nd Year Chairperson</option>
                <option value="2nd_year_senator">2nd Year Senator</option>
                <option value="3rd_year_board_director">3rd Year Board of Director</option>
                <option value="3rd_year_board_member">3rd Year Board Member</option>
                <option value="3rd_year_chairperson">3rd Year Chairperson</option>
                <option value="4th_year_board_director">4th Year Board of Director</option>
                <option value="4th_year_board_member">4th Year Board Member</option>
                <option value="4th_year_chairperson">4th Year Chairperson</option>
                <option value="4th_year_senator">4th Year Senator</option>
                <option value="admin_custodian">Admin Custodian</option>
                <option value="asst_business_manager">Assistant Business Manager</option>
                <option value="asst_public_information_officer">Assistant Public Information Officer for all social media</option>
                <option value="asst_public_relations_officer">Assistant Public Relations Officer</option>
                <option value="asst_secretary">Asst. Secretary</option>
                <option value="asst_treasurer">Asst. Treasurer</option>
                <option value="assistant_coach">Assistant Coach</option>
                <option value="assistant_secretary">Assistant Secretary</option>
                <option value="associate_editor_external">Associate Editor - External</option>
                <option value="associate_editor_internal">Associate Editor - Internal</option>
                <option value="associate_secretary">Associate Secretary</option>
                <option value="auditor">Auditor</option>
                <option value="batch_representative">Batch Representative</option>
                <option value="board_director">Board of Directors</option>
                <option value="bookkeeper">Bookkeeper</option>
                <option value="business_manager">Business Manager</option>
                <option value="cartoonist">Cartoonist</option>
                <option value="chairman_board">Chairman of the Board</option>
                <option value="chairperson">Chairperson</option>
                <option value="copy_editor">Copy Editor</option>
                <option value="copy_editor_photojournalist">Copy Editor / Photojournalist</option>
                <option value="corporate_society">Corporate Society</option>
                <option value="creatives">Creatives</option>
                <option value="creative_and_logistics">Creative And Logistics</option>
                <option value="deputy_director_external_affairs">Deputy Director of External Affairs</option>
                <option value="deputy_director_internal_affairs">Deputy Director of Internal Affairs</option>
                <option value="deputy_director_multimedia_publications">Deputy Director of Multimedia Publications</option>
                <option value="deputy_director_resource_assembly">Deputy Director of Resource Assembly</option>
                <option value="deputy_director_resource_management">Deputy Director of Resource Management</option>
                <option value="digital_media">Digital Media</option>
                <option value="director_external_affairs">Director of External Affairs</option>
                <option value="director_internal_affairs">Director of Internal Affairs</option>
                <option value="director_multimedia_publications">Director of Multimedia Publications</option>
                <option value="director_resource_assembly">Director of Resource Assembly</option>
                <option value="director_resource_management">Director of Resource Management</option>
                <option value="editor_in_chief">Editor-in-Chief</option>
                <option value="editorial_manager">Editorial Manager</option>
                <option value="english_1st_year_rep">English 1st Year Representative</option>
                <option value="english_2nd_year_rep">English 2nd Year Representative</option>
                <option value="english_3rd_year_rep">English 3rd Year Representative</option>
                <option value="english_4th_year_rep">English 4th Year Representative</option>
                <option value="events_management">Events Management</option>
                <option value="executive_board_secretary">Executive Board Secretary</option>
                <option value="executive_president">Executive President</option>
                <option value="executive_secretary">Executive Secretary</option>
                <option value="executive_vice_president">Executive Vice President</option>
                <option value="executive_vice_president_external_affairs">Executive Vice President for External Affairs</option>
                <option value="executive_vice_president_internal_affairs">Executive Vice President for Internal Affairs</option>
                <option value="external_vice_president">External Vice President</option>
                <option value="financial_director">Financial Director</option>
                <option value="gad_representative">GAD Representative</option>
                <option value="gender_development_representative">Gender and Development Representative</option>
                <option value="gourmet_committee">Gourmet Committee</option>
                <option value="head_multimedia_committee">Head Multimedia Committee</option>
                <option value="head_photojournalist">Head Photojournalist</option>
                <option value="head_sentinel">Head Sentinel</option>
                <option value="head_stage_design">Head of Stage and Design</option>
                <option value="internal_vice_president">Internal Vice President</option>
                <option value="layout_graphic_artist">Layout and Graphic Artist</option>
                <option value="legislative_secretary">Legislative Secretary</option>
                <option value="logistics">Logistics</option>
                <option value="math_1st_year_rep">Math 1st Year Representative</option>
                <option value="math_2nd_year_rep">Math 2nd Year Representative</option>
                <option value="math_3rd_year_rep">Math 3rd Year Representative</option>
                <option value="math_4th_year_rep">Math 4th Year Representative</option>
                <option value="member">Member</option>
                <option value="multimedia_committee">Multimedia Committee</option>
                <option value="multimedia_manager">Multimedia Manager</option>
                <option value="news_presenter">News Presenter</option>
                <option value="page_communication_officer">Page Communication Officer</option>
                <option value="photojournalist">Photojournalist</option>
                <option value="pod">POD</option>
                <option value="president">President</option>
                <option value="procurement_committee">Procurement Committee</option>
                <option value="property_custodian">Property Custodian</option>
                <option value="pro">PRO</option>
                <option value="public_image_officer">Public Image Officer</option>
                <option value="public_information_officer">Public Information Officer</option>
                <option value="public_relations_officer">Public Relations Officer</option>
                <option value="publication_officer">Publication Officer</option>
                <option value="research_finance_committee">Research and Finance Committee</option>
                <option value="secretariat">Secretariat</option>
                <option value="secretary">Secretary</option>
                <option value="senate_president">Senate President</option>
                <option value="senator_academic_affairs">Senator for Academic Affairs</option>
                <option value="senator_audit">Senator for Audit</option>
                <option value="senator_constitutional_amendments">Senator for Constitutional and Amendments</option>
                <option value="senator_creatives_publication">Senator for Creatives and Publication</option>
                <option value="senator_finance_budgeting">Senator for Finance and Budgeting</option>
                <option value="senator_student_rights_welfare">Senator for Student Rights and Welfare</option>
                <option value="senator_gender_development">Senator on Gender and Development</option>
                <option value="senator_sports_youth_development">Senator on Sports and Youth Development</option>
                <option value="sentinel">Sentinel</option>
                <option value="social_media_support">Social Media Support</option>
                <option value="stage_design_committee">Stage and Design Committee</option>
                <option value="staff_administrative">Staff on Administrative</option>
                <option value="staff_creative_content_development">Staff on Creative Content Development</option>
                <option value="staff_creative_media_development">Staff on Creative Media Development</option>
                <option value="staff_internal_rights_welfare">Staff on Internal Rights and Welfare</option>
                <option value="staff_technical_operations_support">Staff on Technical Operations and Support</option>
                <option value="section_writer">Section Writer</option>
                <option value="team_coach">Team Coach</option>
                <option value="technical">Technical</option>
                <option value="technical_committee">Technical Committee</option>
                <option value="technical_support">Technical Support</option>
                <option value="technical_support_committee">Technical and Support Committee</option>
                <option value="treasurer">Treasurer</option>
                <option value="vice_chairperson">Vice Chairperson</option>
                <option value="vice_president">Vice President</option>
                <option value="vice_president_external">Vice President for External Affairs</option>
                <option value="vice_president_internal">Vice President for Internal Affairs</option>
                <option value="vice_president_external_administration">Vice President for External Administration</option>
                <option value="vice_president_external_operation">Vice President for External Operation</option>
                <option value="vice_president_internal_affairs">Vice President for Internal Affairs</option>
            </select>
        </td>
        <td>
            <input type="email" class="form-input sm" name="member_email" placeholder="Email" oninput="updateEditMemberData(${memberId}, this)">
        </td>
        <td>
            <input type="text" class="form-input sm" name="member_student_id" placeholder="Student ID" oninput="updateEditMemberData(${memberId}, this)">
        </td>
        <td>
            <button type="button" class="btn-icon btn-danger" onclick="removeEditMember(${memberId})">
                <i class='bx bx-trash'></i>
            </button>
        </td>
    `;

    tbody.appendChild(row);

    editOrganizationMembers.push({
        id: memberId,
        first_name: '',
        last_name: '',
        position: '',
        email: '',
        student_id: ''
    });

    updateEditMemberCount();
    updateEditMembersJSON();
}

function updateEditMemberData(memberId, element) {
    if (editOrganizationMembers[memberId]) {
        const field = element.name.replace('member_', '');
        editOrganizationMembers[memberId][field] = element.value;
        updateEditMembersJSON();
    }
}

function removeEditMember(memberId) {
    if (editOrganizationMembers[memberId]) {
        editOrganizationMembers.splice(memberId, 1);
        rebuildEditMembersTable();
        updateEditMemberCount();
        updateEditMembersJSON();
    }
}

function rebuildEditMembersTable() {
    const tbody = document.getElementById('editMembersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    editOrganizationMembers.forEach((member, index) => {
        member.id = index;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" class="form-input sm" name="member_first_name" value="${member.first_name || ''}" placeholder="First Name" oninput="updateEditMemberData(${index}, this)">
            </td>
            <td>
                <input type="text" class="form-input sm" name="member_last_name" value="${member.last_name || ''}" placeholder="Last Name" oninput="updateEditMemberData(${index}, this)">
            </td>
            <td>
                <select class="form-input sm" name="member_position" onchange="updateEditMemberData(${index}, this)">
                    <option value="">Select Position</option>
                    <!-- Alphabetically Sorted Positions A-Z -->
                    <option value="1st_year_board_director" ${member.position === '1st_year_board_director' ? 'selected' : ''}>1st Year Board of Director</option>
                    <option value="1st_year_board_member" ${member.position === '1st_year_board_member' ? 'selected' : ''}>1st Year Board Member</option>
                    <option value="2nd_year_board_director" ${member.position === '2nd_year_board_director' ? 'selected' : ''}>2nd Year Board of Director</option>
                    <option value="2nd_year_board_member" ${member.position === '2nd_year_board_member' ? 'selected' : ''}>2nd Year Board Member</option>
                    <option value="2nd_year_chairperson" ${member.position === '2nd_year_chairperson' ? 'selected' : ''}>2nd Year Chairperson</option>
                    <option value="2nd_year_senator" ${member.position === '2nd_year_senator' ? 'selected' : ''}>2nd Year Senator</option>
                    <option value="3rd_year_board_director" ${member.position === '3rd_year_board_director' ? 'selected' : ''}>3rd Year Board of Director</option>
                    <option value="3rd_year_board_member" ${member.position === '3rd_year_board_member' ? 'selected' : ''}>3rd Year Board Member</option>
                    <option value="3rd_year_chairperson" ${member.position === '3rd_year_chairperson' ? 'selected' : ''}>3rd Year Chairperson</option>
                    <option value="4th_year_board_director" ${member.position === '4th_year_board_director' ? 'selected' : ''}>4th Year Board of Director</option>
                    <option value="4th_year_board_member" ${member.position === '4th_year_board_member' ? 'selected' : ''}>4th Year Board Member</option>
                    <option value="4th_year_chairperson" ${member.position === '4th_year_chairperson' ? 'selected' : ''}>4th Year Chairperson</option>
                    <option value="4th_year_senator" ${member.position === '4th_year_senator' ? 'selected' : ''}>4th Year Senator</option>
                    <option value="admin_custodian" ${member.position === 'admin_custodian' ? 'selected' : ''}>Admin Custodian</option>
                    <option value="asst_business_manager" ${member.position === 'asst_business_manager' ? 'selected' : ''}>Assistant Business Manager</option>
                    <option value="asst_public_information_officer" ${member.position === 'asst_public_information_officer' ? 'selected' : ''}>Assistant Public Information Officer for all social media</option>
                    <option value="asst_public_relations_officer" ${member.position === 'asst_public_relations_officer' ? 'selected' : ''}>Assistant Public Relations Officer</option>
                    <option value="asst_secretary" ${member.position === 'asst_secretary' ? 'selected' : ''}>Asst. Secretary</option>
                    <option value="asst_treasurer" ${member.position === 'asst_treasurer' ? 'selected' : ''}>Asst. Treasurer</option>
                    <option value="assistant_coach" ${member.position === 'assistant_coach' ? 'selected' : ''}>Assistant Coach</option>
                    <option value="assistant_secretary" ${member.position === 'assistant_secretary' ? 'selected' : ''}>Assistant Secretary</option>
                    <option value="associate_editor_external" ${member.position === 'associate_editor_external' ? 'selected' : ''}>Associate Editor - External</option>
                    <option value="associate_editor_internal" ${member.position === 'associate_editor_internal' ? 'selected' : ''}>Associate Editor - Internal</option>
                    <option value="associate_secretary" ${member.position === 'associate_secretary' ? 'selected' : ''}>Associate Secretary</option>
                    <option value="auditor" ${member.position === 'auditor' ? 'selected' : ''}>Auditor</option>
                    <option value="batch_representative" ${member.position === 'batch_representative' ? 'selected' : ''}>Batch Representative</option>
                    <option value="board_director" ${member.position === 'board_director' ? 'selected' : ''}>Board of Directors</option>
                    <option value="bookkeeper" ${member.position === 'bookkeeper' ? 'selected' : ''}>Bookkeeper</option>
                    <option value="business_manager" ${member.position === 'business_manager' ? 'selected' : ''}>Business Manager</option>
                    <option value="cartoonist" ${member.position === 'cartoonist' ? 'selected' : ''}>Cartoonist</option>
                    <option value="chairman_board" ${member.position === 'chairman_board' ? 'selected' : ''}>Chairman of the Board</option>
                    <option value="chairperson" ${member.position === 'chairperson' ? 'selected' : ''}>Chairperson</option>
                    <option value="copy_editor" ${member.position === 'copy_editor' ? 'selected' : ''}>Copy Editor</option>
                    <option value="copy_editor_photojournalist" ${member.position === 'copy_editor_photojournalist' ? 'selected' : ''}>Copy Editor / Photojournalist</option>
                    <option value="corporate_society" ${member.position === 'corporate_society' ? 'selected' : ''}>Corporate Society</option>
                    <option value="creatives" ${member.position === 'creatives' ? 'selected' : ''}>Creatives</option>
                    <option value="creative_and_logistics" ${member.position === 'creative_and_logistics' ? 'selected' : ''}>Creative And Logistics</option>
                    <option value="deputy_director_external_affairs" ${member.position === 'deputy_director_external_affairs' ? 'selected' : ''}>Deputy Director of External Affairs</option>
                    <option value="deputy_director_internal_affairs" ${member.position === 'deputy_director_internal_affairs' ? 'selected' : ''}>Deputy Director of Internal Affairs</option>
                    <option value="deputy_director_multimedia_publications" ${member.position === 'deputy_director_multimedia_publications' ? 'selected' : ''}>Deputy Director of Multimedia Publications</option>
                    <option value="deputy_director_resource_assembly" ${member.position === 'deputy_director_resource_assembly' ? 'selected' : ''}>Deputy Director of Resource Assembly</option>
                    <option value="deputy_director_resource_management" ${member.position === 'deputy_director_resource_management' ? 'selected' : ''}>Deputy Director of Resource Management</option>
                    <option value="digital_media" ${member.position === 'digital_media' ? 'selected' : ''}>Digital Media</option>
                    <option value="director_external_affairs" ${member.position === 'director_external_affairs' ? 'selected' : ''}>Director of External Affairs</option>
                    <option value="director_internal_affairs" ${member.position === 'director_internal_affairs' ? 'selected' : ''}>Director of Internal Affairs</option>
                    <option value="director_multimedia_publications" ${member.position === 'director_multimedia_publications' ? 'selected' : ''}>Director of Multimedia Publications</option>
                    <option value="director_resource_assembly" ${member.position === 'director_resource_assembly' ? 'selected' : ''}>Director of Resource Assembly</option>
                    <option value="director_resource_management" ${member.position === 'director_resource_management' ? 'selected' : ''}>Director of Resource Management</option>
                    <option value="editor_in_chief" ${member.position === 'editor_in_chief' ? 'selected' : ''}>Editor-in-Chief</option>
                    <option value="editorial_manager" ${member.position === 'editorial_manager' ? 'selected' : ''}>Editorial Manager</option>
                    <option value="english_1st_year_rep" ${member.position === 'english_1st_year_rep' ? 'selected' : ''}>English 1st Year Representative</option>
                    <option value="english_2nd_year_rep" ${member.position === 'english_2nd_year_rep' ? 'selected' : ''}>English 2nd Year Representative</option>
                    <option value="english_3rd_year_rep" ${member.position === 'english_3rd_year_rep' ? 'selected' : ''}>English 3rd Year Representative</option>
                    <option value="english_4th_year_rep" ${member.position === 'english_4th_year_rep' ? 'selected' : ''}>English 4th Year Representative</option>
                    <option value="events_management" ${member.position === 'events_management' ? 'selected' : ''}>Events Management</option>
                    <option value="executive_board_secretary" ${member.position === 'executive_board_secretary' ? 'selected' : ''}>Executive Board Secretary</option>
                    <option value="executive_president" ${member.position === 'executive_president' ? 'selected' : ''}>Executive President</option>
                    <option value="executive_secretary" ${member.position === 'executive_secretary' ? 'selected' : ''}>Executive Secretary</option>
                    <option value="executive_vice_president" ${member.position === 'executive_vice_president' ? 'selected' : ''}>Executive Vice President</option>
                    <option value="executive_vice_president_external_affairs" ${member.position === 'executive_vice_president_external_affairs' ? 'selected' : ''}>Executive Vice President for External Affairs</option>
                    <option value="executive_vice_president_internal_affairs" ${member.position === 'executive_vice_president_internal_affairs' ? 'selected' : ''}>Executive Vice President for Internal Affairs</option>
                    <option value="external_vice_president" ${member.position === 'external_vice_president' ? 'selected' : ''}>External Vice President</option>
                    <option value="financial_director" ${member.position === 'financial_director' ? 'selected' : ''}>Financial Director</option>
                    <option value="gad_representative" ${member.position === 'gad_representative' ? 'selected' : ''}>GAD Representative</option>
                    <option value="gender_development_representative" ${member.position === 'gender_development_representative' ? 'selected' : ''}>Gender and Development Representative</option>
                    <option value="gourmet_committee" ${member.position === 'gourmet_committee' ? 'selected' : ''}>Gourmet Committee</option>
                    <option value="head_multimedia_committee" ${member.position === 'head_multimedia_committee' ? 'selected' : ''}>Head Multimedia Committee</option>
                    <option value="head_photojournalist" ${member.position === 'head_photojournalist' ? 'selected' : ''}>Head Photojournalist</option>
                    <option value="head_sentinel" ${member.position === 'head_sentinel' ? 'selected' : ''}>Head Sentinel</option>
                    <option value="head_stage_design" ${member.position === 'head_stage_design' ? 'selected' : ''}>Head of Stage and Design</option>
                    <option value="internal_vice_president" ${member.position === 'internal_vice_president' ? 'selected' : ''}>Internal Vice President</option>
                    <option value="layout_graphic_artist" ${member.position === 'layout_graphic_artist' ? 'selected' : ''}>Layout and Graphic Artist</option>
                    <option value="legislative_secretary" ${member.position === 'legislative_secretary' ? 'selected' : ''}>Legislative Secretary</option>
                    <option value="logistics" ${member.position === 'logistics' ? 'selected' : ''}>Logistics</option>
                    <option value="math_1st_year_rep" ${member.position === 'math_1st_year_rep' ? 'selected' : ''}>Math 1st Year Representative</option>
                    <option value="math_2nd_year_rep" ${member.position === 'math_2nd_year_rep' ? 'selected' : ''}>Math 2nd Year Representative</option>
                    <option value="math_3rd_year_rep" ${member.position === 'math_3rd_year_rep' ? 'selected' : ''}>Math 3rd Year Representative</option>
                    <option value="math_4th_year_rep" ${member.position === 'math_4th_year_rep' ? 'selected' : ''}>Math 4th Year Representative</option>
                    <option value="member" ${member.position === 'member' ? 'selected' : ''}>Member</option>
                    <option value="multimedia_committee" ${member.position === 'multimedia_committee' ? 'selected' : ''}>Multimedia Committee</option>
                    <option value="multimedia_manager" ${member.position === 'multimedia_manager' ? 'selected' : ''}>Multimedia Manager</option>
                    <option value="news_presenter" ${member.position === 'news_presenter' ? 'selected' : ''}>News Presenter</option>
                    <option value="page_communication_officer" ${member.position === 'page_communication_officer' ? 'selected' : ''}>Page Communication Officer</option>
                    <option value="photojournalist" ${member.position === 'photojournalist' ? 'selected' : ''}>Photojournalist</option>
                    <option value="pod" ${member.position === 'pod' ? 'selected' : ''}>POD</option>
                    <option value="president" ${member.position === 'president' ? 'selected' : ''}>President</option>
                    <option value="procurement_committee" ${member.position === 'procurement_committee' ? 'selected' : ''}>Procurement Committee</option>
                    <option value="property_custodian" ${member.position === 'property_custodian' ? 'selected' : ''}>Property Custodian</option>
                    <option value="pro" ${member.position === 'pro' ? 'selected' : ''}>PRO</option>
                    <option value="public_image_officer" ${member.position === 'public_image_officer' ? 'selected' : ''}>Public Image Officer</option>
                    <option value="public_information_officer" ${member.position === 'public_information_officer' ? 'selected' : ''}>Public Information Officer</option>
                    <option value="public_relations_officer" ${member.position === 'public_relations_officer' ? 'selected' : ''}>Public Relations Officer</option>
                    <option value="publication_officer" ${member.position === 'publication_officer' ? 'selected' : ''}>Publication Officer</option>
                    <option value="research_finance_committee" ${member.position === 'research_finance_committee' ? 'selected' : ''}>Research and Finance Committee</option>
                    <option value="secretariat" ${member.position === 'secretariat' ? 'selected' : ''}>Secretariat</option>
                    <option value="secretary" ${member.position === 'secretary' ? 'selected' : ''}>Secretary</option>
                    <option value="senate_president" ${member.position === 'senate_president' ? 'selected' : ''}>Senate President</option>
                    <option value="senator_academic_affairs" ${member.position === 'senator_academic_affairs' ? 'selected' : ''}>Senator for Academic Affairs</option>
                    <option value="senator_audit" ${member.position === 'senator_audit' ? 'selected' : ''}>Senator for Audit</option>
                    <option value="senator_constitutional_amendments" ${member.position === 'senator_constitutional_amendments' ? 'selected' : ''}>Senator for Constitutional and Amendments</option>
                    <option value="senator_creatives_publication" ${member.position === 'senator_creatives_publication' ? 'selected' : ''}>Senator for Creatives and Publication</option>
                    <option value="senator_finance_budgeting" ${member.position === 'senator_finance_budgeting' ? 'selected' : ''}>Senator for Finance and Budgeting</option>
                    <option value="senator_student_rights_welfare" ${member.position === 'senator_student_rights_welfare' ? 'selected' : ''}>Senator for Student Rights and Welfare</option>
                    <option value="senator_gender_development" ${member.position === 'senator_gender_development' ? 'selected' : ''}>Senator on Gender and Development</option>
                    <option value="senator_sports_youth_development" ${member.position === 'senator_sports_youth_development' ? 'selected' : ''}>Senator on Sports and Youth Development</option>
                    <option value="sentinel" ${member.position === 'sentinel' ? 'selected' : ''}>Sentinel</option>
                    <option value="social_media_support" ${member.position === 'social_media_support' ? 'selected' : ''}>Social Media Support</option>
                    <option value="stage_design_committee" ${member.position === 'stage_design_committee' ? 'selected' : ''}>Stage and Design Committee</option>
                    <option value="staff_administrative" ${member.position === 'staff_administrative' ? 'selected' : ''}>Staff on Administrative</option>
                    <option value="staff_creative_content_development" ${member.position === 'staff_creative_content_development' ? 'selected' : ''}>Staff on Creative Content Development</option>
                    <option value="staff_creative_media_development" ${member.position === 'staff_creative_media_development' ? 'selected' : ''}>Staff on Creative Media Development</option>
                    <option value="staff_internal_rights_welfare" ${member.position === 'staff_internal_rights_welfare' ? 'selected' : ''}>Staff on Internal Rights and Welfare</option>
                    <option value="staff_technical_operations_support" ${member.position === 'staff_technical_operations_support' ? 'selected' : ''}>Staff on Technical Operations and Support</option>
                    <option value="section_writer" ${member.position === 'section_writer' ? 'selected' : ''}>Section Writer</option>
                    <option value="team_coach" ${member.position === 'team_coach' ? 'selected' : ''}>Team Coach</option>
                    <option value="technical" ${member.position === 'technical' ? 'selected' : ''}>Technical</option>
                    <option value="technical_committee" ${member.position === 'technical_committee' ? 'selected' : ''}>Technical Committee</option>
                    <option value="technical_support" ${member.position === 'technical_support' ? 'selected' : ''}>Technical Support</option>
                    <option value="technical_support_committee" ${member.position === 'technical_support_committee' ? 'selected' : ''}>Technical and Support Committee</option>
                    <option value="treasurer" ${member.position === 'treasurer' ? 'selected' : ''}>Treasurer</option>
                    <option value="vice_chairperson" ${member.position === 'vice_chairperson' ? 'selected' : ''}>Vice Chairperson</option>
                    <option value="vice_president" ${member.position === 'vice_president' ? 'selected' : ''}>Vice President</option>
                    <option value="vice_president_external" ${member.position === 'vice_president_external' ? 'selected' : ''}>Vice President for External Affairs</option>
                    <option value="vice_president_internal" ${member.position === 'vice_president_internal' ? 'selected' : ''}>Vice President for Internal Affairs</option>
                    <option value="vice_president_external_administration" ${member.position === 'vice_president_external_administration' ? 'selected' : ''}>Vice President for External Administration</option>
                    <option value="vice_president_external_operation" ${member.position === 'vice_president_external_operation' ? 'selected' : ''}>Vice President for External Operation</option>
                    <option value="vice_president_internal_affairs" ${member.position === 'vice_president_internal_affairs' ? 'selected' : ''}>Vice President for Internal Affairs</option>
                </select>
            </td>
            <td>
                <input type="email" class="form-input sm" name="member_email" value="${member.email || ''}" placeholder="Email" oninput="updateEditMemberData(${index}, this)">
            </td>
            <td>
                <input type="text" class="form-input sm" name="member_student_id" value="${member.student_id || ''}" placeholder="Student ID" oninput="updateEditMemberData(${index}, this)">
            </td>
            <td>
                <button type="button" class="btn-icon btn-danger" onclick="removeEditMember(${index})">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateEditMemberCount() {
    const countEl = document.getElementById('editMemberCount');
    if (countEl) {
        countEl.textContent = `${editOrganizationMembers.length} members added`;

        const validationEl = document.getElementById('editMembersValidation');
        if (validationEl) {
            if (editOrganizationMembers.length >= 3) {
                validationEl.innerHTML = `
                    <div class="validation-message success">
                        <i class='bx bx-check-circle'></i>
                        <span>Minimum member requirement met (${editOrganizationMembers.length}/3)</span>
                    </div>
                `;
            } else {
                validationEl.innerHTML = `
                    <div class="validation-message warning">
                        <i class='bx bx-info-circle'></i>
                        <span>Minimum 3 members required. Currently ${editOrganizationMembers.length}/3 members.</span>
                    </div>
                `;
            }
        }
    }
}

function updateEditMembersJSON() {
    const jsonField = document.getElementById('edit_organization_members_json');
    if (jsonField) {
        jsonField.value = JSON.stringify(editOrganizationMembers);
    }
}

// Calculate validity period for edit
function calculateEditValidUntil() {
    const validFromInput = document.getElementById('edit_organization_valid_from');
    const validUntilInput = document.getElementById('edit_organization_valid_until');

    if (validFromInput && validUntilInput && validFromInput.value) {
        const validFrom = new Date(validFromInput.value);
        const validUntil = new Date(validFrom);
        validUntil.setFullYear(validUntil.getFullYear() + 1);
        validUntilInput.value = validUntil.toISOString().split('T')[0];
    }
}

// Toggle requirements for edit
function toggleEditOrganizationRequirements(orgType) {
    const studentRequirements = document.getElementById('editStudentOrgRequirements');
    if (!studentRequirements) return;

    if (orgType === 'student') {
        studentRequirements.style.display = 'block';
    } else {
        studentRequirements.style.display = 'none';
    }
}

// Handle file selection for edit
function handleEditFileSelection(input) {
    const file = input.files[0];
    const fileNameDisplay = document.getElementById(input.id + 'FileName');
    const uploadBox = input.closest('.file-upload-box');

    if (!fileNameDisplay || !uploadBox) {
        console.error('File name display or upload box not found for:', input.id);
        return;
    }

    if (file) {
        // Validate file size
        const maxSize = input.accept.includes('image') ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            const fileType = input.accept.includes('image') ? '5MB' : '10MB';
            showErrorToast(`File size too large. Maximum size is ${fileType}`);
            input.value = '';
            fileNameDisplay.textContent = 'No file selected';
            fileNameDisplay.style.color = '#64748b';
            fileNameDisplay.classList.remove('has-file');
            clearEditFileIndicator(input);
            uploadBox.style.borderColor = '#e2e8f0';
            uploadBox.style.backgroundColor = '';
            uploadBox.classList.remove('has-file');
            return;
        }

        // Show file name with success styling
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.style.color = '#059669';
        fileNameDisplay.style.fontWeight = '600';
        fileNameDisplay.classList.add('has-file');

        // Update upload box to show success state
        uploadBox.style.borderColor = '#10b981';
        uploadBox.style.backgroundColor = '#f0fdf4';
        uploadBox.classList.add('has-file');

        // Create file indicator
        createEditFileIndicator(input, file);

        console.log('File selected for edit:', file.name, 'for input:', input.id);
    } else {
        fileNameDisplay.textContent = 'No file selected';
        fileNameDisplay.style.color = '#64748b';
        fileNameDisplay.style.fontWeight = 'normal';
        fileNameDisplay.classList.remove('has-file');
        clearEditFileIndicator(input);
        uploadBox.style.borderColor = '#e2e8f0';
        uploadBox.style.backgroundColor = '';
        uploadBox.classList.remove('has-file');
    }
}

// Create file indicator for edit
function createEditFileIndicator(input, file) {
    clearEditFileIndicator(input);

    const indicatorContainer = document.createElement('div');
    indicatorContainer.className = 'file-indicator';

    // File info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-indicator-content';

    // File icon
    const fileIcon = document.createElement('div');
    if (file.type.startsWith('image/')) {
        fileIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `;
    } else {
        fileIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        `;
    }

    // File details
    const fileDetails = document.createElement('div');
    fileDetails.className = 'file-indicator-details';

    const fileName = document.createElement('div');
    fileName.className = 'file-indicator-name';
    fileName.textContent = file.name;

    const fileSize = document.createElement('div');
    fileSize.className = 'file-indicator-size';
    fileSize.textContent = formatFileSize(file.size);

    fileDetails.appendChild(fileName);
    fileDetails.appendChild(fileSize);

    fileInfo.appendChild(fileIcon);
    fileInfo.appendChild(fileDetails);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'file-indicator-remove';
    removeBtn.innerHTML = '<i class="bx bx-x"></i>';
    removeBtn.title = 'Remove file';
    removeBtn.onclick = function() {
        input.value = '';
        const fileNameDisplay = document.getElementById(input.id + 'FileName');
        const uploadBox = input.closest('.file-upload-box');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = 'No file selected';
            fileNameDisplay.style.color = '#64748b';
            fileNameDisplay.style.fontWeight = 'normal';
            fileNameDisplay.classList.remove('has-file');
        }
        if (uploadBox) {
            uploadBox.style.borderColor = '#e2e8f0';
            uploadBox.style.backgroundColor = '';
            uploadBox.classList.remove('has-file');
        }
        clearEditFileIndicator(input);
    };

    indicatorContainer.appendChild(fileInfo);
    indicatorContainer.appendChild(removeBtn);

    // Add indicator to file info container
    const fileInfoContainer = input.closest('.file-upload-container').querySelector('.file-info');
    if (fileInfoContainer) {
        fileInfoContainer.appendChild(indicatorContainer);
    }
}

// Clear file indicator for edit
function clearEditFileIndicator(input) {
    const fileInfo = input.closest('.file-upload-container');
    if (fileInfo) {
        const existingIndicator = fileInfo.querySelector('.file-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
}

// Show edit modal
function showEditOrganizationModal() {
    const modal = document.getElementById('organizationEditModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialize form submission
        initializeEditFormSubmission();
    }
}

// Close edit modal
function closeOrganizationEditModal() {
    const modal = document.getElementById('organizationEditModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetEditOrganizationForm();
    }
}

// Reset edit form
function resetEditOrganizationForm() {
    const form = document.getElementById('organizationEditForm');
    if (!form) return;

    // Reset the form
    form.reset();

    // Reset username and email placeholders
    document.getElementById('edit_username').placeholder = 'Leave blank to keep current username';
    document.getElementById('edit_email').placeholder = 'Leave blank to keep current email address';

    // Clear file inputs manually
    const fileInputs = form.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.value = '';
    });

    // Clear file indicators
    const fileIndicators = form.querySelectorAll('.file-indicator');
    fileIndicators.forEach(indicator => {
        indicator.remove();
    });

    // Reset file name displays
    const fileNames = form.querySelectorAll('[id$="FileName"]');
    fileNames.forEach(el => {
        el.textContent = 'No file selected';
        el.style.color = '#64748b';
        el.classList.remove('has-file');
    });

    // Reset upload box styles
    const uploadBoxes = form.querySelectorAll('.file-upload-box');
    uploadBoxes.forEach(box => {
        box.style.borderColor = '#e2e8f0';
        box.style.backgroundColor = '';
        box.classList.remove('has-file');
    });

    // Reset members
    editOrganizationMembers = [];
    const membersTableBody = document.getElementById('editMembersTableBody');
    if (membersTableBody) {
        membersTableBody.innerHTML = '';
    }
    updateEditMemberCount();
    updateEditMembersJSON();

    // Hide student requirements
    const studentReqs = document.getElementById('editStudentOrgRequirements');
    if (studentReqs) {
        studentReqs.style.display = 'none';
    }

    // Clear current files
    const currentFilesGrid = document.getElementById('editCurrentFilesGrid');
    if (currentFilesGrid) {
        currentFilesGrid.innerHTML = '';
    }

    // Clear form response
    const formResponse = document.getElementById('organizationEditFormResponse');
    if (formResponse) {
        formResponse.innerHTML = '';
    }

    // Clear any field error messages
    document.querySelectorAll('.field-error-message').forEach(el => el.remove());
    document.querySelectorAll('.form-input').forEach(input => {
        input.style.borderColor = '';
    });

    // Clear hidden remove inputs
    const removeInputs = form.querySelectorAll('input[name^="remove_"]');
    removeInputs.forEach(input => {
        input.remove();
    });

    currentOrganizationData = null;
}

// Initialize edit form submission
function initializeEditFormSubmission() {
    const form = document.getElementById('organizationEditForm');
    if (!form) return;

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const formResponse = document.getElementById('organizationEditFormResponse');

        submitBtn.classList.add('is-loading');
        formResponse.innerHTML = '';

        // Update members JSON
        updateEditMembersJSON();

        // Debug: Check members data
        console.log('DEBUG: Current members:', editOrganizationMembers);
        console.log('DEBUG: Members JSON:', document.getElementById('edit_organization_members_json').value);

        // Client-side validation
        const formData = new FormData(form);

        // Debug: Log all form data
        console.log('DEBUG: Form data before submission:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
        }

        const validationErrors = validateEditOrganizationForm(formData);

        if (Object.keys(validationErrors).length > 0) {
            // Display validation errors
            let errorHtml = '<div class="response-message response-error"><i class="bx bx-error-circle"></i><strong>Please fix the following errors:</strong><ul>';
            for (const [field, error] of Object.entries(validationErrors)) {
                errorHtml += `<li>${error}</li>`;
            }
            errorHtml += '</ul></div>';

            formResponse.innerHTML = errorHtml;
            submitBtn.classList.remove('is-loading');
            return;
        }

        // Clear any previous error highlights
        const allInputs = form.querySelectorAll('.form-input');
        allInputs.forEach(input => {
            input.style.borderColor = '';
        });

        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            console.log('Response status:', response.status);

            if (!response.ok) {
                // If it's a 400 error, try to parse the JSON error response
                if (response.status === 400) {
                    return response.json().then(errorData => {
                        // Add status to error data so we can identify it
                        errorData._status = response.status;
                        throw errorData;
                    });
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        })
        .then(data => {
            console.log('DEBUG: Server response:', data);
            if (data.success) {
                showSuccessToast(data.message);
                formResponse.innerHTML = `
                    <div class="response-message response-success">
                        <i class='bx bx-check-circle'></i>
                        ${data.message}
                    </div>
                `;
                setTimeout(() => {
                    closeOrganizationEditModal();
                    window.location.reload();
                }, 2000);
            } else {
                showErrorToast(data.message || 'An error occurred');
                displayEditFormErrors(data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            console.error('Error type:', typeof error);
            console.error('Error data:', error);

            if (error._status === 400) {
                // This is our structured error response from Django
                displayEditFormErrors(error);
            } else if (error.message) {
                // This is a generic error
                formResponse.innerHTML = `
                    <div class="response-message response-error">
                        <i class='bx bx-error-circle'></i>
                        An error occurred while updating the organization: ${error.message}
                    </div>
                `;
            } else {
                // Fallback for any other error type
                formResponse.innerHTML = `
                    <div class="response-message response-error">
                        <i class='bx bx-error-circle'></i>
                        An unexpected error occurred. Please try again.
                    </div>
                `;
            }
        })
        .finally(() => {
            submitBtn.classList.remove('is-loading');
        });
    });

    // Function to display form errors in a user-friendly way
    function displayEditFormErrors(errorData) {
        const formResponse = document.getElementById('organizationEditFormResponse');

        console.log('Displaying edit form errors:', errorData);

        // Clear any previous field-specific errors
        document.querySelectorAll('.field-error-message').forEach(el => el.remove());
        document.querySelectorAll('.form-input').forEach(input => {
            input.style.borderColor = '';
        });

        let errorHtml = '<div class="response-message response-error">';
        errorHtml += '<i class="bx bx-error-circle"></i>';

        if (errorData.message) {
            errorHtml += `<strong>${errorData.message}</strong>`;
        } else {
            errorHtml += '<strong>Please fix the following errors:</strong>';
        }

        if (errorData.errors) {
            errorHtml += '<ul>';

            // Process Django form errors structure
            for (const [field, errors] of Object.entries(errorData.errors)) {
                console.log(`Processing field ${field}:`, errors);

                // Handle different error structures
                if (Array.isArray(errors)) {
                    errors.forEach(errorObj => {
                        const errorMessage = errorObj.message || errorObj;
                        errorHtml += `<li>${errorMessage}</li>`;

                        // Map field names to actual input fields
                        highlightEditFieldError(field, errorMessage);
                    });
                } else if (typeof errors === 'string') {
                    errorHtml += `<li>${errors}</li>`;
                    highlightEditFieldError(field, errors);
                } else if (errors && typeof errors === 'object') {
                    // Handle nested error objects
                    Object.values(errors).forEach(nestedError => {
                        const errorMessage = nestedError.message || nestedError;
                        if (Array.isArray(errorMessage)) {
                            errorMessage.forEach(msg => {
                                errorHtml += `<li>${msg}</li>`;
                                highlightEditFieldError(field, msg);
                            });
                        } else {
                            errorHtml += `<li>${errorMessage}</li>`;
                            highlightEditFieldError(field, errorMessage);
                        }
                    });
                }
            }

            errorHtml += '</ul>';
        } else if (errorData.message) {
            // Single error message
            errorHtml += `<p>${errorData.message}</p>`;
        }

        errorHtml += '</div>';
        formResponse.innerHTML = errorHtml;

        // Scroll to the response area
        formResponse.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Helper function to highlight specific field errors
    function highlightEditFieldError(fieldName, errorMessage) {
        let inputField;

        // Map Django field names to actual input IDs
        switch(fieldName) {
            case 'username':
                inputField = document.getElementById('edit_username');
                break;
            case 'email':
                inputField = document.getElementById('edit_email');
                break;
            case 'organization_name':
                inputField = document.getElementById('edit_organization_name');
                break;
            case 'organization_acronym':
                inputField = document.getElementById('edit_organization_acronym');
                break;
            case 'organization_email':
                inputField = document.getElementById('edit_organization_email');
                break;
            default:
                // Try to find by name
                inputField = document.querySelector(`[name="${fieldName}"]`);
        }

        if (inputField) {
            inputField.style.borderColor = '#dc2626';

            // Add error message near the field
            const fieldGroup = inputField.closest('.form-group');
            if (fieldGroup) {
                // Remove existing error
                const existingError = fieldGroup.querySelector('.field-error-message');
                if (existingError) existingError.remove();

                // Add new error
                const errorElement = document.createElement('div');
                errorElement.className = 'field-error-message';
                errorElement.style.color = '#dc2626';
                errorElement.style.fontSize = '0.875rem';
                errorElement.style.marginTop = '0.25rem';
                errorElement.style.display = 'flex';
                errorElement.style.alignItems = 'center';
                errorElement.style.gap = '0.5rem';
                errorElement.innerHTML = `<i class="bx bx-error-circle"></i> ${errorMessage}`;
                fieldGroup.appendChild(errorElement);
            }
        }
    }
}

// Validate edit organization form
function validateEditOrganizationForm(formData) {
    const errors = {};

    // Username validation
    const username = formData.get('username');
    if (username && username.trim().length < 3) {
        errors.username = "Username must be at least 3 characters long if provided.";
    }

    // Email validation
    const email = formData.get('email');
    if (email && !isValidEmail(email)) {
        errors.email = "Please enter a valid email address.";
    }

    // Organization name validation
    const orgName = formData.get('organization_name');
    if (!orgName || orgName.trim().length < 2) {
        errors.organization_name = "Organization name is required and must be at least 2 characters long.";
    }

    // Organization acronym validation
    const orgAcronym = formData.get('organization_acronym');
    if (!orgAcronym || orgAcronym.trim().length < 2) {
        errors.organization_acronym = "Organization acronym is required and must be at least 2 characters long.";
    }

    const orgEmail = formData.get('organization_email');
    if (!orgEmail || !isValidEmail(orgEmail)) {
        errors.organization_email = "Please enter a valid organization email address.";
    }

    // Password validation (only if provided)
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');

    if (password && password.length < 8) {
        errors.password = "Password must be at least 8 characters long.";
    }

    if (password && password !== confirmPassword) {
        errors.confirm_password = "Passwords do not match.";
    }

    // Adviser name validation
    const adviserName = formData.get('organization_adviser_name');
    if (!adviserName) {
        errors.organization_adviser_name = "Adviser name is required.";
    }

    // Adviser phone validation
    const adviserPhone = formData.get('organization_adviser_phone');
    if (!adviserPhone) {
        errors.organization_adviser_phone = "Adviser phone number is required.";
    }

    // Member validation - using the actual members array
    console.log('DEBUG: Current editOrganizationMembers:', editOrganizationMembers);

    // ONLY KEEP THE 3 MEMBERS MINIMUM VALIDATION
    if (editOrganizationMembers.length < 3) {
        errors.organization_members = "Organization must have at least 3 members.";
    } else {
        // Validate individual members
        editOrganizationMembers.forEach((member, index) => {
            const firstName = member.first_name || '';
            const lastName = member.last_name || '';

            if (!firstName.trim()) {
                errors[`member_${index}_first_name`] = `Member ${index + 1}: First name is required.`;
            }

            if (!lastName.trim()) {
                errors[`member_${index}_last_name`] = `Member ${index + 1}: Last name is required.`;
            }

            if (!member.position) {
                errors[`member_${index}_position`] = `Member ${index + 1}: Position is required.`;
            }
        });
    }

    // Date validation
    const validFrom = formData.get('organization_valid_from');
    const validUntil = formData.get('organization_valid_until');

    if (!validFrom) {
        errors.organization_valid_from = "Valid from date is required.";
    }

    if (!validUntil) {
        errors.organization_valid_until = "Valid until date is required.";
    }

    return errors;
}

// Loading state for edit modal
function showEditOrganizationLoadingState(show) {
    const modal = document.getElementById('organizationEditModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#editOrganizationModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'editOrganizationModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading organization details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#editOrganizationModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

// Response handlers for edit
function handleEditOrganizationResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleEditOrganizationError(error) {
    console.error('Error loading organization details for editing:', error);
    showErrorToast(error.message || 'Failed to load organization details for editing');
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.openEditOrganizationModal = openEditOrganizationModal;
window.closeOrganizationEditModal = closeOrganizationEditModal;
window.addEditMemberRow = addEditMemberRow;
window.updateEditMemberData = updateEditMemberData;
window.removeEditMember = removeEditMember;
window.calculateEditValidUntil = calculateEditValidUntil;
window.toggleEditOrganizationRequirements = toggleEditOrganizationRequirements;
window.handleEditFileSelection = handleEditFileSelection;

// --------------------------------------------- Organization Archive Functions ------------------------------------------
function openArchiveOrganizationModal(organizationId, organizationName = null) {
    console.log('DEBUG: Opening archive organization modal for ID:', organizationId);
    showOrganizationArchiveLoadingState(true);

    // If organization name is provided, use it for immediate display
    if (organizationName) {
        document.getElementById('organizationArchiveDescription').textContent =
            `Are you sure you want to cancel "${organizationName}"?`;
        document.getElementById('archiveOrganizationName').textContent = organizationName;
    }

    // Use the existing view endpoint to get organization data
    fetch(`/organizations/${organizationId}/view/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleOrganizationArchiveResponse)
    .then(data => {
        console.log('DEBUG: Received organization data for archive:', data);
        if (data.success) {
            populateOrganizationArchiveModal(data.organization);
            showOrganizationArchiveModal();
        } else {
            throw new Error(data.error || 'Failed to load organization details for cancellation');
        }
    })
    .catch(handleOrganizationArchiveError)
    .finally(() => {
        showOrganizationArchiveLoadingState(false);
    });
}

function populateOrganizationArchiveModal(organization) {
    // Set organization ID
    document.getElementById('archiveOrganizationId').value = organization.id;

    // Update modal description
    const description = document.getElementById('organizationArchiveDescription');
    description.textContent = `Are you sure you want to cancel "${organization.organization_name}"?`;

    // Populate organization preview
    document.getElementById('archiveOrganizationName').textContent = organization.organization_name || '-';
    document.getElementById('archiveOrganizationAcronym').textContent = organization.organization_acronym || '-';
    document.getElementById('archiveOrganizationEmail').textContent = organization.organization_email || '-';
    document.getElementById('archiveOrganizationAdviser').textContent = organization.organization_adviser_name || '-';
    document.getElementById('archiveOrganizationMembers').textContent = `${organization.organization_member_count || 0} members`;
    document.getElementById('archiveOrganizationValidUntil').textContent = formatDate(organization.organization_valid_until) || '-';

    // Show current status
    const currentStatus = organization.organization_status_display || organization.organization_status || '-';
    document.getElementById('archiveCurrentStatus').textContent = currentStatus;
    document.getElementById('currentStatusDisplay').textContent = currentStatus;

    // Set organization logo
    const logoElement = document.getElementById('archiveOrganizationLogo');
    if (organization.organization_logo_url) {
        logoElement.innerHTML = `<img src="${organization.organization_logo_url}" alt="${organization.organization_name}" class="organization-logo-preview-img">`;
        logoElement.classList.remove('logo-placeholder');
    } else {
        logoElement.innerHTML = `<i class='bx bxs-group'></i>`;
        logoElement.classList.add('logo-placeholder');
    }

    // Set type badge
    const typeElement = document.getElementById('archiveOrganizationType');
    typeElement.textContent = organization.organization_type_display || organization.organization_type || '-';
    typeElement.className = 'type-badge';
    typeElement.classList.add(`type-${organization.organization_type}`);

    // Set status badge
    const statusElement = document.getElementById('archiveOrganizationStatus');
    const status = organization.organization_status || 'active';
    statusElement.textContent = organization.organization_status_display || status || '-';
    statusElement.className = 'status-badge';
    statusElement.classList.add(`status-${status}`);

    // Clear previous reason
    document.getElementById('archiveReason').value = '';

    // Set form action
    const form = document.getElementById('organizationArchiveForm');
    form.action = `/organizations/${organization.id}/archive/`;
}

function showOrganizationArchiveModal() {
    const modal = document.getElementById('organizationArchiveModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeOrganizationArchiveModal() {
    const modal = document.getElementById('organizationArchiveModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Clear form response and reason field
        const formResponse = document.getElementById('organizationArchiveFormResponse');
        if (formResponse) {
            formResponse.innerHTML = '';
        }
        document.getElementById('archiveReason').value = '';
    }
}

function showOrganizationArchiveLoadingState(show) {
    const modal = document.getElementById('organizationArchiveModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#organizationArchiveModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'organizationArchiveModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading organization details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#organizationArchiveModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleOrganizationArchiveResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleOrganizationArchiveError(error) {
    console.error('Error loading organization details for cancellation:', error);
    showErrorToast(error.message || 'Failed to load organization details for cancellation');
}

// Handle archive form submission
document.addEventListener('DOMContentLoaded', function() {
    const archiveForm = document.getElementById('organizationArchiveForm');
    if (archiveForm) {
        archiveForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const form = this;
            const organizationId = document.getElementById('archiveOrganizationId').value;
            const organizationName = document.getElementById('archiveOrganizationName').textContent;
            const archiveReason = document.getElementById('archiveReason').value.trim();
            const submitBtn = form.querySelector('button[type="submit"]');
            const formResponse = document.getElementById('organizationArchiveFormResponse');

            // Validate reason
            if (!archiveReason) {
                showErrorToast('Please provide a cancellation reason.');
                document.getElementById('archiveReason').focus();
                return;
            }

            submitBtn.classList.add('is-loading');
            formResponse.innerHTML = '';

            const formData = new FormData(form);
            formData.append('archive_reason', archiveReason);

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
                    return response.json().then(err => {
                        throw {
                            userFriendly: true,
                            message: err.error || 'Failed to cancel organization'
                        };
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showSuccessToast(data.message || `"${organizationName}" has been cancelled successfully!`);
                    formResponse.innerHTML = `
                        <div class="response-message response-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            ${data.message || 'Organization cancelled successfully! This window will close shortly...'}
                        </div>
                    `;

                    setTimeout(() => {
                        closeOrganizationArchiveModal();
                        // Reload the page to reflect changes
                        window.location.reload();
                    }, 1500);
                } else {
                    showErrorToast(data.error || `Failed to cancel "${organizationName}"`);
                    showOrganizationArchiveError(data.error || 'Failed to cancel organization');
                }
            })
            .catch(error => {
                console.error('Error cancelling organization:', error);
                const errorMessage = error.userFriendly ?
                    error.message :
                    'An unexpected error occurred while processing your request.';
                showErrorToast(errorMessage);
                showOrganizationArchiveError(errorMessage);
            })
            .finally(() => {
                submitBtn.classList.remove('is-loading');
            });
        });
    }
});

function showOrganizationArchiveError(message) {
    const formResponse = document.getElementById('organizationArchiveFormResponse');
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
window.openArchiveOrganizationModal = openArchiveOrganizationModal;
window.closeOrganizationArchiveModal = closeOrganizationArchiveModal;

// --------------------------------------- Reactive Organization Function -----------------------------------------------
function openReactivateOrganizationModal(organizationId, organizationName = null) {
    console.log('DEBUG: Opening reactivate organization modal for ID:', organizationId);
    showOrganizationReactivateLoadingState(true);

    if (organizationName) {
        document.getElementById('reactivateConfirmationText').innerHTML =
            `Are you sure you want to reactivate <strong>"${organizationName}"</strong>?`;
        document.getElementById('reactivateOrganizationName').textContent = organizationName;
    }

    // Use the existing view endpoint to get organization data
    fetch(`/organizations/${organizationId}/view/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleOrganizationReactivateResponse)
    .then(data => {
        console.log('DEBUG: Received organization data for reactivation:', data);
        if (data.success) {
            populateOrganizationReactivateModal(data.organization);
            showOrganizationReactivateModal();
        } else {
            throw new Error(data.error || 'Failed to load organization details for reactivation');
        }
    })
    .catch(handleOrganizationReactivateError)
    .finally(() => {
        showOrganizationReactivateLoadingState(false);
    });
}

function populateOrganizationReactivateModal(organization) {
    // Set organization ID
    document.getElementById('reactivateOrganizationId').value = organization.id;

    // Update organization info
    document.getElementById('reactivateOrganizationName').textContent = organization.organization_name || '-';
    document.getElementById('reactivateOrganizationAcronym').textContent = organization.organization_acronym || '-';

    // Update confirmation text
    const confirmationText = document.getElementById('reactivateConfirmationText');
    confirmationText.innerHTML =
        `Are you sure you want to reactivate <strong>"${organization.organization_name}"</strong>?`;

    // Set organization logo
    const logoElement = document.getElementById('reactivateOrganizationLogo');
    if (organization.organization_logo_url) {
        logoElement.innerHTML = `<img src="${organization.organization_logo_url}" alt="${organization.organization_name}">`;
    } else {
        logoElement.innerHTML = `<i class='bx bxs-group'></i>`;
    }

    // Set form action
    const form = document.getElementById('organizationReactivateForm');
    form.action = `/organizations/${organization.id}/reactivate/`;
}

function showOrganizationReactivateModal() {
    const modal = document.getElementById('organizationReactivateModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        initializeReactivateFormSubmission();
    }
}

function closeOrganizationReactivateModal() {
    const modal = document.getElementById('organizationReactivateModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        const formResponse = document.getElementById('organizationReactivateFormResponse');
        if (formResponse) {
            formResponse.innerHTML = '';
        }
    }
}

function showOrganizationReactivateLoadingState(show) {
    const modal = document.getElementById('organizationReactivateModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#organizationReactivateModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'organizationReactivateModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading organization details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#organizationReactivateModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

function handleOrganizationReactivateResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleOrganizationReactivateError(error) {
    console.error('Error loading organization details for reactivation:', error);
    showErrorToast(error.message || 'Failed to load organization details for reactivation');
}

function initializeReactivateFormSubmission() {
    const form = document.getElementById('organizationReactivateForm');
    if (!form) return;

    // Remove any existing event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    document.getElementById('organizationReactivateForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const form = this;
        const organizationId = document.getElementById('reactivateOrganizationId').value;
        const organizationName = document.getElementById('reactivateOrganizationName').textContent;
        const submitBtn = form.querySelector('button[type="submit"]');
        const formResponse = document.getElementById('organizationReactivateFormResponse');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Reactivating...';
        formResponse.innerHTML = '';

        const formData = new FormData(form);

        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw {
                        userFriendly: true,
                        message: err.error || 'Failed to reactivate organization'
                    };
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showSuccessToast(data.message || `"${organizationName}" has been reactivated successfully!`);
                formResponse.innerHTML = `
                    <div class="response-message response-success">
                        ${data.message || 'Organization reactivated successfully!'}
                    </div>
                `;

                setTimeout(() => {
                    closeOrganizationReactivateModal();
                    window.location.reload();
                }, 1500);
            } else {
                showErrorToast(data.error || `Failed to reactivate "${organizationName}"`);
                formResponse.innerHTML = `
                    <div class="response-message response-error">
                        ${data.error || 'Failed to reactivate organization'}
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error reactivating organization:', error);
            const errorMessage = error.userFriendly ?
                error.message :
                'An unexpected error occurred while processing your request.';
            showErrorToast(errorMessage);
            formResponse.innerHTML = `
                <div class="response-message response-error">
                    ${errorMessage}
                </div>
            `;
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reactivate Organization';
        });
    });
}

// Make functions globally available
window.openReactivateOrganizationModal = openReactivateOrganizationModal;
window.closeOrganizationReactivateModal = closeOrganizationReactivateModal;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeOrganizationFilters();
    console.log('Organization filters initialized');
});

// Make functions globally available
window.openRenewOrganizationModal = openRenewOrganizationModal;
window.closeOrganizationRenewModal = closeOrganizationRenewModal;
window.calculateRenewValidUntil = calculateRenewValidUntil;
window.handleRenewFileSelection = handleRenewFileSelection;
window.toggleRenewOrganizationRequirements = toggleRenewOrganizationRequirements;