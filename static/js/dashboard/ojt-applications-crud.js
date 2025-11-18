// -------------------------------------- OJT Applications Table Function ----------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing OJT application events');
    initializeOJTApplicationEvents();

    const approveForm = document.getElementById('approveOJTApplicationForm');
    if (approveForm) {
        console.log('Found approve form, adding event listener');
        approveForm.addEventListener('submit', handleOJTApproveFormSubmit);
    }
});

function loadOJTApplicationsPage(page, search = '', statusFilter = '', companyFilter = '') {
    const tbody = document.getElementById('ojt-applications-tbody');
    const paginationContainer = document.getElementById('ojt-application-pagination-container');

    // Show loading state
    tbody.innerHTML = `
        <tr id="loading-row">
            <td colspan="8" style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                Loading OJT applications...
            </td>
        </tr>
    `;

    // Build query parameters
    const params = new URLSearchParams({
        'get_filtered_ojt_applications': '1',
        'page': page,
        'search': search,
        'status': statusFilter,
        'company': companyFilter
    });

    console.log('Fetching OJT applications with params:', params.toString());

    fetch(`?${params.toString()}`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received OJT applications data:', data);
        updateOJTApplicationsTable(data);
        updateOJTApplicationsPagination(data.pagination, page, search, statusFilter, companyFilter);
    })
    .catch(error => {
        console.error('Error loading OJT applications:', error);
        tbody.innerHTML = `
            <tr id="error-row">
                <td colspan="8" style="text-align: center; padding: 20px; color: red; font-weight: 500;">
                    Error loading data: ${error.message}
                </td>
            </tr>
        `;
    });
}

// Fix the event initialization to handle empty values properly
function initializeOJTApplicationEvents() {
    console.log('Initializing OJT application events');

    // Initialize search and filter events
    const searchInput = document.getElementById('ojt-application-search');
    const statusFilter = document.getElementById('status-filter');
    const companyFilter = document.getElementById('company-filter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            console.log('Search triggered:', this.value);
            loadOJTApplicationsPage(1, this.value,
                statusFilter ? statusFilter.value : '',
                companyFilter ? companyFilter.value : ''
            );
        }, 500));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            console.log('Status filter changed:', this.value);
            loadOJTApplicationsPage(1,
                searchInput ? searchInput.value : '',
                this.value,
                companyFilter ? companyFilter.value : ''
            );
        });
    }

    if (companyFilter) {
        companyFilter.addEventListener('change', function() {
            console.log('Company filter changed:', this.value);
            loadOJTApplicationsPage(1,
                searchInput ? searchInput.value : '',
                statusFilter ? statusFilter.value : '',
                this.value
            );
        });
    }

    console.log('OJT application events initialized');
}

