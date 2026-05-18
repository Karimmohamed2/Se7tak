// ==================== API Configuration ====================
const API_BASE_URL = 'https://localhost:7183';
const USE_MOCK = false;

// ==================== Auth Token ====================
function getToken() {
    return localStorage.getItem('auth_token');
}

function setToken(token) {
    localStorage.setItem('auth_token', token);
}

function removeToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

// ==================== Generic Fetch ====================
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
            ...options.headers
        },
        ...options
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            removeToken();
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); }
            catch { errorData = { message: `HTTP ${response.status}` }; }
            throw new Error(errorData.message || errorData.title || `API Error ${response.status}`);
        }

        if (response.status === 204) return null;
        return response.json();

    } catch (err) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            throw new Error('فشل الاتصال بالخادم. تأكد من تشغيل الـ Backend.');
        }
        throw err;
    }
}

// ==================== Field Transformers ====================

function transformSpecialty(s) {
    const iconMap = {
        'القلب': 'heart', 'أمراض القلب': 'heart', 'Cardiology': 'heart',
        'الجلدية': 'fingerprint', 'Dermatology': 'fingerprint',
        'الأطفال': 'emoji-smile', 'طب الأطفال': 'emoji-smile', 'Pediatrics': 'emoji-smile',
        'العيون': 'eye', 'طب العيون': 'eye', 'Ophthalmology': 'eye',
        'الأعصاب': 'brain', 'النفسية': 'brain', 'Neurology': 'brain', 'Psychiatry': 'brain',
        'العظام': 'person-walking', 'Orthopedics': 'person-walking',
        'الباطنية': 'stethoscope', 'الباطنة العامة': 'stethoscope', 'Internal Medicine': 'stethoscope',
        'الأسنان': 'emoji-smile', 'Dentistry': 'emoji-smile',
        'جراحة عامة': 'stethoscope', 'General Surgery': 'stethoscope',
        'أنف وأذن وحنجرة': 'stethoscope', 'ENT': 'stethoscope',
    };
    return {
        id: s.id,
        name_ar: s.nameAr || s.name_ar || '',
        name_en: s.nameEn || s.name_en || '',
        icon: iconMap[s.nameAr] || iconMap[s.nameEn] || 'stethoscope',
        doctorCount: s.doctorCount || 0
    };
}

function transformDoctor(d) {
    const avatarColors = ['#1B5A8A', '#2D8B6F', '#8B5A2D', '#6B4C8A', '#1E88E5', '#E53935', '#00838F'];
    const name = d.fullName || '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const avatarColor = avatarColors[Math.abs(hash) % avatarColors.length];

    const parts = name.replace('د.', '').trim().split(' ');
    const initials = parts.length >= 2
        ? `${parts[0][0]}.${parts[1][0]}`
        : name.slice(0, 2);

    return {
        ...d,
        id: d.id || d.doctorId,
        rating: d.averageRating || d.rating || 0,
        reviewCount: d.reviewsCount || d.reviewCount || 0,
        initials,
        avatarColor,
        specialtyName: d.specialtyName || d.specialty?.nameAr || '',
        cityName: d.cityName || d.city?.nameAr || '',
        clinicAddress: d.clinicAddress || d.address || d.clinic?.address || '',
        price: d.price || d.consultationFee || 0,
        yearsOfExperience: d.yearsOfExperience || d.experienceYears || 0,
        bio: d.bio || d.about || d.description || '',
        phone: d.phone || d.clinicPhone || ''
    };
}

function transformPharmacy(p) {
    return {
        ...p,
        cityName: p.cityNameAr || p.cityNameEn || p.cityName || '',
        rating: p.averageRating || p.rating || 0,
        reviewCount: p.reviewsCount || p.reviewCount || 0,
        addressDetail: p.addressDetail || ''
    };
}

