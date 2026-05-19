// ==================== Doctor Details Page Logic ====================
let currentDoctor = null;
let selectedSlot = null;
let availableSlots = [];
let doctorReviews = [];

// ==================== Utility Functions ====================
function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function formatDateAr(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('ar-EG', options);
}

function formatTimeAr(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('ar-EG', options);
}

function getPeriodLabel(dateStr) {
    const hour = new Date(dateStr).getHours();
    return hour < 14 ? 'صباحاً' : 'مساءً';
}

function formatPrice(price) {
    if (!price && price !== 0) return '—';
    return `${Number(price).toFixed(Number(price) % 1 === 0 ? 0 : 2)} ج.م`;
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

// ==================== Load Doctor Data ====================
async function loadDoctorDetails() {
    const doctorId = getUrlParam('id');
    
    if (!doctorId) {
        showError('لم يتم تحديد طبيب');
        return;
    }

    try {
        showLoadingState();
        currentDoctor = await api.getDoctorById(doctorId);
        
        if (!currentDoctor) {
            showError('الطبيب غير موجود');
            return;
        }

        renderDoctorInfo(currentDoctor);
        await loadDoctorReviews(doctorId);
        generateDateSelector();
        const today = new Date().toISOString().split('T')[0];
        await loadSlots(doctorId, today);
        
    } catch (err) {
        console.error('Failed to load doctor details:', err);
        showError('فشل تحميل بيانات الطبيب: ' + err.message);
    }
}

function showLoadingState() {
    document.getElementById('doctorFullName').textContent = 'جارٍ التحميل...';
    document.getElementById('doctorAvatar').innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
}

function showError(message) {
    const container = document.querySelector('main') || document.body;
    container.innerHTML = `
        <div class="container mt-5">
            <div class="alert alert-danger rounded-4">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message}
                <br><br>
                <a href="doctors.html" class="btn btn-primary rounded-pill">
                    <i class="bi bi-arrow-right me-1"></i>
                    العودة للأطباء
                </a>
            </div>
        </div>
    `;
}

// ==================== Render Doctor Info ====================
function renderDoctorInfo(doctor) {
    document.title = `${doctor.fullName} - صحتك`;
    document.getElementById('doctorNameBreadcrumb').textContent = doctor.fullName || 'طبيب';
    
    const avatarEl = document.getElementById('doctorAvatar');
    avatarEl.style.backgroundColor = doctor.avatarColor || '#1E88E5';
    avatarEl.textContent = doctor.initials || doctor.fullName?.charAt(0) || 'د';
    avatarEl.className = 'doctor-avatar-lg flex-shrink-0 d-flex align-items-center justify-content-center text-white fw-bold';
    
    document.getElementById('doctorFullName').textContent = doctor.fullName || '—';
    document.getElementById('doctorSpecialty').textContent = doctor.specialtyName || '—';
    document.getElementById('doctorExperience').textContent = `${doctor.yearsOfExperience || 0} سنة خبرة`;
    document.getElementById('doctorCity').textContent = doctor.cityName || '—';
    
    const ratingEl = document.getElementById('doctorRating');
    ratingEl.innerHTML = `
        ${renderStars(doctor.rating)}
        <span class="rating-value ms-2">${(doctor.rating || 0).toFixed(1)}</span>
        <span class="rating-count">(${(doctor.reviewCount || 0).toLocaleString('ar-EG')} تقييم)</span>
    `;
    
    document.getElementById('doctorBio').textContent = doctor.bio || 'لا توجد نبذة متاحة عن هذا الطبيب.';
    document.getElementById('clinicAddress').textContent = doctor.clinicAddress || doctor.cityName || '—';
    document.getElementById('sidebarPrice').textContent = formatPrice(doctor.price);
    
    const breadcrumbLink = document.getElementById('doctorBreadcrumbLink');
    if (breadcrumbLink) {
        breadcrumbLink.textContent = doctor.fullName || '...';
        breadcrumbLink.href = `doctor-details.html?id=${doctor.id}`;
    }
}

// ==================== Reviews ====================
async function loadDoctorReviews(doctorId) {
    try {
        doctorReviews = await api.getDoctorReviews(doctorId);
        renderReviews(doctorReviews);
    } catch (err) {
        console.warn('Failed to load reviews:', err);
        doctorReviews = [];
        renderReviews([]);
    }
}

function renderReviews(reviews) {
    const container = document.getElementById('reviewsList');
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-chat-square-text text-muted fs-1 mb-2"></i>
                <p class="text-muted mb-0">لا توجد تقييمات بعد. كن أول من يقيم بعد زيارتك!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <div class="review-item d-flex gap-3 pb-4 mb-4 border-bottom">
            <div class="reviewer-avatar flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary fw-bold" 
                 style="width: 44px; height: 44px;">
                ${review.patientName ? review.patientName.charAt(0) : 'م'}
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <h6 class="fw-bold mb-0">${review.patientName || 'مريض'}</h6>
                    <span class="text-muted small">${formatDate(review.createdAt)}</span>
                </div>
                <div class="rating-stars small mb-2">
                    ${renderStars(review.rating)}
                </div>
                ${review.text ? `<p class="text-muted mb-0">${review.text}</p>` : ''}
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ==================== Date & Slots Selection ====================
function generateDateSelector() {
    const container = document.getElementById('dateSelector');
    if (!container) return;
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'short' });
        const dayNum = date.getDate();
        
        days.push({ dateStr, dayName, dayNum });
    }
    
    container.innerHTML = days.map((day, index) => `
        <button class="btn btn-outline-primary rounded-3 px-3 py-2 text-center ${index === 0 ? 'active' : ''}" 
                style="min-width: 70px;"
                onclick="selectDate('${day.dateStr}', this)"
                data-date="${day.dateStr}">
            <div class="small text-muted">${day.dayName}</div>
            <div class="fw-bold">${day.dayNum}</div>
        </button>
    `).join('');
    
    if (days.length > 0) {
        container.dataset.selectedDate = days[0].dateStr;
    }
}

