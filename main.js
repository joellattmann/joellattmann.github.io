const links = document.querySelectorAll('nav a');
const path = window.location.pathname.split('/').pop() || 'index.html';

links.forEach(a => {
  if (a.getAttribute('href') === path) a.classList.add('active');
});
