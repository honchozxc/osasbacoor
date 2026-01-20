// ------------------------------------------------ Export Function ----------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-complaint-btn');
    const exportResolvedBtn = document.getElementById('export-resolved-btn');
    const exportModal = document.getElementById('exportComplaintModal');

    // Check if modal exists before proceeding
    if (!exportModal) {
        console.error('Export modal not found!');
        return;
    }

    const cancelExportBtn = document.getElementById('cancelComplaintExport');
    const confirmExportBtn = document.getElementById('confirmComplaintExport');
    const closeBtn = exportModal.querySelector('.export-modal-close');
    const exportForm = document.getElementById('exportComplaintForm');
    const exportOptions = exportModal.querySelectorAll('input[name="export_option"]');

    // Get all options sections
    const respondentOptions = document.getElementById('respondentOptions');
    const statusOptions = document.getElementById('statusOptions');
    const customOptions = document.getElementById('customOptions');
    const sourceSectionInput = document.getElementById('exportSourceSection');

    // Function to hide all option sections
    function hideAllOptions() {
        if (respondentOptions) respondentOptions.style.display = 'none';
        if (statusOptions) statusOptions.style.display = 'none';
        if (customOptions) customOptions.style.display = 'none';
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            if (sourceSectionInput) {
                sourceSectionInput.value = 'under_review';
            }
            exportModal.classList.add('active');
            // Initialize with correct options visible
            hideAllOptions();
        });
    }

    if (exportResolvedBtn) {
        exportResolvedBtn.addEventListener('click', function() {
            if (sourceSectionInput) {
                sourceSectionInput.value = 'resolved';
            }
            exportModal.classList.add('active');
            // Initialize with correct options visible
            hideAllOptions();
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

    // Handle export option changes
    if (exportOptions.length > 0) {
        exportOptions.forEach(option => {
            option.addEventListener('change', function() {
                hideAllOptions();

                switch(this.value) {
                    case 'by_respondent':
                        if (respondentOptions) respondentOptions.style.display = 'block';
                        break;
                    case 'by_status':
                        if (statusOptions) statusOptions.style.display = 'block';
                        break;
                    case 'custom':
                        if (customOptions) customOptions.style.display = 'block';
                        break;
                    default:
                        hideAllOptions();
                }
            });
        });
    }

    // Handle export confirmation
    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', function() {
            // Show loading state
            this.classList.add('btn-loading');
            this.disabled = true;

            // Submit the form
            setTimeout(() => {
                exportForm.submit();
                closeExportModal();

                // Reset button state
                this.classList.remove('btn-loading');
                this.disabled = false;
            }, 500);
        });
    }
});

// ------------------------------------------- Search and Sorting Function ---------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    console.log('DOMContentLoaded - Initializing complaint tables');

    window.currentSortColumnUnderReview = 'created_at';
    window.currentSortDirectionUnderReview = 'desc';
    window.currentSortColumnResolved = 'updated_at';
    window.currentSortDirectionResolved = 'desc';

    window.csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

    if (!window.csrfToken) {
        console.error('CSRF token not found');
    }

    setTimeout(() => {
        const underReviewSearch = document.getElementById('under-review-search');
        const resolvedSearch = document.getElementById('resolved-search');
        const underReviewDateFilter = document.getElementById('underReviewDateFilter');
        const resolvedDateFilter = document.getElementById('resolvedDateFilter');
        const urlParams = new URLSearchParams(window.location.search);

        const hasActiveFiltersUnderReview =
            (underReviewSearch && underReviewSearch.value !== '') ||
            (underReviewDateFilter && underReviewDateFilter.value !== 'all') ||
            urlParams.has('under_review_page') ||
            urlParams.has('search') ||
            urlParams.has('date');

        const hasActiveFiltersResolved =
            (resolvedSearch && resolvedSearch.value !== '') ||
            (resolvedDateFilter && resolvedDateFilter.value !== 'all') ||
            urlParams.has('resolved_page') ||
            urlParams.has('search') ||
            urlParams.has('date');

        if (hasActiveFiltersUnderReview) {
            initComplaintsTable('under-review');
        } else {
            setupFilterEventListeners('under-review');
            attachComplaintEventListeners();
        }

        if (hasActiveFiltersResolved) {
            initComplaintsTable('resolved');
        } else {
            setupFilterEventListeners('resolved');
            attachComplaintEventListeners();
        }
    }, 100);
});

function setupFilterEventListeners(type) {
    console.log(`Setting up filter listeners for ${type} without initial fetch`);

    const searchInput = document.getElementById(`${type}-search`);
    let dateFilter;

    if (type === 'under-review') {
        dateFilter = document.getElementById('underReviewDateFilter');
    } else {
        dateFilter = document.getElementById('resolvedDateFilter');
    }

    if (!searchInput || !dateFilter) {
        console.error(`Could not find elements for ${type} table`);
        return;
    }

    searchInput.addEventListener('input', debounce(function() {
        console.log(`${type} search input:`, searchInput.value);
        if (type === 'under-review') {
            if (typeof window.fetchAndDisplayUnderReviewComplaints === 'function') {
                window.fetchAndDisplayUnderReviewComplaints();
            }
        } else {
            if (typeof window.fetchAndDisplayResolvedComplaints === 'function') {
                window.fetchAndDisplayResolvedComplaints();
            }
        }
    }, 300));

    dateFilter.addEventListener('change', function() {
        console.log(`${type} date filter changed:`, dateFilter.value);
        if (type === 'under-review') {
            if (typeof window.fetchAndDisplayUnderReviewComplaints === 'function') {
                window.fetchAndDisplayUnderReviewComplaints();
            }
        } else {
            if (typeof window.fetchAndDisplayResolvedComplaints === 'function') {
                window.fetchAndDisplayResolvedComplaints();
            }
        }
    });

    if (type === 'under-review') {
        window.fetchAndDisplayUnderReviewComplaints = createFetchFunction('under-review');
    } else {
        window.fetchAndDisplayResolvedComplaints = createFetchFunction('resolved');
    }

    const table = document.getElementById(`${type}-table`);
    if (table) {
        const sortableHeaders = table.querySelectorAll('th[data-sort]');

        sortableHeaders.forEach(header => {
            header.style.cursor = 'pointer';

            if (!header.querySelector('i')) {
                const icon = document.createElement('i');
                icon.className = 'bx bx-sort';
                header.appendChild(icon);
            }

            header.addEventListener('click', () => {
                const column = header.getAttribute('data-sort');
                let currentSortColumn, currentSortDirection;

                if (type === 'under-review') {
                    currentSortColumn = window.currentSortColumnUnderReview;
                    currentSortDirection = window.currentSortDirectionUnderReview;
                } else {
                    currentSortColumn = window.currentSortColumnResolved;
                    currentSortDirection = window.currentSortDirectionResolved;
                }

                if (currentSortColumn === column) {
                    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortColumn = column;
                    currentSortDirection = 'asc';
                }

                sortableHeaders.forEach(h => {
                    const icon = h.querySelector('i');
                    if (h === header) {
                        icon.className = currentSortDirection === 'asc' ? 'bx bx-sort-up' : 'bx bx-sort-down';
                    } else {
                        icon.className = 'bx bx-sort';
                    }
                });

                if (type === 'under-review') {
                    window.currentSortColumnUnderReview = currentSortColumn;
                    window.currentSortDirectionUnderReview = currentSortDirection;
                } else {
                    window.currentSortColumnResolved = currentSortColumn;
                    window.currentSortDirectionResolved = currentSortDirection;
                }

                if (type === 'under-review') {
                    if (typeof window.fetchAndDisplayUnderReviewComplaints === 'function') {
                        window.fetchAndDisplayUnderReviewComplaints();
                    }
                } else {
                    if (typeof window.fetchAndDisplayResolvedComplaints === 'function') {
                        window.fetchAndDisplayResolvedComplaints();
                    }
                }
            });
        });
    }
}

