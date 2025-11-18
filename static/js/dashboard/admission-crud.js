// ----------------------------------------------------- Export Function -----------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-admission-btn');
    const exportModal = document.getElementById('exportAdmissionModal');
    const cancelExportBtn = document.getElementById('cancelAdmissionExport');
    const confirmExportBtn = document.getElementById('confirmAdmissionExport');
    const closeBtn = exportModal.querySelector('.export-modal-close');
    const exportForm = document.getElementById('exportAdmissionForm');
    const exportOptions = document.querySelectorAll('input[name="export_option"]');

    const customOptions = document.getElementById('customAdmissionOptions');

    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportModal.classList.add('active');
        });
    }

    function closeExportModal() {
        exportModal.classList.remove('active');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeExportModal);
    if (cancelExportBtn) cancelExportBtn.addEventListener('click', closeExportModal);

    window.addEventListener('click', function(event) {
        if (event.target === exportModal) {
            closeExportModal();
        }
    });

    exportOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.value === 'custom') {
                customOptions.style.display = 'block';
            } else {
                customOptions.style.display = 'none';
            }
        });
    });

    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', function() {
            const selectedOption = document.querySelector('input[name="export_option"]:checked').value;

            if (selectedOption === 'filtered') {
                const searchValue = document.getElementById('admission-search').value;
                if (searchValue) {
                    addHiddenInput(exportForm, 'search', searchValue);
                }

                const typeValue = document.getElementById('type-sort').value;
                if (typeValue) {
                    addHiddenInput(exportForm, 'student_type_filter', typeValue);
                }
            }

            this.classList.add('btn-loading');
            this.disabled = true;

            setTimeout(() => {
                exportForm.submit();
                closeExportModal();

                this.classList.remove('btn-loading');
                this.disabled = false;
            }, 500);
        });
    }

    function addHiddenInput(form, name, value) {
        const existingInput = form.querySelector(`input[name="${name}"]`);
        if (existingInput) {
            existingInput.remove();
        }

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    }
});

// ------------------------------------------------- Approve Function --------------------------------------------------
function openApproveAdmissionModal(admissionId) {
    fetch(`/admissions/${admissionId}/approve/`, {
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
            const admission = data.admission;
            const modal = document.getElementById('approveAdmissionModal');

            // Set admission ID in the hidden field
            document.getElementById('approveAdmissionId').value = admissionId;

            // Set Name details
            document.getElementById('approveAdmissionFirstName').textContent = admission.first_name || '-';
            document.getElementById('approveAdmissionLastName').textContent = admission.last_name || '-';

            // Set admission details
            document.getElementById('approveAdmissionControlNo').textContent = admission.control_no;
            document.getElementById('approveAdmissionStudentType').textContent = admission.student_type_display;
            document.getElementById('approveAdmissionCourse').textContent = admission.course || 'Not specified';

            // Set status badge
            const statusBadge = document.getElementById('approveAdmissionCurrentStatus');
            statusBadge.textContent = admission.status_display;
            statusBadge.className = 'status-badge ' + admission.status;

            // Reset form
            document.getElementById('approveAdmissionForm').reset();
            document.getElementById('approveAdmissionFormResponse').innerHTML = '';

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            showErrorToast('Failed to load admission details: ' + (data.error || 'Unknown error'));
            console.error('Failed to fetch admission details:', data.error);
        }
    })
    .catch(error => {
        showErrorToast('Failed to load admission details. Please try again.');
        console.error('Error fetching admission details:', error);
    });
}

