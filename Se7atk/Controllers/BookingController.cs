
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Se7atk.Dtos;
using Se7atk.Services;
using System.Security.Claims;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // لازم تكون مسجل دخول
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingController(IBookingService bookingService)
        {
            _bookingService = bookingService;
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
            if (userId == null)
                return Unauthorized();

            var appointments = await _bookingService.GetPatientAppointmentsAsync(userId.Value);
            return Ok(appointments);
        }

        // GET: api/booking/doctor-appointments
        [HttpGet("doctor-appointments")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetDoctorAppointments()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var appointments = await _bookingService.GetDoctorAppointmentsAsync(userId.Value);
            return Ok(appointments);
        }

        // PUT: api/booking/{id}/cancel
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelAppointment(Guid id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

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

        // Helper: جيب الـUser ID من التوكن
        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
                return userId;
            return null;
        }
    }
}