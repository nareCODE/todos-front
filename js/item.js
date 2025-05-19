document.addEventListener('DOMContentLoaded', () => {
    const prenomSpan = document.getElementById('prenom');
    if (prenomSpan) {
        // Récupère 'userName' depuis localStorage et l'affiche dans le span
        prenomSpan.textContent = localStorage.getItem('userName') || '';
    }

    const itemProfileDiv = document.getElementById('itemprofile');
    const selectedTodoStr = localStorage.getItem('selectedTodo');
    if (!selectedTodoStr || !itemProfileDiv) {
        console.error("Aucune tâche sélectionnée ou élément 'itemprofile' introuvable.");
        return;
    }

    const todo = JSON.parse(selectedTodoStr);

    // Create display elements
    const titleElem = document.createElement('h2');
    titleElem.textContent = `Détails de la tâche (ID: ${todo.id})`;

    const textElem = document.createElement('p');
    textElem.textContent = `Texte: ${todo.text}`;

    const tagsElem = document.createElement('p');
    tagsElem.textContent = `Tags: ${(todo.Tags && Array.isArray(todo.Tags)) ? todo.Tags.join(', ') : 'Aucun'}`;

    const createdElem = document.createElement('p');
    createdElem.textContent = `Créé le: ${new Date(todo.created_at).toLocaleString()}`;

    // Button to mark as completed
    const completeButton = document.createElement('button');
    completeButton.textContent = 'Marquer comme complétée';
    completeButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`http://localhost:3000/todos/${todo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ is_complete: true })
            });
            if (!response.ok) {
                throw new Error(`Erreur lors de la mise à jour: ${response.statusText}`);
            }
            alert('Tâche marquée comme complétée.');
        } catch (error) {
            console.error("Erreur:", error);
            alert(error.message);
        }
    });

    // Button to delete the task
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Supprimer la tâche';
    deleteButton.addEventListener('click', async () => {
        if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
            try {
                const response = await fetch(`http://localhost:3000/todos/${todo.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error(`Erreur lors de la suppression: ${response.statusText}`);
                }
                alert('Tâche supprimée avec succès.');
            } catch (error) {
                console.error("Erreur:", error);
                alert(error.message);
            }
        }
    });

    // Append all elements to the item profile container
    itemProfileDiv.appendChild(titleElem);
    itemProfileDiv.appendChild(textElem);
    itemProfileDiv.appendChild(tagsElem);
    itemProfileDiv.appendChild(createdElem);
    itemProfileDiv.appendChild(completeButton);
    itemProfileDiv.appendChild(deleteButton);
});
