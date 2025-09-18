const STORAGE_KEY = 'apartment_residents';
const ADMIN_PASSWORD = "myblox.100%"; 


function isAdmin() {
    const entered = prompt("Enter admin password:");
    return entered === ADMIN_PASSWORD;
}


function loadResidents() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

function saveResidents(residents) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(residents));
}


function displayResidents() {
    const residents = loadResidents();
    const listElement = document.getElementById('residents-list');
    const clearAllBtn = document.getElementById('clear-all');
    
    const entries = Object.entries(residents);
    if (entries.length === 0) {
        listElement.innerHTML = '<div class="no-residents">No residents yet</div>';
        clearAllBtn.disabled = true;
        return;
    }

    clearAllBtn.disabled = false;
    listElement.innerHTML = entries.map(([location, name]) => 
        `<div class="resident-item">
            <div class="resident-info">${name} - ${location}</div>
            <button class="delete-btn" onclick="deleteResident('${location}')">Remove</button>
        </div>`
    ).join('');
}


function deleteResident(location) {
    if (!isAdmin()) {
        showNotification('error', 'Unauthorized', 'Only admin can remove residents.');
        return;
    }

    const residents = loadResidents();
    const residentName = residents[location];
    
    if (confirm(`Are you sure you want to remove ${residentName} from ${location}?`)) {
        delete residents[location];
        saveResidents(residents);
        displayResidents();
        showNotification('success', 'Resident Removed', `${residentName} has been removed from ${location}`);
    }
}


function clearAllResidents() {
    if (!isAdmin()) {
        showNotification('error', 'Unauthorized', 'Only admin can clear residents.');
        return;
    }

    const residents = loadResidents();
    const count = Object.keys(residents).length;
    
    if (count === 0) return;
    
    if (confirm(`Are you sure you want to remove all ${count} resident(s)? This action cannot be undone.`)) {
        localStorage.removeItem(STORAGE_KEY);
        displayResidents();
        showNotification('success', 'All Cleared', `All ${count} resident(s) have been removed`);
    }
}


function showNotification(type, title, message) {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✓' : '✕';
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, 5000);
}


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('apartment-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('Name').value.trim();
        const buildingElement = document.querySelector('input[name="building"]:checked');
        const floor = document.getElementById('Floor').value;

        if (!name || !buildingElement || !floor) {
            showNotification('error', 'Incomplete Form', 'Please fill out all fields!');
            return;
        }

        const building = buildingElement.value;
        const buildingName = building === 'A' ? 'Building A' : 'Building B';
        const location = `${floor}, ${buildingName}`;

        const residents = loadResidents();

        if (residents[location]) {
            showNotification('error', 'Floor Occupied', 'This floor has already been occupied');
            return;
        }

        residents[location] = name;
        saveResidents(residents);

        showNotification('success', 'Welcome!', `Okay ${name}, you're now a resident of ${location}`);

        this.reset();
        displayResidents();
    });

    displayResidents();
});

