async function fetchAndDisplayTodos() {
    const appDiv = document.getElementById('app');
    const bulkDeleteButton = document.getElementById('delete-selected-todos');

    if (!appDiv) {
        console.error("Element with id 'app' not found!");
        if (bulkDeleteButton) bulkDeleteButton.style.display = 'none';
        return;
    }

    appDiv.innerHTML = '<p>ToDo List en chargement...</p>';
    // Ensure button is hidden during load/reload
    if (bulkDeleteButton) bulkDeleteButton.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3000/todos');
        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorDetails}`);
        }
        const apiResponse = await response.json();
        let todos = [];
        if (Array.isArray(apiResponse) && apiResponse.length > 0 && apiResponse[0].todolist && Array.isArray(apiResponse[0].todolist)) {
            todos = apiResponse[0].todolist;
            console.log("API response structure OK. Extracted todolist.");
        } else if (Array.isArray(apiResponse)) {
            console.warn("API response is an array, but not in the expected nested format. Using it directly.", apiResponse);
            todos = apiResponse;
        } else {
            console.warn("API response structure is not as expected. No tasks found:", apiResponse);
            todos = [];
        }

        displayTodos(todos); // This function will call updateBulkDeleteButtonState() at its end

        // The logic to show/hide bulkDeleteButton based on todos.length is removed from here.
        // updateBulkDeleteButtonState() at the end of displayTodos() handles it correctly based on checked status.

    } catch (error) {
        console.error("Error fetching or displaying todos:", error);
        appDiv.innerHTML = `<p style="color: red;">Failed to load tasks. Error: ${error.message}</p>`;
        if (bulkDeleteButton) bulkDeleteButton.style.display = 'none'; // Keep it hidden on error
    }
}

function displayTodos(todos) {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = '';

    if (!todos || !Array.isArray(todos) || todos.length === 0) {
        appDiv.innerHTML = '<p>Aucune tâche trouvée pour l\'instant.</p>';
        console.log("Aucune tâche à afficher.");
        updateBulkDeleteButtonState(); // Call even if no todos, to ensure button is hidden
        return;
    }

    console.log("Affichage des tâches :", todos);

    const todoList = document.createElement('ul');
    todoList.classList.add('list-unstyled');

    todoList.addEventListener('click', async (event) => {
        const completeIcon = event.target.closest('.complete-icon');
        const profileIconEl = event.target.closest('.profile-icon');
        const deleteIconEl = event.target.closest('.delete-icon');

        if (completeIcon) {
            event.preventDefault();
            event.stopPropagation();
            const todoId = completeIcon.dataset.id;
            console.log("Delegated: Check icon clicked for task ID:", todoId);
            try {
                await markTodoComplete(todoId);
            } catch (error) {
                console.error("Delegated: Failed to mark complete:", error);
            }
            return;
        }

        if (profileIconEl) {
            event.preventDefault();
            event.stopPropagation();
            const todoId = profileIconEl.dataset.id;
            const todoJson = profileIconEl.dataset.todoJson;
            console.log("Delegated: Profile icon clicked for task ID:", todoId);
            if (todoJson) {
                localStorage.setItem('selectedTodo', todoJson);
                window.location.href = 'item.html';
            } else {
                console.error('Missing todoJson data on profile icon for ID:', todoId);
            }
            return;
        }

        if (deleteIconEl) {
            event.preventDefault();
            event.stopPropagation();
            const todoId = deleteIconEl.dataset.id;
            console.log(`Delegated: Click détecté sur l'icône de suppression pour la tâche ID: ${todoId}`);
            try {
                await deleteTodo(todoId);
            } catch (error) {
                console.error("Delegated: Erreur lors de la suppression de la tâche :", error);
            }
            return;
        }
    });

    todoList.addEventListener('dblclick', (event) => {
        console.log("DblClick event triggered on todoList.");
        const textSpan = event.target.closest('.todo-text');
        if (textSpan) {
            const listItem = textSpan.closest('.todo-item');
            if (!listItem) {
                console.error("Could not find parent .todo-item for textSpan.");
                return;
            }
            const todoId = listItem.dataset.id;
            if (!todoId) {
                console.error("Could not determine todoId for dblclick event on textSpan.");
                return;
            }
            console.log(`DblClick détecté sur le texte pour la tâche ID: ${todoId}`);
            startEditing(textSpan, todoId);
        }
    });

    todos.forEach(todo => {
        if (!todo || typeof todo.id === 'undefined') {
            console.warn("Skipping invalid todo item:", todo);
            return;
        }

        const listItem = document.createElement('li');
        listItem.classList.add('todo-item', 'list-group-item', 'd-flex', 'align-items-center');
        listItem.dataset.id = todo.id;

        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('fas', 'fa-trash', 'delete-icon', 'me-2');
        deleteIcon.dataset.id = todo.id;

        if (!todo.is_complete) {
            const checkIcon = document.createElement('i');
            checkIcon.classList.add('fas', 'fa-check', 'complete-icon', 'me-2');
            checkIcon.dataset.id = todo.id;
            checkIcon.style.color = 'green';
            checkIcon.style.cursor = 'pointer';
            checkIcon.title = 'Marquer comme complétée';
            listItem.appendChild(checkIcon);
        }

        const profileIcon = document.createElement('i');
        profileIcon.classList.add('fas', 'fa-user', 'profile-icon', 'me-2');
        profileIcon.dataset.id = todo.id;
        profileIcon.dataset.todoJson = JSON.stringify(todo);
        profileIcon.style.color = 'blue';
        profileIcon.style.cursor = 'pointer';
        profileIcon.title = 'Voir le profil';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('form-check-input', 'me-2');
        checkbox.dataset.id = todo.id;
        checkbox.addEventListener('change', updateBulkDeleteButtonState);

        const textSpan = document.createElement('span');
        textSpan.classList.add('todo-text', 'flex-grow-1');
        textSpan.dataset.originalTextContent = todo.text || 'No text';

        let itemTextContent = `${todo.text || 'No text'}`;
        if (todo.Tags && Array.isArray(todo.Tags) && todo.Tags.length > 0) {
            itemTextContent += ` - Tags: ${todo.Tags.join(', ')}`;
        }
        textSpan.textContent = itemTextContent;

        if (typeof todo.is_complete === 'boolean' && todo.is_complete) {
            textSpan.style.textDecoration = 'line-through';
            textSpan.style.color = '#888';
        } else {
            textSpan.style.textDecoration = 'none';
            textSpan.style.color = '';
        }

        const statusSpan = document.createElement('span');
        statusSpan.classList.add('todo-status', 'ms-2', 'badge', typeof todo.is_complete === 'boolean' && todo.is_complete ? 'bg-success' : 'bg-secondary');
        statusSpan.textContent = typeof todo.is_complete === 'boolean' ? (todo.is_complete ? 'Completed' : 'Incomplete') : 'Status Unknown';
        statusSpan.style.fontSize = '0.8em';

        listItem.appendChild(deleteIcon);
        listItem.appendChild(profileIcon);
        listItem.appendChild(checkbox);
        listItem.appendChild(textSpan);
        listItem.appendChild(statusSpan);

        todoList.appendChild(listItem);
    });

    appDiv.appendChild(todoList);
    console.log("Tâches affichées avec succès.");
    updateBulkDeleteButtonState(); // Crucial call to set initial button state based on (no) selections
}

