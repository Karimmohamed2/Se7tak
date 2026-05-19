// ==================== Pharmacies Page Logic ====================
let allPharmacies = [];
let currentFilter = 'all';
let searchQuery = '';

// Mock data (fallback)
const mockPharmacies = [
    { id: 'p1', name: 'صيدلية النصر', cityName: 'القاهرة', addressDetail: 'مدينة نصر - شارع النصر', phone: '01012345678', isOpen24h: true, averageRating: 4.5, reviewsCount: 128, description: 'صيدلية متكاملة على مدار 24 ساعة.' },
    { id: 'p2', name: 'صيدلية العزبي', cityName: 'الجيزة', addressDetail: 'الدقي - شارع التحرير', phone: '01112223344', isOpen24h: false, averageRating: 4.2, reviewsCount: 85 },
    { id: 'p3', name: 'صيدلية 19011', cityName: 'الإسكندرية', addressDetail: 'سموحة - شارع جمال عبد الناصر', phone: '01555556666', isOpen24h: true, averageRating: 4.8, reviewsCount: 256 },
    { id: 'p4', name: 'صيدلية المصري', cityName: 'القاهرة', addressDetail: 'المعادي - شارع 9', phone: '01000001111', isOpen24h: false, averageRating: 4.0, reviewsCount: 64 },
    { id: 'p5', name: 'صيدلية الحياة', cityName: 'الإسكندرية', addressDetail: 'سموحة، 34 شارع أبو قير', phone: '01022222222', isOpen24h: true, averageRating: 4.3, reviewsCount: 95 },
    { id: 'p6', name: 'صيدلية الجمهورية', cityName: 'الجيزة', addressDetail: '6 أكتوبر، 33 شارع فيصل', phone: '01044444444', isOpen24h: true, averageRating: 4.6, reviewsCount: 142 },
    { id: 'p7', name: 'صيدلية المعادي', cityName: 'القاهرة', addressDetail: 'المعادي، 55 شارع النصر', phone: '01066666666', isOpen24h: true, averageRating: 4.4, reviewsCount: 78 },
    { id: 'p8', name: 'صيدلية الأمل', cityName: 'المنصورة', addressDetail: '78 شارع الجمهورية', phone: '01088888888', isOpen24h: true, averageRating: 4.1, reviewsCount: 55 },
    { id: 'p9', name: 'صيدلية السلام', cityName: 'الزقازيق', addressDetail: '90 شارع الزقازيق', phone: '01077777777', isOpen24h: false, averageRating: 3.9, reviewsCount: 42 },
    { id: 'p10', name: 'صيدلية الهلال', cityName: 'وسط البلد', addressDetail: 'وسط البلد، 11 شارع رمسيس', phone: '01055555555', isOpen24h: false, averageRating: 4.0, reviewsCount: 88 }
];

// Utility functions
function renderStars(rating) {
    let stars = '';
    const rounded = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
        stars += i <= rounded ? '<i class="bi bi-star-fill text-warning"></i>' : '<i class="bi bi-star text-muted"></i>';
    }
    return stars;
}

function formatPhoneRTL(phone) {
    if (!phone) return '—';
    return `<span dir="ltr" style="display: inline-block; unicode-bidi: embed;">${phone}</span>`;
}

