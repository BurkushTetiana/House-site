import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initActiveNav();
    initHorizontalCarousel();
    initTimer();
    initFortuneWheel();
    initAuthModal();
    initLanguageSystem();

    setupHeroScroll();
    setupRegisterForm();
    setupConsiliumMessage();
    fixAllHeadersStaticTitle();
});

function fixAllHeadersStaticTitle() {
    const titleEl = document.querySelector('.header-inner .header-title');
    if (titleEl) {
        titleEl.textContent = 'Diagnostic Center';
        titleEl.removeAttribute('data-i18n');
    }
}

function initLanguageSystem() {
    const langButtons = document.querySelectorAll('.lang-btn');
    let currentLang = localStorage.getItem('house-lang') || 'ua';

    function applyLanguage(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (window.translations && window.translations[lang] && window.translations[lang][key]) {
                if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                    el.placeholder = window.translations[lang][key];
                } else {
                    el.textContent = window.translations[lang][key];
                }
            }
        });

        langButtons.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        localStorage.setItem('house-lang', lang);
        fixAllHeadersStaticTitle();
    }

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => applyLanguage(btn.getAttribute('data-lang')));
    });
    applyLanguage(currentLang);
}

function initFortuneWheel() {
    const canvas = document.getElementById('fortune-wheel');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    // Беремо повний список цитат з вашого файлу перекладів
    let currentLang = localStorage.getItem('house-lang') || 'ua';

    // Перевіряємо, чи існують переклади, щоб уникнути помилок
    if (!window.translations || !window.translations[currentLang] || !window.translations[currentLang].quotes) {
        return;
    }

    const localQuotes = window.translations[currentLang].quotes;
    const N = localQuotes.length;
    const colors = ['#32332D', '#292A24', '#3a3b34', '#25261f', '#2e2f29', '#383930'];
    const R = canvas.width / 2;
    let angle = 0, spinning = false, velocity = 0;

    function drawWheel(rot) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < N; i++) {
            const start = rot + (i / N) * Math.PI * 2;
            const end = rot + ((i + 1) / N) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(R, R);
            ctx.arc(R, R, R - 4, start, end);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#5A5B55';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.save();
            ctx.translate(R, R);
            ctx.rotate(start + (end - start) / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#D2A56B';
            ctx.font = 'bold 16px Courier New';
            ctx.fillText(String(i + 1), R - 20, 6);
            ctx.restore();
        }
        ctx.beginPath(); ctx.arc(R, R, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#8F6A3D'; ctx.fill();
        ctx.strokeStyle = '#D2A56B'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(canvas.width - 6, R - 8); ctx.lineTo(canvas.width - 6, R + 8); ctx.lineTo(canvas.width - 28, R);
        ctx.closePath(); ctx.fillStyle = '#D2A56B'; ctx.fill();
    }

    function animate() {
        if (!spinning) return;
        velocity *= 0.985; angle += velocity;
        drawWheel(angle);
        if (velocity < 0.002) {
            spinning = false;
            const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const idx = Math.floor(N - (norm / (Math.PI * 2) * N)) % N;

            // Динамічно підтягуємо цитату потрібною мовою
            let activeLang = localStorage.getItem('house-lang') || 'ua';
            let currentQuotes = window.translations[activeLang].quotes;

            const el = document.getElementById('wheel-quote');
            if (el) typeText(el, currentQuotes[idx]);
        } else {
            requestAnimationFrame(animate);
        }
    }

    canvas.addEventListener('click', () => {
        if (spinning) return;
        spinning = true; velocity = 0.15 + Math.random() * 0.2; animate();
    });
    drawWheel(0);
}
function setupHeroScroll() {
    const scrollBtn = document.querySelector('.hero-banner-section .btn-gold');
    const target = document.querySelector('.message-block');
    const modal = document.getElementById('auth-modal');
    if (!scrollBtn || !target) return;

    scrollBtn.addEventListener('click', () => {
        target.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
            if (!localStorage.getItem('house-user') && modal) {
                modal.classList.add('open');
                showToast('images/use_it_brain.jpg', 'Для опису симптомів необхідна реєстрація!');
            }
        }, 800);
    });
}

function setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('patient-name').value.trim();
        const email = document.getElementById('patient-email').value.trim();
        const phone = document.getElementById('patient-phone').value.trim();
        const dob = document.getElementById('patient-dob').value;
        const agree = document.getElementById('agree-rudeness').checked;

        if (!name || !email || !phone || !dob || !agree) {
            showToast('images/wahui1.jpg', 'Будь ласка, заповніть усі поля профілю пацієнта!');
            return;
        }

        const userObj = { name, email, phone, dob };
        localStorage.setItem('house-user-profile', JSON.stringify(userObj));
        localStorage.setItem('house-user', email);

        showToast('images/shock_worker.jpg', 'Профіль створено! Тепер ви можете надіслати симптоми.');
        form.reset();
        document.getElementById('auth-modal').classList.remove('open');
        updateAuthButtonState();
    });
}

function setupConsiliumMessage() {
    const btn = document.getElementById('send-to-house');
    const textarea = document.querySelector('.message-block textarea');
    const resp = document.getElementById('typing-response');

    if (!btn || !textarea || !resp) return;

    btn.addEventListener('click', async () => {
        const isRegistered = localStorage.getItem('house-user');
        if (!isRegistered) {
            showToast('images/wahui1.jpg', 'Спочатку зареєструйтесь!');
            document.getElementById('auth-modal').classList.add('open');
            return;
        }

        const symptomsDesc = textarea.value.trim();
        if (symptomsDesc.length < 10) {
            showToast('images/use_it_brain.jpg', 'Опис хвороби має містити мінімум 10 символів.');
            return;
        }

        const genderEl = document.querySelector('input[name="main-gender"]:checked');
        const symptomType = document.getElementById('main-symptoms-select').value;

        let profileData;
        try {
            profileData = JSON.parse(localStorage.getItem('house-user-profile'));
        } catch (e) {
            profileData = null;
        }

        if (!profileData) {
            profileData = {
                name: "Анонімний Пацієнт",
                email: isRegistered,
                phone: "Не вказано",
                dob: new Date().toISOString().split('T')[0]
            };
        }

        btn.disabled = true;
        btn.textContent = "Запис у БД...";

        const { error } = await supabase.from('patients').insert([
            {
                name: profileData.name,
                email: profileData.email,
                phone: profileData.phone,
                dob: profileData.dob,
                gender: genderEl ? genderEl.value : 'male',
                symptom_type: symptomType,
                symptoms_desc: symptomsDesc,
                created_at: new Date().toISOString()
            }
        ]);

        btn.disabled = false;
        btn.textContent = "Надіслати на медичний розбір";

        if (error) {
            if (error.code === '23505') {
                showToast('images/wahui1.jpg', 'Цей кейс або Email вже обробляється консиліумом!');
            } else {
                showToast('images/wahui1.jpg', 'Помилка бази даних: ' + error.message);
            }
            return;
        }

        const responses = window.messageResponses || ["Аналіз запущено."];
        typeText(resp, `— ${responses[Math.floor(Math.random() * responses.length)]}`);
        showToast('images/shock_worker.jpg', 'Дані про симптоми успішно записані в таблицю Supabase!');
        textarea.value = '';
    });
}

function initAuthModal() {
    const modal = document.getElementById('auth-modal');
    const triggerBtn = document.getElementById('auth-trigger-btn');
    const closeBtn = document.querySelector('.modal-close-btn');
    if (!modal || !closeBtn) return;

    if (triggerBtn) {
        triggerBtn.addEventListener('click', () => {
            if (localStorage.getItem('house-user')) {
                localStorage.removeItem('house-user');
                localStorage.removeItem('house-user-profile');
                updateAuthButtonState();
                showToast('images/use_it_brain.jpg', 'Ви вийшли з медичного кабінету.');
            } else {
                modal.classList.add('open');
            }
        });
    }
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    updateAuthButtonState();
}

function updateAuthButtonState() {
    const btn = document.getElementById('auth-trigger-btn');
    if (!btn) return;
    const isLangEn = localStorage.getItem('house-lang') === 'en';
    if (localStorage.getItem('house-user')) {
        btn.textContent = isLangEn ? "Sign Out" : "Вийти";
        btn.style.background = "#c0392b";
    } else {
        btn.textContent = isLangEn ? "Sign In" : "Увійти";
        btn.style.background = "var(--accent-dark)";
    }
}

function initTheme() {
    const saved = localStorage.getItem('house-theme') || 'dark';
    if (saved === 'light') document.body.classList.add('light-theme');
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.textContent = saved === 'light' ? '🌙' : '☀️';
        btn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            localStorage.setItem('house-theme', isLight ? 'light' : 'dark');
            btn.textContent = isLight ? '🌙' : '☀️';
        });
    }
}

