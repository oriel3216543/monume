document.addEventListener('DOMContentLoaded', function() {
    // Load the sidebar from sidebar-template.html for dashboard consistency
    fetch('sidebar-template.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;
            
            // After loading sidebar, highlight active link if available
            setTimeout(() => {
                const menuItems = document.querySelectorAll('.sidebar-menu li');
                menuItems.forEach(item => {
                    const link = item.querySelector('a');
                    if (link && link.getAttribute('href') === 'forms.html') {
                        item.classList.add('active');
                    }
                });
            }, 100);
        });
        
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('form_id');
    
    // If we have a form ID, load the form data
    if (formId && formId !== 'new') {
        loadFormFromServer(formId);
    } else {
        // New form - set default title and description, but no questions
        loadEmptyForm("New Form", "Enter a description for your form.");
        document.title = "New Form - MonuMe Tracker";
    }
    
    // Initialize the form editor interface
    initializeFormEditor();
});

// Load a form from the server
function loadFormFromServer(formId) {
    showToast('Loading form...', 'info');
    
    fetch(`/api/forms/${formId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Form loaded:', data);
            if (data.form) {
                loadFormData(data.form);
            }
        })
        .catch(error => {
            console.error('Error loading form:', error);
            showToast('Error loading form: ' + error.message, 'error');
        });
}

// Load form data into the editor
function loadFormData(form) {
    // Update form title and description
    document.getElementById('form-title').value = form.title;
    document.getElementById('form-description').value = form.description || '';
    
    // Update the preview
    document.getElementById('preview-title').textContent = form.title;
    document.getElementById('preview-description').textContent = form.description || '';
    
    // Update page title
    document.title = form.title + " - MonuMe Tracker";
    
    // Clear existing questions
    const editorPanel = document.getElementById('editor-panel');
    const addQuestionSection = document.querySelector('.add-question-section');
    const questionsToRemove = document.querySelectorAll('.question-editor');
    questionsToRemove.forEach(q => q.remove());
    
    // Clear preview questions
    const formPreview = document.getElementById('form-preview');
    const submitBtn = formPreview.querySelector('.preview-submit-btn');
    const previewQuestionsToRemove = document.querySelectorAll('.preview-question-item');
    previewQuestionsToRemove.forEach(q => q.remove());
    
    // Parse questions if needed
    let questions = form.questions;
    if (typeof questions === 'string') {
        try {
            questions = JSON.parse(questions);
        } catch (e) {
            console.error('Error parsing questions:', e);
            questions = [];
        }
    }
    
    // Add each question
    if (questions && questions.length > 0) {
        questions.forEach(question => {
            addQuestionToEditor(question, editorPanel, addQuestionSection, formPreview, submitBtn);
        });
    }
    
    // Setup event listeners for all questions
    setupQuestionEditorListeners();
    
    // Add form footer if it doesn't exist
    addFormFooter(formPreview);
    
    showToast('Form loaded successfully', 'success');
}

// Add a question to the editor
function addQuestionToEditor(question, editorPanel, addQuestionSection, formPreview, submitBtn) {
    const questionId = question.id || 'q' + Date.now();
    const questionType = question.type || 'multiple-choice';
    const questionTitle = question.title || '';
    
    // Create question editor HTML
    let optionsHTML = '';
    let previewOptionsHTML = '';
    
    switch (questionType) {
        case 'multiple-choice':
        case 'checkbox':
        case 'dropdown':
            // Generate options HTML
            const options = question.options || ['', ''];
            optionsHTML = options.map(option => `
                <div class="option-row">
                    <input type="text" class="form-control" value="${option}" placeholder="Option text">
                    <button class="option-action remove-option">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
            // Generate preview options HTML
            if (questionType === 'multiple-choice') {
                previewOptionsHTML = options.map((option, index) => `
                    <div class="preview-choice">
                        <input type="radio" id="${questionId}_option${index + 1}" name="${questionId}">
                        <label for="${questionId}_option${index + 1}">${option}</label>
                    </div>
                `).join('');
            } else if (questionType === 'checkbox') {
                previewOptionsHTML = options.map((option, index) => `
                    <div class="preview-choice">
                        <input type="checkbox" id="${questionId}_option${index + 1}">
                        <label for="${questionId}_option${index + 1}">${option}</label>
                    </div>
                `).join('');
            } else {
                previewOptionsHTML = `
                    <select class="form-control">
                        <option value="" selected disabled>Please select...</option>
                        ${options.map((option, index) => `<option value="option${index + 1}">${option}</option>`).join('')}
                    </select>
                `;
            }
            break;
            
        case 'short-text':
            optionsHTML = `<p class="text-muted">This question allows users to enter a short text response.</p>`;
            previewOptionsHTML = `<input type="text" class="form-control" placeholder="Short answer text">`;
            break;
            
        case 'long-text':
            optionsHTML = `<p class="text-muted">This question allows users to enter a long text response.</p>`;
            previewOptionsHTML = `<textarea class="form-control" rows="4" placeholder="Long answer text"></textarea>`;
            break;
            
        case 'linear-scale':
            const scaleOptions = question.scaleOptions || {
                start: '1',
                end: '5',
                lowLabel: 'Poor',
                highLabel: 'Excellent'
            };
            
            optionsHTML = `
                <div class="form-control-group">
                    <label>Scale Range</label>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                        <select class="form-control scale-start">
                            <option value="1" ${scaleOptions.start === '1' ? 'selected' : ''}>1</option>
                            <option value="0" ${scaleOptions.start === '0' ? 'selected' : ''}>0</option>
                        </select>
                        <span>to</span>
                        <select class="form-control scale-end">
                            <option value="5" ${scaleOptions.end === '5' ? 'selected' : ''}>5</option>
                            <option value="7" ${scaleOptions.end === '7' ? 'selected' : ''}>7</option>
                            <option value="10" ${scaleOptions.end === '10' ? 'selected' : ''}>10</option>
                        </select>
                    </div>
                </div>
                <div class="form-control-group" style="margin-top: 15px;">
                    <label>Labels (Optional)</label>
                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                        <input type="text" class="form-control" placeholder="Low label" value="${scaleOptions.lowLabel || 'Poor'}">
                        <input type="text" class="form-control" placeholder="High label" value="${scaleOptions.highLabel || 'Excellent'}">
                    </div>
                </div>
            `;
            
            previewOptionsHTML = `
                <div style="padding: 15px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>${scaleOptions.lowLabel || 'Poor'}</span>
                        <span>${scaleOptions.highLabel || 'Excellent'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        ${Array.from({length: parseInt(scaleOptions.end) - parseInt(scaleOptions.start) + 1}, (_, i) => {
                            const value = parseInt(scaleOptions.start) + i;
                            return `
                                <div style="text-align: center;">
                                    <input type="radio" id="${questionId}_scale${value}" name="${questionId}_scale">
                                    <label for="${questionId}_scale${value}">${value}</label>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            break;
            
        case 'date':
            optionsHTML = `<p class="text-muted">This question allows users to select a date.</p>`;
            previewOptionsHTML = `<input type="date" class="form-control">`;
            break;
    }
    
    const questionEditorHTML = `
        <div class="question-editor" data-question-id="${questionId}">
            <div class="question-editor-header">
                <div>
                    <input type="text" class="question-title-input form-control" value="${questionTitle}" placeholder="Enter question text">
                    <div class="question-editor-type">
                        <i class="${getQuestionTypeIcon(questionType)}"></i>
                        <span>Question Type:</span>
                        <select class="question-type-select">
                            <option value="multiple-choice" ${questionType === 'multiple-choice' ? 'selected' : ''}>Multiple Choice</option>
                            <option value="checkbox" ${questionType === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                            <option value="short-text" ${questionType === 'short-text' ? 'selected' : ''}>Short Text</option>
                            <option value="long-text" ${questionType === 'long-text' ? 'selected' : ''}>Long Text</option>
                            <option value="dropdown" ${questionType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
                            <option value="linear-scale" ${questionType === 'linear-scale' ? 'selected' : ''}>Linear Scale</option>
                            <option value="date" ${questionType === 'date' ? 'selected' : ''}>Date</option>
                        </select>
                    </div>
                </div>
                <div class="question-editor-actions">
                    <button class="action-btn duplicate-question" title="Duplicate Question">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="action-btn delete-question" title="Delete Question">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn move-question-up" title="Move Up">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="action-btn move-question-down" title="Move Down">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
            </div>
            
            <div class="question-editor-body">
                <div class="question-options">
                    ${optionsHTML}
                </div>
                ${['multiple-choice', 'checkbox', 'dropdown'].includes(questionType) ? `
                    <button class="add-option-btn">
                        <i class="fas fa-plus"></i> Add Option
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    const previewQuestionHTML = `
        <div class="preview-question-item" data-question-id="${questionId}">
            <h4 class="preview-question-title">${questionTitle}</h4>
            <div class="preview-question-choices">
                ${previewOptionsHTML}
            </div>
        </div>
    `;
    
    // Add to editor panel
    const newQuestionEditorElement = document.createElement('div');
    newQuestionEditorElement.innerHTML = questionEditorHTML;
    const newQuestionEditor = newQuestionEditorElement.firstChild;
    
    // Insert before the add question section
    editorPanel.insertBefore(newQuestionEditor, addQuestionSection);
    
    // Add to preview panel
    const newPreviewQuestionElement = document.createElement('div');
    newPreviewQuestionElement.innerHTML = previewQuestionHTML;
    const newPreviewQuestion = newPreviewQuestionElement.firstChild;
    
    // Insert before the submit button
    formPreview.insertBefore(newPreviewQuestion, submitBtn);
}

