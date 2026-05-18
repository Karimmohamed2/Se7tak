

// ==================== State ====================
let currentPharmacyId = null;
let currentInventory = [];
let allPharmacies = [];
let currentFilter = 'all';
let allMedicines = [];


const mockPharmacies = [
    {
        id: 'p1',
        name: 'صيدلية النصر',
        cityName: 'القاهرة',
        addressDetail: 'مدينة نصر - شارع النصر',
        phone: '01234567890',
        isOpen24h: true,
        averageRating: 4.5,
        reviewsCount: 128,
        description: 'صيدلية متكاملة توفر جميع الأدوية والمستلزمات الطبية على مدار 24 ساعة.'
    },
    {
        id: 'p2',
        name: 'صيدلية العزبي',
        cityName: 'الجيزة',
        addressDetail: 'الدقي - شارع التحرير',
        phone: '01112223344',
        isOpen24h: false,
        averageRating: 4.2,
        reviewsCount: 85,
        description: 'صيدلية كبيرة توفر أدوية مستوردة ومحلية بأسعار منافسة.'
    },
    {
        id: 'p3',
        name: 'صيدلية 19011',
        cityName: 'الإسكندرية',
        addressDetail: 'سموحة - شارع جمال عبد الناصر',
        phone: '01555556666',
        isOpen24h: true,
        averageRating: 4.8,
        reviewsCount: 256,
        description: 'شبكة صيدليات معروفة بخدمة التوصيل السريع.'
    },
    {
        id: 'p4',
        name: 'صيدلية المصري',
        cityName: 'القاهرة',
        addressDetail: 'المعادي - شارع 9',
        phone: '01000001111',
        isOpen24h: false,
        averageRating: 4.0,
        reviewsCount: 64,
        description: 'صيدلية عائلية توفر استشارات صيدلية مجانية.'
    }
];

// ==================== Utility Functions ====================

/**
 * Render stars rating
 */
function renderPharmacyStars(rating) {
    let stars = '';
    const rounded = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
        stars += i <= rounded
            ? '<i class="bi bi-star-fill text-warning"></i>'
            : '<i class="bi bi-star text-muted"></i>';
    }
    return stars;
}

/**
 * Format price
 */
function formatPharmacyPrice(price) {
    if (!price && price !== 0) return '—';
    return `${Number(price).toFixed(Number(price) % 1 === 0 ? 0 : 2)} ج.م`;
}

/**
 * Format phone number for display (RTL fix)
 */
function formatPhoneRTL(phone) {
    if (!phone) return '—';
    // Add LTR direction for phone numbers to display correctly in RTL
    return `<span dir="ltr" style="display: inline-block; unicode-bidi: embed;">${phone}</span>`;
}

/**
 * Debounce function
 */
