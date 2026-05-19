// ==================== Pharmacy Details Page Logic ====================
let currentPharmacy = null;
let map = null;

// Mock data (fallback)
const mockPharmacies = [
    { id: 'p1', name: 'صيدلية النصر', cityName: 'القاهرة', addressDetail: 'مدينة نصر - شارع النصر', phone: '01012345678', isOpen24h: true, averageRating: 4.5, reviewsCount: 128, description: 'صيدلية متكاملة توفر جميع الأدوية والمستلزمات الطبية على مدار 24 ساعة. نقدم خدمة توصيل سريعة لجميع مناطق القاهرة.', lat: 30.0444, lng: 31.2357 },
    { id: 'p2', name: 'صيدلية العزبي', cityName: 'الجيزة', addressDetail: 'الدقي - شارع التحرير', phone: '01112223344', isOpen24h: false, averageRating: 4.2, reviewsCount: 85, description: 'صيدلية كبيرة توفر أدوية مستوردة ومحلية بأسعار منافسة.', lat: 30.0131, lng: 31.2089 },
    { id: 'p3', name: 'صيدلية 19011', cityName: 'الإسكندرية', addressDetail: 'سموحة - شارع جمال عبد الناصر', phone: '01555556666', isOpen24h: true, averageRating: 4.8, reviewsCount: 256, description: 'شبكة صيدليات معروفة بخدمة التوصيل السريع.', lat: 31.2001, lng: 29.9187 },
    { id: 'p4', name: 'صيدلية المصري', cityName: 'القاهرة', addressDetail: 'المعادي - شارع 9', phone: '01000001111', isOpen24h: false, averageRating: 4.0, reviewsCount: 64, description: 'صيدلية عائلية توفر استشارات صيدلية مجانية.', lat: 29.9668, lng: 31.2500 },
    { id: 'p5', name: 'صيدلية الحياة', cityName: 'الإسكندرية', addressDetail: 'سموحة، 34 شارع أبو قير', phone: '01022222222', isOpen24h: true, averageRating: 4.3, reviewsCount: 95, description: 'صيدلية متكاملة في قلب الإسكندرية.', lat: 31.2156, lng: 29.9553 }
];

const mockInventory = [
    { medicineId: 'm1', medicineNameAr: 'بنادول أدفانس', brand: 'Panadol', price: 25, stockQuantity: 50 },
    { medicineId: 'm2', medicineNameAr: 'فولتارين جل', brand: 'Voltaren', price: 55, stockQuantity: 30 },
    { medicineId: 'm3', medicineNameAr: 'فيتامين سي 1000', brand: 'Vitamin C', price: 45, stockQuantity: 0 },
    { medicineId: 'm4', medicineNameAr: 'بيتادين', brand: 'Betadine', price: 22, stockQuantity: 100 },
    { medicineId: 'm5', medicineNameAr: 'واقي شمس', brand: 'La Roche-Posay', price: 350, stockQuantity: 15 }
];

