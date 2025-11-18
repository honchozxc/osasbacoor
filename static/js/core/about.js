const objectiveItems = document.querySelectorAll('.osas-objective-item');
objectiveItems.forEach((item, index) => {
    item.setAttribute('data-scroll', 'fadeIn');
    item.setAttribute('data-scroll-delay', `${(index + 1) * 100}`);
});

document.addEventListener('DOMContentLoaded', function() {
    // Scroll-triggered animations
    const scrollElements = document.querySelectorAll('[data-scroll]');

    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };

    const displayScrollElement = (element) => {
        element.classList.add('is-visible');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.25)) {
                displayScrollElement(el);
            }
        });
    };

    // Initialize scroll animations
    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });

    // Run once on load
    handleScrollAnimation();
});