// Render pharmacy list
function renderPharmacyList(pharmacies) {
    const container = document.getElementById('pharmaciesGrid');
    const resultsCount = document.getElementById('resultsCount');
    const emptyState = document.getElementById('emptyState');

    if (resultsCount) {
        resultsCount.textContent = pharmacies.length > 0 ? `تم العثور على ${pharmacies.length} صيدلية` : 'لا توجد نتائج';
    }

    if (pharmacies.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }

    if (emptyState) emptyState.classList.add('d-none');
    if (!container) return;

    container.innerHTML = pharmacies.map(pharm => `
        <div class="col-12 col-md-6 col-lg-4">
            <a href="pharmacy-details.html?id=${pharm.id}" class="pharmacy-card">
                <div class="d-flex align-items-start gap-3 mb-3">
                    <div class="pharmacy-icon"><i class="bi bi-capsule"></i></div>
                    <div class="flex-grow-1 min-w-0">
                        <h5 class="mb-1 fw-bold text-truncate">${pharm.name}</h5>
                        <p class="text-muted small mb-0 text-truncate">${pharm.cityName || ''}${pharm.addressDetail ? '، ' + pharm.addressDetail : ''}</p>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2 mb-3 flex-wrap">
                    ${pharm.isOpen24h ? '<span class="badge-24h"><i class="bi bi-clock"></i> مفتوح 24/7</span>' : '<span class="badge-closed"><i class="bi bi-clock"></i> ساعات محددة</span>'}
                </div>
                ${pharm.phone ? `<div class="d-flex align-items-center gap-2 mb-2 text-muted small"><i class="bi bi-telephone"></i> ${formatPhoneRTL(pharm.phone)}</div>` : ''}
                ${pharm.averageRating ? `<div class="rating-stars">${renderStars(pharm.averageRating)} <span class="rating-value ms-1">${pharm.averageRating.toFixed(1)}</span> <span class="rating-count">(${pharm.reviewsCount || 0})</span></div>` : ''}
            </a>
        </div>
    `).join('');
}

// Filter and search
function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(chip => {
        if (chip.dataset.filter === filter) chip.classList.add('active');
        else chip.classList.remove('active');
    });
    applyFilters();
}

function applyFilters() {
    let filtered = [...allPharmacies];
    if (currentFilter === '24h') filtered = filtered.filter(p => p.isOpen24h);
    const query = searchQuery.toLowerCase().trim();
    if (query) {
        filtered = filtered.filter(p => 
            (p.name || '').toLowerCase().includes(query) ||
            (p.cityName || '').toLowerCase().includes(query) ||
            (p.addressDetail || '').toLowerCase().includes(query)
        );
    }
    renderPharmacyList(filtered);
}

function resetFilters() {
    currentFilter = 'all';
    searchQuery = '';
    document.getElementById('pharmacySearch').value = '';
    document.getElementById('medicineSearch').value = '';
    setFilter('all');
}

// Debounced search
let searchTimeout;
function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchQuery = document.getElementById('pharmacySearch').value;
        applyFilters();
    }, 300);
}

// Medicine search across pharmacies (simplified)
async function searchMedicine(query) {
    if (!query) {
        applyFilters();
        return;
    }
    // If API supports medicine search, call it; otherwise show all pharmacies
    // For demo, just filter by medicine name in inventory (mock)
    try {
        // Attempt to search via API if available
        if (typeof api !== 'undefined' && api.searchMedicineInPharmacies) {
            const results = await api.searchMedicineInPharmacies(query);
            renderPharmacyList(results);
            return;
        }
    } catch(e) { console.log('API medicine search failed, using local fallback'); }
    // Fallback: show all pharmacies (or you could implement local inventory check)
    applyFilters();
}

// Load pharmacies from API or mock
async function loadPharmacies() {
    const container = document.getElementById('pharmaciesGrid');
    container.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div><p class="text-muted mt-2">جارٍ التحميل...</p></div>`;

    try {
        if (typeof api !== 'undefined' && api.getPharmacies) {
            allPharmacies = await api.getPharmacies();
        } else {
            allPharmacies = mockPharmacies;
        }
    } catch (err) {
        console.log('API failed, using mock data');
        allPharmacies = mockPharmacies;
    }
    applyFilters();
}

// Initialize
function initPharmaciesPage() {
    loadPharmacies();
    const pharmacySearch = document.getElementById('pharmacySearch');
    if (pharmacySearch) pharmacySearch.addEventListener('input', debouncedSearch);
    const medicineSearch = document.getElementById('medicineSearch');
    if (medicineSearch) {
        medicineSearch.addEventListener('input', debounce((e) => {
            searchMedicine(e.target.value.trim());
        }, 500));
    }
}

// Run when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initPharmaciesPage();
});