// ----------------------------------------------- Create/Add Function -------------------------------------------------
function openScholarshipCreateModal() {
    document.getElementById('scholarshipCreateModal').classList.add('active');
    document.body.classList.add('no-scroll');
}

function closeScholarshipCreateModal() {
    document.getElementById('scholarshipCreateModal').classList.remove('active');
    document.body.classList.remove('no-scroll');
    document.getElementById('scholarshipFormResponse').innerHTML = '';
    document.getElementById('scholarshipCreateForm').reset();

    // Clear file input and preview
    const fileInput = document.getElementById('id_application_form');
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    if (fileInput) {
        fileInput.value = '';
    }
    if (filePreviewContainer) {
        filePreviewContainer.style.display = 'none';
    }

    // Remove error classes
    document.querySelectorAll('#scholarshipCreateForm .error, #scholarshipCreateForm .has-error').forEach(el => {
        el.classList.remove('error', 'has-error');
    });
}

// File upload preview functionality
function initializeFileUploadPreview() {
    const fileInput = document.getElementById('id_application_form');
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    const fileNamePreview = document.getElementById('fileNamePreview');
    const fileSizePreview = document.getElementById('fileSizePreview');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];

                // Validate file type
                if (!file.type.includes('pdf')) {
                    showToast('Please upload a PDF file only', 'error');
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

function removeUploadedFile() {
    const fileInput = document.getElementById('id_application_form');
    const filePreviewContainer = document.getElementById('filePreviewContainer');

    fileInput.value = '';
    filePreviewContainer.style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle form submission with toast notifications
document.getElementById('scholarshipCreateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    // Add any additional data you need
    formData.append('csrfmiddlewaretoken', form.querySelector('[name=csrfmiddlewaretoken]').value);

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    btnText.style.display = 'none';
    btnLoader.style.display = 'block';
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
            closeScholarshipCreateModal();
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            // Handle errors
            console.error(data);

            // Reset button state
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;

            const responseDiv = document.getElementById('scholarshipFormResponse');
            responseDiv.innerHTML = '';

            if (data.errors) {
                // Show error toast for form errors
                const firstError = Object.values(data.errors)[0].messages[0];
                showToast(firstError, 'error');

                // Display detailed form errors
                let errorHtml = '<div class="alert alert-danger"><ul>';
                for (const field in data.errors) {
                    data.errors[field].messages.forEach(error => {
                        errorHtml += `<li>${error}</li>`;
                        // Highlight problematic fields
                        const input = form.querySelector(`[name="${field}"]`);
                        if (input) {
                            input.classList.add('error');
                            const formGroup = input.closest('.form-group');
                            if (formGroup) {
                                formGroup.classList.add('has-error');
                            }
                        }
                    });
                }
                errorHtml += '</ul></div>';
                responseDiv.innerHTML = errorHtml;
            } else if (data.message) {
                // Show error message as toast
                showToast(data.message, 'error');
                responseDiv.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred', 'error');

        // Reset button state
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;

        document.getElementById('scholarshipFormResponse').innerHTML =
            `<div class="alert alert-danger">An error occurred. Please try again.</div>`;
    });
});

// Add input validation styling
document.querySelectorAll('#scholarshipCreateForm input, #scholarshipCreateForm select, #scholarshipCreateForm textarea').forEach(input => {
    input.addEventListener('input', function() {
        this.classList.remove('error');
        const formGroup = this.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('has-error');
        }
    });
});

// Initialize file upload preview when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUploadPreview();
});

