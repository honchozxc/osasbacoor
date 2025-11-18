class ActivityLog {
    constructor() {
        this.currentPage = 1;
        this.hasMore = true;
        this.isLoading = false;
        this.filters = {
            type: 'all',
            user: 'all',
            search: '',
            dateFrom: '',
            dateTo: ''
        };

        this.initializeElements();
        this.bindEvents();
        this.loadActivities();
        this.loadUserFilter();
        this.loadStats();
    }

    initializeElements() {
        this.elements = {
            container: document.getElementById('recent-activities'),
            refreshBtn: document.getElementById('refresh-activities'),
            loadMoreBtn: document.getElementById('load-more-activities'),
            exportBtn: document.getElementById('export-activities'),
            typeFilter: document.getElementById('activity-filter'),
            userFilter: document.getElementById('user-filter'),
            searchInput: document.getElementById('activity-search'),
            dateFrom: document.getElementById('date-from'),
            dateTo: document.getElementById('date-to'),
            applyDateBtn: document.getElementById('apply-date-filter'),
            clearDateBtn: document.getElementById('clear-date-filter'),
            totalActivities: document.getElementById('total-activities'),
            todayActivities: document.getElementById('today-activities')
        };
    }

    bindEvents() {
        this.elements.refreshBtn.addEventListener('click', () => this.refreshActivities());
        this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreActivities());
        this.elements.exportBtn.addEventListener('click', () => this.exportActivities());
        this.elements.typeFilter.addEventListener('change', (e) => this.handleFilterChange('type', e.target.value));
        this.elements.userFilter.addEventListener('change', (e) => this.handleFilterChange('user', e.target.value));
        this.elements.searchInput.addEventListener('input', this.debounce(() => this.handleFilterChange('search', this.elements.searchInput.value), 300));
        this.elements.applyDateBtn.addEventListener('click', () => this.applyDateFilter());
        this.elements.clearDateBtn.addEventListener('click', () => this.clearDateFilter());
    }

    debounce(func, wait) {
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

    handleFilterChange(filterType, value) {
        this.filters[filterType] = value;
        this.currentPage = 1;
        this.hasMore = true;
        this.loadActivities();
    }

    applyDateFilter() {
        this.filters.dateFrom = this.elements.dateFrom.value;
        this.filters.dateTo = this.elements.dateTo.value;
        this.currentPage = 1;
        this.hasMore = true;
        this.loadActivities();
    }

    clearDateFilter() {
        this.elements.dateFrom.value = '';
        this.elements.dateTo.value = '';
        this.filters.dateFrom = '';
        this.filters.dateTo = '';
        this.currentPage = 1;
        this.hasMore = true;
        this.loadActivities();
    }

    async loadActivities(loadMore = false) {
        if (this.isLoading) return;

        this.isLoading = true;

        if (!loadMore) {
            this.showLoading();
            this.elements.loadMoreBtn.disabled = true;
        }

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                type: this.filters.type,
                user: this.filters.user,
                search: this.filters.search,
                date_from: this.filters.dateFrom,
                date_to: this.filters.dateTo
            });

            console.log('Fetching activities with params:', params.toString());

            const response = await fetch(`/analytics/recent-activities/?${params}`);

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            console.log('Received data:', data);

            if (loadMore) {
                this.appendActivities(data.activities);
            } else {
                this.displayActivities(data.activities);
            }

            this.hasMore = data.has_next;
            this.updateLoadMoreButton();

        } catch (error) {
            console.error('Error loading activities:', error);
            this.showError('Failed to load activities. Please try again.');
        } finally {
            this.isLoading = false;
        }
    }

    async loadMoreActivities() {
        if (this.isLoading || !this.hasMore) return;

        this.currentPage++;
        await this.loadActivities(true);
    }

    displayActivities(activities) {
        if (!activities || activities.length === 0) {
            this.showEmptyState();
            return;
        }

        this.elements.container.innerHTML = '';
        activities.forEach(activity => {
            const activityElement = this.createActivityElement(activity);
            this.elements.container.appendChild(activityElement);
        });

        // Enable load more button only if we have 50 activities
        this.updateLoadMoreButton();
    }

    appendActivities(activities) {
        if (!activities || activities.length === 0) {
            this.hasMore = false;
            this.updateLoadMoreButton();
            return;
        }

        activities.forEach(activity => {
            const activityElement = this.createActivityElement(activity);
            this.elements.container.appendChild(activityElement);
        });
    }

    createActivityElement(activity) {
        const activityType = this.getActivityType(activity.activity);
        const activityItem = document.createElement('div');
        activityItem.className = `activity-item ${this.getPriorityClass(activity)}`;
        activityItem.innerHTML = this.getActivityHTML(activity, activityType);

        activityItem.addEventListener('click', () => this.toggleActivityDetails(activityItem));

        return activityItem;
    }

    getActivityHTML(activity, activityType) {
        return `
            <div class="activity-icon ${activityType}">
                <i class="${this.getActivityIcon(activityType)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-header">
                    <div class="activity-user">${this.escapeHtml(activity.user)}</div>
                    <div class="activity-badge badge-${activityType}">${activityType}</div>
                </div>
                <div class="activity-text">${this.escapeHtml(activity.activity)}</div>
                <div class="activity-meta">
                    <span class="activity-time">${this.formatTimestamp(activity.timestamp)}</span>
                    <span class="activity-user-type">${activity.user_type}</span>
                    ${activity.ip_address ? `<span class="activity-ip">IP: ${activity.ip_address}</span>` : ''}
                </div>
                <div class="activity-details">
                    <div><strong>Activity ID:</strong> ${activity.id}</div>
                    <div><strong>Timestamp:</strong> ${new Date(activity.timestamp).toLocaleString()}</div>
                    ${activity.details ? `<div><strong>Details:</strong> ${activity.details}</div>` : ''}
                </div>
            </div>
        `;
    }

    toggleActivityDetails(activityItem) {
        activityItem.classList.toggle('expanded');
    }

    getActivityType(activityText) {
        const text = activityText.toLowerCase();
        if (text.includes('create') || text.includes('created')) return 'create';
        if (text.includes('update') || text.includes('updated')) return 'update';
        if (text.includes('archive') || text.includes('archived')) return 'archive';
        return 'system';
    }

    getActivityIcon(activityType) {
        const icons = {
            create: 'ri-add-circle-line',
            update: 'ri-edit-circle-line',
            archive: 'ri-archive-line',
            system: 'ri-server-line'
        };
        return icons[activityType] || 'ri-history-line';
    }

    getPriorityClass(activity) {
        if (activity.activity.toLowerCase().includes('failed') || activity.activity.toLowerCase().includes('error')) {
            return 'high-priority';
        }
        if (activity.activity.toLowerCase().includes('warning')) {
            return 'medium-priority';
        }
        return '';
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    }

    async loadUserFilter() {
        try {
            const response = await fetch('/analytics/activity-users/');
            const users = await response.json();

            this.elements.userFilter.innerHTML = '<option value="all">All Users</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                this.elements.userFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/analytics/activity-overview/');
            const stats = await response.json();

            this.elements.totalActivities.textContent = stats.total_activities?.toLocaleString() || '0';
            this.elements.todayActivities.textContent = stats.today_activities?.toLocaleString() || '0';
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async refreshActivities() {
        // Add visual feedback
        const icon = this.elements.refreshBtn.querySelector('i');
        icon.style.transform = 'rotate(360deg)';
        icon.style.transition = 'transform 0.5s ease';

        this.currentPage = 1;
        this.hasMore = true;
        await this.loadActivities();
        await this.loadStats();

        setTimeout(() => {
            icon.style.transform = 'rotate(0deg)';
        }, 500);
    }

    async exportActivities() {
        try {
            const params = new URLSearchParams({
                type: this.filters.type,
                user: this.filters.user,
                search: this.filters.search,
                date_from: this.filters.dateFrom,
                date_to: this.filters.dateTo
            });

            console.log('Exporting activities to CSV...');

            // Use the dedicated export endpoint
            const response = await fetch(`/analytics/export-activities/?${params}`);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please log in again to export data.');
                } else if (response.status === 403) {
                    throw new Error('You do not have permission to export activities.');
                } else {
                    throw new Error(`Export failed: ${response.status} ${response.statusText}`);
                }
            }

            // Get the CSV data as blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            console.log('Export completed successfully');

        } catch (error) {
            console.error('Error exporting activities:', error);
            alert(`Export failed: ${error.message}`);
        }
    }

    updateLoadMoreButton() {
        // Enable load more button only if we have exactly 50 activities on current page
        // and there are more pages to load
        const shouldEnable = this.hasMore && !this.isLoading;
        this.elements.loadMoreBtn.disabled = !shouldEnable;
        this.elements.loadMoreBtn.textContent = this.hasMore
            ? 'Load More Activities'
            : 'No More Activities';
    }

    showLoading() {
        this.elements.container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        `;
    }

    showEmptyState() {
        this.elements.container.innerHTML = `
            <div class="empty-state">
                <i class="ri-inbox-line"></i>
                <h3>No activities found</h3>
                <p>Try adjusting your filters or search terms</p>
            </div>
        `;
    }

    showError(message) {
        this.elements.container.innerHTML = `
            <div class="empty-state">
                <i class="ri-error-warning-line"></i>
                <h3>${message}</h3>
                <p>Please check your connection and try again</p>
            </div>
        `;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ActivityLog();
});