function transformAppointment(a) {
    return {
        ...a,
        id: a.id || a.appointmentId,
        startTime: a.startTime || a.appointmentDate,
        endTime: a.endTime,
        doctorName: a.doctorName || a.doctor?.fullName || '',
        patientName: a.patientName || a.patient?.fullName || '',
        specialty: a.specialty || a.doctor?.specialtyName || '',
        status: (a.status || 'pending').toLowerCase(),
        price: a.price || a.consultationFee || 0,
    };
}

function transformSlot(s) {
    return {
        id: s.id || s.slotId,
        doctorId: s.doctorId,
        startTime: s.startTime || s.dateTime,
        endTime: s.endTime,
        booked: s.isBooked || s.booked || false,
        date: s.date || (s.startTime ? new Date(s.startTime).toISOString().split('T')[0] : null)
    };
}

// ==================== API Object ====================
const api = {

    // ─── Specialties & Lookups ────────────────────────────────
    async getSpecialties() {
        const data = await apiFetch('/lookups/specialties');
        return (data || []).map(transformSpecialty);
    },

    async getCities() {
        const data = await apiFetch('/lookups/cities');
        return (data || []).map(c => ({
            id: c.id,
            nameAr: c.nameAr || '',
            nameEn: c.nameEn || '',
            governorateId: c.governorateId
        }));
    },

    async getGovernorates() {
        return apiFetch('/lookups/governorates');
    },

    // ─── Doctors ─────────────────────────────────────────────
    async getDoctors(params = {}) {
        const backendParams = {};
        if (params.specialtyId) backendParams.specialtyId = params.specialtyId;
        if (params.cityId)      backendParams.cityId      = params.cityId;
        if (params.maxPrice)    backendParams.maxPrice    = params.maxPrice;
        if (params.minExperience) backendParams.minExperience = params.minExperience;
        if (params.q)           backendParams.searchName  = params.q;

        const query = new URLSearchParams(backendParams).toString();
        const data = await apiFetch(`/doctors${query ? '?' + query : ''}`);
        return (data || []).map(transformDoctor);
    },

    async getFeaturedDoctors(limit = 4) {
        const data = await apiFetch(`/doctors`);
        return (data || []).slice(0, limit).map(transformDoctor);
    },

    async getDoctorById(id) {
        const data = await apiFetch(`/doctors/${id}`);
        return transformDoctor(data);
    },

    async getDoctorSlots(doctorId, date) {
        const query = date ? `?date=${date}` : '';
        const data = await apiFetch(`/doctors/${doctorId}/slots${query}`);
        return (data || []).map(transformSlot);
    },

    // ─── Doctor Reviews ──────────────────────────────────────
    async getDoctorReviews(doctorId) {
        try {
            const data = await apiFetch(`/doctors/${doctorId}/reviews`);
            return (data || []).map(r => ({
                id: r.id,
                patientName: r.patientName || r.patient?.fullName || 'مريض',
                rating: r.rating || r.stars || 0,
                text: r.comment || r.text || r.reviewText || '',
                createdAt: r.createdAt || r.createdDate || new Date().toISOString()
            }));
        } catch (err) {
            console.warn('Failed to load doctor reviews:', err);
            return [];
        }
    },

    async submitDoctorReview(doctorId, appointmentId, rating, comment) {
        return apiFetch(`/doctors/${doctorId}/reviews`, {
            method: 'POST',
            body: { appointmentId, rating, comment }
        });
    },

    // ─── Booking ─────────────────────────────────────────────
    async createBooking(data) {
        const result = await apiFetch('/booking', {
            method: 'POST',
            body: data
        });
        return {
            appointmentId: result.appointmentId || result.id,
            status: (result.status || 'pending').toLowerCase(),
            message: result.message || 'تم الحجز بنجاح'
        };
    },

    async getAppointmentById(id) {
        const data = await apiFetch(`/booking/${id}`);
        return transformAppointment(data);
    },

    async getMyAppointments() {
        const data = await apiFetch('/booking/my-appointments');
        return (data || []).map(transformAppointment);
    },

    async cancelAppointment(id) {
        return apiFetch(`/booking/${id}/cancel`, { method: 'PUT' });
    },

    async createReview(appointmentId, data) {
        return apiFetch(`/booking/${appointmentId}/review`, {
            method: 'POST',
            body: data
        });
    },

    // ─── Payments ────────────────────────────────────────────
    async mockPayment(appointmentId, amount) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, transactionId: `txn-${Date.now()}` };
    },

    // ─── Pharmacies ──────────────────────────────────────────
    async getPharmacies(params = {}) {
        const backendParams = {};
        if (params.cityId)    backendParams.cityId    = params.cityId;
        if (params.isOpen24h) backendParams.isOpen24h = params.isOpen24h;
        if (params.search)    backendParams.search    = params.search;

        const query = new URLSearchParams(backendParams).toString();
        const data = await apiFetch(`/pharmacies${query ? '?' + query : ''}`);
        return (data || []).map(transformPharmacy);
    },

    async getPharmacyById(id) {
        const data = await apiFetch(`/pharmacies/${id}`);
        return transformPharmacy(data);
    },

    async getPharmacyInventory(pharmacyId) {
        const data = await apiFetch(`/pharmacies/${pharmacyId}/inventory`);
        return (data || []).map(item => ({
            ...item,
            inStock: (item.stockQuantity || 0) > 0
        }));
    },

    async getPharmacyReviews(pharmacyId) {
        const data = await apiFetch(`/pharmacies/${pharmacyId}/reviews`);
        return (data || []).map(r => ({
            ...r,
            text: r.comment || r.text || '',
            patientName: r.patientName || 'مريض'
        }));
    },

    async createPharmacyReview(pharmacyId, data) {
        return apiFetch(`/pharmacies/${pharmacyId}/reviews`, {
            method: 'POST',
            body: data
        });
    },

    // ─── Auth ────────────────────────────────────────────────
    async login(email, password) {
        const result = await apiFetch('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        if (result.token) setToken(result.token);
        if (result.user) {
            result.user.role = (result.user.role || 'patient').toLowerCase();
            localStorage.setItem('auth_user', JSON.stringify(result.user));
        }
        return result;
    },

    async register(data) {
        const result = await apiFetch('/auth/register', {
            method: 'POST',
            body: data
        });
        if (result.token) setToken(result.token);
        if (result.user) {
            result.user.role = (result.user.role || 'patient').toLowerCase();
            localStorage.setItem('auth_user', JSON.stringify(result.user));
        }
        return result;
    },

    async getCurrentUser() {
        const token = getToken();
        if (!token) return null;
        try {
            const user = await apiFetch('/auth/me');
            if (user) {
                user.role = (user.role || 'patient').toLowerCase();
                localStorage.setItem('auth_user', JSON.stringify(user));
            }
            return user;
        } catch {
            const stored = localStorage.getItem('auth_user');
            return stored ? JSON.parse(stored) : null;
        }
    },

    async forgotPassword(email) {
        return apiFetch('/auth/forgot-password', {
            method: 'POST',
            body: { email }
        });
    },

    async resetPassword(token, newPassword) {
        return apiFetch('/auth/reset-password', {
            method: 'POST',
            body: { token, newPassword }
        });
    },

    logout() {
        removeToken();
        window.location.href = 'index.html';
    },

    // ─── Admin ───────────────────────────────────────────────
    async getAdminStats() {
        const data = await apiFetch('/admin/dashboard');
        return {
            totalUsers:        data.totalPatients + data.totalDoctors || 0,
            approvedDoctors:   data.totalDoctors  || 0,
            pendingDoctors:    data.pendingDoctors || 0,
            totalAppointments: data.totalAppointments || 0,
            totalPharmacies:   data.totalPharmacies   || 0,
            totalMedicines:    data.totalMedicines     || 0,
            totalRevenue:      data.totalRevenue       || 0,
            totalPatients:     data.totalPatients || 0,
            totalDoctors:      data.totalDoctors  || 0,
        };
    },

    async getPendingDoctors() {
        const data = await apiFetch('/admin/pending-doctors');
        return (data || []).map(d => ({
            ...d,
            specialtyName: d.specialtyName || '',
            yearsOfExperience: d.yearsOfExperience || d.yearsOfExperience || 0,
            avatarColor: '#1E88E5',
            initials: (d.fullName || '').charAt(0)
        }));
    },

    async getApprovedDoctors() {
        const data = await apiFetch('/admin/approved-doctors');
        return (data || []).map(d => ({
            ...d,
            specialtyName: d.specialtyName || '',
            yearsOfExperience: d.yearsOfExperience || 0,
            avatarColor: '#2D8B6F',
            initials: (d.fullName || '').charAt(0)
        }));
    },

    async getAllUsers() {
        const data = await apiFetch('/admin/users');
        return (data || []).map(u => ({
            ...u,
            role: (u.role || 'patient').toLowerCase()
        }));
    },

    async approveDoctor(doctorId) {
        return apiFetch(`/admin/doctors/${doctorId}/approve`, { method: 'PUT' });
    },

    async rejectDoctor(doctorId) {
        return apiFetch(`/admin/doctors/${doctorId}/reject`, { method: 'PUT' });
    },

    async revokeDoctor(doctorId) {
        return apiFetch(`/admin/doctors/${doctorId}/revoke`, { method: 'PUT' });
    },

    async toggleUserActive(userId) {
        return apiFetch(`/admin/users/${userId}/toggle-active`, { method: 'PUT' });
    }
};