function createFetchFunction(type) {
    return function() {
        const searchInput = document.getElementById(`${type}-search`);
        const statusFilter = document.getElementById('statusFilter');
        let dateFilter;

        if (type === 'under-review') {
            dateFilter = document.getElementById('underReviewDateFilter');
        } else {
            dateFilter = document.getElementById('resolvedDateFilter');
        }

        if (!searchInput || !dateFilter) {
            console.error(`Could not find elements for ${type} table`);
            return;
        }

        const searchTerm = searchInput.value;
        const dateFilterValue = dateFilter.value;
        const statusFilterValue = type === 'under-review' ? (statusFilter ? statusFilter.value : 'all') : 'resolved';
        const currentPage = new URLSearchParams(window.location.search).get(`${type === 'under-review' ? 'under_review_page' : 'resolved_page'}`) || 1;

        // Get current sort values
        let currentSortColumn, currentSortDirection;
        if (type === 'under-review') {
            currentSortColumn = window.currentSortColumnUnderReview;
            currentSortDirection = window.currentSortDirectionUnderReview;
        } else {
            currentSortColumn = window.currentSortColumnResolved;
            currentSortDirection = window.currentSortDirectionResolved;
        }

        showTableLoading(type);

        const url = new URL(window.location);
        url.searchParams.set('get_filtered_complaints', '1');
        url.searchParams.set('status', type === 'under-review' ? 'under_review' : 'resolved');
        url.searchParams.set('search', searchTerm);
        url.searchParams.set('date', dateFilterValue);
        url.searchParams.set('sort', currentSortColumn);
        url.searchParams.set('direction', currentSortDirection);
        url.searchParams.set(type === 'under-review' ? 'under_review_page' : 'resolved_page', currentPage);
        url.searchParams.set('per_page', '10');

        console.log(`Fetching ${type} complaints:`, url.toString());

        fetch(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': window.csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(`Received ${type} complaints data:`, data);
            updateComplaintsTableWithData(type, data.complaints, statusFilterValue);
            updateComplaintsPaginationControls(type, data);
            hideTableLoading(type);
        })
        .catch(error => {
            console.error('Error fetching complaint data:', error);
            hideTableLoading(type);

            const table = document.getElementById(`${type}-table`);
            if (table) {
                const tbody = table.querySelector('tbody');
                const errorRow = document.createElement('tr');
                errorRow.innerHTML = `<td colspan="${table.querySelectorAll('th').length}" style="text-align: center; padding: 20px; color: red;">Error loading complaints: ${error.message}</td>`;
                tbody.appendChild(errorRow);
            }
        });
    };
}

// Add status filter event listener
const statusFilter = document.getElementById('statusFilter');
if (statusFilter) {
    statusFilter.addEventListener('change', function() {
        if (typeof window.fetchAndDisplayUnderReviewComplaints === 'function') {
            window.fetchAndDisplayUnderReviewComplaints();
        }
    });
}

function initComplaintsTable(type) {
    console.log(`Initializing ${type} complaints table`);

    const table = document.getElementById(`${type}-table`);
    if (!table) {
        console.error(`Table with id ${type}-table not found`);
        return;
    }

    setupFilterEventListeners(type);

    if (type === 'under-review') {
        if (typeof window.fetchAndDisplayUnderReviewComplaints === 'function') {
            window.fetchAndDisplayUnderReviewComplaints();
        }
    } else {
        if (typeof window.fetchAndDisplayResolvedComplaints === 'function') {
            window.fetchAndDisplayResolvedComplaints();
        }
    }
}

function showTableLoading(type) {
    const table = document.getElementById(`${type}-table`);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const paginationContainer = document.querySelector(`#${type}-table-container .pagination-container`);

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        row.style.display = 'none';
    });

    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }

    let loadingRow = document.getElementById(`${type}-loading-row`);
    if (!loadingRow) {
        loadingRow = document.createElement('tr');
        loadingRow.id = `${type}-loading-row`;
        const loadingCell = document.createElement('td');
        loadingCell.colSpan = table.querySelectorAll('th').length;
        loadingCell.style.textAlign = 'center';
        loadingCell.style.padding = '40px';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<div class="spinner"></div>';

        const loadingText = document.createElement('div');
        loadingText.textContent = 'Loading complaints...';
        loadingText.style.marginTop = '10px';
        loadingText.style.color = '#666';

        loadingCell.appendChild(spinner);
        loadingCell.appendChild(loadingText);
        loadingRow.appendChild(loadingCell);
        tbody.appendChild(loadingRow);
    }

    loadingRow.style.display = '';
}

function hideTableLoading(type) {
    const table = document.getElementById(`${type}-table`);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const paginationContainer = document.querySelector(`#${type}-table-container .pagination-container`);

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        row.style.display = '';
    });

    if (paginationContainer) {
        paginationContainer.style.display = '';
    }

    const loadingRow = document.getElementById(`${type}-loading-row`);
    if (loadingRow) {
        loadingRow.style.display = 'none';
    }
}