// ------------------------------------------------ View Function ------------------------------------------------------
function openScholarshipViewModal(scholarshipId) {
    // Show loading state
    const modal = document.getElementById('scholarshipViewModal');
    modal.classList.add('loading');

    fetch(`/api/scholarships/${scholarshipId}/`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Failed to load scholarship details');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const scholarship = data.scholarship;

                // Set scholarship name and type
                document.getElementById('scholarshipName').textContent = scholarship.name;
                document.getElementById('scholarshipTypeTag').textContent = scholarship.scholarship_type;
                document.getElementById('scholarshipTypeTag').className = 'scholarship-type-tag ' + scholarship.scholarship_type.toLowerCase();

                // Set status (removed slots)
                const statusBadge = document.getElementById('scholarshipStatus');
                statusBadge.textContent = scholarship.is_active ? 'Active' : 'Inactive';
                statusBadge.className = 'status-badge ' + (scholarship.is_active ? 'active' : 'inactive');

                // Set created by (removed slots display)
                document.getElementById('scholarshipCreatedBy').textContent = scholarship.created_by ?
                    `Created by: ${scholarship.created_by}` : '';

                // Set description and details
                document.getElementById('scholarshipDescription').textContent = scholarship.description;
                document.getElementById('scholarshipBenefits').textContent = scholarship.benefits;
                document.getElementById('scholarshipRequirements').textContent = scholarship.requirements;

                // Set application form if exists
                const formContainer = document.getElementById('applicationFormContainer');
                if (scholarship.application_form) {
                    const form = scholarship.application_form;
                    document.getElementById('applicationFormLink').textContent = form.title;
                    document.getElementById('applicationFormLink').href = form.file_url;
                    document.getElementById('applicationFormSize').textContent = form.file_size;
                    formContainer.style.display = 'block';
                } else {
                    formContainer.style.display = 'none';
                }

                // Set dates
                document.getElementById('scholarshipCreatedAt').textContent = formatDateTime(scholarship.created_at);
                document.getElementById('scholarshipUpdatedAt').textContent = formatDateTime(scholarship.updated_at);

                // Open modal
                modal.classList.remove('loading');
                modal.classList.add('active');
                document.body.classList.add('no-scroll');
            } else {
                throw new Error(data.error || 'Failed to load scholarship details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'An error occurred while loading scholarship details', 'error');
            modal.classList.remove('loading');
        });
}