// Function to load a sample form into the editor
function loadSampleForm(title, description) {
    // Update form title and description
    document.getElementById('form-title').value = title;
    document.getElementById('form-description').value = description;
    
    // Update the preview
    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-description').textContent = description;
    
    // Add the form footer to the preview
    const formPreview = document.getElementById('form-preview');
    if (formPreview) {
        addFormFooter(formPreview);
    }
}

function initializeFormEditor() {
    // Setup event listeners for the form editor
    
    // Form title input sync with preview
    document.getElementById('form-title').addEventListener('input', function() {
        const previewTitle = document.getElementById('preview-title');
        previewTitle.textContent = this.value;
        highlightElement(previewTitle);
    });
    
    // Form description input sync with preview
    document.getElementById('form-description').addEventListener('input', function() {
        const previewDesc = document.getElementById('preview-description');
        previewDesc.textContent = this.value;
        highlightElement(previewDesc);
    });
    
    // Add new question button
    document.getElementById('add-question-btn').addEventListener('click', function() {
        addNewQuestion();
    });
    
    // Setup initial event listeners for question editors
    setupQuestionEditorListeners();
    
    // Cancel button - return to forms page
    document.getElementById('cancel-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            window.location.href = 'forms.html';
        }
    });
    
    // Save button
    document.getElementById('save-form-btn').addEventListener('click', function() {
        saveForm();
    });
}

