

// ==================== State ====================
let currentUser = null;
let userRole = 'patient';
let appointments = [];
let currentReviewAppointmentId = null;

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
                <li><a class="dropdown-item" href="dashboard.html">
                    <i class="bi bi-speedometer2 me-2"></i>لوحة التحكم
                </a></li>
                ${isAdmin ? `<li><a class="dropdown-item" href="admin-dashboard.html">
                    <i class="bi bi-shield-check me-2"></i>لوحة الإدارة
                </a></li>` : ''}
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#"
                       onclick="api.logout(); return false;">
                    <i class="bi bi-box-arrow-right me-2"></i>تسجيل الخروج
                </a></li>
            </ul>
        </div>
    `;
}

// ==================== Load Appointments ====================
async function loadAppointments() {
    try {
        appointments = await api.getMyAppointments();
    } catch (err) {
        console.error('Failed to load appointments:', err);
        appointments = [];
    }
}

// ==================== Dashboard Render ====================
function renderDashboard() {
    // Update welcome
    document.getElementById('userName').textContent = currentUser?.fullName || 'صديقنا';

    if (userRole === 'doctor') {
        document.getElementById('userSubtitle').textContent = 'إدارة المواعيد والملف الطبي الخاص بك.';
        document.getElementById('bookBtn').classList.add('d-none');
        document.getElementById('doctorAlert').classList.remove('d-none');
    } else if (userRole === 'admin') {
        document.getElementById('userSubtitle').textContent = 'لوحة إدارة المنصة.';
        document.getElementById('bookBtn').innerHTML = '<i class="bi bi-shield-check me-1"></i> لوحة الإدارة';
        document.getElementById('bookBtn').href = 'admin-dashboard.html';
    }

    const now = new Date();

    const upcoming = appointments.filter(a => {
        const d = new Date(a.startTime);
        return d >= now && a.status !== 'cancelled';
    });
    const past = appointments.filter(a => {
        const d = new Date(a.startTime);
        return d < now || a.status === 'completed' || a.status === 'cancelled';
    });
    const completed = appointments.filter(a => a.status === 'completed');
    const totalSpent = completed.reduce((sum, a) => sum + (a.price || 0), 0);

    // Stats
    document.getElementById('statTotal').textContent = appointments.length;
    document.getElementById('statCompleted').textContent = completed.length;
    document.getElementById('statUpcoming').textContent = upcoming.length;
    document.getElementById('statSpent').textContent = formatPrice(totalSpent);

    renderUpcoming(upcoming);
    renderPastTable(past);
    renderActivity(appointments);
}

// ==================== Render Upcoming ====================
function renderUpcoming(list) {
    const container = document.getElementById('upcomingList');
    const isDoctor = userRole === 'doctor';

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="bi bi-calendar-x text-muted"></i></div>
                <h6 class="fw-bold text-muted">لا توجد مواعيد قادمة</h6>
                <p class="text-muted small">${isDoctor ? 'لم يتم حجز أي مواعيد بعد.' : 'ابدأ بحجز موعدك الأول.'}</p>
                ${!isDoctor ? '<a href="doctors.html" class="btn btn-primary btn-sm rounded-pill">احجز موعداً</a>' : ''}
            </div>`;
        return;
    }

    container.innerHTML = list.map(apt => `
        <div class="appointment-card mb-3">
            <div class="d-flex flex-column flex-sm-row justify-content-between gap-3">
                <div class="d-flex gap-3">
                    <div class="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center
                                justify-content-center flex-shrink-0"
                         style="width:48px;height:48px;">
                        <i class="bi bi-person-circle fs-4"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-1">
                            ${isDoctor ? (apt.patientName || '—') : (apt.doctorName || '—')}
                        </h6>
                        <p class="text-primary small mb-1">${apt.specialty || ''}</p>
                        <div class="d-flex gap-3 text-muted small">
                            <span><i class="bi bi-calendar me-1"></i>${formatDate(apt.startTime)}</span>
                            <span><i class="bi bi-clock me-1"></i>${formatTime(apt.startTime)}</span>
                            <span><i class="bi bi-cash me-1"></i>${formatPrice(apt.price)}</span>
                        </div>
                        ${apt.notes ? `<p class="text-muted small mt-1 mb-0">
                            <i class="bi bi-chat-left-text me-1"></i>${apt.notes}
                        </p>` : ''}
                    </div>
                </div>
                <div class="d-flex align-items-start gap-2 flex-shrink-0">
                    <span class="status-badge status-${apt.status}">
                        ${getStatusLabel(apt.status)}
                    </span>
                    ${(apt.status === 'pending' || apt.status === 'confirmed') ? `
                    <button class="btn btn-sm btn-outline-danger rounded-pill"
                            onclick="cancelAppointment('${apt.id}')">
                        <i class="bi bi-x-circle"></i>
                    </button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== Render Past Table ====================
function renderPastTable(list) {
    const tbody = document.getElementById('pastAppointmentsTable');
    const isDoctor = userRole === 'doctor';

    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    لا توجد مواعيد سابقة
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = list.map(apt => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex
                                align-items-center justify-content-center"
                         style="width:36px;height:36px;font-size:0.875rem;">
                        ${(isDoctor ? apt.patientName : apt.doctorName || '؟').charAt(0)}
                    </div>
                    <span class="fw-medium">
                        ${isDoctor ? (apt.patientName || '—') : (apt.doctorName || '—')}
                    </span>
                </div>
            </td>
            <td class="text-muted">${apt.specialty || '—'}</td>
            <td class="text-muted">${formatDate(apt.startTime)}</td>
            <td>
                <span class="status-badge status-${apt.status}">
                    ${getStatusLabel(apt.status)}
                </span>
            </td>
            <td class="fw-medium">${formatPrice(apt.price)}</td>
            <td>
                ${canReview(apt) ? `
                    <button class="btn btn-sm btn-outline-warning rounded-pill" onclick="openReviewModal('${apt.id}')">
                        <i class="bi bi-star me-1"></i>تقييم
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// ==================== Render Activity ====================
function renderActivity(list) {
    const container = document.getElementById('activityList');
    const isDoctor = userRole === 'doctor';

    if (list.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center py-3">لا توجد نشاطات حديثة</p>';
        return;
    }

    const recent = [...list]
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 5);

    container.innerHTML = recent.map((apt, idx) => {
        let icon = 'bi-calendar-check';
        let color = 'success';
        if (apt.status === 'cancelled') { icon = 'bi-calendar-x'; color = 'danger'; }
        else if (apt.status === 'pending') { icon = 'bi-calendar'; color = 'warning'; }

        return `
            <div class="d-flex align-items-center gap-3 py-2 ${idx < recent.length - 1 ? 'border-bottom' : ''}">
                <div class="bg-${color} bg-opacity-10 text-${color} rounded-2 d-flex align-items-center
                            justify-content-center flex-shrink-0"
                     style="width:36px;height:36px;">
                    <i class="bi ${icon} small"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                    <p class="small fw-medium mb-0">
                        ${apt.status === 'completed' ? 'تم إكمال موعد مع' :
                          apt.status === 'cancelled' ? 'تم إلغاء موعد مع' : 'موعد مع'}
                        ${isDoctor ? (apt.patientName || '—') : (apt.doctorName || '—')}
                    </p>
                    <p class="text-muted small mb-0">${formatDate(apt.startTime)}</p>
                </div>
            </div>`;
    }).join('');
}

// ==================== Status Helper ====================
function getStatusLabel(status) {
    const labels = {
        pending: 'بانتظار التأكيد',
        confirmed: 'مؤكد',
        completed: 'مكتمل',
        cancelled: 'ملغي'
    };
    return labels[status] || status;
}

// ==================== Review Logic ====================
function canReview(appointment) {
    // Can review if: completed, not cancelled, and hasn't been reviewed yet
    // For now, allow review for any completed appointment
    return appointment.status === 'completed' && userRole !== 'doctor';
}

function openReviewModal(appointmentId) {
    currentReviewAppointmentId = appointmentId;

    // Reset modal
    document.getElementById('reviewComment').value = '';
    document.getElementById('reviewRating').value = '5';
    highlightStars(5);
    updateRatingText(5);

    // Get appointment details for modal title
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
        document.getElementById('reviewDoctorName').textContent = apt.doctorName || 'الطبيب';
    }

    // Show modal
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
    const texts = {
        1: 'سيء جداً',
        2: 'سيء',
        3: 'مقبول',
        4: 'جيد',
        5: 'ممتاز'
    };
    const textEl = document.getElementById('ratingText');
    if (textEl) {
        textEl.textContent = texts[rating] || '';
    }
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

        // Close modal
        const modalEl = document.getElementById('reviewModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Refresh appointments
        await loadAppointments();
        renderDashboard();
    } catch (err) {
        console.error('Review error:', err);
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
                <i class="bi ${icons[type] || icons.info} ${colors[type] || colors.info} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ==================== Init ====================
document.addEventListener('DOMContentLoaded', async () => {
    const ok = await checkAuth();
    if (!ok) return;

    renderAuthUI();

    // Load real appointments from backend
    await loadAppointments();

    // Hide loading, show content
    document.getElementById('loadingState').classList.add('d-none');
    document.getElementById('dashboardContent').classList.remove('d-none');

    renderDashboard();

    // Initialize star rating in modal
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach((star, index) => {
        star.addEventListener('mouseenter', () => {
            highlightStars(index + 1);
            updateRatingText(index + 1);
        });
        star.addEventListener('click', () => {
            highlightStars(index + 1);
            updateRatingText(index + 1);
        });
    });
    document.querySelector('.star-rating')?.addEventListener('mouseleave', () => {
        const currentRating = parseInt(document.getElementById('reviewRating').value) || 5;
        highlightStars(currentRating);
        updateRatingText(currentRating);
    });
});