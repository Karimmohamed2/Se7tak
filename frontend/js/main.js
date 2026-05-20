// ==================== Main Page Logic (index.html) ====================
let allSpecialties = [];
let allCities = [];

// ==================== Formatters ====================
function formatPrice(price) {
    if (!price && price !== 0) return '—';
    return `${Number(price).toFixed(Number(price) % 1 === 0 ? 0 : 2)} ج.م`;
}

function getIconClass(iconName) {
    const iconMap = {
        'emoji-smile': 'bi-emoji-smile',
        'fingerprint': 'bi-fingerprint',
        'heart': 'bi-heart',
        'eye': 'bi-eye',
        'brain': 'bi-brain',
        'person-walking': 'bi-person-walking',
        'stethoscope': 'bi-stethoscope'
    };
    return iconMap[iconName] || 'bi-circle';
}

function renderStars(rating) {
    let stars = '';
    const rounded = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
        stars += i <= rounded ? '<i class="bi bi-star-fill text-warning"></i>' : '<i class="bi bi-star text-muted"></i>';
    }
    return stars;
}

// ==================== Render Functions ====================
function renderSpecialties(specialties) {
    const grid = document.getElementById('specialtiesGrid');
    if (!grid) return;
    if (!specialties || specialties.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">لا توجد تخصصات متاحة حالياً</p></div>';
        return;
    }
    grid.innerHTML = specialties.map(spec => `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="specialty-card" onclick="window.location.href='doctors.html?specialty=${spec.id}'">
                <div class="specialty-icon"><i class="bi ${getIconClass(spec.icon)}"></i></div>
                <div class="specialty-info"><h5>${spec.name_ar}</h5><p class="text-muted small mb-0">${spec.doctorCount || 0} دكتور</p></div>
            </div>
        </div>
    `).join('');
}

function renderDoctors(doctors) {
    const grid = document.getElementById('topDoctorsGrid');
    if (!grid) return;
    if (!doctors || doctors.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">لا يوجد أطباء متاحين حالياً</p></div>';
        return;
    }
    grid.innerHTML = doctors.map(doc => `
        <div class="col-12 col-sm-6 col-lg-3">
            <div class="doctor-card h-100">
                <div class="doctor-card-header">
                    <div class="doctor-avatar d-flex align-items-center justify-content-center text-white fw-bold" style="background-color: ${doc.avatarColor || '#1E88E5'}; width: 48px; height: 48px; border-radius: 12px; font-size: 0.9rem;">
                        ${doc.initials || (doc.fullName ? doc.fullName.charAt(0) : 'د')}
                    </div>
                    <div class="doctor-info flex-grow-1">
                        <h5 class="mb-1 fw-bold" style="font-size: 0.95rem;">${doc.fullName || '—'}</h5>
                        <p class="specialty mb-1" style="color: var(--primary); font-size: 0.85rem; font-weight: 600;">${doc.specialtyName || '—'}</p>
                        <span class="badge-available"><i class="bi bi-check-circle"></i> متاح</span>
                    </div>
                </div>
                <div class="doctor-card-body">
                    <div class="doctor-meta mb-2">
                        <span class="d-block"><i class="bi bi-briefcase"></i> ${doc.yearsOfExperience || 0} سنة خبرة</span>
                        <span class="d-block"><i class="bi bi-geo-alt"></i> ${doc.cityName || '—'}</span>
                    </div>
                    <div class="rating-stars mb-2">
                        ${renderStars(doc.rating)}
                        <span class="rating-value">${(doc.rating || 0).toFixed(1)}</span>
                        <span class="rating-count">(${(doc.reviewCount || 0).toLocaleString('ar-EG')} تقييم)</span>
                    </div>
                </div>
                <div class="doctor-card-footer">
                    <div><span class="price-label d-block" style="font-size: 0.75rem; color: var(--text-muted);">الكشف</span><span class="price-value" style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">${formatPrice(doc.price)}</span></div>
                    <a href="doctor-details.html?id=${doc.id}" class="btn btn-primary btn-sm rounded-pill px-4">احجز الآن</a>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPharmacies(pharmacies) {
    const grid = document.getElementById('pharmaciesGrid');
    if (!grid) return;
    if (!pharmacies || pharmacies.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">لا توجد صيدليات متاحة حالياً</p></div>';
        return;
    }
    grid.innerHTML = pharmacies.slice(0, 4).map(pharm => `
        <div class="col-12 col-md-6">
            <a href="pharmacy-details.html?id=${pharm.id}" class="text-decoration-none">
                <div class="pharmacy-card">
                    <div class="pharmacy-icon flex-shrink-0"><i class="bi bi-capsule"></i></div>
                    <div class="pharmacy-info flex-grow-1 min-w-0">
                        <h5 class="mb-1">${pharm.name}</h5>
                        <p class="mb-0 text-muted" style="font-size: 0.8rem;">${pharm.cityName || ''}${pharm.addressDetail ? '، ' + pharm.addressDetail : ''}</p>
                    </div>
                    ${pharm.isOpen24h ? '<span class="badge-24h">مفتوح 24/7</span>' : '<span class="badge-closed">ساعات محددة</span>'}
                </div>
            </a>
        </div>
    `).join('');
}

// ==================== Auth UI ====================
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const token = localStorage.getItem('auth_token');
    if (!authButtons) return;
    if (token) {
        let user = null;
        try { const stored = localStorage.getItem('auth_user'); if (stored) user = JSON.parse(stored); } catch(e) {}
        const initial = user ? (user.fullName || user.email || '؟').charAt(0).toUpperCase() : '؟';
        const name = user ? (user.fullName || 'حسابي') : 'حسابي';
        authButtons.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-light rounded-pill dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;font-size:0.85rem;font-weight:600;">${initial}</div>
                    <span class="d-none d-sm-inline">${name}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="dashboard.html"><i class="bi bi-speedometer2 me-2"></i>لوحة التحكم</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="if(window.api) api.logout(); else { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); window.location.href='index.html'; } return false;"><i class="bi bi-box-arrow-right me-2"></i>تسجيل الخروج</a></li>
                </ul>
            </div>
        `;
    } else {
        authButtons.innerHTML = `<a href="login.html" class="btn btn-outline-primary rounded-pill px-4">تسجيل الدخول</a><a href="register.html" class="btn btn-primary rounded-pill px-4">إنشاء حساب</a>`;
    }
}

