// ------------------------------------- Infinite Scroll for Announcements --------------------------------------------
let currentHomePage = parseInt(document.getElementById('infiniteScrollData').getAttribute('data-next-page')) || 2;
let isLoading = false;
let hasMoreAnnouncements = document.getElementById('infiniteScrollData').getAttribute('data-has-next') === 'true';

// Infinite scroll function
function initInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoading || !hasMoreAnnouncements) return;

        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

        // Load more when user is 100px from bottom
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadMoreAnnouncements();
        }
    });
}

// Load more announcements function
async function loadMoreAnnouncements() {
    if (isLoading || !hasMoreAnnouncements) return;

    isLoading = true;

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="loading-spinner"></div><p>Loading more announcements...</p>';
    document.getElementById('announcementFeed').appendChild(loadingIndicator);

    try {
        const response = await fetch(`?get_home_announcements=1&page=${currentHomePage}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success) {
            // Remove loading indicator
            loadingIndicator.remove();

            // Append new announcements
            if (data.announcements && data.announcements.length > 0) {
                data.announcements.forEach(announcement => {
                    const announcementCard = createAnnouncementCard(announcement);
                    document.getElementById('announcementFeed').appendChild(announcementCard);
                });

                // Update pagination state
                hasMoreAnnouncements = data.has_next;
                currentHomePage = data.next_page || currentHomePage + 1;

                // Re-initialize event listeners for new cards
                initAnnouncementEventListeners();
            } else {
                // No more announcements
                showNoMoreAnnouncements();
            }
        } else {
            loadingIndicator.remove();
            console.error('Failed to load more announcements');
        }
    } catch (error) {
        loadingIndicator.remove();
        console.error('Error loading more announcements:', error);
    } finally {
        isLoading = false;
    }
}

// Show no more announcements message
function showNoMoreAnnouncements() {
    const noMoreDiv = document.createElement('div');
    noMoreDiv.className = 'no-more-announcements';
    noMoreDiv.innerHTML = '<p>No more announcements to load</p>';
    document.getElementById('announcementFeed').appendChild(noMoreDiv);
    hasMoreAnnouncements = false;
}

// Create announcement card HTML from data
function createAnnouncementCard(announcement) {
    const card = document.createElement('div');
    card.className = 'announcement-card';
    card.setAttribute('data-id', `announcement-${announcement.id}`);
    card.setAttribute('data-category', announcement.category);
    card.setAttribute('data-date', new Date(announcement.created_at).getTime() / 1000);

    // Build the card HTML
    card.innerHTML = `
        <div class="card-header">
            <div class="profile-section">
                <div class="author-avatar default-avatar">
                    ${getInitials(announcement.author_name)}
                </div>
                <div class="name-time">
                    <span class="author-name">${announcement.author_name}</span>
                    <span class="post-time">${announcement.timesince} ago</span>
                </div>
            </div>
            <div class="card-category ${announcement.category.toLowerCase()}">
                ${announcement.category_display}
            </div>
        </div>

        <div class="card-content">
            <h3 class="announcement-title">${escapeHtml(announcement.title)}</h3>
            <div class="announcement-text">
                <div class="truncated-content">
                    ${truncateContent(announcement.content, 30)}
                </div>
                <div class="full-content" style="display: none;">
                    ${announcement.content}
                </div>
                ${countWords(announcement.content) > 30 ? '<button class="toggle-content-btn">Show More</button>' : ''}
            </div>
            ${announcement.link ? `
            <div class="announcement-link">
                <a href="${announcement.link}" target="_blank" rel="noopener noreferrer">
                    <i class="ri-links-line"></i> ${announcement.link.length > 40 ? announcement.link.substring(0, 40) + '...' : announcement.link}
                </a>
            </div>
            ` : ''}

            ${getCategorySpecificHTML(announcement)}

            ${announcement.has_images && announcement.images && announcement.images.length > 0 ? `
            <div class="card-gallery">
                <div class="gallery-preview" onclick="openImageViewer(this, 0, 1)"
                     data-image-url="${announcement.images[0].url}"
                     ${announcement.images[0].caption ? `data-caption="${escapeHtml(announcement.images[0].caption)}"` : ''}>
                    <img src="${announcement.images[0].url}" alt="Announcement image" loading="lazy">
                    ${announcement.images[0].caption ? `<div class="image-caption">${escapeHtml(announcement.images[0].caption)}</div>` : ''}
                </div>
            </div>
            ` : ''}
        </div>
    `;

    return card;
}

// Helper function to get initials
function getInitials(fullName) {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to count words
function countWords(text) {
    return text.split(/\s+/).length;
}

// Helper function to truncate content
function truncateContent(content, wordCount) {
    const words = content.split(/\s+/);
    if (words.length <= wordCount) return content;
    return words.slice(0, wordCount).join(' ') + '...';
}

// Helper function to get category-specific HTML
function getCategorySpecificHTML(announcement) {
    switch(announcement.category) {
        case 'ENROLLMENT':
            if (announcement.courses && announcement.courses.length > 0) {
                return `
                <div class="category-details">
                    <div class="detail-item">
                        <label><i class="ri-book-2-line"></i> Courses:</label>
                        <span>${announcement.courses.join('<br>')}</span>
                    </div>
                    ${announcement.enrollment_start && announcement.enrollment_end ? `
                    <div class="detail-item">
                        <span><i class="ri-calendar-event-line"></i> Enrollment: ${formatDate(announcement.enrollment_start)} to ${formatDate(announcement.enrollment_end)}</span>
                    </div>
                    ` : ''}
                </div>
                `;
            }
            return '';

        case 'EVENT':
            return `
            <div class="category-details">
                ${announcement.event_date ? `
                <div class="detail-item">
                    <span><i class="ri-time-line"></i> Event Date: ${formatDate(announcement.event_date)}</span>
                </div>
                ` : ''}
                ${announcement.location ? `
                <div class="detail-item">
                    <span><i class="ri-map-pin-line"></i> Location: ${escapeHtml(announcement.location)}</span>
                </div>
                ` : ''}
            </div>
            `;

        case 'SUSPENSION':
            return `
            <div class="category-details">
                ${announcement.suspension_date ? `
                <div class="detail-item">
                    <span><i class="ri-calendar-close-line"></i> Suspension Date: ${formatDate(announcement.suspension_date, true)}</span>
                </div>
                ` : ''}
                ${announcement.until_suspension_date ? `
                <div class="detail-item">
                    <span><i class="ri-calendar-close-line"></i> Until: ${formatDate(announcement.until_suspension_date, true)}</span>
                </div>
                ` : ''}
            </div>
            `;

        case 'EMERGENCY':
            return announcement.contact_info ? `
            <div class="category-details emergency">
                <div class="detail-item">
                    <span><i class="ri-alert-line"></i> Emergency Contact: <br>${escapeHtml(announcement.contact_info).replace(/\n/g, '<br>')}</span>
                </div>
            </div>
            ` : '';

        case 'SCHOLARSHIP':
            return `
            <div class="category-details scholarship">
                ${announcement.application_start && announcement.application_end ? `
                <div class="detail-item">
                    <span><i class="ri-timer-flash-line"></i> Application Period:
                        ${formatDate(announcement.application_start, true)} to ${formatDate(announcement.application_end, true)}
                    </span>
                    <span class="time-remaining" data-deadline="${new Date(announcement.application_end).getTime() / 1000}">
                        (${getTimeUntil(announcement.application_end)} remaining)
                    </span>
                </div>
                ` : ''}
                ${announcement.scholarship_name ? `
                <div class="detail-item">
                    <span><i class="ri-information-line"></i> Scholarship: ${escapeHtml(announcement.scholarship_name)}</span>
                </div>
                ` : ''}
                ${announcement.benefits ? `
                <div class="detail-item">
                    <span><i class="ri-money-dollar-circle-line"></i> Benefits: ${escapeHtml(announcement.benefits)}</span>
                </div>
                ` : ''}
                ${announcement.requirements ? `
                <div class="detail-item">
                    <span><i class="ri-file-list-line"></i> Requirements: ${escapeHtml(announcement.requirements)}</span>
                </div>
                ` : ''}
            </div>
            `;

        default:
            return '';
    }
}

// Helper function to format dates
function formatDate(dateString, dateOnly = false) {
    const date = new Date(dateString);
    if (dateOnly) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}

// Helper function to get time until
function getTimeUntil(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
}

// Initialize event listeners for new cards
function initAnnouncementEventListeners() {
    // Re-initialize toggle content buttons
    document.querySelectorAll('.toggle-content-btn').forEach(button => {
        if (!button.hasEventListener) {
            button.hasEventListener = true;
            button.addEventListener('click', function() {
                const announcementText = this.closest('.announcement-text');
                const truncated = announcementText.querySelector('.truncated-content');
                const full = announcementText.querySelector('.full-content');

                if (truncated.style.display === 'none') {
                    truncated.style.display = 'block';
                    full.style.display = 'none';
                    this.textContent = 'Show More';
                } else {
                    truncated.style.display = 'none';
                    full.style.display = 'block';
                    this.textContent = 'Show Less';
                }
            });
        }
    });
}

// ------------------------------------- Show More function for Content ------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.toggle-content-btn').forEach(button => {
        button.addEventListener('click', function() {
            const announcementText = this.closest('.announcement-text');
            const truncated = announcementText.querySelector('.truncated-content');
            const full = announcementText.querySelector('.full-content');

            if (truncated.style.display === 'none' || truncated.style.display === '') {
                truncated.style.display = 'block';
                full.style.display = 'none';
                this.textContent = 'Show More';
            } else {
                truncated.style.display = 'none';
                full.style.display = 'block';
                this.textContent = 'Show Less';
            }
        });
    });

    // Initialize infinite scroll
    initInfiniteScroll();
    initAnnouncementEventListeners();
});

// ----------------------------------------- Search and Sorting Function -----------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    window.filterAnnouncements = function() {
        const categoryFilter = document.getElementById('category-filter').value;
        const searchTerm = document.getElementById('feed-search').value.toLowerCase();

        const announcements = document.querySelectorAll('.announcement-card');
        let hasVisibleAnnouncements = false;

        announcements.forEach(announcement => {
            const category = announcement.getAttribute('data-category') || '';
            const textContent = announcement.textContent.toLowerCase();

            const categoryMatch = categoryFilter === 'all' || category === categoryFilter;
            const searchMatch = textContent.includes(searchTerm);

            if (categoryMatch && searchMatch) {
                announcement.style.display = '';
                hasVisibleAnnouncements = true;
            } else {
                announcement.style.display = 'none';
            }
        });

        showEmptyState(!hasVisibleAnnouncements);
    };

    window.sortAnnouncements = function() {
        const sortBy = document.getElementById('sort-by').value;
        const container = document.querySelector('.announcement-feed');

        // Get ALL visible announcement cards
        const visibleAnnouncements = Array.from(document.querySelectorAll('.announcement-card')).filter(ann =>
            ann.style.display !== 'none'
        );

        // Check if there are any visible announcements after sorting
        if (visibleAnnouncements.length === 0) {
            showEmptyState(true);
            return;
        }

        visibleAnnouncements.sort((a, b) => {
            // Get the timestamp from data-date attribute
            const timestampA = parseInt(a.getAttribute('data-date')) || 0;
            const timestampB = parseInt(b.getAttribute('data-date')) || 0;

            if (sortBy === 'newest') {
                return timestampB - timestampA;
            } else if (sortBy === 'oldest') {
                return timestampA - timestampB;
            }
            return 0; // Default order
        });

        // Re-append sorted announcements
        visibleAnnouncements.forEach(ann => container.appendChild(ann));

        // Hide empty state since we have visible announcements
        showEmptyState(false);
    };

    // Search announcements - UPDATED
    window.searchAnnouncements = function() {
        filterAnnouncements();
    };
});

// Function to show/hide empty state
function showEmptyState(showEmpty) {
    const announcementFeed = document.getElementById('announcementFeed');
    let emptyState = announcementFeed.querySelector('.empty-feed');

    if (showEmpty) {
        // Show empty state
        if (!emptyState) {
            // Create empty state if it doesn't exist
            emptyState = document.createElement('div');
            emptyState.className = 'empty-feed';
            emptyState.innerHTML = `
                <div class="empty-icon">
                    <i class="ri-inbox-line"></i>
                </div>
                <h3>No announcements found</h3>
                <p>Try adjusting your search or filter criteria</p>
            `;
            announcementFeed.appendChild(emptyState);
        } else {
            // Show existing empty state
            emptyState.style.display = 'block';
        }
    } else {
        // Hide empty state
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }
}

// Update the loadMoreAnnouncements function to handle filtering for new announcements
async function loadMoreAnnouncements() {
    if (isLoading || !hasMoreAnnouncements) return;

    isLoading = true;

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="loading-spinner"></div><p>Loading more announcements...</p>';
    document.getElementById('announcementFeed').appendChild(loadingIndicator);

    try {
        const response = await fetch(`?get_home_announcements=1&page=${currentHomePage}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success) {
            // Remove loading indicator
            loadingIndicator.remove();

            // Append new announcements
            if (data.announcements && data.announcements.length > 0) {
                data.announcements.forEach(announcement => {
                    const announcementCard = createAnnouncementCard(announcement);
                    document.getElementById('announcementFeed').appendChild(announcementCard);
                });

                // Update pagination state
                hasMoreAnnouncements = data.has_next;
                currentHomePage = data.next_page || currentHomePage + 1;

                // Re-initialize event listeners for new cards
                initAnnouncementEventListeners();

                // Apply current filters to newly loaded announcements
                applyCurrentFilters();
            } else {
                // No more announcements
                showNoMoreAnnouncements();
            }
        } else {
            loadingIndicator.remove();
            console.error('Failed to load more announcements');
        }
    } catch (error) {
        loadingIndicator.remove();
        console.error('Error loading more announcements:', error);
    } finally {
        isLoading = false;
    }
}

