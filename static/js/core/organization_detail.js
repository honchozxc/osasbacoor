document.addEventListener('DOMContentLoaded', function() {
    initializeCertificateGallery();
    initializeMemberCards();
    initializeSmoothAnimations();
    formatMemberPositions();
    handleMemberImages();
    initializeLogoModal();
    initializeScrollButtons();
    initializePagination();
});

// Initialize Pagination
function initializePagination() {
    const paginationNumbers = document.querySelectorAll('.org-detail-pagination-number');
    const paginationButtons = document.querySelectorAll('.org-detail-pagination-btn');

    // Add smooth scrolling when pagination links are clicked
    paginationNumbers.forEach(number => {
        number.addEventListener('click', function(e) {
            if (this.getAttribute('href')) {
                e.preventDefault();

                // Smooth scroll to top of members section
                const membersSection = document.querySelector('.org-detail-section');
                if (membersSection) {
                    membersSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }

                // Add loading state
                this.style.opacity = '0.7';

                // Navigate after a short delay
                setTimeout(() => {
                    window.location.href = this.getAttribute('href');
                }, 300);
            }
        });
    });

    // Handle pagination button clicks
    paginationButtons.forEach(button => {
        if (button.getAttribute('href')) {
            button.addEventListener('click', function(e) {
                if (!this.classList.contains('org-detail-pagination-disabled')) {
                    e.preventDefault();

                    // Smooth scroll to top
                    const membersSection = document.querySelector('.org-detail-section');
                    if (membersSection) {
                        membersSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }

                    // Add loading state
                    this.style.opacity = '0.7';
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

                    // Navigate after a short delay
                    setTimeout(() => {
                        window.location.href = this.getAttribute('href');
                    }, 400);
                }
            });
        }
    });
}

// Certificate Gallery Functionality
function initializeCertificateGallery() {
    const certificateCards = document.querySelectorAll('.org-detail-certificate-card');
    const modal = document.getElementById('certificateModal');
    const modalImg = document.getElementById('certificateImage');
    const closeBtn = document.querySelectorAll('.org-detail-modal-close');

    certificateCards.forEach(card => {
        const img = card.querySelector('.org-detail-certificate-img');
        const viewBtn = card.querySelector('[data-certificate-src]');

        if (img && img.src) {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function() {
                openCertificateModal(this.src);
            });
        }

        if (viewBtn) {
            viewBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const imgSrc = this.getAttribute('data-certificate-src');
                openCertificateModal(imgSrc);
            });
        }
    });

    closeBtn.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('org-detail-modal')) {
            closeAllModals();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    function openCertificateModal(imgSrc) {
        if (modal && modalImg) {
            modalImg.src = imgSrc;
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
}

// Organization Logo Modal
function initializeLogoModal() {
    const logoContainer = document.getElementById('orgLogoModalTrigger');
    const modal = document.getElementById('orgLogoModal');
    const modalImg = document.getElementById('orgLogoImage');

    if (logoContainer) {
        logoContainer.addEventListener('click', function() {
            const logoImg = this.querySelector('.org-detail-logo');
            if (logoImg && logoImg.src) {
                modalImg.src = logoImg.src;
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    }
}

// Close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.org-detail-modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Horizontal Scroll for Certificates
function initializeScrollButtons() {
    const track = document.querySelector('.org-detail-certificates-track');
    const leftBtn = document.querySelector('.org-detail-scroll-left');
    const rightBtn = document.querySelector('.org-detail-scroll-right');

    if (!track || !leftBtn || !rightBtn) return;

    const scrollAmount = 350;

    leftBtn.addEventListener('click', function() {
        track.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    rightBtn.addEventListener('click', function() {
        track.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    function updateScrollButtons() {
        const { scrollLeft, scrollWidth, clientWidth } = track;

        leftBtn.disabled = scrollLeft <= 0;
        rightBtn.disabled = scrollLeft >= scrollWidth - clientWidth - 1;
    }

    track.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();
}

// Member Cards Enhancement
function initializeMemberCards() {
    const memberCards = document.querySelectorAll('.org-detail-member-card');

    memberCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 51, 102, 0.2)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = 'var(--org-shadow-lg)';
        });
    });
}

// Handle Member Profile Images
function handleMemberImages() {
    const memberImages = document.querySelectorAll('.org-detail-member-img');

    memberImages.forEach(img => {
        img.addEventListener('error', function() {
            this.src = '/static/images/cvsu_logo.png';
            this.onerror = function() {
                const initials = this.getAttribute('data-member-initials') || 'M';
                this.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="#003366"/>
                        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                              fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
                            ${initials}
                        </text>
                    </svg>
                `);
            };
        });
    });
}

// Smooth Animations
function initializeSmoothAnimations() {
    const animatedElements = document.querySelectorAll('.org-detail-section, .org-detail-sidebar-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.transition = 'all 0.6s ease';
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        observer.observe(element);
    });
}

// Format Member Positions
function formatMemberPositions() {
    const memberRoles = document.querySelectorAll('.org-detail-member-role');

    memberRoles.forEach(roleElement => {
        const originalPosition = roleElement.getAttribute('data-position') || roleElement.textContent;
        const formattedPosition = formatPosition(originalPosition);
        roleElement.textContent = formattedPosition;
    });
}

// Utility function for position formatting
function formatPosition(position) {
    if (!position) return 'Member';

    let formatted = position.replace(/^org_/, '').replace(/_/g, ' ');

    // Convert to title case
    formatted = formatted.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return formatted || 'Member';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeCertificateGallery,
        initializeLogoModal,
        initializeScrollButtons,
        initializeMemberCards,
        initializeSmoothAnimations,
        formatPosition,
        formatMemberPositions,
        handleMemberImages
    };
}