// ==================== Admin Module ====================
import { api, getToken, API_BASE_URL } from './api.js';
import { isAdmin, showToast } from './auth.js';

let pendingDoctors = [];
let approvedDoctors = [];
let allUsers = [];
let allAppointments = [];
let currentStats = {};
let currentAppointmentFilter = 'all';

// ==================== Auth Guard ====================
function requireAdmin() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return false;
    }
    // Will be verified by API, but check locally first
    return true;
}

// ==================== Statistics ====================
async function loadStats() {
    const container = document.getElementById('statsCards');
    if (!container) return;

    showLoading(container);

    try {
        const stats = await api.getAdminStats();
        currentStats = stats;
        renderStats(stats);
    } catch (err) {
        console.error('Failed to load stats:', err);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    حدث خطأ أثناء تحميل الإحصائيات
                </div>
            </div>
        `;
    }
}

function renderStats(stats) {
    const container = document.getElementById('statsCards');
    if (!container) return;

    const cards = [
        { icon: 'bi-people', color: 'primary', value: stats.totalUsers || 0, label: 'إجمالي المستخدمين' },
        { icon: 'bi-person-check', color: 'success', value: stats.approvedDoctors || 0, label: 'أطباء معتمدون' },
        { icon: 'bi-person-x', color: 'warning', value: stats.pendingDoctors || 0, label: 'بانتظار الموافقة' },
        { icon: 'bi-calendar-event', color: 'info', value: stats.totalAppointments || 0, label: 'إجمالي المواعيد' },
        { icon: 'bi-shop', color: 'secondary', value: stats.totalPharmacies || 0, label: 'الصيدليات' },
        { icon: 'bi-capsule', color: 'dark', value: stats.totalMedicines || 0, label: 'الأدوية' }
    ];

    container.innerHTML = cards.map(card => `
        <div class="col-6 col-lg-4 col-xl-2">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body p-4 text-center">
                    <div class="bg-${card.color} bg-opacity-10 rounded-3 p-3 d-inline-flex mb-3">
                        <i class="bi ${card.icon} fs-3 text-${card.color}"></i>
                    </div>
                    <h3 class="fw-bold mb-1">${card.value.toLocaleString('ar-EG')}</h3>
                    <p class="text-muted small mb-0">${card.label}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== Pending Doctors ====================
async function loadPendingDoctors() {
    const container = document.getElementById('pendingDoctorsList');
    if (!container) return;

    showLoading(container);

    try {
        const doctors = await api.getPendingDoctors();
        pendingDoctors = doctors;
        renderPendingDoctors(doctors);
    } catch (err) {
        console.error('Failed to load pending doctors:', err);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    حدث خطأ أثناء تحميل بيانات الأطباء
                </div>
            </div>
        `;
    }
}

function renderPendingDoctors(doctors) {
    const container = document.getElementById('pendingDoctorsList');
    const countEl = document.getElementById('pendingCount');

    if (countEl) countEl.textContent = doctors.length;

    if (doctors.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-5">
                <div class="empty-state-icon">
                    <i class="bi bi-check-circle fs-1 text-success"></i>
                </div>
                <p class="empty-state-title">لا يوجد أطباء بانتظار الموافقة</p>
                <p class="empty-state-description">جميع الأطباء تم اعتمادهم</p>
            </div>
        `;
        return;
    }

    container.innerHTML = doctors.map(doc => `
        <div class="doctor-approval-card" data-id="${doc.id}">
            <div class="d-flex flex-column flex-md-row align-items-start gap-3">
                <div class="doctor-avatar flex-shrink-0" style="background-color: ${doc.avatarColor || '#1E88E5'}; width: 60px; height: 60px; font-size: 1.2rem;">
                    ${doc.initials || doc.fullName?.charAt(0) || 'د'}
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h5 class="fw-bold mb-1">${doc.fullName}</h5>
                            <p class="text-primary small mb-0">${doc.specialtyName || 'غير محدد'}</p>
                        </div>
                        <span class="badge bg-warning bg-opacity-10 text-warning rounded-pill">
                            <i class="bi bi-clock me-1"></i> بانتظار الموافقة
                        </span>
                    </div>
                    <div class="row g-2 text-muted small mb-3">
                        <div class="col-auto">
                            <i class="bi bi-envelope me-1"></i> ${doc.email || '—'}
                        </div>
                        <div class="col-auto">
                            <i class="bi bi-telephone me-1"></i> ${doc.phone || '—'}
                        </div>
                        <div class="col-auto">
                            <i class="bi bi-briefcase me-1"></i> ${doc.yearsOfExperience || 0} سنة خبرة
                        </div>
                        <div class="col-auto">
                            <i class="bi bi-cash me-1"></i> ${formatPrice(doc.price || 0)}
                        </div>
                    </div>
                    ${doc.bio ? `<p class="text-muted small mb-3">${doc.bio}</p>` : ''}
                    ${doc.clinicAddress ? `
                        <p class="text-muted small mb-3">
                            <i class="bi bi-geo-alt me-1"></i> ${doc.clinicAddress}
                        </p>
                    ` : ''}
                    <div class="d-flex gap-2">
                        <button class="btn btn-success btn-sm rounded-pill approve-doctor" data-id="${doc.id}">
                            <i class="bi bi-check-circle me-1"></i> اعتماد
                        </button>
                        <button class="btn btn-outline-danger btn-sm rounded-pill reject-doctor" data-id="${doc.id}">
                            <i class="bi bi-x-circle me-1"></i> رفض
                        </button>
                        <button class="btn btn-outline-primary btn-sm rounded-pill view-details" data-id="${doc.id}">
                            <i class="bi bi-eye me-1"></i> التفاصيل
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    attachDoctorActionListeners();
}

async function loadApprovedDoctors() {
    const container = document.getElementById('approvedDoctorsList');
    if (!container) return;

    showLoading(container);

    try {
        const doctors = await api.getApprovedDoctors();
        approvedDoctors = doctors;
        renderApprovedDoctors(doctors);
    } catch (err) {
        console.error('Failed to load approved doctors:', err);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    حدث خطأ أثناء تحميل بيانات الأطباء
                </div>
            </div>
        `;
    }
}

function renderApprovedDoctors(doctors) {
    const container = document.getElementById('approvedDoctorsList');
    const countEl = document.getElementById('approvedCount');

    if (countEl) countEl.textContent = doctors.length;

    if (doctors.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-5">
                <div class="empty-state-icon">
                    <i class="bi bi-person-x fs-1 text-muted"></i>
                </div>
                <p class="empty-state-title">لا يوجد أطباء معتمدون</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>الطبيب</th>
                        <th>التخصص</th>
                        <th>السعر</th>
                        <th>الخبرة</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${doctors.map(doc => `
                        <tr data-id="${doc.id}">
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="doctor-avatar-sm" style="background-color: ${doc.avatarColor || '#1E88E5'};">
                                        ${doc.initials || doc.fullName?.charAt(0) || 'د'}
                                    </div>
                                    <div>
                                        <span class="fw-semibold">${doc.fullName}</span>
                                        <div class="text-muted small">${doc.email || ''}</div>
                                    </div>
                                </div>
                            </td>
                            <td>${doc.specialtyName || '—'}</td>
                            <td>${formatPrice(doc.price || 0)}</td>
                            <td>${doc.yearsOfExperience || 0} سنة</td>
                            <td>
                                <span class="badge bg-success bg-opacity-10 text-success rounded-pill">
                                    <i class="bi bi-check-circle me-1"></i> معتمد
                                </span>
                            </td>
                            <td>
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-light rounded-pill" data-bs-toggle="dropdown">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li>
                                            <a class="dropdown-item" href="doctor-details.html?id=${doc.id}" target="_blank">
                                                <i class="bi bi-eye me-2"></i> عرض الملف
                                            </a>
                                        </li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li>
                                            <button class="dropdown-item text-danger revoke-doctor" data-id="${doc.id}">
                                                <i class="bi bi-x-circle me-2"></i> إلغاء الاعتماد
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                             </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    attachRevokeListeners();
}

// ==================== Doctor Actions ====================
async function approveDoctor(doctorId) {
    if (!confirm('هل أنت متأكد من اعتماد هذا الطبيب؟')) return;

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/doctors/${doctorId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'فشل اعتماد الطبيب');
        }

        showToast('تم اعتماد الطبيب بنجاح', 'success');
        loadPendingDoctors();
        loadApprovedDoctors();
        loadStats();

    } catch (err) {
        console.error('Approve doctor error:', err);
        showToast(err.message || 'فشل اعتماد الطبيب', 'error');
    }
}

async function rejectDoctor(doctorId) {
    if (!confirm('هل أنت متأكد من رفض هذا الطبيب؟')) return;

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/doctors/${doctorId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'فشل رفض الطبيب');
        }

        showToast('تم رفض الطبيب', 'success');
        loadPendingDoctors();
        loadStats();

    } catch (err) {
        console.error('Reject doctor error:', err);
        showToast(err.message || 'فشل رفض الطبيب', 'error');
    }
}

async function revokeDoctor(doctorId) {
    if (!confirm('هل أنت متأكد من إلغاء اعتماد هذا الطبيب؟')) return;

    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/doctors/${doctorId}/revoke`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'فشل إلغاء الاعتماد');
        }

        showToast('تم إلغاء اعتماد الطبيب', 'success');
        loadApprovedDoctors();
        loadPendingDoctors();
        loadStats();

    } catch (err) {
        console.error('Revoke doctor error:', err);
        showToast(err.message || 'فشل إلغاء الاعتماد', 'error');
    }
}

// ==================== Users Management ====================
async function loadUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;

    showLoading(container);

    try {
        const users = await api.getAllUsers();
        allUsers = users;
        renderUsers(users);
    } catch (err) {
        console.error('Failed to load users:', err);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                حدث خطأ أثناء تحميل المستخدمين
            </div>
        `;
    }
}

function renderUsers(users) {
    const container = document.getElementById('usersList');
    const countEl = document.getElementById('usersCount');

    if (countEl) countEl.textContent = users.length;

    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-5">
                <div class="empty-state-icon">
                    <i class="bi bi-person-x fs-1 text-muted"></i>
                </div>
                <p class="empty-state-title">لا يوجد مستخدمين</p>
            </div>
        `;
        return;
    }

    const ROLE_LABELS = {
        'patient': { text: 'مريض', class: 'bg-info bg-opacity-10 text-info' },
        'doctor': { text: 'طبيب', class: 'bg-primary bg-opacity-10 text-primary' },
        'admin': { text: 'مدير', class: 'bg-danger bg-opacity-10 text-danger' }
    };

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>المستخدم</th>
                        <th>البريد الإلكتروني</th>
                        <th>الهاتف</th>
                        <th>الدور</th>
                        <th>الحالة</th>
                        <th>تاريخ التسجيل</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => {
                        const role = ROLE_LABELS[user.role?.toLowerCase()] || { text: user.role, class: 'bg-secondary bg-opacity-10 text-secondary' };
                        return `
                            <tr data-id="${user.id}">
                                <td>
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="user-avatar-sm bg-primary bg-opacity-10 text-primary">
                                            ${(user.fullName || user.email || '؟').charAt(0).toUpperCase()}
                                        </div>
                                        <span class="fw-semibold">${user.fullName || '—'}</span>
                                    </div>
                                 </td>
                                <td>${user.email}</td>
                                <td>${user.phone || '—'}</td>
                                <td>
                                    <span class="badge ${role.class} rounded-pill">${role.text}</span>
                                 </td>
                                <td>
                                    ${user.isActive 
                                        ? '<span class="badge bg-success bg-opacity-10 text-success rounded-pill">مفعل</span>'
                                        : '<span class="badge bg-danger bg-opacity-10 text-danger rounded-pill">غير مفعل</span>'
                                    }
                                 </td>
                                <td>${formatDate(user.createdAt)}</td>
                                <td>
                                    <button class="btn btn-sm ${user.isActive ? 'btn-outline-danger' : 'btn-outline-success'} rounded-pill toggle-user" data-id="${user.id}">
                                        ${user.isActive 
                                            ? '<i class="bi bi-x-circle"></i> تعطيل' 
                                            : '<i class="bi bi-check-circle"></i> تفعيل'
                                        }
                                    </button>
                                 </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    attachUserActionListeners();
}

async function toggleUserStatus(userId) {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/toggle-active`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'فشل تغيير حالة المستخدم');
        }

        showToast('تم تغيير حالة المستخدم', 'success');
        loadUsers();
        loadStats();

    } catch (err) {
        console.error('Toggle user error:', err);
        showToast(err.message || 'فشل تغيير الحالة', 'error');
    }
}

