function openLogoutModal() {
    document.getElementById('logoutModal').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeLogoutModal() {
    document.getElementById('logoutModal').classList.remove('active');
    document.body.classList.remove('modal-open');
}

document.getElementById('logoutButton').addEventListener('click', function(e) {
    e.preventDefault();
    const logoutUrl = this.getAttribute('href');

    const btnText = this.querySelector('.btn-text');
    const originalText = btnText.textContent;
    btnText.textContent = 'Logging out...';

    showLogoutToast();

    setTimeout(() => {
        window.location.href = logoutUrl;
    }, 1500);

    return false;
});

function showLogoutToast() {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast logout';
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                <i class='bx bx-log-out'></i>
            </div>
            <div class="toast-message">
                <strong>Session Ending</strong>
                <span>Securely logged out...</span>
            </div>
            <button class="toast-close">
                <i class='bx bx-x'></i>
            </button>
        </div>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        toast.addEventListener('animationend', () => toast.remove());
    });

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 1500);
}