function initHorizontalCarousel() {
    const frame = document.querySelector('.gallery-carousel-wrap.square-gallery');
    if (!frame) return;
    const slides = frame.querySelectorAll('.carousel-slide');
    if (!slides.length) return;
    let current = 0;

    function show(idx) {
        slides[current].classList.remove('active');
        current = (idx + slides.length) % slides.length;
        slides[current].classList.add('active');
    }

    const btnNext = frame.querySelector('.btn-next');
    const btnPrev = frame.querySelector('.btn-prev');

    let autoPlay = setInterval(() => show(current + 1), 4000);

    function resetInterval() {
        clearInterval(autoPlay);
        autoPlay = setInterval(() => show(current + 1), 4000);
    }

    if (btnNext) btnNext.addEventListener('click', () => { show(current + 1); resetInterval(); });
    if (btnPrev) btnPrev.addEventListener('click', () => { show(current - 1); resetInterval(); });
}

function initTimer() {
    const elTime = document.getElementById('timer-time');
    const elDate = document.getElementById('timer-date');
    const elShift = document.getElementById('timer-shift');
    if (!elTime) return;

    const months = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
    function pad(n) { return String(n).padStart(2, '0'); }

    function update() {
        const now = new Date();
        elTime.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        elDate.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

        if (elShift) {
            const h = now.getHours();
            if (h >= 8 && h < 15) {
                elShift.innerHTML = "Поточна зміна: <strong style='color:#27ae60;'>08:00 - 15:00 (Йде прийом)</strong>";
            } else {
                elShift.innerHTML = "Наступна зміна: <strong style='color:#e74c3c;'>08:00 - 15:00 (Зачинено)</strong>";
            }
        }
    }
    setInterval(update, 1000); update();
}

function initActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.header-nav a').forEach(a => {
        if (a.getAttribute('href') === path) a.classList.add('active');
    });
}

function typeText(el, text) {
    el.textContent = ''; el.style.display = 'block';
    let i = 0;
    const interval = setInterval(() => {
        el.textContent += text[i]; i++;
        if (i >= text.length) clearInterval(interval);
    }, 30);
    window.typeText = typeText;
}

function showToast(imgSrc, text) {
    let toast = document.getElementById('house-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'house-toast'; toast.className = 'house-toast';
        toast.innerHTML = `<img src="" alt="React"><p></p><button class="toast-close">✕</button>`;
        document.body.appendChild(toast);
        toast.querySelector('.toast-close').addEventListener('click', () => toast.classList.remove('show'));
    }
    toast.querySelector('img').src = imgSrc;
    toast.querySelector('p').textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
    window.showToast = showToast;
}

window.calculateCost = function () {
    const pricePerTest = 500;
    const count = document.getElementById('tests-amount').value;
    const total = count * pricePerTest;

    const resultEl = document.getElementById('cost-result');
    resultEl.innerHTML = `Загальна сума за ${count} аналізів: <strong>${total} грн</strong>`;
}

document.addEventListener('DOMContentLoaded', () => {
    const calcBtn = document.getElementById('calc-button');
    const resetBtn = document.getElementById('reset-button');
    const listEl = document.getElementById('selected-list');
    const totalEl = document.getElementById('total-price');

    let total = 0;
    let selectedNames = [];

    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            const select = document.getElementById('test-select');
            const price = parseInt(select.value);
            const name = select.options[select.selectedIndex].text.split(' —')[0];

            total += price;
            selectedNames.push(name);

            listEl.textContent = selectedNames.join(', ');
            totalEl.textContent = `${total} грн`;
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            total = 0;
            selectedNames = [];
            listEl.textContent = "—";
            totalEl.textContent = "0 грн";
        });
    }
});

setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const startShift = 9 * 60;  // 09:00
    const endShift = 15 * 60;   // 15:00

    const countdownEl = document.getElementById('shift-countdown');
    if (!countdownEl) return;

    if (totalMinutes >= startShift && totalMinutes < endShift) {
        const diff = endShift - totalMinutes;
        countdownEl.textContent = `До кінця: ${Math.floor(diff / 60)}г ${diff % 60}хв`;
    } else {
        const startNext = totalMinutes < startShift ? startShift : (24 * 60 + startShift);
        const diff = startNext - totalMinutes;
        countdownEl.textContent = `До початку: ${Math.floor(diff / 60)}г ${diff % 60}хв`;
    }

    const timerTime = document.getElementById('timer-time');
    const timerDate = document.getElementById('timer-date');
    if (timerTime) timerTime.textContent = now.toLocaleTimeString();
    if (timerDate) timerDate.textContent = now.toLocaleDateString();
}, 1000);