// Function to apply current filters to all announcements (including newly loaded ones)
function applyCurrentFilters() {
    const categoryFilter = document.getElementById('category-filter').value;
    const searchTerm = document.getElementById('feed-search').value.toLowerCase();

    const announcements = document.querySelectorAll('.announcement-card');
    let hasVisibleAnnouncements = false;

    announcements.forEach(announcement => {
        const category = announcement.getAttribute('data-category') || '';
        const textContent = announcement.textContent.toLowerCase();

        const categoryMatch = categoryFilter === 'all' || category === categoryFilter;
        const searchMatch = textContent.includes(searchTerm);

        if (categoryMatch && searchMatch) {
            announcement.style.display = '';
            hasVisibleAnnouncements = true;
        } else {
            announcement.style.display = 'none';
        }
    });

    showEmptyState(!hasVisibleAnnouncements);
}

// Also update the DOMContentLoaded event to handle the initial empty state properly
document.addEventListener('DOMContentLoaded', function() {
    // Initialize toggle content buttons
    document.querySelectorAll('.toggle-content-btn').forEach(button => {
        button.addEventListener('click', function() {
            const announcementText = this.closest('.announcement-text');
            const truncated = announcementText.querySelector('.truncated-content');
            const full = announcementText.querySelector('.full-content');

            if (truncated.style.display === 'none' || truncated.style.display === '') {
                truncated.style.display = 'block';
                full.style.display = 'none';
                this.textContent = 'Show More';
            } else {
                truncated.style.display = 'none';
                full.style.display = 'block';
                this.textContent = 'Show Less';
            }
        });
    });

    // Check initial state - if no announcements, show empty state
    const initialAnnouncements = document.querySelectorAll('.announcement-card');
    if (initialAnnouncements.length === 0) {
        showEmptyState(true);
    }

    // Initialize infinite scroll
    initInfiniteScroll();
    initAnnouncementEventListeners();
});


