// Form Editor JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadFormDataFromStorage();
    initializeFormEditor();
    
    // Use event delegation to handle the "Add New Question" button click
    // This ensures the handler works even if the button is recreated
    document.addEventListener('click', function(event) {
        if (event.target && (event.target.id === 'add-question-btn' || 
            (event.target.parentElement && event.target.parentElement.id === 'add-question-btn'))) {
            console.log('Add question button clicked via delegation');
            addNewQuestion();
        }
    });
    
    console.log('Form editor initialized with event delegation');
});

// Function to load form data from localStorage based on URL parameters
function loadFormDataFromStorage() {
    // Get the form ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id') || urlParams.get('form_id');
    
    console.log('Form ID from URL:', formId);
    
    if (!formId) {
        console.log('No form ID provided in URL - creating a new form');
        // Set default values for a new form
        document.title = 'Create New Form - MonuMe Tracker';
        
        // Update form page header if it exists
        const headerTitle = document.querySelector('.form-page-header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Create New Form';
        }
        
        return;
    }
    
    console.log('Attempting to load form with ID:', formId);
    
    // Try to load the form data from localStorage
    try {
        const savedFormsJSON = localStorage.getItem('monume_forms');
        if (savedFormsJSON) {
            // Parse the JSON data
            let savedForms = JSON.parse(savedFormsJSON);
            
            // Handle different data structures - normalize to an array
            if (savedForms.forms && Array.isArray(savedForms.forms)) {
                // We have a {forms: [...]} structure
                savedForms = savedForms.forms;
            } else if (!Array.isArray(savedForms)) {
                // If it's not an array and doesn't have forms property, convert to array
                savedForms = [savedForms];
            }
            
            console.log('All forms found in localStorage:', savedForms);
            
            // Find the specific form by ID
            const formData = savedForms.find(form => String(form.id) === String(formId));
            
            if (formData) {
                console.log('Form found:', formData);
                
                // Populate form title and description
                document.getElementById('form-title').value = formData.title || '';
                document.getElementById('form-description').value = formData.description || '';
                
                // Set form category if available
                if (formData.category) {
                    const categorySelect = document.getElementById('form-category');
                    if (categorySelect) {
                        // Try to select the matching option
                        const option = Array.from(categorySelect.options).find(opt => opt.value === formData.category);
                        if (option) {
                            categorySelect.value = formData.category;
                        } else {
                            // If category is not in the predefined list, select "other"
                            categorySelect.value = 'other';
                        }
                    }
                }
                
                // Update page title to include form name
                document.title = `Edit: ${formData.title} - MonuMe Tracker`;
                
                // Update form page header
                const headerTitle = document.querySelector('.form-page-header h1');
                if (headerTitle) {
                    headerTitle.textContent = `Edit: ${formData.title}`;
                }
                
                // Update preview title and description
                const previewTitle = document.getElementById('preview-title');
                if (previewTitle) {
                    previewTitle.textContent = formData.title || '';
                }
                
                const previewDescription = document.getElementById('preview-description');
                if (previewDescription) {
                    previewDescription.textContent = formData.description || '';
                }
                
                // Store the current form ID in a hidden field or data attribute for reference
                const formEditor = document.getElementById('form-editor') || document.getElementById('editor-panel');
                if (formEditor) {
                    formEditor.dataset.formId = formId;
                } else {
                    // If form-editor element doesn't exist, create a hidden input to store the ID
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.id = 'current-form-id';
                    hiddenInput.value = formId;
                    document.body.appendChild(hiddenInput);
                }
                
                // If we have questions data, load those too
                if (formData.questions) {
                    let questionsToLoad;
                    
                    if (Array.isArray(formData.questions)) {
                        questionsToLoad = formData.questions;
                    } else if (typeof formData.questions === 'string') {
                        // Handle case where questions are stored as JSON string
                        try {
                            questionsToLoad = JSON.parse(formData.questions);
                        } catch (e) {
                            console.error('Error parsing questions JSON:', e);
                            questionsToLoad = [];
                        }
                    }
                    
                    if (questionsToLoad && questionsToLoad.length > 0) {
                        loadFormQuestions(questionsToLoad);
                    }
                }
                
                console.log('Form data loaded successfully for ID:', formId);
                showNotification('Form loaded successfully', 'success');
            } else {
                console.error('Form not found with ID:', formId);
                showNotification('Form not found. Creating a new form instead.', 'info');
                
                // Handle case where form ID doesn't exist by redirecting to create a new form
                setTimeout(() => {
                    window.location.href = 'edit_form.html';
                }, 1500);
            }
        } else {
            console.error('No saved forms found in localStorage');
            showNotification('No saved forms found. Creating a new form.', 'info');
        }
    } catch (error) {
        console.error('Error loading form data:', error);
        showNotification('Error loading form data: ' + error.message, 'error');
    }
}

