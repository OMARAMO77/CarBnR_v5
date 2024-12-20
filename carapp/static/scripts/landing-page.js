// Debounce function to limit how often a function is called
function debounce(func, wait = 10, immediate = true) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// Scroll spy to highlight menu items based on scroll position
function scrollSpy(navLinks) {
  const sections = Array.from(navLinks)
    .filter(link => link.hash)
    .map(link => document.querySelector(link.hash))
    .filter(section => section !== null);

  function handleScroll() {
    const scrollPos = window.scrollY + window.innerHeight / 2;
    sections.forEach((section, i) => {
      if (section.offsetTop <= scrollPos && section.offsetTop + section.offsetHeight > scrollPos) {
        navLinks.forEach(link => link.classList.remove('active'));
        navLinks[i].classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', debounce(handleScroll));
  handleScroll();  // Initialize scroll spy
}

// Smooth scrolling to section when menu link is clicked
function setupMenuLinks(navLinks) {
  navLinks.forEach(link => {
    // Only add event listeners for links with valid hash values
    if (link.hash && document.querySelector(link.hash)) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetSection = document.querySelector(link.hash);
        if (targetSection) {
          window.scrollTo({
            top: targetSection.offsetTop,
            behavior: 'smooth'
          });
        }
      });
    }
  });
}

// Ensure that the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Show or hide the "Back to Top" button based on scroll position
  const backToTopBtn = document.getElementById('backToTopBtn');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {  // Show the button after scrolling down 300px
      backToTopBtn.style.display = 'block';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  // Smooth scroll to top when the "Back to Top" button is clicked
  backToTopBtn.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Initialize scroll spy and menu links
  const navLinks = document.querySelectorAll('nav a');
  scrollSpy(navLinks);
  setupMenuLinks(navLinks);
});