function debouncePharmacy(func, wait) {
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

// ==================== Render Functions ====================

/**
 * Render pharmacy list cards
 */
function renderPharmacyList(pharmacies, container) {
    if (!container) return;

    if (pharmacies.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state py-5 text-center">
                    <div class="empty-state-icon mb-3">
                        <i class="bi bi-shop fs-1 text-muted"></i>
                    </div>
                    <p class="empty-state-title fw-bold text-muted">لا توجد صيدليات متاحة</p>
                    <p class="empty-state-description text-muted">جرّب تغيير الفلاتر أو البحث في منطقة أخرى</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = pharmacies.map(pharm => `
        <div class="col-12 col-md-6 col-lg-4">
            <a href="pharmacy-details.html?id=${pharm.id}" class="text-decoration-none">
                <div class="pharmacy-card h-100">
                    <div class="d-flex align-items-start gap-3 mb-3">
                        <div class="pharmacy-icon flex-shrink-0 d-flex align-items-center justify-content-center" 
                             style="width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 1.5rem;">
                            <i class="bi bi-capsule"></i>
                        </div>
                        <div class="flex-grow-1 min-w-0">
                            <h5 class="mb-1 text-dark fw-bold text-truncate">${pharm.name}</h5>
                            <p class="text-muted small mb-0 text-truncate">${pharm.cityName || ''}${pharm.addressDetail ? '، ' + pharm.addressDetail : ''}</p>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                        ${pharm.isOpen24h 
                            ? '<span class="badge-24h"><i class="bi bi-clock"></i> مفتوح 24/7</span>'
                            : '<span class="badge-closed"><i class="bi bi-clock"></i> ساعات محددة</span>'
                        }
                        ${pharm.phone ? `<span class="text-muted small" dir="ltr">${pharm.phone}</span>` : ''}
                    </div>
                    ${pharm.averageRating ? `
                        <div class="rating-stars small">
                            ${renderPharmacyStars(pharm.averageRating)}
                            <span class="rating-value ms-1">${pharm.averageRating.toFixed(1)}</span>
                            <span class="rating-count">(${(pharm.reviewsCount || 0).toLocaleString('ar-EG')} تقييم)</span>
                        </div>
                    ` : ''}
                </div>
            </a>
        </div>
    `).join('');
}

/**
 * Render pharmacy details page
 */
function renderPharmacyDetails(pharmacy) {
    // Update page title
    document.title = `${pharmacy.name} - صحتك`;

    // Update breadcrumb
    const breadcrumbName = document.getElementById('pharmacyNameBreadcrumb');
    if (breadcrumbName) breadcrumbName.textContent = pharmacy.name;

    // Update header
    const nameEl = document.getElementById('pharmacyName');
    if (nameEl) nameEl.textContent = pharmacy.name;

    const addressEl = document.getElementById('pharmacyAddress');
    if (addressEl) {
        addressEl.textContent = `${pharmacy.cityName || ''}${pharmacy.addressDetail ? '، ' + pharmacy.addressDetail : ''}`;
    }

    const phoneEl = document.getElementById('pharmacyPhone');
    const phoneText = document.getElementById('phoneText');
    if (phoneEl && phoneText) {
        if (pharmacy.phone) {
            phoneEl.href = `tel:${pharmacy.phone}`;
            phoneText.innerHTML = formatPhoneRTL(pharmacy.phone);
        } else {
            phoneText.textContent = 'لا يوجد رقم';
        }
    }

    // Update status badge
    const statusEl = document.getElementById('pharmacyStatus');
    if (statusEl) {
        if (pharmacy.isOpen24h) {
            statusEl.innerHTML = '<i class="bi bi-check-circle me-1"></i> مفتوح 24/7';
            statusEl.className = 'badge badge-available';
        } else {
            statusEl.innerHTML = '<i class="bi bi-clock me-1"></i> ساعات محددة';
            statusEl.className = 'badge bg-info bg-opacity-10 text-info';
        }
    }

    // Update rating
    const ratingEl = document.getElementById('pharmacyRating');
    if (ratingEl && pharmacy.averageRating) {
        ratingEl.innerHTML = `
            <div class="rating-stars">
                ${renderPharmacyStars(pharmacy.averageRating)}
                <span class="rating-value ms-2">${pharmacy.averageRating.toFixed(1)}</span>
                <span class="rating-count">(${(pharmacy.reviewsCount || 0).toLocaleString('ar-EG')} تقييم)</span>
            </div>
        `;
    }

    // Update description
    const descEl = document.getElementById('pharmacyDescription');
    if (descEl) {
        descEl.textContent = pharmacy.description || 'صيدلية متكاملة توفر جميع الأدوية والمستلزمات الطبية.';
    }

    // Update map label
    const mapLabel = document.getElementById('mapLocation');
    if (mapLabel) mapLabel.textContent = pharmacy.cityName || pharmacy.name;

    // Update working hours
    const workingHours = document.getElementById('workingHours');
    if (workingHours) {
        workingHours.textContent = pharmacy.isOpen24h 
            ? 'مفتوحة 24 ساعة طوال أيام الأسبوع'
            : 'السبت - الخميس: 08:00 ص - 11:00 م | الجمعة: 10:00 ص - 11:00 م';
    }
}

/**
 * Render inventory items
 */
function renderInventory(inventory, container) {
    if (!container) return;
    currentInventory = inventory;

    const countEl = document.getElementById('medicinesCount');
    if (countEl) countEl.textContent = inventory.length;

    if (inventory.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-4 text-center">
                <p class="text-muted mb-0">لا توجد أدوية مسجلة في المخزون</p>
            </div>
        `;
        return;
    }

    container.innerHTML = inventory.map(item => `
        <div class="medicine-item d-flex align-items-center gap-3 p-3 rounded-4 mb-2" style="background: #f8fafc;" data-medicine-id="${item.medicineId || item.id}">
            <div class="medicine-icon flex-shrink-0 d-flex align-items-center justify-content-center rounded-3" 
                 style="width: 48px; height: 48px; background: linear-gradient(135deg, #1E88E5, #2BB6E6);">
                <i class="bi bi-capsule text-white fs-5"></i>
            </div>
            <div class="flex-grow-1">
                <h6 class="fw-bold mb-1">${item.medicineNameAr || item.medicineNameEn || item.nameAr || item.nameEn || 'دواء'}</h6>
                ${item.brand ? `<p class="text-muted small mb-0">${item.brand}</p>` : ''}
            </div>
            <div class="text-start">
                <span class="fw-bold text-primary" dir="ltr">${formatPharmacyPrice(item.price)}</span>
                <span class="d-block small ${(item.stockQuantity || 0) > 0 ? 'text-success' : 'text-danger'}">
                    ${(item.stockQuantity || 0) > 0 
                        ? '<i class="bi bi-check-circle"></i> متوفر' 
                        : '<i class="bi bi-x-circle"></i> نفذ'
                    }
                </span>
            </div>
        </div>
    `).join('');
}

/**
 * Render reviews
 */
function renderReviews(reviews, container) {
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-4 text-center">
                <p class="text-muted mb-0">لا توجد تقييمات بعد</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews.map(review => `
        <div class="review-item d-flex gap-3 pb-4 mb-4 border-bottom">
            <div class="reviewer-avatar flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary fw-bold" 
                 style="width: 40px; height: 40px;">
                ${review.patientName ? review.patientName.charAt(0) : 'م'}
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <h6 class="fw-bold mb-0">${review.patientName || 'مريض'}</h6>
                    <span class="text-muted small">${formatPharmacyDate(review.createdAt)}</span>
                </div>
                <div class="rating-stars small mb-2">
                    ${renderPharmacyStars(review.rating)}
                </div>
                ${review.comment || review.text ? `<p class="text-muted mb-0">${review.comment || review.text}</p>` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Format date to Arabic
 */
function formatPharmacyDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ==================== Search & Filter ====================

/**
 * Initialize pharmacy search
 */
function initPharmacySearch() {
    const searchInput = document.getElementById('pharmacySearch');
    const medicineSearch = document.getElementById('medicineSearch');
    const filterChips = document.querySelectorAll('.filter-chip');

    // Filter chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter || 'all';
            applyPharmacyFilters();
        });
    });

    // Pharmacy name/area search
    if (searchInput) {
        searchInput.addEventListener('input', debouncePharmacy(() => {
            applyPharmacyFilters();
        }, 300));
    }

    // Medicine search - NEW: Search across all pharmacies
    if (medicineSearch) {
        medicineSearch.addEventListener('input', debouncePharmacy((e) => {
            searchMedicine(e.target.value.trim());
        }, 500));
    }
}

/**
 * Search for medicine across all pharmacies
 */
async function searchMedicine(query) {
    if (!query) {
        // If empty, show all pharmacies
        applyPharmacyFilters();
        return;
    }

    const container = document.getElementById('pharmaciesGrid');
    const resultsCount = document.getElementById('resultsCount');
    
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جارٍ البحث...</span>
                </div>
                <p class="text-muted mt-2">جارٍ البحث عن الدواء...</p>
            </div>
        `;
    }

    try {
        // Try to search via API
        // This assumes your backend has a medicine search endpoint
        // If not, we'll filter locally
        
        let foundPharmacies = [];
        
        // First, try API search
        try {
            const searchResults = await api.getPharmacies({ search: query });
            if (searchResults && searchResults.length > 0) {
                foundPharmacies = searchResults;
            }
        } catch (apiErr) {
            console.log('API search failed, falling back to local search');
        }
        
        // If API didn't return results, do local search on inventory
        if (foundPharmacies.length === 0) {
            // Check each pharmacy's inventory for the medicine
            for (const pharmacy of allPharmacies) {
                try {
                    const inventory = await api.getPharmacyInventory(pharmacy.id);
                    const hasMedicine = inventory.some(item => {
                        const nameMatch = (item.medicineNameAr || '').toLowerCase().includes(query.toLowerCase());
                        const brandMatch = (item.brand || '').toLowerCase().includes(query.toLowerCase());
                        const enMatch = (item.medicineNameEn || '').toLowerCase().includes(query.toLowerCase());
                        return nameMatch || brandMatch || enMatch;
                    });
                    
                    if (hasMedicine) {
                        foundPharmacies.push(pharmacy);
                    }
                } catch (err) {
                    // If can't load inventory, include pharmacy anyway (fallback)
                    foundPharmacies.push(pharmacy);
                }
            }
        }
        
        // Display results
        if (resultsCount) {
            resultsCount.textContent = foundPharmacies.length > 0 
                ? `تم العثور على ${foundPharmacies.length} صيدلية`
                : 'لا توجد نتائج';
        }
        
        const emptyState = document.getElementById('emptyState');
        if (foundPharmacies.length === 0) {
            if (container) container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('d-none');
        } else {
            if (emptyState) emptyState.classList.add('d-none');
            renderPharmacyList(foundPharmacies, container);
        }
        
    } catch (err) {
        console.error('Medicine search error:', err);
        // Fallback: show all pharmacies
        applyPharmacyFilters();
    }
}

/**
 * Apply pharmacy filters
 */
function applyPharmacyFilters() {
    const searchInput = document.getElementById('pharmacySearch');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    let filtered = [...allPharmacies];

    // Apply filter chip
    if (currentFilter === '24h') {
        filtered = filtered.filter(p => p.isOpen24h);
    }

    // Apply search
    if (query) {
        filtered = filtered.filter(p => 
            (p.name || '').toLowerCase().includes(query) ||
            (p.cityName || '').toLowerCase().includes(query) ||
            (p.addressDetail || '').toLowerCase().includes(query)
        );
    }

    const container = document.getElementById('pharmaciesGrid');
    const resultsCount = document.getElementById('resultsCount');
    const emptyState = document.getElementById('emptyState');

    if (resultsCount) {
        resultsCount.textContent = filtered.length > 0 
            ? `تم العثور على ${filtered.length} صيدلية`
            : 'لا توجد نتائج';
    }

    if (filtered.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('d-none');
    } else {
        if (emptyState) emptyState.classList.add('d-none');
        renderPharmacyList(filtered, container);
    }
}

/**
 * Reset all filters
 */
function resetFilters() {
    const searchInput = document.getElementById('pharmacySearch');
    if (searchInput) searchInput.value = '';
    
    const medicineSearch = document.getElementById('medicineSearch');
    if (medicineSearch) medicineSearch.value = '';
    
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    const allChip = document.querySelector('[data-filter="all"]');
    if (allChip) allChip.classList.add('active');
    
    currentFilter = 'all';
    applyPharmacyFilters();
}

// ==================== Data Loading ====================

/**
 * Load pharmacy list
 */
async function loadPharmacyList() {
    const container = document.getElementById('pharmaciesGrid');
    const resultsCount = document.getElementById('resultsCount');

    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جارٍ التحميل...</span>
                </div>
                <p class="text-muted mt-2">جارٍ التحميل...</p>
            </div>
        `;
    }

    try {
        const pharmacies = await api.getPharmacies();
        allPharmacies = pharmacies;
        applyPharmacyFilters();
    } catch (err) {
        console.error('Failed to load pharmacies from API, using mock data:', err);
        // Fallback to mock data
        allPharmacies = mockPharmacies;
        applyPharmacyFilters();
    }
}