// Close the approve modal
function closeApproveAdmissionModal() {
    const modal = document.getElementById('approveAdmissionModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Handle form submission
document.getElementById('approveAdmissionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const admissionId = document.getElementById('approveAdmissionId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('approveAdmissionFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    fetch(`/admissions/${admissionId}/approve/`, {
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
                // Handle the requirements not complete case
                if (response.status === 400 && err.remarks) {
                    // Update the status badge and show the requirements
                    const statusBadge = document.getElementById('approveAdmissionCurrentStatus');
                    statusBadge.textContent = err.status.replace(/_/g, ' ');
                    statusBadge.className = 'status-badge ' + err.status;

                    // Show the missing requirements
                    formResponse.innerHTML = `
                        <div class="response-message response-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            ${err.message}
                            <div class="missing-requirements">${err.remarks.replace(/\n/g, '<br>')}</div>
                        </div>
                    `;
                }
                throw err;
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast('Admission approved successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Admission approved successfully!
                </div>
            `;

            setTimeout(() => {
                closeApproveAdmissionModal();
                window.location.reload();
            }, 1500);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.message !== 'Cannot approve admission with incomplete requirements') {
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

// ------------------------------------------------ View Function ------------------------------------------------------
function openAdmissionViewModal(admissionId) {
    // Show loading state
    const modal = document.getElementById('admissionViewModal');
    modal.classList.add('loading');

    fetch(`/api/admissions/${admissionId}/`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Failed to load admission details');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const admission = data.admission;

                // Set basic information
                document.getElementById('admissionControlNo').textContent = `Control No: ${admission.control_no}`;

                // Set student name information
                if (admission.student_name) {
                    document.getElementById('studentFullName').textContent = admission.student_name.full_name;
                    document.getElementById('studentFirstName').textContent = `First Name: ${admission.student_name.first_name}`;
                    document.getElementById('studentLastName').textContent = `Last Name: ${admission.student_name.last_name}`;
                    document.querySelector('.student-name-section').style.display = 'block';
                } else {
                    document.querySelector('.student-name-section').style.display = 'none';
                }

                document.getElementById('admissionStudentType').textContent = admission.student_type;
                document.getElementById('admissionType').textContent = admission.student_type;

                // FIXED: Properly display course information
                if (admission.course) {
                    // Use the full_display property if available, otherwise use name
                    const courseDisplay = admission.course.full_display || admission.course.name;
                    document.getElementById('admissionCourse').textContent = courseDisplay;
                    document.getElementById('admissionCourseDetail').textContent = courseDisplay;
                } else {
                    document.getElementById('admissionCourse').textContent = 'Not specified';
                    document.getElementById('admissionCourseDetail').textContent = 'Not specified';
                }

                // Set status
                const statusBadge = document.getElementById('admissionStatus');
                statusBadge.textContent = admission.status;
                statusBadge.className = 'status-badge ' + admission.status_code;

                document.getElementById('admissionStatusDetail').textContent = admission.status;

                // Set dates
                document.getElementById('admissionCreatedAt').textContent = formatDateTime(admission.created_at);
                document.getElementById('admissionUpdatedAt').textContent = formatDateTime(admission.updated_at);

                // Set remarks or show placeholder if empty
                document.getElementById('admissionRemarks').textContent = admission.remarks || 'No remarks available';

                // Handle strand display
                const strandContainer = document.getElementById('admissionStrandContainer');
                const strandElement = document.getElementById('admissionStrand');
                if (admission.strand) {
                    strandElement.textContent = admission.strand;
                    strandContainer.style.display = 'flex';
                } else {
                    strandContainer.style.display = 'none';
                }

                // Handle admission portal registration status
                const portalRegIcon = document.getElementById('portalRegIcon');
                portalRegIcon.className = admission.admission_portal_registration ?
                    'bx bx-check-circle success' : 'bx bx-x-circle error';

                // Show/hide sections based on student type
                document.getElementById('grade12Requirements').style.display = 'none';
                document.getElementById('shsGraduateRequirements').style.display = 'none';
                document.getElementById('transfereeRequirements').style.display = 'none';

                if (admission.student_type_code === 'current_grade12') {
                    // Current Grade 12 requirements
                    document.getElementById('grade12Requirements').style.display = 'block';

                    // Grade 11 Report Card
                    const grade11ReportIcon = document.getElementById('grade11ReportIcon');
                    const grade11ReportLink = document.getElementById('grade11ReportLink');
                    if (admission.grade11_report_card) {
                        grade11ReportIcon.className = 'bx bx-check-circle success';
                        grade11ReportLink.href = admission.grade11_report_card.url;
                        grade11ReportLink.style.display = 'inline';
                    } else {
                        grade11ReportIcon.className = 'bx bx-x-circle error';
                        grade11ReportLink.style.display = 'none';
                    }

                    // Certificate of Enrollment
                    const enrollmentCertIcon = document.getElementById('enrollmentCertIcon');
                    const enrollmentCertLink = document.getElementById('enrollmentCertLink');
                    if (admission.certificate_of_enrollment) {
                        enrollmentCertIcon.className = 'bx bx-check-circle success';
                        enrollmentCertLink.href = admission.certificate_of_enrollment.url;
                        enrollmentCertLink.style.display = 'inline';
                    } else {
                        enrollmentCertIcon.className = 'bx bx-x-circle error';
                        enrollmentCertLink.style.display = 'none';
                    }

                } else if (admission.student_type_code === 'shs_graduate') {
                    // SHS Graduate requirements
                    document.getElementById('shsGraduateRequirements').style.display = 'block';

                    // Grade 12 Report Card
                    const grade12ReportIcon = document.getElementById('grade12ReportIcon');
                    const grade12ReportLink = document.getElementById('grade12ReportLink');
                    if (admission.grade12_report_card) {
                        grade12ReportIcon.className = 'bx bx-check-circle success';
                        grade12ReportLink.href = admission.grade12_report_card.url;
                        grade12ReportLink.style.display = 'inline';
                    } else {
                        grade12ReportIcon.className = 'bx bx-x-circle error';
                        grade12ReportLink.style.display = 'none';
                    }

                    // Form 137
                    const form137Icon = document.getElementById('form137Icon');
                    const form137Link = document.getElementById('form137Link');
                    if (admission.form137) {
                        form137Icon.className = 'bx bx-check-circle success';
                        form137Link.href = admission.form137.url;
                        form137Link.style.display = 'inline';
                    } else {
                        form137Icon.className = 'bx bx-x-circle error';
                        form137Link.style.display = 'none';
                    }

                } else if (admission.student_type_code === 'transferee') {
                    // Transferee requirements
                    document.getElementById('transfereeRequirements').style.display = 'block';

                    // Curriculum Type
                    document.getElementById('admissionCurriculumType').textContent =
                        admission.curriculum_type || 'Not specified';

                    // Semester status
                    document.getElementById('firstYearFirstSem').textContent =
                        admission.first_year_first_semester || 'Not specified';
                    document.getElementById('firstYearSecondSem').textContent =
                        admission.first_year_second_semester || 'Not specified';
                    document.getElementById('secondYearFirstSem').textContent =
                        admission.second_year_first_semester || 'Not specified';
                    document.getElementById('otherSemesterInfo').textContent =
                        admission.other_semester_info || 'None';

                    // Transcript of Grades
                    const transcriptIcon = document.getElementById('transcriptIcon');
                    const transcriptLink = document.getElementById('transcriptLink');
                    if (admission.transcript_of_grades) {
                        transcriptIcon.className = 'bx bx-check-circle success';
                        transcriptLink.href = admission.transcript_of_grades.url;
                        transcriptLink.style.display = 'inline';
                    } else {
                        transcriptIcon.className = 'bx bx-x-circle error';
                        transcriptLink.style.display = 'none';
                    }

                    // Good Moral Certificate
                    const moralCertIcon = document.getElementById('moralCertIcon');
                    const moralCertLink = document.getElementById('moralCertLink');
                    if (admission.good_moral_certificate) {
                        moralCertIcon.className = 'bx bx-check-circle success';
                        moralCertLink.href = admission.good_moral_certificate.url;
                        moralCertLink.style.display = 'inline';
                    } else {
                        moralCertIcon.className = 'bx bx-x-circle error';
                        moralCertLink.style.display = 'none';
                    }

                    // Honorable Dismissal
                    const dismissalIcon = document.getElementById('dismissalIcon');
                    const dismissalLink = document.getElementById('dismissalLink');
                    if (admission.honorable_dismissal) {
                        dismissalIcon.className = 'bx bx-check-circle success';
                        dismissalLink.href = admission.honorable_dismissal.url;
                        dismissalLink.style.display = 'inline';
                    } else {
                        dismissalIcon.className = 'bx bx-x-circle error';
                        dismissalLink.style.display = 'none';
                    }

                    // NBI/Police Clearance
                    const clearanceIcon = document.getElementById('clearanceIcon');
                    const clearanceLink = document.getElementById('clearanceLink');
                    if (admission.nbi_police_clearance) {
                        clearanceIcon.className = 'bx bx-check-circle success';
                        clearanceLink.href = admission.nbi_police_clearance.url;
                        clearanceLink.style.display = 'inline';
                    } else {
                        clearanceIcon.className = 'bx bx-x-circle error';
                        clearanceLink.style.display = 'none';
                    }
                }

                // Open modal
                modal.classList.remove('loading');
                modal.classList.add('active');
                document.body.classList.add('no-scroll');
            } else {
                throw new Error(data.error || 'Failed to load admission details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'An error occurred while loading admission details', 'error');
            modal.classList.remove('loading');
        });
}

function closeAdmissionViewModal() {
    const modal = document.getElementById('admissionViewModal');
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

// Helper function to format date/time
function formatDateTime(datetimeString) {
    if (!datetimeString) return 'N/A';
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(datetimeString).toLocaleDateString('en-US', options);
}

// Add event listeners for view buttons
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-admission')) {
            const button = e.target.closest('.view-admission');
            const admissionId = button.getAttribute('data-admission-id');
            openAdmissionViewModal(admissionId);
        }
    });

    // Also add click event for the modal overlay
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeAdmissionViewModal();
        }
    });
});

// -------------------------------------------------- Edit Function ----------------------------------------------------
function openAdmissionEditModal(admissionId) {
    fetch(`/admissions/${admissionId}/edit/`, {
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
        if (data.success) {
            const admission = data.admission;
            const modal = document.getElementById('admissionEditModal');
            const form = document.getElementById('admissionEditForm');

            // Set basic form values
            document.getElementById('editAdmissionId').value = admission.id;
            document.getElementById('editAdmissionControlNo').value = admission.control_no;
            document.getElementById('editAdmissionStudentType').value = admission.student_type;

            // Populate course dropdown
            const courseSelect = document.getElementById('editAdmissionCourse');
            courseSelect.innerHTML = '<option value="">Select a course</option>';

            if (data.courses && data.courses.length > 0) {
                data.courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    courseSelect.appendChild(option);
                });

                // Set selected course if available
                if (admission.course && admission.course.id) {
                    courseSelect.value = admission.course.id;
                }
            } else {
                console.warn('No courses available in response');
            }

            // Set status and remarks fields based on user type
            const statusSelect = document.getElementById('editAdmissionStatus');
            const statusDisplay = document.getElementById('editAdmissionStatusDisplay');
            const remarksTextarea = document.getElementById('editAdmissionRemarks');
            const remarksDisplay = document.getElementById('editAdmissionRemarksDisplay');

            if (statusDisplay && remarksDisplay) {
                // User type 14 (Student) - display readonly status and remarks
                statusDisplay.value = admission.status_display || admission.status || '';
                document.getElementById('editAdmissionStatus').value = admission.status;

                remarksDisplay.value = admission.remarks || '';
                document.getElementById('editAdmissionRemarks').value = admission.remarks || '';
            } else {
                // Regular users - set dropdown and textarea values
                statusSelect.value = admission.status;
                remarksTextarea.value = admission.remarks || '';
            }

            // Set other form values
            document.getElementById('editAdmissionStrand').value = admission.strand || '';
            document.getElementById('editAdmissionDate').value = admission.date || '';
            document.getElementById('editAdmissionFirstName').value = admission.first_name || '';
            document.getElementById('editAdmissionLastName').value = admission.last_name || '';

            // Set toggle switches
            document.getElementById('editAdmissionPortalRegistration').checked = admission.admission_portal_registration;
            document.getElementById('editAdmissionIsArchived').checked = admission.is_archived;
            updateToggleText(document.getElementById('editAdmissionPortalRegistration'));
            updateToggleText(document.getElementById('editAdmissionIsArchived'));

            // Show/hide transferee fields based on student type
            const transfereeFields = document.getElementById('transfereeFields');
            if (admission.student_type === 'transferee') {
                transfereeFields.style.display = 'block';
                document.getElementById('editAdmissionCurriculumType').value = admission.curriculum_type || '';
                document.getElementById('editAdmissionOtherSemesterInfo').value = admission.other_semester_info || '';

                // Set semester status fields
                if (admission.first_year_first_semester) {
                    document.querySelector('select[name="first_year_first_semester"]').value = admission.first_year_first_semester;
                }
                if (admission.first_year_second_semester) {
                    document.querySelector('select[name="first_year_second_semester"]').value = admission.first_year_second_semester;
                }
                if (admission.second_year_first_semester) {
                    document.querySelector('select[name="second_year_first_semester"]').value = admission.second_year_first_semester;
                }
            } else {
                transfereeFields.style.display = 'none';
            }

            // Initialize requirements based on student type
            updateRequirementsForStudentType(admission.student_type, admission.requirements_status);

            // Update form action
            form.action = `/admissions/${admissionId}/edit/`;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            showErrorToast('Failed to load admission details: ' + (data.error || 'Unknown error'));
            console.error('Failed to load admission details:', data);
        }
    })
    .catch(error => {
        showErrorToast('Failed to load admission details. Please try again.');
        console.error('Error fetching admission details:', error);
    });
}

// Close edit modal
function closeAdmissionEditModal() {
    const modal = document.getElementById('admissionEditModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('admissionEditFormResponse').innerHTML = '';
}

// Update requirements section based on student type
function updateRequirementsForStudentType(studentType, requirementsStatus = []) {
    const requirementsContainer = document.getElementById('requirementsContainer');
    requirementsContainer.innerHTML = '';

    let requirements = [];

    // Common requirement for all student types
    const portalRegStatus = requirementsStatus.find(req => req.field === 'admission_portal_registration') || {
        name: 'Admission Portal Registration',
        field: 'admission_portal_registration',
        completed: document.getElementById('editAdmissionPortalRegistration').checked
    };
    requirements.push(portalRegStatus);

    // Type-specific requirements
    if (studentType === 'current_grade12') {
        requirements.push(
            requirementsStatus.find(req => req.field === 'grade11_report_card') || {
                name: 'Grade 11 Report Card',
                field: 'grade11_report_card',
                completed: false,
                file_url: null
            },
            requirementsStatus.find(req => req.field === 'certificate_of_enrollment') || {
                name: 'Certificate of Enrollment',
                field: 'certificate_of_enrollment',
                completed: false,
                file_url: null
            }
        );
    } else if (studentType === 'shs_graduate') {
        requirements.push(
            requirementsStatus.find(req => req.field === 'grade12_report_card') || {
                name: 'Grade 12 Report Card',
                field: 'grade12_report_card',
                completed: false,
                file_url: null
            },
            requirementsStatus.find(req => req.field === 'form137') || {
                name: 'Form 137',
                field: 'form137',
                completed: false,
                file_url: null
            }
        );
    } else if (studentType === 'transferee') {
        requirements.push(
            requirementsStatus.find(req => req.field === 'transcript_of_grades') || {
                name: 'Transcript of Grades',
                field: 'transcript_of_grades',
                completed: false,
                file_url: null
            },
            requirementsStatus.find(req => req.field === 'good_moral_certificate') || {
                name: 'Certificate of Good Moral Character',
                field: 'good_moral_certificate',
                completed: false,
                file_url: null
            },
            requirementsStatus.find(req => req.field === 'honorable_dismissal') || {
                name: 'Honorable Dismissal',
                field: 'honorable_dismissal',
                completed: false,
                file_url: null
            },
            requirementsStatus.find(req => req.field === 'nbi_police_clearance') || {
                name: 'NBI or Police Clearance',
                field: 'nbi_police_clearance',
                completed: false,
                file_url: null
            }
        );
    }

    // Populate requirements
    requirements.forEach(req => {
        const reqElement = document.createElement('div');
        reqElement.className = 'requirement-item';

        if (req.field === 'admission_portal_registration') {
            // Handle portal registration (toggle)
            reqElement.innerHTML = `
                <div class="requirement-info">
                    <span class="requirement-name">${req.name}</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" class="toggle-checkbox"
                           name="${req.field}" ${req.completed ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label-text">${req.completed ? 'Completed' : 'Not Completed'}</span>
                </label>
            `;
        } else {
            // Handle file uploads
            const hasExistingFile = req.file_url ? true : false;
            reqElement.innerHTML = `
                <div class="requirement-info">
                    <span class="requirement-name">${req.name}</span>
                    ${hasExistingFile ? `
                        <div class="file-actions" id="file_actions_${req.field}">
                            <a href="${req.file_url}" target="_blank" class="requirement-file-link">
                                <i class='bx bx-link-external'></i> View Current File
                            </a>
                            <button type="button" class="button is-small is-danger remove-file-btn"
                                    data-field="${req.field}">
                                <i class='bx bx-trash'></i> Remove
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="file-upload-control">
                    <input type="file" name="${req.field}" id="file_${req.field}"
                           class="file-input" accept=".pdf,.jpg,.jpeg,.png">
                    <label for="file_${req.field}" class="file-label">
                        <span class="file-cta">
                            <span class="file-icon">
                                <i class='bx bx-upload'></i>
                            </span>
                            <span class="file-label-text">
                                ${hasExistingFile ? 'Replace File' : 'Upload File'}
                            </span>
                        </span>
                    </label>
                    <div class="file-preview" id="file_preview_${req.field}"></div>
                    <input type="hidden" name="remove_${req.field}" id="remove_${req.field}" value="false">
                </div>
            `;
        }

        requirementsContainer.appendChild(reqElement);
    });

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-file-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const field = this.getAttribute('data-field');
            const hiddenInput = document.getElementById(`remove_${field}`);
            const fileInput = document.getElementById(`file_${field}`);
            const filePreview = document.getElementById(`file_preview_${field}`);
            const fileActions = document.getElementById(`file_actions_${field}`);

            hiddenInput.value = 'true';
            fileInput.value = '';

            if (fileActions) fileActions.style.display = 'none';
            if (filePreview) filePreview.innerHTML = '';

            // Update status preview
            updateStatusPreview(studentType);

            showSuccessToast('File marked for removal. Upload a new file or save changes.');
        });
    });

    // Add event listeners for file inputs to show preview
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function() {
            const field = this.name;
            const file = this.files[0];
            const filePreview = document.getElementById(`file_preview_${field}`);
            const hiddenInput = document.getElementById(`remove_${field}`);
            const fileActions = document.getElementById(`file_actions_${field}`);

            // Reset remove flag if new file is selected
            hiddenInput.value = 'false';

            if (fileActions) fileActions.style.display = 'none';

            if (file) {
                if (filePreview) {
                    filePreview.innerHTML = `
                        <div class="file-preview-item">
                            <span class="file-preview-name">${file.name}</span>
                            <button type="button" class="file-preview-remove" data-field="${field}">
                                <i class='bx bx-x'></i>
                            </button>
                        </div>
                    `;

                    // Add event listener for remove button in preview
                    filePreview.querySelector('.file-preview-remove').addEventListener('click', function() {
                        const field = this.getAttribute('data-field');
                        const fileInput = document.getElementById(`file_${field}`);
                        const filePreview = document.getElementById(`file_preview_${field}`);

                        fileInput.value = '';
                        filePreview.innerHTML = '';

                        // Update status preview
                        const studentType = document.getElementById('editAdmissionStudentType').value;
                        updateStatusPreview(studentType);
                    });
                }
            } else {
                if (filePreview) filePreview.innerHTML = '';
            }

            // Update status preview
            const studentType = document.getElementById('editAdmissionStudentType').value;
            updateStatusPreview(studentType);
        });
    });

    // Setup change listeners for requirements
    setupRequirementChangeListeners();
}

