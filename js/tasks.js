
async function fetchAndDisplayTodos() {
    const appDiv = document.getElementById('app');
    const bulkDeleteButton = document.getElementById('delete-selected-todos');

    if (!appDiv) {
        console.error("Element with id 'app' not found!");

        if(bulkDeleteButton) bulkDeleteButton.style.display = 'none';
        return;
    }

    appDiv.innerHTML = '<p>ToDo List en chargement...</p>'; 
    
    if(bulkDeleteButton) bulkDeleteButton.style.display = 'none';

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
        }
         else {
             console.warn("API response structure is not as expected. No tasks found:", apiResponse);
             todos = []; 
        }

        displayTodos(todos);

        if(bulkDeleteButton) {
            if (todos && todos.length > 0) {
                bulkDeleteButton.style.display = 'block';
            } else {
                bulkDeleteButton.style.display = 'none';
            }
        }

    } catch (error) {
        console.error("Error fetching or displaying todos:", error);
        appDiv.innerHTML = `<p style="color: red;">Failed to load tasks. Error: ${error.message}</p>`;
         
         if(bulkDeleteButton) bulkDeleteButton.style.display = 'none';
    }
}

function displayTodos(todos) {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = ''; 

    if (!todos || !Array.isArray(todos) || todos.length === 0) {
        appDiv.innerHTML = '<p>Aucune tâche trouvée pour l\'instant.</p>';
        console.log("Aucune tâche à afficher."); 
        return;
    }

    console.log("Affichage des tâches :", todos); 

    const todoList = document.createElement('ul');
    todoList.classList.add('list-unstyled'); 

    console.log("Attaching click event listener to todoList for delegation."); 
    todoList.addEventListener('click', async (event) => {
        console.log("Click event triggered on todoList."); 
        console.log("Event target:", event.target);

        
        const deleteIcon = event.target.closest('.delete-icon');
        if (deleteIcon) {
            const todoId = deleteIcon.dataset.id;
            console.log(`Click détecté sur l'icône de suppression pour la tâche ID: ${todoId}`); 
            try {
                await deleteTodo(todoId); 
            } catch (error) {
                console.error("Erreur lors de la suppression de la tâche :", error);
            }
        }

    });

    
    console.log("Attaching dblclick event listener to todoList for text editing delegation."); 
     todoList.addEventListener('dblclick', (event) => {
         console.log("DblClick event triggered on todoList.");
         const textSpan = event.target.closest('.todo-text'); 
         if (textSpan) {
             const listItem = textSpan.closest('.todo-item');
             if (!listItem) {
                 console.error("Could not find parent .todo-item for textSpan.");
                 return;
             }
             const todoId = listItem.querySelector('.delete-icon, input[type="checkbox"]').dataset.id; 

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

        console.log(`Création de l'icône de suppression pour la tâche ID: ${todo.id}`); // Debugging log

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
        statusSpan.classList.add('todo-status', 'ms-2', 'badge', typeof todo.is_complete === 'boolean' && todo.is_complete ? 'bg-success' : 'bg-secondary'); // Bootstrap badge classes
        statusSpan.textContent = typeof todo.is_complete === 'boolean' ? (todo.is_complete ? 'Completed' : 'Incomplete') : 'Status Unknown';
        statusSpan.style.fontSize = '0.8em'; 

        
        listItem.appendChild(deleteIcon); 
        listItem.appendChild(checkbox);   
        listItem.appendChild(textSpan);   
        listItem.appendChild(statusSpan); 

        todoList.appendChild(listItem);
    });

    appDiv.appendChild(todoList);
    console.log("Tâches affichées avec succès."); 

    updateBulkDeleteButtonState();
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
             bulkDeleteButton.style.display = 'none'; 
        }
    }
}





function startEditing(textSpanElement, todoId) {
    
    if (textSpanElement.style.display === 'none') {
        console.log("Already editing this item.");
        return;
    }

    const listItem = textSpanElement.parentElement; 
    const currentText = textSpanElement.textContent; 

    
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
             await saveEdit(editInput, todoId, textSpanElement);
         }, 100); 
    });

     console.log(`Started editing for task ID ${todoId}.`);
}



