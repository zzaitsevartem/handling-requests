function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const themeButton = document.querySelector('.theme-toggle');
    themeButton.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        const themeButton = document.querySelector('.theme-toggle');
        themeButton.textContent = 'Светлая тема';
    }

    const form = document.getElementById('request-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const text = document.getElementById('text').value;

        try {
            const response = await fetch('/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, text })
            });

            const data = await response.json();
            if (response.ok) {
                Swal.fire({
                    title: 'Effective Mobile',
                    text: 'Обращение успешно создано!',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
                form.reset();
            } else {
                Swal.fire({
                    title: 'Effective Mobile',
                    text: data.error || 'Ошибка при создании обращения',
                    icon: 'error',
                    toast: true,
                    position: 'top-end'
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Effective Mobile',
                text: 'Не удалось создать обращение: ' + error.message,
                icon: 'error',
                toast: true,
                position: 'top-end'
            });
        }
    });
});