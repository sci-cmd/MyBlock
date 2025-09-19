// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyA3iPCykkBynU6n1sbqaI67auU1CeSsrm0",
    authDomain: "myblox-app.firebaseapp.com",
    projectId: "myblox-app",
    storageBucket: "myblox-app.firebasestorage.app",
    messagingSenderId: "94559433237",
    appId: "1:94559433237:web:48be37bca154ccbc81141c",
    measurementId: "G-B544Z7V6Y4"
};

const ADMIN_PASSWORD = "myblox.100%";

// Init Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("apartment-form");
const residentsList = document.getElementById("residents-list");
const clearAllBtn = document.getElementById("clear-all");

// Admin check function
function isAdmin() {
    const entered = prompt("Enter admin password:");
    return entered === ADMIN_PASSWORD;
}

// Show notification function
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

// Delete individual resident
// Replace your deleteResident function with this:
async function deleteResident(docId, name, location) {
    if (!isAdmin()) {
        showNotification('error', 'Unauthorized', 'Only admin can remove residents.');
        return;
    }

    if (confirm(`Are you sure you want to remove ${name} from ${location}?`)) {
        try {
            const residentRef = doc(db, "residents", docId);
            
            // Add admin key then delete
            await updateDoc(residentRef, { adminKey: ADMIN_PASSWORD });
            await deleteDoc(residentRef);
            
            showNotification('success', 'Resident Removed', `${name} has been removed from ${location}`);
        } catch (err) {
            console.error("Error deleting resident:", err);
            showNotification('error', 'Error', 'Failed to remove resident');
        }
    }
}

// Make deleteResident available globally
window.deleteResident = deleteResident;

// Add resident
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("Name").value.trim();
    const buildingElement = document.querySelector("input[name='building']:checked");
    const floor = document.getElementById("Floor").value;

    if (!name || !buildingElement || !floor) {
        showNotification('error', 'Incomplete Form', 'Please fill out all fields!');
        return;
    }

    const building = buildingElement.value;
    const buildingName = building === 'A' ? 'Building A' : 'Building B';
    const location = `${floor}, ${buildingName}`;

    try {
        // Check if location is already occupied
        const querySnapshot = await getDocs(collection(db, "residents"));
        let isOccupied = false;
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const existingLocation = `${data.floor}, Building ${data.building}`;
            if (existingLocation === location) {
                isOccupied = true;
            }
        });

        if (isOccupied) {
            showNotification('error', 'Floor Occupied', 'This floor has already been occupied');
            return;
        }

        await addDoc(collection(db, "residents"), { name, building, floor });
        showNotification('success', 'Welcome!', `Okay ${name}, you're now a resident of ${location}`);
        form.reset();
    } catch (err) {
        console.error("Error adding resident:", err);
        showNotification('error', 'Error', 'Failed to register resident');
    }
});

// Live updates for residents list
onSnapshot(collection(db, "residents"), (snapshot) => {
    residentsList.innerHTML = "";
    
    if (snapshot.empty) {
        residentsList.innerHTML = '<div class="no-residents">No residents yet</div>';
        clearAllBtn.disabled = true;
        return;
    }

    clearAllBtn.disabled = false;
    
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const location = `${data.floor}, Building ${data.building}`;
        
        const div = document.createElement("div");
        div.className = "resident-item";
        div.innerHTML = `
            <div class="resident-info">${data.name} - ${location}</div>
            <button class="delete-btn" onclick="deleteResident('${docSnap.id}', '${data.name}', '${location}')">Remove</button>
        `;
        residentsList.appendChild(div);
    });
});

// Clear all residents
clearAllBtn.addEventListener('click', async () => {
    if (!isAdmin()) {
        showNotification('error', 'Unauthorized', 'Only admin can clear residents.');
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "residents"));
        const count = querySnapshot.size;
        
        if (count === 0) return;
        
        if (confirm(`Are you sure you want to remove all ${count} resident(s)? This action cannot be undone.`)) {
            const deletePromises = [];
            querySnapshot.forEach((docSnap) => {
                deletePromises.push(deleteDoc(doc(db, "residents", docSnap.id)));
            });
            
            await Promise.all(deletePromises);
            showNotification('success', 'All Cleared', `All ${count} resident(s) have been removed`);
        }
    } catch (err) {
        console.error("Error clearing residents:", err);
        showNotification('error', 'Error', 'Failed to clear residents');
    }
});