async function saveEdit(inputElement, todoId, textSpanElement) {
    
    if (inputElement.dataset.saving === 'true') {
        console.log(`Save already in progress for task ID ${todoId}.`);
        return;
    }
     inputElement.dataset.saving = 'true'; 

    const newText = inputElement.value.trim();
    const originalText = inputElement.dataset.originalText; 

    
    if (newText === originalText || newText === '') {
        console.log(`Text for task ID ${todoId} is unchanged or empty. Reverting UI.`);
        
        if (inputElement.parentElement) { 
             inputElement.remove(); 
        }
        if (textSpanElement) {
            textSpanElement.style.display = '';
             
             textSpanElement.textContent = originalText + (textSpanElement.textContent.includes('Tags:') ? textSpanElement.textContent.substring(textSpanElement.textContent.indexOf('Tags:')) : ''); // Try to preserve tags/status part if it was there
        }
         inputElement.dataset.saving = 'false'; 
        return; 
    }

    const updateUrl = `http://localhost:3000/todos/${todoId}`;
    console.log(`Attempting to update text for task ID ${todoId} to: "${newText}"`);

    const updateData = {
        text: newText
    };

    try {
        const response = await fetch(updateUrl, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        
        if (!response.ok) {
            const errorDetails = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorDetails);
                errorMessage += `, details: ${errorJson.message || JSON.stringify(errorJson)}`;
            } catch (e) {
                errorMessage += `, details: ${errorDetails}`;
            }
            throw new Error(errorMessage);
        }

        
        console.log(`Text for task ID ${todoId} updated successfully.`);

        
        if (textSpanElement) {

             const todoItem = textSpanElement.closest('.todo-item');
             if (todoItem) {
                  
                  let updatedTextContent = newText;

                  const currentFullSpanContent = textSpanElement.textContent;
                  let contentAfterText = '';
                  const tagsIndex = currentFullSpanContent.indexOf(' - Tags:');
                  const statusIndex = currentFullSpanContent.indexOf(' (Complet:'); 

                  if (tagsIndex !== -1) {
                      
                       contentAfterText += currentFullSpanContent.substring(tagsIndex);
                  }

                   updatedTextContent = newText; 
                   if (tagsIndex !== -1) {
                        
                         const originalTagsPart = currentFullSpanContent.substring(tagsIndex);
                         updatedTextContent += originalTagsPart;
                   }


                  textSpanElement.textContent = updatedTextContent;
                  textSpanElement.dataset.originalTextContent = newText; 
                  textSpanElement.style.textDecoration = 'none'; 
                  textSpanElement.style.color = ''; 
             } else {
                  console.warn("Could not find parent todo item after successful update.");
             }
             textSpanElement.style.display = ''; 
        }

        if (inputElement.parentElement) { 
            inputElement.remove();
        } else {
             console.warn("Input element was removed before saveEdit finished.");
        }

         inputElement.dataset.saving = 'false'; // Reset flag

    } catch (error) {
        console.error("Error saving task text:", error);
        alert(`Échec de la mise à jour de la tâche : ${error.message}`);

        
        if (inputElement.parentElement) { 
             inputElement.remove(); 
        }
        if (textSpanElement) {
            
            textSpanElement.textContent = originalText + (textSpanElement.textContent.includes('Tags:') ? textSpanElement.textContent.substring(textSpanElement.textContent.indexOf('Tags:')) : ''); // Try to preserve tags/status part
            textSpanElement.style.display = ''; 

             const todoItem = textSpanElement.closest('.todo-item');
             if (todoItem) {

                  console.log("Reverting UI for task ID", todoId, "due to save error.");
                 
             }
        }

         inputElement.dataset.saving = 'false'; // Reset flag

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
        console.log(`Tentative de suppression de la tâche avec l'ID: ${todoId}`);
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorDetails);
                errorMessage += `, details: ${errorJson.message || JSON.stringify(errorJson)}`;
            } catch (e) {
                errorMessage += `, details: ${errorDetails}`;
            }
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