// Function to load questions from form data
function loadFormQuestions(questions) {
    console.log('Loading questions:', questions);
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        console.log('No questions to load');
        return;
    }
    
    // Get the editor panel and the preview form
    const editorPanel = document.getElementById('editor-panel');
    const formPreview = document.getElementById('form-preview');
    
    if (!editorPanel || !formPreview) {
        console.error('Required elements not found: editorPanel or formPreview');
        return;
    }
    
    // Find the add question section and submit button for proper positioning
    const addQuestionSection = document.querySelector('.add-question-section');
    const submitBtn = formPreview.querySelector('.preview-submit-btn');
    
    if (!addQuestionSection || !submitBtn) {
        console.error('Required elements not found: addQuestionSection or submitBtn');
        return;
    }
    
    // Clear any existing questions
    const existingQuestions = editorPanel.querySelectorAll('.question-editor');
    existingQuestions.forEach(question => question.remove());
    
    const existingPreviewQuestions = formPreview.querySelectorAll('.preview-question-item');
    existingPreviewQuestions.forEach(question => question.remove());
    
    // Add each question to the editor and preview
    questions.forEach(question => {
        // Create a unique ID if the question doesn't have one
        const questionId = question.id || 'q' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        
        // Add the question to the editor
        addQuestionToEditor(question, questionId, editorPanel, addQuestionSection, formPreview, submitBtn);
    });
    
    // Set up event listeners for all questions
    setupQuestionEditorListeners();
    
    console.log('Questions loaded successfully');
    showNotification('Form questions loaded', 'success');
}

// Function to add a question to the editor
function addQuestionToEditor(question, questionId, editorPanel, addQuestionSection, formPreview, submitBtn) {
    const questionType = question.type || 'multiple-choice';
    const questionTitle = question.title || 'New Question';
    
    // Create question editor HTML
    let optionsHTML = '';
    let previewOptionsHTML = '';
    
    switch (questionType) {
        case 'multiple-choice':
        case 'checkbox':
        case 'dropdown':
            // Generate options HTML
            const options = question.options || ['Option 1', 'Option 2'];
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
        case 'text':
            optionsHTML = `<p class="text-muted">This question allows users to enter a short text response.</p>`;
            previewOptionsHTML = `<input type="text" class="form-control" placeholder="Short answer text">`;
            break;
            
        case 'long-text':
        case 'paragraph':
            optionsHTML = `<p class="text-muted">This question allows users to enter a long text response.</p>`;
            previewOptionsHTML = `<textarea class="form-control" rows="4" placeholder="Long answer text"></textarea>`;
            break;
            
        case 'linear-scale':
        case 'scale':
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
                            <option value="short-text" ${(questionType === 'short-text' || questionType === 'text') ? 'selected' : ''}>Short Text</option>
                            <option value="long-text" ${(questionType === 'long-text' || questionType === 'paragraph') ? 'selected' : ''}>Long Text</option>
                            <option value="dropdown" ${questionType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
                            <option value="linear-scale" ${(questionType === 'linear-scale' || questionType === 'scale') ? 'selected' : ''}>Linear Scale</option>
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
    const tempElement = document.createElement('div');
    tempElement.innerHTML = questionEditorHTML;
    const questionEditorElement = tempElement.firstElementChild;
    
    // Insert before the add question section
    if (addQuestionSection) {
        editorPanel.insertBefore(questionEditorElement, addQuestionSection);
    } else {
        editorPanel.appendChild(questionEditorElement);
    }
    
    // Add to preview
    const tempPreviewElement = document.createElement('div');
    tempPreviewElement.innerHTML = previewQuestionHTML;
    const previewQuestionElement = tempPreviewElement.firstElementChild;
    
    // Insert before the submit button
    if (submitBtn) {
        formPreview.insertBefore(previewQuestionElement, submitBtn);
    } else {
        formPreview.appendChild(previewQuestionElement);
    }
    
    // Set up event listeners for this question
    setupQuestionListeners(questionId);
}

// Function to get icon for question type
function getQuestionTypeIcon(questionType) {
    switch (questionType) {
        case 'multiple-choice':
            return 'fas fa-list-ul';
        case 'checkbox':
            return 'fas fa-check-square';
        case 'short-text':
        case 'text':
            return 'fas fa-font';
        case 'long-text':
        case 'paragraph':
            return 'fas fa-paragraph';
        case 'dropdown':
            return 'fas fa-caret-square-down';
        case 'linear-scale':
        case 'scale':
            return 'fas fa-sliders-h';
        case 'date':
            return 'fas fa-calendar-alt';
        default:
            return 'fas fa-question-circle';
    }
}

// Function to set up listeners for question editor
function setupQuestionEditorListeners() {
    // For each question, set up listeners
    document.querySelectorAll('.question-editor').forEach(questionEditor => {
        const questionId = questionEditor.getAttribute('data-question-id');
        setupQuestionListeners(questionId);
    });

    // No need to set up the add question button here since we're using event delegation
    console.log('Question editor listeners set up');
}

// Function to set up listeners for a specific question
function setupQuestionListeners(questionId) {
    const questionEditor = document.querySelector(`.question-editor[data-question-id="${questionId}"]`);
    
    if (!questionEditor) {
        console.error(`Question editor with ID ${questionId} not found`);
        return;
    }
    
    // Title input change
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
    
    // Type select change
    const typeSelect = questionEditor.querySelector('.question-type-select');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            updateQuestionType(questionId, this.value);
        });
    }
    
    // Delete button
    const deleteBtn = questionEditor.querySelector('.delete-question');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
            
            questionEditor.remove();
            
            if (previewQuestion) {
                previewQuestion.remove();
            }
        });
    }
    
    // Duplicate button
    const duplicateBtn = questionEditor.querySelector('.duplicate-question');
    if (duplicateBtn) {
        duplicateBtn.addEventListener('click', function() {
            duplicateQuestion(questionEditor);
        });
    }
    
    // Move buttons
    const moveUpBtn = questionEditor.querySelector('.move-question-up');
    if (moveUpBtn) {
        moveUpBtn.addEventListener('click', function() {
            moveQuestionUp(questionEditor);
        });
    }
    
    const moveDownBtn = questionEditor.querySelector('.move-question-down');
    if (moveDownBtn) {
        moveDownBtn.addEventListener('click', function() {
            moveQuestionDown(questionEditor);
        });
    }
    
    // Add option button
    const addOptionBtn = questionEditor.querySelector('.add-option-btn');
    if (addOptionBtn) {
        addOptionBtn.addEventListener('click', function() {
            addOption(questionId);
        });
    }
    
    // Remove option buttons
    const removeOptionBtns = questionEditor.querySelectorAll('.remove-option');
    removeOptionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const optionRow = this.closest('.option-row');
            optionRow.remove();
            updatePreviewOptions(questionId);
        });
    });
    
    // Option inputs
    const optionInputs = questionEditor.querySelectorAll('.option-row input');
    optionInputs.forEach(input => {
        input.addEventListener('input', function() {
            updatePreviewOptions(questionId);
        });
    });
}

