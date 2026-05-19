// ==================== Dashboard Logic (Patient & Doctor) ====================
let currentUser = null;
let userRole = 'patient';
let appointments = [];
let currentReviewAppointmentId = null;
let doctorSlots = [];

// ==================== Auth Check ====================
async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    try {
        currentUser = await api.getCurrentUser();
        if (!currentUser) throw new Error('no user');
        userRole = (currentUser.role || 'patient').toLowerCase();
        return true;
    } catch {
        localStorage.removeItem('auth_token');
        window.location.href = 'login.html';
        return false;
    }
}

// ==================== Formatters ====================
function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('ar-EG', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

function formatPrice(price) {
    return (price || 0).toLocaleString('ar-EG') + ' ج.م';
}

// ==================== Render Auth UI ====================
function renderAuthUI() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons || !currentUser) return;

    const initial = (currentUser.fullName || currentUser.email || '؟').charAt(0).toUpperCase();
    const isAdmin = userRole === 'admin';
    authButtons.innerHTML = `
        <div class="dropdown">
            <button class="btn btn-light rounded-pill dropdown-toggle d-flex align-items-center gap-2"
                    type="button" data-bs-toggle="dropdown">
                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                     style="width:32px;height:32px;font-size:0.85rem;font-weight:600;">
                    ${initial}
                </div>
                <span class="d-none d-sm-inline">${currentUser.fullName || 'حسابي'}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="dashboard.html"><i class="bi bi-speedometer2 me-2"></i>لوحة التحكم</a></li>
                ${isAdmin ? `<li><a class="dropdown-item" href="admin-dashboard.html"><i class="bi bi-shield-check me-2"></i>لوحة الإدارة</a></li>` : ''}
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="api.logout(); return false;"><i class="bi bi-box-arrow-right me-2"></i>تسجيل الخروج</a></li>
            </ul>
        </div>
    `;
}

// ==================== Load Appointments ====================
async function loadAppointments() {
    try {
        if (userRole === 'doctor') {
            appointments = await api.getDoctorAppointments();
        } else {
            appointments = await api.getMyAppointments();
        }
    } catch (err) {
        console.error('Failed to load appointments:', err);
        appointments = [];
    }
}

// ==================== Load Doctor Slots ====================
async function loadDoctorSlots() {
    if (userRole !== 'doctor') return;
    try {
        const doctorId = currentUser.id;
        const slots = await api.getDoctorSlots(doctorId, null);
        doctorSlots = slots.filter(s => !s.booked);
        renderDoctorSlots();
    } catch (err) {
        console.error('Failed to load slots:', err);
    }
}

function renderDoctorSlots() {
    const container = document.getElementById('doctorSlotsList');
    if (!container) return;
    if (doctorSlots.length === 0) {
        container.innerHTML = '<p class="text-muted">لا توجد مواعيد متاحة حالياً. أضف مواعيد جديدة من النموذج أدناه.</p>';
        return;
    }
    container.innerHTML = doctorSlots.map(slot => `
        <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
            <div>
                <div class="fw-semibold">${formatDate(slot.startTime)}</div>
                <div class="small text-muted">${formatTime(slot.startTime)}</div>
            </div>
            <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteSlot('${slot.id}')">
                <i class="bi bi-trash"></i> حذف
            </button>
        </div>
    `).join('');
}

async function addDoctorSlot() {
    const dateInput = document.getElementById('slotDate');
    const timeInput = document.getElementById('slotTime');
    if (!dateInput.value || !timeInput.value) {
        showToast('يرجى اختيار التاريخ والوقت', 'warning');
        return;
    }
    const startDateTime = `${dateInput.value}T${timeInput.value}:00`;
    try {
        await api.addDoctorSlot(currentUser.id, startDateTime);
        showToast('تم إضافة الموعد بنجاح', 'success');
        dateInput.value = '';
        timeInput.value = '';
        await loadDoctorSlots();
    } catch (err) {
        showToast(err.message || 'فشل إضافة الموعد', 'error');
    }
}

async function deleteSlot(slotId) {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
    try {
        await api.deleteDoctorSlot(slotId);
        showToast('تم حذف الموعد', 'success');
        await loadDoctorSlots();
    } catch (err) {
        showToast(err.message || 'فشل الحذف', 'error');
    }
}