// Votre fonction handleAddTodo (inchangée)
async function handleAddTodo() {
     const taskTextInput = document.getElementById('newtasktext');
     const tagsTextInput = document.getElementById('newtasktag');

     if (!taskTextInput || !tagsTextInput) {
         console.error("Form input elements not found!");
         alert("Erreur: Champs de formulaire introuvables.");
         return;
     }

     const taskText = taskTextInput.value.trim();
     const tagsString = tagsTextInput.value.trim();

     if (taskText === '') {
         alert("Veuillez entrer une description pour la tâche.");
         taskTextInput.focus();
         return;
     }

     const tagsArray = tagsString.split(',')
                               .map(tag => tag.trim())
                               .filter(tag => tag !== '');

     const newTaskData = {
         text: taskText,
         created_at: new Date().toISOString(),
         Tags: tagsArray,
         is_complete: false
     };

     console.log("Tentative d'ajout d'une nouvelle tâche:", newTaskData);

     try {
         const response = await fetch('http://localhost:3000/todos', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Accept': 'application/json'
             },
             body: JSON.stringify(newTaskData)
         });

         if (!response.ok) {
             const errorDetails = await response.text();
             let errorMessage = `HTTP error! status: ${response.status}`;
              try {
                   const errorJson = JSON.parse(errorDetails);
                   errorMessage += `, details: ${errorJson.message || JSON.stringify(errorJson)}`;
              } catch (e) {
                   errorMessage += `, details: ${errorDetails}`;
              }
             throw new Error(errorMessage);
         }

         const addedTodo = await response.json();
         console.log("Tâche ajoutée avec succès:", addedTodo);

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
    if (!appDiv) {
        console.error("Impossible de trouver la div app pour supprimer les tâches sélectionnées.");
        return;
    }
    
    const selectedCheckboxes = appDiv.querySelectorAll('input[type="checkbox"]:checked');
    
    const selectedTodoIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.id).filter(id => id != null); // Filtrer les IDs potentiellement null/undefined

    console.log("IDs des tâches sélectionnées à supprimer (en masse):", selectedTodoIds);

    if (selectedTodoIds.length === 0) {
        alert("Veuillez sélectionner au moins une tâche à supprimer.");
        return;
    }

    const confirmation = confirm(`Voulez-vous vraiment supprimer ${selectedTodoIds.length} tâche(s) sélectionnée(s) ?`);
    if (!confirmation) {
        return; 
    }

     
     const bulkDeleteButton = document.getElementById('delete-selected-todos');
     if (bulkDeleteButton) {
         bulkDeleteButton.disabled = true;
         bulkDeleteButton.textContent = `Suppression (${selectedTodoIds.length})...`; // Optional: give feedback
     }


    
    const deletePromises = selectedTodoIds.map(id => {
        const deleteUrl = `http://localhost:3000/todos/${id}`;
        console.log(`Tentative de suppression en masse de la tâche avec l'ID: ${id}`);
        return fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                 'Accept': 'application/json'
            }
        }).then(response => {
            
            if (!response.ok) {
                 return response.text().then(errorText => {
                     let errorMessage = `HTTP error for ID ${id}: ${response.status}`;
                      try {
                           const errorJson = JSON.parse(errorText);
                           errorMessage += `, details: ${errorJson.message || JSON.stringify(errorJson)}`;
                      } catch (e) {
                           errorMessage += `, details: ${errorText}`;
                      }
                     return { id: id, status: 'failed', error: errorMessage }; // Marque comme échoué
                 });

            }
            console.log(`Suppression en masse réussie pour l'ID: ${id}`);
             return response.json().catch(() => ({})).then(data => ({ id: id, status: 'fulfilled', data: data })); // Marque comme réussi
        }).catch(error => {
            
            console.error(`Erreur réseau ou inattendue pour l'ID ${id} (suppression en masse):`, error);
             return { id: id, status: 'failed', error: `Network or unexpected error: ${error.message}` }; // Marque comme échoué réseau
        });
    });

    
    const results = await Promise.allSettled(deletePromises);

    console.log("Résultats des suppressions en masse:", results);

    
    const successfulDeletions = results.filter(result => result.status === 'fulfilled' && result.value && result.value.status === 'fulfilled').length;
    const failedAttempts = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value && result.value.status === 'failed'));

    if (failedAttempts.length > 0) {
        let errorMessage = `Échec de la suppression de ${failedAttempts.length} tâche(s) sur ${selectedTodoIds.length} : \n`;
        failedAttempts.forEach(fail => {
             
             const errorDetail = fail.status === 'rejected' ? (fail.reason ? fail.reason.message : 'Erreur inconnue') : (fail.value && fail.value.error ? fail.value.error : 'Erreur inconnue');
             
             const todoId = fail.status === 'rejected' ? (fail.reason && fail.reason.id ? fail.reason.id : 'N/A (Rejected)') : (fail.value && fail.value.id ? fail.value.id : 'N/A (Failed)');
            errorMessage += `ID ${todoId}: ${errorDetail}\n`;
        });
        alert(errorMessage);
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
        console.log("Event listener added to #addtodo button");
    } else {
        console.error("Button with id 'addtodo' not found in the DOM!");
    }

    
    if (bulkDeleteButton) {
        bulkDeleteButton.addEventListener('click', handleDeleteSelectedTodos);
        console.log("Event listener added to #delete-selected-todos button");
         
         bulkDeleteButton.style.display = 'none';
    } else {
        console.error("Button with id 'delete-selected-todos' not found in the DOM!");
    }


    fetchAndDisplayTodos();
});