// Update the OJT applications table with new data
function updateOJTApplicationsTable(data) {
    const tbody = document.getElementById('ojt-applications-tbody');
    console.log('Updating table with data:', data);

    if (!data.ojt_applications || data.ojt_applications.length === 0) {
        const colSpan = document.querySelector('#ojt-applications-table thead tr').cells.length;
        tbody.innerHTML = `
            <tr id="no-data-row">
                <td colspan="${colSpan}" style="text-align: center; padding: 20px; font-style: italic; color: #888;">
                    No OJT applications found matching your criteria
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    const isAdmin = document.querySelector('#ojt-applications-table th:nth-child(2)').textContent.trim() === 'Student Name';
    console.log('Is admin view:', isAdmin);

    data.ojt_applications.forEach(application => {
        console.log('Processing application:', application);

        // Format dates safely
        const startDate = application.proposed_start_date ? formatDate(application.proposed_start_date) : '-';
        const endDate = application.proposed_end_date ? formatDate(application.proposed_end_date) : '-';

        html += `
            <tr>
                <td>${application.id}</td>
                ${isAdmin ? `
                <td>
                    <div class="student-info">
                        <strong>${escapeHtml(application.student_name || 'N/A')}</strong>
                        <small>ID: ${escapeHtml(application.student_id || 'N/A')}</small>
                    </div>
                </td>
                ` : ''}
                <td>
                    <div class="course-info">
                        <strong>${escapeHtml(application.student_course || 'N/A')}</strong>
                        <small>Section ${escapeHtml(application.student_section || 'N/A')}</small>
                    </div>
                </td>
                <td>
                    <div class="company-info">
                        <strong>${escapeHtml(application.company_name || 'N/A')}</strong>
                        ${application.company_has_slots ?
                            '<small class="active-badge">Slots Available</small>' :
                            '<small class="inactive-badge">Full</small>'
                        }
                    </div>
                </td>
                <td>
                    <div class="duration-info">
                        <strong>${application.duration_days || 0} days</strong>
                        <small>${startDate} - ${endDate}</small>
                    </div>
                </td>
                <td>
                    <div class="requirements-info">
                        <span class="requirements-count">${application.requirements_submitted || 0}/${application.total_requirements || 0}</span>
                        ${application.requirements_complete ?
                            '<i class="bx bx-check requirements-check" title="All requirements submitted"></i>' :
                            '<i class="bx bx-x requirements-missing" title="Requirements incomplete"></i>'
                        }
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${application.status || 'pending'}">${application.status_display || 'Pending'}</span>
                </td>
                <td class="action-buttons">
                    <button class="btn-action view-btn" onclick="openOJTApplicationViewModal(${application.id})" title="View Details">
                        <i class="bx bx-show"></i>
                    </button>

                    ${application.can_edit ? `
                    <button class="btn-action edit-btn" onclick="openOJTApplicationEditModal(${application.id})" title="Edit">
                        <i class="bx bx-edit"></i>
                    </button>
                    ` : ''}

                    ${application.can_archive ? `
                    <button class="btn-action archive-btn" onclick="openOJTApplicationArchiveModal(${application.id})" title="Archive">
                        <i class="bx bx-archive"></i>
                    </button>
                    ` : ''}

                    ${application.can_approve ? `
                    <button class="btn-action approve-btn" onclick="openOJTApplicationApproveModal(${application.id})" title="Review">
                        <i class="bx bx-check"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    console.log('Table updated successfully');
}

// Update pagination controls
function updateOJTApplicationsPagination(pagination, currentPage, search = '', statusFilter = '', companyFilter = '') {
    const container = document.getElementById('ojt-application-pagination-container');
    console.log('Updating pagination:', pagination);

    if (!pagination || pagination.num_pages <= 1) {
        container.innerHTML = `
            <div class="pagination-info">
                Showing ${pagination ? pagination.count : 0} entries
            </div>
        `;
        return;
    }

    let paginationHTML = `
        <div class="pagination-info">
            Showing ${pagination.start_index} to ${pagination.end_index} of ${pagination.count} entries
        </div>
        <div class="pagination-controls">
    `;

    // Previous button
    if (pagination.has_previous) {
        paginationHTML += `
            <button class="pagination-btn" onclick="loadOJTApplicationsPage(${currentPage - 1}, '${search}', '${statusFilter}', '${companyFilter}')">
                <i class="bx bx-chevron-left"></i> Previous
            </button>
        `;
    }

    // Page numbers
    for (let i = 1; i <= pagination.num_pages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else {
            paginationHTML += `
                <button class="pagination-btn" onclick="loadOJTApplicationsPage(${i}, '${search}', '${statusFilter}', '${companyFilter}')">${i}</button>
            `;
        }
    }

    // Next button
    if (pagination.has_next) {
        paginationHTML += `
            <button class="pagination-btn" onclick="loadOJTApplicationsPage(${currentPage + 1}, '${search}', '${statusFilter}', '${companyFilter}')">
                Next <i class="bx bx-chevron-right"></i>
            </button>
        `;
    }

    paginationHTML += `</div>`;
    container.innerHTML = paginationHTML;
}

// Debounce function for search
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

// Helper function to get CSRF token
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        console.error('Error formatting date:', dateString, e);
        return '-';
    }
}

// Toast notification functions
function showSuccessToast(message) {
    console.log('Success:', message);
    alert('Success: ' + message);
}

function showErrorToast(message) {
    console.error('Error:', message);
    alert('Error: ' + message);
}

function handleAjaxError(error, context = '') {
    console.error(`Error in ${context}:`, error);

    let userMessage = 'An unexpected error occurred. Please try again.';

    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
        userMessage = error.message;
    }

    showErrorToast(userMessage);
    return userMessage;
}

// ------------------------------------------ Approve Application Function ---------------------------------------------
function initializeRadioButtons() {
    const radioOptions = document.querySelectorAll('.radio-option');

    radioOptions.forEach(option => {
        const radioInput = option.querySelector('input[type="radio"]');

        // Add click handler to the entire option
        option.addEventListener('click', function(e) {
            if (e.target !== radioInput) {
                radioInput.checked = true;
                updateRadioButtonStates();
            }
        });

        // Add change handler to the input
        radioInput.addEventListener('change', function() {
            updateRadioButtonStates();
        });
    });
}

function updateRadioButtonStates() {
    const radioOptions = document.querySelectorAll('.radio-option');

    radioOptions.forEach(option => {
        const radioInput = option.querySelector('input[type="radio"]');

        if (radioInput.checked) {
            option.style.borderColor = getComputedStyle(option).getPropertyValue('--primary');
            option.style.background = 'rgba(67, 97, 238, 0.05)';
            option.style.boxShadow = '0 0 0 1px var(--primary)';
        } else {
            option.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            option.style.background = 'var(--white)';
            option.style.boxShadow = 'none';
        }
    });
}

function openOJTApplicationApproveModal(applicationId) {
    console.log('Opening approve modal for application:', applicationId);

    fetch(`/ojt-applications/${applicationId}/approve-modal/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRFToken()
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
            const application = data.application;
            const modal = document.getElementById('approveOJTApplicationModal');

            if (!modal) {
                console.error('Modal element not found');
                showErrorToast('Modal not found. Please refresh the page.');
                return;
            }

            // Set application details
            document.getElementById('approveOJTApplicationId').value = application.id;
            document.getElementById('approveOJTStudentName').textContent = application.student_name || '-';
            document.getElementById('approveOJTStudentNumber').textContent = application.student_number || '-';
            document.getElementById('approveOJTCourseSection').textContent =
                `${application.student_course || 'N/A'} - Section ${application.student_section || 'N/A'}`;
            document.getElementById('approveOJTCompany').textContent = application.company_name || '-';
            document.getElementById('approveOJTApplicationDate').textContent = application.application_date || '-';

            // Set status badge
            const statusBadge = document.getElementById('approveOJTCurrentStatus');
            if (statusBadge) {
                statusBadge.textContent = application.status_display || '-';
                statusBadge.className = `status-badge status-${application.status || 'pending'}`;
            }

            // Set OJT period details
            document.getElementById('approveOJTStartDate').textContent = application.proposed_start_date || '-';
            document.getElementById('approveOJTEndDate').textContent = application.proposed_end_date || '-';
            document.getElementById('approveOJTDuration').textContent = `${application.duration_days || 0} days`;
            document.getElementById('approveOJTHours').textContent = `${application.proposed_hours || 0} hours`;

            // Set company information
            document.getElementById('approveOJTAvailableSlots').textContent = application.company_available_slots || 0;
            document.getElementById('approveOJTFilledSlots').textContent = application.company_filled_slots || 0;
            document.getElementById('approveOJTRemainingSlots').textContent = application.company_remaining_slots || 0;

            const companyStatusBadge = document.getElementById('approveOJTCompanyStatus');
            if (companyStatusBadge) {
                companyStatusBadge.textContent = application.company_status || 'Available';
                companyStatusBadge.className = `status-badge status-${(application.company_status || 'available').toLowerCase()}`;
            }

            // Set application content
            document.getElementById('approveOJTCoverLetter').textContent = application.cover_letter || 'No cover letter provided';
            document.getElementById('approveOJTSkills').textContent = application.skills || 'No skills specified';

            // Populate requirements
            populateRequirements(application.requirements);

            // Reset form and initialize radio buttons
            document.getElementById('approveOJTApplicationForm').reset();
            document.getElementById('approveOJTFormResponse').innerHTML = '';

            // Initialize radio button interactions
            setTimeout(() => {
                initializeRadioButtons();
                updateRadioButtonStates();
            }, 100);

            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

        } else {
            showErrorToast('Failed to load application details: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error fetching application details:', error);
        showErrorToast('Failed to load application details. Please try again.');
    });
}

// Populate requirements list
function populateRequirements(requirements) {
    const requirementsList = document.getElementById('approveOJTRequirementsList');
    if (!requirementsList) return;

    requirementsList.innerHTML = '';

    if (requirements && requirements.length > 0) {
        requirements.forEach(req => {
            const requirementItem = document.createElement('div');
            requirementItem.className = 'requirement-item';

            const statusClass = req.status ? `status-${req.status.toLowerCase()}` : 'status-pending';
            const statusText = req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : 'Pending';

            requirementItem.innerHTML = `
                <div class="requirement-info">
                    <span class="requirement-type">${req.requirement_type_display || 'Unknown Requirement'}</span>
                    <span class="requirement-status ${statusClass}">${statusText}</span>
                </div>
                ${req.file_url ?
                    `<a href="${req.file_url}" target="_blank" class="requirement-link">View Document</a>` :
                    '<span class="requirement-missing">Not Submitted</span>'
                }
            `;

            requirementsList.appendChild(requirementItem);
        });
    } else {
        requirementsList.innerHTML = '<div class="no-requirements">No requirements submitted</div>';
    }
}