function closeScholarshipViewModal() {
    const modal = document.getElementById('scholarshipViewModal');
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
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

// ------------------------------------------------- Edit Function -----------------------------------------------------
// Open Edit Scholarship Modal
function openEditScholarshipModal(scholarshipId) {
    // Show loading state
    const modal = document.getElementById('scholarshipEditModal');
    modal.classList.add('loading');

    // Clear any previous errors
    document.getElementById('scholarshipEditFormResponse').innerHTML = '';

    fetch(`/api/scholarships/${scholarshipId}/`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Failed to load scholarship details');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const scholarship = data.scholarship;

                // Set form values
                document.getElementById('editScholarshipId').value = scholarship.id;
                document.getElementById('editName').value = scholarship.name;
                document.getElementById('editType').value = scholarship.scholarship_type;
                document.getElementById('editDescription').value = scholarship.description;
                document.getElementById('editBenefits').value = scholarship.benefits;
                document.getElementById('editRequirements').value = scholarship.requirements;
                document.getElementById('editStatus').checked = scholarship.is_active;

                // Handle application form if exists
                if (scholarship.application_form) {
                    const formContainer = document.getElementById('editFilePreviewContainer');
                    const fileNamePreview = document.getElementById('editFileNamePreview');
                    const fileSizePreview = document.getElementById('editFileSizePreview');

                    fileNamePreview.textContent = scholarship.application_form.file_name;
                    fileSizePreview.textContent = scholarship.application_form.file_size;
                    formContainer.style.display = 'block';
                }

                // Open modal
                modal.classList.remove('loading');
                modal.classList.add('active');
                document.body.classList.add('no-scroll');
            } else {
                throw new Error(data.error || 'Failed to load scholarship details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'An error occurred while loading scholarship details', 'error');
            modal.classList.remove('loading');
        });
}

// Close Edit Scholarship Modal
function closeScholarshipEditModal() {
    document.getElementById('scholarshipEditModal').classList.remove('active');
    document.body.classList.remove('no-scroll');
    document.getElementById('scholarshipEditFormResponse').innerHTML = '';
    document.getElementById('scholarshipEditForm').reset();

    // Reset file preview
    const filePreviewContainer = document.getElementById('editFilePreviewContainer');
    if (filePreviewContainer) {
        filePreviewContainer.style.display = 'none';
    }

    // Remove error classes
    document.querySelectorAll('#scholarshipEditForm .error, #scholarshipEditForm .has-error').forEach(el => {
        el.classList.remove('error', 'has-error');
    });
}

// Handle Edit Form Submission
document.getElementById('scholarshipEditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const scholarshipId = document.getElementById('editScholarshipId').value;

    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'block';

    const formData = new FormData(form);

    fetch(`/api/scholarships/${scholarshipId}/edit/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': formData.get('csrfmiddlewaretoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Success toast and close modal
            showToast(data.message || 'Scholarship updated successfully!', 'success');
            closeScholarshipEditModal();

            // Reload after delay to show toast
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            // Reset button state
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';

            const responseDiv = document.getElementById('scholarshipEditFormResponse');
            responseDiv.innerHTML = '';

            if (data.errors) {
                // Show error toast for form errors
                const firstError = Object.values(data.errors)[0][0];
                showToast(firstError, 'error');

                // Display detailed form errors
                let errorHtml = '<div class="alert alert-danger"><ul>';
                for (const field in data.errors) {
                    data.errors[field].forEach(error => {
                        errorHtml += `<li>${error}</li>`;
                        // Highlight problematic fields
                        const input = form.querySelector(`[name="${field}"]`);
                        if (input) {
                            input.classList.add('error');
                            const formGroup = input.closest('.form-group');
                            if (formGroup) {
                                formGroup.classList.add('has-error');
                            }
                        }
                    });
                }
                errorHtml += '</ul></div>';
                responseDiv.innerHTML = errorHtml;
            } else if (data.message) {
                // Show error message as toast
                showToast(data.message, 'error');
                responseDiv.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
            }
        }
    })
    .catch(error => {
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        showToast('An error occurred. Please try again.', 'error');
        document.getElementById('scholarshipEditFormResponse').innerHTML =
            `<div class="alert alert-danger">An error occurred. Please try again.</div>`;
        console.error('Error:', error);
    });
});

// File upload preview for edit form
function initializeEditFileUploadPreview() {
    const fileInput = document.getElementById('editApplicationForm');
    const filePreviewContainer = document.getElementById('editFilePreviewContainer');
    const fileNamePreview = document.getElementById('editFileNamePreview');
    const fileSizePreview = document.getElementById('editFileSizePreview');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];

                // Validate file type
                if (!file.type.includes('pdf')) {
                    showToast('Please upload a PDF file only', 'error');
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

function removeEditUploadedFile() {
    const fileInput = document.getElementById('editApplicationForm');
    const filePreviewContainer = document.getElementById('editFilePreviewContainer');

    fileInput.value = '';
    filePreviewContainer.style.display = 'none';
}

// Add input validation styling for edit form
document.querySelectorAll('#scholarshipEditForm input, #scholarshipEditForm select, #scholarshipEditForm textarea').forEach(input => {
    input.addEventListener('input', function() {
        this.classList.remove('error');
        const formGroup = this.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('has-error');
        }
    });
});

// Initialize file upload preview when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEditFileUploadPreview();
});

// ------------------------------------------------- Archived Function -------------------------------------------------
// Open Archive Scholarship Modal
function openArchiveScholarshipModal(scholarshipId, scholarshipName) {
    // Show loading state
    const modal = document.getElementById('archiveScholarshipModal');
    modal.classList.add('loading');

    // Clear any previous errors
    document.getElementById('scholarshipArchiveFormResponse').innerHTML = '';

    // Fetch additional scholarship details if needed
    fetch(`/api/scholarships/${scholarshipId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const scholarship = data.scholarship;

                // Update form action URL with the scholarship ID
                const urlTemplate = document.getElementById('scholarshipArchiveForm').getAttribute('data-url-template');
                document.getElementById('scholarshipArchiveForm').action = urlTemplate.replace('0', scholarshipId);

                // Set form values
                document.getElementById('archiveScholarshipId').value = scholarshipId;
                document.getElementById('archiveScholarshipName').textContent = scholarshipName;
                document.getElementById('archiveScholarshipType').textContent = scholarship.scholarship_type;
                document.getElementById('archiveScholarshipStatus').textContent = scholarship.is_active ? 'Active' : 'Inactive';

                // Clear notes
                document.getElementById('archiveScholarshipNotes').value = '';

                // Open modal
                modal.classList.remove('loading');
                modal.classList.add('active');
                document.body.classList.add('no-scroll');
            } else {
                throw new Error(data.error || 'Failed to load scholarship details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'An error occurred while loading scholarship details', 'error');
            modal.classList.remove('loading');
        });
}

// Close Archive Scholarship Modal
function closeArchiveScholarshipModal() {
    document.getElementById('archiveScholarshipModal').classList.remove('active');
    document.body.classList.remove('no-scroll');
    document.getElementById('scholarshipArchiveFormResponse').innerHTML = '';
}

// Handle Archive Form Submission
document.getElementById('scholarshipArchiveForm').addEventListener('submit', function(e) {
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
            showToast('Scholarship archived successfully!', 'success');
            setTimeout(() => {
                closeArchiveScholarshipModal();
                location.reload();
            }, 1500);
        } else {
            throw new Error(data.error || 'Failed to archive scholarship');
        }
    })
    .catch(error => {
        showToast(error.message || 'An error occurred while archiving the scholarship', 'error');
        document.getElementById('scholarshipArchiveFormResponse').innerHTML =
            `<div class="alert alert-danger">${error.message}</div>`;
    })
    .finally(() => {
        btnText.style.display = 'block';
        loader.style.display = 'none';
    });
});