// Check missing requirements based on student type
function checkMissingRequirements(studentType, formData) {
    const missingRequirements = [];

    // Check common requirement for all student types
    if (formData.get('admission_portal_registration') !== 'true') {
        missingRequirements.push("1. Admission Portal Registration not completed");
    }

    // Check type-specific requirements
    if (studentType === 'current_grade12') {
        if (!formData.get('grade11_report_card') && formData.get('remove_grade11_report_card') !== 'true') {
            missingRequirements.push("2. Grade 11 Report Card");
        }
        if (!formData.get('certificate_of_enrollment') && formData.get('remove_certificate_of_enrollment') !== 'true') {
            missingRequirements.push("3. Certificate of Enrollment");
        }
    }
    else if (studentType === 'shs_graduate') {
        if (!formData.get('grade12_report_card') && formData.get('remove_grade12_report_card') !== 'true') {
            missingRequirements.push("2. Grade 12 Report Card");
        }
        if (!formData.get('form137') && formData.get('remove_form137') !== 'true') {
            missingRequirements.push("3. Form 137");
        }
    }
    else if (studentType === 'transferee') {
        if (!formData.get('curriculum_type')) {
            missingRequirements.push("2. Curriculum Type not specified");
        }
        if (!formData.get('transcript_of_grades') && formData.get('remove_transcript_of_grades') !== 'true') {
            missingRequirements.push("3. Transcript of Grades");
        }
        if (!formData.get('good_moral_certificate') && formData.get('remove_good_moral_certificate') !== 'true') {
            missingRequirements.push("4. Certificate of Good Moral Character");
        }
        if (!formData.get('honorable_dismissal') && formData.get('remove_honorable_dismissal') !== 'true') {
            missingRequirements.push("5. Honorable Dismissal");
        }
        if (!formData.get('nbi_police_clearance') && formData.get('remove_nbi_police_clearance') !== 'true') {
            missingRequirements.push("6. NBI or Police Clearance");
        }
    }

    return missingRequirements;
}

