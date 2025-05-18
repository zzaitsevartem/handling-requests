function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const button = document.querySelector('.theme-toggle');
    button.innerHTML = document.body.classList.contains('dark-theme')
        ? '<i class="fas fa-sun"></i> Светлая тема'
        : '<i class="fas fa-moon"></i> Тёмная тема';
}