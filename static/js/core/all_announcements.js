document.addEventListener('DOMContentLoaded', function() {
    const initialAnnouncements = window.announcementsData;
    const now = window.currentDateTime;

    // DOM elements
    const container = document.getElementById('announcements-container');
    const template = document.getElementById('announcement-template');
    const searchInput = document.getElementById('announcement-search');
    const sortSelect = document.getElementById('sort-by');
    const unitSelect = document.getElementById('filter-unit');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const paginationContainer = document.querySelector('.pagination-container');
    const loadingContainer = document.getElementById('loading-container');

    // Current filter state
    let currentCategory = 'all';
    let currentSort = 'newest';
    let currentUnit = 'all';
    let searchQuery = '';
    let isFiltering = false;
    let allAnnouncementsCache = null;

    // Process initial data (server-rendered)
    if (initialAnnouncements.length > 0) {
        processAndDisplayAnnouncements(initialAnnouncements);
    }

    // Event listeners
    searchInput.addEventListener('input', debounce((e) => {
        searchQuery = e.target.value.toLowerCase();
        if (searchQuery) {
            showLoading();
            fetchAllAnnouncements().then(allAnnouncements => {
                filterAndDisplayAnnouncements(allAnnouncements);
                hideLoading();
            }).catch(error => {
                console.error('Error:', error);
                hideLoading();
            });
        } else {
            resetToInitialState();
        }
    }, 300));

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        if (searchQuery || currentCategory !== 'all' || currentUnit !== 'all') {
            showLoading();
            fetchAllAnnouncements().then(allAnnouncements => {
                filterAndDisplayAnnouncements(allAnnouncements);
                hideLoading();
            }).catch(error => {
                console.error('Error:', error);
                hideLoading();
            });
        } else {
            updateUrlParams({sort: currentSort});
            showLoading();
            setTimeout(() => {
                const sorted = sortAnnouncements([...initialAnnouncements]);
                processAndDisplayAnnouncements(sorted);
                hideLoading();
            }, 100);
        }
    });

    unitSelect.addEventListener('change', (e) => {
        currentUnit = e.target.value;
        if (currentUnit !== 'all') {
            showLoading();
            isFiltering = true;
            fetchAllAnnouncements().then(allAnnouncements => {
                filterAndDisplayAnnouncements(allAnnouncements);
                hideLoading();
            }).catch(error => {
                console.error('Error:', error);
                hideLoading();
            });
        } else {
            resetToInitialState();
        }
    });

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;

            if (currentCategory !== 'all') {
                showLoading();
                isFiltering = true;
                fetchAllAnnouncements().then(allAnnouncements => {
                    filterAndDisplayAnnouncements(allAnnouncements);
                    hideLoading();
                }).catch(error => {
                    console.error('Error:', error);
                    hideLoading();
                });
            } else {
                resetToInitialState();
            }
        });
    });

    // Handle view details clicks
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-details-btn')) {
            e.preventDefault();
            const url = e.target.closest('.view-details-btn').getAttribute('href');
            window.location.href = url;
        }
    });

    initScrollAnimations();

    function showLoading() {
        loadingContainer.classList.add('visible');
        container.style.opacity = '0.5';
    }

    function hideLoading() {
        loadingContainer.classList.remove('visible');
        container.style.opacity = '1';
    }

    function resetToInitialState() {
        showLoading();
        setTimeout(() => {
            processAndDisplayAnnouncements(initialAnnouncements);
            paginationContainer.style.display = 'flex';
            isFiltering = false;
            hideLoading();

            updateUrlParams({});
        }, 100);
    }

    function fetchAllAnnouncements() {
        // Use cache if available
        if (allAnnouncementsCache) {
            return Promise.resolve(allAnnouncementsCache);
        }

        return fetch('/api/announcements/all/')
            .then(response => response.json())
            .then(data => {
                allAnnouncementsCache = data;
                return data;
            })
            .catch(error => {
                console.error('Error fetching announcements:', error);
                return [];
            });
    }

    function filterAndDisplayAnnouncements(announcements) {
        let filtered = [...announcements];

        if (currentCategory !== 'all') {
            filtered = filtered.filter(ann =>
                ann.category.toLowerCase() === currentCategory.toLowerCase()
            );
        }

        if (currentUnit !== 'all') {
            filtered = filtered.filter(ann => {
                return ann.author_unit.toString() === currentUnit.toString();
            });
        }

        if (searchQuery) {
            filtered = filtered.filter(ann =>
                ann.title.toLowerCase().includes(searchQuery) ||
                stripHtml(ann.content).toLowerCase().includes(searchQuery)
            );
        }

        filtered = sortAnnouncements(filtered);

        if (searchQuery || currentCategory !== 'all' || currentUnit !== 'all') {
            paginationContainer.style.display = 'none';
            isFiltering = true;
        } else {
            paginationContainer.style.display = 'flex';
            isFiltering = false;
        }

        processAndDisplayAnnouncements(filtered);
    }

    function processAndDisplayAnnouncements(announcements) {
        container.innerHTML = '';

        if (announcements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <img src="/static/images/no-announcements.svg" alt="No announcements">
                    <h3>No Announcements Found</h3>
                    <p>There are currently no announcements matching your filters.</p>
                </div>
            `;
            return;
        }

        announcements.forEach(ann => {
            const card = template.content.cloneNode(true);

            // Basic info
            card.querySelector('.announcement-title').textContent = ann.title;
            card.querySelector('.author-name').textContent = ann.author_full_name;

            // Handle formatted content
            const contentContainer = card.querySelector('.announcement-content');
            contentContainer.innerHTML = truncateHtml(ann.content, 30);

            // Category
            const categoryTag = card.querySelector('.category-tag');
            categoryTag.classList.add(ann.category.toLowerCase());
            card.querySelector('.category-text').textContent = ann.category_display;

            // Dates
            const publishDate = new Date(ann.publish_date);
            card.querySelector('.date-text').textContent = formatDate(publishDate);
            card.querySelector('.time').textContent = formatTime(publishDate);

            // View Details button
            const detailsBtn = card.querySelector('.view-details-btn');
            detailsBtn.href = `/detail_announcement/${ann.id}/`;
            detailsBtn.setAttribute('title', `View ${ann.title} details`);

            // Image
            if (ann.first_image && ann.first_image.url) {
                const imgContainer = card.querySelector('.announcement-image');
                imgContainer.style.display = 'block';
                const img = imgContainer.querySelector('img');
                img.src = ann.first_image.url;
                img.alt = ann.first_image.caption || ann.title;

                if (ann.first_image.caption) {
                    const caption = imgContainer.querySelector('.image-caption');
                    caption.style.display = 'block';
                    caption.textContent = ann.first_image.caption;
                }
            }

            // Dynamic details
            const detailsContainer = card.querySelector('.dynamic-details');
            detailsContainer.innerHTML = '';

            if (ann.category === 'ENROLLMENT') {
                detailsContainer.innerHTML = `
                    <div class="detail-item">
                        <i class="fas fa-book"></i>
                        <span>${ann.courses_display.join(', ')}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar-day"></i>
                        <span>${formatDate(new Date(ann.enrollment_start))} - ${formatDate(new Date(ann.enrollment_end))}</span>
                    </div>
                `;
            } else if (ann.category === 'EVENT') {
                detailsContainer.innerHTML = `
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${ann.location || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${formatDateTime(new Date(ann.event_date))}</span>
                    </div>
                `;
            } else if (ann.category === 'SUSPENSION') {
                let suspensionDateText = formatDate(new Date(ann.suspension_date));
                if (ann.until_suspension_date) {
                    suspensionDateText += ` - ${formatDate(new Date(ann.until_suspension_date))}`;
                }
                detailsContainer.innerHTML = `
                    <div class="detail-item">
                        <i class="fas fa-ban"></i>
                        <span>${suspensionDateText}</span>
                    </div>
                `;
            } else if (ann.category === 'EMERGENCY') {
                detailsContainer.innerHTML = `
                    <div class="detail-item">
                        <i class="fas fa-phone-alt"></i>
                        <span>${ann.contact_info || 'Not specified'}</span>
                    </div>
                `;
            }

            // External link
            if (ann.link) {
                const extLink = card.querySelector('.external-link');
                extLink.style.display = 'flex';
                extLink.href = ann.link;
                extLink.setAttribute('title', `Open external link for ${ann.title}`);
            }

            container.appendChild(card);
        });
    }

    // Helper functions
    function formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function formatDateTime(date) {
        return `${formatDate(date)} ${formatTime(date)}`;
    }

    function sortAnnouncements(announcements) {
        const sorted = [...announcements];

        switch (currentSort) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.publish_date) - new Date(b.publish_date));
                break;
            case 'title-asc':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
        }

        return sorted;
    }

    function stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function truncateHtml(html, wordCount) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;

        let text = tmp.textContent || tmp.innerText || '';
        let words = text.split(/\s+/);

        if (words.length <= wordCount) {
            return html;
        }

        let truncatedText = words.slice(0, wordCount).join(' ');
        let lastSpace = html.indexOf(truncatedText) + truncatedText.length;

        const result = document.createElement('div');
        result.innerHTML = html.substring(0, lastSpace) + '...';

        return result.innerHTML;
    }

    function updateUrlParams(params) {
        const url = new URL(window.location);

        // Remove all existing params
        for (const key of url.searchParams.keys()) {
            url.searchParams.delete(key);
        }

        // Add new params
        for (const [key, value] of Object.entries(params)) {
            if (value) {
                url.searchParams.set(key, value);
            }
        }

        // Update URL without reloading
        window.history.replaceState({}, '', url);
    }

    // Debounce function to limit API calls during typing
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
});

// Counting animation for stats
function animateCounters() {
    const counters = document.querySelectorAll('.count');
    const speed = 100;
    const animationDuration = 3000;

    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const increment = target / (animationDuration / speed);

        if (count < target) {
            const updateCount = () => {
                const currentCount = +counter.innerText;
                const newCount = Math.ceil(currentCount + increment);

                if (newCount < target) {
                    counter.innerText = newCount;
                    setTimeout(updateCount, speed);
                } else {
                    counter.innerText = target;
                }
            };

            updateCount();
        } else {
            counter.innerText = target;
        }
    });
}

// Start the animation when the page loads
document.addEventListener('DOMContentLoaded', animateCounters);

function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

function initScrollAnimations() {
    // Set animation order for cards
    const cards = document.querySelectorAll('.announcement-card');
    cards.forEach((card, index) => {
        // Add animation class with staggered delay
        card.classList.add('scroll-animate');
        card.classList.add(`delay-${index % 6}`); // Cycle through 0-5 delays
        card.setAttribute('data-scroll', '');
    });

    // Create intersection observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger animation when 50px from viewport bottom
    });

    // Observe all animatable elements
    const animatableElements = [
        '.announcement-card',
        '.stat-card',
        '.control-panel',
        '.pagination-container',
        '.header-section',
        '.page-title',
        '.stats',
        '.category-tabs',
        '.sort-filter-controls',
        '.empty-state'
    ];

    animatableElements.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            // Add base animation class
            if (!selector.includes('announcement-card')) {
                el.classList.add('scroll-animate-fade');
            }

            // Set initial state
            el.style.opacity = 0;
            el.setAttribute('data-scroll', '');

            // Observe the element
            observer.observe(el);
        });
    });

    // Special handling for stats cards - animate them sequentially
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.15}s`;
    });

    // Special handling for control panel sections
    const controlPanelSections = document.querySelectorAll('.sort-filter-controls > *');
    controlPanelSections.forEach((section, index) => {
        section.classList.add('scroll-animate-fade');
        section.style.animationDelay = `${index * 0.1}s`;
    });

    // Special handling for category tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach((tab, index) => {
        tab.classList.add('scroll-animate-fade');
        tab.style.animationDelay = `${index * 0.05}s`;
    });
}