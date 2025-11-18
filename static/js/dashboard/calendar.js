document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    let selectedDate = new Date();
    let announcementsData = [];

    // Initialize calendar
    function initCalendar() {
        setupViewTabs();
        setupViewDetailsButtons();
        fetchAnnouncements();
    }

    // Set up view tab switching
    function setupViewTabs() {
        const tabs = document.querySelectorAll('.view-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.calendar-view').forEach(view => {
                    view.classList.remove('active-view');
                });
                document.getElementById(`${this.dataset.view}-view`).classList.add('active-view');

                refreshCurrentView();
            });
        });
    }

    // Refresh the currently active view
    function refreshCurrentView() {
        const activeTab = document.querySelector('.view-tab.active');
        if (activeTab.dataset.view === 'month') {
            renderMonthCalendar(currentDate.getFullYear(), currentDate.getMonth());
        } else if (activeTab.dataset.view === 'week') {
            renderWeekView(currentDate);
        } else if (activeTab.dataset.view === 'year') {
            renderYearView(currentDate.getFullYear());
        }
    }

    // Fetch announcements from server
    function fetchAnnouncements() {
        fetch('/api/announcements/')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                console.log('Fetched announcements:', data);
                announcementsData = data.map(ann => ({
                    ...ann,
                    id: ann.id
                }));
                refreshCurrentView();
                showAnnouncementsForDate(selectedDate);
            })
            .catch(error => {
                console.error('Error fetching announcements:', error);
                showToast('Failed to load announcements', 'error');
                refreshCurrentView();
            });
    }

    /* Month View Function */
    function renderMonthCalendar(year, month) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];

        // Update month/year display
        document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and total days in month
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get today's date for comparison
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        // Generate calendar days
        let calendarDaysHTML = '';

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            calendarDaysHTML += `<div class="calendar-day empty"></div>`;
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dateStr = formatDate(dateObj);
            const dayAnnouncements = getAnnouncementsForDate(dateStr);

            // Check if this is today
            const isToday = isCurrentMonth && day === today.getDate();

            // Check if this is selected date
            const isSelected = selectedDate &&
                              dateObj.getDate() === selectedDate.getDate() &&
                              dateObj.getMonth() === selectedDate.getMonth() &&
                              dateObj.getFullYear() === selectedDate.getFullYear();

            // Dots for announcement
            let dotsHTML = '';
            if (dayAnnouncements.length > 0) {
                dotsHTML = '<div class="announcement-dots">';

                // Show up to 3 dots (one per announcement)
                const dotCount = Math.min(dayAnnouncements.length, 3);
                for (let i = 0; i < dotCount; i++) {
                    const ann = dayAnnouncements[i];
                    dotsHTML += `<div class="announcement-dot ${ann.category.toLowerCase()}"></div>`;
                }

                // If more than 3 announcements, show a "+" indicator
                if (dayAnnouncements.length > 3) {
                    dotsHTML += `<div class="announcement-dot more">+${dayAnnouncements.length - 3}</div>`;
                }

                dotsHTML += '</div>';

                // Create tooltip with announcement titles
                const tooltipContent = dayAnnouncements.map(ann =>
                    `<span class="announcement-tooltip-item ${ann.category.toLowerCase()}">
                        ${ann.title} (${ann.category})
                    </span>`
                ).join('');

                dotsHTML += `<div class="announcement-tooltip">${tooltipContent}</div>`;
            }

            calendarDaysHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                     data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    ${dotsHTML}
                </div>
            `;
        }

        document.getElementById('calendarDays').innerHTML = calendarDaysHTML;

        // Add event listeners to calendar days
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(dayEl => {
            dayEl.addEventListener('click', function() {
                const dateStr = this.getAttribute('data-date');
                selectedDate = parseDate(dateStr);
                showAnnouncementsForDate(selectedDate);

                // Update selected day styling
                document.querySelectorAll('.calendar-day').forEach(day => {
                    day.classList.remove('selected');
                });
                this.classList.add('selected');
            });
        });

        addCalendarLegend();
    }

    /* Week View Functions */
    function renderWeekView(date) {
        const weekStart = getStartOfWeek(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        document.getElementById('currentWeekRange').textContent =
            `Week of ${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEnd)}`;

        let weekHTML = '';
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const dateStr = formatDate(dayDate);
            const dayAnnouncements = getAnnouncementsForDate(dateStr);

            let dayHTML = `
                <div class="week-day">
                    <div class="week-day-header">
                        ${daysOfWeek[i]}<br>
                        <small>${dayDate.getDate()} ${dayDate.toLocaleString('default', { month: 'short' })}</small>
                    </div>
                    <div class="week-day-announcements">
            `;

            if (dayAnnouncements.length === 0) {
                dayHTML += `<p class="no-announcements">No announcements</p>`;
            } else {
                dayAnnouncements.forEach(ann => {
                    dayHTML += renderWeekAnnouncementItem(ann);
                });
            }

            dayHTML += `</div></div>`;
            weekHTML += dayHTML;
        }

        document.getElementById('weekAnnouncements').innerHTML = weekHTML;
    }

    function renderWeekAnnouncementItem(announcement) {
        return `
            <div class="week-announcement-item ${announcement.category.toLowerCase()}">
                <div class="week-announcement-title">${announcement.title}</div>
                <div class="week-announcement-category">${announcement.category}</div>
                <button class="view-details-btn" data-id="${announcement.id}">View Details</button>
            </div>
        `;
    }

    /* Year View Function */
    function renderYearView(year) {
        console.log('Rendering year view for:', year);
        document.getElementById('currentYear').textContent = year;

        let yearHTML = '';
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];

        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);

            // Get all announcements for this month
            const monthAnnouncements = announcementsData.filter(ann => {
                // Check the announcement date
                const annDate = new Date(ann.date);
                if (annDate.getFullYear() === year && annDate.getMonth() === month) {
                    return true;
                }

                // Check the event_date if it exists
                if (ann.event_date) {
                    const eventDate = new Date(ann.event_date);
                    if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
                        return true;
                    }
                }

                // For enrollment periods, check if the period spans this month
                if (ann.enrollment_start && ann.enrollment_end) {
                    const startDate = new Date(ann.enrollment_start);
                    const endDate = new Date(ann.enrollment_end);

                    // Check if the enrollment period overlaps with this month
                    if ((startDate <= monthEnd) && (endDate >= monthStart)) {
                        return true;
                    }
                }

                // Check if the period spans this month
                if (ann.suspension_date) {
                    const startDate = new Date(ann.suspension_date);
                    const endDate = ann.until_suspension_date ? new Date(ann.until_suspension_date) : startDate;

                    // Check if the suspension period overlaps with this month
                    if ((startDate <= monthEnd) && (endDate >= monthStart)) {
                        return true;
                    }
                }

                // For scholarship periods, check if the period spans this month
                if (ann.application_start && ann.application_end) {
                    const startDate = new Date(ann.application_start);
                    const endDate = new Date(ann.application_end);

                    // Check if the scholarship period overlaps with this month
                    if ((startDate <= monthEnd) && (endDate >= monthStart)) {
                        return true;
                    }
                }
                return false;
            });

            // Create a map to store unique announcements by ID
            const uniqueAnnouncements = new Map();
            monthAnnouncements.forEach(ann => {
                if (!uniqueAnnouncements.has(ann.id)) {
                    uniqueAnnouncements.set(ann.id, ann);
                }
            });

            let monthHTML = `
                <div class="year-month">
                    <div class="year-month-header">${monthNames[month]}</div>
                    <div class="year-month-announcements">
            `;

            if (uniqueAnnouncements.size === 0) {
                monthHTML += `<p class="no-announcements">No announcements</p>`;
            } else {
                uniqueAnnouncements.forEach(ann => {
                    monthHTML += renderYearAnnouncementItem(ann);
                });
            }

            monthHTML += `</div></div>`;
            yearHTML += monthHTML;
        }

        document.getElementById('yearAnnouncements').innerHTML = yearHTML;
        addCalendarLegend();
    }

    function renderYearAnnouncementItem(announcement) {
        return `
            <div class="year-announcement-item ${announcement.category.toLowerCase()}">
                <div class="year-announcement-title">${announcement.title}</div>
                <div class="year-announcement-category">${announcement.category}</div>
                <button class="view-details-btn" data-id="${announcement.id}">View Details</button>
            </div>
        `;
    }

    /* Calendar Legend or Color Guide on dots */
    function addCalendarLegend() {
        const legendHTML = `
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-dot basic"></div>
                    <span>Basic</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot enrollment"></div>
                    <span>Enrollment</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot event"></div>
                    <span>Event</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot suspension"></div>
                    <span>Suspension</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot emergency"></div>
                    <span>Emergency</span>
                </div>
            </div>
        `;

        // Add to month view
        const monthView = document.getElementById('month-view');
        const existingLegend = monthView.querySelector('.calendar-legend');
        if (existingLegend) existingLegend.remove();
        monthView.querySelector('.calendar-container').insertAdjacentHTML('beforeend', legendHTML);

        // Add to year view
        const yearView = document.getElementById('year-view');
        const existingYearLegend = yearView.querySelector('.calendar-legend');
        if (existingYearLegend) existingYearLegend.remove();
        yearView.querySelector('.year-announcements-container').insertAdjacentHTML('afterend', legendHTML);
    }

    /* Common Function */
    function renderAnnouncementItem(announcement) {
        // Add date range info if applicable
        let rangeInfo = '';
        if (announcement.category === 'ENROLLMENT' && announcement.enrollment_start && announcement.enrollment_end) {
            rangeInfo = `<div class="announcement-range">
                Enrollment Period: ${formatDisplayDate(announcement.enrollment_start)} to ${formatDisplayDate(announcement.enrollment_end)}
            </div>`;
        } else if (announcement.category === 'SUSPENSION' && announcement.suspension_date) {
            rangeInfo = `<div class="announcement-range">
                Suspension Period: ${formatDisplayDate(announcement.suspension_date)}${announcement.until_suspension_date ? ' to ' + formatDisplayDate(announcement.until_suspension_date) : ''}
            </div>`;
        } else if (announcement.category === 'EVENT' && announcement.event_date) {
            rangeInfo = `<div class="announcement-range">
                Event Date: ${formatDisplayDate(announcement.event_date)}
            </div>`;
        } else if (announcement.category === 'SCHOLARSHIP' && announcement.application_start && announcement.application_end) {
            rangeInfo = `<div class="announcement-range">
                Application Period: ${formatDisplayDate(announcement.application_start)} to ${formatDisplayDate(announcement.application_end)}
            </div>`;
        }

        return `
            <div class="announcement-item">
                <h4>${announcement.title} <span class="announcement-category ${announcement.category.toLowerCase()}">${announcement.category}</span></h4>
                ${rangeInfo}
                <p>${announcement.content.substring(0, 150)}${announcement.content.length > 150 ? '...' : ''}</p>
                <div class="announcement-meta">
                    <span>Posted by ${announcement.author}</span>
                </div>
                <button class="view-details-btn" data-id="${announcement.id}">View Details</button>
            </div>
        `;
    }

    // View Details Trigger Function
    function setupViewDetailsButtons() {
        // Use event delegation for dynamically created buttons
        document.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('view-details-btn')) {
                const announcementId = e.target.getAttribute('data-id');
                if (announcementId) {
                    viewAnnouncement(parseInt(announcementId));
                }
            }
        });
    }

    function showAnnouncementsForDate(date) {
        const dateStr = formatDate(date);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        document.getElementById('selectedDate').textContent = formattedDate;

        const announcements = getAnnouncementsForDate(dateStr);
        const announcementsContainer = document.getElementById('dateAnnouncements');

        if (announcements.length === 0) {
            announcementsContainer.innerHTML = '<p>No announcements for this date.</p>';
            return;
        }

        let announcementsHTML = '';
        announcements.forEach(ann => {
            announcementsHTML += renderAnnouncementItem(ann);
        });

        announcementsContainer.innerHTML = announcementsHTML;
    }

    // Format date as YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Function to parse YYYY-MM-DD string into Date object
    function parseDate(dateStr) {
        const parts = dateStr.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    // Function to format dates for display
    function formatDisplayDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // Get announcements for a specific date (YYYY-MM-DD format)
    function getAnnouncementsForDate(dateStr) {
        return announcementsData.filter(ann => ann.date === dateStr);
    }

    // Get announcements for a date range
    function getAnnouncementsForDateRange(startDate, endDate) {
        return announcementsData.filter(ann => {
            const annDate = new Date(ann.date);
            return annDate >= startDate && annDate <= endDate;
            if (ann.date === dateStr) return true;

            // Check if it's a scholarship announcement within application period
            if (ann.category === 'SCHOLARSHIP' && ann.application_start && ann.application_end) {
                const startDate = new Date(ann.application_start);
                const endDate = new Date(ann.application_end);
                return dateObj >= startDate && dateObj <= endDate;
            }
            return false;
        });
    }

    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Subtract days to get to Monday (if Sunday, subtract 6 days; otherwise subtract (day-1) days)
        const diff = day === 0 ? 6 : day - 1;
        d.setDate(d.getDate() - diff);
        return d;
    }

    /* Navigation Control */
    document.getElementById('prevMonth').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderMonthCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    document.getElementById('nextMonth').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderMonthCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    // Week navigation
    document.getElementById('prevWeek').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 7);
        renderWeekView(currentDate);
    });

    document.getElementById('nextWeek').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 7);
        renderWeekView(currentDate);
    });

    // Year navigation
    document.getElementById('prevYear').addEventListener('click', function() {
        currentDate.setFullYear(currentDate.getFullYear() - 1);
        renderYearView(currentDate.getFullYear());
    });

    document.getElementById('nextYear').addEventListener('click', function() {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        renderYearView(currentDate.getFullYear());
    });

    // Initialize the calendar
    initCalendar();
});