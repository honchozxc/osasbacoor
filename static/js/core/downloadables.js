class DownloadablesManager {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.categoryFilter = document.getElementById('category-filter');
        this.dateFilter = document.getElementById('date-filter');
        this.searchButton = document.getElementById('search-button');
        this.clearFiltersBtn = document.getElementById('clear-filters');

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateClearButton();
    }

    bindEvents() {
        // Search with debouncing
        this.searchInput.addEventListener('input', this.debounce(() => this.updateFilters(), 500));

        // Filter changes
        this.categoryFilter.addEventListener('change', () => this.updateFilters());
        this.dateFilter.addEventListener('change', () => this.updateFilters());

        // Search button click
        this.searchButton.addEventListener('click', () => this.updateFilters());

        // Clear filters
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());

        // Enter key in search
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.updateFilters();
            }
        });
    }

    updateFilters() {
        const searchValue = this.searchInput.value.trim();
        const categoryValue = this.categoryFilter.value;
        const dateValue = this.dateFilter.value;

        // Build URL with current filters
        const params = new URLSearchParams();

        if (searchValue) params.append('search', searchValue);
        if (categoryValue !== 'all') params.append('category', categoryValue);
        if (dateValue !== 'latest') params.append('date', dateValue);

        // Always go to first page when filtering
        params.append('page', '1');

        const queryString = params.toString();
        const newUrl = queryString ? `?${queryString}` : '?';

        window.location.href = newUrl;
    }

    clearFilters() {
        this.searchInput.value = '';
        this.categoryFilter.value = 'all';
        this.dateFilter.value = 'latest';
        this.updateFilters();
    }

    updateClearButton() {
        const hasActiveFilters = this.searchInput.value ||
                               this.categoryFilter.value !== 'all' ||
                               this.dateFilter.value !== 'latest';
        this.clearFiltersBtn.style.display = hasActiveFilters ? 'flex' : 'none';
    }

    debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new DownloadablesManager();
});