document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navContainer = document.querySelector('.nav-container');
    const html = document.documentElement;

    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navContainer.classList.toggle('active');

        // Toggle body scroll lock
        if (navContainer.classList.contains('active')) {
            html.style.overflow = 'hidden';
            html.style.touchAction = 'none';
        } else {
            html.style.overflow = '';
            html.style.touchAction = '';
        }
    });

    // Enhanced dropdown functionality
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-link');
        const menu = dropdown.querySelector('.dropdown-menu');

        // Toggle dropdown on click for mobile
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !isExpanded);
                dropdown.classList.toggle('active');

                // Close other dropdowns on mobile
                if (!isExpanded) {
                    dropdowns.forEach(otherDropdown => {
                        if (otherDropdown !== dropdown) {
                            otherDropdown.querySelector('.nav-link').setAttribute('aria-expanded', 'false');
                            otherDropdown.classList.remove('active');
                        }
                    });
                }
            }
        });

        // Handle hover for desktop
        if (window.innerWidth > 768) {
            dropdown.addEventListener('mouseenter', function() {
                this.querySelector('.nav-link').setAttribute('aria-expanded', 'true');
                this.classList.add('active');
            });

            dropdown.addEventListener('mouseleave', function() {
                this.querySelector('.nav-link').setAttribute('aria-expanded', 'false');
                this.classList.remove('active');
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            dropdowns.forEach(dropdown => {
                dropdown.querySelector('.nav-link').setAttribute('aria-expanded', 'false');
                dropdown.classList.remove('active');
            });
        }
    });

    // Close mobile menu when clicking a link (excluding dropdown parent links)
    const navLinksAll = document.querySelectorAll('.nav-link:not(.dropdown > .nav-link), .dropdown-link');
    navLinksAll.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                hamburger.classList.remove('active');
                navContainer.classList.remove('active');
                html.style.overflow = '';
                html.style.touchAction = '';
            }
        });
    });

    // Enhanced window resize handler with debounce
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (window.innerWidth > 768) {
                hamburger.classList.remove('active');
                navContainer.classList.remove('active');
                html.style.overflow = '';
                html.style.touchAction = '';

                // Reset dropdowns on desktop
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('active');
                    dropdown.querySelector('.nav-link').setAttribute('aria-expanded', 'false');
                });
            }
        }, 100);
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize

    // Add scroll effect to navbar
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            navbar.style.transform = 'translateY(0)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
            return;
        }

        if (currentScroll > lastScroll && !navContainer.classList.contains('active')) {
            // Scroll down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scroll up
            navbar.style.transform = 'translateY(0)';
            navbar.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3)';
        }

        lastScroll = currentScroll;
    });
});