const mockReviews = [
    { patientName: 'أحمد الشاذلي', rating: 5, text: 'خدمة ممتازة وسريعة جداً. الصيدلي كان متعاون جداً.', createdAt: '2026-05-10T10:30:00Z' },
    { patientName: 'سارة القاضي', rating: 4, text: 'عندهم معظم منتجات العناية بالبشرة اللي كنت بدور عليها.', createdAt: '2026-04-15T14:20:00Z' },
    { patientName: 'محمد علي', rating: 5, text: 'أفضل صيدلية في المنطقة. التوصيل سريع والأسعار منافسة.', createdAt: '2026-03-20T09:00:00Z' }
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

function formatPrice(price) {
    if (!price && price !== 0) return '—';
    return Number(price).toLocaleString('ar-EG') + ' ج.م';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'قبل ' + diffDays + ' أيام';
    if (diffDays <= 30) return 'قبل ' + Math.floor(diffDays / 7) + ' أسابيع';
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Map functions
function initMap(lat, lng, name) {
    if (!lat || !lng) { lat = 30.0444; lng = 31.2357; }
    if (map) map.remove();
    map = L.map('pharmacyMap').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup('<b>' + name + '</b><br>اضغط للاتجاهات').openPopup();
    marker.on('click', () => getDirections());
}

function getDirections() {
    if (!currentPharmacy) return;
    const lat = currentPharmacy.lat || 30.0444;
    const lng = currentPharmacy.lng || 31.2357;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}

// Load pharmacy details
async function loadPharmacyDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const pharmacyId = urlParams.get('id');
    if (!pharmacyId) { showError('لم يتم تحديد صيدلية'); return; }

    let pharmacy = null;
    try {
        if (typeof api !== 'undefined' && api.getPharmacyById) {
            pharmacy = await api.getPharmacyById(pharmacyId);
        }
    } catch (err) { console.log('API failed, using mock data'); }
    if (!pharmacy) pharmacy = mockPharmacies.find(p => p.id === pharmacyId);
    if (!pharmacy) { showError('الصيدلية غير موجودة'); return; }

    currentPharmacy = pharmacy;
    renderPharmacyDetails(pharmacy);
    await loadInventory(pharmacyId);
    await loadReviews(pharmacyId);
    initMap(pharmacy.lat, pharmacy.lng, pharmacy.name);
}

function renderPharmacyDetails(pharmacy) {
    document.title = pharmacy.name + ' - صحتك';
    document.getElementById('pharmacyNameBreadcrumb').textContent = pharmacy.name;
    document.getElementById('pharmacyName').textContent = pharmacy.name;
    const fullAddress = (pharmacy.cityName || '') + (pharmacy.addressDetail ? '، ' + pharmacy.addressDetail : '');
    document.getElementById('pharmacyAddress').textContent = fullAddress;

    const statusBadge = document.getElementById('statusBadge');
    if (pharmacy.isOpen24h) {
        statusBadge.innerHTML = '<i class="bi bi-check-circle me-1"></i> مفتوح 24/7';
        statusBadge.className = 'badge-24h';
    } else {
        statusBadge.innerHTML = '<i class="bi bi-clock me-1"></i> ساعات محددة';
        statusBadge.className = 'badge-closed';
    }

    const ratingHtml = renderStars(pharmacy.averageRating) + 
        '<span class="rating-value ms-2">' + (pharmacy.averageRating || 0).toFixed(1) + '</span>' +
        '<span class="rating-count">(' + (pharmacy.reviewsCount || 0).toLocaleString('ar-EG') + ' تقييم)</span>';
    document.getElementById('pharmacyRating').innerHTML = ratingHtml;

    const phoneBtn = document.getElementById('phoneBtn');
    const phoneText = document.getElementById('phoneText');
    if (pharmacy.phone) {
        phoneBtn.href = 'tel:' + pharmacy.phone;
        phoneText.textContent = pharmacy.phone;
    } else {
        phoneBtn.href = '#';
        phoneText.textContent = 'لا يوجد رقم';
        phoneBtn.style.opacity = '0.5';
    }

    document.getElementById('pharmacyDescription').textContent = pharmacy.description || 'صيدلية متكاملة توفر جميع الأدوية والمستلزمات الطبية.';
    document.getElementById('workingHours').textContent = pharmacy.isOpen24h ? 'مفتوحة 24 ساعة طوال أيام الأسبوع' : 'السبت - الخميس: 08:00 ص - 11:00 م | الجمعة: 10:00 ص - 11:00 م';
    document.getElementById('phoneDisplay').textContent = pharmacy.phone || '—';

    document.getElementById('sidebarName').textContent = pharmacy.name;
    document.getElementById('sidebarCity').textContent = pharmacy.cityName || '—';
    document.getElementById('sidebarStatus').textContent = pharmacy.isOpen24h ? 'مفتوح 24/7' : 'ساعات محددة';
    document.getElementById('sidebarRating').innerHTML = renderStars(pharmacy.averageRating) + ' <span class="ms-1">' + (pharmacy.averageRating || 0).toFixed(1) + '</span>';
    const sidebarPhoneBtn = document.getElementById('sidebarPhoneBtn');
    if (pharmacy.phone) sidebarPhoneBtn.href = 'tel:' + pharmacy.phone;
    else sidebarPhoneBtn.style.display = 'none';
}

// Load inventory
async function loadInventory(pharmacyId) {
    let inventory = [];
    try {
        if (typeof api !== 'undefined' && api.getPharmacyInventory) {
            inventory = await api.getPharmacyInventory(pharmacyId);
        }
    } catch (err) { console.log('API inventory failed, using mock'); }
    if (!inventory || inventory.length === 0) inventory = mockInventory;
    renderInventory(inventory);
}

function renderInventory(inventory) {
    document.getElementById('medicinesCount').textContent = inventory.length;
    const container = document.getElementById('medicinesList');
    if (inventory.length === 0) {
        container.innerHTML = '<div class="text-center py-4"><i class="bi bi-capsule text-muted fs-1 mb-2"></i><p class="text-muted mb-0">لا توجد أدوية مسجلة حالياً</p></div>';
        return;
    }
    container.innerHTML = inventory.map(item => {
        const inStock = (item.stockQuantity || 0) > 0;
        return `
            <div class="medicine-item d-flex align-items-center gap-3">
                <div class="medicine-icon"><i class="bi bi-capsule text-white fs-5"></i></div>
                <div class="flex-grow-1 min-w-0"><h6 class="fw-bold mb-1">${item.medicineNameAr || item.nameAr || 'دواء'}</h6>${item.brand ? `<p class="text-muted small mb-0">${item.brand}</p>` : ''}</div>
                <div class="text-start flex-shrink-0"><span class="fw-bold text-primary">${formatPrice(item.price)}</span><span class="d-block small ${inStock ? 'text-success' : 'text-danger'}">${inStock ? '<i class="bi bi-check-circle"></i> متوفر (' + item.stockQuantity + ')' : '<i class="bi bi-x-circle"></i> نفذ'}</span></div>
            </div>
        `;
    }).join('');
}

// Load reviews
async function loadReviews(pharmacyId) {
    let reviews = [];
    try {
        if (typeof api !== 'undefined' && api.getPharmacyReviews) {
            reviews = await api.getPharmacyReviews(pharmacyId);
        }
    } catch (err) { console.log('API reviews failed, using mock'); }
    if (!reviews || reviews.length === 0) reviews = mockReviews;
    renderReviews(reviews);
}

function renderReviews(reviews) {
    const container = document.getElementById('reviewsList');
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';
    document.getElementById('headerStars').innerHTML = renderStars(parseFloat(avgRating));
    document.getElementById('headerRating').textContent = avgRating;
    document.getElementById('headerReviewCount').textContent = reviews.length;

    if (reviews.length === 0) {
        container.innerHTML = '<div class="text-center py-4"><i class="bi bi-chat-square-text text-muted fs-1 mb-2"></i><p class="text-muted mb-0">لا توجد تقييمات بعد. كن أول من يقيم!</p></div>';
        return;
    }
    container.innerHTML = reviews.map(review => `
        <div class="review-item"><div class="d-flex gap-3"><div class="review-avatar">${(review.patientName || 'م').charAt(0)}</div><div class="flex-grow-1"><div class="d-flex justify-content-between align-items-start mb-2"><div><h6 class="fw-bold mb-1">${review.patientName || 'مريض'}</h6><div class="rating-stars">${renderStars(review.rating)}</div></div><span class="text-muted small">${formatDate(review.createdAt)}</span></div>${review.text || review.comment ? `<p class="text-muted mb-0">${review.text || review.comment}</p>` : ''}</div></div></div>
    `).join('');
}

function showError(message) {
    document.body.innerHTML = `<div class="container mt-5"><div class="alert alert-danger rounded-4"><i class="bi bi-exclamation-triangle-fill me-2"></i>${message}<br><br><a href="pharmacies.html" class="btn btn-primary rounded-pill"><i class="bi bi-arrow-right me-1"></i> العودة للصيدليات</a></div></div>`;
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons) return;
    const token = localStorage.getItem('auth_token');
    if (token) {
        let user = null;
        try { const stored = localStorage.getItem('auth_user'); if (stored) user = JSON.parse(stored); } catch(e) {}
        const initial = user ? (user.fullName || user.email || '؟').charAt(0).toUpperCase() : '؟';
        const name = user ? (user.fullName || 'حسابي') : 'حسابي';
        authButtons.innerHTML = `<div class="dropdown"><button class="btn btn-light rounded-pill dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown"><div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width:32px;height:32px;font-size:0.85rem;font-weight:600;">${initial}</div><span class="d-none d-sm-inline">${name}</span></button><ul class="dropdown-menu dropdown-menu-end"><li><a class="dropdown-item" href="dashboard.html"><i class="bi bi-speedometer2 me-2"></i>لوحة التحكم</a></li><li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="if(window.api) api.logout(); else { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); window.location.href='index.html'; } return false;"><i class="bi bi-box-arrow-right me-2"></i>تسجيل الخروج</a></li></ul></div>`;
    } else {
        authButtons.innerHTML = `<a href="login.html" class="btn btn-outline-primary rounded-pill px-4">تسجيل الدخول</a><a href="register.html" class="btn btn-primary rounded-pill px-4">إنشاء حساب</a>`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadPharmacyDetails();
});

window.getDirections = getDirections;