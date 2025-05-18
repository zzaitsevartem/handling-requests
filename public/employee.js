function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const themeButton = document.querySelector('.theme-toggle');
    themeButton.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
}

document.addEventListener('DOMContentLoaded', async () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        const themeButton = document.querySelector('.theme-toggle');
        themeButton.textContent = 'Светлая тема';
    }

    let attempts = 3;
    while (attempts > 0) {
        const { value: password } = await Swal.fire({
            title: 'Введите пароль',
            input: 'password',
            inputPlaceholder: 'Пароль...',
            showCancelButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonText: 'Войти',
            footer: attempts < 3 ? `<span style="color: red; font-size: 0.9rem;">Осталось попыток: ${attempts}</span>` : null,
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off'
            }
        });

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                fetchRequests();
                return;
            } else {
                attempts--;
                if (attempts > 0) {
                    await Swal.fire({
                        title: 'Effective Mobile',
                        text: 'Неверный пароль',
                        icon: 'error',
                        confirmButtonText: 'Попробовать снова'
                    });
                } else {
                    await Swal.fire({
                        title: 'Effective Mobile',
                        text: 'Попытки закончились',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                    window.location.href = '/create';
                }
            }
        } catch (error) {
            Swal.fire({
                title: 'Effective Mobile',
                text: 'Ошибка авторизации: ' + error.message,
                icon: 'error',
                confirmButtonText: 'Попробовать снова'
            }).then(() => {
                window.location.href = '/create';
            });
        }
    }
});

async function fetchRequests() {
    const date = document.getElementById('filter-date').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;

    let url = '/requests';
    if (date) {
        url += `?date=${date}`;
    } else if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    try {
        const response = await fetch(url, { credentials: 'include' });
        const requests = await response.json();
        if (response.ok) {
            displayRequests(requests);
        } else {
            Swal.fire({
                title: 'Effective Mobile',
                text: requests.error || 'Не авторизован',
                icon: 'error',
                confirmButtonText: 'Попробовать снова'
            }).then(() => {
                window.location.href = '/create';
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Effective Mobile',
            text: 'Не удалось загрузить обращения: ' + error.message,
            icon: 'error',
            toast: true,
            position: 'top-end'
        });
    }
}

function displayRequests(requests) {
    const tbody = document.getElementById('requests-body');
    tbody.innerHTML = '';

    requests.forEach(request => {
        const createdAt = request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Дата не указана';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.title}</td>
            <td>${request.text}</td>
            <td>${request.status}</td>
            <td>${request.solution || ''}</td>
            <td>${request.cancelReason || ''}</td>
            <td>${createdAt}</td>
            <td class="action-buttons">
                ${request.status === 'новое' ? `<button onclick="takeRequest('${request.id}')"><i class="fas fa-play"></i> Взять в работу</button>` : ''}
                ${request.status === 'в работе' ? `
                    <button onclick="completeRequest('${request.id}')"><i class="fas fa-check"></i> Завершить</button>
                    <button onclick="cancelRequest('${request.id}')"><i class="fas fa-times"></i> Отменить</button>
                ` : ''}
                ${request.status === 'завершено' || request.status === 'отменено' ? `<button onclick="deleteRequest('${request.id}')"><i class="fas fa-trash"></i> Очистить</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function takeRequest(id) {
    try {
        const response = await fetch(`/requests/${id}/take`, {
            method: 'PUT',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            fetchRequests();
            Swal.fire({
                title: 'Effective Mobile',
                text: 'Обращение взято в работу!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            Swal.fire({
                title: 'Effective Mobile',
                text: data.error || 'Ошибка при взятии в работу',
                icon: 'error',
                toast: true,
                position: 'top-end'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Effective Mobile',
            text: 'Не удалось взять в работу: ' + error.message,
            icon: 'error',
            toast: true,
            position: 'top-end'
        });
    }
}

async function completeRequest(id) {
    const { value: solution } = await Swal.fire({
        title: 'Введите решение',
        input: 'text',
        inputPlaceholder: 'Напишите решение...',
        showCancelButton: true,
        cancelButtonText: 'Отмена',
        confirmButtonText: 'Подтвердить'
    });

    if (!solution) return;

    try {
        const response = await fetch(`/requests/${id}/complete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ solution }),
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            fetchRequests();
            Swal.fire({
                title: 'Effective Mobile',
                text: 'Обращение завершено!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            Swal.fire({
                title: 'Effective Mobile',
                text: data.error || 'Ошибка при завершении',
                icon: 'error',
                toast: true,
                position: 'top-end'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Effective Mobile',
            text: 'Не удалось завершить: ' + error.message,
            icon: 'error',
            toast: true,
            position: 'top-end'
        });
    }
}

async function cancelRequest(id) {
    const { value: cancelReason } = await Swal.fire({
        title: 'Введите причину отмены',
        input: 'text',
        inputPlaceholder: 'Напишите причину...',
        showCancelButton: true,
        cancelButtonText: 'Отмена',
        confirmButtonText: 'Подтвердить'
    });

    if (!cancelReason) return;

    try {
        const response = await fetch(`/requests/${id}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancelReason }),
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            fetchRequests();
            Swal.fire({
                title: 'Effective Mobile',
                text: 'Обращение отменено!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            Swal.fire({
                title: 'Effective Mobile',
                text: data.error || 'Ошибка при отмене',
                icon: 'error',
                toast: true,
                position: 'top-end'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Effective Mobile',
            text: 'Не удалось отменить: ' + error.message,
            icon: 'error',
            toast: true,
            position: 'top-end'
        });
    }
}

async function cancelAllInProgress() {
    const { value: cancelReason } = await Swal.fire({
        title: 'Причина отмены всех "в работе"',
        input: 'text',
        inputPlaceholder: 'Напишите причину...',
        showCancelButton: true,
        cancelButtonText: 'Отмена',
        confirmButtonText: 'Подтвердить'
    });

    if (!cancelReason) return;

    try {
        const response = await fetch('/requests/cancel-in-progress', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancelReason }),
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            fetchRequests();
            Swal.fire({
                title: 'Effective Mobile',
                text: data.message,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            Swal.fire({
                title: 'Effective Mobile',
                text: data.error || 'Ошибка при массовой отмене',
                icon: 'error',
                toast: true,
                position: 'top-end'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Effective Mobile',
            text: 'Не удалось отменить: ' + error.message,
            icon: 'error',
            toast: true,
            position: 'top-end'
        });
    }
}

async function deleteRequest(id) {
    try {
        const response = await fetch(`/requests/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            fetchRequests();
            Swal.fire({
                title: 'Effective Mobile',
                text: 'Обращение удалено!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            Swal.fire({
                title: 'Effective Mobile',
                text: data.error || 'Ошибка при удалении',
                icon: 'error',
                toast: true,
                position: 'top-end'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Effective Mobile',
            text: 'Не удалось удалить обращение: ' + error.message,
            icon: 'error',
            toast: true,
            position: 'top-end'
        });
    }
}