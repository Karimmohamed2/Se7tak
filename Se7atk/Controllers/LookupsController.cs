
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Se7atk.Models;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LookupsController : ControllerBase
    {
        private readonly Se7atkDbContext _context;

        public LookupsController(Se7atkDbContext context)
        {
            _context = context;
        }

        // GET: api/lookups/governorates
        [HttpGet("governorates")]
        public async Task<IActionResult> GetGovernorates()
        {
            var governorates = await _context.Governorates
                .OrderBy(g => g.NameAr)
                .ToListAsync();

            return Ok(governorates);
        }

        // GET: api/lookups/cities?governorateId=1
        [HttpGet("cities")]
        public async Task<IActionResult> GetCities([FromQuery] int? governorateId)
        {
            var query = _context.Cities
                .Include(c => c.Governorate)
                .AsQueryable();

            if (governorateId.HasValue)
                query = query.Where(c => c.GovernorateId == governorateId.Value);

            var cities = await query
                .OrderBy(c => c.NameAr)
                .ToListAsync();

            return Ok(cities);
        }

        // GET: api/lookups/specialties
        [HttpGet("specialties")]
        public async Task<IActionResult> GetSpecialties()
        {
            var specialties = await _context.Specialties
                .OrderBy(s => s.NameAr)
                .ToListAsync();

            return Ok(specialties);
        }

        // GET: api/lookups/appointment-statuses
        [HttpGet("appointment-statuses")]
        public IActionResult GetAppointmentStatuses()
        {
            var statuses = Enum.GetValues(typeof(AppointmentStatus))
                .Cast < AppointmentStatus > ()
                .Select(s => new { id = (int)s, name = s.ToString() });

            return Ok(statuses);
        }

        // GET: api/lookups/payment-statuses
        [HttpGet("payment-statuses")]
        public IActionResult GetPaymentStatuses()
        {
            var statuses = Enum.GetValues(typeof(PaymentStatus))
                .Cast < PaymentStatus > ()
                .Select(s => new { id = (int)s, name = s.ToString() });

            return Ok(statuses);
        }

        // GET: api/lookups/user-roles
        [HttpGet("user-roles")]
        public IActionResult GetUserRoles()
        {
            var roles = Enum.GetValues(typeof(UserRole))
                .Cast<UserRole>()
                .Select(r => new { id = (int)r, name = r.ToString() });

            return Ok(roles);
        }
    }
}