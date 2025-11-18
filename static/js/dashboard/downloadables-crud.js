document.addEventListener("DOMContentLoaded", function () {
    initDownloadableButtons();
    initDownloadableCardFilteringAndSorting();
});

function initDownloadableButtons() {
    document.querySelectorAll('.btn-add-downloadable').forEach(btn => {
        btn.addEventListener('click', openDownloadableCreateModal);
    });

    document.querySelectorAll('.btn-edit-downloadable').forEach(button => {
        button.addEventListener('click', function () {
            const downloadableId = this.closest('.downloadable-card').getAttribute('data-id');
            openDownloadableEditModal(downloadableId);
        });
    });

    document.querySelectorAll('.btn-archive-downloadable').forEach(button => {
        button.addEventListener('click', function () {
            const card = this.closest('.downloadable-card');
            const downloadableId = card.getAttribute('data-id');
            const downloadableTitle = card.querySelector('.card-title').textContent.trim();
            openDownloadableArchiveModal(downloadableId, downloadableTitle);
        });
    });

    document.querySelectorAll('.btn-view-downloadable').forEach(button => {
        button.addEventListener('click', function () {
            const downloadableId = this.closest('.downloadable-card').getAttribute('data-id');
            openDownloadableViewModal(downloadableId);
        });
    });
}