function updateComplaintsPaginationControls(type, data) {
    let paginationContainer = document.querySelector(`#${type}-table-container .pagination-container`);

    if (!paginationContainer) {
        const tableContainer = document.getElementById(`${type}-table-container`);
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        tableContainer.appendChild(paginationContainer);
    }

    paginationContainer.innerHTML = '';

    if (data.pagination && data.pagination.num_pages > 1) {
        const paginationInfo = document.createElement('div');
        paginationInfo.className = 'pagination-info';
        paginationInfo.textContent = `Showing ${data.pagination.start_index} to ${data.pagination.end_index} of ${data.pagination.total_count} entries`;
        paginationContainer.appendChild(paginationInfo);

        const paginationControls = document.createElement('div');
        paginationControls.className = 'pagination-controls';

        if (data.pagination.has_previous) {
            const firstPageBtn = document.createElement('a');
            firstPageBtn.href = 'javascript:void(0);';
            firstPageBtn.className = 'pagination-btn first-page';
            firstPageBtn.title = 'First Page';
            firstPageBtn.setAttribute('data-page', 1);
            firstPageBtn.innerHTML = '<i class="bx bx-chevrons-left"></i>';
            paginationControls.appendChild(firstPageBtn);
        } else {
            const firstPageBtn = document.createElement('span');
            firstPageBtn.className = 'pagination-btn first-page disabled';
            firstPageBtn.title = 'First Page';
            firstPageBtn.innerHTML = '<i class="bx bx-chevrons-left"></i>';
            paginationControls.appendChild(firstPageBtn);
        }

        if (data.pagination.has_previous) {
            const prevPageBtn = document.createElement('a');
            prevPageBtn.href = 'javascript:void(0);';
            prevPageBtn.className = 'pagination-btn prev-page';
            prevPageBtn.title = 'Previous Page';
            prevPageBtn.setAttribute('data-page', data.pagination.current_page - 1);
            prevPageBtn.innerHTML = '<i class="bx bx-chevron-left"></i>';
            paginationControls.appendChild(prevPageBtn);
        } else {
            const prevPageBtn = document.createElement('span');
            prevPageBtn.className = 'pagination-btn prev-page disabled';
            prevPageBtn.title = 'Previous Page';
            prevPageBtn.innerHTML = '<i class="bx bx-chevron-left"></i>';
            paginationControls.appendChild(prevPageBtn);
        }

        const pageNumbers = document.createElement('div');
        pageNumbers.className = 'page-numbers';

        const startPage = Math.max(1, data.pagination.current_page - 2);
        const endPage = Math.min(data.pagination.num_pages, data.pagination.current_page + 2);

        for (let i = startPage; i <= endPage; i++) {
            if (i === data.pagination.current_page) {
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
                pageNumbers.appendChild(pageBtn);
            }
        }

        paginationControls.appendChild(pageNumbers);

        if (data.pagination.has_next) {
            const nextPageBtn = document.createElement('a');
            nextPageBtn.href = 'javascript:void(0);';
            nextPageBtn.className = 'pagination-btn next-page';
            nextPageBtn.title = 'Next Page';
            nextPageBtn.setAttribute('data-page', data.pagination.current_page + 1);
            nextPageBtn.innerHTML = '<i class="bx bx-chevron-right"></i>';
            paginationControls.appendChild(nextPageBtn);
        } else {
            const nextPageBtn = document.createElement('span');
            nextPageBtn.className = 'pagination-btn next-page disabled';
            nextPageBtn.title = 'Next Page';
            nextPageBtn.innerHTML = '<i class="bx bx-chevron-right"></i>';
            paginationControls.appendChild(nextPageBtn);
        }

        if (data.pagination.has_next) {
            const lastPageBtn = document.createElement('a');
            lastPageBtn.href = 'javascript:void(0);';
            lastPageBtn.className = 'pagination-btn last-page';
            lastPageBtn.title = 'Last Page';
            lastPageBtn.setAttribute('data-page', data.pagination.num_pages);
            lastPageBtn.innerHTML = '<i class="bx bx-chevrons-right"></i>';
            paginationControls.appendChild(lastPageBtn);
        } else {
            const lastPageBtn = document.createElement('span');
            lastPageBtn.className = 'pagination-btn last-page disabled';
            lastPageBtn.title = 'Last Page';
            lastPageBtn.innerHTML = '<i class="bx bx-chevrons-right"></i>';
            paginationControls.appendChild(lastPageBtn);
        }

        paginationContainer.appendChild(paginationControls);

        paginationContainer.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                // Update URL without reloading
                const url = new URL(window.location);
                const pageParam = type === 'under-review' ? 'under_review_page' : 'resolved_page';
                url.searchParams.set(pageParam, page);
                window.history.pushState({}, '', url);

                if (type === 'under-review') {
                    if (typeof window.fetchAndDisplayUnderReviewComplaints === 'function') {
                        window.fetchAndDisplayUnderReviewComplaints();
                    }
                } else {
                    if (typeof window.fetchAndDisplayResolvedComplaints === 'function') {
                        window.fetchAndDisplayResolvedComplaints();
                    }
                }
            });
        });
    }
}

function updateComplaintsTableWithData(type, complaints, statusFilterValue = 'all') {
    const table = document.getElementById(`${type}-table`);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const noDataRow = document.getElementById(`${type}-no-data-row`);

    const existingRows = tbody.querySelectorAll(`tr:not(#${type}-no-data-row):not(#${type}-loading-row)`);
    existingRows.forEach(row => row.remove());

    if (!complaints || complaints.length === 0) {
        if (noDataRow) {
            noDataRow.style.display = '';
        } else {
            const newNoDataRow = document.createElement('tr');
            newNoDataRow.id = `${type}-no-data-row`;
            const noDataCell = document.createElement('td');
            noDataCell.colSpan = table.querySelectorAll('th').length;
            noDataCell.textContent = `No ${type.replace('-', ' ')} complaints found matching your criteria`;
            noDataCell.style.textAlign = 'center';
            noDataCell.style.padding = '20px';
            noDataCell.style.fontStyle = 'italic';
            noDataCell.style.color = '#888';
            newNoDataRow.appendChild(noDataCell);
            tbody.appendChild(newNoDataRow);
        }
        return;
    }

    if (noDataRow) {
        noDataRow.style.display = 'none';
    }

    complaints.forEach(complaint => {
        // Apply status filter if specified
        if (statusFilterValue !== 'all' && complaint.status !== statusFilterValue) {
            return;
        }

        const row = document.createElement('tr');
        row.dataset.id = complaint.id;

        // Reference Number
        const refCell = document.createElement('td');
        refCell.textContent = complaint.reference_number;
        row.appendChild(refCell);

        // Title
        const titleCell = document.createElement('td');
        titleCell.textContent = complaint.title;
        row.appendChild(titleCell);

        // Complainant
        const complainantCell = document.createElement('td');
        complainantCell.textContent = `${complaint.complainant_first_name} ${complaint.complainant_last_name}`;
        row.appendChild(complainantCell);

        // Date column (incident date for active, updated_at for resolved)
        const dateCell = document.createElement('td');
        if (type === 'under-review') {
            dateCell.textContent = formatDate(complaint.incident_date);
            dateCell.dataset.sort = complaint.incident_date;
        } else {
            dateCell.textContent = formatDate(complaint.updated_at);
            dateCell.dataset.sort = complaint.updated_at;
        }
        row.appendChild(dateCell);

        // Status
        const statusCell = document.createElement('td');
        let statusClass, statusText;

        // Determine status class based on complaint status
        if (type === 'under-review') {
            statusText = complaint.status_display || complaint.status;

            // Map status to CSS classes
            const statusClassMap = {
                'under_review': 'under-review',
                '1st_hearing': 'first-hearing',
                '2nd_hearing': 'second-hearing',
                'other_hearing': 'other-hearing',
                'ongoing_hearing': 'ongoing-hearing',
                'canceled': 'canceled',
                'resolved': 'resolved'
            };

            statusClass = `status-badge ${statusClassMap[complaint.status] || complaint.status.replace('_', '-')}`;
        } else {
            // For resolved section
            statusText = 'Resolved';
            statusClass = 'status-badge resolved';
        }

        const statusBadge = document.createElement('span');
        statusBadge.className = statusClass;
        statusBadge.textContent = statusText;
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Next Hearing (only for active complaints)
        if (type === 'under-review') {
            const nextHearingCell = document.createElement('td');
            nextHearingCell.textContent = complaint.next_hearing_display || 'No hearing scheduled';
            row.appendChild(nextHearingCell);
        }

        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions';

        // Resolve button (only for active complaints and admin users)
        if (complaint.can_resolve && type === 'under-review') {
            const resolveBtn = document.createElement('button');
            resolveBtn.className = 'btn-action resolve btn-icon';
            resolveBtn.title = 'Update Status';
            resolveBtn.setAttribute('data-id', complaint.id);
            resolveBtn.setAttribute('data-ref', complaint.reference_number);
            resolveBtn.setAttribute('data-title', complaint.title);
            resolveBtn.innerHTML = '<i class="bx bx-check"></i>';
            actionsCell.appendChild(resolveBtn);
        }

        // View button
        if (complaint.can_view) {
            const viewBtn = document.createElement('button');
            viewBtn.className = 'view-complaint btn-action view btn-icon';
            viewBtn.title = 'View Details';
            viewBtn.setAttribute('data-id', complaint.id);
            viewBtn.innerHTML = '<i class="bx bx-show"></i>';
            actionsCell.appendChild(viewBtn);
        }

        // Edit button (for admins)
        if (complaint.can_edit) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-action edit btn-icon edit-under-review';
            editBtn.title = 'Edit';
            editBtn.setAttribute('data-id', complaint.id);
            editBtn.innerHTML = '<i class="bx bx-edit"></i>';
            actionsCell.appendChild(editBtn);
        }

        // Archive button (for admins)
        if (complaint.can_delete) {
            const archiveBtn = document.createElement('button');
            archiveBtn.className = 'btn-icon archive archive-complaint btn-icon';
            archiveBtn.title = 'Archive Complaint';
            archiveBtn.setAttribute('data-id', complaint.id);
            archiveBtn.setAttribute('data-ref', complaint.reference_number);
            archiveBtn.setAttribute('data-title', complaint.title);
            archiveBtn.innerHTML = '<i class="bx bx-archive"></i>';
            actionsCell.appendChild(archiveBtn);
        }

        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });

    attachComplaintEventListeners();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
    console.log('Popstate event detected');
    if (typeof window.fetchAndDisplayUnderReviewComplaints === 'function') {
        window.fetchAndDisplayUnderReviewComplaints();
    }
    if (typeof window.fetchAndDisplayResolvedComplaints === 'function') {
        window.fetchAndDisplayResolvedComplaints();
    }
});

