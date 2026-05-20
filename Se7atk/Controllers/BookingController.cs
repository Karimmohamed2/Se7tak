using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Se7atk.Dtos;
using Se7atk.Models;
using Se7atk.Services;
using System.Security.Claims;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly Se7atkDbContext _context;

        public BookingController(IBookingService bookingService, Se7atkDbContext context)
        {
            _bookingService = bookingService;
            _context = context;
        }

        // POST: api/booking
        [HttpPost]
        public async Task<IActionResult> BookAppointment([FromBody] BookingRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(new { message = "يجب تسجيل الدخول أولاً" });

            var result = await _bookingService.BookAppointmentAsync(userId.Value, request);
            if (result.AppointmentId == Guid.Empty)
                return BadRequest(new { message = result.Message });

            return Ok(result);
        }

        // GET: api/booking/my-appointments
        [HttpGet("my-appointments")]
        public async Task<IActionResult> GetMyAppointments()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var appointments = await _bookingService.GetPatientAppointmentsAsync(userId.Value);
            return Ok(appointments);
        }

        // GET: api/booking/doctor-appointments
        [HttpGet("doctor-appointments")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetDoctorAppointments()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var appointments = await _bookingService.GetDoctorAppointmentsAsync(userId.Value);
            return Ok(appointments);
        }

        // PUT: api/booking/{id}/cancel
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelAppointment(Guid id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var success = await _bookingService.CancelAppointmentAsync(id, userId.Value);
            if (!success)
                return BadRequest(new { message = "لا يمكن إلغاء الموعد" });

            return Ok(new { message = "تم إلغاء الموعد بنجاح" });
        }

        // GET: api/booking/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAppointment(Guid id)
        {
            var appointment = await _bookingService.GetAppointmentByIdAsync(id);
            if (appointment == null)
                return NotFound(new { message = "الموعد غير موجود" });

            return Ok(appointment);
        }

        //  POST: api/booking/{appointmentId}/review
        // إنشاء تقييم لطبيب بعد إكمال الموعد
        [HttpPost("{appointmentId}/review")]
        public async Task<IActionResult> CreateReview(Guid appointmentId, [FromBody] CreateReviewRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == appointmentId);

            if (appointment == null)
                return NotFound(new { message = "الموعد غير موجود" });

            // التأكد أن الموعد خاص بالمستخدم المسجل وأن المريض هو من يقوم بالتقييم
            if (appointment.PatientId != userId.Value)
                return Forbid();

            // التأكد أن الموعد مكتمل (Completed) لأن التقييم بعد الزيارة
            if (appointment.Status != AppointmentStatus.Completed)
                return BadRequest(new { message = "لا يمكن تقييم طبيب إلا بعد إكمال الموعد" });

            // التأكد من عدم وجود تقييم مسبق لهذا الموعد
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.AppointmentId == appointmentId);
            if (existingReview != null)
                return Conflict(new { message = "قمت بتقييم هذا الموعد مسبقاً" });

            var review = new Review
            {
                Id = Guid.NewGuid(),
                AppointmentId = appointmentId,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم إضافة تقييمك بنجاح" });
        }

        // Helper: جلب معرف المستخدم من التوكن
        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
                return userId;
            return null;
        }
    }

    // DTO لطلب إنشاء التقييم
    public class CreateReviewRequest
    {
        public int Rating { get; set; }   
        public string? Comment { get; set; }
    }
}