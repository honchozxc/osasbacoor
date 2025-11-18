document.addEventListener('DOMContentLoaded', function() {
    const counters = document.querySelectorAll('.stat-number');
    const duration = 2000;
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const easeOutQuad = t => t * (2 - t); // Easing function

    // Start counting when stats are in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounting();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    // Observe the stats container
    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
        observer.observe(statsContainer);
    }

    function startCounting() {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-count');
            const start = 0;
            let frame = 0;

            // Add animate class to trigger initial animation
            counter.classList.add('animate');

            const counterInterval = setInterval(() => {
                frame++;

                // Calculate progress
                const progress = easeOutQuad(frame / totalFrames);
                const current = Math.round(target * progress);

                // Update display
                counter.textContent = current.toLocaleString();

                // End animation
                if (frame === totalFrames) {
                    clearInterval(counterInterval);
                    counter.classList.add('complete');

                    // Add slight bounce effect
                    counter.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        counter.style.transform = 'scale(1)';
                        counter.style.transition = 'transform 0.3s ease-out';
                    }, 50);
                }
            }, frameDuration);
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize image gallery modal
    initImageGallery();

    // Add social sharing functionality
    setupSocialSharing();

    // Track announcement views
    trackAnnouncementView();
});

function initImageGallery() {
    // Get all gallery images
    const galleryImages = document.querySelectorAll('.gallery-item img');

    if (galleryImages.length > 0) {
        // Create modal elements
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <span class="close">&times;</span>
            <div class="modal-content">
                <img class="modal-image" src="" alt="">
                <div class="caption"></div>
            </div>
        `;
        document.body.appendChild(modal);

        const modalImg = modal.querySelector('.modal-image');
        const captionText = modal.querySelector('.caption');
        const closeBtn = modal.querySelector('.close');

        // Add click events to gallery images
        galleryImages.forEach(img => {
            img.addEventListener('click', function() {
                modal.style.display = 'block';
                modalImg.src = this.src;
                captionText.textContent = this.nextElementSibling?.textContent || '';
            });
        });

        // Close modal when clicking X
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });

        // Close modal when clicking outside image
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

function setupSocialSharing() {
    // Facebook share
    const facebookBtn = document.querySelector('.share-button.facebook');
    if (facebookBtn) {
        facebookBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, 'facebook-share-dialog', 'width=800,height=600');
        });
    }

    // Twitter share
    const twitterBtn = document.querySelector('.share-button.twitter');
    if (twitterBtn) {
        twitterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(document.title);
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, 'twitter-share-dialog', 'width=800,height=600');
        });
    }

    // Email share
    const emailBtn = document.querySelector('.share-button.email');
    if (emailBtn) {
        emailBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = encodeURIComponent(window.location.href);
            const subject = encodeURIComponent(`Check out this announcement: ${document.title}`);
            const body = encodeURIComponent(`I thought you might be interested in this announcement:\n\n${document.title}\n${url}`);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        });
    }
}

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Add this to your home.js file
document.addEventListener('DOMContentLoaded', function() {
    // Initial fade-in for all content
    const fadeElements = document.querySelectorAll('.home-container > *');
    fadeElements.forEach((el, index) => {
        el.classList.add('fade-in');
        if (index > 0) {
            el.classList.add(`delay-${index % 4 + 1}`);
        }
    });

    // Scroll-triggered animations
    const scrollElements = document.querySelectorAll('[data-scroll]');

    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };

    const elementOutofView = (el) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop > (window.innerHeight || document.documentElement.clientHeight)
        );
    };

    const displayScrollElement = (element) => {
        element.classList.add('is-visible');
    };

    const hideScrollElement = (element) => {
        element.classList.remove('is-visible');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.25)) {
                displayScrollElement(el);
            } else if (elementOutofView(el)) {
                hideScrollElement(el);
            }
        });
    };

    // Initialize scroll animations
    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });

    // Run once on load
    handleScrollAnimation();

    // Count-up animation (your existing code)
    const counters = document.querySelectorAll('.stat-number');
    const duration = 2000;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const easeOutQuad = t => t * (2 - t);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounting();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
        observer.observe(statsContainer);
    }

    function startCounting() {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-count');
            const start = 0;
            let frame = 0;

            counter.classList.add('animate');

            const counterInterval = setInterval(() => {
                frame++;
                const progress = easeOutQuad(frame / totalFrames);
                const current = Math.round(target * progress);
                counter.textContent = current.toLocaleString();

                if (frame === totalFrames) {
                    clearInterval(counterInterval);
                    counter.classList.add('complete');
                    counter.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        counter.style.transform = 'scale(1)';
                        counter.style.transition = 'transform 0.3s ease-out';
                    }, 50);
                }
            }, frameDuration);
        });
    }
});