// Reattach event listeners to complaint action buttons
function attachComplaintEventListeners() {
    // Reattach event listeners for view buttons
    document.querySelectorAll('.view-complaint').forEach(button => {
        button.addEventListener('click', function() {
            const complaintId = this.getAttribute('data-id');
            console.log('View complaint:', complaintId);
            // Your view complaint logic here
        });
    });

    // Reattach event listeners for resolve buttons
    document.querySelectorAll('.btn-action.resolve').forEach(button => {
        button.addEventListener('click', function() {
            const complaintId = this.getAttribute('data-id');
            const refNumber = this.getAttribute('data-ref');
            const title = this.getAttribute('data-title');
            console.log('Resolve complaint:', complaintId, refNumber, title);
            // Your resolve complaint logic here
        });
    });

    // Reattach event listeners for edit buttons
    document.querySelectorAll('.edit-under-review').forEach(button => {
        button.addEventListener('click', function() {
            const complaintId = this.getAttribute('data-id');
            console.log('Edit complaint:', complaintId);
            // Your edit complaint logic here
        });
    });

    // Reattach event listeners for archive buttons
    document.querySelectorAll('.archive-complaint').forEach(button => {
        button.addEventListener('click', function() {
            const complaintId = this.getAttribute('data-id');
            const refNumber = this.getAttribute('data-ref');
            const title = this.getAttribute('data-title');
            console.log('Archive complaint:', complaintId, refNumber, title);
            // Your archive complaint logic here
        });
    });
}

// Debug function to check if everything is working
function debugComplaintsInit() {
    console.log('Debug: Checking complaints initialization');

    // Check if elements exist
    console.log('Under review table:', document.getElementById('under-review-table'));
    console.log('Resolved table:', document.getElementById('resolved-table'));
    console.log('Under review search:', document.getElementById('under-review-search'));
    console.log('Resolved search:', document.getElementById('resolved-search'));
    console.log('Under review date filter:', document.getElementById('underReviewDateFilter'));
    console.log('Resolved date filter:', document.getElementById('resolvedDateFilter'));

    // Check if CSRF token exists
    console.log('CSRF token:', document.querySelector('meta[name="csrf-token"]')?.content);

    // Check if functions are defined
    console.log('fetchAndDisplayUnderReviewComplaints:', typeof window.fetchAndDisplayUnderReviewComplaints);
    console.log('fetchAndDisplayResolvedComplaints:', typeof window.fetchAndDisplayResolvedComplaints);
}

// Run debug on load
setTimeout(debugComplaintsInit, 500);

