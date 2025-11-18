// ----------------------------------------------- NSTP Approval Functions ---------------------------------------------
function updateNSTPAction(value) {
    document.getElementById('approveNSTPAction').value = value;
}

function openApproveNSTPEnlistmentModal(enlistmentId, action='approve') {
    fetch(`/nstp/${enlistmentId}/approve/`, {
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
            const enlistment = data.enlistment;
            const modal = document.getElementById('approveNSTPEnlistmentModal');

            // Set enlistment ID in the hidden field
            document.getElementById('approveNSTPEnlistmentId').value = enlistmentId;
            document.getElementById('approveNSTPAction').value = action;
            document.getElementById('approveNSTPActionSelect').value = action;

            // Set student details
            document.getElementById('approveNSTPStudentNumber').textContent = enlistment.student_number || '-';
            document.getElementById('approveNSTPStudentName').textContent = `${enlistment.last_name}, ${enlistment.first_name}`;
            document.getElementById('approveNSTPProgram').textContent = enlistment.program || '-';

            // Set enlistment details
            document.getElementById('approveNSTPSemester').textContent = enlistment.semester;
            document.getElementById('approveNSTPAcademicYear').textContent = enlistment.academic_year;

            // Set status badge
            const statusBadge = document.getElementById('approveNSTPCurrentStatus');
            statusBadge.textContent = enlistment.approval_status_display;
            statusBadge.className = 'status-badge status-' + enlistment.approval_status;

            // Set existing remarks if any
            document.getElementById('approveNSTPNotes').value = enlistment.remarks || '';

            // Reset form response
            document.getElementById('approveNSTPEnlistmentFormResponse').innerHTML = '';

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            showErrorToast('Failed to load NSTP enlistment details: ' + (data.error || 'Unknown error'));
            console.error('Failed to fetch NSTP enlistment details:', data.error);
        }
    })
    .catch(error => {
        showErrorToast('Failed to load NSTP enlistment details. Please try again.');
        console.error('Error fetching NSTP enlistment details:', error);
    });
}

