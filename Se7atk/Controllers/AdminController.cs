using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Se7atk.Dtos;
using Se7atk.Models;
using Se7atk.Services;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly Se7atkDbContext _context;

        public AdminController(IAdminService adminService, Se7atkDbContext context)
        {
            _adminService = adminService;
            _context = context;
        }

        // GET: api/admin/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var stats = await _adminService.GetDashboardStatsAsync();
            return Ok(stats);
        }

        // GET: api/admin/pending-doctors
        [HttpGet("pending-doctors")]
        public async Task<IActionResult> GetPendingDoctors()
        {
            var doctors = await _adminService.GetPendingDoctorsAsync();
            return Ok(doctors);
        }

        // GET: api/admin/approved-doctors
        [HttpGet("approved-doctors")]
        public async Task<IActionResult> GetApprovedDoctors()
        {
            var doctors = await _adminService.GetApprovedDoctorsAsync();
            return Ok(doctors);
        }

        // PUT: api/admin/doctors/{id}/approve
        [HttpPut("doctors/{id}/approve")]
        public async Task<IActionResult> ApproveDoctor(Guid id)
        {
            var success = await _adminService.ApproveDoctorAsync(id);
            if (!success)
                return NotFound(new { message = "الطبيب غير موجود" });

            return Ok(new { message = "تم اعتماد الطبيب بنجاح" });
        }

        // PUT: api/admin/doctors/{id}/reject
        [HttpPut("doctors/{id}/reject")]
        public async Task<IActionResult> RejectDoctor(Guid id)
        {
            var success = await _adminService.RejectDoctorAsync(id);
            if (!success)
                return NotFound(new { message = "الطبيب غير موجود" });

            return Ok(new { message = "تم رفض الطبيب" });
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _adminService.GetAllUsersAsync();
            return Ok(users);
        }

        // PUT: api/admin/users/{id}/toggle-active
        [HttpPut("users/{id}/toggle-active")]
        public async Task<IActionResult> ToggleUserActive(Guid id)
        {
            var success = await _adminService.ToggleUserActiveAsync(id);
            if (!success)
                return NotFound(new { message = "المستخدم غير موجود" });

            return Ok(new { message = "تم تغيير حالة المستخدم" });
        }

        //  GET: api/admin/appointments
        // جلب جميع المواعيد (للوحة تحكم الأدمن)
        [HttpGet("appointments")]
        public async Task<IActionResult> GetAllAppointments()
        {
            var appointments = await _context.Appointments
                .Include(a => a.Patient)
                    .ThenInclude(p => p.User)
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.User)
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.Specialty)
                .Include(a => a.Slot)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AdminAppointmentDto
                {
                    Id = a.Id,
                    DoctorName = a.Doctor.User.FullName,
                    PatientName = a.Patient.User.FullName,
                    Specialty = a.Doctor.Specialty.NameAr,
                    StartTime = a.Slot.StartTime,
                    Price = a.Doctor.Price,
                    Status = a.Status.ToString(),
                    Notes = a.Notes
                })
                .ToListAsync();

            return Ok(appointments);
        }
    }
}