// Setup all event listeners for question editors
function setupQuestionEditorListeners() {
    // Question title input sync with preview
    const titleInputs = document.querySelectorAll('.question-title-input');
    titleInputs.forEach(input => {
        input.addEventListener('input', function() {
            const questionEditor = this.closest('.question-editor');
            const questionId = questionEditor.dataset.questionId;
            const previewTitle = document.querySelector(`.preview-question-item[data-question-id="${questionId}"] .preview-question-title`);
            
            if (previewTitle) {
                previewTitle.textContent = this.value;
                highlightElement(previewTitle);
            }
        });
    });

    // Question type select change
    const typeSelects = document.querySelectorAll('.question-type-select');
    typeSelects.forEach(select => {
        select.addEventListener('change', function() {
            const questionEditor = this.closest('.question-editor');
            const questionId = questionEditor.dataset.questionId;
            updateQuestionType(questionId, this.value);
        });
    });

    // Delete question buttons
    const deleteButtons = document.querySelectorAll('.delete-question');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const questionEditor = this.closest('.question-editor');
            const questionId = questionEditor.dataset.questionId;
            
            if (confirm('Are you sure you want to delete this question?')) {
                // Remove from editor
                questionEditor.remove();
                
                // Remove from preview
                const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
                if (previewQuestion) {
                    previewQuestion.remove();
                }
                
                showToast('Question deleted', 'success');
            }
        });
    });

    // Duplicate question buttons
    const duplicateButtons = document.querySelectorAll('.duplicate-question');
    duplicateButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const questionEditor = this.closest('.question-editor');
            duplicateQuestion(questionEditor);
        });
    });

    // Move question up buttons
    const moveUpButtons = document.querySelectorAll('.move-question-up');
    moveUpButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const questionEditor = this.closest('.question-editor');
            moveQuestionUp(questionEditor);
        });
    });

    // Move question down buttons
    const moveDownButtons = document.querySelectorAll('.move-question-down');
    moveDownButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const questionEditor = this.closest('.question-editor');
            moveQuestionDown(questionEditor);
        });
    });

    // Option remove buttons
    setupOptionRemoveButtons();

    // Add option buttons
    const addOptionButtons = document.querySelectorAll('.add-option-btn');
    addOptionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const questionEditor = this.closest('.question-editor');
            const questionId = questionEditor.dataset.questionId;
            addOption(questionId);
        });
    });

    // Option text inputs - sync with preview
    setupOptionTextChangeListeners();
}

// Setup option text input listeners
function setupOptionTextChangeListeners() {
    const optionInputs = document.querySelectorAll('.question-options .option-row input');
    optionInputs.forEach(input => {
        input.addEventListener('input', function() {
            const questionEditor = this.closest('.question-editor');
            const questionId = questionEditor.dataset.questionId;
            updatePreviewOptions(questionId);
        });
    });
}

// Setup remove option button listeners
function setupOptionRemoveButtons() {
    const removeButtons = document.querySelectorAll('.remove-option');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const optionRow = this.closest('.option-row');
            const questionEditor = this.closest('.question-editor');
            const questionId = questionEditor.dataset.questionId;
            
            // Remove option row
            optionRow.remove();
            
            // Update the preview
            updatePreviewOptions(questionId);
            
            // Show toast notification
            showToast('Option removed', 'info');
        });
    });
}

// Add a new question to the form
function addNewQuestion() {
    // Generate unique ID for the new question
    const questionId = 'q' + Date.now();
    
    // Create new question editor HTML
    const questionEditorHTML = `
        <div class="question-editor" data-question-id="${questionId}">
            <div class="question-editor-header">
                <div>
                    <input type="text" class="question-title-input form-control" value="" placeholder="Enter question text">
                    <div class="question-editor-type">
                        <i class="fas fa-list-ul"></i>
                        <span>Question Type:</span>
                        <select class="question-type-select">
                            <option value="multiple-choice" selected>Multiple Choice</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="short-text">Short Text</option>
                            <option value="long-text">Long Text</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="linear-scale">Linear Scale</option>
                            <option value="date">Date</option>
                        </select>
                    </div>
                </div>
                <div class="question-editor-actions">
                    <button class="action-btn duplicate-question" title="Duplicate Question">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="action-btn delete-question" title="Delete Question">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn move-question-up" title="Move Up">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="action-btn move-question-down" title="Move Down">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
            </div>
            
            <div class="question-editor-body">
                <div class="question-options">
                    <div class="option-row">
                        <input type="text" class="form-control" value="" placeholder="Option text">
                        <button class="option-action remove-option">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="option-row">
                        <input type="text" class="form-control" value="" placeholder="Option text">
                        <button class="option-action remove-option">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <button class="add-option-btn">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            </div>
        </div>
    `;
    
    // Create preview question HTML - removed the placeholder questions here
    const previewQuestionHTML = `
        <div class="preview-question-item" data-question-id="${questionId}">
            <h4 class="preview-question-title"></h4>
            <div class="preview-question-choices">
                <div class="preview-choice">
                    <input type="radio" id="${questionId}_option1" name="${questionId}">
                    <label for="${questionId}_option1"></label>
                </div>
                <div class="preview-choice">
                    <input type="radio" id="${questionId}_option2" name="${questionId}">
                    <label for="${questionId}_option2"></label>
                </div>
            </div>
        </div>
    `;
    
    // Add to editor panel
    const editorPanel = document.getElementById('editor-panel');
    const addQuestionSection = document.querySelector('.add-question-section');
    
    // Check if elements exist before proceeding
    if (!editorPanel || !addQuestionSection) {
        console.error('Required elements not found: editorPanel or addQuestionSection');
        showToast('Error adding question: Required elements not found', 'error');
        return;
    }
    
    // Create DOM element for new question editor
    const newQuestionEditorElement = document.createElement('div');
    newQuestionEditorElement.innerHTML = questionEditorHTML;
    const newQuestionEditor = newQuestionEditorElement.firstChild;
    
    // Insert before the add question section
    editorPanel.insertBefore(newQuestionEditor, addQuestionSection);
    
    // Add to preview panel
    const formPreview = document.getElementById('form-preview');
    if (!formPreview) {
        console.error('Required element not found: formPreview');
        showToast('Error adding question: Preview panel not found', 'error');
        return;
    }
    
    const submitBtn = formPreview.querySelector('.preview-submit-btn');
    if (!submitBtn) {
        console.error('Required element not found: submitBtn');
        showToast('Error adding question: Submit button not found', 'error');
        return;
    }
    
    // Create DOM element for new preview question
    const newPreviewQuestionElement = document.createElement('div');
    newPreviewQuestionElement.innerHTML = previewQuestionHTML;
    const newPreviewQuestion = newPreviewQuestionElement.firstChild;
    
    // Insert before the submit button
    formPreview.insertBefore(newPreviewQuestion, submitBtn);
    
    // Setup event listeners for the new question
    setupNewQuestionEventListeners(questionId);
    
    // Highlight new elements
    highlightElement(newQuestionEditor);
    highlightElement(newPreviewQuestion);
    
    // Scroll to the new question
    newQuestionEditor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Show toast notification
    showToast('New question added', 'success');
}

