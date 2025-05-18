const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

// Инициализация Express
const app = express();
app.use(express.json());

// Настройка CORS для работы с фронтендом
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.static('public'));

// Настройка сессий
app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // В продакшене установи secure: true с HTTPS
}));

// Проверка переменных окружения
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Ошибка: SUPABASE_URL или SUPABASE_KEY не заданы в .env');
    process.exit(1);
}

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Проверка подключения к Supabase
(async () => {
    try {
        const { data, error } = await supabase.from('table-project').select('*').limit(1);
        if (error) throw error;
        console.log('Подключение к Supabase успешно');
    } catch (error) {
        console.error('Ошибка подключения к Supabase:', error.message);
        process.exit(1);
    }
})();

// Middleware для проверки авторизации
const checkAuth = (req, res, next) => {
    console.log('Проверка авторизации:', req.session);
    if (req.session.isAuthenticated) {
        return next();
    }
    console.log('Пользователь не авторизован');
    res.status(401).json({ error: 'Не авторизован' });
};

// Роуты для страниц
app.get('/create', (req, res) => {
    res.sendFile(__dirname + '/public/create.html');
});

app.get('/employee', (req, res) => {
    res.sendFile(__dirname + '/public/employee.html');
});

// Аутентификация сотрудника
app.post('/login', (req, res) => {
    const { password } = req.body;
    const correctPassword = 'pass123';
    if (password === correctPassword) {
        req.session.isAuthenticated = true;
        console.log('Авторизация успешна:', req.session);
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Неверный пароль' });
    }
});

// Создание нового обращения
app.post('/requests', async (req, res) => {
    const { title, text } = req.body;
    if (!title || !text) {
        return res.status(400).json({ error: 'Тема и текст обращения обязательны' });
    }
    try {
        const { data, error } = await supabase
            .from('table-project')
            .insert({ title, text, status: 'новое', createdAt: new Date().toISOString() })
            .select()
            .single();
        if (error) throw error;
        console.log('Создано обращение:', data);
        res.status(201).json(data);
    } catch (error) {
        console.error('Ошибка при создании обращения:', error.message);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Взятие обращения в работу
app.put('/requests/:id/take', checkAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('table-project')
            .update({ status: 'в работе', updatedAt: new Date().toISOString() })
            .eq('id', parseInt(req.params.id))
            .select()
            .single();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Обращение не найдено' });
        }
        res.json(data);
    } catch (error) {
        console.error('Ошибка при взятии обращения в работу:', error.message);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Завершение обращения
app.put('/requests/:id/complete', checkAuth, async (req, res) => {
    const { solution } = req.body;
    if (!solution) {
        return res.status(400).json({ error: 'Текст решения обязателен' });
    }
    try {
        const { data, error } = await supabase
            .from('table-project')
            .update({ status: 'завершено', solution, updatedAt: new Date().toISOString() })
            .eq('id', parseInt(req.params.id))
            .select()
            .single();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Обращение не найдено' });
        }
        res.json(data);
    } catch (error) {
        console.error('Ошибка при завершении обращения:', error.message);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Отмена обращения
app.put('/requests/:id/cancel', checkAuth, async (req, res) => {
    const { cancelReason } = req.body;
    if (!cancelReason) {
        return res.status(400).json({ error: 'Причина отмены обязательна' });
    }
    try {
        const { data, error } = await supabase
            .from('table-project')
            .update({ status: 'отменено', cancelReason, updatedAt: new Date().toISOString() })
            .eq('id', parseInt(req.params.id))
            .select()
            .single();
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Обращение не найдено' });
        }
        res.json(data);
    } catch (error) {
        console.error('Ошибка при отмене обращения:', error.message);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Получение списка обращений
app.get('/requests', checkAuth, async (req, res) => {
    const { date, startDate, endDate } = req.query;
    let query = supabase.from('table-project').select('*');

    if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        query = query.gte('createdAt', start.toISOString()).lte('createdAt', end.toISOString());
    } else if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.gte('createdAt', start.toISOString()).lte('createdAt', end.toISOString());
    }

    try {
        const { data, error } = await query.order('createdAt', { ascending: false });
        if (error) throw error;
        console.log('Возвращены обращения:', data);
        res.json(data);
    } catch (error) {
        console.error('Ошибка при получении обращений:', error.message);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Массовое завершение обращений "в работе"
app.put('/requests/cancel-in-progress', checkAuth, async (req, res) => {
    const { cancelReason } = req.body;
    if (!cancelReason) {
        return res.status(400).json({ error: 'Причина отмены обязательна' });
    }
    try {
        const { data: inProgressRequests, error: fetchError } = await supabase
            .from('table-project')
            .select('id')
            .eq('status', 'в работе');
        if (fetchError) throw fetchError;

        if (inProgressRequests.length > 0) {
            const { data, error } = await supabase
                .from('table-project')
                .update({ status: 'отменено', cancelReason, updatedAt: new Date().toISOString() })
                .eq('status', 'в работе')
                .select();
            if (error) throw error;
            res.json({ message: `Отменено ${data.length} обращений` });
        } else {
            res.json({ message: `Отменено 0 обращений` });
        }
    } catch (error) {
        console.error('Ошибка при массовой отмене обращений:', error.message);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Удаление обращения
app.delete('/requests/:id', checkAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`Попытка удаления обращения с id: ${id} (тип: ${typeof id})`);
    try {
        const { data, error } = await supabase
            .from('table-project')
            .delete()
            .eq('id', id)
            .select();
        if (error) throw error;
        if (!data || data.length === 0) {
            console.log(`Обращение с id ${id} не найдено или уже удалено`);
            return res.status(404).json({ error: 'Обращение не найдено или уже удалено' });
        }
        console.log(`Обращение с id ${id} успешно удалено:`, data);
        res.json({ message: 'Обращение удалено' });
    } catch (error) {
        console.error('Ошибка при удалении обращения:', error.message);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});