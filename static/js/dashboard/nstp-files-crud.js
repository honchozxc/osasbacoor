function openNSTPFileCreateModal() {
    const modal = document.getElementById('nstpFileCreateModal');
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('no-scroll');

        // Focus on first input field when modal opens
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            firstInput.focus();
        }
    } else {
        console.error('NSTP File Create Modal not found');
    }
}

function closeNSTPFileCreateModal() {
    const modal = document.getElementById('nstpFileCreateModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('no-scroll');
        document.getElementById('nstpFileFormResponse').innerHTML = '';
        document.getElementById('nstpFileCreateForm').reset();

        // Clear file input and preview
        const fileInput = document.getElementById('id_file');
        const filePreviewContainer = document.getElementById('nstpFilePreviewContainer');
        if (fileInput) {
            fileInput.value = '';
        }
        if (filePreviewContainer) {
            filePreviewContainer.style.display = 'none';
        }

        // Remove error classes
        document.querySelectorAll('#nstpFileCreateForm .error, #nstpFileCreateForm .has-error').forEach(el => {
            el.classList.remove('error', 'has-error');
        });
    }
}

// File upload preview functionality for NSTP files
function initializeNSTPFileUploadPreview() {
    const fileInput = document.getElementById('id_file');
    const filePreviewContainer = document.getElementById('nstpFilePreviewContainer');
    const fileNamePreview = document.getElementById('nstpFileNamePreview');
    const fileSizePreview = document.getElementById('nstpFileSizePreview');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const allowedTypes = ['application/pdf',
                                     'application/msword',
                                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                     'application/vnd.ms-excel',
                                     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                     'application/vnd.ms-powerpoint',
                                     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                     'image/jpeg',
                                     'image/png'];

                // Validate file type
                if (!allowedTypes.includes(file.type)) {
                    showToast('Please upload a valid file type (PDF, DOC, XLS, PPT, JPG, PNG)', 'error');
                    this.value = '';
                    return;
                }

                // Validate file size (10MB max)
                if (file.size > 10 * 1024 * 1024) {
                    showToast('File size exceeds 10MB limit', 'error');
                    this.value = '';
                    return;
                }

                // Display file preview
                fileNamePreview.textContent = file.name;
                fileSizePreview.textContent = formatFileSize(file.size);
                filePreviewContainer.style.display = 'block';
            }
        });
    }
}

function removeNSTPUploadedFile() {
    const fileInput = document.getElementById('id_file');
    const filePreviewContainer = document.getElementById('nstpFilePreviewContainer');

    if (fileInput && filePreviewContainer) {
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
    }
}