async function markTodoComplete(todoId) {
    const updateUrl = `http://localhost:3000/todos/${todoId}`;
    try {
        const response = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ is_complete: true })
        });
        if (!response.ok) {
            throw new Error(`Failed to update task ${todoId}`);
        }
        console.log(`Task ${todoId} marked as complete.`);
        fetchAndDisplayTodos();
    } catch (error) {
        console.error("Error marking task as complete:", error);
    }
}

function updateBulkDeleteButtonState() {
    const bulkDeleteButton = document.getElementById('delete-selected-todos');
    if (bulkDeleteButton) {
        const appDiv = document.getElementById('app');
        if (appDiv) {
            const selectedCheckboxes = appDiv.querySelectorAll('input[type="checkbox"]:checked');
            if (selectedCheckboxes.length > 0) {
                bulkDeleteButton.style.display = 'block';
            } else {
                bulkDeleteButton.style.display = 'none';
            }
        } else {
             bulkDeleteButton.style.display = 'none'; // Hide if appDiv not found
        }
    }
}

function startEditing(textSpanElement, todoId) {
    if (textSpanElement.style.display === 'none') {
        console.log("Already editing this item.");
        return;
    }
    const listItem = textSpanElement.parentElement;
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.classList.add('form-control', 'edit-input', 'flex-grow-1');
    editInput.value = textSpanElement.dataset.originalTextContent;
    editInput.dataset.id = todoId;
    editInput.dataset.originalText = textSpanElement.dataset.originalTextContent;
    editInput.dataset.saving = 'false';

    textSpanElement.style.display = 'none';
    listItem.insertBefore(editInput, textSpanElement.nextSibling);
    editInput.focus();

    editInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            await saveEdit(editInput, todoId, textSpanElement);
        }
    });
    editInput.addEventListener('blur', async () => {
        setTimeout(async () => {
            if (document.body.contains(editInput)) {
                await saveEdit(editInput, todoId, textSpanElement);
            }
        }, 100);
    });
    console.log(`Started editing for task ID ${todoId}.`);
}

