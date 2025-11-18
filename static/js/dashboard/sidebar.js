function toggleSidebar() {
    const sidebar = document.querySelector('.left');
    const overlay = document.querySelector('.sidebar-overlay');

    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');

    const burgerIcon = document.querySelector('.burger-menu i');
    if (sidebar.classList.contains('active')) {
        burgerIcon.classList.remove('bx-menu');
        burgerIcon.classList.add('bx-x');
    } else {
        burgerIcon.classList.remove('bx-x');
        burgerIcon.classList.add('bx-menu');
    }
}

function setupDropdowns() {
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdownId = this.getAttribute('data-dropdown');
            const dropdown = document.querySelector(`.dropdown-items[data-content="${dropdownId}"]`);

            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-items').forEach(item => {
                if (item !== dropdown) {
                    item.classList.remove('show');
                    const otherToggle = document.querySelector(`.dropdown-toggle[data-dropdown="${item.getAttribute('data-content')}"]`);
                    if (otherToggle) otherToggle.classList.remove('active');
                }
            });

            // Toggle current dropdown
            const isOpening = !dropdown.classList.contains('show');
            dropdown.classList.toggle('show');
            this.classList.toggle('active');

            // Auto-activate first item when opening
            if (isOpening) {
                const firstItem = dropdown.querySelector('.menu-item');
                if (firstItem && firstItem.getAttribute('onclick')) {
                    const sectionId = firstItem.getAttribute('onclick').match(/'([^']+)'/)[1];
                    showSection(sectionId);

                    // Update active states
                    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
                    firstItem.classList.add('active');

                    // Update URL
                    history.pushState(null, null, `#${sectionId}`);
                }
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-toggle') && !e.target.closest('.dropdown-items')) {
            document.querySelectorAll('.dropdown-items').forEach(item => {
                item.classList.remove('show');
            });
            document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
                toggle.classList.remove('active');
            });
        }
    });
}

document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.left');
    const burgerMenu = document.querySelector('.burger-menu');
    const overlay = document.querySelector('.sidebar-overlay');

    if (window.innerWidth <= 992 &&
        !sidebar.contains(event.target) &&
        !burgerMenu.contains(event.target) &&
        sidebar.classList.contains('active')) {
        toggleSidebar();
    }
});

document.querySelectorAll('.menu-item:not(.dropdown-toggle)').forEach(item => {
    item.addEventListener('click', function(event) {
        if (this.getAttribute('href') === '#') {
            event.preventDefault();
        }

        if (this.getAttribute('onclick')) {
            const sectionId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(sectionId);
        }

        if (window.innerWidth <= 992) {
            toggleSidebar();
        }
    });
});

window.addEventListener('resize', function() {
    const sidebar = document.querySelector('.left');
    const overlay = document.querySelector('.sidebar-overlay');
    const burgerIcon = document.querySelector('.burger-menu i');

    if (window.innerWidth > 992) {
        sidebar.classList.add('active');
        overlay.classList.remove('active');
        burgerIcon.classList.remove('bx-x');
        burgerIcon.classList.add('bx-menu');
    } else {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
});

function showSection(sectionId) {
    const cleanSectionId = sectionId.replace('#', '');

    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active-section');
    });

    const targetSection = document.getElementById(cleanSectionId);
    if (targetSection) {
        targetSection.classList.add('active-section');
    }

    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeItem = document.querySelector(`.menu-item[onclick*="${cleanSectionId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');

        // If this is a dropdown item, highlight its parent too
        const dropdownParent = activeItem.closest('.dropdown-items');
        if (dropdownParent) {
            const parentToggle = document.querySelector(`.dropdown-toggle[data-dropdown="${dropdownParent.getAttribute('data-content')}"]`);
            if (parentToggle) {
                parentToggle.classList.add('active');
                dropdownParent.classList.add('show');
            }
        }
    }

    // Update URL without reloading
    history.pushState(null, null, `#${cleanSectionId}`);
}

function initSidebar() {
    const sidebar = document.querySelector('.left');
    if (window.innerWidth <= 992) {
        sidebar.classList.remove('active');
    } else {
        sidebar.classList.add('active');
    }

    // Initialize dropdowns
    setupDropdowns();
}

document.addEventListener('DOMContentLoaded', function () {
    initSidebar();

    const hash = window.location.hash.replace('#', '');
    const targetSection = document.getElementById(hash);

    if (hash && targetSection) {
        showSection(hash);
        const activeItem = document.querySelector(`.menu-item[onclick*="${hash}"]`);
        if (activeItem) activeItem.classList.add('active');
    } else {
        showSection('home');
        const homeItem = document.querySelector('.menu-item[onclick*="home"]');
        if (homeItem) homeItem.classList.add('active');
    }
});