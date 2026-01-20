// ------------------------------------------------ Approve Function ---------------------------------------------------
function openApproveScholarshipApplicationModal(applicationId) {
    fetch(`/scholarships/applications/${applicationId}/edit/`, {
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
            const application = data.application;
            const modal = document.getElementById('approveScholarshipApplicationModal');

            // Set application details
            document.getElementById('approveApplicationId').value = application.id;
            document.getElementById('approveApplicationStudentName').textContent = application.student_name;
            document.getElementById('approveApplicationStudentNumber').textContent = application.student_number;
            document.getElementById('approveApplicationScholarship').textContent = application.scholarship_name;
            document.getElementById('approveApplicationDate').textContent = application.application_date;

            // Set status badge
            const statusBadge = document.getElementById('approveApplicationCurrentStatus');
            statusBadge.textContent = application.status.replace(/_/g, ' ');
            statusBadge.setAttribute('data-status', application.status);

            // Set document links
            document.getElementById('approveApplicationFormName').textContent = application.application_form_name;
            document.getElementById('approveApplicationCogName').textContent = application.cog_name;
            document.getElementById('approveApplicationCorName').textContent = application.cor_name;
            document.getElementById('approveApplicationIdPhotoName').textContent = application.id_photo_name;

            document.getElementById('approveApplicationFormLink').href = application.application_form_url;
            document.getElementById('approveApplicationCogLink').href = application.cog_url;
            document.getElementById('approveApplicationCorLink').href = application.cor_url;
            document.getElementById('approveApplicationIdPhotoLink').href = application.id_photo_url;

            // Handle other documents
            if (application.other_documents_url) {
                document.getElementById('approveApplicationOtherDocsName').textContent = application.other_documents_name;
                document.getElementById('approveApplicationOtherDocsLink').href = application.other_documents_url;
            } else {
                document.getElementById('approveApplicationOtherDocsName').textContent = 'No file uploaded';
                document.getElementById('approveApplicationOtherDocsLink').href = '#';
                document.getElementById('approveApplicationOtherDocsLink').onclick = (e) => e.preventDefault();
            }

            // Reset form
            document.getElementById('approveScholarshipApplicationForm').reset();
            document.getElementById('approveApplicationFormResponse').innerHTML = '';

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            showErrorToast('Failed to load application details: ' + (data.error || 'Unknown error'));
            console.error('Failed to fetch application details:', data.error);
        }
    })
    .catch(error => {
        showErrorToast('Failed to load application details. Please try again.');
        console.error('Error fetching application details:', error);
    });
}