async function selectDate(dateStr, btnElement) {
    document.querySelectorAll('#dateSelector .btn').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-primary');
    });
    
    if (btnElement) {
        btnElement.classList.remove('btn-outline-primary');
        btnElement.classList.add('active', 'btn-primary');
    }
    
    document.getElementById('dateSelector').dataset.selectedDate = dateStr;
    
    if (currentDoctor) {
        await loadSlots(currentDoctor.id, dateStr);
    }
}

async function loadSlots(doctorId, date) {
    const container = document.getElementById('slotsContainer');
    
    container.innerHTML = `
        <div class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            <span class="text-muted small me-2">جارٍ تحميل المواعيد...</span>
        </div>
    `;
    
    try {
        const slots = await api.getDoctorSlots(doctorId, date);
        availableSlots = slots.filter(s => !s.booked);
        renderSlots(availableSlots);
    } catch (err) {
        console.error('Failed to load slots:', err);
        container.innerHTML = `
            <div class="alert alert-warning py-2">
                <i class="bi bi-exclamation-triangle me-1"></i>
                فشل تحميل المواعيد. حاول مرة أخرى.
            </div>
        `;
    }
}

function renderSlots(slots) {
    const container = document.getElementById('slotsContainer');
    
    if (!slots || slots.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <i class="bi bi-calendar-x text-muted fs-4 mb-2 d-block"></i>
                <p class="text-muted small mb-0">لا توجد مواعيد متاحة في هذا اليوم</p>
            </div>
        `;
        return;
    }
    
    const morning = slots.filter(s => new Date(s.startTime).getHours() < 14);
    const evening = slots.filter(s => new Date(s.startTime).getHours() >= 14);
    
    let html = '';
    
    if (morning.length > 0) {
        html += `
            <div class="mb-3">
                <p class="small text-muted mb-2">صباحاً</p>
                <div class="d-flex gap-2 flex-wrap">
                    ${morning.map(slot => renderSlotButton(slot)).join('')}
                </div>
            </div>
        `;
    }
    
    if (evening.length > 0) {
        html += `
            <div>
                <p class="small text-muted mb-2">مساءً</p>
                <div class="d-flex gap-2 flex-wrap">
                    ${evening.map(slot => renderSlotButton(slot)).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function renderSlotButton(slot) {
    const time = formatTimeAr(slot.startTime);
    const isBooked = slot.booked;
    
    return `
        <button class="btn ${isBooked ? 'btn-secondary disabled' : selectedSlot?.id === slot.id ? 'btn-primary' : 'btn-outline-primary'} 
                rounded-pill px-3 py-1 small"
                ${isBooked ? 'disabled' : `onclick="selectSlot('${slot.id}')"`}
                data-slot-id="${slot.id}">
            ${time}
            ${isBooked ? '<i class="bi bi-lock-fill ms-1"></i>' : ''}
        </button>
    `;
}

function selectSlot(slotId) {
    selectedSlot = availableSlots.find(s => s.id === slotId);
    
    if (!selectedSlot) return;
    
    document.querySelectorAll('#slotsContainer .btn').forEach(btn => {
        if (!btn.disabled) {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
        }
    });
    
    const selectedBtn = document.querySelector(`[data-slot-id="${slotId}"]`);
    if (selectedBtn) {
        selectedBtn.classList.remove('btn-outline-primary');
        selectedBtn.classList.add('btn-primary');
    }
    
    const bookBtn = document.getElementById('bookBtn');
    bookBtn.disabled = false;
    bookBtn.textContent = 'احجز الآن';
    bookBtn.onclick = goToBooking;
}

// ==================== Navigate to Booking ====================
function goToBooking() {
    if (!currentDoctor || !selectedSlot) {
        showToast('يرجى اختيار موعد أولاً', 'warning');
        return;
    }
    
    const params = new URLSearchParams({
        doctorId: currentDoctor.id,
        slotId: selectedSlot.id
    });
    
    window.location.href = `booking.html?${params.toString()}`;
}

// ==================== Toast ====================
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };
    
    const colors = {
        success: 'text-success',
        error: 'text-danger',
        warning: 'text-warning',
        info: 'text-primary'
    };
    
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center show';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi ${icons[type]} ${colors[type]} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadDoctorDetails();
});

// Make functions globally accessible for onclick handlers
window.selectDate = selectDate;
window.selectSlot = selectSlot;
window.goToBooking = goToBooking;