// Close the approve modal
function closeApproveNSTPEnlistmentModal() {
    const modal = document.getElementById('approveNSTPEnlistmentModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Handle form submission
document.getElementById('approveNSTPEnlistmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const enlistmentId = document.getElementById('approveNSTPEnlistmentId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('approveNSTPEnlistmentFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    fetch(`/nstp/${enlistmentId}/approve/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const action = formData.get('action') === 'approve' ? 'approved' : 'rejected';
            showSuccessToast(`NSTP enlistment ${action} successfully!`);
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    NSTP enlistment ${action} successfully!
                </div>
            `;

            setTimeout(() => {
                closeApproveNSTPEnlistmentModal();
                window.location.reload();
            }, 1500);
        }
    })
    .catch(error => {
        console.error('Error:', error);
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
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

// ------------------------------------------------ View Function ------------------------------------------------------
function openNSTPStudentViewModal(studentId) {
    // Show loading state
    const modal = document.getElementById('nstpStudentViewModal');
    modal.classList.add('loading');

    fetch(`/api/nstp/students/${studentId}/`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Failed to load NSTP student details');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const student = data.nstp_student;

                // Set header information
                document.getElementById('nstpStudentNumber').textContent = `Student No: ${student.student_number || 'N/A'}`;
                document.getElementById('studentFullName').textContent = student.full_name;
                document.getElementById('studentFirstName').textContent = `First Name: ${student.first_name}`;
                document.getElementById('studentMiddleName').textContent = student.middle_name ? `Middle Name: ${student.middle_name}` : '';
                document.getElementById('studentLastName').textContent = `Last Name: ${student.last_name}`;

                // Set semester and academic year tags
                document.getElementById('nstpSemester').textContent = student.semester;
                document.getElementById('nstpAcademicYear').textContent = student.academic_year;

                // Personal Information
                document.getElementById('nstpStudentNumberDetail').textContent = student.student_number || 'N/A';
                document.getElementById('nstpProgram').textContent = student.program || 'N/A';
                document.getElementById('nstpGender').textContent = student.gender || 'N/A';
                document.getElementById('nstpBirthDate').textContent = student.birth_date || 'N/A';
                document.getElementById('nstpContactNumber').textContent = student.contact_number || 'N/A';
                document.getElementById('nstpEmail').textContent = student.email_address || 'N/A';

                // Address Information
                document.getElementById('nstpFullAddress').textContent = student.full_address || 'No address provided';
                document.getElementById('nstpStreet').textContent = student.street_or_barangay || 'N/A';
                document.getElementById('nstpCity').textContent = student.municipality_or_city || 'N/A';
                document.getElementById('nstpProvince').textContent = student.province || 'N/A';

                // NSTP Information
                document.getElementById('nstpSemesterDetail').textContent = student.semester;
                document.getElementById('nstpAcademicYearDetail').textContent = student.academic_year;

                // System Information
                document.getElementById('nstpCreatedAt').textContent = formatDateTime(student.created_at);
                document.getElementById('nstpUpdatedAt').textContent = formatDateTime(student.updated_at);
                document.getElementById('nstpUsername').textContent = student.username || 'N/A';

                document.getElementById('nstpApprovalStatus').textContent = student.approval_status || 'N/A';
                document.getElementById('nstpIsArchived').textContent = student.is_archived ? 'Yes' : 'No';
                document.getElementById('nstpArchivedAt').textContent = student.archived_at ? formatDateTime(student.archived_at) : 'N/A';
                document.getElementById('nstpArchivedBy').textContent = student.archived_by || 'N/A';
                document.getElementById('nstpRemarks').textContent = student.remarks || 'No remarks provided';

                // Open modal
                modal.classList.remove('loading');
                modal.classList.add('active');
                document.body.classList.add('no-scroll');
            } else {
                throw new Error(data.error || 'Failed to load NSTP student details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'An error occurred while loading NSTP student details', 'error');
            modal.classList.remove('loading');
        });
}

// Close NSTP Student View Modal
function closeNSTPStudentViewModal() {
    const modal = document.getElementById('nstpStudentViewModal');
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

// Add event listeners for view buttons
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-nstp-student')) {
            const button = e.target.closest('.view-nstp-student');
            const studentId = button.getAttribute('data-student-id');
            openNSTPStudentViewModal(studentId);
        }
    });
});

// ----------------------------------------------- Edit Function -------------------------------------------------------
function openNSTPEditModal(studentId) {
    fetch(`/nstp/students/${studentId}/edit/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const nstpStudent = data.nstp_student;
        const modal = document.getElementById('nstpEditModal');
        const form = document.getElementById('nstpEditForm');

        // Set form values
        document.getElementById('editNSTPId').value = nstpStudent.id;
        document.getElementById('editNSTPStudentNumber').value = nstpStudent.student_number;
        document.getElementById('editNSTPLastName').value = nstpStudent.last_name;
        document.getElementById('editNSTPFirstName').value = nstpStudent.first_name;
        document.getElementById('editNSTPMiddleName').value = nstpStudent.middle_name || '';
        document.getElementById('editNSTPProgram').value = nstpStudent.program || '';
        document.getElementById('editNSTPGender').value = nstpStudent.gender || '';
        document.getElementById('editNSTPBirthDate').value = nstpStudent.birth_date || '';
        document.getElementById('editNSTPContactNumber').value = nstpStudent.contact_number || '';
        document.getElementById('editNSTPEmail').value = nstpStudent.email_address || '';
        document.getElementById('editNSTPStreet').value = nstpStudent.street_or_barangay || '';
        document.getElementById('editNSTPCity').value = nstpStudent.municipality_or_city || '';
        document.getElementById('editNSTPProvince').value = nstpStudent.province || '';
        document.getElementById('editNSTPSemester').value = nstpStudent.semester;
        document.getElementById('editNSTPAcademicYear').value = nstpStudent.academic_year;
        document.getElementById('editNSTPApprovalStatus').value = nstpStudent.approval_status || 'pending';
        document.getElementById('editNSTPRemarks').value = nstpStudent.remarks || '';
        document.getElementById('editNSTPIsArchived').checked = nstpStudent.is_archived;
        updateToggleText(document.getElementById('editNSTPIsArchived'));

        // Hide approval section if user is a student
        const approvalSection = document.querySelector('.form-section:has(#editNSTPApprovalStatus)');
        if (data.hide_approval_section && approvalSection) {
            approvalSection.style.display = 'none';
        } else if (approvalSection) {
            approvalSection.style.display = 'block';
        }

        // Update form action
        form.action = `/nstp/students/${studentId}/edit/`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    })
    .catch(error => {
        showErrorToast('Failed to load NSTP student details. Please try again.');
        console.error('Error:', error);
    });
}

// Close edit modal
function closeNSTPEditModal() {
    const modal = document.getElementById('nstpEditModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('nstpEditFormResponse').innerHTML = '';
}

// Handle form submission
document.getElementById('nstpEditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('nstpEditFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    document.querySelectorAll('#nstpEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#nstpEditModal .error-message').forEach(el => el.remove());

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
            showSuccessToast('NSTP enlistment updated successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    NSTP enlistment updated successfully! Page will refresh...
                </div>
            `;

            // Close the modal first
            closeNSTPEditModal();

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            if (data.errors) {
                for (const field in data.errors) {
                    const input = form.querySelector(`[name="${field}"]`);
                    if (input) {
                        input.classList.add('error');
                        const errorElement = document.createElement('div');
                        errorElement.className = 'error-message';
                        errorElement.textContent = data.errors[field];
                        input.parentNode.insertBefore(errorElement, input.nextSibling);
                    }
                }
            }
            if (data.message) {
                showErrorToast(data.message);
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorToast(error.message || 'An unexpected error occurred while updating NSTP enlistment');
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
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

// Helper function to update toggle switch text
function updateToggleText(toggleElement) {
    const labelText = toggleElement.nextElementSibling.nextElementSibling;
    labelText.textContent = toggleElement.checked ? 'Archived' : 'Not Archived';
}

// Add event listeners for edit buttons
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-enlistment')) {
            const button = e.target.closest('.edit-enlistment');
            const studentId = button.getAttribute('data-student-id');
            openNSTPEditModal(studentId);
        }
    });
});

// ------------------------------------------------- Archive Function --------------------------------------------------
function openArchiveNSTPEnlistmentModal(enlistmentId) {
    console.log("Opening archive modal for enlistment ID:", enlistmentId);

    const modal = document.getElementById('nstpEnlistmentArchiveModal');
    document.getElementById('archiveEnlistmentId').value = enlistmentId;

    // Show loading state
    const detailIds = [
        'archiveStudentNumber',
        'archiveProgram',
        'archiveSemester',
        'archiveCreatedAt',
    ];

    detailIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'Loading...';
    });

    // Clear previous messages
    const formResponse = document.getElementById('archiveNSTPEnlistmentFormResponse');
    if (formResponse) formResponse.innerHTML = '';

    // Fetch data
    fetch(`/nstp/enlistments/${enlistmentId}/archive/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Received data:", data); // Debug
        if (data.success && data.enlistment) {
            // Update fields
            const enlistment = data.enlistment;
            document.getElementById('archiveStudentNumber').textContent = enlistment.student_number || '-';
            document.getElementById('archiveProgram').textContent = enlistment.program || '-';
            document.getElementById('archiveSemester').textContent = enlistment.semester || '-';
            document.getElementById('archiveCreatedAt').textContent = enlistment.created_at || '-';

            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            throw new Error(data.error || 'Invalid data format');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        detailIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = 'Error loading';
        });

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const formResponse = document.getElementById('archiveNSTPEnlistmentFormResponse');
        if (formResponse) {
            formResponse.innerHTML = `
                <div class="response-message response-error">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                        <p>${error.message || 'Failed to load details'}</p>
                        <p class="small-text">You can still proceed with archiving</p>
                    </div>
                </div>
            `;
        }
    });
}

