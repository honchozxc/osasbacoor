class AnnouncementImageViewer {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.isOpen = false;

        this.initializeViewer();
        this.bindEvents();
    }

    initializeViewer() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        this.images = Array.from(galleryItems).map(item => ({
            src: item.dataset.src,
            caption: item.dataset.caption || '',
            element: item
        }));

        this.createThumbnails();
    }

    createThumbnails() {
        const thumbnailsContainer = document.getElementById('viewer-thumbnails');
        thumbnailsContainer.innerHTML = '';

        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail-item';
            thumbnail.innerHTML = `<img src="${image.src}" alt="Thumbnail ${index + 1}">`;
            thumbnail.addEventListener('click', () => this.showImage(index));

            thumbnailsContainer.appendChild(thumbnail);
        });
    }

    bindEvents() {
        document.querySelectorAll('.gallery-item').forEach((item, index) => {
            item.addEventListener('click', () => this.openViewer(index));
        });

        document.getElementById('viewer-close').addEventListener('click', () => this.closeViewer());
        document.getElementById('viewer-prev').addEventListener('click', () => this.previousImage());
        document.getElementById('viewer-next').addEventListener('click', () => this.nextImage());

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        document.getElementById('image-viewer').addEventListener('click', (e) => {
            if (e.target.id === 'image-viewer') {
                this.closeViewer();
            }
        });

        this.setupSwipe();
    }

    openViewer(index) {
        this.currentIndex = index;
        this.isOpen = true;

        const viewer = document.getElementById('image-viewer');
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden';

        this.showImage(index);
    }

    closeViewer() {
        this.isOpen = false;

        const viewer = document.getElementById('image-viewer');
        viewer.classList.remove('active');
        document.body.style.overflow = '';
    }

    showImage(index) {
        if (index < 0 || index >= this.images.length) return;

        this.currentIndex = index;
        const image = this.images[index];

        const viewerImage = document.getElementById('viewer-image');
        viewerImage.src = image.src;
        viewerImage.alt = image.caption;

        const captionElement = document.getElementById('viewer-caption');
        captionElement.textContent = image.caption;

        const counterElement = document.getElementById('viewer-counter');
        counterElement.textContent = `${index + 1} / ${this.images.length}`;

        this.updateThumbnails();
        this.updateNavigation();
    }

    updateThumbnails() {
        const thumbnails = document.querySelectorAll('.thumbnail-item');
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentIndex);
        });
    }

    updateNavigation() {
        const prevBtn = document.getElementById('viewer-prev');
        const nextBtn = document.getElementById('viewer-next');

        prevBtn.disabled = this.currentIndex === 0;
        nextBtn.disabled = this.currentIndex === this.images.length - 1;
    }

    nextImage() {
        if (this.currentIndex < this.images.length - 1) {
            this.showImage(this.currentIndex + 1);
        }
    }

    previousImage() {
        if (this.currentIndex > 0) {
            this.showImage(this.currentIndex - 1);
        }
    }

    handleKeyboard(e) {
        if (!this.isOpen) return;

        switch(e.key) {
            case 'Escape':
                this.closeViewer();
                break;
            case 'ArrowLeft':
                this.previousImage();
                break;
            case 'ArrowRight':
                this.nextImage();
                break;
        }
    }

    setupSwipe() {
        let startX = 0;
        let endX = 0;

        const viewer = document.getElementById('image-viewer');

        viewer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        viewer.addEventListener('touchmove', (e) => {
            endX = e.touches[0].clientX;
        });

        viewer.addEventListener('touchend', () => {
            const diff = startX - endX;
            const minSwipe = 50;

            if (Math.abs(diff) > minSwipe) {
                if (diff > 0) {
                    this.nextImage();
                } else {
                    this.previousImage();
                }
            }
        });
    }
}

// Handle gallery items display for 2x2 grid
function handleGalleryItems() {
    const galleryContainer = document.getElementById('announcement-gallery');
    if (!galleryContainer) return;

    const galleryItems = galleryContainer.querySelectorAll('.gallery-item');
    const totalImages = galleryItems.length;

    // Remove all existing overlays first
    galleryItems.forEach(item => {
        const existingOverlay = item.querySelector('.image-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    });

    // Add appropriate overlays based on screen size and image count
    if (totalImages > 1) {
        if (window.innerWidth <= 768) {
            // Mobile: Show overlay on first image
            if (galleryItems[0]) {
                const overlay = document.createElement('div');
                overlay.className = 'image-overlay mobile-overlay';
                overlay.innerHTML = `<span class="remaining-count">+${totalImages - 1}</span>`;
                galleryItems[0].appendChild(overlay);
            }
        } else {
            // Desktop: Show overlay on 4th image if more than 4 images
            if (totalImages > 4 && galleryItems[3]) {
                const overlay = document.createElement('div');
                overlay.className = 'image-overlay desktop-overlay';
                overlay.innerHTML = `<span class="remaining-count">+${totalImages - 4}</span>`;
                galleryItems[3].appendChild(overlay);
            }
        }
    }

    // Handle hidden items for desktop
    galleryItems.forEach((item, index) => {
        if (window.innerWidth > 768) {
            // Desktop: Show first 4, hide rest
            if (index >= 4) {
                item.classList.add('hidden-item');
            } else {
                item.classList.remove('hidden-item');
            }
        } else {
            // Mobile: Show only first, hide rest
            if (index > 0) {
                item.classList.add('hidden-item');
            } else {
                item.classList.remove('hidden-item');
            }
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.gallery-item')) {
        new AnnouncementImageViewer();
    }

    handleGalleryItems();

    // Update on window resize
    window.addEventListener('resize', handleGalleryItems);

    function preloadImages() {
        const images = document.querySelectorAll('.gallery-item img');
        images.forEach(img => {
            const preload = new Image();
            preload.src = img.src;
        });
    }

    preloadImages();
});

document.addEventListener('DOMContentLoaded', function() {
    const relatedCards = document.querySelectorAll('.related-card');

    relatedCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }

            const readMoreLink = this.querySelector('.read-more');
            if (readMoreLink && readMoreLink.href) {
                window.location.href = readMoreLink.href;
            }
        });

        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});