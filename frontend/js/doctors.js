// ==================== Doctors Page Logic ====================

// State
let currentFilters = {
    specialtyId: '',
    cityId: '',
    maxPrice: 1000,
    minExperience: 0,
    q: '',
    sortBy: 'experience'
};

let allDoctors = [];
let allSpecialties = [];
let allCities = [];

// ==================== URL Params ====================
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        specialty: params.get('specialty') || '',
        city: params.get('city') || ''
    };
}

// ==================== Debounce ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== Initialize Filters ====================
function initFilters() {
    const urlParams = getUrlParams();
    
    if (urlParams.specialty) {
        currentFilters.specialtyId = urlParams.specialty;
        const select = document.getElementById('filterSpecialty');
        if (select) select.value = urlParams.specialty;
    }
    if (urlParams.city) {
        currentFilters.cityId = urlParams.city;
        const select = document.getElementById('filterCity');
        if (select) select.value = urlParams.city;
    }
    
    const nameSearch = document.getElementById('nameSearch');
    if (nameSearch) {
        nameSearch.addEventListener('input', debounce((e) => {
            currentFilters.q = e.target.value;
            applyFilters();
        }, 300));
    }
    
    const filterSpecialty = document.getElementById('filterSpecialty');
    if (filterSpecialty) {
        filterSpecialty.addEventListener('change', (e) => {
            currentFilters.specialtyId = e.target.value;
            applyFilters();
        });
    }
    
    const filterCity = document.getElementById('filterCity');
    if (filterCity) {
        filterCity.addEventListener('change', (e) => {
            currentFilters.cityId = e.target.value;
            applyFilters();
        });
    }
    
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            currentFilters.maxPrice = parseInt(e.target.value);
            const priceValue = document.getElementById('priceValue');
            if (priceValue) priceValue.textContent = `حتى ${e.target.value} ج.م`;
            applyFilters();
        });
    }
    
    document.querySelectorAll('.experience-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.experience-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilters.minExperience = parseInt(btn.dataset.value) || 0;
            applyFilters();
        });
    });
    
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            currentFilters.sortBy = e.target.value;
            applyFilters();
        });
    }
    
    const sortByMobile = document.getElementById('sortByMobile');
    if (sortByMobile) {
        sortByMobile.addEventListener('change', (e) => {
            currentFilters.sortBy = e.target.value;
            if (sortBy) sortBy.value = e.target.value;
            applyFilters();
        });
    }
}

// ==================== Clear All Filters ====================
function clearAllFilters() {
    currentFilters = { 
        specialtyId: '', 
        cityId: '', 
        maxPrice: 1000, 
        minExperience: 0, 
        q: '', 
        sortBy: 'experience' 
    };
    
    const nameSearch = document.getElementById('nameSearch');
    if (nameSearch) nameSearch.value = '';
    
    const filterSpecialty = document.getElementById('filterSpecialty');
    if (filterSpecialty) filterSpecialty.value = '';
    
    const filterCity = document.getElementById('filterCity');
    if (filterCity) filterCity.value = '';
    
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.value = 1000;
        const priceValue = document.getElementById('priceValue');
        if (priceValue) priceValue.textContent = 'حتى 1000 ج.م';
    }
    
    document.querySelectorAll('.experience-btn').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('[data-value="0"]');
    if (allBtn) allBtn.classList.add('active');
    
    const sortBy = document.getElementById('sortBy');
    if (sortBy) sortBy.value = 'experience';
    const sortByMobile = document.getElementById('sortByMobile');
    if (sortByMobile) sortByMobile.value = 'experience';
    
    applyFilters();
}