// ------------------------------------------- Image Viewer Function ---------------------------------------------------
// Image Viewer Functions
let currentImageIndex = 0;
let currentImageList = [];

function openImageViewer(clickedElement, clickedIndex, totalImages) {
    // Get all gallery items from the hidden container
    const gallery = clickedElement.closest('.card-gallery');
    const galleryItems = gallery.querySelectorAll('.gallery-full .gallery-item');

    currentImageList = Array.from(galleryItems).map(item => ({
        url: item.getAttribute('data-image-url'),
        caption: item.getAttribute('data-caption') || ''
    }));

    currentImageIndex = Math.min(clickedIndex, currentImageList.length - 1);

    const viewerImage = document.getElementById('viewerImage');
    const viewerCaption = document.getElementById('viewerCaption');
    const imageCounter = document.getElementById('imageCounter');

    viewerImage.src = currentImageList[currentImageIndex].url;
    viewerCaption.textContent = currentImageList[currentImageIndex].caption;
    imageCounter.textContent = `${currentImageIndex + 1} / ${currentImageList.length}`;

    const modal = document.getElementById('imageViewerModal');
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    document.addEventListener('keydown', handleKeyDown);
}

function closeImageViewer() {
    const modal = document.getElementById('imageViewerModal');
    modal.style.display = "none";
    document.body.style.overflow = "auto";
    document.removeEventListener('keydown', handleKeyDown);
}

