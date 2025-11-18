// Scroll Animation Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.75 &&
            rect.bottom >= 0
        );
    }

    // Function to handle scroll animations
    function handleScrollAnimations() {
        const elements = document.querySelectorAll('[data-nstp-scroll]');

        elements.forEach(element => {
            if (isInViewport(element)) {
                element.classList.add('visible');
            }
        });
    }

    // Initialize - run once on page load
    handleScrollAnimations();

    // Add scroll event listener
    window.addEventListener('scroll', handleScrollAnimations);

    // FAQ Toggle Functionality - FIXED VERSION
    function initializeFAQ() {
        const faqItems = document.querySelectorAll('.nstp-faq-item');

        faqItems.forEach(item => {
            const question = item.querySelector('.nstp-faq-question');

            // Remove any existing event listeners to prevent duplicates
            const newQuestion = question.cloneNode(true);
            question.parentNode.replaceChild(newQuestion, question);

            // Add click event to the new question element
            newQuestion.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const isActive = item.classList.contains('active');

                // Close all FAQ items first
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });

                // If the clicked item wasn't active, open it
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }

    // Initialize FAQ functionality
    initializeFAQ();

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });

    const existingFAQHandler = document.querySelector('script');
    if (existingFAQHandler && existingFAQHandler.innerHTML.includes('faqItems')) {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.innerHTML.includes('faqItems.forEach') && script !== document.currentScript) {
                script.innerHTML = script.innerHTML.replace(/faqItems\.forEach.*?\{.*?\}/gs, '');
            }
        });
    }
});