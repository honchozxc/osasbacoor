document.addEventListener('DOMContentLoaded', function() {
    const serviceCards = document.querySelectorAll('.clinic-service-card');
    serviceCards.forEach(card => {
        const delay = card.getAttribute('data-delay');
        card.style.animation = `clinic-fadeInUp 0.8s ease ${delay}s forwards`;
    });

    const galleryItems = document.querySelectorAll('.clinic-gallery-item');
    galleryItems.forEach(item => {
        const delay = item.getAttribute('data-delay');
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        }, delay * 1000);
    });

    const faqItems = document.querySelectorAll('.clinic-faq-item');
    faqItems.forEach(item => {
        const delay = item.getAttribute('data-delay');
        item.style.animation = `clinic-fadeInUp 0.8s ease ${delay}s forwards`;
    });

    const faqQuestions = document.querySelectorAll('.clinic-faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            item.classList.toggle('active');
        });
    });

    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');

    let currentImageIndex = 0;
    let galleryImages = [];

    function initializeGallery() {
        galleryImages = Array.from(document.querySelectorAll('.gallery-image'));
    }

    function openLightbox(index) {
        currentImageIndex = index;
        const image = galleryImages[currentImageIndex];
        lightboxImage.src = image.getAttribute('data-image');
        lightboxCaption.textContent = image.getAttribute('data-alt');
        lightbox.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Close lightbox
    function closeLightbox() {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Navigate to next image
    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        const image = galleryImages[currentImageIndex];
        lightboxImage.src = image.getAttribute('data-image');
        lightboxCaption.textContent = image.getAttribute('data-alt');
    }

    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        const image = galleryImages[currentImageIndex];
        lightboxImage.src = image.getAttribute('data-image');
        lightboxCaption.textContent = image.getAttribute('data-alt');
    }

    function addGalleryClickEvents() {
        galleryImages.forEach((image, index) => {
            image.parentElement.addEventListener('click', (e) => {
                e.preventDefault();
                openLightbox(index);
            });
        });
    }

    // Keyboard navigation
    function handleKeydown(e) {
        if (lightbox.style.display === 'block') {
            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowRight':
                    nextImage();
                    break;
                case 'ArrowLeft':
                    prevImage();
                    break;
            }
        }
    }

    initializeGallery();
    addGalleryClickEvents();

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', nextImage);
    lightboxPrev.addEventListener('click', prevImage);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', handleKeydown);

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.clinic-service-card, .clinic-gallery-item, .clinic-faq-item');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
});