// Update status and remarks based on missing requirements
function updateStatusAndRemarks(formData, missingRequirements) {
    if (missingRequirements.length > 0) {
        formData.set('status', 'incomplete');
        if (missingRequirements.length === 1 && missingRequirements[0].includes("Admission Portal Registration")) {
            formData.set('remarks', missingRequirements[0]);
        } else {
            formData.set('remarks', "To Follow Requirements:\n" + missingRequirements.join("\n"));
        }
    } else {
        formData.set('status', 'complete');
        formData.set('remarks', "All requirements submitted");
    }
}

// Update status preview based on current requirements
function updateStatusPreview(studentType) {
    const formData = new FormData(document.getElementById('admissionEditForm'));

    // Get current portal registration status
    const portalReg = document.getElementById('editAdmissionPortalRegistration').checked;
    formData.set('admission_portal_registration', portalReg ? 'true' : 'false');

    const missingRequirements = checkMissingRequirements(studentType, formData);

    const statusSelect = document.getElementById('editAdmissionStatus');
    const statusDisplay = document.getElementById('editAdmissionStatusDisplay');
    const remarksTextarea = document.getElementById('editAdmissionRemarks');
    const remarksDisplay = document.getElementById('editAdmissionRemarksDisplay');

    if (missingRequirements.length > 0) {
        // Update the hidden input for form submission
        if (statusSelect) statusSelect.value = 'incomplete';
        // Update the display field for student users
        if (statusDisplay) statusDisplay.value = 'Incomplete Requirements';

        const remarksText = missingRequirements.length === 1 && missingRequirements[0].includes("Admission Portal Registration")
            ? missingRequirements[0]
            : "To Follow Requirements:\n" + missingRequirements.join("\n");

        // Update remarks for regular users
        if (remarksTextarea) remarksTextarea.value = remarksText;
        // Update remarks display for student users
        if (remarksDisplay) remarksDisplay.value = remarksText;
    } else {
        // Update the hidden input for form submission
        if (statusSelect) statusSelect.value = 'complete';
        // Update the display field for student users
        if (statusDisplay) statusDisplay.value = 'Complete Requirements';

        const remarksText = "All requirements submitted";

        // Update remarks for regular users
        if (remarksTextarea) remarksTextarea.value = remarksText;
        // Update remarks display for student users
        if (remarksDisplay) remarksDisplay.value = remarksText;
    }
}