// Set up event listeners for a newly added question
function setupNewQuestionEventListeners(questionId) {
    const questionEditor = document.querySelector(`.question-editor[data-question-id="${questionId}"]`);
    if (!questionEditor) return;
    
    // Question title input sync with preview
    const titleInput = questionEditor.querySelector('.question-title-input');
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            const previewTitle = document.querySelector(`.preview-question-item[data-question-id="${questionId}"] .preview-question-title`);
            if (previewTitle) {
                previewTitle.textContent = this.value;
                highlightElement(previewTitle);
            }
        });
    }
    
    // Question type select change
    const typeSelect = questionEditor.querySelector('.question-type-select');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            updateQuestionType(questionId, this.value);
        });
    }
    
    // Delete question button
    const deleteButton = questionEditor.querySelector('.delete-question');
    if (deleteButton) {
        deleteButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this question?')) {
                questionEditor.remove();
                
                const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
                if (previewQuestion) {
                    previewQuestion.remove();
                }
                
                showToast('Question deleted', 'success');
            }
        });
    }
    
    // Duplicate question button
    const duplicateButton = questionEditor.querySelector('.duplicate-question');
    if (duplicateButton) {
        duplicateButton.addEventListener('click', function() {
            duplicateQuestion(questionEditor);
        });
    }
    
    // Move question up button
    const moveUpButton = questionEditor.querySelector('.move-question-up');
    if (moveUpButton) {
        moveUpButton.addEventListener('click', function() {
            moveQuestionUp(questionEditor);
        });
    }
    
    // Move question down button
    const moveDownButton = questionEditor.querySelector('.move-question-down');
    if (moveDownButton) {
        moveDownButton.addEventListener('click', function() {
            moveQuestionDown(questionEditor);
        });
    }
    
    // Add option button
    const addOptionButton = questionEditor.querySelector('.add-option-btn');
    if (addOptionButton) {
        addOptionButton.addEventListener('click', function() {
            addOption(questionId);
        });
    }
    
    // Remove option buttons
    const removeOptionButtons = questionEditor.querySelectorAll('.remove-option');
    removeOptionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const optionRow = this.closest('.option-row');
            optionRow.remove();
            updatePreviewOptions(questionId);
            showToast('Option removed', 'info');
        });
    });
    
    // Option text inputs
    const optionInputs = questionEditor.querySelectorAll('.option-row input');
    optionInputs.forEach(input => {
        input.addEventListener('input', function() {
            updatePreviewOptions(questionId);
        });
    });
}

