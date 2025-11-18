if (document.getElementById('lightgallery')) {
            lightGallery(document.getElementById('lightgallery'), {
                selector: '.gallery-item',
                download: false,
                counter: false,
                getCaptionFromTitleOrAlt: false
            });
        }