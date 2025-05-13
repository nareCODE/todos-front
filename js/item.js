document.addEventListener('DOMContentLoaded', () => {
    const prenomSpan = document.getElementById('prenom');
    if (prenomSpan) {
        prenomSpan.textContent = localStorage.getItem('userName') || '';
    }
});