// ==================== Apply Filters ====================
function applyFilters() {
    let filtered = [...allDoctors];
    
    if (currentFilters.specialtyId) {
        filtered = filtered.filter(d => {
            const matchId = d.specialtyId === parseInt(currentFilters.specialtyId);
            const specOption = document.querySelector(`#filterSpecialty option[value="${currentFilters.specialtyId}"]`);
            const matchName = specOption && d.specialtyName && d.specialtyName.includes(specOption.textContent);
            return matchId || matchName;
        });
    }
    
    if (currentFilters.cityId) {
        filtered = filtered.filter(d => {
            const matchId = d.cityId === parseInt(currentFilters.cityId);
            const cityOption = document.querySelector(`#filterCity option[value="${currentFilters.cityId}"]`);
            const matchName = cityOption && d.cityName && d.cityName.includes(cityOption.textContent);
            return matchId || matchName;
        });
    }
    
    if (currentFilters.maxPrice < 1000) {
        filtered = filtered.filter(d => (d.price || 0) <= currentFilters.maxPrice);
    }
    
    if (currentFilters.minExperience > 0) {
        filtered = filtered.filter(d => (d.yearsOfExperience || 0) >= currentFilters.minExperience);
    }
    
    if (currentFilters.q) {
        const q = currentFilters.q.toLowerCase();
        filtered = filtered.filter(d => 
            (d.fullName || '').toLowerCase().includes(q) || 
            (d.specialtyName || '').toLowerCase().includes(q)
        );
    }
    
    filtered.sort((a, b) => {
        if (currentFilters.sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (currentFilters.sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
        return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
    });
    
    renderDoctorsList(filtered);
    updateFilterUI();
}

// ==================== Render Doctors List ====================
function renderDoctorsList(doctors) {
    const container = document.getElementById('doctorsList');
    const countEl = document.getElementById('resultsCount');
    const emptyState = document.getElementById('emptyState');
    
    if (countEl) {
        countEl.textContent = `تم العثور على ${doctors.length} طبيب`;
    }
    
    if (doctors.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }
    
    if (emptyState) emptyState.classList.add('d-none');
    if (!container) return;
    
    container.innerHTML = doctors.map(doc => `
        <div class="card border-0 shadow-sm mb-3 doctor-list-item">
            <div class="card-body p-4">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="d-flex gap-3">
                            <div class="doctor-avatar flex-shrink-0 d-flex align-items-center justify-content-center text-white fw-bold" 
                                 style="background-color: ${doc.avatarColor || '#1E88E5'}; width: 64px; height: 64px; font-size: 1.25rem; border-radius: 12px;">
                                ${doc.initials || (doc.fullName ? doc.fullName.charAt(0) : 'د')}
                            </div>
                            <div>
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <h5 class="fw-bold mb-0">${doc.fullName || '—'}</h5>
                                    <span class="badge-available"><i class="bi bi-check-circle"></i> متاح</span>
                                </div>
                                <p class="text-primary fw-semibold small mb-2">${doc.specialtyName || '—'}</p>
                                <div class="d-flex gap-3 text-muted small mb-2">
                                    <span><i class="bi bi-briefcase"></i> ${doc.yearsOfExperience || 0}+ سنة خبرة</span>
                                    <span><i class="bi bi-geo-alt"></i> ${doc.cityName || '—'}</span>
                                </div>
                                <div class="rating-stars">
                                    ${renderStars(doc.rating)}
                                    <span class="rating-value">${(doc.rating || 0).toFixed(1)}</span>
                                    <span class="rating-count">(${(doc.reviewCount || 0).toLocaleString('ar-EG')} تقييم)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-md-start mt-3 mt-md-0">
                        <div class="d-flex flex-md-column align-items-center align-items-md-start justify-content-between gap-2">
                            <div class="text-md-start">
                                <span class="small text-muted d-block">سعر الكشف</span>
                                <span class="h3 fw-bold text-primary">${formatPrice(doc.price)}</span>
                            </div>
                            <a href="doctor-details.html?id=${doc.id}" class="btn btn-primary rounded-pill px-4">
                                احجز الآن
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStars(rating) {
    let stars = '';
    const rounded = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
        stars += i <= rounded
            ? '<i class="bi bi-star-fill text-warning"></i>'
            : '<i class="bi bi-star text-muted"></i>';
    }
    return stars;
}

function formatPrice(price) {
    if (!price && price !== 0) return '—';
    return `${Number(price).toFixed(Number(price) % 1 === 0 ? 0 : 2)} ج.م`;
}

// ==================== Update Filter UI ====================
function updateFilterUI() {
    const hasFilters = currentFilters.specialtyId || currentFilters.cityId || 
                       currentFilters.maxPrice < 1000 || currentFilters.minExperience > 0 || currentFilters.q;
    
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.style.display = hasFilters ? 'inline-flex' : 'none';
    }
    
    const specSelect = document.getElementById('filterSpecialty');
    const specName = specSelect && specSelect.value ? specSelect.options[specSelect.selectedIndex].text : '';
    const citySelect = document.getElementById('filterCity');
    const cityName = citySelect && citySelect.value ? citySelect.options[citySelect.selectedIndex].text : '';
    
    const pageTitle = document.getElementById('pageTitle');
    if (!pageTitle) return;
    
    let title = 'البحث عن طبيب';
    if (specName && specName !== 'كل التخصصات') {
        title = `أطباء ${specName}`;
        if (cityName && cityName !== 'كل المدن') title += ` في ${cityName}`;
    } else if (cityName && cityName !== 'كل المدن') {
        title = `أطباء في ${cityName}`;
    }
    pageTitle.textContent = title;
}

// ==================== Load Specialties ====================
async function loadSpecialties() {
    try {
        const specialties = await api.getSpecialties();
        allSpecialties = specialties;
        
        const select = document.getElementById('filterSpecialty');
        if (select) {
            select.innerHTML = '<option value="">كل التخصصات</option>' +
                specialties.map(s => `<option value="${s.id}">${s.name_ar}</option>`).join('');
        }
        
        const urlParams = getUrlParams();
        if (urlParams.specialty && select) {
            select.value = urlParams.specialty;
            currentFilters.specialtyId = urlParams.specialty;
        }
    } catch (err) {
        console.error('Failed to load specialties:', err);
    }
}

// ==================== Load Cities ====================
async function loadCities() {
    try {
        const cities = await api.getCities();
        allCities = cities;
        
        const select = document.getElementById('filterCity');
        if (select) {
            select.innerHTML = '<option value="">كل المدن</option>' +
                cities.map(c => `<option value="${c.id}">${c.nameAr}</option>`).join('');
        }
        
        const urlParams = getUrlParams();
        if (urlParams.city && select) {
            select.value = urlParams.city;
            currentFilters.cityId = urlParams.city;
        }
    } catch (err) {
        console.error('Failed to load cities:', err);
    }
}

// ==================== Load Doctors ====================
async function loadDoctors() {
    const container = document.getElementById('doctorsList');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جارٍ التحميل...</span>
                </div>
            </div>
        `;
    }
    
    try {
        const doctors = await api.getDoctors();
        allDoctors = doctors;
        applyFilters();
    } catch (err) {
        console.error('Failed to load doctors:', err);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">فشل تحميل الأطباء. حاول مرة أخرى.</div>
            `;
        }
    }
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadSpecialties();
    loadCities();
    loadDoctors();
    initFilters();
});