function closeNSTPEnlistmentArchiveModal() {
    const modal = document.getElementById('nstpEnlistmentArchiveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ------------------------------------------------- Toast Notification --------------------------------------------------
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    let icon;
    if (type === 'success') {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`;
    } else {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <div class="toast-close" onclick="this.parentElement.remove()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function handleResponse(response) {
    if (!response.ok) {
        return response.json().then(err => {
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
        });
    }
    return response.json();
}

// ------------------------------------------------- Form Submission --------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('nstpEnlistmentArchiveForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const formResponse = document.getElementById('archiveNSTPEnlistmentFormResponse');
            const enlistmentId = document.getElementById('archiveEnlistmentId').value;

            submitBtn.classList.add('is-loading');
            if (formResponse) formResponse.innerHTML = '';

            fetch(`/nstp/enlistments/${enlistmentId}/archive/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                }
            })
            .then(handleResponse)
            .then(data => {
                if (data.success) {
                    showToast('Enlistment archived successfully!', 'success');
                    setTimeout(() => {
                        closeNSTPEnlistmentArchiveModal();
                        window.location.reload();
                    }, 1500);
                } else {
                    throw new Error(data.error || 'Archive failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast(error.message || 'Failed to archive enlistment', 'error');
            })
            .finally(() => {
                submitBtn.classList.remove('is-loading');
            });
        });
    }
});