// Update question type and sync with preview
function updateQuestionType(questionId, questionType) {
    const questionEditor = document.querySelector(`.question-editor[data-question-id="${questionId}"]`);
    const questionPreview = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
    
    if (!questionEditor || !questionPreview) return;
    
    // Update the icon in the editor
    const typeIcon = questionEditor.querySelector('.question-editor-type i');
    typeIcon.className = getQuestionTypeIcon(questionType);
    
    // Update the editor body based on question type
    const editorBody = questionEditor.querySelector('.question-editor-body');
    let bodyHTML = '';
    
    switch (questionType) {
        case 'multiple-choice':
        case 'checkbox':
        case 'dropdown':
            // Get existing options
            const existingOptions = Array.from(
                questionEditor.querySelectorAll('.option-row input')
            ).map(input => input.value);
            
            // Default options if there aren't any
            const options = existingOptions.length > 0 ? existingOptions : ['', ''];
            
            bodyHTML = `
                <div class="question-options">
                    ${options.map(option => `
                        <div class="option-row">
                            <input type="text" class="form-control" value="${option}" placeholder="Option text">
                            <button class="option-action remove-option">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button class="add-option-btn">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            `;
            break;
            
        case 'short-text':
            bodyHTML = `
                <p class="text-muted">This question allows users to enter a short text response.</p>
            `;
            break;
            
        case 'long-text':
            bodyHTML = `
                <p class="text-muted">This question allows users to enter a long text response.</p>
            `;
            break;
            
        case 'linear-scale':
            bodyHTML = `
                <div class="form-control-group">
                    <label>Scale Range</label>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                        <select class="form-control scale-start">
                            <option value="1" selected>1</option>
                            <option value="0">0</option>
                        </select>
                        <span>to</span>
                        <select class="form-control scale-end">
                            <option value="5" selected>5</option>
                            <option value="7">7</option>
                            <option value="10">10</option>
                        </select>
                    </div>
                </div>
                <div class="form-control-group" style="margin-top: 15px;">
                    <label>Labels (Optional)</label>
                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                        <input type="text" class="form-control" placeholder="Low label" value="Poor">
                        <input type="text" class="form-control" placeholder="High label" value="Excellent">
                    </div>
                </div>
            `;
            break;
            
        case 'date':
            bodyHTML = `
                <p class="text-muted">This question allows users to select a date.</p>
            `;
            break;
            
        default:
            bodyHTML = `
                <p class="text-muted">Configure the ${questionType} question type options.</p>
            `;
    }
    
    editorBody.innerHTML = bodyHTML;
    
    // Update the preview choices based on question type
    updatePreviewForQuestionType(questionId, questionType);
    
    // Setup new event listeners for the updated elements
    setupOptionRemoveButtons();
    setupOptionTextChangeListeners();
    
    // Add option button listener if present
    const addOptionBtn = questionEditor.querySelector('.add-option-btn');
    if (addOptionBtn) {
        addOptionBtn.addEventListener('click', function() {
            addOption(questionId);
        });
    }
    
    // Show toast notification
    showToast(`Question type updated to ${questionType}`, 'info');
}

// Return the appropriate icon class for a question type
function getQuestionTypeIcon(questionType) {
    switch (questionType) {
        case 'multiple-choice': return 'fas fa-list-ul';
        case 'checkbox': return 'fas fa-check-square';
        case 'short-text': return 'fas fa-font';
        case 'long-text': return 'fas fa-paragraph';
        case 'dropdown': return 'fas fa-caret-square-down';
        case 'linear-scale': return 'fas fa-sliders-h';
        case 'date': return 'fas fa-calendar-alt';
        default: return 'fas fa-clipboard-check'; // Default to clipboard-check for consistency
    }
}

// Update preview based on question type
function updatePreviewForQuestionType(questionId, questionType) {
    const previewQuestionChoices = document.querySelector(`.preview-question-item[data-question-id="${questionId}"] .preview-question-choices`);
    if (!previewQuestionChoices) return;
    
    let choicesHTML = '';
    
    switch (questionType) {
        case 'multiple-choice':
            // Get options from editor
            const mcOptions = Array.from(
                document.querySelectorAll(`.question-editor[data-question-id="${questionId}"] .option-row input`)
            ).map(input => input.value);
            
            choicesHTML = mcOptions.map((option, index) => `
                <div class="preview-choice">
                    <input type="radio" id="${questionId}_option${index + 1}" name="${questionId}">
                    <label for="${questionId}_option${index + 1}">${option}</label>
                </div>
            `).join('');
            break;
            
        case 'checkbox':
            // Get options from editor
            const cbOptions = Array.from(
                document.querySelectorAll(`.question-editor[data-question-id="${questionId}"] .option-row input`)
            ).map(input => input.value);
            
            choicesHTML = cbOptions.map((option, index) => `
                <div class="preview-choice">
                    <input type="checkbox" id="${questionId}_option${index + 1}">
                    <label for="${questionId}_option${index + 1}">${option}</label>
                </div>
            `).join('');
            break;
            
        case 'dropdown':
            // Get options from editor
            const ddOptions = Array.from(
                document.querySelectorAll(`.question-editor[data-question-id="${questionId}"] .option-row input`)
            ).map(input => input.value);
            
            choicesHTML = `
                <select class="form-control">
                    <option value="" selected disabled>Please select...</option>
                    ${ddOptions.map((option, index) => `<option value="option${index + 1}">${option}</option>`).join('')}
                </select>
            `;
            break;
            
        case 'short-text':
            choicesHTML = `
                <input type="text" class="form-control" placeholder="Short answer text">
            `;
            break;
            
        case 'long-text':
            choicesHTML = `
                <textarea class="form-control" rows="4" placeholder="Long answer text"></textarea>
            `;
            break;
            
        case 'linear-scale':
            choicesHTML = `
                <div style="padding: 15px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Poor</span>
                        <span>Excellent</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <div style="text-align: center;">
                            <input type="radio" id="${questionId}_scale1" name="${questionId}_scale">
                            <label for="${questionId}_scale1">1</label>
                        </div>
                        <div style="text-align: center;">
                            <input type="radio" id="${questionId}_scale2" name="${questionId}_scale">
                            <label for="${questionId}_scale2">2</label>
                        </div>
                        <div style="text-align: center;">
                            <input type="radio" id="${questionId}_scale3" name="${questionId}_scale">
                            <label for="${questionId}_scale3">3</label>
                        </div>
                        <div style="text-align: center;">
                            <input type="radio" id="${questionId}_scale4" name="${questionId}_scale">
                            <label for="${questionId}_scale4">4</label>
                        </div>
                        <div style="text-align: center;">
                            <input type="radio" id="${questionId}_scale5" name="${questionId}_scale">
                            <label for="${questionId}_scale5">5</label>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'date':
            choicesHTML = `
                <input type="date" class="form-control">
            `;
            break;
    }
    
    previewQuestionChoices.innerHTML = choicesHTML;
    highlightElement(previewQuestionChoices);
}

