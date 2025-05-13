// Handles the upcoming events functionality for the dashboard

// --- Holiday API Integration ---
// Uses Nager.Date public API for holidays (country: US, can be changed)
async function fetchUpcomingHolidays() {
    const today = new Date();
    const year = today.getFullYear();
    const country = 'US'; // Change to your country code if needed
    try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
        if (!res.ok) return [];
        const holidays = await res.json();
        // Filter for holidays in the next 7 days
        const weekAhead = new Date(today);
        weekAhead.setDate(today.getDate() + 7);
        return holidays.filter(h => {
            const hDate = new Date(h.date);
            return hDate >= today && hDate <= weekAhead;
        }).map(h => ({
            title: h.localName,
            date: h.date,
            type: 'holiday',
            description: h.name
        }));
    } catch (e) {
        return [];
    }
}

// Render events (merges local and holiday events)
async function renderEvents(eventsList) {
    if (!eventsList) return;
    const localEvents = JSON.parse(localStorage.getItem('monume_events') || '[]');
    const holidays = await fetchUpcomingHolidays();
    let allEvents = [
        ...localEvents.map((ev, idx) => ({ ...ev, type: 'local', _idx: idx })),
        ...holidays.map(ev => ({ ...ev, type: 'holiday' }))
    ];
    // Remove duplicates (same date and title)
    allEvents = allEvents.filter((ev, idx, arr) =>
        arr.findIndex(e => e.date === ev.date && e.title === ev.title) === idx
    );
    // Only show next 7 days
    const today = new Date();
    const weekAhead = new Date(today);
    weekAhead.setDate(today.getDate() + 7);
    allEvents = allEvents.filter(ev => {
        const d = new Date(ev.date);
        return d >= today && d <= weekAhead;
    });
    // Sort by date ascending
    allEvents.sort((a, b) => a.date.localeCompare(b.date));
    eventsList.innerHTML = '';
    if (allEvents.length === 0) {
        eventsList.innerHTML = '<div class="no-events">No upcoming events.</div>';
        return;
    }
    allEvents.forEach((ev, idx) => {
        const dateObj = new Date(ev.date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
        const today = new Date();
        const isToday = dateObj.toDateString() === today.toDateString();
        const eventRow = document.createElement('div');
        eventRow.className = 'event-row' + (isToday ? ' today' : '');
        eventRow.innerHTML = `
            <div class="event-date-block">
                <span class="event-date-main">${day}</span>
                <span class="event-date-month">${month}</span>
            </div>
            <div class="event-info">
                <div class="event-title">${ev.title}${ev.type === 'holiday' ? ' <span style=\'color:#ab47bc;font-weight:600;font-size:13px\'>(Holiday)</span>' : ''}</div>
                ${ev.type === 'holiday' && ev.description ? `<div style='color:#888;font-size:12px;'>${ev.description}</div>` : ''}
            </div>
            <div class="event-actions">
                <button class="event-action-btn edit-btn" onclick="editEvent(${idx})">Edit</button>
            </div>
        `;
        eventsList.appendChild(eventRow);
    });
}

// Function to handle editing an event
function editEvent(eventIndex) {
    const events = JSON.parse(localStorage.getItem('monume_events') || '[]');
    const eventToEdit = events[eventIndex];
    if (!eventToEdit) return;

    // Populate the edit modal with event details
    document.getElementById('editEventTitle').value = eventToEdit.title;
    document.getElementById('editEventDate').value = eventToEdit.date;

    // Show the edit modal
    const editModal = document.getElementById('editEventModal');
    const editOverlay = document.getElementById('editEventOverlay');
    editModal.style.display = 'block';
    editOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Save changes
    document.getElementById('saveEditEventBtn').onclick = function() {
        const updatedTitle = document.getElementById('editEventTitle').value.trim();
        const updatedDate = document.getElementById('editEventDate').value;
        if (!updatedTitle || !updatedDate) {
            alert('Please enter both title and date.');
            return;
        }
        events[eventIndex] = { title: updatedTitle, date: updatedDate };
        localStorage.setItem('monume_events', JSON.stringify(events));
        closeEditModal();
        renderEvents();
    };

    // Delete event
    document.getElementById('deleteEventBtn').onclick = function() {
        events.splice(eventIndex, 1);
        localStorage.setItem('monume_events', JSON.stringify(events));
        closeEditModal();
        renderEvents();
    };

    // Close modal
    document.getElementById('closeEditEventModal').onclick = closeEditModal;
    editOverlay.onclick = closeEditModal;

    function closeEditModal() {
        editModal.style.display = 'none';
        editOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Make functions globally accessible
window.fetchUpcomingHolidays = fetchUpcomingHolidays;
window.renderEvents = renderEvents;