// ----------------------------------------- Search and Sorting Function -----------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('nstp-search');
    const semesterSort = document.getElementById('semester-sort');
    const nstpContainer = document.getElementById('nstp-enlistments-container');
    const nstpLoading = document.getElementById('nstp-loading');

    let currentSortColumn = 'created_at';
    let currentSortDirection = 'desc';
    let currentPage = 1;
    let isLoading = false;
    let isNSTPSectionActive = window.location.search.includes('tab=nstp');

    // Function to show NSTP loading state
    function showNSTPLoading() {
        nstpLoading.style.display = 'flex';
        nstpContainer.classList.add('nstp-loading-active');
    }

    // Function to hide NSTP loading state
    function hideNSTPLoading() {
        nstpLoading.style.display = 'none';
        nstpContainer.classList.remove('nstp-loading-active');
    }

    // Function to fetch filtered data via AJAX
    function fetchFilteredNSTPData() {
        if (isLoading) return;

        isLoading = true;
        showNSTPLoading();

        const searchTerm = searchInput.value;
        const semesterFilter = semesterSort.value;

        const params = new URLSearchParams({
            'get_filtered_nstp': '1',
            'search': searchTerm,
            'semester': semesterFilter,
            'sort': currentSortColumn,
            'direction': currentSortDirection,
            'page': currentPage
        });

        fetch(`?${params.toString()}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            updateNSTPTable(data);
            isLoading = false;
            hideNSTPLoading();

            // Update browser URL only if we're in the NSTP section
            if (isNSTPSectionActive) {
                updateBrowserURL();
            }
        })
        .catch(error => {
            console.error('Error fetching NSTP data:', error);
            isLoading = false;
            hideNSTPLoading();

            // Show error message
            const tableBody = nstpContainer.querySelector('tbody');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-table">
                        <div class="empty-state">
                            <i class='bx bx-error'></i>
                            <p>Error loading data. Please try again.</p>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    // Function to update browser URL without reloading
    function updateBrowserURL() {
        const searchTerm = searchInput.value;
        const semesterFilter = semesterSort.value;

        const params = new URLSearchParams(window.location.search);

        // Only update if we're in the NSTP section
        if (!isNSTPSectionActive) return;

        // Update or add NSTP-specific parameters
        if (searchTerm) {
            params.set('nstp_search', searchTerm);
        } else {
            params.delete('nstp_search');
        }

        if (semesterFilter) {
            params.set('nstp_semester', semesterFilter);
        } else {
            params.delete('nstp_semester');
        }

        params.set('nstp_sort', currentSortColumn);
        params.set('nstp_direction', currentSortDirection);
        params.set('nstp_page', currentPage);

        // Update URL without reloading
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    // Function to read parameters from URL on page load
    function readURLParameters() {
        const params = new URLSearchParams(window.location.search);

        // Only read NSTP parameters if we're in the NSTP section
        if (!isNSTPSectionActive) return;

        if (params.has('nstp_search')) {
            searchInput.value = params.get('nstp_search');
        }

        if (params.has('nstp_semester')) {
            semesterSort.value = params.get('nstp_semester');
        }

        if (params.has('nstp_sort')) {
            currentSortColumn = params.get('nstp_sort');
        }

        if (params.has('nstp_direction')) {
            currentSortDirection = params.get('nstp_direction');
        }

        if (params.has('nstp_page')) {
            currentPage = parseInt(params.get('nstp_page'));
        }

        // Update sort indicators based on URL parameters
        updateSortIndicators();
    }

    // Function to update sort indicators based on current sort settings
    function updateSortIndicators() {
        const sortableHeaders = nstpContainer.querySelectorAll('th[data-sort]');
        sortableHeaders.forEach(header => {
            const icon = header.querySelector('i');
            if (header.dataset.sort === currentSortColumn) {
                icon.className = currentSortDirection === 'asc' ? 'bx bx-sort-up' : 'bx bx-sort-down';
            } else {
                icon.className = 'bx bx-sort';
            }
        });
    }

    // Function to update the table with new data
    function updateNSTPTable(data) {
        const tableBody = nstpContainer.querySelector('tbody');
        const paginationContainer = nstpContainer.querySelector('.pagination-container');

        // Update table rows
        if (data.nstp_enlistments && data.nstp_enlistments.length > 0) {
            tableBody.innerHTML = data.nstp_enlistments.map(enlistment => `
                <tr>
                    <td>${enlistment.student_number}</td>
                    <td>${enlistment.last_name}, ${enlistment.first_name}</td>
                    <td>${enlistment.program}</td>
                    <td>${enlistment.semester}</td>
                    <td>
                        <span class="status-badge ${getStatusClass(enlistment.approval_status)}" data-status="${enlistment.approval_status}">
                            ${enlistment.approval_status_display}
                        </span>
                    </td>
                    <td>${enlistment.created_at}</td>
                    <td class="actions">
                        ${enlistment.can_approve && enlistment.approval_status !== 'approved' ? `
                            <button class="btn-action approve-enlistment btn-icon" title="Approve" onclick="openApproveNSTPEnlistmentModal('${enlistment.id}', 'approve')">
                                <i class='bx bx-check'></i>
                            </button>
                        ` : ''}

                        <button class="btn-icon view view-nstp-student" title="View" data-student-id="${enlistment.id}">
                            <i class="ri-eye-fill"></i>
                        </button>

                        ${enlistment.can_edit ? `
                            <button class="btn-icon edit-enlistment" title="Edit" data-student-id="${enlistment.id}">
                                <i class='bx bx-edit'></i>
                            </button>
                        ` : ''}

                        ${enlistment.can_archive ? `
                            <button class="btn-icon archive-enlistment" title="Archive" onclick="openArchiveNSTPEnlistmentModal('${enlistment.id}')">
                                <i class='bx bxs-archive'></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-table">
                        <div class="empty-state">
                            <i class='bx bx-search-alt'></i>
                            <p>No NSTP enlistments found</p>
                            <button class="clear-filters-btn" onclick="clearNSTPFilters()">Clear filters</button>
                        </div>
                    </td>
                </tr>
            `;
        }

        // Update pagination
        if (data.pagination) {
            paginationContainer.innerHTML = `
                <div class="pagination-info">
                    Showing ${data.pagination.start_index} to ${data.pagination.end_index} of ${data.pagination.total_count} entries
                </div>
                <div class="pagination-controls">
                    ${data.pagination.has_previous ? `
                        <a href="#" class="pagination-btn first-page" title="First Page" data-page="1">
                            <i class='bx bx-chevrons-left'></i>
                        </a>
                        <a href="#" class="pagination-btn prev-page" title="Previous Page" data-page="${data.pagination.current_page - 1}">
                            <i class='bx bx-chevron-left'></i>
                        </a>
                    ` : `
                        <span class="pagination-btn first-page disabled" title="First Page">
                            <i class='bx bx-chevrons-left'></i>
                        </span>
                        <span class="pagination-btn prev-page disabled" title="Previous Page">
                            <i class='bx bx-chevron-left'></i>
                        </span>
                    `}

                    <div class="page-numbers">
                        ${generatePageNumbers(data.pagination.current_page, data.pagination.num_pages)}
                    </div>

                    ${data.pagination.has_next ? `
                        <a href="#" class="pagination-btn next-page" title="Next Page" data-page="${data.pagination.current_page + 1}">
                            <i class='bx bx-chevron-right'></i>
                        </a>
                        <a href="#" class="pagination-btn last-page" title="Last Page" data-page="${data.pagination.num_pages}">
                            <i class='bx bx-chevrons-right'></i>
                        </a>
                    ` : `
                        <span class="pagination-btn next-page disabled" title="Next Page">
                            <i class='bx bx-chevron-right'></i>
                        </span>
                        <span class="pagination-btn last-page disabled" title="Last Page">
                            <i class='bx bx-chevrons-right'></i>
                        </span>
                    `}
                </div>
            `;

            // Add event listeners to pagination buttons
            const paginationButtons = paginationContainer.querySelectorAll('a.pagination-btn');
            paginationButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    currentPage = parseInt(this.getAttribute('data-page'));
                    fetchFilteredNSTPData();
                });
            });
        }
    }

    // Helper function to generate page numbers
    function generatePageNumbers(currentPage, totalPages) {
        let pages = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                pages += `<span class="pagination-btn current-page active">${i}</span>`;
            } else {
                pages += `<a href="#" class="pagination-btn page-number" data-page="${i}">${i}</a>`;
            }
        }

        return pages;
    }

    // Helper function to get status class
    function getStatusClass(status) {
        switch(status) {
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            default: return 'status-pending';
        }
    }

    // Function to clear filters
    function clearNSTPFilters() {
        searchInput.value = '';
        semesterSort.value = '';
        currentPage = 1;
        fetchFilteredNSTPData();
    }

    // Event listeners
    searchInput.addEventListener('input', debounce(() => {
        currentPage = 1;
        fetchFilteredNSTPData();
    }, 300));

    semesterSort.addEventListener('change', () => {
        currentPage = 1;
        fetchFilteredNSTPData();
    });

    // Sortable headers click event
    const sortableHeaders = nstpContainer.querySelectorAll('th[data-sort]');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;

            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }

            // Update sort indicators
            updateSortIndicators();

            fetchFilteredNSTPData();
        });
    });

    const originalPaginationLinks = nstpContainer.querySelectorAll('.pagination-container a[href*="nstp_page"]');
    originalPaginationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Extract page number from href
            const url = new URL(this.href);
            const pageParam = url.searchParams.get('nstp_page');
            if (pageParam) {
                currentPage = parseInt(pageParam);
                fetchFilteredNSTPData();
            }
        });
    });

    // Debounce function to limit API calls
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

    // Initialize on page load
    readURLParameters();
    fetchFilteredNSTPData();
});

