document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchToTab(tabName) {
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        const selectedTabContent = document.getElementById(`${tabName}-tab`);
        if (selectedTabContent) {
            selectedTabContent.classList.add('active');
        }

        const selectedTabButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
        if (selectedTabButton) {
            selectedTabButton.classList.add('active');
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchToTab(tabName);
        });
    });

    function initializeTabs() {
        const hasActiveTab = document.querySelector('.tab-button.active') !== null;
        if (!hasActiveTab && tabButtons.length > 0) {
            const firstTabName = tabButtons[0].getAttribute('data-tab');
            switchToTab(firstTabName);
        }
    }

    initializeTabs();

// ----------------------------------------------- Users Tab Functionality ---------------------------------------------
    const userSearchInput = document.getElementById('user-search-archived');
    const userUnitSort = document.getElementById('archived-unit-sort');
    const userDateSort = document.getElementById('archived-status-sort');

    if (userSearchInput && userUnitSort && userDateSort) {
        userSearchInput.addEventListener('input', filterUsers);
        userUnitSort.addEventListener('change', filterUsers);
        userDateSort.addEventListener('change', filterUsers);

        function filterUsers() {
            const searchTerm = userSearchInput.value.toLowerCase();
            const unitFilter = userUnitSort.value;
            const dateFilter = userDateSort.value;

            const rows = Array.from(document.querySelectorAll('#users-tab .archived-table tbody tr'));

            rows.forEach(row => {
                const name = row.querySelector('.user-name').textContent.toLowerCase();
                const username = row.querySelector('.user-username').textContent.toLowerCase();
                const userType = row.querySelector('td:nth-child(2)').textContent;
                const archivedDateText = row.querySelector('td:nth-child(3)').textContent;
                const archivedDate = parseDate(archivedDateText);

                const matchesSearch = searchTerm === '' ||
                    name.includes(searchTerm) ||
                    username.includes(searchTerm);

                const matchesUnit = unitFilter === '' || userType === unitFilter;

                let matchesDate = true;
                if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                    const now = new Date();

                    switch(dateFilter) {
                        case 'week':
                            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            matchesDate = archivedDate >= oneWeekAgo;
                            break;
                        case 'month':
                            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                            matchesDate = archivedDate >= oneMonthAgo;
                            break;
                        case 'year':
                            matchesDate = archivedDate.getFullYear() === now.getFullYear();
                            break;
                        case 'last_year':
                            matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                            break;
                        default:
                            if (!isNaN(dateFilter)) {
                                matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                            }
                    }
                }

                row.style.display = (matchesSearch && matchesUnit && matchesDate) ? '' : 'none';
            });

            // Then sort if needed
            if (dateFilter === 'newest' || dateFilter === 'oldest') {
                const tbody = document.querySelector('#users-tab .archived-table tbody');
                const visibleRows = rows.filter(row => row.style.display !== 'none');

                visibleRows.sort((a, b) => {
                    const dateA = parseDate(a.querySelector('td:nth-child(3)').textContent);
                    const dateB = parseDate(b.querySelector('td:nth-child(3)').textContent);
                    return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
                });

                // Reattach sorted rows
                visibleRows.forEach(row => tbody.appendChild(row));
            }
        }

        function parseDate(dateString) {
            const months = {
                Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
                Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
            };

            const parts = dateString.split(' ');
            const month = months[parts[0]];
            const day = parseInt(parts[1].replace(',', ''));
            const year = parseInt(parts[2]);
            const timeParts = parts[3].split(':');
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);

            return new Date(year, month, day, hours, minutes);
        }
    }

// ---------------------------------------- Announcements Tab Functionality --------------------------------------------
const announcementSearchInput = document.getElementById('announcements-search-archived');
const announcementCategoryFilter = document.getElementById('ArchivedcategoryFilter');
const announcementDateFilter = document.getElementById('ArchiveddateFilter');