// ==================== Utility Functions ====================
function formatPrice(price) {
    if (!price && price !== 0) return '—';
    return `${Number(price).toFixed(Number(price) % 1 === 0 ? 0 : 2)} ج.م`;
}

function getIconClass(iconName) {
    const iconMap = {
        'emoji-smile':   'bi-emoji-smile',
        'fingerprint':   'bi-fingerprint',
        'heart':         'bi-heart',
        'eye':           'bi-eye',
        'brain':         'bi-brain',
        'person-walking':'bi-person-walking',
        'stethoscope':   'bi-stethoscope'
    };
    return iconMap[iconName] || 'bi-circle';
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

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons) return;

    const token  = getToken();
    const stored = localStorage.getItem('auth_user');
    const user   = stored ? JSON.parse(stored) : null;

    if (token && user) {
        const initial = (user.fullName || user.email || '؟').charAt(0).toUpperCase();
        const isAdmin = user.role === 'admin';
        authButtons.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-light rounded-pill dropdown-toggle d-flex align-items-center gap-2"
                        type="button" data-bs-toggle="dropdown">
                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                         style="width:32px;height:32px;font-size:0.85rem;font-weight:600;">
                        ${initial}
                    </div>
                    <span class="d-none d-sm-inline">${user.fullName || 'حسابي'}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                        <a class="dropdown-item" href="dashboard.html">
                            <i class="bi bi-speedometer2 me-2"></i>لوحة التحكم
                        </a>
                    </li>
                    ${isAdmin ? `
                    <li>
                        <a class="dropdown-item" href="admin-dashboard.html">
                            <i class="bi bi-shield-check me-2"></i>لوحة الإدارة
                        </a>
                    </li>` : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-danger" href="#"
                           onclick="api.logout(); return false;">
                            <i class="bi bi-box-arrow-right me-2"></i>تسجيل الخروج
                        </a>
                    </li>
                </ul>
            </div>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="login.html"    class="btn btn-outline-primary rounded-pill px-4">تسجيل الدخول</a>
            <a href="register.html" class="btn btn-primary rounded-pill px-4">إنشاء حساب</a>
        `;
    }
}

// ==================== Export for module usage ====================
window.api = api;
window.API_BASE_URL = API_BASE_URL;
window.USE_MOCK = USE_MOCK;
window.getToken = getToken;
window.setToken = setToken;
window.removeToken = removeToken;
window.formatPrice = formatPrice;
window.getIconClass = getIconClass;
window.renderStars = renderStars;
window.updateAuthUI = updateAuthUI;