// -------------------------------------- Exporting Data (Spreadsheet/Excel) -------------------------------------------
// Open the export modal
function openNSTPExportModal() {
    const modal = document.getElementById('nstpExportModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close the export modal
function closeNSTPExportModal() {
    const modal = document.getElementById('nstpExportModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Handle export form submission
document.getElementById('nstpExportForm').addEventListener('submit', function(e) {
    e.preventDefault();
    exportNSTPToExcel();
});

function exportNSTPToExcel() {
    const exportBtn = document.querySelector('#nstpExportForm button[type="submit"]');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<i class="bx bx-loader-circle bx-spin"></i> Exporting...';
    exportBtn.disabled = true;

    const formResponse = document.getElementById('nstpExportFormResponse');
    formResponse.innerHTML = '';

    // Get filter parameters
    const title = document.getElementById('exportTitle').value;
    const semester = document.getElementById('exportSemester').value;
    const academicYear = document.getElementById('exportAcademicYear').value;
    const includeSearch = document.getElementById('exportIncludeSearch').checked;

    // Validate academic year format if provided
    if (academicYear && !/^\d{4}-\d{4}$/.test(academicYear)) {
        formResponse.innerHTML = `
            <div class="response-message response-error">
                <i class='bx bx-error-circle'></i>
                Please enter academic year in format YYYY-YYYY (e.g., 2024-2025)
            </div>
        `;
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
        return;
    }

    const searchTerm = includeSearch ? document.getElementById('nstp-search').value : '';
    const semesterFilter = includeSearch ? document.getElementById('semester-sort').value : '';

    fetch('/nstp/export-template/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'export_title': title || 'Title',
            'search': searchTerm,
            'semester': semesterFilter,
            'academic_year': academicYear,
            'export_semester': semester,
            'include_search': includeSearch
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Export failed');
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Generate filename based on selected filters
        let filename = "NSTP_Enrollment";
        if (semester) filename += `_${semester.replace(' ', '_')}`;
        if (academicYear) filename += `_${academicYear.replace('-', '_')}`;
        if (!semester && !academicYear) filename += "_All_Records";
        filename += ".xlsx";

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showSuccessToast('Export completed successfully!');
        closeNSTPExportModal();
    })
    .catch(error => {
        console.error('Export error:', error);
        formResponse.innerHTML = `
            <div class="response-message response-error">
                <i class='bx bx-error-circle'></i>
                ${error.message || 'Failed to export data. Please try again.'}
            </div>
        `;
    })
    .finally(() => {
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
    });
}