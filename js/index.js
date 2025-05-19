document.getElementById('form').addEventListener('submit', function(event) {
    event.preventDefault(); 
  
    const prenom = document.getElementById('prenom').value.trim(); 
  
    if (prenom !== "") {
      
      localStorage.setItem('userName', prenom);
  
      
      window.location.href = 'tasks.html';
    } else {
      
      alert('Please enter your name.');
    }
  });