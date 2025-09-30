// Dark Mode Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = darkModeToggle.querySelector('i');

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeIcon.classList.remove('fa-moon');
        darkModeIcon.classList.add('fa-sun');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }

    // Toggle dark mode
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');

        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
    });
});