// Add an option to a question
function addOption(questionId) {
    const questionEditor = document.querySelector(`.question-editor[data-question-id="${questionId}"]`);
    if (!questionEditor) return;
    
    const optionsContainer = questionEditor.querySelector('.question-options');
    if (!optionsContainer) return;
    
    // Create new option row
    const newOptionRow = document.createElement('div');
    newOptionRow.className = 'option-row';
    newOptionRow.innerHTML = `
        <input type="text" class="form-control" value="New Option" placeholder="Option text">
        <button class="option-action remove-option">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to options container
    optionsContainer.appendChild(newOptionRow);
    
    // Add event listener for remove button
    const removeButton = newOptionRow.querySelector('.remove-option');
    removeButton.addEventListener('click', function() {
        newOptionRow.remove();
        updatePreviewOptions(questionId);
        showToast('Option removed', 'info');
    });
    
    // Add event listener for text input
    const textInput = newOptionRow.querySelector('input');
    textInput.addEventListener('input', function() {
        updatePreviewOptions(questionId);
    });
    
    // Focus on the new option
    textInput.focus();
    textInput.select();
    
    // Update preview
    updatePreviewOptions(questionId);
    
    // Show toast notification
    showToast('Option added', 'success');
}

// Update preview options
function updatePreviewOptions(questionId) {
    const questionEditor = document.querySelector(`.question-editor[data-question-id="${questionId}"]`);
    const previewChoices = document.querySelector(`.preview-question-item[data-question-id="${questionId}"] .preview-question-choices`);
    
    if (!questionEditor || !previewChoices) return;
    
    const questionType = questionEditor.querySelector('.question-type-select').value;
    
    // Get all option values
    const optionValues = Array.from(
        questionEditor.querySelectorAll('.option-row input')
    ).map(input => input.value);
    
    let choicesHTML = '';
    
    switch (questionType) {
        case 'multiple-choice':
            choicesHTML = optionValues.map((option, index) => `
                <div class="preview-choice">
                    <input type="radio" id="${questionId}_option${index + 1}" name="${questionId}">
                    <label for="${questionId}_option${index + 1}">${option}</label>
                </div>
            `).join('');
            break;
            
        case 'checkbox':
            choicesHTML = optionValues.map((option, index) => `
                <div class="preview-choice">
                    <input type="checkbox" id="${questionId}_option${index + 1}">
                    <label for="${questionId}_option${index + 1}">${option}</label>
                </div>
            `).join('');
            break;
            
        case 'dropdown':
            choicesHTML = `
                <select class="form-control">
                    <option value="" selected disabled>Please select...</option>
                    ${optionValues.map((option, index) => `<option value="option${index + 1}">${option}</option>`).join('')}
                </select>
            `;
            break;
    }
    
    if (choicesHTML) {
        previewChoices.innerHTML = choicesHTML;
        highlightElement(previewChoices);
    }
}

// Duplicate a question
function duplicateQuestion(questionEditor) {
    const questionId = questionEditor.dataset.questionId;
    const newQuestionId = 'q' + Date.now();
    
    // Clone question editor
    const newQuestionEditor = questionEditor.cloneNode(true);
    newQuestionEditor.dataset.questionId = newQuestionId;
    
    // Insert after the original
    questionEditor.parentNode.insertBefore(newQuestionEditor, questionEditor.nextSibling);
    
    // Clone preview question
    const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
    if (!previewQuestion) return;
    
    const newPreviewQuestion = previewQuestion.cloneNode(true);
    newPreviewQuestion.dataset.questionId = newQuestionId;
    
    // Update IDs and names in the preview
    const inputs = newPreviewQuestion.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.id) input.id = input.id.replace(questionId, newQuestionId);
        if (input.name) input.name = input.name.replace(questionId, newQuestionId);
    });
    
    const labels = newPreviewQuestion.querySelectorAll('label');
    labels.forEach(label => {
        if (label.htmlFor) label.htmlFor = label.htmlFor.replace(questionId, newQuestionId);
    });
    
    // Insert after the original
    previewQuestion.parentNode.insertBefore(newPreviewQuestion, previewQuestion.nextSibling);
    
    // Setup event listeners for the duplicated question
    setupQuestionEditorListeners();
    
    // Highlight duplicated elements
    highlightElement(newQuestionEditor);
    highlightElement(newPreviewQuestion);
    
    // Scroll to the duplicated question
    newQuestionEditor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Show toast notification
    showToast('Question duplicated', 'success');
}

// Move a question up
function moveQuestionUp(questionEditor) {
    const questionId = questionEditor.dataset.questionId;
    const prevQuestion = questionEditor.previousElementSibling;
    
    if (!prevQuestion || !prevQuestion.classList.contains('question-editor')) return;
    
    const prevQuestionId = prevQuestion.dataset.questionId;
    
    // Move in editor
    questionEditor.parentNode.insertBefore(questionEditor, prevQuestion);
    
    // Move in preview
    const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
    const prevPreviewQuestion = document.querySelector(`.preview-question-item[data-question-id="${prevQuestionId}"]`);
    
    if (previewQuestion && prevPreviewQuestion) {
        previewQuestion.parentNode.insertBefore(previewQuestion, prevPreviewQuestion);
    }
    
    // Highlight moved elements
    highlightElement(questionEditor);
    highlightElement(previewQuestion);
    
    // Show toast notification
    showToast('Question moved up', 'info');
}

// Move a question down
function moveQuestionDown(questionEditor) {
    const questionId = questionEditor.dataset.questionId;
    const nextQuestion = questionEditor.nextElementSibling;
    
    if (!nextQuestion || !nextQuestion.classList.contains('question-editor')) return;
    
    const nextQuestionId = nextQuestion.dataset.questionId;
    
    // Move in editor
    nextQuestion.parentNode.insertBefore(nextQuestion, questionEditor);
    
    // Move in preview
    const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
    const nextPreviewQuestion = document.querySelector(`.preview-question-item[data-question-id="${nextQuestionId}"]`);
    
    if (previewQuestion && nextPreviewQuestion) {
        nextPreviewQuestion.parentNode.insertBefore(nextPreviewQuestion, previewQuestion);
    }
    
    // Highlight moved elements
    highlightElement(questionEditor);
    highlightElement(previewQuestion);
    
    // Show toast notification
    showToast('Question moved down', 'info');
}

// Save the form to the server
function saveForm() {
    // Show saving toast
    showToast('Saving form...', 'info');
    
    // Get form data
    const formTitle = document.getElementById('form-title').value;
    if (!formTitle || formTitle.trim() === '') {
        showToast('Please enter a form title', 'error');
        document.getElementById('form-title').focus();
        return;
    }
    
    const formDescription = document.getElementById('form-description').value;
    
    // Get form ID from URL if editing an existing form
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('form_id');
    
    // Get all questions
    const questions = Array.from(document.querySelectorAll('.question-editor')).map(questionEditor => {
        const questionId = questionEditor.dataset.questionId;
        const questionTitle = questionEditor.querySelector('.question-title-input').value;
        const questionType = questionEditor.querySelector('.question-type-select').value;
        
        // Get options if applicable
        let options = [];
        if (['multiple-choice', 'checkbox', 'dropdown'].includes(questionType)) {
            options = Array.from(
                questionEditor.querySelectorAll('.option-row input')
            ).map(input => input.value);
        }
        
        // For linear scale, get the scale range and labels
        let scaleOptions = {};
        if (questionType === 'linear-scale') {
            const scaleStart = questionEditor.querySelector('.scale-start')?.value || '1';
            const scaleEnd = questionEditor.querySelector('.scale-end')?.value || '5';
            const labels = Array.from(
                questionEditor.querySelectorAll('.form-control-group input')
            ).map(input => input.value);
            
            scaleOptions = {
                start: scaleStart,
                end: scaleEnd,
                lowLabel: labels[0] || 'Poor',
                highLabel: labels[1] || 'Excellent'
            };
        }
        
        return {
            id: questionId,
            title: questionTitle,
            type: questionType,
            options: options,
            scaleOptions: questionType === 'linear-scale' ? scaleOptions : undefined
        };
    });
    
    // Create form data object
    const formData = {
        title: formTitle,
        description: formDescription,
        questions: questions
    };
    
    // Determine if we're creating a new form or updating an existing one
    const isNewForm = !formId || formId === 'new';
    const url = isNewForm ? '/api/forms' : `/api/forms/${formId}`;
    const method = isNewForm ? 'POST' : 'PUT';
    
    console.log('Saving form data:', formData);
    console.log('Request URL:', url);
    console.log('Request method:', method);
    
    // Send the data to the server
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        console.log('Server response status:', response.status);
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Error response body:', text);
                throw new Error(`Server responded with status ${response.status}: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Form saved successfully:', data);
        showToast('Form saved successfully!', 'success');
        
        // Redirect back to forms page after a short delay
        setTimeout(() => {
            window.location.href = 'forms.html';
        }, 1000);
    })
    .catch(error => {
        console.error('Error saving form:', error);
        showToast('Error saving form: ' + error.message, 'error');
    });
}

