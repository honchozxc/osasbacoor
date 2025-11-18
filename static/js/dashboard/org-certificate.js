// Certificate Gallery Functions
let currentCertificateId = null;
let currentCertificateFilters = {
    search: '',
    organization: 'all',
    date: 'newest',
    type: 'all'
};

// Open certificate modal
function openCertificateModal(certificateId) {
    currentCertificateId = certificateId;
    const modal = document.getElementById('certificateModal');

    // Fetch certificate details using Django URL
    fetch(`/certificates/${certificateId}/details/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('modalCertificateTitle').textContent = `Certificate - ${data.certificate.organization_name}`;
                document.getElementById('modalOrgName').textContent = data.certificate.organization_name;
                document.getElementById('modalOrgType').textContent = data.certificate.organization_type_display;
                document.getElementById('modalIssueDate').textContent = new Date(data.certificate.issue_date).toLocaleDateString();
                document.getElementById('modalVenue').textContent = data.certificate.venue;
                document.getElementById('modalGeneratedBy').textContent = data.certificate.generated_by;
                document.getElementById('modalCreatedAt').textContent = new Date(data.certificate.created_at).toLocaleDateString();

                if (data.certificate.certificate_url && !data.certificate.certificate_url.toLowerCase().endsWith('.pdf')) {
                    document.getElementById('modalCertificateImage').src = data.certificate.certificate_url;
                } else {
                    document.getElementById('modalCertificateImage').src = '/static/images/pdf-placeholder.jpg';
                }

                modal.classList.add('show');
            } else {
                throw new Error(data.message || 'Failed to load certificate details');
            }
        })
        .catch(error => {
            console.error('Error loading certificate details:', error);
            alert('Error loading certificate details. Please try again.');
        });
}

// Close certificate modal
function closeCertificateModal() {
    const modal = document.getElementById('certificateModal');
    modal.classList.remove('show');
    currentCertificateId = null;
}

// Download certificate
function downloadCertificate(certificateId) {
    // Open download URL in new tab
    window.open(`/certificates/${certificateId}/download/`, '_blank');
}

// Download current certificate in modal
function downloadCurrentCertificate() {
    if (currentCertificateId) {
        downloadCertificate(currentCertificateId);
    }
}

// View certificate details (same as opening modal)
function viewCertificateDetails(certificateId) {
    openCertificateModal(certificateId);
}

// Add keyboard event for modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCertificateModal();
    }
});

// ---------------------------------- Org-Certificate Search and Filter Function ---------------------------------------

// Debounce function to prevent too many requests
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

// Simple event handler setup for dynamically loaded content
function setupCertificateEventHandlers() {
    // Remove any existing click handlers first
    const grid = document.getElementById('certificatesGrid');
    if (!grid) return;

    // Add click event to the grid for delegation
    grid.addEventListener('click', function(event) {
        const card = event.target.closest('.certificates-photo-card');
        if (card && !event.target.closest('.certificates-overlay-btn')) {
            // Get certificate ID from data attribute or extract from card
            const certificateId = getCertificateId(card);
            if (certificateId) {
                openCertificateModal(certificateId);
            }
        }

        // Handle download button
        if (event.target.closest('.certificates-overlay-btn .bx-download')) {
            event.preventDefault();
            event.stopPropagation();
            const card = event.target.closest('.certificates-photo-card');
            const certificateId = getCertificateId(card);
            if (certificateId) {
                downloadCertificate(certificateId);
            }
        }

        // Handle view details button
        if (event.target.closest('.certificates-overlay-btn .bx-expand')) {
            event.preventDefault();
            event.stopPropagation();
            const card = event.target.closest('.certificates-photo-card');
            const certificateId = getCertificateId(card);
            if (certificateId) {
                viewCertificateDetails(certificateId);
            }
        }
    });
}

// Helper function to get certificate ID from card
function getCertificateId(card) {
    if (!card) return null;

    // Try data attribute first
    const dataId = card.getAttribute('data-certificate-id');
    if (dataId) return parseInt(dataId);

    // Fallback to parsing from existing structure
    const cardContent = card.outerHTML;
    const idMatch = cardContent.match(/openCertificateModal\((\d+)\)/);
    if (idMatch) return parseInt(idMatch[1]);

    return null;
}

// Main filter function
const filterCertificates = debounce(function() {
    // Get current filter values
    currentCertificateFilters = {
        search: document.getElementById('certificateSearch').value,
        organization: document.getElementById('organizationFilter').value,
        date: document.getElementById('dateFilter').value,
        type: document.getElementById('typeFilter').value
    };

    // Show loading state
    showCertificateLoading();

    // Build query string
    const params = new URLSearchParams({
        get_filtered_certificates: '1',
        search: currentCertificateFilters.search,
        organization: currentCertificateFilters.organization,
        date: currentCertificateFilters.date,
        type: currentCertificateFilters.type,
        certificate_page: 1
    });

    // Make AJAX request
    fetch(`?${params.toString()}`, {
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
            updateCertificatesGrid(data.certificates);
            updateCertificatesPagination(data.pagination);
            updateResultsCount(data.pagination.total_count);
            // Re-setup event handlers for the new content
            setTimeout(setupCertificateEventHandlers, 100);
        } else {
            throw new Error('Failed to filter certificates');
        }
    })
    .catch(error => {
        console.error('Error filtering certificates:', error);
        showCertificateError('Error loading certificates. Please try again.');
    })
    .finally(() => {
        hideCertificateLoading();
    });
}, 300);

// Update certificates grid with new data - KEEP YOUR EXISTING STRUCTURE
function updateCertificatesGrid(certificates) {
    const grid = document.getElementById('certificatesGrid');

    if (!grid) {
        console.error('Certificates grid element not found');
        return;
    }

    if (certificates.length === 0) {
        grid.innerHTML = `
            <div class="certificates-empty-gallery">
                <div class="certificates-empty-content">
                    <i class='bx bx-search certificates-empty-icon'></i>
                    <h3>No Certificates Found</h3>
                    <p>No certificates match your search criteria. Try adjusting your filters.</p>
                </div>
            </div>
        `;
        return;
    }

    let html = '';
    certificates.forEach(certificate => {
        const issueDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const venue = certificate.venue && certificate.venue.length > 20 ?
            certificate.venue.substring(0, 20) + '...' : certificate.venue || 'No venue specified';

        // Use the SAME structure as your original template but with data attributes
        html += `
            <div class="certificates-photo-card" data-certificate-id="${certificate.id}">
                <div class="certificates-photo-container">
                    ${certificate.file_type === 'pdf' ? `
                        <div class="certificates-pdf-preview">
                            <div class="certificates-pdf-icon">
                                <i class='bx bxs-file-pdf'></i>
                            </div>
                            <span class="certificates-file-label">PDF Document</span>
                        </div>
                    ` : certificate.certificate_url ? `
                        <img src="${certificate.certificate_url}"
                             alt="Certificate for ${certificate.organization_name}"
                             class="certificates-image"
                             loading="lazy"
                             onerror="this.src='/static/images/certificate-placeholder.jpg'">
                    ` : `
                        <div class="certificates-image-placeholder">
                            <i class='bx bx-image-alt'></i>
                            <span>No Image</span>
                        </div>
                    `}

                    <!-- Overlay on hover -->
                    <div class="certificates-photo-overlay">
                        <div class="certificates-overlay-content">
                            <div class="certificates-org-badge ${certificate.organization_type}">
                                ${certificate.organization_type_display}
                            </div>
                            <div class="certificates-action-buttons">
                                <button class="certificates-overlay-btn" title="Download">
                                    <i class='bx bx-download'></i>
                                </button>
                                <button class="certificates-overlay-btn" title="View Details">
                                    <i class='bx bx-expand'></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Photo Info -->
                <div class="certificates-photo-info">
                    <h4 class="certificates-photo-title">${certificate.organization_name}</h4>
                    <p class="certificates-photo-subtitle">${certificate.organization_acronym}</p>
                    <div class="certificates-photo-meta">
                        <span class="certificates-meta-item">
                            <i class='bx bx-calendar'></i>
                            ${issueDate}
                        </span>
                        <span class="certificates-meta-item">
                            <i class='bx bx-map'></i>
                            ${venue}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

// Update pagination
function updateCertificatesPagination(pagination) {
    const paginationContainer = document.getElementById('certificatesPagination');

    if (!paginationContainer) {
        console.error('Certificates pagination container not found');
        return;
    }

    if (!pagination || pagination.num_pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHtml = `
        <div class="certificates-pagination">
            ${pagination.has_previous ? `
                <a href="javascript:void(0)" class="certificates-pagination-btn"
                   onclick="loadCertificatePage(${pagination.current_page - 1})">
                    <i class='bx bx-chevron-left'></i>
                </a>
            ` : ''}

            ${generatePaginationNumbers(pagination.current_page, pagination.num_pages)}

            ${pagination.has_next ? `
                <a href="javascript:void(0)" class="certificates-pagination-btn"
                   onclick="loadCertificatePage(${pagination.current_page + 1})">
                    <i class='bx bx-chevron-right'></i>
                </a>
            ` : ''}
        </div>
    `;

    paginationContainer.innerHTML = paginationHtml;
}

// Generate pagination numbers
function generatePaginationNumbers(currentPage, totalPages) {
    let html = '';
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<span class="certificates-pagination-btn active">${i}</span>`;
        } else {
            html += `
                <a href="javascript:void(0)" class="certificates-pagination-btn"
                   onclick="loadCertificatePage(${i})">${i}</a>
            `;
        }
    }

    return html;
}

// Load specific page
function loadCertificatePage(page) {
    showCertificateLoading();

    const params = new URLSearchParams({
        get_filtered_certificates: '1',
        search: currentCertificateFilters.search,
        organization: currentCertificateFilters.organization,
        date: currentCertificateFilters.date,
        type: currentCertificateFilters.type,
        certificate_page: page
    });

    fetch(`?${params.toString()}`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCertificatesGrid(data.certificates);
            updateCertificatesPagination(data.pagination);
            setTimeout(setupCertificateEventHandlers, 100);
        } else {
            throw new Error('Failed to load certificate page');
        }
    })
    .catch(error => {
        console.error('Error loading certificate page:', error);
        showCertificateError('Error loading certificates. Please try again.');
    })
    .finally(() => {
        hideCertificateLoading();
    });
}

// Reset all filters
function resetCertificateFilters() {
    const searchInput = document.getElementById('certificateSearch');
    const organizationFilter = document.getElementById('organizationFilter');
    const dateFilter = document.getElementById('dateFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (searchInput) searchInput.value = '';
    if (organizationFilter) organizationFilter.value = 'all';
    if (dateFilter) dateFilter.value = 'newest';
    if (typeFilter) typeFilter.value = 'all';

    currentCertificateFilters = {
        search: '',
        organization: 'all',
        date: 'newest',
        type: 'all'
    };

    filterCertificates();
}

// Update results count
function updateResultsCount(count) {
    const resultsElement = document.getElementById('certificatesResultsCount');
    if (resultsElement) {
        resultsElement.textContent = `Showing ${count} certificate${count !== 1 ? 's' : ''}`;
    }
}

// Loading states
function showCertificateLoading() {
    const grid = document.getElementById('certificatesGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="certificates-loading">
                <div class="certificates-spinner"></div>
                <p>Loading certificates...</p>
            </div>
        `;
    }
}

function hideCertificateLoading() {
    // Loading state is automatically replaced when content is updated
}

function showCertificateError(message) {
    const grid = document.getElementById('certificatesGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="certificates-error">
                <i class='bx bx-error-circle'></i>
                <h3>Error Loading Certificates</h3>
                <p>${message}</p>
                <button class="certificates-btn certificates-btn-primary" onclick="filterCertificates()">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup event handlers for initial content
    setupCertificateEventHandlers();

    // Initialize results count
    const resultsElement = document.getElementById('certificatesResultsCount');
    if (resultsElement) {
        const initialText = resultsElement.textContent;
        const countMatch = initialText.match(/\d+/);
        if (countMatch) {
            updateResultsCount(parseInt(countMatch[0]));
        }
    }

    // Add filter event listeners
    const searchInput = document.getElementById('certificateSearch');
    const organizationFilter = document.getElementById('organizationFilter');
    const dateFilter = document.getElementById('dateFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (searchInput) searchInput.addEventListener('input', filterCertificates);
    if (organizationFilter) organizationFilter.addEventListener('change', filterCertificates);
    if (dateFilter) dateFilter.addEventListener('change', filterCertificates);
    if (typeFilter) typeFilter.addEventListener('change', filterCertificates);

    // Modal close handlers
    const modal = document.getElementById('certificateModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeCertificateModal();
            }
        });
    }
});