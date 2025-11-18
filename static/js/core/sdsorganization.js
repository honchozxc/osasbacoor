// Enhanced SDS Organization JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeFAQ();
    initializeSmoothScrolling();
    initializeOrganizationFilter();
    initializeOrganizationCards();
    initializeCounterAnimation();
    initializeScrollAnimations();
    initializePagination();
});

// FAQ Functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.sds-faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.sds-faq-question');

        question.addEventListener('click', () => {
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');

            // Add animation to answer
            const answer = item.querySelector('.sds-faq-answer');
            if (item.classList.contains('active')) {
                animateFAQAnswer(answer);
            }
        });
    });
}

function animateFAQAnswer(answer) {
    const children = answer.children;
    Array.from(children).forEach((child, index) => {
        child.style.opacity = '0';
        child.style.transform = 'translateY(20px)';

        setTimeout(() => {
            child.style.transition = 'all 0.5s ease';
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('nav') ? document.querySelector('nav').offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update URL without page jump
                history.pushState(null, null, targetId);
            }
        });
    });
}

// Organization Filter
function initializeOrganizationFilter() {
    const filterButtons = document.querySelectorAll('.sds-filter-btn');
    const orgCards = document.querySelectorAll('.sds-org-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');

            // Filter organizations
            orgCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Organization Cards
function initializeOrganizationCards() {
    const orgCards = document.querySelectorAll('.sds-org-card');

    orgCards.forEach(card => {
        const logo = card.querySelector('.sds-org-logo');
        const viewBtn = card.querySelector('.sds-view-btn');

        // Click on logo redirects to organization page
        if (logo) {
            logo.addEventListener('click', function() {
                const orgUrl = viewBtn.getAttribute('href');
                // Add click animation
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                    window.location.href = orgUrl;
                }, 150);
            });
        }

        // Click on view button redirects to organization page
        if (viewBtn) {
            viewBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const orgUrl = this.getAttribute('href');
                // Add button animation
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    window.location.href = orgUrl;
                }, 150);
            });
        }

        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.transition = 'all 0.3s ease';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Counter Animation
function initializeCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                const duration = 2000; // 2 seconds
                const step = target / (duration / 16); // 60fps
                let current = 0;

                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        counter.textContent = target + '+';
                        clearInterval(timer);
                    } else {
                        counter.textContent = Math.floor(current);
                    }
                }, 16);

                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// Scroll Animations
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('.sds-org-card, .sds-stat-card, .sds-faq-item');

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

// Pagination Enhancement
function initializePagination() {
    const paginationBtns = document.querySelectorAll('.sds-pagination-btn');

    paginationBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (!this.classList.contains('sds-pagination-active')) {
                // Add click animation
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            }
        });

        // Add hover effects
        btn.addEventListener('mouseenter', function() {
            if (!this.classList.contains('sds-pagination-active')) {
                this.style.transform = 'translateY(-2px)';
            }
        });

        btn.addEventListener('mouseleave', function() {
            if (!this.classList.contains('sds-pagination-active')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });
}

// Scroll Indicator Animation
function initializeScrollIndicator() {
    const scrollIndicator = document.querySelector('.sds-scroll-indicator');

    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
            } else {
                scrollIndicator.style.opacity = '1';
            }
        });
    }
}

// Enhanced Stat Cards Animation
function initializeStatCards() {
    const statCards = document.querySelectorAll('.sds-stat-card');

    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
            this.querySelector('.sds-stat-icon').style.transform = 'scale(1.1)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.querySelector('.sds-stat-icon').style.transform = 'scale(1)';
        });
    });
}

// Utility function for debouncing
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

// Handle window resize
window.addEventListener('resize', debounce(function() {
    // Reinitialize responsive elements
    initializeScrollAnimations();
}, 250));

// Initialize additional components
document.addEventListener('DOMContentLoaded', function() {
    initializeScrollIndicator();
    initializeStatCards();
});

// Add loading states for better UX
function handleImageLoading() {
    const images = document.querySelectorAll('.sds-org-logo img');

    images.forEach(img => {
        // Add loading state
        img.addEventListener('load', function() {
            this.style.opacity = '1';
            this.style.transition = 'opacity 0.3s ease';
        });

        img.addEventListener('error', function() {
            // Handle broken images
            this.src = 'https://via.placeholder.com/120x120/003366/ffffff?text=ORG';
        });
    });
}

// Enhanced error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
});

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeFAQ,
        initializeSmoothScrolling,
        initializeOrganizationFilter,
        initializeOrganizationCards,
        initializeCounterAnimation,
        initializeScrollAnimations,
        initializePagination,
        debounce
    };
}