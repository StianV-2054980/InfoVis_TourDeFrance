window.addEventListener('DOMContentLoaded', function() {
    adjustSidebarHeight();
});

window.addEventListener('resize', function() {
    adjustSidebarHeight();
});

function adjustSidebarHeight() {
    var navbarHeight = document.getElementById('main-navbar').offsetHeight;
    var windowHeight = document.getElementById('main-content').offsetHeight;
    var sidebar = document.querySelector('.sidebar');
    sidebar.style.height = (windowHeight - navbarHeight) + 'px';
}