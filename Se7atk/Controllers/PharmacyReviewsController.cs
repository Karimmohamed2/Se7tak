using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Se7atk.Dtos;
using Se7atk.Models;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PharmacyReviewsController : ControllerBase
    {
        private readonly Se7atkDbContext _context;

        public PharmacyReviewsController(Se7atkDbContext context)
        {
            _context = context;
        }

    
        //جلب كل تقييمات الصيدليات
  
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PharmacyReviewDto>>> GetReviews(
            [FromQuery] Guid? pharmacyId,
            [FromQuery] Guid? patientId,
            [FromQuery] int? minRating,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.PharmacyReviews
                .Include(r => r.Patient)
                .ThenInclude(p => p.User)
                .Include(r => r.Pharmacy)
                .AsQueryable();

            if (pharmacyId.HasValue)
                query = query.Where(r => r.PharmacyId == pharmacyId.Value);

            if (patientId.HasValue)
                query = query.Where(r => r.PatientId == patientId.Value);

            if (minRating.HasValue)
                query = query.Where(r => r.Rating >= minRating.Value);

            var totalCount = await query.CountAsync();
            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new PharmacyReviewDto
                {
                    Id = r.Id,
                    PatientId = r.PatientId,
                    PatientName = r.Patient.User != null ? r.Patient.User.FullName : null,
                    PharmacyId = r.PharmacyId,
                    PharmacyName = r.Pharmacy != null ? r.Pharmacy.Name : null,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            return Ok(reviews);
        }

     
        // جلب تقييم بالتفصيل
      
        [HttpGet("{id}")]
        public async Task<ActionResult<PharmacyReviewDto>> GetReview(Guid id)
        {
            var review = await _context.PharmacyReviews
                .Include(r => r.Patient)
                .ThenInclude(p => p.User)
                .Include(r => r.Pharmacy)
                .Where(r => r.Id == id)
                .Select(r => new PharmacyReviewDto
                {
                    Id = r.Id,
                    PatientId = r.PatientId,
                    PatientName = r.Patient.User != null ? r.Patient.User.FullName : null,
                    PharmacyId = r.PharmacyId,
                    PharmacyName = r.Pharmacy != null ? r.Pharmacy.Name : null,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (review == null)
                return NotFound(new { message = "التقييم غير موجود" });

            return Ok(review);
        }

      
        // جلب تقييمات مريض معين
   
        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<PharmacyReviewDto>>> GetPatientReviews(
            Guid patientId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var patientExists = await _context.PatientProfiles.AnyAsync(p => p.Id == patientId);
            if (!patientExists)
                return NotFound(new { message = "المريض غير موجود" });

            var totalCount = await _context.PharmacyReviews
                .CountAsync(r => r.PatientId == patientId);

            var reviews = await _context.PharmacyReviews
                .Include(r => r.Patient)
                .ThenInclude(p => p.User)
                .Include(r => r.Pharmacy)
                .Where(r => r.PatientId == patientId)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new PharmacyReviewDto
                {
                    Id = r.Id,
                    PatientId = r.PatientId,
                    PatientName = r.Patient.User != null ? r.Patient.User.FullName : null,
                    PharmacyId = r.PharmacyId,
                    PharmacyName = r.Pharmacy != null ? r.Pharmacy.Name : null,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            return Ok(reviews);
        }

        
        // إضافة تقييم جديد لصيدلية
    
        [HttpPost]
        public async Task<ActionResult<PharmacyReviewDto>> CreateReview([FromBody] CreatePharmacyReviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var patientExists = await _context.PatientProfiles.AnyAsync(p => p.Id == dto.PatientId);
            if (!patientExists)
                return BadRequest(new { message = "المريض غير موجود" });

            var pharmacyExists = await _context.Pharmacies.AnyAsync(p => p.Id == dto.PharmacyId);
            if (!pharmacyExists)
                return BadRequest(new { message = "الصيدلية غير موجودة" });

            if (dto.Rating < 1 || dto.Rating > 5)
                return BadRequest(new { message = "التقييم يجب أن يكون بين 1 و 5" });

            var duplicate = await _context.PharmacyReviews
                .AnyAsync(r => r.PatientId == dto.PatientId && r.PharmacyId == dto.PharmacyId);
            if (duplicate)
                return Conflict(new { message = "قمت بتقييم هذه الصيدلية مسبقاً" });

            var review = new PharmacyReview
            {
                Id = Guid.NewGuid(),
                PatientId = dto.PatientId,
                PharmacyId = dto.PharmacyId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.PharmacyReviews.Add(review);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetReview),
                new { id = review.Id },
                new PharmacyReviewDto
                {
                    Id = review.Id,
                    PatientId = review.PatientId,
                    PharmacyId = review.PharmacyId,
                    Rating = review.Rating,
                    Comment = review.Comment,
                    CreatedAt = review.CreatedAt
                });
        }

      
        // تعديل تقييم
    
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReview(Guid id, [FromBody] UpdatePharmacyReviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var review = await _context.PharmacyReviews.FindAsync(id);
            if (review == null)
                return NotFound(new { message = "التقييم غير موجود" });

            if (dto.Rating < 1 || dto.Rating > 5)
                return BadRequest(new { message = "التقييم يجب أن يكون بين 1 و 5" });

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;

            await _context.SaveChangesAsync();
            return NoContent();
        }

      
        // حذف تقييم
      
        [HttpDelete("{id}")] 
        public async Task<IActionResult> DeleteReview(Guid id)
        {
            var review = await _context.PharmacyReviews.FindAsync(id);
            if (review == null)
                return NotFound(new { message = "التقييم غير موجود" });

            _context.PharmacyReviews.Remove(review);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}