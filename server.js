const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Render передаёт PORT
const dataFile = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static('public')); // Если будешь хранить index.html тут

// Инициализация данных
async function init() {
    try {
        await fs.access(dataFile);
    } catch (err) {
        console.log('Data file not found, creating default...');
        await fs.writeFile(dataFile, JSON.stringify({
            main: [
                { id: 1, title: "Идея 1", content: "Описание идеи 1..." },
                { id: 2, title: "Идея 2", content: "Описание идеи 2..." },
                { id: 3, title: "Идея 3", content: "Описание идеи 3..." }
            ],
            1: [
                { id: 101, title: "Задача 1", content: "Детали задачи 1" },
                { id: 102, title: "Задача 2", content: "Детали задачи 2" }
            ],
            2: [
                { id: 201, title: "План 1", content: "Шаг 1, Шаг 2..." }
            ],
            3: []
        }));
    }
}

// Получить доску
app.get('/board/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));
        res.json(data[id] || []);
    } catch (e) {
        console.error('Error reading board:', e);
        res.status(500).json({ error: 'Failed to read board' });
    }
});

// Добавить стикер
app.post('/sticker/:boardId', async (req, res) => {
    const { boardId } = req.params;
    const { title, content } = req.body;
    try {
        const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));

        const newId = Date.now();
        const newSticker = { id: newId, title, content };

        if (!data[boardId]) {
            data[boardId] = [];
        }

        data[boardId].push(newSticker);

        await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
        res.json(newSticker);
    } catch (e) {
        console.error('Error adding sticker:', e);
        res.status(500).json({ error: 'Failed to add sticker' });
    }
});

// Обновить стикер
app.put('/sticker/:boardId/:id', async (req, res) => {
    const { boardId, id } = req.params;
    const { title, content } = req.body;
    try {
        const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));

        const board = data[boardId];
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }

        const sticker = board.find(s => s.id === parseInt(id));
        if (!sticker) {
            return res.status(404).json({ error: 'Sticker not found' });
        }

        sticker.title = title;
        sticker.content = content;

        await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
        res.json(sticker);
    } catch (e) {
        console.error('Error updating sticker:', e);
        res.status(500).json({ error: 'Failed to update sticker' });
    }
});

// Удалить стикер
app.delete('/sticker/:boardId/:id', async (req, res) => {
    const { boardId, id } = req.params;
    try {
        const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));

        const board = data[boardId];
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }

        const index = board.findIndex(s => s.id === parseInt(id));
        if (index === -1) {
            return res.status(404).json({ error: 'Sticker not found' });
        }

        board.splice(index, 1);

        await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
        res.status(204).end();
    } catch (e) {
        console.error('Error deleting sticker:', e);
        res.status(500).json({ error: 'Failed to delete sticker' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

init();