async function saveEdit(inputElement, todoId, textSpanElement) {
    if (!document.body.contains(inputElement)) { // Check if input element is still in DOM
        console.log(`Input element for task ID ${todoId} no longer in DOM, aborting save.`);
        if(textSpanElement) textSpanElement.style.display = ''; // Show the text span again
        return;
    }
    if (inputElement.dataset.saving === 'true') {
        console.log(`Save already in progress for task ID ${todoId}.`);
        return;
    }
    inputElement.dataset.saving = 'true';

    const newText = inputElement.value.trim();
    const originalText = inputElement.dataset.originalText;

    if (newText === originalText || newText === '') {
        console.log(`Text for task ID ${todoId} is unchanged or empty.`);
        if (inputElement.parentElement) inputElement.remove();
        if (textSpanElement) {
            textSpanElement.style.display = '';
            let preservedSuffix = '';
            const tagsIndex = textSpanElement.textContent.indexOf(' - Tags:');
            if (tagsIndex !== -1) preservedSuffix = textSpanElement.textContent.substring(tagsIndex);
            textSpanElement.textContent = originalText + preservedSuffix;
        }
        // No need to set saving to false here if element is removed or about to be refreshed
        return;
    }

    const updateUrl = `http://localhost:3000/todos/${todoId}`;
    const updateData = { text: newText };

    try {
        const response = await fetch(updateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(updateData)
        });
        if (!response.ok) {
            const errorDetails = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorDetails);
                errorMessage += `, details: ${errorJson.message || JSON.stringify(errorJson)}`;
            } catch (e) { errorMessage += `, details: ${errorDetails}`; }
            throw new Error(errorMessage);
        }
        console.log(`Text for task ID ${todoId} updated successfully.`);
        fetchAndDisplayTodos(); // Refresh to ensure consistency
    } catch (error) {
        console.error("Error saving task text:", error);
        alert(`Échec de la mise à jour de la tâche : ${error.message}`);
        // Revert UI if not refreshing, or let refresh handle it
        if (inputElement.parentElement) inputElement.remove();
        if (textSpanElement) {
            let preservedSuffix = '';
            const tagsIndex = textSpanElement.textContent.indexOf(' - Tags:');
            if (tagsIndex !== -1) preservedSuffix = textSpanElement.textContent.substring(tagsIndex);
            textSpanElement.textContent = originalText + preservedSuffix;
            textSpanElement.style.display = '';
        }
        // If fetchAndDisplayTodos is not called on error, set saving to false
        if (document.body.contains(inputElement)) inputElement.dataset.saving = 'false';
    }
}

async function deleteTodo(todoId) {
    if (!todoId) {
        console.error("No todo ID provided for deletion.");
        return;
    }
    const confirmation = confirm("Voulez-vous vraiment supprimer cette tâche ?");
    if (!confirmation) {
        console.log("Suppression annulée par l'utilisateur.");
        return;
    }
    try {
        const deleteUrl = `http://localhost:3000/todos/${todoId}`;
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
            const errorDetails = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorDetails);
                errorMessage += `, details: ${errorJson.message || JSON.stringify(errorJson)}`;
            } catch (e) { errorMessage += `, details: ${errorDetails}`; }
            throw new Error(errorMessage);
        }
        console.log(`Tâche avec l'ID ${todoId} supprimée avec succès.`);
        fetchAndDisplayTodos();
    } catch (error) {
        console.error("Erreur lors de la suppression de la tâche:", error);
        alert(`Échec de la suppression de la tâche : ${error.message}`);
        fetchAndDisplayTodos();
    }
}