// Add highlight effect to an element
function highlightElement(element) {
    if (!element) return;
    
    // Add highlight class
    element.classList.add('highlight-sync');
    
    // Remove after animation is done
    setTimeout(() => {
        element.classList.remove('highlight-sync');
    }, 1000);
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '1000';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.backgroundColor = type === 'error' ? '#f44336' : 
                                type === 'success' ? '#4caf50' : 
                                type === 'warning' ? '#ff9800' : '#2196f3';
    toast.style.color = 'white';
    toast.style.padding = '12px 16px';
    toast.style.marginTop = '10px';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    
    // Create icon based on type
    const icon = document.createElement('i');
    icon.className = type === 'error' ? 'fas fa-times-circle' : 
                   type === 'success' ? 'fas fa-check-circle' : 
                   type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';
    icon.style.marginRight = '8px';
    
    toast.appendChild(icon);
    toast.appendChild(document.createTextNode(message));
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Function to add a new question to the form
function addQuestion() {
    const questionCount = document.querySelectorAll('.question-editor').length + 1;
    const questionType = document.getElementById('question-type-select').value;
    
    const questionEditor = document.createElement('div');
    questionEditor.className = 'question-editor';
    questionEditor.dataset.questionId = questionCount;
    
    // Determine which input type to show based on the question type
    let optionsHtml = '';
    
    if (questionType === 'multiple-choice' || questionType === 'checkbox') {
        optionsHtml = `
            <div class="question-options">
                <div class="option-row" data-option-id="1">
                    <div class="d-flex align-items-center mb-2">
                        <input type="text" class="form-control option-text" placeholder="Option 1">
                        <button class="option-action remove-option ms-2" title="Remove Option"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div class="option-row" data-option-id="2">
                    <div class="d-flex align-items-center mb-2">
                        <input type="text" class="form-control option-text" placeholder="Option 2">
                        <button class="option-action remove-option ms-2" title="Remove Option"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <button type="button" class="btn btn-sm add-option mt-2" title="Add Another Option">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            </div>
        `;
    } else if (questionType === 'scale') {
        optionsHtml = `
            <div class="question-scale-options mt-3">
                <div class="row">
                    <div class="col-6">
                        <label>Minimum Label</label>
                        <input type="text" class="form-control scale-min-label" placeholder="e.g. Poor">
                    </div>
                    <div class="col-6">
                        <label>Maximum Label</label>
                        <input type="text" class="form-control scale-max-label" placeholder="e.g. Excellent">
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <label>Scale Range</label>
                        <select class="form-control scale-range">
                            <option value="5">1-5</option>
                            <option value="7">1-7</option>
                            <option value="10">1-10</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }
    
    questionEditor.innerHTML = `
        <div class="question-editor-header d-flex justify-content-between align-items-start">
            <div>
                <input type="text" class="question-title-input form-control" placeholder="Enter question text">
                <div class="question-editor-type">
                    <small>Type: <span>${questionType.replace('-', ' ')}</span></small>
                </div>
            </div>
            <div class="question-actions">
                <button class="btn btn-sm remove-question" title="Remove Question">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="question-editor-body">
            ${optionsHtml}
        </div>
    `;
    
    // Add the question to the editor
    document.getElementById('questions-container').appendChild(questionEditor);
    
    // Update the preview
    updatePreview();
    
    // Add event listeners to the new question
    addQuestionEventListeners(questionEditor);
    
    // Focus on the new question's title input
    questionEditor.querySelector('.question-title-input').focus();
}

// Function to update the form preview
function updatePreview() {
    const formTitle = document.getElementById('form-title').value || 'Untitled Form';
    const formDescription = document.getElementById('form-description').value || 'No description provided';
    
    // Update the form header in the preview
    document.getElementById('preview-title').textContent = formTitle;
    document.getElementById('preview-description').textContent = formDescription;
    
    // Clear existing questions in the preview
    const previewQuestionsContainer = document.getElementById('preview-questions');
    previewQuestionsContainer.innerHTML = '';
    
    // Add each question to the preview
    const questionEditors = document.querySelectorAll('.question-editor');
    questionEditors.forEach((editor, index) => {
        const questionTitle = editor.querySelector('.question-title-input').value || `Question ${index + 1}`;
        const questionType = editor.querySelector('.question-editor-type span').textContent;
        
        const questionElement = document.createElement('div');
        questionElement.className = 'preview-question mb-4';
        
        // Create different input types based on the question type
        let inputHtml = '';
        
        if (questionType === 'multiple choice') {
            const options = editor.querySelectorAll('.option-text');
            if (options.length > 0) {
                inputHtml = '<div class="form-group">';
                options.forEach((option, i) => {
                    const optionText = option.value || `Option ${i + 1}`;
                    inputHtml += `
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="question${index + 1}" id="q${index + 1}option${i + 1}">
                            <label class="form-check-label" for="q${index + 1}option${i + 1}">${optionText}</label>
                        </div>
                    `;
                });
                inputHtml += '</div>';
            }
        } else if (questionType === 'checkbox') {
            const options = editor.querySelectorAll('.option-text');
            if (options.length > 0) {
                inputHtml = '<div class="form-group">';
                options.forEach((option, i) => {
                    const optionText = option.value || `Option ${i + 1}`;
                    inputHtml += `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="question${index + 1}option${i + 1}" id="q${index + 1}option${i + 1}">
                            <label class="form-check-label" for="q${index + 1}option${i + 1}">${optionText}</label>
                        </div>
                    `;
                });
                inputHtml += '</div>';
            }
        } else if (questionType === 'paragraph') {
            inputHtml = `
                <div class="form-group">
                    <textarea class="form-control" rows="3" placeholder="Enter your answer"></textarea>
                </div>
            `;
        } else if (questionType === 'short answer') {
            inputHtml = `
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Enter your answer">
                </div>
            `;
        } else if (questionType === 'scale') {
            const scaleRange = editor.querySelector('.scale-range')?.value || 5;
            const minLabel = editor.querySelector('.scale-min-label')?.value || 'Low';
            const maxLabel = editor.querySelector('.scale-max-label')?.value || 'High';
            
            inputHtml = `
                <div class="form-group">
                    <div class="d-flex justify-content-between mb-2">
                        <span>${minLabel}</span>
                        <span>${maxLabel}</span>
                    </div>
                    <div class="d-flex justify-content-between">
            `;
            
            for (let i = 1; i <= scaleRange; i++) {
                inputHtml += `
                    <div class="form-check form-check-inline text-center">
                        <input class="form-check-input" type="radio" name="question${index + 1}" id="q${index + 1}scale${i}" value="${i}">
                        <label class="form-check-label d-block" for="q${index + 1}scale${i}">${i}</label>
                    </div>
                `;
            }
            
            inputHtml += `
                    </div>
                </div>
            `;
        }
        
        questionElement.innerHTML = `
            <div class="preview-question-header">
                <h5 class="mb-3">${questionTitle}</h5>
            </div>
            <div class="preview-question-body">
                ${inputHtml}
            </div>
        `;
        
        previewQuestionsContainer.appendChild(questionElement);
    });
    
    // Add submit button if there are questions
    if (questionEditors.length > 0) {
        const submitButton = document.createElement('button');
        submitButton.type = 'button';
        submitButton.className = 'btn btn-primary preview-submit-btn';
        submitButton.textContent = 'Submit';
        previewQuestionsContainer.appendChild(submitButton);
    }
    
    // Add form footer to the preview
    ensureFormFooterExists();
}

// Function to ensure the form footer exists
function ensureFormFooterExists() {
    const formPreview = document.getElementById('form-preview');
    if (formPreview) {
        let footerElement = formPreview.querySelector('.form-footer');
        if (!footerElement) {
            footerElement = document.createElement('div');
            footerElement.className = 'form-footer';
            footerElement.innerHTML = `<p>© ${new Date().getFullYear()} MonumeVIP - All rights reserved</p>`;
            formPreview.appendChild(footerElement);
        }
    }
}

// Helper function to add consistent footer to forms
function addFormFooter(formPreview) {
    if (!formPreview) return;
    
    let footerElement = formPreview.querySelector('.form-footer');
    if (!footerElement) {
        footerElement = document.createElement('div');
        footerElement.className = 'form-footer';
        footerElement.innerHTML = `<p>© ${new Date().getFullYear()} MonumeVIP - All rights reserved</p>`;
        formPreview.appendChild(footerElement);
    } else {
        // Update the year in case it's outdated
        const footerText = footerElement.querySelector('p');
        if (footerText) {
            footerText.innerHTML = `© ${new Date().getFullYear()} MonumeVIP - All rights reserved`;
        }
    }
}

// Load an empty form without any default questions
function loadEmptyForm(title, description) {
    // Update form title and description
    document.getElementById('form-title').value = title;
    document.getElementById('form-description').value = description;
    
    // Update the preview
    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-description').textContent = description;
    
    // Add the form footer to the preview
    const formPreview = document.getElementById('form-preview');
    if (formPreview) {
        addFormFooter(formPreview);
    }
    
    // Clear any existing questions (just to be safe)
    const editorPanel = document.getElementById('editor-panel');
    const questionsToRemove = document.querySelectorAll('.question-editor');
    questionsToRemove.forEach(q => q.remove());
    
    // Clear preview questions
    const previewQuestionsToRemove = document.querySelectorAll('.preview-question-item');
    previewQuestionsToRemove.forEach(q => q.remove());
    
    showToast('Empty form created. Add questions using the button below.', 'info');
}

// Function to load a sample form into the editor - keeping this for backward compatibility
function loadSampleForm(title, description) {
    // Just call loadEmptyForm now to create an empty form without questions
    loadEmptyForm(title, description);
}