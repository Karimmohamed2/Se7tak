// Se7atk/Controllers/DoctorsController.cs
using Microsoft.AspNetCore.Mvc;
using Se7atk.Dtos;
using Se7atk.Services;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorsController : ControllerBase
    {
        private readonly IDoctorService _doctorService;

        public DoctorsController(IDoctorService doctorService)
        {
            _doctorService = doctorService;
        }

        // GET: api/doctors?specialtyId=1&cityId=2&maxPrice=500
        [HttpGet]
        public async Task<IActionResult> GetDoctors([FromQuery] DoctorSearchRequest request)
        {
            var doctors = await _doctorService.SearchDoctorsAsync(request);
            return Ok(doctors);
        }

        // GET: api/doctors/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDoctor(Guid id)
        {
            var doctor = await _doctorService.GetDoctorByIdAsync(id);
            if (doctor == null)
                return NotFound(new { message = "الطبيب غير موجود" });

            return Ok(doctor);
        }

        // GET: api/doctors/{id}/slots?date=2026-05-20
        [HttpGet("{id}/slots")]
        public async Task<IActionResult> GetDoctorSlots(Guid id, [FromQuery] DateTime? date)
        {
            var slots = await _doctorService.GetDoctorSlotsAsync(id, date);
            return Ok(slots);
        }
    }
}