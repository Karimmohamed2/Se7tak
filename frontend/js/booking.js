// ==================== Booking Logic ====================

// Get URL parameters
function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Format price
function formatBookingPrice(price) {
    if (!price && price !== 0) return '—';
    return `${Number(price).toFixed(Number(price) % 1 === 0 ? 0 : 2)} ج.م`;
}

// Format date in Arabic
function formatDateAr(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('ar-EG', options);
}

// Format time in Arabic
function formatTimeAr(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('ar-EG', options);
}

// Calculate VAT (14%)
function calculateVAT(price) {
    return price * 0.14;
}

// Render stars
function renderBookingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.round(rating || 0)) {
            stars += '<i class="bi bi-star-fill text-warning"></i>';
        } else {
            stars += '<i class="bi bi-star text-muted"></i>';
        }
    }
    return stars;
}

// ==================== Booking Page ====================

let bookingData = {
    doctor: null,
    slot: null,
    price: 0,
    vat: 0,
    total: 0
};

async function loadBookingData() {
    const doctorId = getUrlParam('doctorId');
    const slotId = getUrlParam('slotId');

    if (!doctorId || !slotId) {
        showBookingError('بيانات الحجز غير مكتملة');
        return;
    }

    try {
        // Show loading
        const container = document.getElementById('bookingContainer');
        if (container) {
            container.style.opacity = '0.5';
        }

        // Load doctor details
        const doctor = await api.getDoctorById(doctorId);
        if (!doctor) {
            showBookingError('الطبيب غير موجود');
            return;
        }

        // Load slot details - try to get from doctor's slots
        const today = new Date().toISOString().split('T')[0];
        const slots = await api.getDoctorSlots(doctorId, today);
        const slot = slots.find(s => s.id === slotId);
        
        if (!slot) {
            // If not found in today's slots, check if we have the slot ID only
            // Create a mock slot with the ID for the booking process
            console.warn('Slot not found in available slots, proceeding with ID only');
        }

        bookingData.doctor = doctor;
        bookingData.slot = slot || { id: slotId, startTime: new Date().toISOString() };
        bookingData.price = doctor.price || 0;
        bookingData.vat = calculateVAT(bookingData.price);
        bookingData.total = bookingData.price + bookingData.vat;

        renderBookingPage();
        
        if (container) {
            container.style.opacity = '1';
        }

    } catch (err) {
        console.error('Failed to load booking data:', err);
        showBookingError('فشل تحميل بيانات الحجز: ' + err.message);
    }
}

function renderBookingPage() {
    const { doctor, slot, price, vat, total } = bookingData;

    // Update doctor info
    const avatarEl = document.getElementById('doctorAvatar');
    if (avatarEl) {
        avatarEl.style.backgroundColor = doctor.avatarColor || '#1E88E5';
        avatarEl.textContent = doctor.initials || doctor.fullName?.charAt(0) || 'د';
    }
    
    const nameEl = document.getElementById('doctorFullName');
    if (nameEl) nameEl.textContent = doctor.fullName;
    
    const specialtyEl = document.getElementById('doctorSpecialty');
    if (specialtyEl) specialtyEl.textContent = doctor.specialtyName;
    
    const ratingEl = document.getElementById('doctorRating');
    if (ratingEl) {
        ratingEl.innerHTML = `
            ${renderBookingStars(doctor.rating)}
            <span class="rating-value ms-2">${(doctor.rating || 0).toFixed(1)}</span>
            <span class="rating-count">(${doctor.reviewCount || 0} تقييم)</span>
        `;
    }

    // Update breadcrumb
    const breadcrumbLink = document.getElementById('doctorBreadcrumbLink');
    if (breadcrumbLink) {
        breadcrumbLink.textContent = doctor.fullName || '...';
        breadcrumbLink.href = `doctor-details.html?id=${doctor.id}`;
    }

    // Update slot info
    const dateEl = document.getElementById('slotDate');
    if (dateEl) dateEl.textContent = formatDateAr(slot.startTime);
    
    const timeEl = document.getElementById('slotTime');
    if (timeEl) timeEl.textContent = formatTimeAr(slot.startTime);
    
    const periodEl = document.getElementById('slotPeriod');
    if (periodEl) periodEl.textContent = getPeriodLabel(slot.startTime);

    // Update clinic address
    const addressEl = document.getElementById('clinicAddress');
    if (addressEl) addressEl.textContent = doctor.clinicAddress || doctor.cityName || '—';

    // Update price summary
    const feeEl = document.getElementById('consultationFee');
    if (feeEl) feeEl.textContent = formatBookingPrice(price);
    
    const vatEl = document.getElementById('vatAmount');
    if (vatEl) vatEl.textContent = formatBookingPrice(vat);
    
    const totalEl = document.getElementById('totalAmount');
    if (totalEl) totalEl.textContent = formatBookingPrice(total);

    // Update submit button text
    const btnText = document.getElementById('submitBtnText');
    if (btnText) btnText.textContent = `تأكيد الحجز ودفع ${formatBookingPrice(total)}`;
}

function getPeriodLabel(dateStr) {
    const hour = new Date(dateStr).getHours();
    return hour < 14 ? 'صباحاً' : 'مساءً';
}

