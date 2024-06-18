window.addEventListener('DOMContentLoaded', function() {
    adjustSidebarHeight();
});

window.addEventListener('resize', function() {
    adjustSidebarHeight();
});

function adjustSidebarHeight() {
    var navbarHeight = document.getElementById('main-navbar').offsetHeight;
    var body = document.body
    var html = document.documentElement;

    var windowHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    var sidebar = document.querySelector('.sidebar');
    sidebar.style.height = (windowHeight - navbarHeight) + 'px';
}