/**
 * Load pharmacy details - FIXED VERSION
 */
async function loadPharmacyDetails(id) {
    currentPharmacyId = id;

    try {
        // Try to get from API first
        let pharmacy = null;
        
        try {
            pharmacy = await api.getPharmacyById(id);
        } catch (apiErr) {
            console.log('API failed, trying mock data');
        }
        
        // If API failed, try mock data
        if (!pharmacy) {
            pharmacy = mockPharmacies.find(p => p.id === id);
        }
        
        // If still not found, show error
        if (!pharmacy) {
            showPharmacyError('الصيدلية غير موجودة');
            return;
        }

        // Render pharmacy details
        renderPharmacyDetails(pharmacy);

        // Load inventory
        await loadPharmacyInventory(id);

        // Load reviews
        await loadPharmacyReviews(id);

    } catch (err) {
        console.error('Failed to load pharmacy details:', err);
        showPharmacyError('حدث خطأ أثناء تحميل بيانات الصيدلية');
    }
}

/**
 * Show pharmacy error
 */
function showPharmacyError(message) {
    const mainContent = document.querySelector('main') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'container mt-4';
    errorDiv.innerHTML = `
        <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            ${message}
            <br>
            <a href="pharmacies.html" class="btn btn-primary mt-3">العودة للصيدليات</a>
        </div>
    `;
    
    // Insert after navbar
    const navbar = document.querySelector('nav');
    if (navbar && navbar.nextElementSibling) {
        navbar.parentNode.insertBefore(errorDiv, navbar.nextElementSibling);
    } else {
        mainContent.insertBefore(errorDiv, mainContent.firstChild);
    }
}