// --------------------------------------------- Update Complaint Status Function --------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Status Update Modal
    const statusModal = document.getElementById('statusUpdateModal');
    const closeStatusButtons = document.querySelectorAll('.close-status-modal');
    const confirmStatusBtn = document.getElementById('confirmStatusUpdate');
    const statusSelect = document.getElementById('statusSelect');
    const hearingDetailsSection = document.getElementById('hearingDetailsSection');
    const hearingDateInput = document.getElementById('hearingDate');
    const hearingTimeInput = document.getElementById('hearingTime');
    const hearingLocationInput = document.getElementById('hearingLocation');
    const hearingDescriptionInput = document.getElementById('hearingDescription');

    let currentComplaintId = null;
    let currentComplaintRow = null;
    let currentComplaintStatus = null; // Store current status of complaint

    // Open modal when resolve button is clicked
    document.addEventListener('click', function(e) {
        if (e.target.closest('.resolve')) {
            const resolveBtn = e.target.closest('.resolve');
            currentComplaintId = resolveBtn.getAttribute('data-id');
            currentComplaintRow = resolveBtn.closest('tr');

            // Get complaint details
            const refNumber = resolveBtn.getAttribute('data-ref');
            const title = resolveBtn.getAttribute('data-title');

            // Get current status from table (assuming status is in 7th column)
            const statusCell = currentComplaintRow.querySelector('td:nth-child(7)');
            currentComplaintStatus = statusCell ? statusCell.getAttribute('data-status') || statusCell.textContent.trim().toLowerCase().replace(/\s+/g, '_') : null;

            // Get complainant name from table row
            const complainantCell = currentComplaintRow.querySelector('td:nth-child(3)');
            const complainantName = complainantCell ? complainantCell.textContent.trim() : 'N/A';

            // Populate modal
            document.getElementById('statusRefNumber').textContent = refNumber || 'N/A';
            document.getElementById('statusTitle').textContent = title || 'N/A';
            document.getElementById('statusComplainant').textContent = complainantName;

            // Reset form
            resetStatusForm();

            // Show modal
            statusModal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Set focus to status select
            setTimeout(() => {
                statusSelect.focus();
            }, 100);
        }
    });

    function resetStatusForm() {
        statusSelect.value = '';
        hearingDetailsSection.style.display = 'none';

        // ALWAYS CLEAR ALL HEARING FIELDS
        hearingDateInput.value = '';
        hearingTimeInput.value = '';
        hearingLocationInput.value = '';
        hearingDescriptionInput.value = '';
        document.getElementById('statusNotes').value = '';

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        hearingDateInput.min = today;

        // Set default time to next hour
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1);
        const formattedTime = nextHour.getHours().toString().padStart(2, '0') + ':00';
        hearingTimeInput.value = formattedTime;
    }

    // Show/hide hearing details based on status selection
    statusSelect.addEventListener('change', function() {
        const selectedValue = this.value;

        // Show hearing details for hearing statuses
        const isHearingStatus = selectedValue === '1st_hearing' ||
                               selectedValue === '2nd_hearing' ||
                               selectedValue === 'other_hearing' ||
                               selectedValue === 'ongoing_hearing';

        if (isHearingStatus) {
            hearingDetailsSection.style.display = 'block';

            // IMPORTANT: Always clear date field when selecting a hearing status
            // This ensures user MUST enter a new date every time
            hearingDateInput.value = '';

            // Set default date only for 1st and 2nd hearings
            if (selectedValue === '1st_hearing' || selectedValue === '2nd_hearing') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const formattedDate = tomorrow.toISOString().split('T')[0];
                hearingDateInput.value = formattedDate;
            }
            // For "other_hearing" and "ongoing_hearing", keep it empty
            else if (selectedValue === 'other_hearing' || selectedValue === 'ongoing_hearing') {
                hearingDateInput.value = '';
            }

            // Clear location and description as well (optional, you can keep if you want)
            // hearingLocationInput.value = '';
            // hearingDescriptionInput.value = '';
        } else {
            // For non-hearing statuses like "under_review", hide hearing details
            hearingDetailsSection.style.display = 'none';
        }
    });

    // Close modal
    closeStatusButtons.forEach(btn => {
        btn.addEventListener('click', closeStatusModal);
    });

    statusModal.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal-overlay')) {
            closeStatusModal();
        }
    });

    // Add escape key to close modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && statusModal.classList.contains('active')) {
            closeStatusModal();
        }
    });

    function closeStatusModal() {
        statusModal.classList.remove('active');
        document.body.style.overflow = '';
        resetStatusForm();
        currentComplaintId = null;
        currentComplaintRow = null;
        currentComplaintStatus = null;
    }

    // Handle status update
    confirmStatusBtn.addEventListener('click', function() {
        if (!currentComplaintId) {
            showToast('No complaint selected', 'error');
            return;
        }

        const status = statusSelect.value;
        const notes = document.getElementById('statusNotes').value;

        if (!status) {
            showToast('Please select a status', 'error');
            return;
        }

        // Validate hearing details if applicable
        let hearingData = null;
        const isHearingStatus = status === '1st_hearing' ||
                               status === '2nd_hearing' ||
                               status === 'other_hearing' ||
                               status === 'ongoing_hearing';

        if (isHearingStatus) {
            const hearingDate = hearingDateInput.value;
            const hearingTime = hearingTimeInput.value;
            const hearingLocation = hearingLocationInput.value;
            const hearingDescription = hearingDescriptionInput.value;

            // Debug logging
            console.log('DEBUG - Hearing form values:');
            console.log('  Date:', hearingDate);
            console.log('  Time:', hearingTime);
            console.log('  Location:', hearingLocation);
            console.log('  Description:', hearingDescription);

            // Basic validation
            if (!hearingDate || !hearingTime || !hearingLocation) {
                showToast('Please fill all required hearing details', 'error');
                return;
            }

            // Check if date is not in the past
            const selectedDateTime = new Date(hearingDate + 'T' + hearingTime);
            const now = new Date();

            if (selectedDateTime < now) {
                showToast('Hearing date and time cannot be in the past', 'error');
                return;
            }

            hearingData = {
                schedule_date: hearingDate,
                schedule_time: hearingTime,
                location: hearingLocation,
                description: hearingDescription
            };
        }

        // Show loading state
        const btn = this;
        const btnText = btn.querySelector('.btn-text');
        const originalText = btnText.textContent;
        btn.classList.add('is-loading');
        btnText.textContent = 'Updating...';
        btn.disabled = true;

        // Prepare data - ALWAYS send hearing_data for hearing statuses
        const data = {
            status: status,
            notes: notes
        };

        if (isHearingStatus && hearingData) {
            data.hearing_data = hearingData;

            // Add a flag to indicate we should clear old hearings
            data.clear_existing_hearings = true;
        }

        // Debug logging
        console.log('DEBUG - Data being sent to server:');
        console.log('  Status:', status);
        console.log('  Current Complaint Status:', currentComplaintStatus);
        console.log('  Hearing Data:', hearingData);
        console.log('  Full Data:', JSON.stringify(data, null, 2));

        // Send AJAX request
        fetch(`/complaints/${currentComplaintId}/update-status/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('DEBUG - Response status:', response.status);
            if (!response.ok) {
                return response.json().then(errorData => {
                    console.log('DEBUG - Error response:', errorData);
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('DEBUG - Success response:', data);
            if (data.success) {
                showToast(data.message, 'success');

                // Close modal immediately
                closeStatusModal();

                // Reload page after 2 seconds to show updated data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showToast(data.error || 'Failed to update status', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while updating status: ' + error.message, 'error');
        })
        .finally(() => {
            btn.classList.remove('is-loading');
            btnText.textContent = originalText;
            btn.disabled = false;
        });
    });

    // Helper function to get CSRF token
    function getCookie(name) {
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

    function showToast(message, type = 'info') {
        // Create a simple toast if not already implemented
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            toast.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#ef4444';
        } else {
            toast.style.backgroundColor = '#3b82f6';
        }

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Add animation styles if not already present
    if (!document.querySelector('#toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            .toast {
                animation: slideIn 0.3s ease;
            }

            .toast.slideOut {
                animation: slideOut 0.3s ease;
            }

            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .status-badge.under-review {
                background-color: #e3f2fd;
                color: #1976d2;
            }

            .status-badge.first-hearing {
                background-color: #fff3e0;
                color: #f57c00;
            }

            .status-badge.second-hearing {
                background-color: #e1bee7;
                color: #7b1fa2;
            }

            .status-badge.other-hearing {
                background-color: #d1c4e9;
                color: #4527a0;
            }

            .status-badge.ongoing-hearing {
                background-color: #e8f5e8;
                color: #388e3c;
            }

            .status-badge.resolved {
                background-color: #e8f5e8;
                color: #388e3c;
            }

            .status-badge.canceled {
                background-color: #ffebee;
                color: #d32f2f;
            }
        `;
        document.head.appendChild(style);
    }
});