// Setup event listeners for requirement changes
function setupRequirementChangeListeners() {
    // For toggle switches
    document.querySelectorAll('.toggle-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateToggleText(this);
            const studentType = document.getElementById('editAdmissionStudentType').value;
            updateStatusPreview(studentType);
        });
    });

    // For file inputs
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function() {
            const studentType = document.getElementById('editAdmissionStudentType').value;
            updateStatusPreview(studentType);
        });
    });
}

// Handle form submission
document.getElementById('admissionEditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('admissionEditFormResponse');

    // Get toggle switch value
    const portalReg = document.getElementById('editAdmissionPortalRegistration').checked;
    formData.set('admission_portal_registration', portalReg ? 'true' : 'false');

    // Get student type to determine required fields
    const studentType = document.getElementById('editAdmissionStudentType').value;

    // Check requirements completeness and update status/remarks
    const missingRequirements = checkMissingRequirements(studentType, formData);
    updateStatusAndRemarks(formData, missingRequirements);

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    document.querySelectorAll('#admissionEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#admissionEditModal .error-message').forEach(el => el.remove());

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
            showSuccessToast('Admission application updated successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Admission application updated successfully! This window will close shortly...
                </div>
            `;

            // Update the status badge in the table
            const statusBadge = document.querySelector(`.view-admission[data-admission-id="${data.admission.id}"]`)
                              .closest('tr')
                              .querySelector('.status-badge');

            statusBadge.className = `status-badge ${data.admission.status}`;
            statusBadge.textContent = data.admission.status_display;

            setTimeout(() => {
                closeAdmissionEditModal();
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
            showErrorToast(error.message || 'An unexpected error occurred while updating admission application');
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

// Add event listener for student type change
document.getElementById('editAdmissionStudentType').addEventListener('change', function() {
    const studentType = this.value;
    const transfereeFields = document.getElementById('transfereeFields');

    if (studentType === 'transferee') {
        transfereeFields.style.display = 'block';
    } else {
        transfereeFields.style.display = 'none';
    }

    updateRequirementsForStudentType(studentType);

    updateStatusPreview(studentType);
});

// Helper function to update toggle switch text
function updateToggleText(toggleElement) {
    const labelText = toggleElement.nextElementSibling.nextElementSibling;
    labelText.textContent = toggleElement.checked ? 'Completed' : 'Not Completed';
}

// Helper function to show form errors
function showFormErrors(form, errors) {
    for (const field in errors) {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('error');
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = errors[field];
            input.parentNode.insertBefore(errorElement, input.nextSibling);
        }
    }
}

// ------------------------------------------------- Archive Function --------------------------------------------------
function openArchiveAdmissionModal(admissionId) {
    const modal = document.getElementById('admissionArchiveModal');
    document.getElementById('archiveAdmissionId').value = admissionId;

    // Show loading state for details
    const detailElements = document.querySelectorAll('.detail-value');
    detailElements.forEach(el => el.textContent = 'Loading...');

    // Clear any previous messages
    document.getElementById('archiveAdmissionFormResponse').innerHTML = '';

    // Fetch admission details before showing modal
    fetch(`/admissions/${admissionId}/archive/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch admission details');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Populate the details
            document.getElementById('archiveControlNo').textContent = data.admission.control_no;
            document.getElementById('archiveStudentName').textContent = data.admission.student_name;
            document.getElementById('archiveStudentType').textContent = data.admission.student_type;
            document.getElementById('archiveCourse').textContent = data.admission.course;
            document.getElementById('archiveStatus').textContent = data.admission.status;
            document.getElementById('archiveCreatedAt').textContent = data.admission.created_at;
            document.getElementById('archiveRemarks').textContent = data.admission.remarks;

            // Now show the modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            throw new Error(data.error || 'Failed to load admission details');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorToast('Failed to load admission details');
        detailElements.forEach(el => el.textContent = 'Error loading data');

        // Still show the modal but with error state
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        showAdmissionArchiveError('Failed to load application details. You can still proceed with archiving.');
    });
}

