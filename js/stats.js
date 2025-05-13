async function getTodoStats() {
    try {
      const response = await fetch('http://localhost:3000/todos');
      const data = await response.json();
  
      // On accede la first Todo de la liste 
      const todos = data[0].todolist; 
  
      const totalTodos = todos.length; // Taille de la liste de Todos
      const completedTodos = todos.filter(todo => todo.is_complete).length; // Filtrer par la propriété is_complete
      const pendingTodos = totalTodos - completedTodos; // Calculer le nombre de Todos en cours
  
      return {
        totalTodos,
        completedTodos,
        pendingTodos
      };
  
    } catch (error) {
      console.error("Error fetching todo stats:", error);
      return {
        totalTodos: 0,
        completedTodos: 0,
        pendingTodos: 0
      };
    }
  }
  // On met a jour dans les DIV correspondantes les infos que l'on veut display 
  function updateStatsPage(statistiques) {
    document.getElementById('total-todos').textContent = statistiques.totalTodos;
    document.getElementById('completed-todos').textContent = statistiques.completedTodos;
    document.getElementById('pending-todos').textContent = statistiques.pendingTodos;
  }
  
  getTodoStats()
    .then(statistiques => {
      updateStatsPage(statistiques);
    });