// -------------------------------------------------- View Function ----------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // View Modal elements
    const viewModal = document.getElementById('viewComplaintModal');
    const viewCloseButtons = document.querySelectorAll('.close-view-modal');
    const complaintDetailsContent = document.getElementById('complaintDetailsContent');
    const viewReferenceNumber = document.getElementById('viewReferenceNumber');
    const downloadPdfBtn = document.getElementById('downloadComplaintPdf');
    let currentComplaintId = null;

    // Open view modal when view button is clicked
    document.addEventListener('click', function(e) {
        const viewBtn = e.target.closest('.view-complaint');
        if (viewBtn) {
            e.preventDefault();
            currentComplaintId = viewBtn.getAttribute('data-id');
            openComplaintViewModal(currentComplaintId);
        }
    });

    // Close view modal
    viewCloseButtons.forEach(btn => {
        btn.addEventListener('click', closeViewModal);
    });

    // Close view modal when clicking outside
    viewModal.addEventListener('click', function(event) {
        if (event.target === viewModal || event.target.classList.contains('modal-overlay')) {
            closeViewModal();
        }
    });

    // Enhanced Download PDF button handler
    downloadPdfBtn.addEventListener('click', function(e) {
        e.preventDefault();

        if (!currentComplaintId) return;

        // Show loading state
        const btnText = this.querySelector('.btn-text');
        const btnLoader = this.querySelector('.btn-loader');
        const originalText = btnText.textContent;

        btnText.textContent = 'Generating...';
        btnLoader.style.display = 'block';
        this.disabled = true;

        // Open download in new tab
        const downloadWindow = window.open(`/complaint/pdf/${currentComplaintId}/`, '_blank');

        // Reset button after a short delay
        setTimeout(() => {
            btnText.textContent = originalText;
            btnLoader.style.display = 'none';
            this.disabled = false;

            // Focus back on modal if download window didn't open
            if (!downloadWindow || downloadWindow.closed) {
                showToast('Could not generate PDF. Please try again.', 'error');
            }
        }, 2000);
    });

    // Function to close view modal
    function closeViewModal() {
        viewModal.classList.remove('active');
        document.body.style.overflow = '';
        complaintDetailsContent.innerHTML = '';
        currentComplaintId = null;
    }

    // Function to open complaint view modal
    function openComplaintViewModal(complaintId) {
        // Show loading state
        complaintDetailsContent.innerHTML = `
            <div class="loading-spinner">
                <i class='bx bx-loader-alt bx-spin'></i>
                Loading complaint details...
            </div>
        `;

        viewModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Fetch complaint details
        fetch(`/complaints/${complaintId}/view/`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    renderComplaintDetails(data.complaint);
                    viewReferenceNumber.textContent = ` ${data.complaint.reference_number}`;
                } else {
                    showError(data.error || 'Failed to load complaint details');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Failed to load complaint details. Please try again.');
            });
    }

    // Render complaint details from JSON data
    function renderComplaintDetails(complaint) {
        // Create HTML structure
        const html = `
            <div class="complaint-details">
                <!-- Basic Info Section -->
                <div class="detail-section">
                    <div class="form-intro">
                        <i class='bx bx-info-circle'></i>
                        <p>Detailed view of complaint information</p>
                    </div>
                    <div class="detail-grid">
                        <div class="form-group">
                            <label>Reference Number</label>
                            <div class="form-input">${complaint.reference_number}</div>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <div class="form-input">${complaint.status_display}</div>
                        </div>
                    </div>
                </div>

                <!-- Complainant Info Section -->
                <div class="detail-section">
                    <h3 class="detail-heading">Complainant Information</h3>
                    <div class="detail-grid">
                        <div class="form-group">
                            <label>Full Name</label>
                            <div class="form-input">${complaint.complainant_first_name} ${complaint.complainant_last_name}</div>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <div class="form-input">${complaint.complainant_email}</div>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <div class="form-input">${complaint.complainant_phone}</div>
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <div class="form-input">${complaint.complainant_address}</div>
                        </div>
                    </div>
                </div>

                <!-- Respondent Info Section -->
                <div class="detail-section">
                    <h3 class="detail-heading">Respondent Information</h3>
                    <div class="detail-grid">
                        <div class="form-group">
                            <label>Full Name</label>
                            <div class="form-input">${complaint.respondent_first_name} ${complaint.respondent_last_name}</div>
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <div class="form-input">${complaint.respondent_type_display}</div>
                        </div>
                        ${complaint.respondent_type === 'student' ? `
                            <div class="form-group">
                                <label>Course</label>
                                <div class="form-input">${complaint.respondent_course}</div>
                            </div>
                            <div class="form-group">
                                <label>Year & Section</label>
                                <div class="form-input">${complaint.respondent_year} - ${complaint.respondent_section}</div>
                            </div>
                        ` : `
                            <div class="form-group">
                                <label>Department</label>
                                <div class="form-input">${complaint.respondent_department}</div>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Complaint Details Section -->
                <div class="detail-section">
                    <h3 class="detail-heading">Complaint Details</h3>
                    <div class="detail-grid">
                        <div class="form-group">
                            <label>Title</label>
                            <div class="form-input">${complaint.title}</div>
                        </div>
                        <div class="form-group">
                            <label>Incident Date</label>
                            <div class="form-input">${formatDate(complaint.incident_date)}</div>
                        </div>
                        <div class="form-group">
                            <label>Incident Time</label>
                            <div class="form-input">${formatTime(complaint.incident_time)}</div>
                        </div>
                        <div class="form-group">
                            <label>Location</label>
                            <div class="form-input">${complaint.incident_location}</div>
                        </div>
                        <div class="form-group full-width">
                            <label>Statement</label>
                            <div class="form-input" style="min-height: 100px;">${complaint.statement}</div>
                        </div>
                        ${complaint.witnesses ? `
                            <div class="form-group full-width">
                                <label>Witnesses</label>
                                <div class="form-input">${complaint.witnesses}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${complaint.status === 'resolved' && complaint.notes ? `
                <!-- Resolution Details Section -->
                <div class="detail-section">
                    <h3 class="detail-heading">Resolution Details</h3>
                    <div class="detail-grid">
                        <div class="form-group full-width">
                            <label>Resolution Notes</label>
                            <div class="form-input" style="min-height: 100px;">${complaint.notes}</div>
                        </div>
                        <div class="form-group">
                            <label>Resolved At</label>
                            <div class="form-input">${formatDateTime(complaint.updated_at)}</div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Supporting Evidence Section -->
                <div class="detail-section">
                    <h3 class="detail-heading">Supporting Evidence</h3>
                    <div class="evidence-grid">
                        ${renderEvidenceSection('Documents', complaint.documents)}
                        ${renderEvidenceSection('Images', complaint.images)}
                    </div>
                </div>
            </div>
        `;

        complaintDetailsContent.innerHTML = html;
    }

    // Helper function to render evidence section
    function renderEvidenceSection(title, items) {
        if (!items || items.length === 0) return '';

        const iconClass = title === 'Documents' ? 'bx-file' : 'bx-image';

        const itemsHtml = items.map(item => `
            <div class="evidence-item">
                <a href="${item.file_url}" target="_blank" class="evidence-link">
                    <i class='bx ${iconClass}'></i> ${item.file_name}
                </a>
                ${item.description || item.caption ? `
                    <p class="evidence-description">${item.description || item.caption}</p>
                ` : ''}
            </div>
        `).join('');

        return `
            <div class="evidence-group">
                <h4>${title}</h4>
                <div class="evidence-list">${itemsHtml}</div>
            </div>
        `;
    }

    // Helper functions for date formatting
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function formatTime(timeString) {
        if (!timeString) return 'N/A';
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'N/A';
        const dateTime = new Date(dateTimeString);
        return dateTime.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function showError(message) {
        complaintDetailsContent.innerHTML = `
            <div class="response-error">
                <i class='bx bx-error'></i>
                <span>${message}</span>
            </div>
        `;
    }
});

// ------------------------------------------------ Edit Function ------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Modal elements
    const editModal = document.getElementById('complaintEditModal');
    const editForm = document.getElementById('editComplaintForm');
    const closeBtn = editModal.querySelector('.modal-close');
    const cancelBtn = editModal.querySelector('.btn-cancel');

    // Store current status for warning messages
    let currentComplaintStatus = null;

    // Initialize respondent type change handler
    function setupRespondentTypeHandler() {
        const respondentTypeSelect = document.getElementById('editRespondentType');
        const studentFields = document.getElementById('editStudentFields');
        const staffFields = document.getElementById('editStaffFields');

        respondentTypeSelect.addEventListener('change', function() {
            const type = this.value;
            if (type === 'student') {
                studentFields.style.display = 'block';
                staffFields.style.display = 'none';
                // Clear faculty fields when switching to student
                document.getElementById('editRespondentDepartment').value = '';
            } else {
                studentFields.style.display = 'none';
                staffFields.style.display = 'block';
                // Clear student fields when switching to faculty
                document.getElementById('editRespondentCourse').value = '';
                document.getElementById('editRespondentYear').value = '';
                document.getElementById('editRespondentSection').value = '';
            }
        });
    }

    // Call the setup function
    setupRespondentTypeHandler();

    // Open modal when edit button is clicked
    document.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit');
        if (editBtn) {
            const complaintId = editBtn.getAttribute('data-id');
            openEditModal(complaintId);
        }
    });

    // Enhanced open modal function
    function openEditModal(complaintId) {
        console.log('Opening edit modal for complaint:', complaintId);

        // Show loading state
        editModal.classList.add('active', 'loading');
        document.body.style.overflow = 'hidden';

        fetch(`/dashboard/complaints/${complaintId}/edit/`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken()
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Server error: ${response.status} - ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            editModal.classList.remove('loading');

            if (data.success) {
                // Store current status for warning messages
                currentComplaintStatus = data.complaint.status;

                // Store current status in hidden field
                document.getElementById('currentStatus').value = currentComplaintStatus;

                // Populate course dropdown
                const courseSelect = document.getElementById('editRespondentCourse');
                courseSelect.innerHTML = '<option value="">Select Course</option>';

                data.courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    courseSelect.appendChild(option);
                });

                populateForm(data.complaint);
                editForm.setAttribute('data-id', complaintId);

                // Setup status change warning
                setupStatusChangeWarning();
            } else {
                showToast(data.error || 'Failed to load complaint data', 'error');
                closeEditModal();
            }
        })
        .catch(error => {
            editModal.classList.remove('loading');
            console.error('Error:', error);
            showToast(error.message || 'Error loading complaint data', 'error');
            closeEditModal();
        });
    }

    // Setup status change warning
    function setupStatusChangeWarning() {
        const statusRadios = document.querySelectorAll('input[name="status"]');

        statusRadios.forEach(radio => {
            // Remove existing event listeners
            radio.removeEventListener('change', handleStatusChange);
            // Add new event listener
            radio.addEventListener('change', handleStatusChange);
        });
    }

    function handleStatusChange() {
        const newStatus = this.value;
        const hearingStatuses = ['1st_hearing', '2nd_hearing', 'other_hearing', 'ongoing_hearing'];
        const nonHearingStatuses = ['under_review', 'resolved', 'canceled'];

        // Check if changing from hearing status to non-hearing status
        if (hearingStatuses.includes(currentComplaintStatus) && nonHearingStatuses.includes(newStatus)) {
            let message = '';

            if (newStatus === 'under_review') {
                message = 'Warning: Changing status to "Under Review" will remove any scheduled hearing dates for this complaint. Continue?';
            } else if (newStatus === 'resolved') {
                message = 'Warning: Changing status to "Resolved" will remove any scheduled hearing dates for this complaint. Continue?';
            } else if (newStatus === 'canceled') {
                message = 'Warning: Changing status to "Canceled" will remove any scheduled hearing dates for this complaint. Continue?';
            }

            if (message) {
                const confirmed = confirm(message);
                if (!confirmed) {
                    // Revert to previous selection
                    const previousRadio = document.querySelector(`input[name="status"][value="${currentComplaintStatus}"]`);
                    if (previousRadio) {
                        previousRadio.checked = true;
                    } else {
                        // If previous status is not available in the form (e.g., hearing status), check under_review
                        document.querySelector('input[name="status"][value="under_review"]').checked = true;
                    }
                    return;
                }
            }
        }
    }

    // Enhanced populateForm function with proper respondent type handling
    function populateForm(complaint) {
        // Basic info
        setValue('editTitle', complaint.title);
        checkRadio('status', complaint.status);

        // Complainant info
        setValue('editComplainantFirstName', complaint.complainant_first_name);
        setValue('editComplainantLastName', complaint.complainant_last_name);
        setValue('editComplainantEmail', complaint.complainant_email);
        setValue('editComplainantPhone', complaint.complainant_phone);
        setValue('editComplainantAddress', complaint.complainant_address);

        // Respondent info - set type first
        const respondentType = complaint.respondent_type || 'student';
        setValue('editRespondentType', respondentType);
        setValue('editRespondentFirstName', complaint.respondent_first_name);
        setValue('editRespondentLastName', complaint.respondent_last_name);

        // Set fields based on respondent type
        if (respondentType === 'student') {
            // Set course value if it exists
            if (complaint.respondent_course) {
                setValue('editRespondentCourse', complaint.respondent_course.toString());
            }
            setValue('editRespondentYear', complaint.respondent_year);
            setValue('editRespondentSection', complaint.respondent_section);
            setValue('editRespondentDepartment', ''); // Clear department
        } else {
            setValue('editRespondentDepartment', complaint.respondent_department);
            setValue('editRespondentCourse', ''); // Clear student fields
            setValue('editRespondentYear', '');
            setValue('editRespondentSection', '');
        }

        // Complaint details
        setValue('editIncidentDate', formatDateForInput(complaint.incident_date));
        setValue('editIncidentTime', complaint.incident_time);
        setValue('editIncidentLocation', complaint.incident_location);
        setValue('editStatement', complaint.statement);
        setValue('editWitnesses', complaint.witnesses);
        setValue('editNotes', complaint.notes);

        // Evidence
        renderEvidence('editDocumentsList', complaint.documents, 'document');
        renderEvidence('editImagesList', complaint.images, 'image');

        // Trigger UI update for respondent type
        document.getElementById('editRespondentType').dispatchEvent(new Event('change'));
    }

    // Evidence rendering function
    function renderEvidence(containerId, items, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!items || items.length === 0) {
            container.innerHTML = '<div class="no-evidence">No ' + type + 's uploaded</div>';
            return;
        }

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'evidence-item';

            // Determine icon class based on type
            let iconClass;
            switch(type) {
                case 'image': iconClass = 'bx bx-image-alt'; break;
                default: iconClass = 'bx bx-file';
            }

            itemElement.innerHTML = `
                <div class="evidence-info">
                    <i class="${iconClass}"></i>
                    <span class="evidence-name">${item.name || 'Untitled'}</span>
                </div>
                <div class="evidence-actions">
                    <a href="${item.url || '#'}" target="_blank" class="btn-view-evidence" title="View">
                        <i class='bx bx-show'></i>
                    </a>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }

    // Enhanced form submission with proper respondent type handling
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const complaintId = this.getAttribute('data-id');
        if (!complaintId) {
            showToast('Invalid complaint ID', 'error');
            return;
        }

        // Create FormData from the form element directly
        const formData = new FormData(this);

        // Manually add status (since radio buttons need special handling)
        const status = document.querySelector('input[name="status"]:checked')?.value;
        if (status) formData.set('status', status);

        // Get respondent type and handle field clearing
        const respondentType = document.getElementById('editRespondentType').value;
        formData.set('respondent_type', respondentType);

        if (respondentType === 'student') {
            // Clear faculty fields if switching to student
            formData.set('respondent_department', '');
        } else {
            // Clear student fields if switching to faculty
            formData.set('respondent_course', '');
            formData.set('respondent_year', '');
            formData.set('respondent_section', '');
        }

        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bx bx-loader bx-spin"></i> Saving...';

        // Submit with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        fetch(`/dashboard/complaints/${complaintId}/edit/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
            signal: controller.signal
        })
        .then(async response => {
            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Server response:', data);
            if (data.success) {
                showToast('Complaint updated successfully', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                throw new Error(data.error || 'Failed to update complaint');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'Error updating complaint', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
    });

    // Close modal
    function closeEditModal() {
        editModal.classList.remove('active');
        document.body.style.overflow = '';
        editForm.reset();
        currentComplaintStatus = null;
    }

    [closeBtn, cancelBtn].forEach(btn => {
        btn.addEventListener('click', closeEditModal);
    });

    editModal.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeEditModal();
        }
    });

    // Helper functions
    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value || '';
    }

    function checkRadio(name, value) {
        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (radio) radio.checked = true;
    }

    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    function getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }

    function showToast(message, type = 'info') {
        // Create a simple toast if not already implemented
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            toast.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#ef4444';
        } else {
            toast.style.backgroundColor = '#3b82f6';
        }

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
});