// ==================== Search Form ====================
function initSearchForm() {
    const form = document.getElementById('heroSearchForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const specialty = document.getElementById('specialtySelect').value;
        const city = document.getElementById('citySelect').value;
        const params = new URLSearchParams();
        if (specialty) params.set('specialty', specialty);
        if (city) params.set('city', city);
        window.location.href = `doctors.html?${params.toString()}`;
    });
}

function quickSearch(specialtyId) {
    window.location.href = `doctors.html?specialty=${specialtyId}`;
}

// ==================== Load Cities for Hero Search ====================
async function loadCitiesForHero() {
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) return;
    try {
        const cities = await api.getCities();
        allCities = cities;
        citySelect.innerHTML = '<option value="">اختر المدينة</option>' + cities.map(c => `<option value="${c.id}">${c.nameAr}</option>`).join('');
    } catch (err) {
        console.error('Failed to load cities for hero:', err);
        const fallbackCities = [{ id: 1, nameAr: 'القاهرة' }, { id: 2, nameAr: 'الجيزة' }, { id: 3, nameAr: 'الإسكندرية' }];
        allCities = fallbackCities;
        citySelect.innerHTML = '<option value="">اختر المدينة</option>' + fallbackCities.map(c => `<option value="${c.id}">${c.nameAr}</option>`).join('');
    }
}

async function loadSpecialtiesForHero() {
    const specialtySelect = document.getElementById('specialtySelect');
    if (!specialtySelect) return;
    try {
        const specialties = await api.getSpecialties();
        allSpecialties = specialties;
        specialtySelect.innerHTML = '<option value="">اختر التخصص</option>' + specialties.map(s => `<option value="${s.id}">${s.name_ar}</option>`).join('');
    } catch (err) {
        console.error('Failed to load specialties for hero:', err);
    }
}

// ==================== Load Page Data ====================
async function loadPageData() {
    try {
        const specialties = await api.getSpecialties();
        allSpecialties = specialties;
        renderSpecialties(specialties);
        loadSpecialtiesForHero();
    } catch (err) { console.error('Failed to load specialties:', err); }
    try {
        const doctors = await api.getFeaturedDoctors(4);
        renderDoctors(doctors);
    } catch (err) { console.error('Failed to load doctors:', err); renderDoctors([]); }
    try {
        const pharmacies = await api.getPharmacies();
        renderPharmacies(pharmacies);
    } catch (err) { console.error('Failed to load pharmacies:', err); renderPharmacies([]); }
    await loadCitiesForHero();
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initSearchForm();
    loadPageData();
});

// Make functions available globally
window.quickSearch = quickSearch;