// ==================== Dashboard Render ====================
function renderDashboard() {
    document.getElementById('userName').textContent = currentUser?.fullName || 'صديقنا';

    if (userRole === 'doctor') {
        document.getElementById('userSubtitle').textContent = 'إدارة المواعيد والملف الطبي الخاص بك.';
        document.getElementById('bookBtn').classList.add('d-none');
        document.getElementById('doctorAlert').classList.remove('d-none');
        document.getElementById('doctorAppointmentsSection').classList.remove('d-none');
        document.getElementById('doctorSlotsSection').classList.remove('d-none');
        document.getElementById('patientStatsSection').classList.add('d-none');
        document.getElementById('patientUpcomingSection').classList.add('d-none');
        document.getElementById('patientPastSection').classList.add('d-none');
        document.getElementById('patientActivitySection').classList.add('d-none');
        renderDoctorAppointments();
        loadDoctorSlots();
    } else if (userRole === 'admin') {
        document.getElementById('userSubtitle').textContent = 'لوحة إدارة المنصة.';
        document.getElementById('bookBtn').innerHTML = '<i class="bi bi-shield-check me-1"></i> لوحة الإدارة';
        document.getElementById('bookBtn').href = 'admin-dashboard.html';
        document.getElementById('doctorAppointmentsSection').classList.add('d-none');
        document.getElementById('doctorSlotsSection').classList.add('d-none');
        document.getElementById('patientStatsSection').classList.add('d-none');
        document.getElementById('patientUpcomingSection').classList.add('d-none');
        document.getElementById('patientPastSection').classList.add('d-none');
        document.getElementById('patientActivitySection').classList.add('d-none');
        document.getElementById('adminRedirectMessage').classList.remove('d-none');
    } else {
        document.getElementById('doctorAppointmentsSection').classList.add('d-none');
        document.getElementById('doctorSlotsSection').classList.add('d-none');
        document.getElementById('patientStatsSection').classList.remove('d-none');
        document.getElementById('patientUpcomingSection').classList.remove('d-none');
        document.getElementById('patientPastSection').classList.remove('d-none');
        document.getElementById('patientActivitySection').classList.remove('d-none');
        document.getElementById('adminRedirectMessage')?.classList.add('d-none');
        
        const now = new Date();
        const upcoming = appointments.filter(a => new Date(a.startTime) >= now && a.status !== 'cancelled');
        const past = appointments.filter(a => new Date(a.startTime) < now || a.status === 'completed' || a.status === 'cancelled');
        const completed = appointments.filter(a => a.status === 'completed');
        const totalSpent = completed.reduce((sum, a) => sum + (a.price || 0), 0);

        document.getElementById('statTotal').textContent = appointments.length;
        document.getElementById('statCompleted').textContent = completed.length;
        document.getElementById('statUpcoming').textContent = upcoming.length;
        document.getElementById('statSpent').textContent = formatPrice(totalSpent);

        renderUpcoming(upcoming);
        renderPastTable(past);
        renderActivity(appointments);
    }
}