function navigateImageViewer(direction) {
    const viewerImage = document.getElementById('viewerImage');
    const viewerCaption = document.getElementById('viewerCaption');
    const imageCounter = document.getElementById('imageCounter');

    currentImageIndex = (currentImageIndex + direction + currentImageList.length) % currentImageList.length;

    viewerImage.style.opacity = 0;

    setTimeout(() => {
        viewerImage.src = currentImageList[currentImageIndex].url;
        viewerCaption.textContent = currentImageList[currentImageIndex].caption;
        imageCounter.textContent = `${currentImageIndex + 1} / ${currentImageList.length}`;
        viewerImage.style.opacity = 1;
    }, 200);
}

function handleKeyDown(e) {
    switch(e.key) {
        case 'ArrowLeft':
            navigateImageViewer(-1);
            break;
        case 'ArrowRight':
            navigateImageViewer(1);
            break;
        case 'Escape':
            closeImageViewer();
            break;
    }
}

// Close when clicking outside image
document.getElementById('imageViewerModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeImageViewer();
    }
});

// Emergency Notice Expiry Color Changes
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.emergency-expiry').forEach(element => {
        const text = element.textContent;
        const expiryTime = new Date(element.getAttribute('data-expiry-time'));
        const now = new Date();
        const hoursRemaining = (expiryTime - now) / (1000 * 60 * 60);

        // Set urgency level
        if (hoursRemaining < 0.25) { // < 15 minutes
            element.setAttribute('data-remaining-hours', 'critical');
        } else if (hoursRemaining < 1) { // < 1 hour
            element.setAttribute('data-remaining-hours', 'low');
        } else if (hoursRemaining < 6) { // 1-6 hours
            element.setAttribute('data-remaining-hours', 'medium');
        } else {
            element.setAttribute('data-remaining-hours', 'high');
        }
    });
});