// Close the approve modal
function closeApproveOJTApplicationModal() {
    const modal = document.getElementById('approveOJTApplicationModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Handle form submission
function handleOJTApproveFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const applicationId = document.getElementById('approveOJTApplicationId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('approveOJTFormResponse');

    if (!applicationId) {
        showErrorToast('No application ID found.');
        return;
    }

    // Get form data including CSRF token
    const formData = new FormData(form);

    // Add CSRF token explicitly
    const csrfToken = getCSRFToken();
    if (csrfToken) {
        formData.append('csrfmiddlewaretoken', csrfToken);
    }

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    fetch(`/ojt-applications/${applicationId}/approve/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || `HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Approve response:', data);
        if (data.success) {
            const decision = formData.get('decision');
            const action = decision === 'approved' ? 'approved' : 'rejected';

            showSuccessToast(`OJT Application ${action} successfully!`);
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Application ${action} successfully! The student has been notified by email.
                    ${data.slots_remaining !== undefined ? `<br><small>Remaining slots: ${data.slots_remaining}</small>` : ''}
                </div>
            `;

            setTimeout(() => {
                closeApproveOJTApplicationModal();
                // Refresh the table instead of full page reload
                if (typeof loadOJTApplicationsPage === 'function') {
                    loadOJTApplicationsPage(1);
                } else {
                    window.location.reload();
                }
            }, 2000);
        } else {
            const errorMessage = data.message || 'An error occurred while processing your request';
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
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorMessage = error.message || 'An unexpected error occurred';
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
    });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------------------------------------- OJT Application View Function ----------------------------------------------
function openOJTApplicationViewModal(applicationId) {
    console.log('Opening view modal for application:', applicationId);

    fetch(`/ojt-applications/${applicationId}/view-modal/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRFToken()
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
            const application = data.application;
            const modal = document.getElementById('viewOJTApplicationModal');

            if (!modal) {
                console.error('View modal element not found');
                showErrorToast('Modal not found. Please refresh the page.');
                return;
            }

            // Set application details
            document.getElementById('viewOJTStudentName').textContent = application.student_name || '-';
            document.getElementById('viewOJTStudentNumber').textContent = application.student_number || '-';
            document.getElementById('viewOJTCourseSection').textContent =
                `${application.student_course || 'N/A'} - Section ${application.student_section || 'N/A'}`;
            document.getElementById('viewOJTYearLevel').textContent = application.student_year_level || '-';
            document.getElementById('viewOJTCompany').textContent = application.company_name || '-';
            document.getElementById('viewOJTApplicationDate').textContent = application.application_date || '-';

            // Set status badge
            const statusBadge = document.getElementById('viewOJTCurrentStatus');
            if (statusBadge) {
                statusBadge.textContent = application.status_display || '-';
                statusBadge.className = `status-badge status-${application.status || 'pending'}`;
            }

            // Set OJT period details
            document.getElementById('viewOJTStartDate').textContent = application.proposed_start_date || '-';
            document.getElementById('viewOJTEndDate').textContent = application.proposed_end_date || '-';
            document.getElementById('viewOJTDuration').textContent = `${application.duration_days || 0} days`;
            document.getElementById('viewOJTHours').textContent = `${application.proposed_hours || 0} hours`;

            // Set company information
            document.getElementById('viewOJTCompanyName').textContent = application.company_name || '-';
            document.getElementById('viewOJTCompanyAddress').textContent = application.company_address || '-';
            document.getElementById('viewOJTCompanyContact').textContent = application.company_contact || '-';
            document.getElementById('viewOJTCompanyEmail').textContent = application.company_email || '-';
            document.getElementById('viewOJTCompanyWebsite').innerHTML = application.company_website ?
                `<a href="${application.company_website}" target="_blank">${application.company_website}</a>` : '-';
            document.getElementById('viewOJTCompanyDescription').textContent = application.company_description || 'No description available';

            // Set company slots information
            document.getElementById('viewOJTAvailableSlots').textContent = application.company_available_slots || 0;
            document.getElementById('viewOJTFilledSlots').textContent = application.company_filled_slots || 0;
            document.getElementById('viewOJTRemainingSlots').textContent = application.company_remaining_slots || 0;

            const companyStatusBadge = document.getElementById('viewOJTCompanyStatus');
            if (companyStatusBadge) {
                companyStatusBadge.textContent = application.company_status || 'Available';
                companyStatusBadge.className = `status-badge status-${(application.company_status || 'available').toLowerCase()}`;
            }

            // Set application content
            document.getElementById('viewOJTCoverLetter').textContent = application.cover_letter || 'No cover letter provided';
            document.getElementById('viewOJTSkills').textContent = application.skills || 'No skills specified';

            // Set review information if available
            document.getElementById('viewOJTReviewNotes').textContent = application.review_notes || 'No review notes';
            document.getElementById('viewOJTRejectionReason').textContent = application.rejection_reason || 'Not applicable';

            // Set approval information if available
            if (application.approved_by) {
                document.getElementById('viewOJTApprovedBy').textContent = application.approved_by;
                document.getElementById('viewOJTApprovedAt').textContent = application.approved_at;
                document.getElementById('viewOJTApprovalInfo').style.display = 'block';
            } else {
                document.getElementById('viewOJTApprovalInfo').style.display = 'none';
            }

            // Set review information if available
            if (application.reviewed_by) {
                document.getElementById('viewOJTReviewedBy').textContent = application.reviewed_by;
                document.getElementById('viewOJTReviewedAt').textContent = application.reviewed_at;
                document.getElementById('viewOJTReviewInfo').style.display = 'block';
            } else {
                document.getElementById('viewOJTReviewInfo').style.display = 'none';
            }

            // Populate requirements
            populateViewRequirements(application.requirements);

            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

        } else {
            showErrorToast('Failed to load application details: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error fetching application details:', error);
        showErrorToast('Failed to load application details. Please try again.');
    });
}

// Populate requirements list for view modal
// Populate requirements list for view modal with date under type
function populateViewRequirements(requirements) {
    const requirementsList = document.getElementById('viewOJTRequirementsList');
    if (!requirementsList) return;

    requirementsList.innerHTML = '';

    if (requirements && requirements.length > 0) {
        requirements.forEach(req => {
            const requirementItem = document.createElement('div');
            requirementItem.className = 'requirement-item';

            const statusClass = req.status ? `status-${req.status.toLowerCase()}` : 'status-pending';
            const statusText = req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : 'Pending';

            let dateInfo = '';
            let metaInfo = '';
            let additionalInfo = '';

            // Date submitted under requirement type
            if (req.submitted_at) {
                dateInfo = `
                    <div class="requirement-date">
                        <i class='bx bx-calendar'></i>
                        <span>Submitted on ${req.submitted_at}</span>
                    </div>
                `;
            } else {
                dateInfo = `
                    <div class="requirement-date">
                        <i class='bx bx-time'></i>
                        <span>Not yet submitted</span>
                    </div>
                `;
            }

            // Verification info in meta section
            if (req.is_verified && req.verified_by) {
                metaInfo += `
                    <div class="meta-item">
                        <i class='bx bx-check-shield'></i>
                        <span>Verified by: ${req.verified_by}</span>
                    </div>
                `;

                if (req.verified_at) {
                    metaInfo += `
                        <div class="meta-item">
                            <i class='bx bx-time'></i>
                            <span>Verified on: ${req.verified_at}</span>
                        </div>
                    `;
                }

                if (req.verification_notes) {
                    additionalInfo = `
                        <div class="verification-info">
                            <small>Verification Notes:</small>
                            <div class="verification-notes">${req.verification_notes}</div>
                        </div>
                    `;
                }
            }

            requirementItem.innerHTML = `
                <div class="requirement-header">
                    <div class="requirement-main-info">
                        <div class="requirement-type-container">
                            <span class="requirement-type">${req.requirement_type_display || 'Unknown Requirement'}</span>
                            ${dateInfo}
                        </div>
                        <div class="requirement-status-container">
                            <span class="requirement-status ${statusClass}">
                                ${statusText}
                            </span>
                        </div>
                    </div>
                    <div class="requirement-actions">
                        ${req.file_url ?
                            `<a href="${req.file_url}" target="_blank" class="requirement-link" title="${req.file_name}">
                                <i class="bx bx-download"></i>
                                Download
                            </a>` :
                            '<span class="requirement-missing">No File</span>'
                        }
                    </div>
                </div>
                ${metaInfo ? `
                    <div class="requirement-meta">
                        ${metaInfo}
                    </div>
                ` : ''}
                ${additionalInfo}
            `;

            requirementsList.appendChild(requirementItem);
        });
    } else {
        requirementsList.innerHTML = `
            <div class="no-requirements">
                <i class='bx bx-folder-open' style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                No requirements submitted for this application
            </div>
        `;
    }
}

// Close the view modal
function closeViewOJTApplicationModal() {
    const modal = document.getElementById('viewOJTApplicationModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ------------------------------------------ OJT Application Archive Function -----------------------------------------
function openOJTApplicationArchiveModal(applicationId) {
    showOJTApplicationArchiveLoadingState(true);

    fetch(`/ojt-applications/${applicationId}/archive-modal/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRFToken()
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
            populateOJTApplicationArchiveModal(data.application, data.user_type);
            showOJTApplicationArchiveModal();
        } else {
            throw new Error(data.error || 'Failed to load application details for archiving');
        }
    })
    .catch(error => {
        console.error('Error loading application details for archiving:', error);
        showErrorToast(error.message || 'Failed to load application details for archiving');
    })
    .finally(() => {
        showOJTApplicationArchiveLoadingState(false);
    });
}

function populateOJTApplicationArchiveModal(application, userType) {
    // Set application ID
    document.getElementById('archiveOJTApplicationId').value = application.id;

    // Update modal title and description
    document.getElementById('ojtArchiveModalTitle').textContent = 'Archive Application';
    document.getElementById('ojtArchiveModalDescription').textContent =
        `Are you sure you want to archive application #${application.id}?`;

    // Populate application preview
    document.getElementById('archiveOJTApplicationNumber').textContent = application.id;
    document.getElementById('archiveOJTStudentName').textContent = application.student_name;
    document.getElementById('archiveOJTStudentNumber').textContent = application.student_number;
    document.getElementById('archiveOJTCourseSection').textContent =
        `${application.student_course} - Section ${application.student_section}`;
    document.getElementById('archiveOJTCompany').textContent = application.company_name;
    document.getElementById('archiveOJTApplicationDate').textContent = application.application_date;
    document.getElementById('archiveOJTDuration').textContent =
        `${application.duration_days} days (${application.proposed_hours} hours)`;
    document.getElementById('archiveOJTRequirements').textContent =
        `${application.requirements_submitted}/${application.total_requirements} submitted`;

    // Set status badge
    const statusElement = document.getElementById('archiveOJTApplicationStatus');
    statusElement.textContent = application.status_display;
    statusElement.className = `status-badge status-${application.status}`;

    // Set form action
    const form = document.getElementById('ojtApplicationArchiveForm');
    form.action = `/ojt-applications/${application.id}/archive/`;
}

function updateOJTArchiveImpactSection(application) {
    const impactTitle = document.getElementById('ojtArchiveImpactTitle');
    const impactDescription = document.getElementById('ojtArchiveImpactDescription');
    const impactList = document.getElementById('ojtArchiveImpactList');
    const statusWarning = document.getElementById('ojtStatusWarning');
    const statusWarningText = document.getElementById('ojtStatusWarningText');

    impactTitle.textContent = 'Archive Impact';
    impactDescription.textContent = 'Archiving this application will:';

    impactList.innerHTML = `
        <li>Remove the application from active lists</li>
        <li>Preserve all application data and requirements</li>
        <li>Make the application accessible only in archived records</li>
        <li>Free up the company slot if the application was approved</li>
    `;

    // Show status-specific information
    if (application.status === 'approved') {
        statusWarningText.textContent = 'This approved application will be archived. The company slot will be freed up.';
        statusWarning.style.display = 'flex';
    } else {
        statusWarning.style.display = 'none';
    }
}

function showOJTApplicationArchiveModal() {
    const modal = document.getElementById('ojtApplicationArchiveModal');
    modal.classList.add('active');
}

function closeOJTApplicationArchiveModal() {
    const modal = document.getElementById('ojtApplicationArchiveModal');
    modal.classList.remove('active');

    // Clear form response
    document.getElementById('ojtApplicationArchiveFormResponse').innerHTML = '';
}

function showOJTApplicationArchiveLoadingState(show) {
    const modal = document.getElementById('ojtApplicationArchiveModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#ojtApplicationArchiveModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'ojtApplicationArchiveModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading application details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#ojtApplicationArchiveModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

// Handle archive form submission
document.getElementById('ojtApplicationArchiveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const applicationId = document.getElementById('archiveOJTApplicationId').value;
    const applicationNumber = document.getElementById('archiveOJTApplicationNumber').textContent;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('ojtApplicationArchiveFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    const action = 'archive';
    const actionDisplay = 'archive';

    fetch(form.action, {
        method: 'POST',
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
                    message: err.error || `Failed to ${actionDisplay} application`
                };
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast(data.message || `Application #${applicationNumber} has been ${actionDisplay}ed successfully!`);
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    ${data.message || `Application ${actionDisplay}ed successfully! Page will reload shortly...`}
                </div>
            `;

            setTimeout(() => {
                closeOJTApplicationArchiveModal();
                // RELOAD THE WHOLE PAGE INSTEAD OF REFRESHING JUST THE TABLE
                window.location.reload();
            }, 1500);
        } else {
            showErrorToast(data.error || `Failed to ${actionDisplay} application #${applicationNumber}`);
            showOJTApplicationArchiveError(data.error || `Failed to ${actionDisplay} application`);
        }
    })
    .catch(error => {
        console.error(`Error ${actionDisplay}ing application:`, error);
        const errorMessage = error.userFriendly ?
            error.message :
            'An unexpected error occurred while processing your request.';
        showErrorToast(errorMessage);
        showOJTApplicationArchiveError(errorMessage);
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

function showOJTApplicationArchiveError(message) {
    const formResponse = document.getElementById('ojtApplicationArchiveFormResponse');
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
window.openOJTApplicationArchiveModal = openOJTApplicationArchiveModal;
window.closeOJTApplicationArchiveModal = closeOJTApplicationArchiveModal;

// ---------------------------------------- OJT Application Edit Function ----------------------------------------------
let pendingRemovals = [];
let newRequirementsCount = 0;
let existingRequirements = [];

function openOJTApplicationEditModal(applicationId) {
    console.log('Opening edit modal for application:', applicationId);
    showOJTApplicationEditLoadingState(true);

    // Reset state
    pendingRemovals = [];
    newRequirementsCount = 0;
    existingRequirements = [];

    fetch(`/ojt-applications/${applicationId}/edit/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received data:', data);
        if (data.success) {
            populateOJTApplicationEditForm(data.application, data.available_companies, data.requirements);
            showOJTApplicationEditModal();
        } else {
            throw new Error(data.error || 'Failed to load application details for editing');
        }
    })
    .catch(error => {
        console.error('Error loading application details for editing:', error);
        showErrorToast(error.message || 'Failed to load application details for editing');
    })
    .finally(() => {
        showOJTApplicationEditLoadingState(false);
    });
}

function populateOJTApplicationEditForm(application, availableCompanies, requirements) {
    console.log('Populating form with application:', application);

    // Set application ID
    document.getElementById('editOJTApplicationId').value = application.id;

    // Set student information (readonly)
    document.getElementById('editOJTStudentName').value = application.student_name || '-';
    document.getElementById('editOJTStudentNumber').value = application.student_number || '-';
    document.getElementById('editOJTCourseSection').value =
        `${application.student_course || 'N/A'} - Section ${application.student_section || 'N/A'}`;
    document.getElementById('editOJTYearLevel').value = application.student_year_level || '-';
    document.getElementById('editOJTApplicationStatus').value = application.status_display || '-';

    // Set company dropdown
    const companySelect = document.getElementById('editOJTCompany');
    companySelect.innerHTML = '<option value="">Select a company...</option>';

    if (availableCompanies && availableCompanies.length > 0) {
        availableCompanies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (company.id === application.company_id) {
                option.selected = true;
            }
            companySelect.appendChild(option);
        });
    }

    // Set OJT period
    document.getElementById('editOJTStartDate').value = application.proposed_start_date || '';
    document.getElementById('editOJTEndDate').value = application.proposed_end_date || '';
    document.getElementById('editOJTHours').value = application.proposed_hours || 240;

    // Calculate and set duration
    updateDuration();

    // Set application details
    document.getElementById('editOJTCoverLetter').value = application.cover_letter || '';
    document.getElementById('editOJTSkills').value = application.skills || '';

    // Set initial company preview
    updateCompanyPreview(application.company_id, availableCompanies);

    // Populate requirements
    populateRequirements(requirements);

    // Set form action
    const form = document.getElementById('ojtApplicationEditForm');
    form.action = `/ojt-applications/${application.id}/edit/`;

    // Add event listeners for dynamic updates
    companySelect.addEventListener('change', function() {
        updateCompanyPreview(this.value, availableCompanies);
    });

    // Add date change listeners to update duration
    document.getElementById('editOJTStartDate').addEventListener('change', updateDuration);
    document.getElementById('editOJTEndDate').addEventListener('change', updateDuration);
}

function populateRequirements(requirements) {
    const existingRequirementsList = document.getElementById('editExistingRequirementsList');
    existingRequirements = requirements || [];

    // Clear existing content
    existingRequirementsList.innerHTML = '';

    if (existingRequirements.length > 0) {
        existingRequirements.forEach(req => {
            const requirementItem = createExistingRequirementItem(req);
            existingRequirementsList.appendChild(requirementItem);
        });
    } else {
        existingRequirementsList.innerHTML = `
            <div class="no-requirements">
                <i class='bx bx-folder-open'></i>
                <p>No requirements submitted yet</p>
            </div>
        `;
    }

    updateRequirementsSummary();
}

function createExistingRequirementItem(requirement) {
    const requirementItem = document.createElement('div');
    requirementItem.className = 'requirement-item existing';
    requirementItem.dataset.requirementId = requirement.id;

    let statusClass, statusText;
    if (requirement.is_verified) {
        statusClass = 'status-verified';
        statusText = 'Verified';
    } else if (requirement.is_submitted && requirement.file_url) {
        statusClass = 'status-submitted';
        statusText = 'Submitted';
    } else {
        statusClass = 'status-pending';
        statusText = 'Pending';
    }

    requirementItem.innerHTML = `
        <div class="requirement-header">
            <div class="requirement-info">
                <span class="requirement-type">${requirement.requirement_type_display || 'Unknown Requirement'}</span>
                <span class="requirement-status ${statusClass}">${statusText}</span>
            </div>
            <div class="requirement-actions">
                ${requirement.file_url ? `
                    <a href="${requirement.file_url}" target="_blank" class="btn-action view-btn" title="View File">
                        <i class='bx bx-show'></i>
                    </a>
                ` : ''}
                <button type="button" class="btn-action delete-btn" onclick="markRequirementForRemoval(${requirement.id}, '${requirement.requirement_type_display}')" title="Remove Requirement">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        </div>
        ${requirement.file_name ? `
            <div class="requirement-file">
                <i class='bx bx-file'></i>
                <span class="file-name">${requirement.file_name}</span>
            </div>
        ` : ''}
        ${requirement.submitted_at ? `
            <div class="requirement-meta">
                <small>Submitted: ${new Date(requirement.submitted_at).toLocaleDateString()}</small>
            </div>
        ` : ''}
    `;

    return requirementItem;
}

function markRequirementForRemoval(requirementId, requirementType) {
    if (!confirm(`Are you sure you want to remove "${requirementType}"? This will be permanently deleted when you click "Update Application".`)) {
        return;
    }

    // Add to pending removals
    if (!pendingRemovals.includes(requirementId)) {
        pendingRemovals.push(requirementId);
    }

    // Hide the requirement item
    const requirementItem = document.querySelector(`[data-requirement-id="${requirementId}"]`);
    if (requirementItem) {
        requirementItem.style.display = 'none';
    }

    updateRequirementsSummary();
}

function unmarkRequirementForRemoval(requirementId) {
    // Remove from pending removals
    pendingRemovals = pendingRemovals.filter(id => id !== requirementId);

    // Show the requirement item again
    const requirementItem = document.querySelector(`[data-requirement-id="${requirementId}"]`);
    if (requirementItem) {
        requirementItem.style.display = 'block';
    }

    updateRequirementsSummary();
}

function updateRequirementsSummary() {
    const totalExisting = existingRequirements.length;
    const remainingExisting = totalExisting - pendingRemovals.length;
    const totalNew = newRequirementsCount;
    const uploadedNew = document.querySelectorAll('#editNewRequirementsContainer .requirement-item.has-file').length;

    const totalRequirements = remainingExisting + totalNew;
    const uploadedRequirements = remainingExisting + uploadedNew;

    // Update summary display
    document.getElementById('editTotalRequirements').textContent = totalRequirements;
    document.getElementById('editUploadedRequirements').textContent = uploadedRequirements;
    document.getElementById('editPendingRequirements').textContent = totalRequirements - uploadedRequirements;

    // Update progress bar
    const progress = totalRequirements > 0 ? (uploadedRequirements / totalRequirements) * 100 : 0;
    const progressBar = document.getElementById('editCompletionProgress');
    const progressText = document.getElementById('editProgressText');

    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
    if (progressText) {
        progressText.textContent = Math.round(progress) + '%';
    }
}

// New Requirements Management
function addNewRequirement() {
    const container = document.getElementById('editNewRequirementsContainer');
    const maxRequirements = 13 - (existingRequirements.length - pendingRemovals.length);

    if (newRequirementsCount >= maxRequirements) {
        showErrorToast('Maximum number of requirements reached');
        return;
    }

    newRequirementsCount++;
    const requirementId = `new_${newRequirementsCount}`;

    const requirementHtml = `
        <div class="requirement-item new" data-requirement-id="${requirementId}">
            <div class="requirement-fields">
                <!-- Document Type -->
                <div class="form-group">
                    <label class="form-label">Document Type</label>
                    <select name="new_requirement_types[]" class="requirement-type-select" required>
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

                <!-- File Upload -->
                <div class="form-group">
                    <label class="form-label">File *</label>
                    <div class="file-upload-wrapper">
                        <input type="file" name="new_requirement_files[]"
                               class="requirement-file-input"
                               accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required>
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

                <!-- Remove Button -->
                <button type="button" class="remove-upload-btn" onclick="removeNewRequirement('${requirementId}')">
                    <i class='bx bx-trash'></i>
                    Remove Requirement
                </button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', requirementHtml);

    // Initialize the new file input
    const newFileInput = container.querySelector(`[data-requirement-id="${requirementId}"] .requirement-file-input`);
    initializeFileInput(newFileInput);

    updateRequirementsSummary();
}

function removeNewRequirement(requirementId) {
    const requirementItem = document.querySelector(`[data-requirement-id="${requirementId}"]`);
    if (requirementItem) {
        requirementItem.remove();
        newRequirementsCount--;
        updateRequirementsSummary();
    }
}

function initializeFileInput(fileInput) {
    const wrapper = fileInput.closest('.file-upload-wrapper');
    const uploadBtn = wrapper.querySelector('.file-upload-btn');
    const fileNameDisplay = wrapper.querySelector('.file-name-display');
    const requirementItem = fileInput.closest('.requirement-item');

    // Update button text when file is selected
    if (fileInput.files.length > 0) {
        uploadBtn.textContent = 'Change File';
        uploadBtn.classList.add('has-file');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = fileInput.files[0].name;
            fileNameDisplay.style.display = 'block';
        }
        requirementItem.classList.add('has-file');
    }

    // Add click event to trigger file input
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            // Validate file
            if (!validateFile(file)) {
                this.value = '';
                uploadBtn.textContent = 'Choose File';
                uploadBtn.classList.remove('has-file');
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = '';
                    fileNameDisplay.style.display = 'none';
                }
                requirementItem.classList.remove('has-file');
                return;
            }

            // Update UI
            uploadBtn.textContent = 'Change File';
            uploadBtn.classList.add('has-file');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = `${file.name} (${formatFileSize(file.size)})`;
                fileNameDisplay.style.display = 'block';
            }
            requirementItem.classList.add('has-file');

            // Update status
            const status = requirementItem.querySelector('.requirement-status');
            status.textContent = 'Ready';
            status.className = 'requirement-status status-uploaded';
        } else {
            uploadBtn.textContent = 'Choose File';
            uploadBtn.classList.remove('has-file');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = '';
                fileNameDisplay.style.display = 'none';
            }
            requirementItem.classList.remove('has-file');

            const status = requirementItem.querySelector('.requirement-status');
            status.textContent = 'Pending';
            status.className = 'requirement-status status-pending';
        }

        updateRequirementsSummary();
    });
}

function validateFile(file) {
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
        showErrorToast('File size must be less than 5MB');
        return false;
    }

    if (!allowedTypes.includes(file.type)) {
        showErrorToast('Please upload PDF, DOC, DOCX, JPG, or PNG files only');
        return false;
    }

    return true;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Drag and Drop functionality
function initDragAndDrop() {
    const dropZone = document.getElementById('editDropZone');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => highlightDropZone(), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => unhighlightDropZone(), false);
    });

    dropZone.addEventListener('drop', (e) => handleDrop(e), false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlightDropZone() {
    const dropZone = document.getElementById('editDropZone');
    dropZone.classList.add('active');
}

function unhighlightDropZone() {
    const dropZone = document.getElementById('editDropZone');
    dropZone.classList.remove('active');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        // Add a new requirement for each dropped file
        for (let i = 0; i < files.length; i++) {
            if (newRequirementsCount >= (13 - (existingRequirements.length - pendingRemovals.length))) {
                showErrorToast('Maximum number of requirements reached');
                break;
            }

            addNewRequirement();
            const latestRequirement = document.querySelector('#editNewRequirementsContainer .requirement-item:last-child .requirement-file-input');
            if (latestRequirement && validateFile(files[i])) {
                setFileInput(latestRequirement, files[i]);
            }
        }
    }
}

function setFileInput(input, file) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;

    // Trigger change event
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
}

function showOJTApplicationEditModal() {
    const modal = document.getElementById('editOJTApplicationModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialize requirements functionality
    document.getElementById('editAddRequirement').addEventListener('click', addNewRequirement);
    initDragAndDrop();

    // Focus on first editable field
    setTimeout(() => {
        document.getElementById('editOJTCompany').focus();
    }, 300);
}

function closeOJTApplicationEditModal() {
    const modal = document.getElementById('editOJTApplicationModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear form and errors
    document.getElementById('ojtApplicationEditFormResponse').innerHTML = '';
    document.querySelectorAll('#editOJTApplicationModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#editOJTApplicationModal .error-message').forEach(el => el.remove());

    // Reset requirements state
    pendingRemovals = [];
    newRequirementsCount = 0;
    existingRequirements = [];

    // Clear new requirements container
    document.getElementById('editNewRequirementsContainer').innerHTML = '';

    // Remove event listeners
    const addButton = document.getElementById('editAddRequirement');
    if (addButton) {
        addButton.replaceWith(addButton.cloneNode(true));
    }
}

// Update the form submission to include requirements data
document.getElementById('ojtApplicationEditForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const form = this;
    const formData = new FormData(form);
    const applicationId = document.getElementById('editOJTApplicationId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('ojtApplicationEditFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Clear previous errors
    document.querySelectorAll('#editOJTApplicationModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#editOJTApplicationModal .error-message').forEach(el => el.remove());

    // Add pending removals to form data
    pendingRemovals.forEach(requirementId => {
        formData.append('remove_requirements[]', requirementId);
    });

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

    // Validate date range
    const startDate = new Date(formData.get('proposed_start_date'));
    const endDate = new Date(formData.get('proposed_end_date'));

    if (endDate <= startDate) {
        showErrorToast('End date must be after start date.');
        document.getElementById('editOJTEndDate').classList.add('error');
        submitBtn.classList.remove('is-loading');
        return;
    }

    // Validate hours
    const proposedHours = parseInt(formData.get('proposed_hours'));
    if (proposedHours < 240 || proposedHours > 1000) {
        showErrorToast('OJT hours must be between 240 and 1000 hours.');
        document.getElementById('editOJTHours').classList.add('error');
        submitBtn.classList.remove('is-loading');
        return;
    }

    console.log('Submitting form to:', form.action);
    console.log('Form data:', Object.fromEntries(formData.entries()));

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        console.log('Update response status:', response.status);
        if (!response.ok) {
            return response.json().then(err => {
                // Include status code in error
                err.status = response.status;
                throw err;
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Update response data:', data);
        if (data.success) {
            showSuccessToast('OJT Application updated successfully!');

            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Application updated successfully! Refreshing data...
                </div>
            `;

            setTimeout(() => {
                closeOJTApplicationEditModal();
                window.location.reload();
            }, 1500);
        } else {
            // Show specific error message
            const errorMessage = data.error || data.message || 'Failed to update application';
            showErrorToast(errorMessage);

            // Highlight the company field if it's a duplicate error
            if (errorMessage.includes('already have an application')) {
                document.getElementById('editOJTCompany').classList.add('error');
            }

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
        }
    })
    .catch(error => {
        console.error('Error updating OJT application:', error);

        let errorMessage = 'An unexpected error occurred while updating application';

        if (error.error) {
            errorMessage = error.error;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // Highlight the company field if it's a duplicate error
        if (errorMessage.includes('already have an application') || errorMessage.includes('duplicate')) {
            document.getElementById('editOJTCompany').classList.add('error');
        }

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
    });
});

// Make functions globally available
window.openOJTApplicationEditModal = openOJTApplicationEditModal;
window.closeOJTApplicationEditModal = closeOJTApplicationEditModal;
window.markRequirementForRemoval = markRequirementForRemoval;
window.unmarkRequirementForRemoval = unmarkRequirementForRemoval;
window.addNewRequirement = addNewRequirement;
window.removeNewRequirement = removeNewRequirement;

function updateCompanyPreview(companyId, availableCompanies) {
    const preview = document.getElementById('editOJTCompanyPreview');
    const company = availableCompanies.find(c => c.id == companyId);

    if (company) {
        document.getElementById('editOJTCompanyName').textContent = company.name;
        document.getElementById('editOJTCompanyAddress').textContent = company.address || '-';
        document.getElementById('editOJTCompanyContact').textContent = company.contact_number || '-';
        document.getElementById('editOJTCompanySlots').textContent =
            `Slots: ${company.filled_slots || 0}/${company.available_slots || 0} (${company.remaining_slots || 0} available)`;

        // Update slots styling based on availability
        const slotsElement = document.getElementById('editOJTCompanySlots');
        slotsElement.className = 'slots-info ' + (company.remaining_slots > 0 ? 'slots-available' : 'slots-full');
    } else {
        document.getElementById('editOJTCompanyName').textContent = '-';
        document.getElementById('editOJTCompanyAddress').textContent = '-';
        document.getElementById('editOJTCompanyContact').textContent = '-';
        document.getElementById('editOJTCompanySlots').textContent = 'Slots: -';
    }
}

function updateDuration() {
    const startDate = document.getElementById('editOJTStartDate').value;
    const endDate = document.getElementById('editOJTEndDate').value;
    const durationField = document.getElementById('editOJTDurationDays');

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        durationField.value = `${duration} days`;
    } else {
        durationField.value = '-';
    }
}

function showOJTApplicationEditLoadingState(show) {
    const modal = document.getElementById('editOJTApplicationModal');
    const modalContent = modal.querySelector('.modal-container');

    if (show) {
        if (!modal.querySelector('#ojtApplicationEditModalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'ojtApplicationEditModalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading application details...</span>
            `;
            modalContent.appendChild(overlay);
        }
    } else {
        const overlay = modal.querySelector('#ojtApplicationEditModalLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

// Helper function to refresh the OJT applications table
function refreshOJTApplicationsTable() {
    if (typeof loadOJTApplicationsPage === 'function') {
        loadOJTApplicationsPage(1);
    } else {
        window.location.reload();
    }
}

function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

function showSuccessToast(message) {
    console.log('Success:', message);
    const toast = document.createElement('div');
    toast.className = 'toast-notification success';
    toast.innerHTML = `
        <div class="toast-content">
            <i class='bx bx-check-circle'></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showErrorToast(message) {
    console.log('Error:', message);
    const toast = document.createElement('div');
    toast.className = 'toast-notification error';
    toast.innerHTML = `
        <div class="toast-content">
            <i class='bx bx-error'></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showFormErrors(form, errors) {
    // Clear previous errors
    document.querySelectorAll('#editOJTApplicationModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#editOJTApplicationModal .error-message').forEach(el => el.remove());

    // Show new errors
    Object.keys(errors).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errors[fieldName];
            field.parentNode.appendChild(errorDiv);
        }
    });
}

// -------------------------------------- OJT Application Export Function ----------------------------------------------
let exportApplicationsUrl = '';
let isOJTApplicationsLoading = false;

function openOJTApplicationExportModal() {
    // Set current time
    const now = new Date();
    document.getElementById('currentOJTTime').textContent = now.toLocaleString();

    // Get the export URL from the button data attribute
    const exportBtn = document.getElementById('export-ojt-application-btn');
    if (exportBtn && exportBtn.dataset.exportUrl) {
        exportApplicationsUrl = exportBtn.dataset.exportUrl;
    } else {
        console.error('Export URL not found');
        showErrorToast('Export configuration error');
        return;
    }

    // Reset form
    resetOJTExportForm();

    // Load initial data for preview
    updateOJTExportPreview();

    const modal = document.getElementById('ojtApplicationExportModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeOJTApplicationExportModal() {
    const modal = document.getElementById('ojtApplicationExportModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form response
    document.getElementById('ojtApplicationExportFormResponse').innerHTML = '';
}

function resetOJTExportForm() {
    // Reset form to default state
    document.getElementById('exportScope').value = 'all';
    document.getElementById('exportCompany').value = '';
    document.getElementById('exportStatus').value = '';
    document.getElementById('dateRange').value = 'all';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('exportApplicationTitle').value = 'OJT Applications Report';
    document.getElementById('includeRequirements').checked = true;
    document.getElementById('includeReviewNotes').checked = true;

    // Hide all filter sections
    document.getElementById('companyFilterSection').style.display = 'none';
    document.getElementById('statusFilterSection').style.display = 'none';
    document.getElementById('customDateRangeSection').style.display = 'none';

    // Clear any existing errors
    const formResponse = document.getElementById('ojtApplicationExportFormResponse');
    formResponse.innerHTML = '';

    // Enable submit button
    const submitBtn = document.getElementById('ojtExportSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.title = '';
}

function handleOJTExportScopeChange() {
    const exportScope = document.getElementById('exportScope').value;
    const companySection = document.getElementById('companyFilterSection');
    const statusSection = document.getElementById('statusFilterSection');

    // Reset filters when scope changes
    document.getElementById('exportCompany').value = '';
    document.getElementById('exportStatus').value = '';

    // Show/hide sections based on scope
    switch(exportScope) {
        case 'by_company':
            companySection.style.display = 'block';
            statusSection.style.display = 'none';
            break;
        case 'by_status':
            companySection.style.display = 'none';
            statusSection.style.display = 'block';
            break;
        case 'by_company_status':
            companySection.style.display = 'block';
            statusSection.style.display = 'block';
            break;
        default:
            companySection.style.display = 'none';
            statusSection.style.display = 'none';
            break;
    }

    updateOJTExportPreview();
}

function handleDateRangeChange() {
    const dateRange = document.getElementById('dateRange').value;
    const customDateSection = document.getElementById('customDateRangeSection');

    if (dateRange === 'custom') {
        customDateSection.style.display = 'block';
        // Set default dates for custom range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    } else {
        customDateSection.style.display = 'none';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
    }

    updateOJTExportPreview();
}

function updateOJTExportPreview() {
    const exportScope = document.getElementById('exportScope').value;
    const company = document.getElementById('exportCompany');
    const status = document.getElementById('exportStatus');
    const dateRange = document.getElementById('dateRange').value;
    const includeRequirements = document.getElementById('includeRequirements').checked;
    const includeReviewNotes = document.getElementById('includeReviewNotes').checked;
    const exportTitle = document.getElementById('exportApplicationTitle').value || 'OJT Applications Report';

    // Get display values
    const companyName = company.options[company.selectedIndex]?.text || '-';
    const statusName = status.options[status.selectedIndex]?.text || '-';

    // Date range display
    let dateRangeDisplay = 'All Dates';
    if (dateRange === 'custom') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate && endDate) {
            dateRangeDisplay = `${startDate} to ${endDate}`;
        }
    } else if (dateRange !== 'all') {
        dateRangeDisplay = document.getElementById('dateRange').options[document.getElementById('dateRange').selectedIndex].text;
    }

    // Update preview texts
    document.getElementById('previewExportScope').textContent = getOJTExportScopeDisplay(exportScope);
    document.getElementById('previewSelectedCompany').textContent = companyName;
    document.getElementById('previewSelectedStatus').textContent = statusName;
    document.getElementById('previewDateRange').textContent = dateRangeDisplay;
    document.getElementById('previewIncludesRequirements').textContent = includeRequirements ? 'Yes' : 'No';
    document.getElementById('previewIncludesReviewNotes').textContent = includeReviewNotes ? 'Yes' : 'No';

    updateEstimatedRecords();

    // Update submit button state
    const submitBtn = document.getElementById('ojtExportSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.title = '';

    // Validate specific combinations
    if (exportScope === 'by_company_status' && (!company.value || !status.value)) {
        submitBtn.disabled = true;
        submitBtn.title = 'Please select both company and status';
    } else if ((exportScope === 'by_company' || exportScope === 'by_company_status') && !company.value) {
        submitBtn.disabled = true;
        submitBtn.title = 'Please select a company';
    } else if ((exportScope === 'by_status' || exportScope === 'by_company_status') && !status.value) {
        submitBtn.disabled = true;
        submitBtn.title = 'Please select a status';
    }
}

function getOJTExportScopeDisplay(exportScope) {
    const displayMap = {
        'all': 'All Applications',
        'by_company': 'By Company',
        'by_status': 'By Status',
        'by_company_status': 'By Company & Status',
        'current_filters': 'Current Table Filters'
    };
    return displayMap[exportScope] || exportScope;
}

function updateEstimatedRecords() {
    const exportScope = document.getElementById('exportScope').value;
    const company = document.getElementById('exportCompany').value;
    const status = document.getElementById('exportStatus').value;

    let estimateText = 'Calculating...';

    if (exportScope === 'all') {
        estimateText = 'All application records';
    } else if (exportScope === 'by_company' && company) {
        estimateText = 'Applications for selected company';
    } else if (exportScope === 'by_status' && status) {
        estimateText = `Applications with "${getStatusDisplay(status)}" status`;
    } else if (exportScope === 'by_company_status' && company && status) {
        estimateText = `Applications matching company and status`;
    } else if (exportScope === 'current_filters') {
        estimateText = 'Applications matching current table filters';
    } else {
        estimateText = 'Please select filters';
    }

    document.getElementById('previewEstimatedRecords').textContent = estimateText;
}

function getStatusDisplay(status) {
    const statusMap = {
        'draft': 'Draft',
        'submitted': 'Submitted',
        'under_review': 'Under Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
}

function validateOJTExportForm() {
    const exportScope = document.getElementById('exportScope').value;
    const company = document.getElementById('exportCompany').value;
    const status = document.getElementById('exportStatus').value;
    const exportTitle = document.getElementById('exportApplicationTitle').value.trim();
    const dateRange = document.getElementById('dateRange').value;

    // Validate required fields based on scope
    if (exportScope === 'by_company_status' && (!company || !status)) {
        return 'Please select both company and status';
    } else if (exportScope === 'by_company' && !company) {
        return 'Please select a company';
    } else if (exportScope === 'by_status' && !status) {
        return 'Please select a status';
    }

    // Validate custom date range
    if (dateRange === 'custom') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            return 'Please select both start and end dates for custom range';
        }

        if (new Date(startDate) > new Date(endDate)) {
            return 'Start date cannot be after end date';
        }
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
document.getElementById('ojtApplicationExportForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (!exportApplicationsUrl) {
        showErrorToast('Export URL not configured');
        return;
    }

    const form = this;
    const formData = new FormData(form);

    // Manually set checkbox values to ensure they're correct
    formData.set('include_requirements', document.getElementById('includeRequirements').checked ? 'true' : 'false');
    formData.set('include_review_notes', document.getElementById('includeReviewNotes').checked ? 'true' : 'false');

    const submitBtn = document.getElementById('ojtExportSubmitBtn');
    const formResponse = document.getElementById('ojtApplicationExportFormResponse');

    // Validate form
    const validationError = validateOJTExportForm();
    if (validationError) {
        showErrorToast(validationError);
        return;
    }

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    // Add loading state to form
    form.classList.add('is-submitting');

    fetch(exportApplicationsUrl, {
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
        const exportScope = document.getElementById('exportScope').value;
        let filename = `OJT_Applications_${exportScope}`;

        // Add company name to filename if selected
        const companySelect = document.getElementById('exportCompany');
        if (companySelect.value) {
            const companyName = companySelect.options[companySelect.selectedIndex].text;
            filename += `_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }

        // Add status to filename if selected
        const statusSelect = document.getElementById('exportStatus');
        if (statusSelect.value) {
            filename += `_${statusSelect.value}`;
        }

        const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '_');
        filename += `_${timestamp}.xlsx`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showSuccessToast('Export completed successfully!');
        closeOJTApplicationExportModal();
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
    const exportBtn = document.getElementById('export-ojt-application-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', openOJTApplicationExportModal);
    }

    document.getElementById('exportScope').addEventListener('change', updateOJTExportPreview);
    document.getElementById('exportCompany').addEventListener('change', updateOJTExportPreview);
    document.getElementById('exportStatus').addEventListener('change', updateOJTExportPreview);
    document.getElementById('dateRange').addEventListener('change', updateOJTExportPreview);
    document.getElementById('startDate').addEventListener('change', updateOJTExportPreview);
    document.getElementById('endDate').addEventListener('change', updateOJTExportPreview);
    document.getElementById('includeRequirements').addEventListener('change', updateOJTExportPreview);
    document.getElementById('includeReviewNotes').addEventListener('change', updateOJTExportPreview);
    document.getElementById('exportApplicationTitle').addEventListener('input', updateOJTExportPreview);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeOJTApplicationExportModal();
        }
    });
});

// Make functions globally available
window.openOJTApplicationExportModal = openOJTApplicationExportModal;
window.closeOJTApplicationExportModal = closeOJTApplicationExportModal;
window.handleOJTExportScopeChange = handleOJTExportScopeChange;
window.handleDateRangeChange = handleDateRangeChange;