// Close the approve modal
function closeApproveScholarshipApplicationModal() {
    const modal = document.getElementById('approveScholarshipApplicationModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Handle form submission
document.getElementById('approveScholarshipApplicationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const applicationId = document.getElementById('approveApplicationId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('approveApplicationFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    fetch(`/scholarships/applications/${applicationId}/approve/`, {
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
            const decision = formData.get('decision');
            const action = decision === 'approved' ? 'approved' : 'rejected';

            showSuccessToast(`Application ${action} successfully!`);
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Application ${action} successfully! The student has been notified by email.
                </div>
            `;

            setTimeout(() => {
                closeApproveScholarshipApplicationModal();
                window.location.reload();
            }, 1500);
        } else {
            if (data.message) {
                showErrorToast(data.message);
            }
            formResponse.innerHTML = `
                <div class="response-message response-error">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    ${data.message || 'An error occurred while processing your request'}
                </div>
            `;
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

// --------------------------------------------- Edit Scholarship Application Functions --------------------------------
function openScholarshipApplicationEditModal(applicationId) {
    fetch(`/scholarships/applications/${applicationId}/edit/`, {
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
            const application = data.application;
            const modal = document.getElementById('scholarshipApplicationEditModal');
            const form = document.getElementById('scholarshipApplicationEditForm');

            // Set form values
            document.getElementById('editApplicationId').value = application.id;

            // Set student information (read-only)
            document.getElementById('editApplicationStudentDisplay').textContent = application.student_name;
            document.getElementById('editApplicationStudentNumber').textContent = application.student_number || 'Not provided';
            document.getElementById('editApplicationCourse').textContent = application.course || 'Not provided';
            document.getElementById('editApplicationYearLevel').textContent = application.year_level || 'Not provided';
            document.getElementById('editApplicationSection').textContent = application.section || 'Not provided';

            // Set editable fields
            document.getElementById('editApplicationScholarship').value = application.scholarship_id;
            document.getElementById('editApplicationStatus').value = application.status;
            document.getElementById('editApplicationNotes').value = application.notes || '';

            // Set document info
            document.getElementById('editApplicationFormFilename').textContent = application.application_form_name;
            document.getElementById('editApplicationCogFilename').textContent = application.cog_name;
            document.getElementById('editApplicationCorFilename').textContent = application.cor_name;
            document.getElementById('editApplicationIdPhotoFilename').textContent = application.id_photo_name;

            // Set document links
            document.getElementById('editApplicationFormLink').href = application.application_form_url;
            document.getElementById('editApplicationCogLink').href = application.cog_url;
            document.getElementById('editApplicationCorLink').href = application.cor_url;
            document.getElementById('editApplicationIdPhotoLink').href = application.id_photo_url;

            // Handle other documents
            if (application.other_documents_url) {
                document.getElementById('editApplicationOtherDocsFilename').textContent = application.other_documents_name;
                document.getElementById('editApplicationOtherDocsLink').href = application.other_documents_url;
            } else {
                document.getElementById('editApplicationOtherDocsFilename').textContent = 'No file uploaded';
                document.getElementById('editApplicationOtherDocsLink').href = '#';
            }

            // Populate scholarship dropdown
            const scholarshipSelect = document.getElementById('editApplicationScholarship');
            scholarshipSelect.innerHTML = '<option value="">Select scholarship</option>';
            data.scholarships.forEach(scholarship => {
                const option = document.createElement('option');
                option.value = scholarship.id;
                option.textContent = scholarship.name;
                scholarshipSelect.appendChild(option);
            });
            scholarshipSelect.value = application.scholarship_id;

            // Set up file input change handlers
            setupFileInputHandler('editApplicationFormInput', 'editApplicationFormFilename');
            setupFileInputHandler('editApplicationCogInput', 'editApplicationCogFilename');
            setupFileInputHandler('editApplicationCorInput', 'editApplicationCorFilename');
            setupFileInputHandler('editApplicationIdPhotoInput', 'editApplicationIdPhotoFilename');
            setupFileInputHandler('editApplicationOtherDocsInput', 'editApplicationOtherDocsFilename');

            form.action = `/scholarships/applications/${applicationId}/edit/`;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            showErrorToast('Failed to load application details: ' + (data.error || 'Unknown error'));
            console.error('Failed to fetch application details:', data.error);
        }
    })
    .catch(error => {
        showErrorToast('Failed to load application details. Please try again.');
        console.error('Error fetching application details:', error);
    });
}

function setupFileInputHandler(inputId, filenameDisplayId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(filenameDisplayId);

    input.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            display.textContent = this.files[0].name;
        }
    });
}

function closeScholarshipApplicationEditModal() {
    const modal = document.getElementById('scholarshipApplicationEditModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('scholarshipApplicationEditFormResponse').innerHTML = '';

    // Reset file inputs
    ['editApplicationFormInput', 'editApplicationCogInput', 'editApplicationCorInput',
     'editApplicationIdPhotoInput', 'editApplicationOtherDocsInput'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

// Handle edit form submission
document.getElementById('scholarshipApplicationEditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('scholarshipApplicationEditFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    document.querySelectorAll('#scholarshipApplicationEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#scholarshipApplicationEditModal .error-message').forEach(el => el.remove());

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
            showSuccessToast('Application updated successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Application updated successfully! This window will close shortly...
                </div>
            `;
            setTimeout(() => {
                closeScholarshipApplicationEditModal();
                window.location.reload();
            }, 1500);
        } else {
            if (data.message) {
                showErrorToast(data.message);
            }
            showFormErrors(form, data.errors || {});
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.errors) {
            showFormErrors(form, error.errors);
        }
        showErrorToast(error.message || 'An unexpected error occurred while updating application');
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

// ------------------------------------------------- Archive Function --------------------------------------------------
function openArchiveApplicationModal(applicationId) {
    const modal = document.getElementById('scholarshipApplicationArchiveModal');
    document.getElementById('archiveApplicationId').value = applicationId;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeScholarshipApplicationArchiveModal() {
    const modal = document.getElementById('scholarshipApplicationArchiveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('archiveApplicationFormResponse').innerHTML = '';
}

// Handle archive form submission
document.getElementById('scholarshipApplicationArchiveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const applicationId = document.getElementById('archiveApplicationId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('archiveApplicationFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    fetch(`/scholarships/applications/${applicationId}/archive/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw {
                    userFriendly: true,
                    message: err.error || 'Failed to archive application'
                };
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast('Application archived successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <div>
                        <p>Application archived successfully!</p>
                        <p class="small-text">Archived at: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            `;
            setTimeout(() => {
                closeScholarshipApplicationArchiveModal();
                window.location.reload();
            }, 1500);
        } else {
            showErrorToast(data.error || 'Failed to archive application');
            showApplicationArchiveError(data.error || 'Failed to archive application');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorMessage = error.userFriendly ?
            error.message :
            'An unexpected error occurred while processing your request.';
        showErrorToast(errorMessage);
        showApplicationArchiveError(errorMessage);
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

function showApplicationArchiveError(message) {
    const formResponse = document.getElementById('archiveApplicationFormResponse');
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

// ----------------------------------------------- Export Function -----------------------------------------------------
function openExportApplicationsModal() {
    const modal = document.getElementById('exportApplicationsModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeExportApplicationsModal() {
    const modal = document.getElementById('exportApplicationsModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleExportOptions() {
    const exportOption = document.querySelector('input[name="exportOption"]:checked').value;

    // Hide all option sections first
    document.getElementById('scholarshipOptions').style.display = 'none';
    document.getElementById('scholarshipStatusOptions').style.display = 'none';

    // Show the relevant section based on selection
    if (exportOption === 'scholarship') {
        document.getElementById('scholarshipOptions').style.display = 'block';
    } else if (exportOption === 'scholarship-status') {
        document.getElementById('scholarshipStatusOptions').style.display = 'block';
    }
}

// Handle export form submission
document.getElementById('exportApplicationsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    // Show loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bx bx-loader bx-spin"></i> Exporting...';

    // Get current filters and sorting
    const searchTerm = document.getElementById('application-search')?.value || '';
    const scholarshipFilterValue = document.getElementById('scholarshipFilter')?.value || 'all';
    const statusFilterValue = document.getElementById('status-filter')?.value || 'all';
    const dateFilterValue = document.getElementById('dateFilter')?.value || 'all';

    // Get sorting information
    let currentSortColumn = 'date';
    let currentSortDirection = 'desc';

    const sortHeader = document.querySelector('th[data-sort]');
    if (sortHeader) {
        currentSortColumn = sortHeader.getAttribute('data-sort');
        const sortIcon = sortHeader.querySelector('i');
        if (sortIcon) {
            if (sortIcon.classList.contains('bx-sort-up')) {
                currentSortDirection = 'asc';
            } else if (sortIcon.classList.contains('bx-sort-down')) {
                currentSortDirection = 'desc';
            }
        }
    }

    // Add current filters to form data
    formData.append('search', searchTerm);
    formData.append('scholarship_filter', scholarshipFilterValue);
    formData.append('status_filter', statusFilterValue);
    formData.append('date_filter', dateFilterValue);
    formData.append('sort', currentSortColumn);
    formData.append('direction', currentSortDirection);

    console.log('Exporting applications with filters:', {
        search: searchTerm,
        scholarship: scholarshipFilterValue,
        status: statusFilterValue,
        date: dateFilterValue,
        sort: currentSortColumn,
        direction: currentSortDirection
    });

    // Send export request
    fetch('/scholarships/applications/export/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCSRFToken(),
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || `Export failed with status: ${response.status}`);
            });
        }

        // Check if response is a file download
        const contentType = response.headers.get('content-type');
        if (contentType && (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
                            contentType.includes('application/octet-stream'))) {
            return response.blob();
        } else {
            return response.text().then(text => {
                throw new Error(text || 'Unknown error occurred');
            });
        }
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';

        // Create filename with timestamp
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
                         String(now.getMonth() + 1).padStart(2, '0') +
                         String(now.getDate()).padStart(2, '0') + '_' +
                         String(now.getHours()).padStart(2, '0') +
                         String(now.getMinutes()).padStart(2, '0') +
                         String(now.getSeconds()).padStart(2, '0');

        const filename = `Scholarship_Applications_${timestamp}.xlsx`;

        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showSuccessToast('Export completed successfully!');
        closeExportApplicationsModal();
    })
    .catch(error => {
        console.error('Export error:', error);
        showErrorToast('Export failed: ' + error.message);
    })
    .finally(() => {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bx bx-download"></i> Export Applications';
    });
});

// Helper function to get CSRF token
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfToken) {
        return csrfToken.value;
    }

    // Alternative way to get CSRF token from cookies
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Initialize export functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to export button
    const exportBtn = document.getElementById('exportApplicationsBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', openExportApplicationsModal);
    }

    // Add event listeners to export options
    const exportOptions = document.querySelectorAll('input[name="exportOption"]');
    exportOptions.forEach(option => {
        option.addEventListener('change', toggleExportOptions);
    });

    // Close modal when clicking outside
    const modal = document.getElementById('exportApplicationsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeExportApplicationsModal();
            }
        });
    }
});