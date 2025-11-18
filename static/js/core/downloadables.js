document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const dateFilter = document.getElementById('date-filter');
    const counterElements = document.querySelectorAll('.stat-number');
    const downloadablesList = document.querySelector('.downloadables-list');
    const downloadableItems = document.querySelectorAll('.downloadable-item');
    const originalNoResults = document.querySelector('.no-results');
    const paginationContainer = document.querySelector('.pagination-container');
    const showingStart = document.getElementById('showing-start');
    const showingEnd = document.getElementById('showing-end');
    const totalItems = document.getElementById('total-items');
    const loadingIndicator = document.querySelector('.loading-indicator');

    // Store all items for filtering
    const allItems = Array.from(downloadableItems);

    let noResultsElement = null;
    if (originalNoResults) {
        noResultsElement = originalNoResults;
        noResultsElement.classList.add('hidden');
    }

    function showLoading() {
        loadingIndicator.style.display = 'flex';
        setTimeout(() => {
            loadingIndicator.style.opacity = '1';
        }, 10);
    }

    function hideLoading() {
        loadingIndicator.style.opacity = '0';
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
        }, 300);
    }

    function isDefaultState() {
        return !searchInput.value.trim() && categoryFilter.value === 'all' && dateFilter.value === 'latest';
    }

    function filterItems() {
        showLoading();

        setTimeout(() => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            const category = categoryFilter.value;
            const dateFilterValue = dateFilter.value;

            if (isDefaultState()) {
                resetToDefault();
                hideLoading();
                return;
            }

            let visibleItems = allItems;

            // Apply search filter
            if (searchTerm) {
                visibleItems = visibleItems.filter(item => {
                    const title = item.getAttribute('data-title') || '';
                    const description = item.getAttribute('data-description') || '';
                    return title.includes(searchTerm) || description.includes(searchTerm);
                });
            }

            // Apply category filter
            if (category !== 'all') {
                visibleItems = visibleItems.filter(item => {
                    const itemCategory = item.getAttribute('data-category') || '';
                    return itemCategory === category;
                });
            }

            // Apply date filter
            if (dateFilterValue !== 'latest') {
                visibleItems = sortItemsByDate(visibleItems, dateFilterValue);
            } else {
                // Default to latest first
                visibleItems = sortItemsByDate(visibleItems, 'latest');
            }

            // Hide all items first
            allItems.forEach(item => {
                item.classList.add('hidden');
            });

            // Show filtered items
            visibleItems.forEach(item => {
                item.classList.remove('hidden');
            });

            // Show no results message if needed
            if (visibleItems.length === 0) {
                if (!noResultsElement) {
                    noResultsElement = document.createElement('div');
                    noResultsElement.className = 'no-results glass-card';
                    noResultsElement.innerHTML = '<i class="fas fa-folder-open"></i><p>No documents match your criteria.</p>';
                    downloadablesList.appendChild(noResultsElement);
                } else {
                    noResultsElement.classList.remove('hidden');
                }
            } else if (noResultsElement) {
                noResultsElement.classList.add('hidden');
            }

            // Update showing information
            showingStart.textContent = '1';
            showingEnd.textContent = visibleItems.length;
            totalItems.textContent = visibleItems.length;

            paginationContainer.classList.add('hidden');

            hideLoading();
        }, 100);
    }

    function resetToDefault() {
        // Show all items
        allItems.forEach(item => {
            item.classList.remove('hidden');
        });

        if (noResultsElement && noResultsElement !== originalNoResults) {
            noResultsElement.remove();
            noResultsElement = originalNoResults;
        }

        if (noResultsElement) {
            noResultsElement.classList.add('hidden');
        }

        showingStart.textContent = showingStart.dataset.original;
        showingEnd.textContent = showingEnd.dataset.original;
        totalItems.textContent = totalItems.dataset.original;

        paginationContainer.classList.remove('hidden');
    }

    function sortItemsByDate(items, filter) {
        const sortedItems = [...items];

        sortedItems.sort((a, b) => {
            const dateA = new Date(a.getAttribute('data-date') || 0);
            const dateB = new Date(b.getAttribute('data-date') || 0);

            if (filter === 'oldest') {
                return dateA - dateB;
            } else {
                // Default: latest first
                return dateB - dateA;
            }
        });

        return sortedItems;
    }

    // Function to animate counters
    function animateCounters() {
        counterElements.forEach(counter => {
            const target = +counter.innerText;
            const duration = 2000;
            const step = target / (duration / 16);

            let current = 0;

            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target;
                }
            };

            counter.innerText = '0';
            updateCounter();
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Store original values
    showingStart.dataset.original = showingStart.textContent;
    showingEnd.dataset.original = showingEnd.textContent;
    totalItems.dataset.original = totalItems.textContent;

    // Event listeners
    searchInput.addEventListener('input', debounce(filterItems, 300));
    categoryFilter.addEventListener('change', filterItems);
    dateFilter.addEventListener('change', filterItems);

    hideLoading();
});