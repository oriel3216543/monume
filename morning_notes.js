// Morning Notes JavaScript functionality

let currentFilter = 'all';
let allNotes = [];

// Setup event listeners
function setupEventListeners() {
    // Note form submission
    const noteForm = document.getElementById('note-form');
    if (noteForm) {
        noteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addNote();
        });
    }
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter
            currentFilter = this.dataset.filter;
            displayNotes();
        });
    });
}

// Load notes from local storage or server
async function loadNotes() {
    try {
        // For now, we'll use localStorage to store notes
        // In a production environment, you would fetch from a server
        const storedNotes = localStorage.getItem('morningNotes');
        allNotes = storedNotes ? JSON.parse(storedNotes) : [];
        
        // Display the notes
        displayNotes();
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

// Add a new note
function addNote() {
    const noteContent = document.getElementById('note-content').value.trim();
    
    if (!noteContent) {
        alert('Please enter a note before posting.');
        return;
    }
    
    const username = localStorage.getItem('username') || 'Unknown User';
    
    const newNote = {
        id: Date.now().toString(),
        content: noteContent,
        author: username,
        timestamp: new Date().toISOString(),
        completed: false,
        completedBy: null,
        completedAt: null
    };
    
    // Add to the notes array
    allNotes.unshift(newNote);
    
    // Save to storage
    saveNotes();
    
    // Clear the form
    document.getElementById('note-content').value = '';
    
    // Update display
    displayNotes();
}

// Save notes to storage
function saveNotes() {
    localStorage.setItem('morningNotes', JSON.stringify(allNotes));
    
    // Update notifications if the system is available
    if (window.taskNotificationSystem) {
        window.taskNotificationSystem.checkForTasks();
    }
}

// Display notes based on current filter
function displayNotes() {
    const noteList = document.getElementById('note-list');
    const emptyState = document.getElementById('empty-state');
    
    // Filter notes based on current selection
    let filteredNotes;
    if (currentFilter === 'all') {
        filteredNotes = allNotes;
    } else if (currentFilter === 'active') {
        filteredNotes = allNotes.filter(note => !note.completed);
    } else if (currentFilter === 'completed') {
        filteredNotes = allNotes.filter(note => note.completed);
    }
    
    // Clear current notes
    noteList.innerHTML = '';
    
    // Show empty state if no notes
    if (filteredNotes.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        
        // Add each note to the list
        filteredNotes.forEach(note => {
            const noteCard = createNoteElement(note);
            noteList.appendChild(noteCard);
        });
    }
}

// Create a note element
function createNoteElement(note) {
    const noteCard = document.createElement('div');
    noteCard.className = `note-card ${note.completed ? 'completed' : ''}`;
    noteCard.dataset.id = note.id;
    
    const date = new Date(note.timestamp);
    const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    let completedInfo = '';
    if (note.completed && note.completedBy) {
        const completedDate = new Date(note.completedAt);
        const formattedCompletedDate = `${completedDate.toLocaleDateString()} at ${completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        completedInfo = `<div class="completed-info">Completed by ${note.completedBy} on ${formattedCompletedDate}</div>`;
    }
    
    noteCard.innerHTML = `
        <div class="note-header">
            <div class="note-meta">
                Posted by ${note.author} on ${formattedDate}
                ${completedInfo}
            </div>
            <div class="note-actions">
                ${!note.completed ? `<button class="complete-btn" onclick="markAsComplete('${note.id}')"><i class="fas fa-check"></i></button>` : ''}
                <button class="delete-btn" onclick="deleteNote('${note.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="note-content">${note.content}</div>
    `;
    
    return noteCard;
}

// Mark a note as complete
function markAsComplete(noteId) {
    const username = localStorage.getItem('username') || 'Unknown User';
    
    // Find and update the note
    const noteIndex = allNotes.findIndex(note => note.id === noteId);
    if (noteIndex !== -1) {
        allNotes[noteIndex].completed = true;
        allNotes[noteIndex].completedBy = username;
        allNotes[noteIndex].completedAt = new Date().toISOString();
        
        // Save and update display
        saveNotes();
        displayNotes();
        
        // Update notifications immediately
        if (window.taskNotificationSystem) {
            window.taskNotificationSystem.checkForTasks();
        }
    }
}

// Delete a note
function deleteNote(noteId) {
    // Confirm deletion
    if (confirm('Are you sure you want to delete this note?')) {
        // Remove from array
        allNotes = allNotes.filter(note => note.id !== noteId);
        
        // Save and update display
        saveNotes();
        displayNotes();
    }
}