async function handleAddTodo() {
    const taskTextInput = document.getElementById('newtasktext');
    const tagsTextInput = document.getElementById('newtasktag');
    if (!taskTextInput || !tagsTextInput) {
        console.error("Form input elements not found!");
        alert("Erreur: Texte introuvable.");
        return;
    }
    const taskText = taskTextInput.value.trim();
    const tagsString = tagsTextInput.value.trim();
    if (taskText === '') {
        alert("Veuillez entrer une description pour la tâche.");
        taskTextInput.focus();
        return;
    }
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    const newTaskData = {
        text: taskText,
        created_at: new Date().toISOString(),
        Tags: tagsArray,
        is_complete: false
    };
    try {
        const response = await fetch('http://localhost:3000/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(newTaskData)
        });
        if (!response.ok) {
            const errorDetails = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorDetails);
                errorMessage += `, details: ${errorJson.message || JSON.stringify(errorJson)}`;
            } catch (e) { errorMessage += `, details: ${errorDetails}`; }
            throw new Error(errorMessage);
        }
        console.log("Tâche ajoutée avec succès:");
        taskTextInput.value = '';
        tagsTextInput.value = '';
        fetchAndDisplayTodos();
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        alert(`Échec de l'ajout de la tâche : ${error.message}`);
    }
}

async function handleDeleteSelectedTodos() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;
    const selectedCheckboxes = appDiv.querySelectorAll('input[type="checkbox"]:checked');
    const selectedTodoIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.id).filter(id => id != null);

    if (selectedTodoIds.length === 0) {
        alert("Veuillez sélectionner au moins une tâche à supprimer.");
        return;
    }
    const confirmation = confirm(`Voulez-vous vraiment supprimer ${selectedTodoIds.length} tâche(s) sélectionnée(s) ?`);
    if (!confirmation) return;

    const bulkDeleteButton = document.getElementById('delete-selected-todos');
    if (bulkDeleteButton) {
        bulkDeleteButton.disabled = true;
        bulkDeleteButton.textContent = `Suppression (${selectedTodoIds.length})...`;
    }

    const deletePromises = selectedTodoIds.map(id => {
        const deleteUrl = `http://localhost:3000/todos/${id}`;
        return fetch(deleteUrl, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        }).then(response => {
            if (!response.ok) {
                return response.text().then(errorText => {
                    let errorMessage = `HTTP error for ID ${id}: ${response.status}`;
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage += `, details: ${errorJson.message || JSON.stringify(errorJson)}`;
                    } catch (e) { errorMessage += `, details: ${errorText}`; }
                    return Promise.reject({ id: id, message: errorMessage });
                });
            }
            return response.text().then(text => ({ id: id, status: 'fulfilled', data: text ? JSON.parse(text) : {} }));
        }).catch(error => {
            return Promise.reject({ id: id, message: `Network or unexpected error for ID ${id}: ${error.message}` });
        });
    });

    const results = await Promise.allSettled(deletePromises);
    const failedAttempts = results.filter(result => result.status === 'rejected');
    if (failedAttempts.length > 0) {
        let errorMessageStr = `Échec de la suppression de ${failedAttempts.length} tâche(s) sur ${selectedTodoIds.length} : \n`;
        failedAttempts.forEach(fail => {
            errorMessageStr += `ID ${fail.reason.id || 'N/A'}: ${fail.reason.message}\n`;
        });
        alert(errorMessageStr);
    }

    if (bulkDeleteButton) {
        bulkDeleteButton.disabled = false;
        bulkDeleteButton.textContent = `Supprimer les tâches sélectionnées`;
    }
    fetchAndDisplayTodos();
}

document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('addtodo');
    const bulkDeleteButton = document.getElementById('delete-selected-todos');

    if (addButton) {
        addButton.addEventListener('click', handleAddTodo);
    } else {
        console.error("Button with id 'addtodo' not found!");
    }

    if (bulkDeleteButton) {
        bulkDeleteButton.addEventListener('click', handleDeleteSelectedTodos);
        bulkDeleteButton.style.display = 'none'; // Ensure it's hidden initially
    } else {
        console.error("Button with id 'delete-selected-todos' not found!");
    }

    fetchAndDisplayTodos();
});