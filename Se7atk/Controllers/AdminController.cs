
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Se7atk.Services;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
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
    }
}