// Handle NSTP file form submission with toast notifications
document.addEventListener('DOMContentLoaded', function() {
    // Event listener for the Add New File button
    const addNstpBtn = document.querySelector('.btn-add-nstp');
    if (addNstpBtn) {
        addNstpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openNSTPFileCreateModal();
        });
    }

    // Add ESC key support to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeNSTPFileCreateModal();
        }
    });

    // Handle form submission
    const form = document.getElementById('nstpFileCreateForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(form);

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    closeNSTPFileCreateModal();
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    // Handle form errors
                    const responseDiv = document.getElementById('nstpFileFormResponse');
                    responseDiv.innerHTML = '';

                    if (data.errors) {
                        let errorHtml = '<div class="error-message"><p>Please correct the following errors:</p><ul>';

                        for (const field in data.errors) {
                            const fieldErrors = data.errors[field];
                            const fieldElement = form.querySelector(`[name="${field}"]`);
                            const formGroup = fieldElement ? fieldElement.closest('.form-group') : null;

                            if (formGroup) {
                                formGroup.classList.add('has-error');
                                fieldElement.classList.add('error');
                            }

                            fieldErrors.messages.forEach(message => {
                                errorHtml += `<li><strong>${fieldErrors.label}:</strong> ${message}</li>`;
                            });
                        }

                        errorHtml += '</ul></div>';
                        responseDiv.innerHTML = errorHtml;
                    } else {
                        showToast(data.message || 'Error creating NSTP file', 'error');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred while creating NSTP file', 'error');
            })
            .finally(() => {
                submitBtn.disabled = false;
            });
        });

        // Input validation styling
        document.querySelectorAll('#nstpFileCreateForm input, #nstpFileCreateForm select, #nstpFileCreateForm textarea').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const formGroup = this.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.remove('has-error');
                }
            });
        });

        // Initialize file upload preview
        initializeNSTPFileUploadPreview();
    }
});

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ---------------------------------------------------- View Function --------------------------------------------------
function openNSTPFileViewModal(fileId) {
    const modal = document.getElementById('nstpFileViewModal');
    if (!modal) {
        console.error('NSTP File View Modal not found');
        showToast('Failed to open file details', 'error');
        return;
    }

    // Show loading state
    modal.classList.add('loading');

    fetch(`/nstp-files/${fileId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch file details');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                populateNSTPFileModal(data.file);
                modal.classList.remove('loading');
                modal.classList.add('active');
                document.body.classList.add('no-scroll');
            } else {
                throw new Error(data.error || 'Failed to load file details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'Failed to load file details', 'error');
            modal.classList.remove('loading');
        });
}

function populateNSTPFileModal(fileData) {
    // Set basic file info
    document.getElementById('nstpFileTitle').textContent = fileData.title;
    document.getElementById('nstpFileDescription').textContent =
        fileData.description || 'No description available';

    // Set category and semester badges
    const categoryTag = document.getElementById('nstpFileCategoryTag');
    categoryTag.textContent = fileData.category;
    categoryTag.className = `category-tag category-${fileData.category_value}`;

    const semesterBadge = document.getElementById('nstpFileSemester');
    semesterBadge.textContent = fileData.semester;
    semesterBadge.className = `semester-badge semester-${fileData.semester_value}`;

    // Set file info
    document.getElementById('nstpFileSchoolYear').textContent = fileData.school_year;
    document.getElementById('nstpFileCreatedBy').textContent =
        `Uploaded by: ${fileData.created_by || 'Unknown'}`;

    // Set file preview
    const fileIcon = document.getElementById('nstpFileIcon');
    fileIcon.className = getFileIconClass(fileData.file_type);

    const fileLink = document.getElementById('nstpFileLink');
    fileLink.textContent = fileData.file_name;
    fileLink.href = fileData.file_url;

    document.getElementById('nstpFileSize').textContent = formatFileSize(fileData.file_size);

    // Set dates
    document.getElementById('nstpFileCreatedAt').textContent = formatDateTime(fileData.created_at);
    document.getElementById('nstpFileUpdatedAt').textContent = formatDateTime(fileData.updated_at);
}

function getFileIconClass(fileType) {
    const iconMap = {
        'pdf': 'bx bxs-file-pdf',
        'word': 'bx bxs-file-doc',
        'excel': 'bx bxs-file-xls',
        'powerpoint': 'bx bxs-file-ppt',
        'image': 'bx bxs-file-image'
    };
    return iconMap[fileType] || 'bx bxs-file';
}

function closeNSTPFileViewModal() {
    const modal = document.getElementById('nstpFileViewModal');
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDateTime(datetimeStr) {
    if (!datetimeStr) return 'Unknown';
    const date = new Date(datetimeStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // View button click handler
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-view-nstp')) {
            const button = e.target.closest('.btn-view-nstp');
            const fileId = button.getAttribute('data-file-id');
            openNSTPFileViewModal(fileId);
        }
    });

    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeNSTPFileViewModal();
        }
    });
});

// -------------------------------------------------- Edit Function ----------------------------------------------------
function openNSTPFileEditModal(fileId) {
    const modal = document.getElementById('nstpFileEditModal');
    if (!modal) {
        console.error('NSTP File Edit Modal not found');
        showToast('Failed to open edit form', 'error');
        return;
    }

    // Show loading state
    modal.classList.add('loading');

    // Clear any previous errors and reset file preview
    document.getElementById('nstpFileEditFormResponse').innerHTML = '';
    document.getElementById('editNstpFilePreviewContainer').style.display = 'none';
    document.getElementById('editNstpFile').value = '';

    // Fetch current file data
    fetch(`/nstp-files/${fileId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch file details');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const file = data.file;

                // Populate form fields
                document.getElementById('editNstpFileId').value = file.id;
                document.getElementById('editNstpTitle').value = file.title;
                document.getElementById('editNstpDescription').value = file.description || '';
                document.getElementById('editNstpCategory').value = file.category_value;
                document.getElementById('editNstpSemester').value = file.semester_value;
                document.getElementById('editNstpSchoolYear').value = file.school_year;

                // Set current file preview
                const filePreviewContainer = document.getElementById('editNstpFilePreviewContainer');
                const fileNamePreview = document.getElementById('editNstpFileNamePreview');
                const fileSizePreview = document.getElementById('editNstpFileSizePreview');

                fileNamePreview.textContent = file.file_name;
                fileSizePreview.textContent = formatFileSize(file.file_size);
                filePreviewContainer.style.display = 'block';

                // Open modal
                modal.classList.remove('loading');
                modal.classList.add('active');
                document.body.classList.add('no-scroll');
            } else {
                throw new Error(data.error || 'Failed to load file details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'Failed to load file details', 'error');
            modal.classList.remove('loading');
        });
}

function closeNSTPFileEditModal() {
    const modal = document.getElementById('nstpFileEditModal');
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
    document.getElementById('nstpFileEditFormResponse').innerHTML = '';
    document.getElementById('editNstpFilePreviewContainer').style.display = 'none';
    document.getElementById('editNstpFile').value = '';

    // Remove error classes
    document.querySelectorAll('#nstpFileEditForm .error, #nstpFileEditForm .has-error').forEach(el => {
        el.classList.remove('error', 'has-error');
    });
}

function removeNSTPEditUploadedFile() {
    document.getElementById('editNstpFile').value = '';
    document.getElementById('editNstpFilePreviewContainer').style.display = 'none';
}

// Initialize file upload preview for edit form
function initializeNSTPEditFileUploadPreview() {
    const fileInput = document.getElementById('editNstpFile');
    const filePreviewContainer = document.getElementById('editNstpFilePreviewContainer');
    const fileNamePreview = document.getElementById('editNstpFileNamePreview');
    const fileSizePreview = document.getElementById('editNstpFileSizePreview');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const allowedTypes = ['application/pdf',
                                    'application/msword',
                                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                    'application/vnd.ms-excel',
                                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                    'application/vnd.ms-powerpoint',
                                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                    'image/jpeg',
                                    'image/png'];

                // Validate file type
                if (!allowedTypes.includes(file.type)) {
                    showToast('Please upload a valid file type (PDF, DOC, XLS, PPT, JPG, PNG)', 'error');
                    this.value = '';
                    return;
                }

                // Validate file size (10MB max)
                if (file.size > 10 * 1024 * 1024) {
                    showToast('File size exceeds 10MB limit', 'error');
                    this.value = '';
                    return;
                }

                // Display file preview
                fileNamePreview.textContent = file.name;
                fileSizePreview.textContent = formatFileSize(file.size);
                filePreviewContainer.style.display = 'block';
            }
        });
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    // Initialize file upload preview
    initializeNSTPEditFileUploadPreview();

    // Click handler for edit buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-edit-nstp')) {
            const button = e.target.closest('.btn-edit-nstp');
            const fileId = button.getAttribute('data-file-id');
            openNSTPFileEditModal(fileId);
        }
    });

    // Handle form submission
    const form = document.getElementById('nstpFileEditForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(form);
            const fileId = formData.get('file_id');
            const submitBtn = form.querySelector('button[type="submit"]');

            // Show loading state
            submitBtn.disabled = true;
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';

            fetch(`/nstp-files/${fileId}/edit/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message || 'File updated successfully!', 'success');
                    closeNSTPFileEditModal();
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    // Reset button state
                    submitBtn.disabled = false;
                    btnText.style.display = 'block';
                    btnLoader.style.display = 'none';

                    const responseDiv = document.getElementById('nstpFileEditFormResponse');
                    responseDiv.innerHTML = '';

                    if (data.errors) {
                        let errorHtml = '<div class="error-message"><p>Please correct the following errors:</p><ul>';

                        for (const field in data.errors) {
                            const fieldErrors = data.errors[field];
                            const fieldElement = form.querySelector(`[name="${field}"]`);
                            const formGroup = fieldElement ? fieldElement.closest('.form-group') : null;

                            if (formGroup) {
                                formGroup.classList.add('has-error');
                                fieldElement.classList.add('error');
                            }

                            fieldErrors.forEach(message => {
                                errorHtml += `<li><strong>${field}:</strong> ${message}</li>`;
                            });
                        }

                        errorHtml += '</ul></div>';
                        responseDiv.innerHTML = errorHtml;
                    } else {
                        showToast(data.message || 'Error updating file', 'error');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred while updating file', 'error');
                submitBtn.disabled = false;
                btnText.style.display = 'block';
                btnLoader.style.display = 'none';
            });
        });

        // Clear errors when input changes
        document.querySelectorAll('#nstpFileEditForm input, #nstpFileEditForm select, #nstpFileEditForm textarea').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const formGroup = this.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.remove('has-error');
                }
            });
        });
    }

    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeNSTPFileEditModal();
        }
    });
});

// ----------------------------------------------- Archive Function ----------------------------------------------------
function openArchiveNSTPModal(fileId, fileName) {
    // Show loading state
    const modal = document.getElementById('archiveNSTPModal');
    modal.classList.add('loading');

    // Clear any previous errors
    document.getElementById('nstpArchiveFormResponse').innerHTML = '';

    // Fetch additional file details in detail view function
    fetch(`/nstp-files/${fileId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const file = data.file;

                // Update form action URL with the file ID
                const urlTemplate = document.getElementById('nstpArchiveForm').getAttribute('data-url-template');
                document.getElementById('nstpArchiveForm').action = urlTemplate.replace('0', fileId);

                // Set form values
                document.getElementById('archiveNSTPId').value = fileId;
                document.getElementById('archiveNSTPName').textContent = fileName;
                document.getElementById('archiveNSTPCategory').textContent = file.category_display || file.category;
                document.getElementById('archiveNSTPSemester').textContent = file.semester_display || file.semester;
                document.getElementById('archiveNSTPYear').textContent = file.school_year;

                // Clear notes
                document.getElementById('archiveNSTPNotes').value = '';

                // Open modal
                modal.classList.remove('loading');
                modal.classList.add('active');
                document.body.classList.add('no-scroll');
            } else {
                throw new Error(data.error || 'Failed to load file details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'An error occurred while loading file details', 'error');
            modal.classList.remove('loading');
        });
}

// Close Archive NSTP Modal
function closeArchiveNSTPModal() {
    document.getElementById('archiveNSTPModal').classList.remove('active');
    document.body.classList.remove('no-scroll');
    document.getElementById('nstpArchiveFormResponse').innerHTML = '';
}

// Handle Archive Form Submission
document.getElementById('nstpArchiveForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.btn-loader');

    btnText.style.display = 'none';
    loader.style.display = 'block';

    const formData = new FormData(this);

    fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': formData.get('csrfmiddlewaretoken')
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
            showToast('NSTP file archived successfully!', 'success');
            setTimeout(() => {
                closeArchiveNSTPModal();
                location.reload();
            }, 1500);
        } else {
            throw new Error(data.error || 'Failed to archive NSTP file');
        }
    })
    .catch(error => {
        showToast(error.message || 'An error occurred while archiving the file', 'error');
        document.getElementById('nstpArchiveFormResponse').innerHTML =
            `<div class="alert alert-danger">${error.message}</div>`;
    })
    .finally(() => {
        btnText.style.display = 'block';
        loader.style.display = 'none';
    });
});