if (announcementSearchInput && announcementCategoryFilter && announcementDateFilter) {
    announcementSearchInput.addEventListener('input', filterAnnouncements);
    announcementCategoryFilter.addEventListener('change', filterAnnouncements);
    announcementDateFilter.addEventListener('change', filterAnnouncements);

    function filterAnnouncements() {
        const searchTerm = announcementSearchInput.value.toLowerCase();
        const categoryFilter = announcementCategoryFilter.value;
        const dateFilter = announcementDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#announcements-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const title = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const category = row.querySelector('td:nth-child(2)').textContent;
            const archivedDateText = row.querySelector('td:nth-child(4)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' || title.includes(searchTerm);

            const matchesCategory = categoryFilter === 'all' || category === categoryFilter;

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'this_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            // Show/hide row based on all filters
            row.style.display = (matchesSearch && matchesCategory && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#announcements-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(4)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(4)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }
}

// ----------------------------------------- Downloadables Tab Functionality -------------------------------------------
const downloadableSearchInput = document.getElementById('downloadables-search-archived');
const downloadableCategoryFilter = document.getElementById('ArchiveddownloadableCategoryFilter');
const downloadableDateFilter = document.getElementById('ArchiveddownloadableDateFilter');

if (downloadableSearchInput && downloadableCategoryFilter && downloadableDateFilter) {
    downloadableSearchInput.addEventListener('input', filterDownloadables);
    downloadableCategoryFilter.addEventListener('change', filterDownloadables);
    downloadableDateFilter.addEventListener('change', filterDownloadables);

    function filterDownloadables() {
        const searchTerm = downloadableSearchInput.value.toLowerCase();
        const categoryFilter = downloadableCategoryFilter.value;
        const dateFilter = downloadableDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#downloadables-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const title = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const category = row.querySelector('td:nth-child(2)').textContent;
            const archivedDateText = row.querySelector('td:nth-child(4)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' || title.includes(searchTerm);

            const matchesCategory = categoryFilter === 'all' ||
                (categoryFilter === 'osas_forms' && category === 'OSAS Forms') ||
                (categoryFilter === 'society_forms' && category === 'Society Forms') ||
                (categoryFilter === 'guidelines' && category === 'Guidelines') ||
                (categoryFilter === 'manuals' && category === 'Manuals') ||
                (categoryFilter === 'others' && category === 'Others');

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'this_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            // Show/hide row based on all filters
            row.style.display = (matchesSearch && matchesCategory && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#downloadables-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(4)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(4)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
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
});

// ----------------------------------------------- Complaints Tab Functionality ----------------------------------------
const complaintSearchInput = document.getElementById('complaints-search-archived');
const complaintStatusFilter = document.getElementById('ArchivedcomplaintStatusFilter');
const complaintDateFilter = document.getElementById('ArchivedcomplaintDateFilter');

if (complaintSearchInput && complaintStatusFilter && complaintDateFilter) {
    complaintSearchInput.addEventListener('input', filterComplaints);
    complaintStatusFilter.addEventListener('change', filterComplaints);
    complaintDateFilter.addEventListener('change', filterComplaints);

    function filterComplaints() {
        const searchTerm = complaintSearchInput.value.toLowerCase();
        const statusFilter = complaintStatusFilter.value;
        const dateFilter = complaintDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#complaints-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const reference = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const title = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const complainant = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const status = row.querySelector('td:nth-child(4) span').textContent.toLowerCase();
            const archivedDateText = row.querySelector('td:nth-child(5)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' ||
                reference.includes(searchTerm) ||
                title.includes(searchTerm) ||
                complainant.includes(searchTerm);

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'under_review' && status.includes('under review')) ||
                (statusFilter === 'resolved' && status.includes('resolved'));

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'this_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            row.style.display = (matchesSearch && matchesStatus && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#complaints-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(5)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(5)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }

    function parseDate(dateString) {
        const months = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };

        const parts = dateString.split(' ');
        const month = months[parts[0]];
        const day = parseInt(parts[1].replace(',', ''));
        const year = parseInt(parts[2]);
        const timeParts = parts[3].split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);

        return new Date(year, month, day, hours, minutes);
    }
}

// ------------------------------------------- Scholarship Tab Functionality -------------------------------------------
const scholarshipSearchInput = document.getElementById('scholarships-search-archived');
const scholarshipTypeFilter = document.getElementById('ArchivedscholarshipTypeFilter');
const scholarshipDateFilter = document.getElementById('ArchivedscholarshipDateFilter');

if (scholarshipSearchInput && scholarshipTypeFilter && scholarshipDateFilter) {
    scholarshipSearchInput.addEventListener('input', filterScholarships);
    scholarshipTypeFilter.addEventListener('change', filterScholarships);
    scholarshipDateFilter.addEventListener('change', filterScholarships);

    function filterScholarships() {
        const searchTerm = scholarshipSearchInput.value.toLowerCase();
        const typeFilter = scholarshipTypeFilter.value;
        const dateFilter = scholarshipDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#scholarships-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const name = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const type = row.querySelector('td:nth-child(2) span').textContent;
            const archivedDateText = row.querySelector('td:nth-child(5)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' || name.includes(searchTerm);

            const matchesType = typeFilter === 'all' ||
                (typeFilter === 'public' && type.includes('Public')) ||
                (typeFilter === 'private' && type.includes('Private'));

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'this_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            row.style.display = (matchesSearch && matchesType && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#scholarships-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(5)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(5)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }
}

// -------------------------------- Scholarship Applications Tab Functionality -----------------------------------------
const scholarshipApplicationSearchInput = document.getElementById('scholarship-applications-search-archived');
const scholarshipApplicationStatusFilter = document.getElementById('ArchivedscholarshipApplicationStatusFilter');
const scholarshipApplicationDateFilter = document.getElementById('ArchivedscholarshipApplicationDateFilter');

if (scholarshipApplicationSearchInput && scholarshipApplicationStatusFilter && scholarshipApplicationDateFilter) {
    scholarshipApplicationSearchInput.addEventListener('input', filterScholarshipApplications);
    scholarshipApplicationStatusFilter.addEventListener('change', filterScholarshipApplications);
    scholarshipApplicationDateFilter.addEventListener('change', filterScholarshipApplications);

    function filterScholarshipApplications() {
        const searchTerm = scholarshipApplicationSearchInput.value.toLowerCase();
        const statusFilter = scholarshipApplicationStatusFilter.value;
        const dateFilter = scholarshipApplicationDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#scholarship-applications-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const studentName = row.querySelector('.user-name').textContent.toLowerCase();
            const studentNumber = row.querySelector('.user-username').textContent.toLowerCase();
            const scholarshipName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const status = row.querySelector('td:nth-child(3) span').textContent.toLowerCase();
            const applicationDateText = row.querySelector('td:nth-child(4)').textContent;
            const applicationDate = parseDate(applicationDateText);
            const archivedDateText = row.querySelector('td:nth-child(5)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' ||
                studentName.includes(searchTerm) ||
                studentNumber.includes(searchTerm) ||
                scholarshipName.includes(searchTerm);

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'pending' && status.includes('pending')) ||
                (statusFilter === 'under_review' && status.includes('under review')) ||
                (statusFilter === 'approved' && status.includes('approved')) ||
                (statusFilter === 'rejected' && status.includes('rejected')) ||
                (statusFilter === 'waitlisted' && status.includes('waitlisted'));

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            row.style.display = (matchesSearch && matchesStatus && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#scholarship-applications-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(5)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(5)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }
}

// ----------------------------------------------- Admission Functionality ---------------------------------------------
const admissionSearchInput = document.getElementById('admissions-search-archived');
const admissionStatusFilter = document.getElementById('ArchivedadmissionStatusFilter');
const admissionTypeFilter = document.getElementById('ArchivedadmissionTypeFilter');
const admissionDateFilter = document.getElementById('ArchivedadmissionDateFilter');

if (admissionSearchInput && admissionStatusFilter && admissionTypeFilter && admissionDateFilter) {
    admissionSearchInput.addEventListener('input', filterAdmissions);
    admissionStatusFilter.addEventListener('change', filterAdmissions);
    admissionTypeFilter.addEventListener('change', filterAdmissions);
    admissionDateFilter.addEventListener('change', filterAdmissions);

    function filterAdmissions() {
        const searchTerm = admissionSearchInput.value.toLowerCase();
        const statusFilter = admissionStatusFilter.value;
        const typeFilter = admissionTypeFilter.value;
        const dateFilter = admissionDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#admissions-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const controlNo = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const studentType = row.querySelector('td:nth-child(2) span').textContent.toLowerCase();
            const course = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const status = row.querySelector('td:nth-child(4) span').textContent.toLowerCase();
            const archivedDateText = row.querySelector('td:nth-child(6)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' ||
                controlNo.includes(searchTerm) ||
                studentType.includes(searchTerm) ||
                course.includes(searchTerm);

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'pending' && status.includes('pending')) ||
                (statusFilter === 'incomplete' && status.includes('incomplete')) ||
                (statusFilter === 'complete' && status.includes('complete')) ||
                (statusFilter === 'verified' && status.includes('verified'));

            const matchesType = typeFilter === 'all' ||
                (typeFilter === 'current_grade12' && studentType.includes('current grade 12')) ||
                (typeFilter === 'shs_graduate' && studentType.includes('shs graduate')) ||
                (typeFilter === 'transferee' && studentType.includes('transferee'));

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            row.style.display = (matchesSearch && matchesStatus && matchesType && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#admissions-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(6)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(6)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }
}

// -------------------------------------------------- NSTP Student Tab -------------------------------------------------
const nstpStudentSearchInput = document.getElementById('nstp-students-search-archived');
const nstpStatusFilter = document.getElementById('ArchivednstpStatusFilter');
const nstpSemesterFilter = document.getElementById('ArchivednstpSemesterFilter');
const nstpDateFilter = document.getElementById('ArchivednstpDateFilter');

if (nstpStudentSearchInput && nstpStatusFilter && nstpSemesterFilter && nstpDateFilter) {
    nstpStudentSearchInput.addEventListener('input', filterNstpStudents);
    nstpStatusFilter.addEventListener('change', filterNstpStudents);
    nstpSemesterFilter.addEventListener('change', filterNstpStudents);
    nstpDateFilter.addEventListener('change', filterNstpStudents);

    function filterNstpStudents() {
        const searchTerm = nstpStudentSearchInput.value.toLowerCase();
        const statusFilter = nstpStatusFilter.value;
        const semesterFilter = nstpSemesterFilter.value;
        const dateFilter = nstpDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#nstp-students-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const name = row.querySelector('.user-name').textContent.toLowerCase();
            const email = row.querySelector('.user-username').textContent.toLowerCase();
            const studentNumber = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const program = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const semester = row.querySelector('td:nth-child(4)').textContent.trim();
            const academicYear = row.querySelector('td:nth-child(5)').textContent;
            const status = row.querySelector('td:nth-child(6) span').textContent.toLowerCase();
            const archivedDateText = row.querySelector('td:nth-child(7)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' ||
                name.includes(searchTerm) ||
                email.includes(searchTerm) ||
                studentNumber.includes(searchTerm) ||
                program.includes(searchTerm) ||
                academicYear.includes(searchTerm);

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'pending' && status.includes('pending')) ||
                (statusFilter === 'approved' && status.includes('approved')) ||
                (statusFilter === 'rejected' && status.includes('rejected'));

            const matchesSemester = semesterFilter === 'all' ||
                (semesterFilter === '1st Sem' && semester.includes('First Semester')) ||
                (semesterFilter === '2nd Sem' && semester.includes('Second Semester'));

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            row.style.display = (matchesSearch && matchesStatus && matchesSemester && matchesDate) ? '' : 'none';
        });

        // Sort the visible rows based on the selected option
        const tbody = document.querySelector('#nstp-students-tab .archived-table tbody');
        const visibleRows = rows.filter(row => row.style.display !== 'none');

        if (visibleRows.length > 0) {
            visibleRows.sort((a, b) => {
                // Handle date sorting
                if (dateFilter === 'newest' || dateFilter === 'oldest') {
                    const dateA = parseDate(a.querySelector('td:nth-child(7)').textContent);
                    const dateB = parseDate(b.querySelector('td:nth-child(7)').textContent);
                    return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
                }
                else if (semesterFilter === 'all') {
                    const semesterA = a.querySelector('td:nth-child(4)').textContent.trim();
                    const semesterB = b.querySelector('td:nth-child(4)').textContent.trim();

                    if (semesterA !== semesterB) {
                        return semesterA.includes('First') ? -1 : 1;
                    }

                    const nameA = a.querySelector('.user-name').textContent.toLowerCase();
                    const nameB = b.querySelector('.user-name').textContent.toLowerCase();
                    return nameA.localeCompare(nameB);
                }
                // Default: no sorting
                return 0;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }

    // Helper function to parse date from text
    function parseDate(dateText) {
        const months = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };

        const parts = dateText.split(/[\s,]+/);
        if (parts.length >= 4) {
            const month = months[parts[0]];
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            return new Date(year, month, day);
        }
        return new Date(0);
    }
}


// ------------------------------------------- NSTP Files Tab Functionality --------------------------------------------
const nstpFileSearchInput = document.getElementById('nstp-files-search-archived');
const nstpFileCategoryFilter = document.getElementById('ArchivednstpFileCategoryFilter');
const nstpFileSemesterFilter = document.getElementById('ArchivednstpFileSemesterFilter');
const nstpFileDateFilter = document.getElementById('ArchivednstpFileDateFilter');

if (nstpFileSearchInput && nstpFileCategoryFilter && nstpFileSemesterFilter && nstpFileDateFilter) {
    nstpFileSearchInput.addEventListener('input', filterNstpFiles);
    nstpFileCategoryFilter.addEventListener('change', filterNstpFiles);
    nstpFileSemesterFilter.addEventListener('change', filterNstpFiles);
    nstpFileDateFilter.addEventListener('change', filterNstpFiles);

    function filterNstpFiles() {
        const searchTerm = nstpFileSearchInput.value.toLowerCase();
        const categoryFilter = nstpFileCategoryFilter.value;
        const semesterFilter = nstpFileSemesterFilter.value;
        const dateFilter = nstpFileDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#nstp-files-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const title = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const category = row.querySelector('td:nth-child(2) span').textContent;
            const semester = row.querySelector('td:nth-child(3)').textContent.trim();
            const schoolYear = row.querySelector('td:nth-child(4)').textContent;
            const archivedDateText = row.querySelector('td:nth-child(6)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' || title.includes(searchTerm) || schoolYear.includes(searchTerm);

            const matchesCategory = categoryFilter === 'all' ||
                (category === 'Accomplishment Reports' && categoryFilter === 'accomplishment_reports') ||
                (category === 'Communication Letters' && categoryFilter === 'communication_letters') ||
                (category === 'Financial Plan' && categoryFilter === 'financial_plan') ||
                (category === 'Letters' && categoryFilter === 'letters') ||
                (category === 'MOA' && categoryFilter === 'moa') ||
                (category === 'NSTP Files' && categoryFilter === 'nstp_files') ||
                (category === 'Recommendation' && categoryFilter === 'recommendation') ||
                (category === 'Schedule' && categoryFilter === 'schedule');

            const matchesSemester = semesterFilter === 'all' ||
                (semester === '1st Semester' && semesterFilter === '1st_semester') ||
                (semester === '2nd Semester' && semesterFilter === '2nd_semester');

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            row.style.display = (matchesSearch && matchesCategory && matchesSemester && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#nstp-files-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(6)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(6)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }
}

// -------------------------------------------- OJT Companies Tab Functionality -----------------------------------------
const ojtCompanySearchInput = document.getElementById('ojt-companies-search-archived');
const ojtCompanyStatusFilter = document.getElementById('ArchivedojtCompanyStatusFilter');
const ojtCompanyDateFilter = document.getElementById('ArchivedojtCompanyDateFilter');

if (ojtCompanySearchInput && ojtCompanyStatusFilter && ojtCompanyDateFilter) {
    ojtCompanySearchInput.addEventListener('input', filterOjtCompanies);
    ojtCompanyStatusFilter.addEventListener('change', filterOjtCompanies);
    ojtCompanyDateFilter.addEventListener('change', filterOjtCompanies);

    function filterOjtCompanies() {
        const searchTerm = ojtCompanySearchInput.value.toLowerCase();
        const statusFilter = ojtCompanyStatusFilter.value;
        const dateFilter = ojtCompanyDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#ojt-companies-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const name = row.querySelector('.user-name').textContent.toLowerCase();
            const website = row.querySelector('.user-username')?.textContent.toLowerCase() || '';
            const address = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const contact = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const email = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
            const status = row.querySelector('td:nth-child(5) span').textContent.toLowerCase();
            const archivedDateText = row.querySelector('td:nth-child(6)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' ||
                name.includes(searchTerm) ||
                website.includes(searchTerm) ||
                address.includes(searchTerm) ||
                contact.includes(searchTerm) ||
                email.includes(searchTerm);

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && status.includes('active')) ||
                (statusFilter === 'inactive' && status.includes('inactive')) ||
                (statusFilter === 'archived' && status.includes('archived'));

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            row.style.display = (matchesSearch && matchesStatus && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#ojt-companies-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(6)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(6)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }
}

// Helper function to parse date
function parseDate(dateString) {
    if (!dateString || dateString === '-') return new Date(0);

    try {
        const months = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };

        const parts = dateString.split(' ');
        const month = months[parts[0]];
        const day = parseInt(parts[1].replace(',', ''));
        const year = parseInt(parts[2]);
        const timeParts = parts[3].split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);

        return new Date(year, month, day, hours, minutes);
    } catch (e) {
        console.error('Error parsing date:', dateString, e);
        return new Date(0);
    }
}

// ----------------------------------------- Organizations Tab Functionality ----------------------------------------
const organizationSearchInput = document.getElementById('organizations-search-archived');
const organizationTypeFilter = document.getElementById('ArchivedorganizationTypeFilter');
const organizationStatusFilter = document.getElementById('ArchivedorganizationStatusFilter');
const organizationDateFilter = document.getElementById('ArchivedorganizationDateFilter');

if (organizationSearchInput && organizationTypeFilter && organizationStatusFilter && organizationDateFilter) {
    organizationSearchInput.addEventListener('input', filterOrganizations);
    organizationTypeFilter.addEventListener('change', filterOrganizations);
    organizationStatusFilter.addEventListener('change', filterOrganizations);
    organizationDateFilter.addEventListener('change', filterOrganizations);

    function filterOrganizations() {
        const searchTerm = organizationSearchInput.value.toLowerCase();
        const typeFilter = organizationTypeFilter.value;
        const statusFilter = organizationStatusFilter.value;
        const dateFilter = organizationDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#organizations-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const name = row.querySelector('td:nth-child(1) strong').textContent.toLowerCase();
            const email = row.querySelector('td:nth-child(1) small').textContent.toLowerCase();
            const acronym = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const type = row.querySelector('td:nth-child(3) span').textContent.toLowerCase();
            const status = row.querySelector('td:nth-child(4) span').textContent.toLowerCase();
            const archivedDateText = row.querySelector('td:nth-child(7)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' ||
                name.includes(searchTerm) ||
                email.includes(searchTerm) ||
                acronym.includes(searchTerm);

            const matchesType = typeFilter === 'all' ||
                (typeFilter === 'student' && type.includes('student')) ||
                (typeFilter === 'sociocultural' && type.includes('sociocultural'));

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && status.includes('active')) ||
                (statusFilter === 'pending' && status.includes('pending')) ||
                (statusFilter === 'inactive' && status.includes('inactive')) ||
                (statusFilter === 'expired' && status.includes('expired')) ||
                (statusFilter === 'rejected' && status.includes('rejected'));

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            row.style.display = (matchesSearch && matchesType && matchesStatus && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#organizations-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(7)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(7)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }
}

// ----------------------------------- Accomplishment Reports Tab Functionality ----------------------------------------
const accomplishmentReportSearchInput = document.getElementById('accomplishment-reports-search-archived');
const accomplishmentReportTypeFilter = document.getElementById('ArchivedaccomplishmentReportTypeFilter');
const accomplishmentReportSemesterFilter = document.getElementById('ArchivedaccomplishmentReportSemesterFilter');
const accomplishmentReportDateFilter = document.getElementById('ArchivedaccomplishmentReportDateFilter');

if (accomplishmentReportSearchInput && accomplishmentReportTypeFilter && accomplishmentReportSemesterFilter && accomplishmentReportDateFilter) {
    accomplishmentReportSearchInput.addEventListener('input', filterAccomplishmentReports);
    accomplishmentReportTypeFilter.addEventListener('change', filterAccomplishmentReports);
    accomplishmentReportSemesterFilter.addEventListener('change', filterAccomplishmentReports);
    accomplishmentReportDateFilter.addEventListener('change', filterAccomplishmentReports);

    function filterAccomplishmentReports() {
        const searchTerm = accomplishmentReportSearchInput.value.toLowerCase();
        const typeFilter = accomplishmentReportTypeFilter.value;
        const semesterFilter = accomplishmentReportSemesterFilter.value;
        const dateFilter = accomplishmentReportDateFilter.value;

        const rows = Array.from(document.querySelectorAll('#accomplishment-reports-tab .archived-table tbody tr'));

        rows.forEach(row => {
            const title = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const organization = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const type = row.querySelector('td:nth-child(3) span').textContent.toLowerCase();
            const semester = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
            const archivedDateText = row.querySelector('td:nth-child(7)').textContent;
            const archivedDate = parseDate(archivedDateText);

            const matchesSearch = searchTerm === '' ||
                title.includes(searchTerm) ||
                organization.includes(searchTerm);

            const matchesType = typeFilter === 'all' ||
                type.includes(typeFilter);

            const matchesSemester = semesterFilter === 'all' ||
                semester.includes(semesterFilter);

            let matchesDate = true;
            if (dateFilter !== 'all' && dateFilter !== 'newest' && dateFilter !== 'oldest') {
                const now = new Date();

                switch(dateFilter) {
                    case 'week':
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = archivedDate >= oneWeekAgo;
                        break;
                    case 'month':
                        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        matchesDate = archivedDate >= oneMonthAgo;
                        break;
                    case 'year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear();
                        break;
                    case 'last_year':
                        matchesDate = archivedDate.getFullYear() === now.getFullYear() - 1;
                        break;
                    default:
                        if (!isNaN(dateFilter)) {
                            matchesDate = archivedDate.getFullYear() === parseInt(dateFilter);
                        }
                }
            }

            row.style.display = (matchesSearch && matchesType && matchesSemester && matchesDate) ? '' : 'none';
        });

        // Then sort if needed
        if (dateFilter === 'newest' || dateFilter === 'oldest') {
            const tbody = document.querySelector('#accomplishment-reports-tab .archived-table tbody');
            const visibleRows = rows.filter(row => row.style.display !== 'none');

            visibleRows.sort((a, b) => {
                const dateA = parseDate(a.querySelector('td:nth-child(7)').textContent);
                const dateB = parseDate(b.querySelector('td:nth-child(7)').textContent);
                return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
            });

            // Reattach sorted rows
            visibleRows.forEach(row => tbody.appendChild(row));
        }
    }
}
// ------------------------------------------------ View Functions -----------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const viewModal = document.getElementById('viewModal');
    const modalTitle = document.getElementById('view-modal-title');
    const modalBody = document.getElementById('view-modal-body');

    // Modal close functionality
    const closeModalElements = document.querySelectorAll('.close-view-modal, .close-view-modal-btn');
    closeModalElements.forEach(el => {
        el.addEventListener('click', () => {
            viewModal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    viewModal.addEventListener('click', (e) => {
        if (e.target === viewModal) {
            viewModal.style.display = 'none';
        }
    });

    // View button functionality
    document.querySelectorAll('.action-btn.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const type = this.getAttribute('data-type');

            fetch(`/api/archived/${type}/${id}/`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success && data[type]) {
                        showViewModal(data[type], type);
                    } else {
                        alert('Error loading details: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while loading details.');
                });
        });
    });

    function showViewModal(data, type) {
        modalTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Details`;

        switch(type) {
            case 'user':
            modalBody.innerHTML = `
                <div class="view-user-details">
                    <div class="user-profile-header">
                        <img src="${data.profile_picture || '/static/images/default-profile.png'}"
                             alt="${data.username}" class="user-avatar-large">
                        <div>
                            <h3>${data.display_name}</h3>
                            <p>@${data.username}</p>
                            <div class="user-status-badges">
                                <span class="badge ${data.is_active ? 'active' : 'inactive'}">
                                    ${data.is_active ? 'Active' : 'Inactive'}
                                </span>
                                ${data.is_verified ? '<span class="badge verified">Verified</span>' : ''}
                                ${data.is_student ? '<span class="badge student">Student</span>' : ''}
                                ${data.is_osas_unit ? '<span class="badge osas">OSAS Unit</span>' : ''}
                                ${data.is_organization ? '<span class="badge organization">Organization</span>' : ''}
                                ${data.organization_type ? `<span class="badge organization-type">${data.organization_type}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="user-details-sections">
                        ${data.is_organization ? `
                        <!-- Organization Information Section -->
                        <div class="user-section">
                            <h4>Organization Information</h4>
                            <div class="user-details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Organization Name:</span>
                                    <span class="detail-value">${data.organization_name}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Acronym:</span>
                                    <span class="detail-value">${data.organization_acronym}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Organization Type:</span>
                                    <span class="detail-value">${data.organization_type}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Organization Email:</span>
                                    <span class="detail-value">${data.organization_email}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Status:</span>
                                    <span class="detail-value ${data.organization_status}">${data.organization_status_display}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Valid From:</span>
                                    <span class="detail-value">${data.organization_valid_from}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Valid Until:</span>
                                    <span class="detail-value">${data.organization_valid_until}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Member Count:</span>
                                    <span class="detail-value">${data.organization_member_count}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Minimum Members Met:</span>
                                    <span class="detail-value ${data.organization_has_minimum_members ? 'yes' : 'no'}">
                                        ${data.organization_has_minimum_members ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Organization Adviser Information -->
                        <div class="user-section">
                            <h4>Adviser Information</h4>
                            <div class="user-details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Adviser Name:</span>
                                    <span class="detail-value">${data.organization_adviser_name}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Department:</span>
                                    <span class="detail-value">${data.organization_adviser_department}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Email:</span>
                                    <span class="detail-value">${data.organization_adviser_email}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Phone:</span>
                                    <span class="detail-value">${data.organization_adviser_phone}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Organization Members -->
                        ${data.organization_members && data.organization_members.length > 0 ? `
                        <div class="user-section">
                            <h4>Organization Members (${data.organization_member_count})</h4>
                            <div class="organization-members-list">
                                ${data.organization_members.map(member => `
                                    <div class="organization-member-item">
                                        <div class="member-info">
                                            <strong>${member.first_name} ${member.last_name}</strong>
                                            <span class="member-position">${member.position_display || member.position}</span>
                                        </div>
                                        ${member.student_number ? `<div class="member-student-id">${member.student_number}</div>` : ''}
                                        ${member.course ? `<div class="member-course">${member.course}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Organization Documents -->
                        <div class="user-section">
                            <h4>Organization Documents</h4>
                            <div class="organization-documents-grid">
                                ${data.organization_logo_url ? `
                                <div class="document-item">
                                    <h5>Organization Logo</h5>
                                    <img src="${data.organization_logo_url}" alt="Organization Logo" class="document-image">
                                </div>
                                ` : ''}
                                ${data.organization_group_picture_url ? `
                                <div class="document-item">
                                    <h5>Group Picture</h5>
                                    <img src="${data.organization_group_picture_url}" alt="Group Picture" class="document-image">
                                </div>
                                ` : ''}
                                ${data.organization_calendar_activities_url ? `
                                <div class="document-item">
                                    <h5>Calendar of Activities</h5>
                                    <div class="document-info">
                                        <i class="fas fa-file-pdf"></i>
                                        <div>
                                            <a href="${data.organization_calendar_activities_url}" target="_blank">View Document</a>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                                <!-- Add similar blocks for other organization documents -->
                            </div>
                        </div>
                        ` : `
                        <!-- Regular User Information (Non-Organization) -->
                        <div class="user-section">
                            <h4>Basic Information</h4>
                            <div class="user-details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">User Type:</span>
                                    <span class="detail-value">${data.user_type_display}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Gender:</span>
                                    <span class="detail-value">${data.gender_display}</span>
                                </div>
                                ${data.birth_date ? `
                                <div class="detail-item">
                                    <span class="detail-label">Birth Date:</span>
                                    <span class="detail-value">${data.birth_date}</span>
                                </div>
                                ` : ''}
                                <div class="detail-item">
                                    <span class="detail-label">Email:</span>
                                    <span class="detail-value">${data.email}</span>
                                </div>
                                ${data.phone_number ? `
                                <div class="detail-item">
                                    <span class="detail-label">Phone:</span>
                                    <span class="detail-value">${data.phone_number}</span>
                                </div>
                                ` : ''}
                                ${data.address ? `
                                <div class="detail-item">
                                    <span class="detail-label">Address:</span>
                                    <span class="detail-value">${data.address}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        ${data.is_student ? `
                        <div class="user-section">
                            <h4>Student Information</h4>
                            <div class="user-details-grid">
                                ${data.student_number ? `
                                <div class="detail-item">
                                    <span class="detail-label">Student Number:</span>
                                    <span class="detail-value">${data.student_number}</span>
                                </div>
                                ` : ''}
                                ${data.course ? `
                                <div class="detail-item">
                                    <span class="detail-label">Course:</span>
                                    <span class="detail-value">${data.course}</span>
                                </div>
                                ` : ''}
                                ${data.year_level ? `
                                <div class="detail-item">
                                    <span class="detail-label">Year Level:</span>
                                    <span class="detail-value">${data.year_level}</span>
                                </div>
                                ` : ''}
                                ${data.section ? `
                                <div class="detail-item">
                                    <span class="detail-label">Section:</span>
                                    <span class="detail-value">${data.section}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}

                        ${data.is_osas_unit ? `
                        <div class="user-section">
                            <h4>Staff Information</h4>
                            <div class="user-details-grid">
                                ${data.department ? `
                                <div class="detail-item">
                                    <span class="detail-label">Department:</span>
                                    <span class="detail-value">${data.department}</span>
                                </div>
                                ` : ''}
                                ${data.position ? `
                                <div class="detail-item">
                                    <span class="detail-label">Position:</span>
                                    <span class="detail-value">${data.position}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}
                        `}

                        <div class="user-section">
                            <h4>Account Information</h4>
                            <div class="user-details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Date Joined:</span>
                                    <span class="detail-value">${data.date_joined}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Last Login:</span>
                                    <span class="detail-value">${data.last_login || 'Never'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="user-section">
                            <h4>Archival Information</h4>
                            <div class="user-details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Archived Date:</span>
                                    <span class="detail-value">${data.archived_at}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Archived By:</span>
                                    <span class="detail-value">${data.archived_by || 'System'}</span>
                                </div>
                            </div>
                        </div>

                        ${(data.id_photo_url || data.verification_document_url) ? `
                        <div class="user-section">
                            <h4>Verification Documents</h4>
                            <div class="verification-documents">
                                ${data.id_photo_url ? `
                                <div class="document-item">
                                    <h5>ID Photo</h5>
                                    <img src="${data.id_photo_url}" alt="ID Photo" class="verification-image">
                                </div>
                                ` : ''}
                                ${data.verification_document_url ? `
                                <div class="document-item">
                                    <h5>Verification Document</h5>
                                    <div class="document-info">
                                        <i class="fas fa-file-pdf"></i>
                                        <div>
                                            <a href="${data.verification_document_url}" target="_blank">${data.verification_document_name || 'View Document'}</a>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            break;

            case 'announcement':
                modalBody.innerHTML = `
                    <div class="view-announcement-details">
                        <div class="announcement-meta">
                            <span class="badge">${data.category_display}</span>
                            <span>Created by ${data.author_name} on ${data.created_at}</span>
                        </div>

                        <div class="announcement-content">
                            <h3>${data.title}</h3>
                            <div class="content-text">${data.content}</div>

                            ${data.link ? `<p><strong>Link:</strong> <a href="${data.link}" target="_blank">${data.link}</a></p>` : ''}

                            ${data.images && data.images.length > 0 ? `
                                <div class="announcement-images">
                                    <h4>Images</h4>
                                    <div class="image-gallery">
                                        ${data.images.map(img => `
                                            <div class="gallery-item">
                                                <img src="${img.url}" alt="Announcement image">
                                                ${img.caption ? `<p class="image-caption">${img.caption}</p>` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <div class="announcement-footer">
                            <div class="footer-item">
                                <span class="footer-label">Publish Date:</span>
                                <span>${data.publish_date}</span>
                            </div>
                            <div class="footer-item">
                                <span class="footer-label">Archived Date:</span>
                                <span>${data.archived_at}</span>
                            </div>
                            <div class="footer-item">
                                <span class="footer-label">Archived By:</span>
                                <span>${data.archived_by || 'System'}</span>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'downloadable':
                modalBody.innerHTML = `
                    <div class="view-downloadable-details">
                        <div class="downloadable-header">
                            <h3>${data.title}</h3>
                            <span class="badge">${data.category_display}</span>
                        </div>

                        <div class="downloadable-meta">
                            <div class="meta-item">
                                <span class="meta-label">Created by:</span>
                                <span>${data.created_by}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Created on:</span>
                                <span>${data.created_at}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Archived on:</span>
                                <span>${data.archived_at}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Archived by:</span>
                                <span>${data.archived_by || 'System'}</span>
                            </div>
                        </div>

                        <div class="downloadable-file">
                            <div class="file-info">
                                <i class="fas fa-file-alt"></i>
                                <div>
                                    <p class="file-name">${data.file_name}</p>
                                    <p class="file-size">${data.file_size}</p>
                                </div>
                            </div>
                            <a href="${data.file_url}" class="btn btn-primary" download>
                                <i class="fas fa-download"></i> Download
                            </a>
                        </div>

                        ${data.description ? `
                            <div class="downloadable-description">
                                <h4>Description</h4>
                                <p>${data.description}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
                break;

            case 'complaint':
                modalBody.innerHTML = `
                    <div class="view-complaint-details">
                        <div class="complaint-header">
                            <h3>${data.title}</h3>
                            <div class="complaint-reference">
                                <span>Reference #:</span>
                                <strong>${data.reference_number}</strong>
                            </div>
                            <div class="complaint-status">
                                <span class="badge ${data.status === 'resolved' ? 'resolved' : 'under-review'}">
                                    ${data.status_display}
                                </span>
                            </div>
                        </div>

                        <div class="complaint-sections">
                            <div class="complaint-section">
                                <h4>Complainant Information</h4>
                                <div class="complaint-details-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">Name:</span>
                                        <span class="detail-value">${data.complainant_first_name} ${data.complainant_last_name}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Email:</span>
                                        <span class="detail-value">${data.complainant_email}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Phone:</span>
                                        <span class="detail-value">${data.complainant_phone}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Address:</span>
                                        <span class="detail-value">${data.complainant_address}</span>
                                    </div>
                                    ${data.complainant_instructor_name ? `
                                    <div class="detail-item">
                                        <span class="detail-label">Instructor:</span>
                                        <span class="detail-value">${data.complainant_instructor_name}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="complaint-section">
                                <h4>Respondent Information</h4>
                                <div class="complaint-details-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">Name:</span>
                                        <span class="detail-value">${data.respondent_first_name} ${data.respondent_last_name}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Type:</span>
                                        <span class="detail-value">${data.respondent_type_display}</span>
                                    </div>
                                    ${data.respondent_type === 'student' ? `
                                        <div class="detail-item">
                                            <span class="detail-label">Course:</span>
                                            <span class="detail-value">${data.respondent_course}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Year:</span>
                                            <span class="detail-value">${data.respondent_year}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Section:</span>
                                            <span class="detail-value">${data.respondent_section}</span>
                                        </div>
                                    ` : ''}
                                    ${data.respondent_type === 'faculty_staff' ? `
                                        <div class="detail-item">
                                            <span class="detail-label">Department:</span>
                                            <span class="detail-value">${data.respondent_department}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="complaint-section">
                                <h4>Complaint Details</h4>
                                <div class="complaint-statement">
                                    <p>${data.statement}</p>
                                </div>
                                <div class="complaint-details-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">Incident Date:</span>
                                        <span class="detail-value">${data.incident_date}</span>
                                    </div>
                                    ${data.incident_time ? `
                                    <div class="detail-item">
                                        <span class="detail-label">Incident Time:</span>
                                        <span class="detail-value">${data.incident_time}</span>
                                    </div>
                                    ` : ''}
                                    <div class="detail-item">
                                        <span class="detail-label">Location:</span>
                                        <span class="detail-value">${data.incident_location}</span>
                                    </div>
                                    ${data.witnesses ? `
                                    <div class="detail-item">
                                        <span class="detail-label">Witnesses:</span>
                                        <span class="detail-value">${data.witnesses}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>

                            ${data.notes ? `
                            <div class="complaint-section">
                                <h4>Notes</h4>
                                <div class="complaint-notes">
                                    <p>${data.notes}</p>
                                </div>
                            </div>
                            ` : ''}

                            <div class="complaint-meta">
                                <div class="meta-item">
                                    <span class="meta-label">Created:</span>
                                    <span>${data.created_at}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Last Updated:</span>
                                    <span>${data.updated_at}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Archived:</span>
                                    <span>${data.archived_at}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Archived By:</span>
                                    <span>${data.archived_by || 'System'}</span>
                                </div>
                            </div>

                            ${data.documents && data.documents.length > 0 ? `
                            <div class="complaint-section">
                                <h4>Attached Documents</h4>
                                <div class="complaint-documents">
                                    ${data.documents.map(doc => `
                                        <div class="document-item">
                                            <i class="fas fa-file-alt"></i>
                                            <div>
                                                <a href="${doc.file_url}" target="_blank">${doc.file_name}</a>
                                                ${doc.description ? `<p class="document-description">${doc.description}</p>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}

                            ${data.images && data.images.length > 0 ? `
                            <div class="complaint-section">
                                <h4>Attached Images</h4>
                                <div class="complaint-images">
                                    ${data.images.map(img => `
                                        <div class="image-item">
                                            <img src="${img.image_url}" alt="Complaint image">
                                            ${img.caption ? `<p class="image-caption">${img.caption}</p>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}

                            ${data.videos && data.videos.length > 0 ? `
                            <div class="complaint-section">
                                <h4>Attached Videos</h4>
                                <div class="complaint-videos">
                                    ${data.videos.map(vid => `
                                        <div class="video-item">
                                            <video controls>
                                                <source src="${vid.video_url}" type="video/mp4">
                                                Your browser does not support the video tag.
                                            </video>
                                            ${vid.caption ? `<p class="video-caption">${vid.caption}</p>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                break;
                case 'scholarship':
                modalBody.innerHTML = `
                    <div class="view-scholarship-details">
                        <div class="scholarship-header">
                            <h3>${data.name}</h3>
                            <div class="scholarship-meta">
                                <span class="badge ${data.scholarship_type}">${data.scholarship_type_display}</span>
                                <span class="badge ${data.is_active ? 'active' : 'inactive'}">
                                    ${data.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div class="scholarship-content">
                            <div class="scholarship-section">
                                <h4>Description</h4>
                                <p>${data.description}</p>
                            </div>

                            <div class="scholarship-section">
                                <h4>Benefits</h4>
                                <p>${data.benefits}</p>
                            </div>

                            <div class="scholarship-section">
                                <h4>Requirements</h4>
                                <p>${data.requirements}</p>
                            </div>

                            ${data.application_form ? `
                            <div class="scholarship-section">
                                <h4>Application Form</h4>
                                <div class="application-form">
                                    <div class="file-info">
                                        <i class="fas fa-file-alt"></i>
                                        <div>
                                            <p class="file-name">${data.application_form.file_name}</p>
                                        </div>
                                    </div>
                                    <a href="${data.application_form.file_url}" class="btn btn-primary" download>
                                        <i class="fas fa-download"></i> Download Form
                                    </a>
                                </div>
                            </div>
                            ` : ''}
                        </div>

                        <div class="scholarship-meta">
                            <div class="meta-item">
                                <span class="meta-label">Created by:</span>
                                <span>${data.created_by}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Created on:</span>
                                <span>${data.created_at}</span>
                            </div>
                            ${data.updated_at ? `
                            <div class="meta-item">
                                <span class="meta-label">Last updated:</span>
                                <span>${data.updated_at}</span>
                            </div>
                            ` : ''}
                            <div class="meta-item">
                                <span class="meta-label">Archived on:</span>
                                <span>${data.archived_at}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Archived by:</span>
                                <span>${data.archived_by || 'System'}</span>
                            </div>
                        </div>
                    </div>
                `;
                break;
                    case 'scholarship-application':
                        modalBody.innerHTML = `
                            <div class="view-scholarship-application-details">
                                <div class="application-header">
                                    <h3>Scholarship Application</h3>
                                    <div class="application-reference">
                                        <span>Application ID:</span>
                                        <strong>${data.id}</strong>
                                    </div>
                                    <div class="application-status">
                                        <span class="badge ${data.status === 'approved' ? 'approved' :
                                                          data.status === 'rejected' ? 'rejected' :
                                                          data.status === 'waitlisted' ? 'waitlisted' :
                                                          data.status === 'under_review' ? 'under-review' : 'pending'}">
                                            ${data.status_display}
                                        </span>
                                    </div>
                                </div>

                                <div class="application-sections">
                                    <div class="application-section">
                                        <h4>Student Information</h4>
                                        <div class="student-info">
                                            <div class="student-profile">
                                                ${data.student.profile_picture ?
                                                `<img src="${data.student.profile_picture}" alt="${data.student.full_name}" class="student-avatar">` :
                                                `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`}
                                                <div>
                                                    <h5>${data.student.full_name}</h5>
                                                    <p>${data.student.student_number}</p>
                                                    <p>${data.student.course}</p>
                                                </div>
                                            </div>
                                            <div class="student-contact">
                                                <p><strong>Email:</strong> ${data.student.email}</p>
                                                ${data.student.phone_number ? `<p><strong>Phone:</strong> ${data.student.phone_number}</p>` : ''}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="application-section">
                                        <h4>Scholarship Details</h4>
                                        <div class="scholarship-info">
                                            <h5>${data.scholarship.name}</h5>
                                            <p><strong>Type:</strong> ${data.scholarship.type_display}</p>
                                            <p><strong>Description:</strong> ${data.scholarship.description}</p>
                                        </div>
                                    </div>

                                    <div class="application-section">
                                        <h4>Application Documents</h4>
                                        <div class="document-list">
                                            <div class="document-item">
                                                <i class="fas fa-file-alt"></i>
                                                <div>
                                                    <p>Application Form</p>
                                                    <a href="${data.application_form_url}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                            </div>
                                            <div class="document-item">
                                                <i class="fas fa-file-alt"></i>
                                                <div>
                                                    <p>Certificate of Grades</p>
                                                    <a href="${data.cog_url}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                            </div>
                                            <div class="document-item">
                                                <i class="fas fa-file-alt"></i>
                                                <div>
                                                    <p>Certificate of Registration</p>
                                                    <a href="${data.cor_url}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                            </div>
                                            <div class="document-item">
                                                <i class="fas fa-file-alt"></i>
                                                <div>
                                                    <p>ID Photo</p>
                                                    <a href="${data.id_photo_url}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                            </div>
                                            ${data.other_documents_url ? `
                                            <div class="document-item">
                                                <i class="fas fa-file-alt"></i>
                                                <div>
                                                    <p>Other Documents</p>
                                                    <a href="${data.other_documents_url}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                            </div>
                                            ` : ''}
                                        </div>
                                    </div>

                                    ${data.notes ? `
                                    <div class="application-section">
                                        <h4>Notes</h4>
                                        <div class="application-notes">
                                            <p>${data.notes}</p>
                                        </div>
                                    </div>
                                    ` : ''}

                                    <div class="application-meta">
                                        <div class="meta-item">
                                            <span class="meta-label">Applied:</span>
                                            <span>${data.application_date}</span>
                                        </div>
                                        ${data.status_update_date ? `
                                        <div class="meta-item">
                                            <span class="meta-label">Status Updated:</span>
                                            <span>${data.status_update_date}</span>
                                        </div>
                                        ` : ''}
                                        <div class="meta-item">
                                            <span class="meta-label">Archived:</span>
                                            <span>${data.archived_at}</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="meta-label">Archived By:</span>
                                            <span>${data.archived_by || 'System'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        break;
                        case 'admission':
                            modalBody.innerHTML = `
                                <div class="view-admission-details">
                                    <div class="admission-header">
                                        <h3>Student Admission</h3>
                                        <div class="admission-reference">
                                            <span>Control #:</span>
                                            <strong>${data.control_no}</strong>
                                        </div>
                                        <div class="admission-status">
                                            <span class="badge ${data.status_display.toLowerCase()}">
                                                ${data.status_display}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="admission-sections">
                                        <div class="admission-section">
                                            <h4>Basic Information</h4>
                                            <div class="admission-details-grid">
                                                <div class="detail-item">
                                                    <span class="detail-label">Student Type:</span>
                                                    <span class="detail-value">${data.student_type_display}</span>
                                                </div>
                                                <div class="detail-item">
                                                    <span class="detail-label">Course:</span>
                                                    <span class="detail-value">${data.course.name}</span>
                                                </div>
                                                <div class="detail-item">
                                                    <span class="detail-label">Date:</span>
                                                    <span class="detail-value">${data.date}</span>
                                                </div>
                                                <div class="detail-item">
                                                    <span class="detail-label">Portal Registration:</span>
                                                    <span class="detail-value">
                                                        ${data.admission_portal_registration ?
                                                            '<span class="badge complete">Completed</span>' :
                                                            '<span class="badge incomplete">Not Completed</span>'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        ${data.strand ? `
                                        <div class="admission-section">
                                            <h4>Strand</h4>
                                            <p>${data.strand}</p>
                                        </div>
                                        ` : ''}

                                        ${data.remarks ? `
                                        <div class="admission-section">
                                            <h4>Remarks</h4>
                                            <p>${data.remarks}</p>
                                        </div>
                                        ` : ''}

                                        <div class="admission-section">
                                            <h4>Requirements</h4>
                                            <div class="requirements-list">
                                                ${data.grade11_report_card ? `
                                                <div class="requirement-item">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>Grade 11 Report Card</span>
                                                    <a href="${data.grade11_report_card}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                                ` : ''}

                                                ${data.certificate_of_enrollment ? `
                                                <div class="requirement-item">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>Certificate of Enrollment</span>
                                                    <a href="${data.certificate_of_enrollment}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                                ` : ''}

                                                ${data.grade12_report_card ? `
                                                <div class="requirement-item">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>Grade 12 Report Card</span>
                                                    <a href="${data.grade12_report_card}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                                ` : ''}

                                                ${data.form137 ? `
                                                <div class="requirement-item">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>Form 137</span>
                                                    <a href="${data.form137}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                                ` : ''}

                                                ${data.transcript_of_grades ? `
                                                <div class="requirement-item">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>Transcript of Grades</span>
                                                    <a href="${data.transcript_of_grades}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                                ` : ''}

                                                ${data.good_moral_certificate ? `
                                                <div class="requirement-item">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>Good Moral Certificate</span>
                                                    <a href="${data.good_moral_certificate}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                                ` : ''}

                                                ${data.honorable_dismissal ? `
                                                <div class="requirement-item">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>Honorable Dismissal</span>
                                                    <a href="${data.honorable_dismissal}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                                ` : ''}

                                                ${data.nbi_police_clearance ? `
                                                <div class="requirement-item">
                                                    <i class="fas fa-check-circle"></i>
                                                    <span>NBI/Police Clearance</span>
                                                    <a href="${data.nbi_police_clearance}" target="_blank" class="btn btn-small">View</a>
                                                </div>
                                                ` : ''}
                                            </div>
                                        </div>

                                        ${data.curriculum_type_display || data.first_year_first_semester_display ? `
                                        <div class="admission-section">
                                            <h4>Academic History</h4>
                                            <div class="academic-history">
                                                ${data.curriculum_type_display ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">Curriculum Type:</span>
                                                    <span class="detail-value">${data.curriculum_type_display}</span>
                                                </div>
                                                ` : ''}

                                                ${data.first_year_first_semester_display ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">1st Year - 1st Semester:</span>
                                                    <span class="detail-value">${data.first_year_first_semester_display}</span>
                                                </div>
                                                ` : ''}

                                                ${data.first_year_second_semester_display ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">1st Year - 2nd Semester:</span>
                                                    <span class="detail-value">${data.first_year_second_semester_display}</span>
                                                </div>
                                                ` : ''}

                                                ${data.second_year_first_semester_display ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">2nd Year - 1st Semester:</span>
                                                    <span class="detail-value">${data.second_year_first_semester_display}</span>
                                                </div>
                                                ` : ''}

                                                ${data.other_semester_info ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">Other Semester Info:</span>
                                                    <span class="detail-value">${data.other_semester_info}</span>
                                                </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                        ` : ''}

                                        <div class="admission-meta">
                                            <div class="meta-item">
                                                <span class="meta-label">Created:</span>
                                                <span>${data.created_at}</span>
                                            </div>
                                            ${data.updated_at ? `
                                            <div class="meta-item">
                                                <span class="meta-label">Last Updated:</span>
                                                <span>${data.updated_at}</span>
                                            </div>
                                            ` : ''}
                                            <div class="meta-item">
                                                <span class="meta-label">Archived:</span>
                                                <span>${data.archived_at}</span>
                                            </div>
                                            <div class="meta-item">
                                                <span class="meta-label">Archived By:</span>
                                                <span>${data.archived_by || 'System'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                            break;
                            case 'nstp-student':
                            modalBody.innerHTML = `
                                <div class="view-nstp-student-details">
                                    <div class="nstp-student-header">
                                        <div class="student-profile">
                                            ${data.user.profile_picture ?
                                                `<img src="${data.user.profile_picture}" alt="${data.user.username}" class="student-avatar">` :
                                                `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`}
                                            <div>
                                                <h3>${data.last_name}, ${data.first_name} ${data.middle_name || ''}</h3>
                                                <p>${data.student_number}</p>
                                                <div class="status-badge">
                                                    <span class="badge ${data.approval_status}">${data.approval_status_display}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="nstp-student-sections">
                                        <div class="nstp-section">
                                            <h4>Basic Information</h4>
                                            <div class="nstp-details-grid">
                                                <div class="detail-item">
                                                    <span class="detail-label">Program:</span>
                                                    <span class="detail-value">${data.program}</span>
                                                </div>
                                                <div class="detail-item">
                                                    <span class="detail-label">Gender:</span>
                                                    <span class="detail-value">${data.gender_display}</span>
                                                </div>
                                                ${data.birth_date ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">Birth Date:</span>
                                                    <span class="detail-value">${data.birth_date}</span>
                                                </div>
                                                ` : ''}
                                                <div class="detail-item">
                                                    <span class="detail-label">Email:</span>
                                                    <span class="detail-value">${data.email_address}</span>
                                                </div>
                                                ${data.contact_number ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">Contact Number:</span>
                                                    <span class="detail-value">${data.contact_number}</span>
                                                </div>
                                                ` : ''}
                                            </div>
                                        </div>

                                        <div class="nstp-section">
                                            <h4>Address Information</h4>
                                            <div class="nstp-details-grid">
                                                ${data.street_or_barangay ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">Street/Barangay:</span>
                                                    <span class="detail-value">${data.street_or_barangay}</span>
                                                </div>
                                                ` : ''}
                                                ${data.municipality_or_city ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">Municipality/City:</span>
                                                    <span class="detail-value">${data.municipality_or_city}</span>
                                                </div>
                                                ` : ''}
                                                ${data.province ? `
                                                <div class="detail-item">
                                                    <span class="detail-label">Province:</span>
                                                    <span class="detail-value">${data.province}</span>
                                                </div>
                                                ` : ''}
                                            </div>
                                        </div>

                                        <div class="nstp-section">
                                            <h4>NSTP Enrollment Details</h4>
                                            <div class="nstp-details-grid">
                                                <div class="detail-item">
                                                    <span class="detail-label">Semester:</span>
                                                    <span class="detail-value">${data.semester_display}</span>
                                                </div>
                                                <div class="detail-item">
                                                    <span class="detail-label">Academic Year:</span>
                                                    <span class="detail-value">${data.academic_year}</span>
                                                </div>
                                                <div class="detail-item">
                                                    <span class="detail-label">Enrollment Date:</span>
                                                    <span class="detail-value">${data.created_at}</span>
                                                </div>
                                            </div>
                                        </div>

                                        ${data.remarks ? `
                                        <div class="nstp-section">
                                            <h4>Remarks</h4>
                                            <p>${data.remarks}</p>
                                        </div>
                                        ` : ''}

                                        <div class="nstp-section">
                                            <h4>Archival Information</h4>
                                            <div class="nstp-details-grid">
                                                <div class="detail-item">
                                                    <span class="detail-label">Archived Date:</span>
                                                    <span class="detail-value">${data.archived_at}</span>
                                                </div>
                                                <div class="detail-item">
                                                    <span class="detail-label">Archived By:</span>
                                                    <span class="detail-value">${data.archived_by || 'System'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                            break;
                            case 'nstp-file':
                            modalBody.innerHTML = `
                                <div class="view-nstp-file-details">
                                    <div class="nstp-file-header">
                                        <h3>${data.title}</h3>
                                        <div class="nstp-file-meta">
                                            <span class="badge">${data.category_display}</span>
                                            <span class="badge">${data.semester_display}</span>
                                            <span class="badge">${data.school_year}</span>
                                        </div>
                                    </div>

                                    <div class="nstp-file-content">
                                        ${data.description ? `
                                        <div class="nstp-file-section">
                                            <h4>Description</h4>
                                            <p>${data.description}</p>
                                        </div>
                                        ` : ''}

                                        <div class="nstp-file-section">
                                            <h4>File Information</h4>
                                            <div class="file-info">
                                                <i class="fas fa-file-alt"></i>
                                                <div>
                                                    <p class="file-name">${data.file_name}</p>
                                                    <p class="file-size">${data.file_size}</p>
                                                </div>
                                            </div>
                                            <a href="${data.file_url}" class="btn btn-primary" download>
                                                <i class="fas fa-download"></i> Download
                                            </a>
                                        </div>
                                    </div>

                                    <div class="nstp-file-meta-details">
                                        <div class="meta-item">
                                            <span class="meta-label">Created by:</span>
                                            <span>${data.created_by}</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="meta-label">Created on:</span>
                                            <span>${data.created_at}</span>
                                        </div>
                                        ${data.updated_at ? `
                                        <div class="meta-item">
                                            <span class="meta-label">Last updated:</span>
                                            <span>${data.updated_at}</span>
                                        </div>
                                        ` : ''}
                                        <div class="meta-item">
                                            <span class="meta-label">Archived on:</span>
                                            <span>${data.archived_at}</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="meta-label">Archived by:</span>
                                            <span>${data.archived_by || 'System'}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                            break;
                            case 'ojt-company':
                                modalBody.innerHTML = `
                                    <div class="view-ojt-company-details">
                                        <div class="ojt-company-header">
                                            <div class="company-icon">
                                                <i class="fas fa-building"></i>
                                            </div>
                                            <div>
                                                <h3>${data.name}</h3>
                                                <div class="company-status-badges">
                                                    <span class="badge ${data.status.toLowerCase()}">${data.status}</span>
                                                    <span class="badge ${data.archived_at ? 'archived' : 'active'}">
                                                        ${data.archived_at ? 'Archived' : 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="ojt-company-sections">
                                            <div class="ojt-section">
                                                <h4>Contact Information</h4>
                                                <div class="ojt-details-grid">
                                                    <div class="detail-item">
                                                        <span class="detail-label">Address:</span>
                                                        <span class="detail-value">${data.address}</span>
                                                    </div>
                                                    <div class="detail-item">
                                                        <span class="detail-label">Contact Number:</span>
                                                        <span class="detail-value">${data.contact_number}</span>
                                                    </div>
                                                    ${data.email ? `
                                                    <div class="detail-item">
                                                        <span class="detail-label">Email:</span>
                                                        <span class="detail-value">${data.email}</span>
                                                    </div>
                                                    ` : ''}
                                                    ${data.website ? `
                                                    <div class="detail-item">
                                                        <span class="detail-label">Website:</span>
                                                        <span class="detail-value"><a href="${data.website}" target="_blank">${data.website}</a></span>
                                                    </div>
                                                    ` : ''}
                                                </div>
                                            </div>

                                            ${data.description ? `
                                            <div class="ojt-section">
                                                <h4>Description</h4>
                                                <div class="description-content">
                                                    <p>${data.description}</p>
                                                </div>
                                            </div>
                                            ` : ''}

                                            <div class="ojt-section">
                                                <h4>Status Information</h4>
                                                <div class="ojt-details-grid">
                                                    <div class="detail-item">
                                                        <span class="detail-label">Current Status:</span>
                                                        <span class="detail-value badge ${data.status.toLowerCase()}">${data.status}</span>
                                                    </div>
                                                    ${data.status_updated_at ? `
                                                    <div class="detail-item">
                                                        <span class="detail-label">Status Last Updated:</span>
                                                        <span class="detail-value">${data.status_updated_at}</span>
                                                    </div>
                                                    ` : ''}
                                                    ${data.status_updated_by ? `
                                                    <div class="detail-item">
                                                        <span class="detail-label">Updated By:</span>
                                                        <span class="detail-value">${data.status_updated_by}</span>
                                                    </div>
                                                    ` : ''}
                                                </div>
                                            </div>

                                            <div class="ojt-section">
                                                <h4>Timestamps</h4>
                                                <div class="ojt-details-grid">
                                                    <div class="detail-item">
                                                        <span class="detail-label">Created:</span>
                                                        <span class="detail-value">${data.created_at}</span>
                                                    </div>
                                                    ${data.updated_at ? `
                                                    <div class="detail-item">
                                                        <span class="detail-label">Last Updated:</span>
                                                        <span class="detail-value">${data.updated_at}</span>
                                                    </div>
                                                    ` : ''}
                                                </div>
                                            </div>

                                            <div class="ojt-section">
                                                <h4>Archival Information</h4>
                                                <div class="ojt-details-grid">
                                                    ${data.archived_at ? `
                                                    <div class="detail-item">
                                                        <span class="detail-label">Archived Date:</span>
                                                        <span class="detail-value">${data.archived_at}</span>
                                                    </div>
                                                    ` : ''}
                                                    <div class="detail-item">
                                                        <span class="detail-label">Archived By:</span>
                                                        <span class="detail-value">${data.archived_by || 'System'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                break;
                                    case 'organization':
                                    modalBody.innerHTML = `
                                        <div class="view-organization-details">
                                            <div class="organization-header">
                                                <div class="organization-logo-section">
                                                    ${data.organization_logo_url ?
                                                        `<img src="${data.organization_logo_url}" alt="${data.organization_name}" class="organization-logo-large">` :
                                                        `<div class="organization-logo-large placeholder">
                                                            <i class='bx bxs-group'></i>
                                                        </div>`
                                                    }
                                                </div>
                                                <div class="organization-basic-info">
                                                    <h3>${data.organization_name}</h3>
                                                    <p class="organization-acronym">${data.organization_acronym}</p>
                                                    <div class="organization-status-badges">
                                                        <span class="badge ${data.organization_type_display.toLowerCase()}">${data.organization_type_display}</span>
                                                        <span class="badge ${data.organization_status}">${data.organization_status_display}</span>
                                                        <span class="badge members">${data.organization_member_count} members</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="organization-sections">
                                                <div class="organization-section">
                                                    <h4>Organization Information</h4>
                                                    <div class="organization-details-grid">
                                                        <div class="detail-item">
                                                            <span class="detail-label">Email:</span>
                                                            <span class="detail-value">${data.organization_email}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Valid From:</span>
                                                            <span class="detail-value">${data.organization_valid_from}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Valid Until:</span>
                                                            <span class="detail-value">${data.organization_valid_until}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Minimum Members:</span>
                                                            <span class="detail-value ${data.organization_has_minimum_members ? 'complete' : 'incomplete'}">
                                                                ${data.organization_has_minimum_members ? '✓ Met (3+ members)' : '✗ Not met'}
                                                            </span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Requirements:</span>
                                                            <span class="detail-value ${data.all_requirements_submitted ? 'complete' : 'incomplete'}">
                                                                ${data.all_requirements_submitted ? '✓ Complete' : '✗ Incomplete'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="organization-section">
                                                    <h4>Description & Purpose</h4>
                                                    <div class="organization-text-content">
                                                        <div class="text-block">
                                                            <h5>Description</h5>
                                                            <p>${data.organization_description}</p>
                                                        </div>
                                                        <div class="text-block">
                                                            <h5>Mission</h5>
                                                            <p>${data.organization_mission}</p>
                                                        </div>
                                                        <div class="text-block">
                                                            <h5>Vision</h5>
                                                            <p>${data.organization_vision}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="organization-section">
                                                    <h4>Adviser Information</h4>
                                                    <div class="organization-details-grid">
                                                        <div class="detail-item">
                                                            <span class="detail-label">Name:</span>
                                                            <span class="detail-value">${data.organization_adviser_name}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Department:</span>
                                                            <span class="detail-value">${data.organization_adviser_department}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Email:</span>
                                                            <span class="detail-value">${data.organization_adviser_email}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Phone:</span>
                                                            <span class="detail-value">${data.organization_adviser_phone}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                ${data.organization_members && data.organization_members.length > 0 ? `
                                                <div class="organization-section">
                                                    <h4>Organization Members (${data.organization_members.length})</h4>
                                                    <div class="members-list">
                                                        ${data.organization_members.map((member, index) => `
                                                            <div class="member-item">
                                                                <div class="member-avatar">
                                                                    <i class="fas fa-user"></i>
                                                                </div>
                                                                <div class="member-info">
                                                                    <span class="member-name">${member.first_name} ${member.last_name}</span>
                                                                    <span class="member-position">${member.position || 'Member'}</span>
                                                                </div>
                                                                ${member.added_at ? `
                                                                <div class="member-meta">
                                                                    <small>Joined: ${new Date(member.added_at).toLocaleDateString()}</small>
                                                                </div>
                                                                ` : ''}
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                                ` : ''}

                                                <div class="organization-section">
                                                    <h4>Submitted Documents</h4>
                                                    <div class="documents-grid">
                                                        ${data.organization_logo_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-image"></i>
                                                            <div>
                                                                <span>Organization Logo</span>
                                                                <a href="${data.organization_logo_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_calendar_activities_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Calendar of Activities</span>
                                                                <a href="${data.organization_calendar_activities_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_adviser_cv_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Adviser CV</span>
                                                                <a href="${data.organization_adviser_cv_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_cog_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Certificate of Grades</span>
                                                                <a href="${data.organization_cog_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_group_picture_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-image"></i>
                                                            <div>
                                                                <span>Group Picture</span>
                                                                <a href="${data.organization_group_picture_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_cbl_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Constitution and By-Laws</span>
                                                                <a href="${data.organization_cbl_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_list_members_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>List of Members</span>
                                                                <a href="${data.organization_list_members_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_acceptance_letter_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Acceptance Letter</span>
                                                                <a href="${data.organization_acceptance_letter_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_ar_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Accomplishment Report</span>
                                                                <a href="${data.organization_ar_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_previous_calendar_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Previous Calendar</span>
                                                                <a href="${data.organization_previous_calendar_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_financial_report_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Financial Report</span>
                                                                <a href="${data.organization_financial_report_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_coa_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Certificate of Assessment</span>
                                                                <a href="${data.organization_coa_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_member_biodata_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Member Biodata</span>
                                                                <a href="${data.organization_member_biodata_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}

                                                        ${data.organization_good_moral_url ? `
                                                        <div class="document-item">
                                                            <i class="fas fa-file-alt"></i>
                                                            <div>
                                                                <span>Good Moral Certificate</span>
                                                                <a href="${data.organization_good_moral_url}" target="_blank" class="btn btn-small">View</a>
                                                            </div>
                                                        </div>
                                                        ` : ''}
                                                    </div>
                                                </div>

                                                <div class="organization-meta">
                                                    <div class="meta-item">
                                                        <span class="meta-label">Created:</span>
                                                        <span>${data.created_at}</span>
                                                    </div>
                                                    ${data.updated_at ? `
                                                    <div class="meta-item">
                                                        <span class="meta-label">Last Updated:</span>
                                                        <span>${data.updated_at}</span>
                                                    </div>
                                                    ` : ''}
                                                    <div class="meta-item">
                                                        <span class="meta-label">Archived:</span>
                                                        <span>${data.archived_at}</span>
                                                    </div>
                                                    <div class="meta-item">
                                                        <span class="meta-label">Archived By:</span>
                                                        <span>${data.archived_by || 'System'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                    break;
                                    case 'accomplishment-report':
                                    modalBody.innerHTML = `
                                        <div class="view-accomplishment-report-details">
                                            <div class="accomplishment-report-header">
                                                <h3>${data.title}</h3>
                                                <div class="report-meta">
                                                    <span class="badge ${data.record_type}">${data.record_type_display}</span>
                                                    <span class="badge">${data.semester_display}</span>
                                                    <span class="badge">${data.school_year}</span>
                                                </div>
                                            </div>

                                            <div class="accomplishment-report-sections">
                                                <div class="report-section">
                                                    <h4>Basic Information</h4>
                                                    <div class="report-details-grid">
                                                        <div class="detail-item">
                                                            <span class="detail-label">Organization:</span>
                                                            <span class="detail-value">${data.organization ? data.organization.name + ' (' + data.organization.acronym + ')' : 'N/A'}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Date Conducted:</span>
                                                            <span class="detail-value">${data.date_conducted}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Venue:</span>
                                                            <span class="detail-value">${data.venue || 'Not specified'}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Number of Participants:</span>
                                                            <span class="detail-value">${data.number_of_participants}</span>
                                                        </div>
                                                        <div class="detail-item">
                                                            <span class="detail-label">Duration:</span>
                                                            <span class="detail-value">${data.duration_hours} hours</span>
                                                        </div>
                                                        ${data.budget_utilized ? `
                                                        <div class="detail-item">
                                                            <span class="detail-label">Budget Utilized:</span>
                                                            <span class="detail-value">₱${parseFloat(data.budget_utilized).toLocaleString()}</span>
                                                        </div>
                                                        ` : ''}
                                                    </div>
                                                </div>

                                                ${data.objectives ? `
                                                <div class="report-section">
                                                    <h4>Objectives</h4>
                                                    <div class="objectives-content">
                                                        <p>${data.objectives}</p>
                                                    </div>
                                                </div>
                                                ` : ''}

                                                ${data.outcomes ? `
                                                <div class="report-section">
                                                    <h4>Outcomes</h4>
                                                    <div class="outcomes-content">
                                                        <p>${data.outcomes}</p>
                                                    </div>
                                                </div>
                                                ` : ''}

                                                <div class="report-section">
                                                    <h4>Main Report</h4>
                                                    <div class="main-report">
                                                        <div class="file-info">
                                                            <i class="fas fa-file-pdf"></i>
                                                            <div>
                                                                <p class="file-name">${data.main_report.name}</p>
                                                            </div>
                                                        </div>
                                                        <a href="${data.main_report.url}" class="btn btn-primary" target="_blank">
                                                            <i class="fas fa-download"></i> Download Report
                                                        </a>
                                                    </div>
                                                </div>

                                                ${data.supporting_files && data.supporting_files.length > 0 ? `
                                                <div class="report-section">
                                                    <h4>Supporting Files (${data.supporting_files.length})</h4>
                                                    <div class="supporting-files-list">
                                                        ${data.supporting_files.map(file => `
                                                            <div class="file-item">
                                                                <i class="fas fa-file-alt"></i>
                                                                <div>
                                                                    <a href="${file.url}" target="_blank">${file.name}</a>
                                                                    ${file.description ? `<p class="file-description">${file.description}</p>` : ''}
                                                                </div>
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                                ` : ''}

                                                ${data.archive_reason ? `
                                                <div class="report-section">
                                                    <h4>Archive Reason</h4>
                                                    <div class="archive-reason">
                                                        <p>${data.archive_reason}</p>
                                                    </div>
                                                </div>
                                                ` : ''}

                                                <div class="report-meta-details">
                                                    <div class="meta-item">
                                                        <span class="meta-label">Submitted by:</span>
                                                        <span>${data.submitted_by}</span>
                                                    </div>
                                                    <div class="meta-item">
                                                        <span class="meta-label">Created:</span>
                                                        <span>${data.created_at}</span>
                                                    </div>
                                                    ${data.updated_at ? `
                                                    <div class="meta-item">
                                                        <span class="meta-label">Last updated:</span>
                                                        <span>${data.updated_at}</span>
                                                    </div>
                                                    ` : ''}
                                                    <div class="meta-item">
                                                        <span class="meta-label">Archived:</span>
                                                        <span>${data.archived_at}</span>
                                                    </div>
                                                    <div class="meta-item">
                                                        <span class="meta-label">Archived by:</span>
                                                        <span>${data.archived_by || 'System'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                    break;

        }

        viewModal.style.display = 'block';
    }
});

// ------------------------------------------------- Retrieve Functions ------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('retrieveModal');
    const closeModal = document.querySelector('.retrieve-modal-close');
    const cancelBtn = document.querySelector('.cancel-retrieve');
    const confirmBtn = document.querySelector('.confirm-retrieve');
    const itemTypeElement = document.getElementById('retrieveItemType');
    const itemIdElement = document.getElementById('retrieveItemId');

    // Variables to store the current item being processed
    let currentItemId = null;
    let currentItemType = null;
    let currentRowElement = null;

    // Show modal function
    function showModal(itemId, itemType, rowElement) {
        currentItemId = itemId;
        currentItemType = itemType;
        currentRowElement = rowElement;

        itemIdElement.textContent = itemId;
        itemTypeElement.textContent = itemType.charAt(0).toUpperCase() + itemType.slice(1);

        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    // Hide modal function
    function hideModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            currentItemId = null;
            currentItemType = null;
            currentRowElement = null;
        }, 300);
    }

    closeModal.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            hideModal();
        }
    });

    // Confirm retrieve action
    confirmBtn.addEventListener('click', function() {
        if (currentItemId && currentItemType) {
            retrieveItem(currentItemId, currentItemType, currentRowElement);
            hideModal();
        }
    });

    // Add event listeners to all retrieve buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.retrieve-btn')) {
            const button = e.target.closest('.retrieve-btn');
            const row = button.closest('tr');
            const tabContent = button.closest('.tab-content');
            const itemType = tabContent ? tabContent.id.replace('-tab', '') : null;
            const itemId = button.dataset.id;

            if (itemId && itemType) {
                showModal(itemId, itemType, row);
            }
        }
    });

    function retrieveItem(itemId, itemType, rowElement) {
        const typeMap = {
            'users': 'user',
            'announcements': 'announcement',
            'downloadables': 'downloadable',
            'complaints': 'complaint',
            'scholarships': 'scholarship',
            'scholarship-applications': 'scholarship-application',
            'admissions': 'admission',
            'nstp-students': 'nstp-student',
            'nstp-files': 'nstp-file',
            'ojt-companies': 'ojt-company',
            'organizations': 'organization',
            'accomplishment-reports': 'accomplishment-report',
        };

        // Get the singular item type
        const singularType = typeMap[itemType];

        if (!itemId || !singularType) {
            showToast('Error: Missing item information', 'error');
            return;
        }

        const csrfToken = getCookie('csrftoken');

        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="btn-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg></span>Processing...';

        fetch(`/api/archived/${singularType}/${itemId}/retrieve/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Failed to retrieve item');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showToast(`${singularType.charAt(0).toUpperCase() + singularType.slice(1)} retrieved successfully!`, 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to retrieve item');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(`Error retrieving ${singularType}: ${error.message}`, 'error');
        })
        .finally(() => {
            // Reset button state
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<span class="btn-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></span>Confirm Retrieval';
        });
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

    function showToast(message, type) {
        const toastContainer = document.getElementById('toastContainer') || createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
        return container;
    }
});