// ------------------------------------------------- Archived Function -------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Archive Complaint Modal
    const archiveModal = document.getElementById('archiveComplaintModal');
    const confirmArchiveBtn = document.getElementById('confirmArchive');
    const archiveNotes = document.getElementById('archiveNotes');
    const archiveForm = document.getElementById('complaintArchiveForm');
    const archiveRefNumber = document.getElementById('archiveRefNumber');
    const archiveTitle = document.getElementById('archiveTitle');
    let currentComplaintId = null;

    // Open modal when archive button is clicked
    document.addEventListener('click', function(e) {
        if (e.target.closest('.archive-complaint')) {
            e.preventDefault();
            const archiveBtn = e.target.closest('.archive-complaint');
            currentComplaintId = archiveBtn.getAttribute('data-id');

            // Get the complaint details from data attributes
            const refNumber = archiveBtn.getAttribute('data-ref');
            const title = archiveBtn.getAttribute('data-title');
            const status = archiveBtn.getAttribute('data-status');

            // Populate the modal with complaint details
            archiveRefNumber.textContent = refNumber || 'N/A';
            archiveTitle.textContent = title || 'N/A';

            // Show warning if complaint is already resolved
            if (status === 'resolved') {
                showWarningMessage('This complaint is already marked as resolved. Archiving will change its status to Canceled.');
            }

            document.getElementById('archiveComplaintId').value = currentComplaintId;
            archiveModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Close modal functions
    function closeArchiveModal() {
        archiveModal.classList.remove('active');
        archiveNotes.value = '';
        document.body.style.overflow = '';
    }

    document.querySelector('#archiveComplaintModal .modal-close').addEventListener('click', closeArchiveModal);
    document.querySelector('#archiveComplaintModal .btn-cancel').addEventListener('click', closeArchiveModal);
    document.querySelector('#archiveComplaintModal .modal-overlay').addEventListener('click', closeArchiveModal);

    // Handle form submission
    archiveForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!currentComplaintId) {
            showToast('Invalid complaint ID', 'error');
            return;
        }

        const notes = archiveNotes.value;
        const btn = confirmArchiveBtn || archiveForm.querySelector('button[type="submit"]');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        const originalText = btnText.textContent;

        // Show loading state
        btn.disabled = true;
        btnText.textContent = 'Archiving...';
        btnLoader.style.display = 'block';

        // Create form data to send
        const formData = new FormData();
        formData.append('notes', notes);
        formData.append('complaint_id', currentComplaintId);
        formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

        // Send AJAX request to archive complaint
        fetch(`/complaints/${currentComplaintId}/archive/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(async response => {
            const data = await response.json();

            if (!response.ok) {
                // Handle server errors
                if (data.error) {
                    throw new Error(data.error);
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            }
            return data;
        })
        .then(data => {
            if (data.success) {
                closeArchiveModal();
                showToast('Complaint archived and status set to Canceled', 'success');

                // Refresh the page or update UI as needed
                if (typeof refreshComplaintsTable === 'function') {
                    refreshComplaintsTable();
                } else {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } else {
                throw new Error(data.error || 'Failed to archive complaint');
            }
        })
        .catch(error => {
            console.error('Archive error:', error);
            showToast(error.message || 'Error archiving complaint', 'error');
        })
        .finally(() => {
            btn.disabled = false;
            btnText.textContent = originalText;
            btnLoader.style.display = 'none';
        });
    });

    // Helper function to show warning message
    function showWarningMessage(message) {
        const warningElement = document.createElement('div');
        warningElement.className = 'alert alert-warning';
        warningElement.innerHTML = `
            <i class='bx bx-error-circle'></i>
            <span>${message}</span>
        `;

        const formBody = archiveForm.querySelector('.form-body');
        if (formBody) {
            formBody.insertBefore(warningElement, formBody.firstChild);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                warningElement.remove();
            }, 5000);
        }
    }

    // Helper function to get CSRF token
    function getCookie(name) {
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

    // Toast notification function
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                ${type === 'success' ? '<i class="bx bx-check-circle"></i>' : '<i class="bx bx-error-circle"></i>'}
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close"><i class="bx bx-x"></i></button>
        `;

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });
    }
});

function refreshComplaintsTable() {
    const complaintsTable = document.getElementById('complaintsTable');
    if (complaintsTable && typeof DataTable !== 'undefined' && complaintsTable.DataTable) {
        complaintsTable.DataTable().ajax.reload(null, false);
    } else {
        window.location.reload();
    }
}

// ----------------------------------------------- Toast Notification --------------------------------------------------
function showToast(message, type = 'success', duration = 5000) {
    const toastContainer = document.getElementById('toastContainer');

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Toast content
    toast.innerHTML = `
        <div class="toast-content">
            <i class="toast-icon ${type === 'success' ? 'bx bx-check-circle' : 'bx bx-error'}"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close" aria-label="Close">
                <i class='bx bx-x'></i>
            </button>
        </div>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    let timeoutId = setTimeout(() => {
        hideToast(toast);
    }, duration);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(timeoutId);
        hideToast(toast);
    });

    // Function to hide toast
    function hideToast(toastElement) {
        toastElement.classList.remove('show');
        toastElement.addEventListener('transitionend', () => {
            toastElement.remove();
        }, { once: true });
    }
}