// ==================== Appointments Management (Admin) ====================
async function loadAllAppointments() {
    const container = document.getElementById('allAppointmentsList');
    if (!container) return;

    showLoading(container);

    try {
        const appointments = await api.getAllAppointments();
        allAppointments = appointments;
        renderAllAppointments(appointments);
        setupAppointmentFilters();
    } catch (err) {
        console.error('Failed to load appointments:', err);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                حدث خطأ أثناء تحميل المواعيد
            </div>
        `;
    }
}

function renderAllAppointments(appointments, filter = 'all') {
    const container = document.getElementById('allAppointmentsList');
    const countEl = document.getElementById('appointmentsCount');
    
    let filtered = appointments;
    if (filter !== 'all') {
        filtered = appointments.filter(a => a.status === filter);
    }

    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-5">
                <div class="empty-state-icon">
                    <i class="bi bi-calendar-x fs-1 text-muted"></i>
                </div>
                <p class="empty-state-title">لا توجد مواعيد</p>
                <p class="empty-state-description">لا توجد مواعيد ${filter !== 'all' ? 'بهذه الحالة' : ''}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>الطبيب</th>
                        <th>المريض</th>
                        <th>التخصص</th>
                        <th>التاريخ والوقت</th>
                        <th>السعر</th>
                        <th>الحالة</th>
                        <th>ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(apt => `
                        <tr>
                            <td>${apt.doctorName || '—'}</td>
                            <td>${apt.patientName || '—'}</td>
                            <td>${apt.specialty || '—'}</td>
                            <td>${formatDateTime(apt.startTime)}</td>
                            <td>${formatPrice(apt.price)}</td>
                            <td><span class="status-badge status-${apt.status}">${getStatusLabel(apt.status)}</span></td>
                            <td>${apt.notes || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function setupAppointmentFilters() {
    const filterBtns = document.querySelectorAll('.appointment-filter-btn');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter || 'all';
            renderAllAppointments(allAppointments, filter);
        });
    });
}