/**
 * Load pharmacy inventory
 */
async function loadPharmacyInventory(pharmacyId) {
    try {
        const inventory = await api.getPharmacyInventory(pharmacyId);
        const container = document.getElementById('medicinesList');
        renderInventory(inventory, container);
    } catch (err) {
        console.error('Failed to load inventory:', err);
        // Mock inventory fallback
        const mockInventory = [
            { medicineId: 'm1', medicineNameAr: 'بنادول أدفانس', brand: 'Panadol', price: 25, stockQuantity: 50 },
            { medicineId: 'm2', medicineNameAr: 'فولتارين جل', brand: 'Voltaren', price: 55, stockQuantity: 30 },
            { medicineId: 'm3', medicineNameAr: 'فيتامين سي 1000', brand: 'Vitamin C', price: 45, stockQuantity: 0 },
            { medicineId: 'm4', medicineNameAr: 'بيتادين', brand: 'Betadine', price: 22, stockQuantity: 100 },
            { medicineId: 'm5', medicineNameAr: 'واقي شمس', brand: 'La Roche-Posay', price: 350, stockQuantity: 15 },
        ];
        const container = document.getElementById('medicinesList');
        renderInventory(mockInventory, container);
    }
}

/**
 * Load pharmacy reviews
 */
async function loadPharmacyReviews(id) {
    try {
        const reviews = await api.getPharmacyReviews(id);
        const container = document.getElementById('reviewsList');
        renderReviews(reviews, container);
    } catch (err) {
        console.error('Failed to load reviews:', err);
        // Mock reviews fallback
        const mockReviews = [
            { patientName: 'أحمد الشاذلي', rating: 5, text: 'خدمة ممتازة وسريعة جداً. الصيدلي كان متعاون جداً في شرح طريقة استخدام الدواء.', createdAt: '2026-05-10' },
            { patientName: 'سارة القاضي', rating: 4, text: 'عندهم معظم منتجات العناية بالبشرة اللي كنت بدور عليها. السعر مناسب.', createdAt: '2026-04-15' },
        ];
        renderReviews(mockReviews, document.getElementById('reviewsList'));
    }
}

/**
 * Load cities for filter dropdown
 */
async function loadPharmacyCities() {
    const cityFilter = document.getElementById('cityFilter');
    if (!cityFilter) return;

    try {
        const cities = await api.getCities();
        cityFilter.innerHTML = '<option value="">كل المدن</option>' +
            cities.map(c => `<option value="${c.id}">${c.nameAr}</option>`).join('');
    } catch (err) {
        console.error('Failed to load cities:', err);
    }
}


function initPharmacies() {
    const path = window.location.pathname;

    if (path.includes('pharmacies.html')) {
        // Pharmacy list page
        loadPharmacyList();
        loadPharmacyCities();
        initPharmacySearch();

    } else if (path.includes('pharmacy-details.html')) {
        // Pharmacy details page
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (id) {
            loadPharmacyDetails(id);
        } else {
            window.location.href = 'pharmacies.html';
        }
    }
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Update auth UI first
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
    
    // Initialize pharmacies
    initPharmacies();
});