function initDownloadableCardFilteringAndSorting() {
    const container = document.getElementById("downloadables-cards-container");
    const cardsGrid = container.querySelector(".cards-grid");
    let cards = Array.from(container.querySelectorAll(".downloadable-card"));
    const loadingOverlay = document.getElementById("downloadables-loading");

    let noDataElement = container.querySelector('.no-data-found');

    if (!noDataElement) {
        noDataElement = document.createElement('div');
        noDataElement.className = 'no-data-found';
        noDataElement.innerHTML = `
            <div class="no-data-content">
                <i class='bx bx-folder-open'></i>
                <h4>No downloadables found</h4>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        noDataElement.style.display = 'none';
        container.appendChild(noDataElement);
    }

    const searchInput = document.getElementById("downloadables-search");
    const categoryFilter = document.getElementById("downloadableCategoryFilter");
    const statusFilter = document.getElementById("downloadableStatusFilter");
    const dateFilter = document.getElementById("downloadableDateFilter");

    function showLoading() {
        loadingOverlay.style.display = 'flex';
        container.style.opacity = '0.7';
        container.style.pointerEvents = 'none';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    }

    async function fetchAllDownloadables() {
        showLoading();

        try {
            // Get current URL parameters
            const url = new URL(window.location.href);
            const tab = url.searchParams.get('tab') || 'basic';

            const params = new URLSearchParams();
            params.append('tab', tab);

            if (searchInput.value) params.append('search', searchInput.value);
            if (categoryFilter.value !== 'all') params.append('category', categoryFilter.value);
            if (statusFilter.value !== 'all') params.append('status', statusFilter.value);
            if (dateFilter.value !== 'all') params.append('date', dateFilter.value);
            params.append('get_all_downloadables', '1');

            const response = await fetch(`${window.location.pathname}?${params.toString()}`);
            const html = await response.text();

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const newCardsGrid = tempDiv.querySelector("#downloadables-cards-container .cards-grid");
            if (newCardsGrid) {
                cardsGrid.innerHTML = newCardsGrid.innerHTML;
                cards = Array.from(container.querySelectorAll(".downloadable-card"));
                initDownloadableButtons();

                const newUrl = `${window.location.pathname}?${params.toString()}#downloadables`;
                window.history.pushState({}, '', newUrl);
            }
        } catch (error) {
            console.error('Error fetching all downloadables:', error);
        } finally {
            hideLoading();
        }
    }

    // Function to fetch original paginated view
    async function fetchOriginalPaginatedView() {
        showLoading();

        try {
            const url = new URL(window.location.href);
            const tab = url.searchParams.get('tab') || 'basic';
            const page = url.searchParams.get('template_page') || '1';

            const params = new URLSearchParams();
            params.append('tab', tab);
            params.append('template_page', page);

            const response = await fetch(`${window.location.pathname}?${params.toString()}`);
            const html = await response.text();

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const newContainer = tempDiv.querySelector("#downloadables-cards-container");
            const newPagination = tempDiv.querySelector(".pagination-container");

            if (newContainer) {
                const newCardsGrid = newContainer.querySelector(".cards-grid");
                if (newCardsGrid) {
                    cardsGrid.innerHTML = newCardsGrid.innerHTML;
                    cards = Array.from(container.querySelectorAll(".downloadable-card"));
                    initDownloadableButtons();
                }

                const newNoData = newContainer.querySelector('.no-data-found');
                if (newNoData) {
                    noDataElement.style.display = newNoData.style.display;
                }

                if (newPagination) {
                    const currentPagination = document.querySelector('.pagination-container');
                    if (currentPagination) {
                        currentPagination.innerHTML = newPagination.innerHTML;
                    }
                }

                const newUrl = `${window.location.pathname}?${params.toString()}#downloadables`;
                window.history.pushState({}, '', newUrl);
            }
        } catch (error) {
            console.error('Error fetching original view:', error);
        } finally {
            hideLoading();
        }
    }

    function isFilterActive() {
        return (
            searchInput.value.trim() !== '' ||
            categoryFilter.value !== 'all' ||
            statusFilter.value !== 'all' ||
            dateFilter.value !== 'all'
        );
    }

    function togglePagination(show) {
        const pagination = document.querySelector('.pagination-container');
        if (pagination) {
            pagination.style.display = show ? 'flex' : 'none';
        }
    }

    async function filterDownloadables() {
        const isActive = isFilterActive();

        if (isActive) {
            await fetchAllDownloadables();
            togglePagination(false);
        } else {
            await fetchOriginalPaginatedView();
            togglePagination(true);
            return;
        }

        const query = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedStatus = statusFilter.value;
        const selectedDate = dateFilter.value;
        const now = new Date();

        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const description = card.querySelector('.card-description').textContent.toLowerCase();
            const categoryValue = card.dataset.category;
            const statusText = card.dataset.status;
            const createdAt = new Date(card.dataset.created);
            const createdYear = createdAt.getFullYear();
            const createdMonth = createdAt.getMonth();

            let shouldShow = true;

            // Search filter
            if (query && !(title.includes(query) || description.includes(query))) {
                shouldShow = false;
            }

            // Category filter
            if (selectedCategory !== "all" && categoryValue !== selectedCategory) {
                shouldShow = false;
            }

            // Status filter
            if (selectedStatus !== "all" && statusText !== selectedStatus) {
                shouldShow = false;
            }

            // Date filter
            if (selectedDate !== "all") {
                switch (selectedDate) {
                    case "week":
                        const oneWeekAgo = new Date(now);
                        oneWeekAgo.setDate(now.getDate() - 7);
                        if (createdAt < oneWeekAgo) shouldShow = false;
                        break;
                    case "month":
                        if (createdYear !== now.getFullYear() || createdMonth !== now.getMonth()) shouldShow = false;
                        break;
                    case "this_year":
                        if (createdYear !== now.getFullYear()) shouldShow = false;
                        break;
                    case "last_year":
                        if (createdYear !== now.getFullYear() - 1) shouldShow = false;
                        break;
                    default:
                        if (parseInt(selectedDate)) {
                            if (createdYear !== parseInt(selectedDate)) shouldShow = false;
                        }
                }
            }

            card.style.display = shouldShow ? "block" : "none";
            if (shouldShow) visibleCount++;
        });

        noDataElement.style.display = visibleCount === 0 ? 'flex' : 'none';
    }

    function initializeFiltersFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('search')) searchInput.value = urlParams.get('search');
        if (urlParams.has('category')) categoryFilter.value = urlParams.get('category');
        if (urlParams.has('status')) statusFilter.value = urlParams.get('status');
        if (urlParams.has('date')) dateFilter.value = urlParams.get('date');
    }

    searchInput.addEventListener("input", debounce(filterDownloadables, 300));
    categoryFilter.addEventListener("change", filterDownloadables);
    statusFilter.addEventListener("change", filterDownloadables);
    dateFilter.addEventListener("change", filterDownloadables);

    initializeFiltersFromUrl();
    if (isFilterActive()) {
        filterDownloadables();
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

function openDownloadableCreateModal() {
    console.log("Open create modal");
}

function openDownloadableEditModal(id) {
    console.log("Open edit modal for", id);
}

function openDownloadableArchiveModal(id, title) {
    console.log("Open archive modal for", id, title);
}

function openDownloadableViewModal(id) {
    console.log("Open view modal for", id);
}

// --------------------------------------- Create/Add Downloadable Functions -------------------------------------------
function openDownloadableCreateModal() {
    const modal = document.getElementById('downloadableCreateModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDownloadableCreateModal() {
    const modal = document.getElementById('downloadableCreateModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('downloadableCreateForm').reset();
    document.getElementById('downloadableFormResponse').innerHTML = '';
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());
}

document.getElementById('downloadableFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const fileSizeDisplay = document.getElementById('fileSizeDisplay');
    const removeFileBtn = document.getElementById('removeDownloadableFile');

    if (file) {
        fileNameDisplay.textContent = file.name;

        let size = file.size;
        let sizeText;
        if (size < 1024) {
            sizeText = size + ' bytes';
        } else if (size < 1024 * 1024) {
            sizeText = (size / 1024).toFixed(1) + ' KB';
        } else {
            sizeText = (size / (1024 * 1024)).toFixed(1) + ' MB';
        }
        fileSizeDisplay.textContent = sizeText;

        removeFileBtn.style.display = 'block';
    } else {
        fileNameDisplay.textContent = 'No file selected';
        fileSizeDisplay.textContent = '';
        removeFileBtn.style.display = 'none';
    }
});

function removeDownloadableFile() {
    const fileInput = document.getElementById('downloadableFileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const fileSizeDisplay = document.getElementById('fileSizeDisplay');
    const removeFileBtn = document.getElementById('removeDownloadableFile');

    fileInput.value = '';
    fileNameDisplay.textContent = 'No file selected';
    fileSizeDisplay.textContent = '';
    removeFileBtn.style.display = 'none';
}

// Handle form submission
document.getElementById('downloadableCreateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('downloadableFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());

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
            showSuccessToast('Downloadable created successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Downloadable created successfully! This window will close shortly...
                </div>
            `;
            setTimeout(() => {
                closeDownloadableCreateModal();
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

// -------------------------------------------- View Downloadable Functions --------------------------------------------
const downloadableModal = document.getElementById('downloadableViewModal');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');

function openDownloadableViewModal(downloadableId) {
    showLoadingState(true);

    fetch(`/downloadables/${downloadableId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(handleResponse)
    .then(data => {
        if (data.success) {
            populateModalData(data.downloadable);
            setupFileActions(data.downloadable);
            showModal();
        } else {
            throw new Error(data.error || 'Failed to load downloadable details');
        }
    })
    .catch(handleError);
}

function populateModalData(downloadable) {
    document.getElementById('viewDownloadableTitle').textContent = downloadable.title;
    document.getElementById('viewDownloadableDescription').textContent = downloadable.description || 'N/A';
    document.getElementById('viewDownloadableCategory').textContent = downloadable.category;
    document.getElementById('viewDownloadableCreatedAt').textContent = downloadable.created_at;
    document.getElementById('viewDownloadableCreatedBy').textContent = downloadable.created_by;

    const fileLink = document.getElementById('viewDownloadableFile');
    fileLink.textContent = downloadable.file_name;
    fileLink.href = downloadable.file_url;

    const fileSizeElement = document.getElementById('viewDownloadableFileSize');
    fileSizeElement.textContent = downloadable.file_size ? `(${downloadable.file_size})` : '';

    const statusElement = document.getElementById('viewDownloadableStatus');
    statusElement.textContent = downloadable.is_active ? 'Active' : 'Inactive';
    statusElement.className = downloadable.is_active ? 'status-badge active' : 'status-badge inactive';
}

function setupFileActions(downloadable) {
    const fileUrl = downloadable.file_url;
    const fileName = downloadable.file_name;

    if (modalDownloadBtn) {
        modalDownloadBtn.dataset.fileUrl = fileUrl;
        modalDownloadBtn.dataset.fileName = fileName;

        modalDownloadBtn.classList.remove('loading', 'success', 'error');
        modalDownloadBtn.innerHTML = `<i class='bx bx-download'></i> Download`;
    }

    const viewBtn = downloadableModal.querySelector('.btn-view-file');
    if (viewBtn) {
        viewBtn.onclick = (e) => {
            e.preventDefault();
            if (fileUrl) {
                window.open(fileUrl, '_blank', 'noopener,noreferrer');
            }
        };
    }
}

function handleDownload(button) {
    const fileUrl = button.dataset.fileUrl;
    const fileName = button.dataset.fileName || 'download';

    if (!fileUrl) {
        console.error('No file URL specified');
        showErrorToast('No file available for download');
        return;
    }

    button.classList.add('loading');
    button.innerHTML = `<i class='bx bx-loader-circle'></i> Downloading...`;

    fetch(fileUrl, { method: 'HEAD' })
        .then(response => {
            if (!response.ok) throw new Error('File not found');

            // Create hidden anchor for download
            const a = document.createElement('a');
            a.href = fileUrl;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                showDownloadSuccess(button);
            }, 100);
        })
        .catch(error => {
            showDownloadError(button);
            console.error('Download failed:', error);
            showErrorToast('Failed to download file. Please try again.');
        });
}

function showDownloadSuccess(button) {
    button.classList.remove('loading');
    button.classList.add('success');
    button.innerHTML = `<i class='bx bx-check'></i> Downloaded!`;

    setTimeout(() => {
        button.classList.remove('success');
        button.innerHTML = `<i class='bx bx-download'></i> Download`;
    }, 2000);
}

function showDownloadError(button) {
    button.classList.remove('loading');
    button.classList.add('error');
    button.innerHTML = `<i class='bx bx-error'></i> Failed!`;

    setTimeout(() => {
        button.classList.remove('error');
        button.innerHTML = `<i class='bx bx-download'></i> Download`;
    }, 2000);
}

function showModal() {
    downloadableModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDownloadableViewModal() {
    downloadableModal.classList.remove('active');
    document.body.style.overflow = '';
}

function showLoadingState(show) {
    const modalContent = document.querySelector('.modal-container');
    const submitButton = document.getElementById('modalDownloadBtn');

    if (show) {
        if (!document.getElementById('modalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'modalLoadingOverlay';
            overlay.className = 'modal-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">Loading details...</span>
            `;
            modalContent.appendChild(overlay);
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add('loading');
        }
    } else {
        const overlay = document.getElementById('modalLoadingOverlay');
        if (overlay) overlay.remove();

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
        }
    }
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function handleError(error) {
    console.error('Error:', error);
    showErrorToast(error.message || 'An error occurred');
}

function showErrorToast(message) {
    console.error('Error:', message);
    alert(message);
}

document.addEventListener('DOMContentLoaded', function() {
    if (modalDownloadBtn) {
        modalDownloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleDownload(this);
        });
    }

    const modalCloseBtn = downloadableModal.querySelector('.modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeDownloadableViewModal);
    }

    const modalOverlay = downloadableModal.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeDownloadableViewModal);
    }
});

window.openDownloadableViewModal = openDownloadableViewModal;
window.closeDownloadableViewModal = closeDownloadableViewModal;

// --------------------------------------------- Edit Downloadable Functions -------------------------------------------
function openDownloadableEditModal(downloadableId) {
    fetch(`/downloadables/${downloadableId}/edit/`, {
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
            const downloadable = data.downloadable;
            const modal = document.getElementById('downloadableEditModal');
            const form = document.getElementById('downloadableEditForm');

            // Set form values
            document.getElementById('editDownloadableId').value = downloadable.id;
            document.getElementById('editDownloadableTitle').value = downloadable.title;
            document.getElementById('editDownloadableDescription').value = downloadable.description || '';
            document.getElementById('editDownloadableCategory').value = downloadable.category;

            // Set toggle switch
            const isActiveToggle = document.getElementById('editDownloadableIsActive');
            isActiveToggle.checked = downloadable.is_active;
            updateToggleText(isActiveToggle);

            // Set file info
            document.getElementById('editFileNameDisplay').textContent = downloadable.file_name;
            document.getElementById('editFileSizeDisplay').textContent = downloadable.file_size;
            document.getElementById('currentFileUrl').value = downloadable.file_url;

            form.action = `/downloadables/${downloadableId}/edit/`;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            showErrorToast('Failed to load downloadable details: ' + (data.error || 'Unknown error'));
            console.error('Failed to fetch downloadable details:', data.error);
        }
    })
    .catch(error => {
        showErrorToast('Failed to load downloadable details. Please try again.');
        console.error('Error fetching downloadable details:', error);
    });
}

function closeDownloadableEditModal() {
    const modal = document.getElementById('downloadableEditModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('downloadableEditFormResponse').innerHTML = '';
}

// Handle edit file input change
document.getElementById('editDownloadableFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileNameDisplay = document.getElementById('editFileNameDisplay');
    const fileSizeDisplay = document.getElementById('editFileSizeDisplay');
    const removeFileBtn = document.getElementById('removeEditDownloadableFile');

    if (file) {
        fileNameDisplay.textContent = file.name;

        let size = file.size;
        let sizeText;
        if (size < 1024) {
            sizeText = size + ' bytes';
        } else if (size < 1024 * 1024) {
            sizeText = (size / 1024).toFixed(1) + ' KB';
        } else {
            sizeText = (size / (1024 * 1024)).toFixed(1) + ' MB';
        }
        fileSizeDisplay.textContent = sizeText;

        removeFileBtn.style.display = 'block';
    }
});

function removeEditDownloadableFile() {
    const fileInput = document.getElementById('editDownloadableFileInput');
    const fileNameDisplay = document.getElementById('editFileNameDisplay');
    const fileSizeDisplay = document.getElementById('editFileSizeDisplay');
    const removeFileBtn = document.getElementById('removeEditDownloadableFile');

    fileInput.value = '';
    fileNameDisplay.textContent = document.getElementById('currentFileUrl').value.split('/').pop();
    fileSizeDisplay.textContent = '';
    removeFileBtn.style.display = 'none';
}

// Handle edit form submission
document.getElementById('downloadableEditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('downloadableEditFormResponse');

    const isActive = document.getElementById('editDownloadableIsActive').checked;
    formData.set('is_active', isActive ? 'true' : 'false');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    document.querySelectorAll('#downloadableEditModal .form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#downloadableEditModal .error-message').forEach(el => el.remove());

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
            showSuccessToast('Downloadable updated successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Downloadable updated successfully! This window will close shortly...
                </div>
            `;
            setTimeout(() => {
                closeDownloadableEditModal();
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
            showErrorToast(error.message || 'An unexpected error occurred while updating downloadable');
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

// ---------------------------------------- Archive Downloadable Functions ---------------------------------------------
function openDownloadableArchiveModal(downloadableId, downloadableTitle) {
    const modal = document.getElementById('downloadableArchiveModal');
    document.getElementById('archiveDownloadableId').value = downloadableId;

    const description = modal.querySelector('.header-description');
    description.textContent = `Are you sure you want to archive "${downloadableTitle}"?`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDownloadableArchiveModal() {
    const modal = document.getElementById('downloadableArchiveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('downloadableArchiveFormResponse').innerHTML = '';
}

// Handle archive form submission
document.getElementById('downloadableArchiveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const downloadableId = document.getElementById('archiveDownloadableId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formResponse = document.getElementById('downloadableArchiveFormResponse');

    submitBtn.classList.add('is-loading');
    formResponse.innerHTML = '';

    fetch(`/downloadables/${downloadableId}/archive/`, {
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
                    message: err.error || 'Failed to archive downloadable'
                };
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessToast('Downloadable archived successfully!');
            formResponse.innerHTML = `
                <div class="response-message response-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Downloadable archived successfully! This window will close shortly...
                </div>
            `;

            setTimeout(() => {
                closeDownloadableArchiveModal();
                window.location.reload(true);
            }, 1500);
        } else {
            showErrorToast(data.error || 'Failed to archive downloadable');
            showArchiveError(data.error || 'Failed to archive downloadable');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorMessage = error.userFriendly ?
            error.message :
            'An unexpected error occurred while processing your request.';
        showErrorToast(errorMessage);
        showArchiveError(errorMessage);
    })
    .finally(() => {
        submitBtn.classList.remove('is-loading');
    });
});

function showArchiveError(message) {
    const formResponse = document.getElementById('downloadableArchiveFormResponse');
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

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.btn-archive-downloadable').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.downloadable-card');
            const downloadableId = card.dataset.id;
            const downloadableTitle = card.querySelector('.card-title').textContent;
            openDownloadableArchiveModal(downloadableId, downloadableTitle);
        });
    });
});

// --------------------------------------------------- Utility Functions -----------------------------------------------
function showFormErrors(form, errors) {
    const formResponse = form.querySelector('.form-response') || document.createElement('div');
    formResponse.className = 'form-response';

    const errorList = document.createElement('ul');
    errorList.style.margin = '0';
    errorList.style.paddingLeft = '0';
    let hasErrors = false;

    for (const [field, fieldErrors] of Object.entries(errors)) {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('error');
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-message';

            const errorList = document.createElement('ul');
            const errorArray = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];

            errorArray.forEach(errorText => {
                const listItem = document.createElement('li');
                listItem.textContent = errorText;
                errorList.appendChild(listItem);
            });

            errorContainer.appendChild(errorList);
            input.parentNode.insertBefore(errorContainer, input.nextSibling);
            hasErrors = true;
        }

        const errorArray = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];
        errorArray.forEach(errorText => {
            const listItem = document.createElement('li');
            listItem.textContent = `${field.replace('_', ' ')}: ${errorText}`;
            errorList.appendChild(listItem);
        });
    }

    if (hasErrors) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'response-message response-error';
        errorContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Please correct the following errors:</span>
        `;
        formResponse.innerHTML = '';
        formResponse.appendChild(errorContainer);
        formResponse.appendChild(errorList);
    }
}

function updateToggleText(toggleElement) {
    const toggleContainer = toggleElement.closest('.toggle-switch');
    if (!toggleContainer) return;

    const toggleText = toggleContainer.querySelector('.toggle-label-text');
    if (toggleText) {
        toggleText.textContent = toggleElement.checked ? 'Active' : 'Inactive';
    }
}