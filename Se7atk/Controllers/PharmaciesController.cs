using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Se7atk.Dtos;
using Se7atk.Models;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PharmaciesController : ControllerBase
    {
        private readonly Se7atkDbContext _context;

        public PharmaciesController(Se7atkDbContext context)
        {
            _context = context;
        }

      
        // search and filter
      
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PharmacyDto>>> GetPharmacies(
            [FromQuery] int? cityId,
            [FromQuery] bool? isOpen24h,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.Pharmacies
                .Include(p => p.City)
                .Include(p => p.Reviews)
                .AsQueryable();

            if (cityId.HasValue)
                query = query.Where(p => p.CityId == cityId.Value);

            if (isOpen24h.HasValue)
                query = query.Where(p => p.IsOpen24h == isOpen24h.Value);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p => p.Name.Contains(search) ||
                                          (p.AddressDetail != null && p.AddressDetail.Contains(search)));

            var totalCount = await query.CountAsync();
            var pharmacies = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new PharmacyDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Phone = p.Phone,
                    CityId = p.CityId,
                    CityNameAr = p.City != null ? p.City.NameAr : null,
                    CityNameEn = p.City != null ? p.City.NameEn : null,
                    AddressDetail = p.AddressDetail,
                    IsOpen24h = p.IsOpen24h,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                    ReviewsCount = p.Reviews.Count
                })
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            return Ok(pharmacies);
        }

     
        // find pharmavy
   
        [HttpGet("{id}")]
        public async Task<ActionResult<PharmacyDto>> GetPharmacy(Guid id)
        {
            var pharmacy = await _context.Pharmacies
                .Include(p => p.City)
                .Include(p => p.Reviews)
                .Where(p => p.Id == id)
                .Select(p => new PharmacyDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Phone = p.Phone,
                    CityId = p.CityId,
                    CityNameAr = p.City != null ? p.City.NameAr : null,
                    CityNameEn = p.City != null ? p.City.NameEn : null,
                    AddressDetail = p.AddressDetail,
                    IsOpen24h = p.IsOpen24h,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                    ReviewsCount = p.Reviews.Count
                })
                .FirstOrDefaultAsync();

            if (pharmacy == null)
                return NotFound(new { message = "الصيدلية غير موجودة" });

            return Ok(pharmacy);
        }

    
        // جلب مخزون صيدلية معين
       
        [HttpGet("{id}/inventory")]
        public async Task<ActionResult<IEnumerable<PharmacyInventoryDto>>> GetPharmacyInventory(Guid id)
        {
            var pharmacyExists = await _context.Pharmacies.AnyAsync(p => p.Id == id);
            if (!pharmacyExists)
                return NotFound(new { message = "الصيدلية غير موجودة" });

            var inventory = await _context.PharmacyInventory
                .Include(i => i.Medicine)
                .Where(i => i.PharmacyId == id)
                .Select(i => new PharmacyInventoryDto
                {
                    Id = i.Id,
                    PharmacyId = i.PharmacyId,
                    MedicineId = i.MedicineId,
                    MedicineNameAr = i.Medicine != null ? i.Medicine.NameAr : null,
                    MedicineNameEn = i.Medicine != null ? i.Medicine.NameEn : null,
                    Brand = i.Medicine != null ? i.Medicine.Brand : null,
                    Price = i.Price,
                    StockQuantity = i.StockQuantity,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return Ok(inventory);
        }

      
        // جلب تقييمات صيدلية معين
   
        [HttpGet("{id}/reviews")]
        public async Task<ActionResult<IEnumerable<PharmacyReviewDto>>> GetPharmacyReviews(Guid id)
        {
            var pharmacyExists = await _context.Pharmacies.AnyAsync(p => p.Id == id);
            if (!pharmacyExists)
                return NotFound(new { message = "الصيدلية غير موجودة" });

            var reviews = await _context.PharmacyReviews
                .Include(r => r.Patient)
                .ThenInclude(p => p.User)
                .Where(r => r.PharmacyId == id)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new PharmacyReviewDto
                {
                    Id = r.Id,
                    PatientId = r.PatientId,
                    PatientName = r.Patient.User != null ? r.Patient.User.FullName : null,
                    PharmacyId = r.PharmacyId,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }

      
        // إنشاء صيدلية جديدة
     
        [HttpPost]
        public async Task<ActionResult<PharmacyDto>> CreatePharmacy([FromBody] CreatePharmacyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (dto.CityId.HasValue)
            {
                var cityExists = await _context.Cities.AnyAsync(c => c.Id == dto.CityId.Value);
                if (!cityExists)
                    return BadRequest(new { message = "المدينة المختارة غير موجودة" });
            }

            var pharmacy = new Pharmacy
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Phone = dto.Phone,
                CityId = dto.CityId,
                AddressDetail = dto.AddressDetail,
                IsOpen24h = dto.IsOpen24h,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude
            };

            _context.Pharmacies.Add(pharmacy);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetPharmacy),
                new { id = pharmacy.Id },
                new PharmacyDto
                {
                    Id = pharmacy.Id,
                    Name = pharmacy.Name,
                    Phone = pharmacy.Phone,
                    CityId = pharmacy.CityId,
                    IsOpen24h = pharmacy.IsOpen24h,
                    Latitude = pharmacy.Latitude,
                    Longitude = pharmacy.Longitude
                });
        }

       
        // تعديل بيانات صيدلية
     
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePharmacy(Guid id, [FromBody] UpdatePharmacyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var pharmacy = await _context.Pharmacies.FindAsync(id);
            if (pharmacy == null)
                return NotFound(new { message = "الصيدلية غير موجودة" });

            if (dto.CityId.HasValue)
            {
                var cityExists = await _context.Cities.AnyAsync(c => c.Id == dto.CityId.Value);
                if (!cityExists)
                    return BadRequest(new { message = "المدينة المختارة غير موجودة" });
            }

            pharmacy.Name = dto.Name;
            pharmacy.Phone = dto.Phone;
            pharmacy.CityId = dto.CityId;
            pharmacy.AddressDetail = dto.AddressDetail;
            pharmacy.IsOpen24h = dto.IsOpen24h;
            pharmacy.Latitude = dto.Latitude;
            pharmacy.Longitude = dto.Longitude;

            await _context.SaveChangesAsync();
            return NoContent();
        }

     

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePharmacy(Guid id)
        {
            var pharmacy = await _context.Pharmacies.FindAsync(id);
            if (pharmacy == null)
                return NotFound(new { message = "الصيدلية غير موجودة" });

            _context.Pharmacies.Remove(pharmacy);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}