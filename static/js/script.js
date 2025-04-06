// Location Management Functions
async function loadLocations() {
    try {
        const response = await fetch('/get_locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        
        const data = await response.json();
        const locationsContainer = document.getElementById('locations-list');
        if (!locationsContainer) return;
        
        locationsContainer.innerHTML = '';
        data.locations.forEach(location => {
            const locationElement = createLocationElement(location);
            locationsContainer.appendChild(locationElement);
        });
    } catch (error) {
        notifications.error('Error loading locations: ' + error.message);
    }
}

function createLocationElement(location) {
    const div = document.createElement('div');
    div.className = 'location-item';
    div.innerHTML = `
        <div class="location-info">
            <h3>${location.location_name}</h3>
            <p>Mall: ${location.mall}</p>
        </div>
        <div class="location-actions">
            <button onclick="editLocation(${location.id})" class="edit-btn">Edit</button>
            <button onclick="deleteLocation(${location.id})" class="delete-btn">Delete</button>
        </div>
    `;
    return div;
}

async function addLocation(event) {
    event.preventDefault();
    const locationName = document.getElementById('location-name').value;
    const mall = document.getElementById('mall').value;

    if (!locationName || !mall) {
        notifications.error('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/add_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location_name: locationName,
                mall: mall
            })
        });

        if (!response.ok) throw new Error('Failed to add location');

        const data = await response.json();
        notifications.success('Location added successfully');
        document.getElementById('add-location-form').reset();
        await loadLocations();
    } catch (error) {
        notifications.error('Error adding location: ' + error.message);
    }
}

async function editLocation(locationId) {
    try {
        const response = await fetch(`/get_location/${locationId}`);
        if (!response.ok) throw new Error('Failed to fetch location details');
        
        const location = await response.json();
        document.getElementById('edit-location-id').value = location.id;
        document.getElementById('edit-location-name').value = location.location_name;
        document.getElementById('edit-mall').value = location.mall;
        
        // Show edit modal
        document.getElementById('edit-location-modal').style.display = 'block';
    } catch (error) {
        notifications.error('Error loading location details: ' + error.message);
    }
}

async function updateLocation(event) {
    event.preventDefault();
    const locationId = document.getElementById('edit-location-id').value;
    const locationName = document.getElementById('edit-location-name').value;
    const mall = document.getElementById('edit-mall').value;

    if (!locationName || !mall) {
        notifications.error('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/update_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location_id: locationId,
                location_name: locationName,
                mall: mall
            })
        });

        if (!response.ok) throw new Error('Failed to update location');

        notifications.success('Location updated successfully');
        document.getElementById('edit-location-modal').style.display = 'none';
        await loadLocations();
    } catch (error) {
        notifications.error('Error updating location: ' + error.message);
    }
}

async function deleteLocation(locationId) {
    if (!confirm('Are you sure you want to delete this location?')) {
        return;
    }

    try {
        const response = await fetch('/remove_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                location_id: locationId
            })
        });

        if (!response.ok) throw new Error('Failed to delete location');

        notifications.success('Location deleted successfully');
        await loadLocations();
    } catch (error) {
        notifications.error('Error deleting location: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const addLocationForm = document.getElementById('add-location-form');
    if (addLocationForm) {
        addLocationForm.addEventListener('submit', addLocation);
    }

    const editLocationForm = document.getElementById('edit-location-form');
    if (editLocationForm) {
        editLocationForm.addEventListener('submit', updateLocation);
    }

    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });

    // Load locations on page load
    if (document.getElementById('locations-list')) {
        loadLocations();
    }
});