// ==================== Doctor Appointments Render ====================
async function renderDoctorAppointments() {
    const container = document.getElementById('doctorAppointmentsList');
    if (!container) return;
    
    const pending = appointments.filter(a => a.status === 'pending');
    const confirmed = appointments.filter(a => a.status === 'confirmed');
    const completed = appointments.filter(a => a.status === 'completed');
    const cancelled = appointments.filter(a => a.status === 'cancelled');
    
    let html = `<div class="mb-4"><h5 class="fw-bold mb-3"><i class="bi bi-clock-history text-warning me-2"></i>المواعيد المعلقة (${pending.length})</h5>`;
    if (pending.length === 0) html += '<p class="text-muted">لا توجد مواعيد معلقة</p>';
    else {
        html += `<div class="list-group">`;
        pending.forEach(apt => {
            html += `
                <div class="list-group-item border rounded-3 mb-2">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <div class="fw-bold">${apt.patientName || 'مريض'}</div>
                            <div class="small text-muted">${formatDate(apt.startTime)} - ${formatTime(apt.startTime)}</div>
                            <div class="small mt-1">السبب: ${apt.notes || 'غير مذكور'}</div>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-success rounded-pill me-2" onclick="updateAppointmentStatus('${apt.id}', 'confirmed')">
                                <i class="bi bi-check-lg"></i> قبول
                            </button>
                            <button class="btn btn-sm btn-danger rounded-pill" onclick="updateAppointmentStatus('${apt.id}', 'cancelled')">
                                <i class="bi bi-x-lg"></i> رفض
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    html += `</div>`;
    
    html += `<div class="mb-4"><h5 class="fw-bold mb-3"><i class="bi bi-check-circle text-success me-2"></i>المواعيد المؤكدة (${confirmed.length})</h5>`;
    if (confirmed.length === 0) html += '<p class="text-muted">لا توجد مواعيد مؤكدة</p>';
    else {
        html += `<div class="list-group">`;
        confirmed.forEach(apt => {
            html += `
                <div class="list-group-item border rounded-3 mb-2">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <div class="fw-bold">${apt.patientName || 'مريض'}</div>
                            <div class="small text-muted">${formatDate(apt.startTime)} - ${formatTime(apt.startTime)}</div>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="updateAppointmentStatus('${apt.id}', 'completed')">
                            <i class="bi bi-check2-circle"></i> إكمال
                        </button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    html += `</div>`;
    
    html += `<div><h5 class="fw-bold mb-3"><i class="bi bi-archive me-2"></i>المواعيد السابقة (مكتملة/ملغية)</h5>`;
    const other = [...completed, ...cancelled];
    if (other.length === 0) html += '<p class="text-muted">لا توجد مواعيد سابقة</p>';
    else {
        html += `<div class="list-group">`;
        other.forEach(apt => {
            html += `
                <div class="list-group-item border rounded-3 mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">${apt.patientName || 'مريض'}</div>
                            <div class="small text-muted">${formatDate(apt.startTime)} - ${formatTime(apt.startTime)}</div>
                            <span class="badge ${apt.status === 'completed' ? 'bg-success' : 'bg-danger'} mt-1">${apt.status === 'completed' ? 'مكتمل' : 'ملغي'}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    html += `</div>`;
    
    container.innerHTML = html;
}

async function updateAppointmentStatus(appointmentId, newStatus) {
    if (newStatus === 'cancelled' && !confirm('هل أنت متأكد من رفض/إلغاء هذا الموعد؟')) return;
    if (newStatus === 'completed' && !confirm('هل تريد تأكيد إكمال هذا الموعد؟')) return;
    
    try {
        await api.updateAppointmentStatus(appointmentId, newStatus);
        showToast(`تم ${newStatus === 'confirmed' ? 'قبول' : newStatus === 'cancelled' ? 'رفض' : 'إكمال'} الموعد`, 'success');
        await loadAppointments();
        renderDashboard();
    } catch (err) {
        showToast(err.message || 'فشل تحديث الحالة', 'error');
    }
}

// ==================== Patient Render Functions ====================
function renderUpcoming(list) {
    const container = document.getElementById('upcomingList');
    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-4">
                <i class="bi bi-calendar-x fs-1 text-muted mb-2"></i>
                <p class="text-muted">لا توجد مواعيد قادمة</p>
                <a href="doctors.html" class="btn btn-primary rounded-pill btn-sm">احجز موعداً</a>
            </div>`;
        return;
    }
    container.innerHTML = list.map(apt => `
        <div class="appointment-card bg-white border rounded-3 p-3 mb-3 shadow-sm">
            <div class="d-flex flex-column flex-sm-row justify-content-between gap-3">
                <div class="d-flex gap-3">
                    <div class="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width:48px;height:48px;">
                        <i class="bi bi-person-circle fs-4"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-1">${apt.doctorName || 'طبيب'}</h6>
                        <p class="text-primary small mb-1">${apt.specialty || ''}</p>
                        <div class="d-flex gap-3 text-muted small">
                            <span><i class="bi bi-calendar me-1"></i>${formatDate(apt.startTime)}</span>
                            <span><i class="bi bi-clock me-1"></i>${formatTime(apt.startTime)}</span>
                            <span><i class="bi bi-cash me-1"></i>${formatPrice(apt.price)}</span>
                        </div>
                        ${apt.notes ? `<p class="text-muted small mt-1"><i class="bi bi-chat-left-text me-1"></i>${apt.notes}</p>` : ''}
                    </div>
                </div>
                <div class="d-flex align-items-start gap-2 flex-shrink-0">
                    <span class="status-badge status-${apt.status} px-3 py-1 rounded-pill small fw-semibold">
                        ${getStatusLabel(apt.status)}
                    </span>
                    ${(apt.status === 'pending' || apt.status === 'confirmed') ? `
                    <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="cancelAppointment('${apt.id}')">
                        <i class="bi bi-x-circle"></i> إلغاء
                    </button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderPastTable(list) {
    const tbody = document.getElementById('pastAppointmentsTable');
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">لا توجد مواعيد سابقة</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(apt => {
        const showReviewBtn = apt.status === 'completed' && userRole !== 'doctor';
        return `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style="width:36px;height:36px;">
                        ${(apt.doctorName || 'ط').charAt(0)}
                    </div>
                    <span class="fw-medium">${apt.doctorName || '—'}</span>
                </div>
             </td>
            <td class="text-muted">${apt.specialty || '—'}</td>
            <td class="text-muted">${formatDate(apt.startTime)}</td>
            <td><span class="status-badge status-${apt.status} px-3 py-1 rounded-pill small">${getStatusLabel(apt.status)}</span></td>
            <td class="fw-medium">${formatPrice(apt.price)}</td>
            <td>
                ${showReviewBtn ? `<button class="btn btn-sm btn-outline-warning rounded-pill" onclick="openReviewModal('${apt.id}')"><i class="bi bi-star me-1"></i>تقييم</button>` : ''}
            </td>
         </tr>
        `;
    }).join('');
}

function renderActivity(list) {
    const container = document.getElementById('activityList');
    const recent = [...list].sort((a,b) => new Date(b.startTime) - new Date(a.startTime)).slice(0,5);
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center py-3">لا توجد نشاطات حديثة</p>';
        return;
    }
    container.innerHTML = recent.map((apt, idx) => {
        let icon = 'bi-calendar-check';
        let color = 'success';
        if (apt.status === 'cancelled') { icon = 'bi-calendar-x'; color = 'danger'; }
        else if (apt.status === 'pending') { icon = 'bi-calendar'; color = 'warning'; }
        return `
            <div class="d-flex align-items-center gap-3 py-2 ${idx < recent.length-1 ? 'border-bottom' : ''}">
                <div class="bg-${color} bg-opacity-10 text-${color} rounded-2 d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px;height:36px;">
                    <i class="bi ${icon} small"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                    <p class="small fw-medium mb-0">
                        ${apt.status === 'completed' ? 'تم إكمال موعد مع' : apt.status === 'cancelled' ? 'تم إلغاء موعد مع' : 'موعد مع'}
                        ${apt.doctorName || 'طبيب'}
                    </p>
                    <p class="text-muted small mb-0">${formatDate(apt.startTime)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusLabel(status) {
    const labels = { pending: 'بانتظار التأكيد', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي' };
    return labels[status] || status;
}

// ==================== Review Modal ====================
function openReviewModal(appointmentId) {
    currentReviewAppointmentId = appointmentId;
    document.getElementById('reviewComment').value = '';
    document.getElementById('reviewRating').value = '5';
    highlightStars(5);
    updateRatingText(5);
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) document.getElementById('reviewDoctorName').textContent = apt.doctorName || 'الطبيب';
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    modal.show();
}

function highlightStars(count) {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach((star, index) => {
        if (index < count) {
            star.classList.remove('bi-star');
            star.classList.add('bi-star-fill');
            star.style.color = '#f59e0b';
        } else {
            star.classList.remove('bi-star-fill');
            star.classList.add('bi-star');
            star.style.color = '#e2e8f0';
        }
    });
    document.getElementById('reviewRating').value = count;
}

function updateRatingText(rating) {
    const texts = { 1: 'سيء جداً', 2: 'سيء', 3: 'مقبول', 4: 'جيد', 5: 'ممتاز' };
    const textEl = document.getElementById('ratingText');
    if (textEl) textEl.textContent = texts[rating] || '';
}

async function submitReview() {
    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value.trim();
    if (!rating || rating < 1 || rating > 5) {
        showToast('يرجى اختيار تقييم', 'warning');
        return;
    }
    try {
        await api.createReview(currentReviewAppointmentId, { rating, comment });
        showToast('تم إرسال التقييم بنجاح', 'success');
        const modalEl = document.getElementById('reviewModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        await loadAppointments();
        renderDashboard();
    } catch (err) {
        showToast(err.message || 'فشل إرسال التقييم', 'error');
    }
}

// ==================== Cancel Appointment ====================
async function cancelAppointment(appointmentId) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return;
    try {
        await api.cancelAppointment(appointmentId);
        showToast('تم إلغاء الموعد بنجاح', 'success');
        await loadAppointments();
        renderDashboard();
    } catch (err) {
        showToast(err.message || 'فشل إلغاء الموعد', 'error');
    }
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
    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill' };
    const colors = { success: 'text-success', error: 'text-danger', info: 'text-primary', warning: 'text-warning' };
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
        </div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', async () => {
    const ok = await checkAuth();
    if (!ok) return;
    
    renderAuthUI();
    await loadAppointments();
    
    document.getElementById('loadingState').classList.add('d-none');
    document.getElementById('dashboardContent').classList.remove('d-none');
    renderDashboard();

    // Initialize star rating in modal
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach((star, index) => {
        star.addEventListener('mouseenter', () => { highlightStars(index + 1); updateRatingText(index + 1); });
        star.addEventListener('click', () => { highlightStars(index + 1); updateRatingText(index + 1); });
    });
    document.querySelector('.star-rating')?.addEventListener('mouseleave', () => {
        const currentRating = parseInt(document.getElementById('reviewRating').value) || 5;
        highlightStars(currentRating);
        updateRatingText(currentRating);
    });
    
    // Doctor add slot form
    const addSlotBtn = document.getElementById('addSlotBtn');
    if (addSlotBtn) addSlotBtn.addEventListener('click', addDoctorSlot);
});

// Export functions for global access
window.updateAppointmentStatus = updateAppointmentStatus;
window.cancelAppointment = cancelAppointment;
window.openReviewModal = openReviewModal;
window.submitReview = submitReview;
window.addDoctorSlot = addDoctorSlot;
window.deleteSlot = deleteSlot;
window.highlightStars = highlightStars;