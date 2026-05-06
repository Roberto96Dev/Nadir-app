// --- CONFIGURAZIONE AUDIO ---
const soundClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
const soundSuccess = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

soundClick.volume = 0.2;
soundSuccess.volume = 0.4;

// --- VARIABILI GLOBALI ---
let currentDisplayDate = new Date();

// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('dateInput');
    if (dateInput) dateInput.valueAsDate = new Date();

    // Carica il tema salvato
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerText = '☀️ Modalità Giorno';
    }

    renderCalendar();
    
    // Richiesta notifiche
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
});

// --- FUNZIONI CORE ---
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    const categoryInput = document.getElementById('categoryInput');

    if (taskInput.value.trim() === '') return alert("Scrivi qualcosa!");

    const taskObj = {
        text: taskInput.value,
        date: dateInput.value,
        time: timeInput.value,
        category: categoryInput.value,
        notified: false,
        id: Date.now()
    };

    saveLocalTask(taskObj);
    soundSuccess.play().catch(() => {});
    
    taskInput.value = '';
    renderCalendar();
}

function saveLocalTask(task) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function removeTask(id) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderCalendar();
}

// --- CALENDARIO ---
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthYearLabel = document.getElementById('monthDisplay');
    if (!grid || !monthYearLabel) return;

    grid.innerHTML = '';
    const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth();
    
    monthYearLabel.innerText = currentDisplayDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < offset; i++) {
        grid.innerHTML += `<div class="calendar-day empty"></div>`;
    }

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.date === dateStr);
        const isToday = new Date().toISOString().split('T')[0] === dateStr ? 'today' : '';
        const dotsHtml = dayTasks.map(t => `<div class="task-dot cat-${t.category}"></div>`).join('');

        grid.innerHTML += `
            <div class="calendar-day ${isToday}" onclick="openModal('${dateStr}')">
                <span>${day}</span>
                <div class="dots-container">${dotsHtml}</div>
            </div>`;
    }
}

function changeMonth(diff) {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() + diff);
    renderCalendar();
}

// --- MODAL ---
function openModal(dateStr) {
    soundClick.play().catch(() => {});
    const modal = document.getElementById('taskModal');
    const list = document.getElementById('modalTaskList');
    const title = document.getElementById('modalDateTitle');
    
    list.innerHTML = '';
    title.innerText = `Impegni del ${new Date(dateStr).toLocaleDateString('it-IT')}`;
    
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const dayTasks = tasks.filter(t => t.date === dateStr);

    if (dayTasks.length === 0) {
        list.innerHTML = '<li>Nessun impegno</li>';
    } else {
        dayTasks.forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="modal-task-row">
                    <span><strong>${task.time || '--:--'}</strong> ${task.text}</span>
                    <button class="delete-btn" onclick="removeTask(${task.id}); openModal('${dateStr}')">Elimina</button>
                </div>`;
            list.appendChild(li);
        });
    }
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById('taskModal').style.display = "none";
}

window.onclick = (event) => {
    if (event.target == document.getElementById('taskModal')) closeModal();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggle').innerText = isDark ? '☀️ Modalità Giorno' : '🌙 Modalità Notte';
}

function checkNotifications() {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    const currentDate = now.toISOString().split('T')[0];
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    tasks.forEach(task => {
        if (task.date === currentDate && task.time === currentTime && !task.notified) {
            new Notification("Cyber Agenda", { body: `Ora di: ${task.text}` });
            task.notified = true;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    });
}
setInterval(checkNotifications, 30000);