// ----------------------------------------- Search and Sorting Function -----------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Initialize table sorting and filtering with AJAX
    initScholarshipTable();
});

function initScholarshipTable() {
    const table = document.getElementById('scholarships-table');
    const tableContainer = document.getElementById('scholarships-table-container');
    const searchInput = document.getElementById('scholarship-search');
    const typeFilter = document.getElementById('scholarship-type-filter');
    const statusFilter = document.getElementById('scholarship-status-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const sortableHeaders = table.querySelectorAll('th[data-sort]');
    const tbody = table.querySelector('tbody');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

    if (!table) {
        console.error('Scholarships table not found');
        return;
    }

    console.log('Initializing scholarship table...');

    let currentSortColumn = 'created_at';
    let currentSortDirection = 'desc';

    // Initialize sorting for headers
    sortableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            console.log('Sorting by:', column);

            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }

            // Update sort indicators
            sortableHeaders.forEach(h => {
                const icon = h.querySelector('i');
                if (icon) {
                    if (h === header) {
                        icon.className = currentSortDirection === 'asc' ? 'bx bx-sort-up' : 'bx bx-sort-down';
                    } else {
                        icon.className = 'bx bx-sort';
                    }
                }
            });

            fetchAndDisplayScholarships();
        });
    });

    // Initialize search event
    searchInput.addEventListener('input', debounce(function() {
        console.log('Search input changed:', searchInput.value);
        fetchAndDisplayScholarships();
    }, 300));

    // Initialize filter events
    typeFilter.addEventListener('change', function() {
        console.log('Type filter changed:', this.value);
        fetchAndDisplayScholarships();
    });

    statusFilter.addEventListener('change', function() {
        console.log('Status filter changed:', this.value);
        fetchAndDisplayScholarships();
    });

    // Clear filters
    clearFiltersBtn.addEventListener('click', function() {
        searchInput.value = '';
        typeFilter.value = 'all';
        statusFilter.value = 'all';
        fetchAndDisplayScholarships();
    });

    function fetchAndDisplayScholarships() {
        const searchTerm = searchInput.value;
        const typeFilterValue = typeFilter.value;
        const statusFilterValue = statusFilter.value;
        const currentPage = new URLSearchParams(window.location.search).get('scholarship_page') || 1;

        console.log('Fetching scholarships with:', {
            search: searchTerm,
            type: typeFilterValue,
            status: statusFilterValue,
            page: currentPage,
            sort: currentSortColumn,
            direction: currentSortDirection
        });

        // Show loading indicator over table only
        const loadingElement = document.getElementById('scholarships-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }

        // Build URL parameters
        const params = new URLSearchParams({
            get_filtered_scholarships: '1',
            search: searchTerm,
            scholarship_type: typeFilterValue,
            status: statusFilterValue,
            sort: currentSortColumn,
            direction: currentSortDirection,
            scholarship_page: currentPage,
            per_page: '10'
        });

        console.log('Request URL params:', params.toString());

        // Make AJAX request with pagination
        fetch(`?${params.toString()}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrfToken || ''
            }
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received scholarships data:', data);
            if (data.scholarships) {
                updateScholarshipsTableWithData(data.scholarships);
                updateScholarshipsPaginationControls(data);
            } else {
                console.error('No scholarships data in response:', data);
                showErrorInTable('No data received from server');
            }

            // Hide loading indicator
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching scholarship data:', error);
            showErrorInTable('Error loading scholarships: ' + error.message);

            // Hide loading indicator even on error
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        });
    }

    function showErrorInTable(message) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: red;">${message}</td></tr>`;
    }

    function updateScholarshipsPaginationControls(data) {
        let paginationContainer = document.querySelector('.pagination-container');

        // If pagination container doesn't exist, create it
        if (!paginationContainer) {
            const tableContainer = document.getElementById('scholarships-table-container');
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-container';
            tableContainer.appendChild(paginationContainer);
        }

        // Clear existing content
        paginationContainer.innerHTML = '';

        // Only show pagination if we have pagination data and multiple pages
        if (data.pagination && data.pagination.num_pages > 1) {
            const paginationInfo = document.createElement('div');
            paginationInfo.className = 'pagination-info';
            paginationInfo.textContent = `Showing ${data.pagination.start_index} to ${data.pagination.end_index} of ${data.pagination.total_count} entries`;
            paginationContainer.appendChild(paginationInfo);

            const paginationControls = document.createElement('div');
            paginationControls.className = 'pagination-controls';

            // First page button
            if (data.pagination.has_previous) {
                const firstPageBtn = createPaginationButton('first-page', 1, 'First Page', 'bx bx-chevrons-left');
                paginationControls.appendChild(firstPageBtn);
            } else {
                const firstPageBtn = createDisabledPaginationButton('first-page', 'First Page', 'bx bx-chevrons-left');
                paginationControls.appendChild(firstPageBtn);
            }

            // Previous page button
            if (data.pagination.has_previous) {
                const prevPageBtn = createPaginationButton('prev-page', data.pagination.current_page - 1, 'Previous Page', 'bx bx-chevron-left');
                paginationControls.appendChild(prevPageBtn);
            } else {
                const prevPageBtn = createDisabledPaginationButton('prev-page', 'Previous Page', 'bx bx-chevron-left');
                paginationControls.appendChild(prevPageBtn);
            }

            // Page numbers
            const pageNumbers = document.createElement('div');
            pageNumbers.className = 'page-numbers';

            // Show limited page numbers around current page
            const startPage = Math.max(1, data.pagination.current_page - 2);
            const endPage = Math.min(data.pagination.num_pages, data.pagination.current_page + 2);

            for (let i = startPage; i <= endPage; i++) {
                if (i === data.pagination.current_page) {
                    const currentPageBtn = document.createElement('span');
                    currentPageBtn.className = 'pagination-btn current-page active';
                    currentPageBtn.textContent = i;
                    pageNumbers.appendChild(currentPageBtn);
                } else {
                    const pageBtn = createPaginationButton('page-number', i, `Page ${i}`, i);
                    pageNumbers.appendChild(pageBtn);
                }
            }

            paginationControls.appendChild(pageNumbers);

            // Next page button
            if (data.pagination.has_next) {
                const nextPageBtn = createPaginationButton('next-page', data.pagination.current_page + 1, 'Next Page', 'bx bx-chevron-right');
                paginationControls.appendChild(nextPageBtn);
            } else {
                const nextPageBtn = createDisabledPaginationButton('next-page', 'Next Page', 'bx bx-chevron-right');
                paginationControls.appendChild(nextPageBtn);
            }

            // Last page button
            if (data.pagination.has_next) {
                const lastPageBtn = createPaginationButton('last-page', data.pagination.num_pages, 'Last Page', 'bx bx-chevrons-right');
                paginationControls.appendChild(lastPageBtn);
            } else {
                const lastPageBtn = createDisabledPaginationButton('last-page', 'Last Page', 'bx bx-chevrons-right');
                paginationControls.appendChild(lastPageBtn);
            }

            paginationContainer.appendChild(paginationControls);

            // Add event listeners to pagination buttons
            paginationContainer.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
                btn.addEventListener('click', function() {
                    const page = this.getAttribute('data-page');
                    console.log('Changing to page:', page);

                    // Update URL without reloading
                    const url = new URL(window.location);
                    url.searchParams.set('scholarship_page', page);
                    window.history.pushState({}, '', url);

                    // Fetch data for the new page
                    fetchAndDisplayScholarships();
                });
            });
        } else if (data.pagination) {
            // Show simple info if only one page
            const paginationInfo = document.createElement('div');
            paginationInfo.className = 'pagination-info';
            paginationInfo.textContent = `Showing all ${data.pagination.total_count} entries`;
            paginationContainer.appendChild(paginationInfo);
        }
    }

    function createPaginationButton(className, page, title, content) {
        const button = document.createElement('a');
        button.href = 'javascript:void(0);';
        button.className = `pagination-btn ${className}`;
        button.title = title;
        button.setAttribute('data-page', page);

        if (typeof content === 'string' && content.includes('bx')) {
            button.innerHTML = `<i class="${content}"></i>`;
        } else {
            button.textContent = content;
        }

        return button;
    }

    function createDisabledPaginationButton(className, title, iconClass) {
        const button = document.createElement('span');
        button.className = `pagination-btn ${className} disabled`;
        button.title = title;
        button.innerHTML = `<i class="${iconClass}"></i>`;
        return button;
    }

    function updateScholarshipsTableWithData(scholarships) {
        console.log('Updating table with', scholarships.length, 'scholarships');

        // Clear existing rows
        tbody.innerHTML = '';

        if (scholarships.length === 0) {
            const noDataRow = document.createElement('tr');
            const noDataCell = document.createElement('td');
            noDataCell.colSpan = 4; // Changed from 5 to 4 columns
            noDataCell.textContent = 'No scholarships found matching your criteria';
            noDataCell.style.textAlign = 'center';
            noDataCell.style.padding = '20px';
            noDataCell.style.fontStyle = 'italic';
            noDataCell.style.color = '#888';
            noDataRow.appendChild(noDataCell);
            tbody.appendChild(noDataRow);
            return;
        }

        // Add new rows
        scholarships.forEach(scholarship => {
            const row = document.createElement('tr');
            if (scholarship.created_at) {
                row.dataset.createdAt = scholarship.created_at;
            }

            // Name
            const nameCell = document.createElement('td');
            nameCell.textContent = scholarship.name || 'Unnamed Scholarship';
            row.appendChild(nameCell);

            // Type
            const typeCell = document.createElement('td');
            typeCell.textContent = scholarship.type_display || scholarship.type || 'N/A';
            row.appendChild(typeCell);

            // Status (REMOVED Slots column)
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            const isActive = scholarship.is_active === true || scholarship.is_active === 'true';
            statusBadge.className = `status-badge ${isActive ? 'active' : 'inactive'}`;
            statusBadge.textContent = isActive ? 'Active' : 'Inactive';
            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);

            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions';

            // View button
            if (scholarship.can_view !== false) {
                const viewBtn = document.createElement('button');
                viewBtn.className = 'btn-icon btn-view-scholarship';
                viewBtn.title = 'View';
                viewBtn.onclick = function() {
                    if (scholarship.id) {
                        openScholarshipViewModal(scholarship.id);
                    }
                };
                viewBtn.innerHTML = '<i class="ri-eye-fill"></i>';
                actionsCell.appendChild(viewBtn);
            }

            // Edit button
            if (scholarship.can_edit) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-icon btn-edit-scholarship';
                editBtn.title = 'Edit';
                editBtn.onclick = function() {
                    if (scholarship.id) {
                        openEditScholarshipModal(scholarship.id);
                    }
                };
                editBtn.innerHTML = '<i class="bx bx-edit"></i>';
                actionsCell.appendChild(editBtn);
            }

            // Archive button
            if (scholarship.can_delete) {
                const archiveBtn = document.createElement('button');
                archiveBtn.className = 'btn-icon btn-archive-scholarship';
                archiveBtn.title = 'Archive';
                archiveBtn.onclick = function() {
                    if (scholarship.id && scholarship.name) {
                        openArchiveScholarshipModal(scholarship.id, scholarship.name);
                    }
                };
                archiveBtn.innerHTML = '<i class="bx bxs-archive"></i>';
                actionsCell.appendChild(archiveBtn);
            }

            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    }

    // Make fetchAndDisplayScholarships available globally
    window.fetchAndDisplayScholarships = fetchAndDisplayScholarships;

    // Initial load
    const existingRows = tbody.querySelectorAll('tr');
    if (existingRows.length <= 1) {
        console.log('Performing initial AJAX load...');
        fetchAndDisplayScholarships();
    } else {
        console.log('Table already has data, skipping initial AJAX load');
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

// Handle browser back/forward buttons
window.addEventListener('popstate', function() {
    console.log('URL changed, refreshing scholarships data');
    if (typeof window.fetchAndDisplayScholarships === 'function') {
        window.fetchAndDisplayScholarships();
    }
});