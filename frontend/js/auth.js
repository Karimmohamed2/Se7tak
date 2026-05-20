// ==================== Token Management ====================
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function getStoredUser() {
    try {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function setStoredUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ==================== Auth State ====================
let currentUser = null;

function isAuthenticated() {
    return !!getToken();
}

function getCurrentUser() {
    return currentUser || getStoredUser();
}

function getUserRole() {
    const user = getCurrentUser();
    return user?.role?.toLowerCase() || null;
}

function hasRole(role) {
    return getUserRole() === role.toLowerCase();
}

function isAdmin() {
    return hasRole('admin');
}

function isDoctor() {
    return hasRole('doctor');
}

function isPatient() {
    return hasRole('patient');
}

// ==================== API Calls ====================
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'فشل تسجيل الدخول');
        }

        const data = await response.json();

        if (data.token) {
            setToken(data.token);
        }
        if (data.user) {
            currentUser = data.user;
            setStoredUser(data.user);
        }

        return data;
    } catch (err) {
        console.error('Login error:', err);
        throw err;
    }
}

async function register(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'فشل إنشاء الحساب');
        }

        const data = await response.json();

        if (data.token) {
            setToken(data.token);
        }
        if (data.user) {
            currentUser = data.user;
            setStoredUser(data.user);
        }

        return data;
    } catch (err) {
        console.error('Register error:', err);
        throw err;
    }
}

async function fetchCurrentUser() {
    try {
        const token = getToken();
        if (!token) return null;

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                removeToken();
            }
            return null;
        }

        const user = await response.json();
        currentUser = user;
        setStoredUser(user);
        return user;
    } catch (err) {
        console.error('Fetch user error:', err);
        return null;
    }
}

function logout() {
    removeToken();
    currentUser = null;
    window.location.href = 'index.html';
}

async function forgotPassword(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'فشل إرسال طلب استعادة كلمة المرور');
        }

        return await response.json();
    } catch (err) {
        console.error('Forgot password error:', err);
        throw err;
    }
}

async function resetPassword(token, newPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'فشل إعادة تعيين كلمة المرور');
        }

        return await response.json();
    } catch (err) {
        console.error('Reset password error:', err);
        throw err;
    }
}

// ==================== UI Helpers ====================
function showFormError(form, message) {
    let errorEl = form.querySelector('.form-error');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'form-error alert alert-danger py-2 mb-3';
        form.insertBefore(errorEl, form.firstChild);
    }
    errorEl.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> ${message}`;
    errorEl.classList.remove('d-none');
}

function clearFormError(form) {
    const errorEl = form.querySelector('.form-error');
    if (errorEl) {
        errorEl.classList.add('d-none');
    }
}

function setLoading(form, loading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = loading;
        if (loading) {
            submitBtn.dataset.originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                جارٍ التحميل...
            `;
        } else {
            submitBtn.innerHTML = submitBtn.dataset.originalText || submitBtn.innerHTML;
        }
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^01\d{9}$/.test(phone);
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();

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
                <i class="bi ${icons[type] || icons.info} ${colors[type] || colors.info} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// ==================== Initialize ====================
function init() {
    const path = window.location.pathname;
    if (path.includes('login.html') || path.includes('register.html')) {
        if (isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    }
    if (isAuthenticated() && !currentUser) {
        fetchCurrentUser();
    }
}

document.addEventListener('DOMContentLoaded', init);

// Export for use in other modules
export {
    isAuthenticated,
    getCurrentUser,
    getUserRole,
    hasRole,
    isAdmin,
    isDoctor,
    isPatient,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    fetchCurrentUser,
    getToken,
    setToken,
    removeToken,
    showToast,
    showFormError,
    clearFormError,
    setLoading,
    isValidEmail,
    isValidPhone
};