function showBookingError(message) {
    const container = document.getElementById('bookingContainer');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-state-icon mb-3">
                    <i class="bi bi-exclamation-circle text-danger fs-1"></i>
                </div>
                <h4 class="text-danger">${message}</h4>
                <a href="doctors.html" class="btn btn-primary rounded-pill mt-3">العودة للأطباء</a>
            </div>
        `;
    }
}

// Handle booking form submission
async function handleBookingSubmit(e) {
    e.preventDefault();

    const notes = document.getElementById('visitReason')?.value.trim() || '';
    const termsChecked = document.getElementById('termsCheck')?.checked;
    
    if (!termsChecked) {
        showToast('يرجى الموافقة على شروط الحجز', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = document.getElementById('submitBtnText')?.textContent || 'تأكيد الحجز ودفع';

    // Disable button
    submitBtn.disabled = true;
    const btnText = document.getElementById('submitBtnText');
    if (btnText) btnText.textContent = 'جاري التأكيد...';
    
    const spinner = document.getElementById('submitSpinner');
    if (spinner) spinner.classList.remove('d-none');

    try {
        // Check if user is logged in
        const token = localStorage.getItem('auth_token');
        if (!token) {
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent(window.location.href);
            window.location.href = `login.html?redirect=${returnUrl}`;
            return;
        }

        // Create booking
        const result = await api.createBooking({
            doctorId: bookingData.doctor.id,
            slotId: bookingData.slot.id,
            notes: notes || undefined
        });

        // Mock payment
        await api.mockPayment(result.appointmentId, bookingData.total);

        // Redirect to confirmation page
        window.location.href = `booking-confirmation.html?id=${result.appointmentId}`;

    } catch (err) {
        console.error('Booking failed:', err);
        
        // Show error
        showToast(err.message || 'فشل إتمام الحجز، يرجى المحاولة مرة أخرى', 'error');

        // Reset button
        submitBtn.disabled = false;
        const btnTextEl = document.getElementById('submitBtnText');
        if (btnTextEl) btnTextEl.textContent = originalText;
        
        const spinnerEl = document.getElementById('submitSpinner');
        if (spinnerEl) spinnerEl.classList.add('d-none');
    }
}

// ==================== Booking Confirmation Page ====================

async function loadConfirmationData() {
    const appointmentId = getUrlParam('id');

    if (!appointmentId) {
        showConfirmationError('رقم الحجز غير موجود');
        return;
    }

    try {
        // Load appointment details
        const appointment = await api.getAppointmentById(appointmentId);
        if (!appointment) {
            showConfirmationError('الحجز غير موجود');
            return;
        }

        renderConfirmationPage(appointment);
    } catch (err) {
        console.error('Failed to load confirmation:', err);
        showConfirmationError('فشل تحميل تفاصيل الحجز');
    }
}

function renderConfirmationPage(appointment) {
    // Update appointment number
    const numEl = document.getElementById('appointmentNumber');
    if (numEl) numEl.textContent = `#${appointment.id.toString().slice(0, 8).toUpperCase()}`;

    // Update doctor info
    const nameEl = document.getElementById('doctorName');
    if (nameEl) nameEl.textContent = appointment.doctorName;
    
    const specialtyEl = document.getElementById('doctorSpecialty');
    if (specialtyEl) specialtyEl.textContent = appointment.specialty;

    // Update slot info
    const dateEl = document.getElementById('confirmDate');
    if (dateEl) dateEl.textContent = formatDateAr(appointment.startTime);
    
    const timeEl = document.getElementById('confirmTime');
    if (timeEl) timeEl.textContent = formatTimeAr(appointment.startTime);

    // Update price
    const priceEl = document.getElementById('confirmPrice');
    if (priceEl) priceEl.textContent = formatBookingPrice(appointment.price);

    // Update status badge
    const statusBadge = document.getElementById('statusBadge');
    const statusLabels = {
        'pending': { text: 'بانتظار التأكيد', class: 'bg-warning text-dark' },
        'confirmed': { text: 'مؤكد', class: 'bg-success' },
        'completed': { text: 'مكتمل', class: 'bg-info' },
        'cancelled': { text: 'ملغي', class: 'bg-danger' }
    };
    const status = statusLabels[appointment.status] || { text: appointment.status, class: 'bg-secondary' };
    
    if (statusBadge) {
        statusBadge.textContent = status.text;
        statusBadge.className = `badge ${status.class} px-3 py-2 fs-6`;
    }
}

function showConfirmationError(message) {
    const container = document.getElementById('confirmationContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="empty-state-icon mb-3">
                    <i class="bi bi-exclamation-circle text-danger fs-1"></i>
                </div>
                <h4 class="text-danger">${message}</h4>
                <a href="index.html" class="btn btn-primary rounded-pill mt-3">العودة للرئيسية</a>
            </div>
        `;
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
    
    // Check which page we're on
    const path = window.location.pathname;

    if (path.includes('booking.html')) {
        loadBookingData();

        // Setup form handler
        const form = document.getElementById('bookingForm');
        if (form) {
            form.addEventListener('submit', handleBookingSubmit);
        }
        
        // Payment method selection
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', () => {
                document.querySelectorAll('.payment-method').forEach(m => {
                    m.classList.remove('selected');
                    const check = m.querySelector('.bi-check-circle-fill');
                    if (check) check.remove();
                });
                method.classList.add('selected');
                if (!method.querySelector('.bi-check-circle-fill')) {
                    method.innerHTML += '<i class="bi bi-check-circle-fill text-primary ms-auto"></i>';
                }
            });
        });
    }

    if (path.includes('booking-confirmation.html')) {
        loadConfirmationData();
    }
});