function getStatusLabel(status) {
    const labels = {
        pending: 'معلق',
        confirmed: 'مؤكد',
        completed: 'مكتمل',
        cancelled: 'ملغي'
    };
    return labels[status] || status;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== Event Listeners ====================
function attachDoctorActionListeners() {
    document.querySelectorAll('.approve-doctor').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            approveDoctor(id);
        });
    });

    document.querySelectorAll('.reject-doctor').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            rejectDoctor(id);
        });
    });

    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            window.open(`doctor-details.html?id=${id}`, '_blank');
        });
    });
}

function attachRevokeListeners() {
    document.querySelectorAll('.revoke-doctor').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            revokeDoctor(id);
        });
    });
}

function attachUserActionListeners() {
    document.querySelectorAll('.toggle-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            toggleUserStatus(id);
        });
    });
}

// ==================== Utility Functions ====================
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

function showLoading(container) {
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">جارٍ التحميل...</span>
            </div>
            <p class="text-muted mt-2">جارٍ التحميل...</p>
        </div>
    `;
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatPrice(price) {
    if (!price && price !== 0) return '—';
    return `${price.toFixed(price % 1 === 0 ? 0 : 2)} ج.م`;
}

// ==================== Search & Filter ====================
function initUserSearch() {
    const searchInput = document.getElementById('userSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
            renderUsers(allUsers);
            return;
        }
        const filtered = allUsers.filter(user => 
            (user.fullName || '').toLowerCase().includes(query) ||
            (user.email || '').toLowerCase().includes(query) ||
            (user.phone || '').includes(query)
        );
        renderUsers(filtered);
    }, 300));
}

function initDoctorSearch() {
    const searchInput = document.getElementById('doctorSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
            renderPendingDoctors(pendingDoctors);
            return;
        }
        const filtered = pendingDoctors.filter(doc => 
            (doc.fullName || '').toLowerCase().includes(query) ||
            (doc.specialtyName || '').toLowerCase().includes(query) ||
            (doc.email || '').toLowerCase().includes(query)
        );
        renderPendingDoctors(filtered);
    }, 300));
}

// ==================== Initialize ====================
function init() {
    if (!requireAdmin()) return;

    const path = window.location.pathname;

    if (path.includes('admin-dashboard.html') || path.includes('admin.html')) {
        loadStats();
        loadPendingDoctors();
        loadAllAppointments(); // Load appointments for admin
    } else if (path.includes('admin-doctors.html')) {
        loadPendingDoctors();
        loadApprovedDoctors();
        initDoctorSearch();
    } else if (path.includes('admin-users.html')) {
        loadUsers();
        initUserSearch();
    }
}

document.addEventListener('DOMContentLoaded', init);

// Export for use in other modules
export {
    loadStats,
    loadPendingDoctors,
    loadApprovedDoctors,
    loadUsers,
    loadAllAppointments,
    approveDoctor,
    rejectDoctor,
    revokeDoctor,
    toggleUserStatus
};