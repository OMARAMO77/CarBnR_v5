// Dark Mode Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = darkModeToggle.querySelector('i');
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeIcon.classList.remove('fa-moon');
        darkModeIcon.classList.add('fa-sun');
    }
    
    // Toggle dark mode
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
        }
        
        // Force refresh dropdown styles
        refreshDropdownStyles();
    });
    
    // Make dropdown list items clickable
    function setupDropdownClickHandlers() {
        // Add click handlers to all dropdown list items
        document.addEventListener('click', function(e) {
            // Check if the clicked element is a dropdown list item or its text
            const listItem = e.target.closest('.dropdown-menu .list-unstyled li');
            if (listItem) {
                const radioInput = listItem.querySelector('input[type="radio"]');
                if (radioInput) {
                    // Check the radio button
                    radioInput.checked = true;
                    
                    // Trigger the change event to update the UI
                    radioInput.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Close the dropdown after selection (optional)
                    const dropdown = listItem.closest('.dropdown-menu');
                    if (dropdown) {
                        const dropdownToggle = document.querySelector('[aria-labelledby="' + dropdown.getAttribute('aria-labelledby') + '"]');
                        if (dropdownToggle) {
                            bootstrap.Dropdown.getInstance(dropdownToggle)?.hide();
                        }
                    }
                }
            }
        });
    }
    
    
    // Force refresh dropdown styles after dark mode toggle
    function refreshDropdownStyles() {
        const dropdownItems = document.querySelectorAll('.dropdown-menu .list-unstyled li');
        dropdownItems.forEach(item => {
            // Trigger reflow to ensure styles are applied
            item.style.display = 'none';
            item.offsetHeight; // Trigger reflow
            item.style.display = 'flex';
        });
    }
    
    
    // Initialize dropdown indicators and click handlers
    setupDropdownClickHandlers();
});