function closeAdmissionArchiveModal() {
    const modal = document.getElementById('admissionArchiveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('archiveAdmissionFormResponse').innerHTML = '';
}

// Handle archive form submission
document.getElementById('admissionArchiveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const admissionId = document.getElementById('archiveAdmissionId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('archiveAdmissionFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    fetch(`/admissions/${admissionId}/archive/`, {
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
                    message: err.error || 'Failed to archive admission application'
                };
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast('Admission application archived successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <div>
                        <p>Admission application archived successfully!</p>
                        <p class="small-text">Archived by: ${data.archived_by || 'System'}</p>
                        <p class="small-text">Archived at: ${data.archived_at || new Date().toLocaleString()}</p>
                    </div>
                </div>
            `;
            setTimeout(() => {
                closeAdmissionArchiveModal();
                window.location.reload();
            }, 1500);
        } else {
            showErrorToast(data.error || 'Failed to archive admission application');
            showAdmissionArchiveError(data.error || 'Failed to archive admission application');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorMessage = error.userFriendly ?
            error.message :
            'An unexpected error occurred while processing your request.';
        showErrorToast(errorMessage);
        showAdmissionArchiveError(errorMessage);
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

function showAdmissionArchiveError(message) {
    const formResponse = document.getElementById('archiveAdmissionFormResponse');
    formResponse.innerHTML = `
        <div class="response-message response-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
                <p>${message}</p>
                ${message.includes('load') ? '<p class="small-text">You can still proceed with archiving if needed.</p>' : ''}
            </div>
        </div>
    `;
}

// ------------------------------------------ Search and Sorting Function ----------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    initAdmissionTable();
});

function initAdmissionTable() {
    const table = document.getElementById('admissions-table');
    const searchInput = document.getElementById('admission-search');
    const typeFilter = document.getElementById('type-sort');
    const sortableHeaders = table.querySelectorAll('th[data-sort]');
    const tbody = table.querySelector('tbody');
    const loadingOverlay = document.getElementById('table-loading');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Create no data row element
    const noDataRow = document.createElement('tr');
    noDataRow.className = 'no-data-row';
    noDataRow.innerHTML = `
        <td colspan="8">
            <div class="no-data-message">
                <i class="bx bx-info-circle"></i> No matching applications found
            </div>
        </td>
    `;
    noDataRow.style.display = 'none';
    tbody.insertBefore(noDataRow, tbody.firstChild);

    let currentSortColumn = 'created_at';
    let currentSortDirection = 'desc';
    let isTableLoading = false;

    // Initialize sorting indicators
    updateSortIndicators();

    // Search functionality
    searchInput.addEventListener('input', debounce(function() {
        fetchAndDisplayAdmissions();
    }, 300));

    // Type filter functionality
    typeFilter.addEventListener('change', function() {
        fetchAndDisplayAdmissions();
    });

    // Sorting functionality
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');

            // If clicking the same column, toggle direction
            if (column === currentSortColumn) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // New column, default to ascending
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }

            // Update UI and apply sorting
            updateSortIndicators();
            fetchAndDisplayAdmissions();
        });
    });

    function showLoading() {
        isTableLoading = true;
        loadingOverlay.style.display = 'flex';
        table.classList.add('table-loading');
    }

    function hideLoading() {
        isTableLoading = false;
        loadingOverlay.style.display = 'none';
        table.classList.remove('table-loading');
    }

    function fetchAndDisplayAdmissions() {
        if (isTableLoading) return;

        const searchTerm = searchInput.value;
        const typeFilterValue = typeFilter.value;
        const currentPage = new URLSearchParams(window.location.search).get('admission_page') || 1;

        // Show loading indicator
        showLoading();

        // Make AJAX request with pagination
        fetch(`?get_filtered_admissions=1&search=${encodeURIComponent(searchTerm)}&type=${encodeURIComponent(typeFilterValue)}&sort=${currentSortColumn}&direction=${currentSortDirection}&admission_page=${currentPage}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            updateTableWithData(data.admissions);
            updatePaginationControls(data);
            hideLoading();
        })
        .catch(error => {
            console.error('Error fetching admission data:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: red;">Error loading data</td></tr>';
            hideLoading();
        });
    }

    function updatePaginationControls(data) {
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) return;

        // Update page numbers
        const pageNumbers = paginationContainer.querySelector('.page-numbers');
        if (pageNumbers) {
            pageNumbers.innerHTML = '';

            // Show limited page numbers around current page
            const startPage = Math.max(1, data.current_page - 2);
            const endPage = Math.min(data.num_pages, data.current_page + 2);

            for (let i = startPage; i <= endPage; i++) {
                if (i === data.current_page) {
                    pageNumbers.innerHTML += `<span class="pagination-btn current-page active">${i}</span>`;
                } else {
                    pageNumbers.innerHTML += `<a href="javascript:void(0);" data-page="${i}" class="pagination-btn page-number">${i}</a>`;
                }
            }

            // Add event listeners to page number links
            document.querySelectorAll('.page-number').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = this.getAttribute('data-page');
                    // Update URL without reloading
                    const url = new URL(window.location);
                    url.searchParams.set('admission_page', page);
                    window.history.pushState({}, '', url);
                    fetchAndDisplayAdmissions();
                });
            });
        }

        // Update previous/next buttons
        const prevBtn = paginationContainer.querySelector('.prev-page');
        const nextBtn = paginationContainer.querySelector('.next-page');

        if (prevBtn) {
            if (data.has_previous) {
                prevBtn.outerHTML = `<a href="javascript:void(0);" data-page="${data.current_page - 1}" class="pagination-btn prev-page" title="Previous Page"><i class='bx bx-chevron-left'></i></a>`;
                document.querySelector('.prev-page').addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = this.getAttribute('data-page');
                    const url = new URL(window.location);
                    url.searchParams.set('admission_page', page);
                    window.history.pushState({}, '', url);
                    fetchAndDisplayAdmissions();
                });
            } else {
                prevBtn.outerHTML = `<span class="pagination-btn prev-page disabled" title="Previous Page"><i class='bx bx-chevron-left'></i></span>`;
            }
        }

        if (nextBtn) {
            if (data.has_next) {
                nextBtn.outerHTML = `<a href="javascript:void(0);" data-page="${data.current_page + 1}" class="pagination-btn next-page" title="Next Page"><i class='bx bx-chevron-right'></i></a>`;
                document.querySelector('.next-page').addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = this.getAttribute('data-page');
                    const url = new URL(window.location);
                    url.searchParams.set('admission_page', page);
                    window.history.pushState({}, '', url);
                    fetchAndDisplayAdmissions();
                });
            } else {
                nextBtn.outerHTML = `<span class="pagination-btn next-page disabled" title="Next Page"><i class='bx bx-chevron-right'></i></span>`;
            }
        }

        // Update first/last page buttons
        const firstBtn = paginationContainer.querySelector('.first-page');
        const lastBtn = paginationContainer.querySelector('.last-page');

        if (firstBtn) {
            if (data.current_page > 1) {
                firstBtn.outerHTML = `<a href="javascript:void(0);" data-page="1" class="pagination-btn first-page" title="First Page"><i class='bx bx-chevrons-left'></i></a>`;
                document.querySelector('.first-page').addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = this.getAttribute('data-page');
                    const url = new URL(window.location);
                    url.searchParams.set('admission_page', page);
                    window.history.pushState({}, '', url);
                    fetchAndDisplayAdmissions();
                });
            } else {
                firstBtn.outerHTML = `<span class="pagination-btn first-page disabled" title="First Page"><i class='bx bx-chevrons-left'></i></span>`;
            }
        }

        if (lastBtn) {
            if (data.current_page < data.num_pages) {
                lastBtn.outerHTML = `<a href="javascript:void(0);" data-page="${data.num_pages}" class="pagination-btn last-page" title="Last Page"><i class='bx bx-chevrons-right'></i></a>`;
                document.querySelector('.last-page').addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = this.getAttribute('data-page');
                    const url = new URL(window.location);
                    url.searchParams.set('admission_page', page);
                    window.history.pushState({}, '', url);
                    fetchAndDisplayAdmissions();
                });
            } else {
                lastBtn.outerHTML = `<span class="pagination-btn last-page disabled" title="Last Page"><i class='bx bx-chevrons-right'></i></span>`;
            }
        }

        // Update pagination info
        const paginationInfo = paginationContainer.querySelector('.pagination-info');
        if (paginationInfo) {
            const startIndex = (data.current_page - 1) * 10 + 1;
            const endIndex = Math.min(startIndex + 9, data.total_count || data.admissions.length * data.current_page);
            paginationInfo.textContent = `Showing ${startIndex} to ${endIndex} of ${data.total_count || data.admissions.length * data.num_pages} entries`;
        }
    }

    function updateTableWithData(admissions) {
        // Clear existing rows (except no data row)
        const existingRows = tbody.querySelectorAll('tr:not(.no-data-row)');
        existingRows.forEach(row => row.remove());

        if (admissions.length === 0) {
            noDataRow.style.display = '';
            return;
        }

        noDataRow.style.display = 'none';

        // Add new rows
        admissions.forEach(admission => {
            const row = document.createElement('tr');
            row.setAttribute('data-student-type', admission.student_type);
            row.setAttribute('data-created-at', admission.created_at);
            row.setAttribute('data-status', admission.status);

            // Control No
            const controlNoCell = document.createElement('td');
            controlNoCell.setAttribute('data-sort-value', admission.control_no);
            controlNoCell.textContent = admission.control_no;
            row.appendChild(controlNoCell);

            // Student Name
            const studentCell = document.createElement('td');
            studentCell.setAttribute('data-sort-value', admission.student_name.toLowerCase());
            studentCell.textContent = admission.student_name || '(No user associated)';
            row.appendChild(studentCell);

            // Student Type
            const typeCell = document.createElement('td');
            typeCell.setAttribute('data-sort-value', admission.student_type_display);
            typeCell.textContent = admission.student_type_display;
            row.appendChild(typeCell);

            // Course
            const courseCell = document.createElement('td');
            courseCell.setAttribute('data-sort-value', admission.course);
            courseCell.textContent = admission.course;
            row.appendChild(courseCell);

            // Status
            const statusCell = document.createElement('td');
            statusCell.setAttribute('data-sort-value', admission.status);
            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge ${admission.status === 'done' ? 'done' :
                                    admission.status === 'incomplete' ? 'incomplete' : 'pending'}`;
            statusBadge.textContent = admission.status_display;
            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);

            // Remarks
            const remarksCell = document.createElement('td');
            remarksCell.className = 'remarks-cell';
            remarksCell.setAttribute('data-missing', admission.status === 'incomplete' ? 'true' : 'false');
            remarksCell.setAttribute('data-complete', admission.status === 'complete' ? 'true' : 'false');
            remarksCell.setAttribute('data-full-remarks', admission.remarks || '-');

            let remarksContent = admission.remarks || '-';
            if (remarksContent.includes("To Follow Requirements:")) {
                remarksContent = remarksContent.substring(0, 100) + (remarksContent.length > 100 ? '...' : '');
            }
            remarksCell.textContent = remarksContent;
            row.appendChild(remarksCell);

            // Date Submitted
            const dateCell = document.createElement('td');
            dateCell.setAttribute('data-sort-value', new Date(admission.created_at).getTime());
            dateCell.textContent = new Date(admission.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            row.appendChild(dateCell);

            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions';

            // Approve button (if applicable)
            if (admission.can_approve && admission.status !== 'done') {
                const approveBtn = document.createElement('button');
                approveBtn.className = 'btn-icon approve-admission';
                approveBtn.title = 'Approve';
                approveBtn.onclick = function() {
                    openApproveAdmissionModal(admission.id);
                };
                approveBtn.innerHTML = '<i class="bx bx-check"></i>';
                actionsCell.appendChild(approveBtn);
            }

            // View button
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn-icon view-admission';
            viewBtn.title = 'View';
            viewBtn.setAttribute('data-admission-id', admission.id);
            viewBtn.innerHTML = '<i class="ri-eye-fill"></i>';
            actionsCell.appendChild(viewBtn);

            // Edit button (if applicable)
            if (admission.can_edit) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-icon edit-admission';
                editBtn.title = 'Edit Status';
                editBtn.onclick = function() {
                    openAdmissionEditModal(admission.id);
                };
                editBtn.innerHTML = '<i class="bx bx-edit"></i>';
                actionsCell.appendChild(editBtn);
            }

            // Archive button (if applicable)
            if (admission.can_archive) {
                const archiveBtn = document.createElement('button');
                archiveBtn.className = 'btn-icon archive-admission';
                archiveBtn.title = 'Archive';
                archiveBtn.onclick = function() {
                    openArchiveAdmissionModal(admission.id);
                };
                archiveBtn.innerHTML = '<i class="bx bxs-archive"></i>';
                actionsCell.appendChild(archiveBtn);
            }

            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });

        // Reattach event listeners for action buttons
        attachActionButtonEvents();
    }

    function attachActionButtonEvents() {
        // View buttons
        document.querySelectorAll('.view-admission').forEach(btn => {
            btn.addEventListener('click', function() {
                const admissionId = this.getAttribute('data-admission-id');
                // Call your view function here
                console.log('View admission:', admissionId);
            });
        });
    }

    function updateSortIndicators() {
        sortableHeaders.forEach(header => {
            const icon = header.querySelector('i');
            if (header.getAttribute('data-sort') === currentSortColumn) {
                icon.className = currentSortDirection === 'asc' ? 'bx bx-sort-up' : 'bx bx-sort-down';
            } else {
                icon.className = 'bx bx-sort';
            }
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}