// Function to add a new question to the form
function addNewQuestion() {
    console.log('Adding new question');
    
    const editorPanel = document.getElementById('editor-panel');
    const formPreview = document.getElementById('form-preview');
    
    if (!editorPanel || !formPreview) {
        console.error('Editor panel or form preview not found');
        return;
    }
    
    // Get the add question section and submit button
    const addQuestionSection = document.querySelector('.add-question-section');
    const submitBtn = formPreview.querySelector('.preview-submit-btn');
    
    if (!addQuestionSection) {
        console.error('Add question section not found');
        return;
    }
    
    // Generate a unique ID for the new question
    const questionId = 'q' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    // Create a default question
    const question = {
        type: 'multiple-choice',
        title: 'New Question',
        options: ['Option 1', 'Option 2']
    };
    
    // Add the question to the editor
    addQuestionToEditor(question, questionId, editorPanel, addQuestionSection, formPreview, submitBtn);
    
    // Highlight the new question
    const newQuestionEditor = document.querySelector(`.question-editor[data-question-id="${questionId}"]`);
    const newQuestionPreview = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
    
    if (newQuestionEditor) {
        highlightElement(newQuestionEditor);
        newQuestionEditor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    if (newQuestionPreview) {
        highlightElement(newQuestionPreview);
        setTimeout(() => {
            newQuestionPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
    
    console.log('New question added with ID:', questionId);
}

// Function to highlight an element briefly
function highlightElement(element) {
    element.classList.add('highlight-sync');
    setTimeout(() => {
        element.classList.remove('highlight-sync');
    }, 1000);
}

// Functions for question manipulation
function updateQuestionType(questionId, type) {
    console.log('Updating question type for', questionId, 'to', type);
    
    const questionEditor = document.querySelector(`.question-editor[data-question-id="${questionId}"]`);
    const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
    
    if (!questionEditor || !previewQuestion) {
        console.error('Question elements not found for ID:', questionId);
        return;
    }
    
    // Update icon in editor
    const typeIcon = questionEditor.querySelector('.question-editor-type i');
    if (typeIcon) {
        typeIcon.className = getQuestionTypeIcon(type);
    }
    
    // Get current question title
    const questionTitle = questionEditor.querySelector('.question-title-input').value;
    
    // Create new HTML for the question editor body
    let optionsHTML = '';
    
    switch (type) {
        case 'multiple-choice':
        case 'checkbox':
        case 'dropdown':
            // Get existing options or use defaults
            let options = [];
            const optionInputs = questionEditor.querySelectorAll('.option-row input');
            
            if (optionInputs.length > 0) {
                options = Array.from(optionInputs).map(input => input.value);
            } else {
                options = ['Option 1', 'Option 2'];
            }
            
            optionsHTML = `
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
        case 'text':
            optionsHTML = `<p class="text-muted">This question allows users to enter a short text response.</p>`;
            break;
            
        case 'long-text':
        case 'paragraph':
            optionsHTML = `<p class="text-muted">This question allows users to enter a long text response.</p>`;
            break;
            
        case 'linear-scale':
        case 'scale':
            optionsHTML = `
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
            optionsHTML = `<p class="text-muted">This question allows users to select a date.</p>`;
            break;
    }
    
    // Update the editor body
    const questionEditorBody = questionEditor.querySelector('.question-editor-body');
    if (questionEditorBody) {
        questionEditorBody.innerHTML = optionsHTML;
    }
    
    // Create new HTML for the preview question
    let previewOptionsHTML = '';
    
    switch (type) {
        case 'multiple-choice':
            const mcOptions = Array.from(questionEditor.querySelectorAll('.option-row input')).map(input => input.value);
            previewOptionsHTML = mcOptions.map((option, index) => `
                <div class="preview-choice">
                    <input type="radio" id="${questionId}_option${index + 1}" name="${questionId}">
                    <label for="${questionId}_option${index + 1}">${option}</label>
                </div>
            `).join('');
            break;
            
        case 'checkbox':
            const cbOptions = Array.from(questionEditor.querySelectorAll('.option-row input')).map(input => input.value);
            previewOptionsHTML = cbOptions.map((option, index) => `
                <div class="preview-choice">
                    <input type="checkbox" id="${questionId}_option${index + 1}">
                    <label for="${questionId}_option${index + 1}">${option}</label>
                </div>
            `).join('');
            break;
            
        case 'dropdown':
            const ddOptions = Array.from(questionEditor.querySelectorAll('.option-row input')).map(input => input.value);
            previewOptionsHTML = `
                <select class="form-control">
                    <option value="" selected disabled>Please select...</option>
                    ${ddOptions.map((option, index) => `<option value="option${index + 1}">${option}</option>`).join('')}
                </select>
            `;
            break;
            
        case 'short-text':
        case 'text':
            previewOptionsHTML = `<input type="text" class="form-control" placeholder="Short answer text">`;
            break;
            
        case 'long-text':
        case 'paragraph':
            previewOptionsHTML = `<textarea class="form-control" rows="4" placeholder="Long answer text"></textarea>`;
            break;
            
        case 'linear-scale':
        case 'scale':
            const scaleStart = 1;
            const scaleEnd = 5;
            const lowLabel = 'Poor';
            const highLabel = 'Excellent';
            
            previewOptionsHTML = `
                <div style="padding: 15px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>${lowLabel}</span>
                        <span>${highLabel}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        ${Array.from({length: scaleEnd - scaleStart + 1}, (_, i) => {
                            const value = scaleStart + i;
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
            previewOptionsHTML = `<input type="date" class="form-control">`;
            break;
    }
    
    // Update the preview question choices
    const previewChoices = previewQuestion.querySelector('.preview-question-choices');
    if (previewChoices) {
        previewChoices.innerHTML = previewOptionsHTML;
    }
    
    // Set up event listeners for new elements
    setupQuestionListeners(questionId);
    
    console.log('Question type updated for', questionId, 'to', type);
}

function addOption(questionId) {
    console.log('Adding option to question', questionId);
    
    const questionEditor = document.querySelector(`.question-editor[data-question-id="${questionId}"]`);
    if (!questionEditor) {
        console.error('Question editor not found for ID:', questionId);
        return;
    }
    
    const optionsContainer = questionEditor.querySelector('.question-options');
    if (!optionsContainer) {
        console.error('Options container not found for question:', questionId);
        return;
    }
    
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
    
    // Add event listeners
    const newInput = newOptionRow.querySelector('input');
    newInput.addEventListener('input', function() {
        updatePreviewOptions(questionId);
    });
    
    const removeBtn = newOptionRow.querySelector('.remove-option');
    removeBtn.addEventListener('click', function() {
        newOptionRow.remove();
        updatePreviewOptions(questionId);
    });
    
    // Focus the new input
    newInput.focus();
    newInput.select();
    
    // Update preview
    updatePreviewOptions(questionId);
    
    console.log('Option added to question', questionId);
}

function updatePreviewOptions(questionId) {
    console.log('Updating preview options for question', questionId);
    
    const questionEditor = document.querySelector(`.question-editor[data-question-id="${questionId}"]`);
    const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
    
    if (!questionEditor || !previewQuestion) {
        console.error('Question elements not found for ID:', questionId);
        return;
    }
    
    // Get the question type
    const questionType = questionEditor.querySelector('.question-type-select').value;
    
    // Get the preview choices container
    const previewChoices = previewQuestion.querySelector('.preview-question-choices');
    if (!previewChoices) {
        console.error('Preview choices container not found for question:', questionId);
        return;
    }
    
    // Update based on question type
    switch (questionType) {
        case 'multiple-choice':
            // Get all options from editor
            const mcOptions = Array.from(questionEditor.querySelectorAll('.option-row input')).map(input => input.value);
            
            // Create preview HTML
            const mcHTML = mcOptions.map((option, index) => `
                <div class="preview-choice">
                    <input type="radio" id="${questionId}_option${index + 1}" name="${questionId}">
                    <label for="${questionId}_option${index + 1}">${option}</label>
                </div>
            `).join('');
            
            // Update preview
            previewChoices.innerHTML = mcHTML;
            break;
            
        case 'checkbox':
            // Get all options from editor
            const cbOptions = Array.from(questionEditor.querySelectorAll('.option-row input')).map(input => input.value);
            
            // Create preview HTML
            const cbHTML = cbOptions.map((option, index) => `
                <div class="preview-choice">
                    <input type="checkbox" id="${questionId}_option${index + 1}">
                    <label for="${questionId}_option${index + 1}">${option}</label>
                </div>
            `).join('');
            
            // Update preview
            previewChoices.innerHTML = cbHTML;
            break;
            
        case 'dropdown':
            // Get all options from editor
            const ddOptions = Array.from(questionEditor.querySelectorAll('.option-row input')).map(input => input.value);
            
            // Create preview HTML
            const ddHTML = `
                <select class="form-control">
                    <option value="" selected disabled>Please select...</option>
                    ${ddOptions.map((option, index) => `<option value="option${index + 1}">${option}</option>`).join('')}
                </select>
            `;
            
            // Update preview
            previewChoices.innerHTML = ddHTML;
            break;
    }
    
    // Highlight the updated preview
    highlightElement(previewChoices);
    
    console.log('Preview options updated for question', questionId);
}

function moveQuestionUp(questionEditor) {
    console.log('Moving question up');
    
    if (!questionEditor) {
        console.error('Question editor not provided');
        return;
    }
    
    // Get the question ID
    const questionId = questionEditor.getAttribute('data-question-id');
    
    // Get the previous question
    const prevQuestion = questionEditor.previousElementSibling;
    
    // Skip if no previous question or if previous is not a question
    if (!prevQuestion || !prevQuestion.classList.contains('question-editor')) {
        console.log('No previous question to move before');
        return;
    }
    
    // Get the preview elements
    const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
    const prevPreviewQuestion = document.querySelector(`.preview-question-item[data-question-id="${prevQuestion.getAttribute('data-question-id')}"]`);
    
    // Move in editor
    prevQuestion.before(questionEditor);
    
    // Move in preview if both elements exist
    if (previewQuestion && prevPreviewQuestion) {
        prevPreviewQuestion.before(previewQuestion);
    }
    
    // Highlight both moved elements
    highlightElement(questionEditor);
    if (previewQuestion) {
        highlightElement(previewQuestion);
    }
    
    console.log('Question moved up');
}

function moveQuestionDown(questionEditor) {
    console.log('Moving question down');
    
    if (!questionEditor) {
        console.error('Question editor not provided');
        return;
    }
    
    // Get the question ID
    const questionId = questionEditor.getAttribute('data-question-id');
    
    // Get the next question
    const nextQuestion = questionEditor.nextElementSibling;
    
    // Skip if no next question or if next is not a question
    if (!nextQuestion || !nextQuestion.classList.contains('question-editor')) {
        console.log('No next question to move after');
        return;
    }
    
    // Get the preview elements
    const previewQuestion = document.querySelector(`.preview-question-item[data-question-id="${questionId}"]`);
    const nextPreviewQuestion = document.querySelector(`.preview-question-item[data-question-id="${nextQuestion.getAttribute('data-question-id')}"]`);
    
    // Move in editor
    nextQuestion.after(questionEditor);
    
    // Move in preview if both elements exist
    if (previewQuestion && nextPreviewQuestion) {
        nextPreviewQuestion.after(previewQuestion);
    }
    
    // Highlight both moved elements
    highlightElement(questionEditor);
    if (previewQuestion) {
        highlightElement(previewQuestion);
    }
    
    console.log('Question moved down');
}

function duplicateQuestion(questionEditor) {
    console.log('Duplicating question');
    
    if (!questionEditor) {
        console.error('Question editor not provided');
        return;
    }
    
    // Get form elements
    const editorPanel = document.getElementById('editor-panel');
    const formPreview = document.getElementById('form-preview');
    const addQuestionSection = document.querySelector('.add-question-section');
    const submitBtn = formPreview.querySelector('.preview-submit-btn');
    
    if (!editorPanel || !formPreview) {
        console.error('Editor panel or form preview not found');
        return;
    }
    
    // Generate new ID for the duplicated question
    const newQuestionId = 'q' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    // Get the data from the original question
    const originalQuestionId = questionEditor.getAttribute('data-question-id');
    const questionTitle = questionEditor.querySelector('.question-title-input').value;
    const questionType = questionEditor.querySelector('.question-type-select').value;
    
    let options = [];
    if (['multiple-choice', 'checkbox', 'dropdown'].includes(questionType)) {
        options = Array.from(questionEditor.querySelectorAll('.option-row input')).map(input => input.value);
    }
    
    // Create a question object
    const question = {
        title: questionTitle,
        type: questionType,
        options: options
    };
    
    // Add the duplicated question after the original
    const newQuestionEditor = addQuestionToEditor(question, newQuestionId, editorPanel, addQuestionSection, formPreview, submitBtn);
    
    // Move the new question after the original
    const originalQuestion = document.querySelector(`.question-editor[data-question-id="${originalQuestionId}"]`);
    if (originalQuestion) {
        originalQuestion.after(newQuestionEditor);
    }
    
    // Get the preview elements
    const originalPreviewQuestion = document.querySelector(`.preview-question-item[data-question-id="${originalQuestionId}"]`);
    const newPreviewQuestion = document.querySelector(`.preview-question-item[data-question-id="${newQuestionId}"]`);
    
    // Move the new preview question after the original
    if (originalPreviewQuestion && newPreviewQuestion) {
        originalPreviewQuestion.after(newPreviewQuestion);
    }
    
    // Highlight the new elements
    highlightElement(newQuestionEditor);
    highlightElement(newPreviewQuestion);
    
    console.log('Question duplicated with new ID:', newQuestionId);
    return newQuestionEditor;
}

// Function to show notifications
function showNotification(message, type) {
    console.log(`Notification (${type}):`, message);
    
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.padding = '12px 20px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : 
                                       type === 'error' ? '#F44336' :
                                       type === 'warning' ? '#FF9800' : '#2196F3';
    notification.style.color = 'white';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.minWidth = '250px';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';
    
    // Add icon based on notification type
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-times-circle' :
                    type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';
    icon.style.marginRight = '10px';
    
    notification.appendChild(icon);
    notification.appendChild(document.createTextNode(message));
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode === notificationContainer) {
                notificationContainer.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize the form editor on page load (this is called from the DOMContentLoaded event)
function initializeFormEditor() {
    console.log('Initializing form editor');
    
    // Attach form event handlers
    document.getElementById('save-form-btn')?.addEventListener('click', saveForm);
    document.getElementById('cancel-btn')?.addEventListener('click', function() {
        window.location.href = 'forms.html';
    });
    
    // Set up title and description sync
    const formTitle = document.getElementById('form-title');
    const formDescription = document.getElementById('form-description');
    const previewTitle = document.getElementById('preview-title');
    const previewDescription = document.getElementById('preview-description');
    
    if (formTitle && previewTitle) {
        formTitle.addEventListener('input', function() {
            previewTitle.textContent = this.value;
            highlightElement(previewTitle);
        });
    }
    
    if (formDescription && previewDescription) {
        formDescription.addEventListener('input', function() {
            previewDescription.textContent = this.value;
            highlightElement(previewDescription);
        });
    }
    
    // No need to set up the add question button here since we're using event delegation
    console.log('Form editor initialized with title/description sync');
    
    // Setup listeners for existing questions
    setupQuestionEditorListeners();
}

// Save form function
function saveForm() {
    console.log('Saving form');
    
    // Get form metadata
    const formTitle = document.getElementById('form-title').value;
    const formDescription = document.getElementById('form-description').value;
    const formCategory = document.getElementById('form-category').value;
    
    // Check if we're editing an existing form
    const formId = document.getElementById('current-form-id')?.value || 
                  document.getElementById('editor-panel')?.dataset.formId ||
                  new Date().getTime().toString();
    
    // Get all questions
    const questions = [];
    document.querySelectorAll('.question-editor').forEach(questionEditor => {
        const questionId = questionEditor.getAttribute('data-question-id');
        const questionTitle = questionEditor.querySelector('.question-title-input').value;
        const questionType = questionEditor.querySelector('.question-type-select').value;
        
        let options = [];
        if (['multiple-choice', 'checkbox', 'dropdown'].includes(questionType)) {
            options = Array.from(questionEditor.querySelectorAll('.option-row input')).map(input => input.value);
        }
        
        let scaleOptions = {};
        if (questionType === 'linear-scale' || questionType === 'scale') {
            const start = questionEditor.querySelector('.scale-start')?.value || '1';
            const end = questionEditor.querySelector('.scale-end')?.value || '5';
            const lowLabel = questionEditor.querySelector('.form-control-group input:first-child')?.value || 'Poor';
            const highLabel = questionEditor.querySelector('.form-control-group input:last-child')?.value || 'Excellent';
            
            scaleOptions = { start, end, lowLabel, highLabel };
        }
        
        questions.push({
            id: questionId,
            title: questionTitle,
            type: questionType,
            options: options,
            scaleOptions: Object.keys(scaleOptions).length > 0 ? scaleOptions : undefined
        });
    });
    
    // Create form data object
    const formData = {
        id: formId,
        title: formTitle,
        description: formDescription,
        category: formCategory,
        questions: questions,
        created_at: new Date().getTime(),
        updated_at: new Date().getTime()
    };
    
    // Save to localStorage
    saveFormToLocalStorage(formData);
}

// Function to save form to localStorage
function saveFormToLocalStorage(formData) {
    try {
        // Get existing forms from localStorage
        const savedFormsJSON = localStorage.getItem('monume_forms');
        let savedForms = [];
        
        if (savedFormsJSON) {
            savedForms = JSON.parse(savedFormsJSON);
            
            // Handle different data structures
            if (savedForms.forms && Array.isArray(savedForms.forms)) {
                savedForms = savedForms.forms;
            } else if (!Array.isArray(savedForms)) {
                savedForms = [savedForms];
            }
        }
        
        // Check if we're updating an existing form
        const existingFormIndex = savedForms.findIndex(f => String(f.id) === String(formData.id));
        
        if (existingFormIndex >= 0) {
            // Update existing form
            savedForms[existingFormIndex] = {
                ...savedForms[existingFormIndex],
                ...formData,
                questions: formData.questions, // Make sure to replace questions array completely
                updated_at: new Date().toISOString()
            };
        } else {
            // Add new form
            savedForms.push(formData);
        }
        
        // Save back to localStorage
        localStorage.setItem('monume_forms', JSON.stringify(savedForms));
        
        // Show success message
        showNotification('Form saved successfully!', 'success');
        
        // Redirect to forms page after a short delay
        setTimeout(() => {
            window.location.href = 'forms.html';
        }, 1500);
    } catch (error) {
        console.error('Error saving form:', error);
        showNotification('Error saving form: ' + error.message, 'error');
    }
}

// Filter settings modal functionality - UPDATED FOR SYNC WITH FORMS.HTML
document.addEventListener('DOMContentLoaded', function() {
    // Filter settings elements
    const filterSettingsBtn = document.getElementById('filterSettingsBtn');
    const filterSettingsModal = document.getElementById('filterSettingsModal');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');
    const addFilterBtn = document.getElementById('addFilterBtn');
    const newFilterNameInput = document.getElementById('newFilterName');
    const filterList = document.getElementById('filterList');
    const saveFiltersBtn = document.getElementById('saveFiltersBtn');
    
    // Default filters that cannot be removed - match forms.html
    const defaultFilters = ['all', 'recent'];
    
    // Check if elements exist before adding event listeners
    if (filterSettingsBtn) {
        // Open filter settings modal
        filterSettingsBtn.addEventListener('click', function() {
            filterSettingsModal.style.display = 'flex';
            loadCurrentFilters();
        });
    }
    
    // Close modal when clicking on close buttons
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterSettingsModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === filterSettingsModal) {
            filterSettingsModal.style.display = 'none';
        }
    });
    
    // Add new filter
    if (addFilterBtn && newFilterNameInput) {
        addFilterBtn.addEventListener('click', function() {
            const filterName = newFilterNameInput.value.trim().toLowerCase();
            if (filterName) {
                addNewFilter(filterName);
                newFilterNameInput.value = ''; // Clear input field
            }
        });
        
        // Add filter when pressing enter in input field
        newFilterNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const filterName = newFilterNameInput.value.trim().toLowerCase();
                if (filterName) {
                    addNewFilter(filterName);
                    newFilterNameInput.value = '';
                }
            }
        });
    }
    
    // Save filters button
    if (saveFiltersBtn) {
        saveFiltersBtn.addEventListener('click', function() {
            saveFilters();
            filterSettingsModal.style.display = 'none';
            showNotification('Filter settings saved successfully', 'success');
        });
    }
    
    function loadCurrentFilters() {
        // Clear existing filters
        if (filterList) {
            filterList.innerHTML = '';
            
            // Get filters from localStorage or use defaults - use the same key as forms.html
            let customFilters = [];
            try {
                const savedFilters = localStorage.getItem('customFormFilters');
                if (savedFilters) {
                    customFilters = JSON.parse(savedFilters);
                } else {
                    // Default filters - match forms.html
                    customFilters = ['feedback', 'survey'];
                    localStorage.setItem('customFormFilters', JSON.stringify(customFilters));
                }
            } catch (error) {
                console.error('Error loading filters:', error);
                // Use default filters if error occurs
                customFilters = ['feedback', 'survey'];
                localStorage.setItem('customFormFilters', JSON.stringify(customFilters));
            }
            
            // Add default filters that cannot be removed
            defaultFilters.forEach(filter => {
                const filterItem = document.createElement('div');
                filterItem.className = 'filter-item default';
                filterItem.innerHTML = `
                    <span>${filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
                    <button class="remove-filter" data-filter="${filter}" disabled>
                        <i class="fas fa-times"></i>
                    </button>
                `;
                filterList.appendChild(filterItem);
            });
            
            // Add custom filters
            customFilters.forEach(filter => {
                const filterItem = document.createElement('div');
                filterItem.className = 'filter-item';
                filterItem.innerHTML = `
                    <span>${filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
                    <button class="remove-filter" data-filter="${filter}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                filterList.appendChild(filterItem);
                
                // Add event listener to remove button
                const removeBtn = filterItem.querySelector('.remove-filter');
                if (removeBtn) {
                    removeBtn.addEventListener('click', function() {
                        const filterToRemove = this.getAttribute('data-filter');
                        filterItem.remove();
                    });
                }
            });
            
            // Also update the category dropdown in the form editor
            updateCategoryDropdown(customFilters);
        }
    }
    
    function addNewFilter(filterName) {
        // Check if filter already exists
        const existingFilters = Array.from(filterList.querySelectorAll('.filter-item')).map(item => 
            item.querySelector('span').textContent.toLowerCase()
        );
        
        if (existingFilters.includes(filterName)) {
            showNotification('This filter already exists!', 'warning');
            return;
        }
        
        // Create and add filter item to the list
        const filterItem = document.createElement('div');
        filterItem.className = 'filter-item';
        filterItem.innerHTML = `
            <span>${filterName.charAt(0).toUpperCase() + filterName.slice(1)}</span>
            <button class="remove-filter" data-filter="${filterName}">
                <i class="fas fa-times"></i>
            </button>
        `;
        filterList.appendChild(filterItem);
        
        // Add event listener to remove button
        const removeBtn = filterItem.querySelector('.remove-filter');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                filterItem.remove();
            });
        }
        
        // Also add to form category dropdown
        const formCategory = document.getElementById('form-category');
        if (formCategory) {
            const option = document.createElement('option');
            option.value = filterName;
            option.textContent = filterName.charAt(0).toUpperCase() + filterName.slice(1);
            formCategory.appendChild(option);
        }
    }
    
    function saveFilters() {
        if (!filterList) return;
        
        // Collect all custom filters from the list (excluding default filters)
        const customFilters = [];
        filterList.querySelectorAll('.filter-item:not(.default)').forEach(item => {
            const filterName = item.querySelector('span').textContent.toLowerCase();
            customFilters.push(filterName);
        });
        
        // Save to localStorage using the same key as forms.html
        localStorage.setItem('customFormFilters', JSON.stringify(customFilters));
        
        // Update the category dropdown
        updateCategoryDropdown(customFilters);
    }
    
    function updateCategoryDropdown(customFilters) {
        const formCategory = document.getElementById('form-category');
        if (formCategory) {
            // Save current selection
            const currentSelection = formCategory.value;
            
            // Clear existing options
            formCategory.innerHTML = '';
            
            // Add default "All Forms" option
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'All Forms';
            formCategory.appendChild(allOption);
            
            // Add custom filters as options
            customFilters.forEach(filter => {
                const option = document.createElement('option');
                option.value = filter;
                option.textContent = filter.charAt(0).toUpperCase() + filter.slice(1);
                formCategory.appendChild(option);
            });
            
            // Add "Other" option
            const otherOption = document.createElement('option');
            otherOption.value = 'other';
            otherOption.textContent = 'Other';
            formCategory.appendChild(otherOption);
            
            // Restore selection if possible
            if (formCategory.querySelector(`option[value="${currentSelection}"]`)) {
                formCategory.value = currentSelection;
            } else {
                // Default to first option
                formCategory.selectedIndex = 0;
            }
        }
    }
    
    // Initialize filter category dropdown on page load
    const initFilters = function() {
        // Get filters from localStorage or use defaults - use the same key as forms.html
        let customFilters = [];
        try {
            const savedFilters = localStorage.getItem('customFormFilters');
            if (savedFilters) {
                customFilters = JSON.parse(savedFilters);
            } else {
                // Default filters
                customFilters = ['feedback', 'survey'];
            }
        } catch (error) {
            console.error('Error loading filters:', error);
            customFilters = ['feedback', 'survey'];
        }
        
        // Update category dropdown
        updateCategoryDropdown(customFilters);
    };
    
    // Call initialization function
    initFilters();
});