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
    public class DoctorsController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
        private readonly Se7atkDbContext _context;

        public DoctorsController(IDoctorService doctorService, Se7atkDbContext context)
        {
            _doctorService = doctorService;
            _context = context;
        }

     
        //  البحث عن الأطباء)
        [HttpGet]
        public async Task<IActionResult> GetDoctors([FromQuery] DoctorSearchRequest request)
        {
            var doctors = await _doctorService.SearchDoctorsAsync(request);
            return Ok(doctors);
        }

        
        //  تفاصيل طبيب معين
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDoctor(Guid id)
        {
            var doctor = await _doctorService.GetDoctorByIdAsync(id);
            if (doctor == null)
                return NotFound(new { message = "الطبيب غير موجود" });

            return Ok(doctor);
        }

        //  جلب مواعيد الطبيب المتاحة (سلوتس)
        [HttpGet("{id}/slots")]
        public async Task<IActionResult> GetDoctorSlots(Guid id, [FromQuery] DateTime? date)
        {
            var slots = await _doctorService.GetDoctorSlotsAsync(id, date);
            return Ok(slots);
        }

        //   جلب تقييمات الطبيب
        
        [HttpGet("{id}/reviews")]
        public async Task<IActionResult> GetDoctorReviews(Guid id)
        {
            var reviews = await _doctorService.GetDoctorReviewsAsync(id);
            return Ok(reviews);
        }

      
        //  تحديث حالة الموعد (قبول/رفض/إكمال) – للدكتور فقط
       
        [HttpPut("appointments/{appointmentId}/status")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UpdateAppointmentStatus(Guid appointmentId, [FromBody] UpdateAppointmentStatusRequest request)
        {
            var doctorId = GetCurrentUserId();
            if (doctorId == null)
                return Unauthorized();

            var appointment = await _context.Appointments
                .Include(a => a.Doctor)
                .FirstOrDefaultAsync(a => a.Id == appointmentId);

            if (appointment == null)
                return NotFound(new { message = "الموعد غير موجود" });

            if (appointment.DoctorId != doctorId.Value)
                return Forbid();

            if (!Enum.TryParse<AppointmentStatus>(request.Status, true, out var newStatus))
                return BadRequest(new { message = "حالة غير صالحة" });

            appointment.Status = newStatus;
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم تحديث حالة الموعد" });
        }

       
        //   إضافة موعد متاح (سلوت) – للدكتور فقط
    
        [HttpPost("{doctorId}/slots")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> AddSlot(Guid doctorId, [FromBody] AddSlotRequest request)
        {
            var currentDoctorId = GetCurrentUserId();
            if (currentDoctorId == null || currentDoctorId.Value != doctorId)
                return Unauthorized();

            // التأكد من أن الطبيب موجود ومعتمد
            var doctor = await _context.DoctorProfiles
                .FirstOrDefaultAsync(d => d.Id == doctorId && d.IsApproved);
            if (doctor == null)
                return NotFound(new { message = "الطبيب غير موجود أو غير معتمد" });

            var startTime = request.StartTime;
            var endTime = startTime.AddMinutes(30); // مدة الموعد 30 دقيقة افتراضياً

            var slot = new AvailabilitySlot
            {
                Id = Guid.NewGuid(),
                DoctorId = doctorId,
                StartTime = startTime,
                EndTime = endTime
            };

            _context.AvailabilitySlots.Add(slot);
            await _context.SaveChangesAsync();

            return Ok(new { id = slot.Id, startTime, endTime, message = "تم إضافة الموعد" });
        }

       
        //  حذف موعد متاح – للدكتور فقط
     
        [HttpDelete("slots/{slotId}")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> DeleteSlot(Guid slotId)
        {
            var doctorId = GetCurrentUserId();
            if (doctorId == null)
                return Unauthorized();

            var slot = await _context.AvailabilitySlots
                .FirstOrDefaultAsync(s => s.Id == slotId && s.DoctorId == doctorId.Value);
            if (slot == null)
                return NotFound(new { message = "الموعد غير موجود أو لا يخصك" });

            // نمنع حذف الموعد إذا كان محجوزاً
            var isBooked = await _context.Appointments
                .AnyAsync(a => a.SlotId == slotId && a.Status != AppointmentStatus.Cancelled);
            if (isBooked)
                return BadRequest(new { message = "لا يمكن حذف موعد محجوز" });

            _context.AvailabilitySlots.Remove(slot);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم حذف الموعد" });
        }

      
        //  Helper: جلب معرف الدكتور من التوكن
     
        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
                return userId;
            return null;
        }
    }

    // DTOs مخصصة
    public class UpdateAppointmentStatusRequest
    {
        public string Status { get; set; } = null!; // pending, confirmed, cancelled, completed
    }

    public class AddSlotRequest
    {
        public DateTime StartTime { get; set; }
    }
}