// Event listeners to all archive buttons
document.querySelectorAll('.btn-archive-nstp').forEach(button => {
    button.addEventListener('click', function() {
        const card = this.closest('.downloadable-card');
        const fileId = card.getAttribute('data-id');
        const fileName = card.querySelector('.card-title').textContent;
        openArchiveNSTPModal(fileId, fileName);
    });
});

// --------------------------------------- Serach and Sorting, Filtering  Function -------------------------------------
// --------------------------------------- NSTP Files AJAX Search and Filtering -------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    initNSTPTable();
});

let fetchAndDisplayNSTPFiles;

function initNSTPTable() {
    const searchInput = document.getElementById('nstp-doc-search');
    const categoryFilter = document.getElementById('nstpDocCategory');
    const semesterFilter = document.getElementById('nstpDocSemester');
    const documentsContainer = document.getElementById('nstp-documents-container');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Function to reset filters
    function resetNSTPFilters() {
        searchInput.value = '';
        categoryFilter.value = 'all';
        semesterFilter.value = 'all';
        fetchAndDisplayNSTPFiles();
    }

    // Define the function that will be called
    fetchAndDisplayNSTPFiles = function() {
        const searchTerm = searchInput.value;
        const categoryValue = categoryFilter.value;
        const semesterValue = semesterFilter.value;
        const currentPage = new URLSearchParams(window.location.search).get('nstp_page') || 1;

        // Show loading indicator, hide other states
        document.getElementById('nstp-loading').style.display = 'flex';
        document.getElementById('nstp-empty-state').style.display = 'none';
        document.getElementById('nstp-no-results').style.display = 'none';
        documentsContainer.innerHTML = '';

        // Make AJAX request with pagination
        fetch(`?get_filtered_nstp_files=1&search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(categoryValue)}&semester=${encodeURIComponent(semesterValue)}&nstp_page=${currentPage}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Always hide loading row when we get a response
            document.getElementById('nstp-loading').style.display = 'none';

            if (data.nstp_files && data.nstp_files.length > 0) {
                updateNSTPContainerWithData(data.nstp_files);
                updateNSTPPaginationControls(data);
                // Update total count
                document.getElementById('total-nstp-count').textContent = data.pagination.total_count;
            } else {
                // Show appropriate empty state
                if (searchTerm || categoryValue !== 'all' || semesterValue !== 'all') {
                    document.getElementById('nstp-no-results').style.display = 'flex';
                } else {
                    document.getElementById('nstp-empty-state').style.display = 'flex';
                }

                // Update pagination with empty state
                updateNSTPPaginationControls(data);
            }
        })
        .catch(error => {
            console.error('Error fetching NSTP file data:', error);
            // Always hide loading row on error
            document.getElementById('nstp-loading').style.display = 'none';
            document.getElementById('nstp-empty-state').style.display = 'flex';
        });
    }

    function updateNSTPPaginationControls(data) {
        const paginationContainer = document.getElementById('nstp-pagination-container');
        if (!paginationContainer) return;

        // Clear existing content
        paginationContainer.innerHTML = '';

        // Check if we have valid pagination data
        if (!data.pagination) {
            // No pagination data, don't show any pagination
            return;
        }

        const pagination = data.pagination;
        const totalCount = pagination.total_count || 0;
        const currentPage = pagination.current_page || 1;
        const numPages = pagination.num_pages || 1;
        const hasPrevious = pagination.has_previous || false;
        const hasNext = pagination.has_next || false;
        const startIndex = pagination.start_index || ((currentPage - 1) * 9 + 1);
        const endIndex = pagination.end_index || Math.min(startIndex + 8, totalCount);

        // Create pagination info - always show even if no results
        const paginationInfo = document.createElement('div');
        paginationInfo.className = 'pagination-info';

        if (totalCount === 0) {
            paginationInfo.textContent = 'Showing 0 entries';
        } else {
            paginationInfo.textContent = `Showing ${startIndex} to ${endIndex} of ${totalCount} entries`;
        }

        // Create pagination controls container
        const paginationControls = document.createElement('div');
        paginationControls.className = 'pagination-controls';

        // Build query string parameters
        const searchParams = new URLSearchParams();
        if (searchInput.value) searchParams.set('search', searchInput.value);
        if (categoryFilter.value !== 'all') searchParams.set('category', categoryFilter.value);
        if (semesterFilter.value !== 'all') searchParams.set('semester', semesterFilter.value);

        // First page button
        if (hasPrevious && totalCount > 0) {
            const firstPageBtn = document.createElement('a');
            firstPageBtn.href = 'javascript:void(0);';
            firstPageBtn.className = 'pagination-btn first-page';
            firstPageBtn.title = 'First Page';
            firstPageBtn.setAttribute('data-page', 1);
            firstPageBtn.innerHTML = '<i class="bx bx-chevrons-left"></i>';
            firstPageBtn.addEventListener('click', function() {
                goToNSTPPage(1);
            });
            paginationControls.appendChild(firstPageBtn);
        } else {
            const firstPageBtn = document.createElement('span');
            firstPageBtn.className = 'pagination-btn first-page disabled';
            firstPageBtn.title = 'First Page';
            firstPageBtn.innerHTML = '<i class="bx bx-chevrons-left"></i>';
            paginationControls.appendChild(firstPageBtn);
        }

        // Previous page button
        if (hasPrevious && totalCount > 0) {
            const prevPageBtn = document.createElement('a');
            prevPageBtn.href = 'javascript:void(0);';
            prevPageBtn.className = 'pagination-btn prev-page';
            prevPageBtn.title = 'Previous Page';
            prevPageBtn.setAttribute('data-page', currentPage - 1);
            prevPageBtn.innerHTML = '<i class="bx bx-chevron-left"></i>';
            prevPageBtn.addEventListener('click', function() {
                goToNSTPPage(currentPage - 1);
            });
            paginationControls.appendChild(prevPageBtn);
        } else {
            const prevPageBtn = document.createElement('span');
            prevPageBtn.className = 'pagination-btn prev-page disabled';
            prevPageBtn.title = 'Previous Page';
            prevPageBtn.innerHTML = '<i class="bx bx-chevron-left"></i>';
            paginationControls.appendChild(prevPageBtn);
        }

        // Page numbers - only show if we have pages
        if (numPages > 1 && totalCount > 0) {
            const pageNumbers = document.createElement('div');
            pageNumbers.className = 'page-numbers';

            // Show limited page numbers around current page
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(numPages, currentPage + 2);

            for (let i = startPage; i <= endPage; i++) {
                if (i === currentPage) {
                    const currentPageBtn = document.createElement('span');
                    currentPageBtn.className = 'pagination-btn current-page active';
                    currentPageBtn.textContent = i;
                    pageNumbers.appendChild(currentPageBtn);
                } else {
                    const pageBtn = document.createElement('a');
                    pageBtn.href = 'javascript:void(0);';
                    pageBtn.className = 'pagination-btn page-number';
                    pageBtn.setAttribute('data-page', i);
                    pageBtn.textContent = i;
                    pageBtn.addEventListener('click', function() {
                        goToNSTPPage(i);
                    });
                    pageNumbers.appendChild(pageBtn);
                }
            }

            paginationControls.appendChild(pageNumbers);
        }

        // Next page button
        if (hasNext && totalCount > 0) {
            const nextPageBtn = document.createElement('a');
            nextPageBtn.href = 'javascript:void(0);';
            nextPageBtn.className = 'pagination-btn next-page';
            nextPageBtn.title = 'Next Page';
            nextPageBtn.setAttribute('data-page', currentPage + 1);
            nextPageBtn.innerHTML = '<i class="bx bx-chevron-right"></i>';
            nextPageBtn.addEventListener('click', function() {
                goToNSTPPage(currentPage + 1);
            });
            paginationControls.appendChild(nextPageBtn);
        } else {
            const nextPageBtn = document.createElement('span');
            nextPageBtn.className = 'pagination-btn next-page disabled';
            nextPageBtn.title = 'Next Page';
            nextPageBtn.innerHTML = '<i class="bx bx-chevron-right"></i>';
            paginationControls.appendChild(nextPageBtn);
        }

        // Last page button
        if (hasNext && totalCount > 0) {
            const lastPageBtn = document.createElement('a');
            lastPageBtn.href = 'javascript:void(0);';
            lastPageBtn.className = 'pagination-btn last-page';
            lastPageBtn.title = 'Last Page';
            lastPageBtn.setAttribute('data-page', numPages);
            lastPageBtn.innerHTML = '<i class="bx bx-chevrons-right"></i>';
            lastPageBtn.addEventListener('click', function() {
                goToNSTPPage(numPages);
            });
            paginationControls.appendChild(lastPageBtn);
        } else {
            const lastPageBtn = document.createElement('span');
            lastPageBtn.className = 'pagination-btn last-page disabled';
            lastPageBtn.title = 'Last Page';
            lastPageBtn.innerHTML = '<i class="bx bx-chevrons-right"></i>';
            paginationControls.appendChild(lastPageBtn);
        }

        // Add elements to container
        paginationContainer.appendChild(paginationInfo);

        // Only show pagination controls if there are multiple pages AND results
        if (numPages > 1 && totalCount > 0) {
            paginationContainer.appendChild(paginationControls);
        }
    }

    function goToNSTPPage(page) {
        // Update URL without reloading
        const url = new URL(window.location);
        url.searchParams.set('nstp_page', page);
        window.history.pushState({}, '', url);

        // Fetch data for the new page
        fetchAndDisplayNSTPFiles();

        // Scroll to top of the section
        document.getElementById('nstp-documents-container').scrollIntoView({ behavior: 'smooth' });
    }

    function updateNSTPContainerWithData(files) {
        const container = document.getElementById('nstp-documents-container');
        container.innerHTML = '';

        files.forEach(file => {
            const card = document.createElement('div');
            card.className = 'document-card';
            card.setAttribute('data-id', file.id);
            card.setAttribute('data-category', file.category);
            card.setAttribute('data-semester', file.semester);
            card.setAttribute('data-year', file.school_year);

            // Format date
            const createdDate = new Date(file.created_at);
            const formattedDate = createdDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            const formattedTime = createdDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            // Format file size
            const fileSize = formatFileSize(file.file_size);

            card.innerHTML = `
                <div class="card-header">
                    <div class="file-icon">
                        <i class="${file.file_icon}"></i>
                    </div>
                    <div class="file-meta">
                        <span class="file-category category-${file.category}">
                            ${file.category_display}
                        </span>
                        <span class="file-semester semester-${file.semester}">
                            ${file.semester_display}
                        </span>
                    </div>
                </div>

                <div class="card-body">
                    <h3 class="file-title">${file.title}</h3>
                    <p class="nstp-file-description">
                        ${file.description.length > 100 ? file.description.substring(0, 100) + '...' : file.description}
                    </p>

                    <div class="nstp-file-details">
                        <span class="nstp-detail-item">
                            <i class='bx bx-calendar'></i> ${formattedDate}
                        </span>
                        <span class="nstp-detail-item">
                            <i class='bx bx-time'></i> ${formattedTime}
                        </span>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="file-actions">
                        <a href="${file.file_url}" class="action-btn download" title="Download" download>
                            <i class='bx bx-download'></i>
                        </a>

                        ${file.can_view ? `
                        <button class="action-btn view-nstp-files" title="View Details" data-file-id="${file.id}">
                            <i class='bx bx-show'></i>
                        </button>
                        ` : ''}

                        ${file.can_edit ? `
                        <button class="action-btn edit-nstp-files" title="Edit" data-file-id="${file.id}">
                            <i class='bx bx-edit'></i>
                        </button>
                        ` : ''}

                        ${file.can_delete ? `
                        <button class="action-btn archive-nstp-files" title="Archive" data-file-id="${file.id}">
                            <i class='bx bx-archive'></i>
                        </button>
                        ` : ''}
                    </div>

                    <div class="file-info">
                        <span class="file-size">${fileSize}</span>
                        <span class="file-year">${file.school_year}</span>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        // Reattach event listeners to the new buttons
        attachNSTPEventListeners();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function attachNSTPEventListeners() {
        // View button click handler
        document.querySelectorAll('.action-btn.view-nstp-files').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const fileId = this.getAttribute('data-file-id');
                openNSTPFileViewModal(fileId);
            });
        });

        // Edit button click handler
        document.querySelectorAll('.action-btn.edit-nstp-files').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const fileId = this.getAttribute('data-file-id');
                openNSTPFileEditModal(fileId);
            });
        });

        // Archive button click handler
        document.querySelectorAll('.action-btn.archive-nstp-files').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const fileId = this.getAttribute('data-file-id');
                const fileName = this.closest('.document-card').querySelector('.file-title').textContent;
                openArchiveNSTPModal(fileId, fileName);
            });
        });
    }

    // Initialize search and filter events
    searchInput.addEventListener('input', debounce(function() {
        fetchAndDisplayNSTPFiles();
    }, 300));

    categoryFilter.addEventListener('change', function() {
        fetchAndDisplayNSTPFiles();
    });

    semesterFilter.addEventListener('change', function() {
        fetchAndDisplayNSTPFiles();
    });

    // Initial load
    fetchAndDisplayNSTPFiles();
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function() {
    if (typeof fetchAndDisplayNSTPFiles === 'function') {
        fetchAndDisplayNSTPFiles();
    }
});

// Global function to reset filters
function resetNSTPFilters() {
    document.getElementById('nstp-doc-search').value = '';
    document.getElementById('nstpDocCategory').value = 'all';
    document.getElementById('nstpDocSemester').value = 'all';

    if (typeof fetchAndDisplayNSTPFiles === 'function') {
        fetchAndDisplayNSTPFiles();
    }
}