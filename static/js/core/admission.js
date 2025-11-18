document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initAnimations();

    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            // Remove active class from all buttons and tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

            // Add active class to clicked button and corresponding tab
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });

    // Create floating shapes
    createFloatingShapes();

    // Initialize scroll animations
    initScrollAnimations();
});

function initAnimations() {
    // Animate hero elements
    const heroTitle = document.querySelector('.hero-content .university-name');
    const heroUnderline = document.querySelector('.hero-content .title-underline');
    const heroTagline = document.querySelector('.hero-content .tagline');
    const heroButton = document.querySelector('.hero-content .cta-button');

    if (heroTitle) heroTitle.classList.add('animate__animated', 'animate__fadeInDown');
    if (heroUnderline) heroUnderline.classList.add('animate__animated', 'animate__fadeInLeft');
    if (heroTagline) heroTagline.classList.add('animate__animated', 'animate__fadeIn', 'animate__delay-1s');
    if (heroButton) heroButton.classList.add('animate__animated', 'animate__fadeInUp', 'animate__delay-1s');
}

function createFloatingShapes() {
    const container = document.querySelector('.floating-shapes');
    if (!container) return;

    const shapes = ['circle', 'triangle', 'square'];
    const colors = ['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.08)', 'rgba(255, 215, 0, 0.05)'];

    // Clear existing shapes
    container.innerHTML = '';

    for (let i = 0; i < 12; i++) {
        const shape = document.createElement('div');
        shape.classList.add('shape');

        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        shape.classList.add(randomShape);

        shape.style.left = `${Math.random() * 100}%`;
        shape.style.top = `${Math.random() * 100}%`;
        shape.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        const size = Math.random() * 100 + 50;
        if (randomShape === 'circle') {
            shape.style.width = `${size}px`;
            shape.style.height = `${size}px`;
        } else if (randomShape === 'square') {
            shape.style.width = `${size}px`;
            shape.style.height = `${size}px`;
        } else if (randomShape === 'triangle') {
            shape.style.borderLeft = `${size/2}px solid transparent`;
            shape.style.borderRight = `${size/2}px solid transparent`;
            shape.style.borderBottom = `${size}px solid ${colors[Math.floor(Math.random() * colors.length)]}`;
        }

        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        shape.style.animation = `float ${duration}s infinite ease-in-out ${delay}s`;

        container.appendChild(shape);
    }
}

function initScrollAnimations() {
    const animateElements = document.querySelectorAll('.animate-on-scroll');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');

                // Add special animation for timeline items
                if (entry.target.classList.contains('timeline-item')) {
                    entry.target.querySelector('.timeline-content').classList.add('animated');
                }
            }
        });
    }, observerOptions);

    animateElements.forEach(element => {
        observer.observe(element);
    });

    // Animate stats when they come into view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) statsObserver.observe(statsSection);
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach((stat, index) => {
        const target = parseInt(stat.getAttribute('data-target'));
        const suffix = stat.textContent.includes('%') ? '%' : '';
        let start = 0;
        const duration = 2000;
        const startTime = performance.now();

        // Add delay based on index for staggered animation
        setTimeout(() => {
            stat.classList.add('animate');

            function updateNumber(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const value = Math.floor(progress * target);

                stat.textContent = value + suffix;

                if (progress < 1) {
                    requestAnimationFrame(updateNumber);
                } else {
                    stat.classList.add('complete');
                    stat.classList.remove('animate');
                }
            }

            requestAnimationFrame(updateNumber);
        }, index * 200);
    });
}