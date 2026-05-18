using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Se7atk.Models;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly Se7atkDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(Se7atkDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
                return Conflict(new { message = "البريد الإلكتروني مسجل مسبقاً" });

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = passwordHash,
                Phone = request.Phone,
                Role = request.Role == "doctor" ? UserRole.Doctor : UserRole.Patient,
                RoleId = request.Role == "doctor" ? 2 : 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            if (user.Role == UserRole.Patient)
            {
                _context.PatientProfiles.Add(new PatientProfile
                {
                    Id = user.Id,
                    CityId = null,
                    AddressDetail = null
                });
            }
            else if (user.Role == UserRole.Doctor)
            {
                _context.DoctorProfiles.Add(new DoctorProfile
                {
                    Id = user.Id,
                    SpecialtyId = 1,
                    Price = 0,
                    IsApproved = false
                });
            }

            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    role = user.Role.ToString().ToLower()
                }
            });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { message = "البريد الإلكتروني أو كلمة المرور غير صحيحة" });

            if (!user.IsActive)
                return Unauthorized(new { message = "الحساب غير مفعل" });

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    role = user.Role.ToString().ToLower()
                }
            });
        }

        // GET: api/auth/me
        [HttpGet("me")]
        [Authorize]   // ← كان ناقص
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user == null) return NotFound();

            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phone = user.Phone,
                role = user.Role.ToString().ToLower(),
                isActive = user.IsActive
            });
        }

        // POST: api/auth/forgot-password
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            // دايمًا نرجع نفس الرسالة (security best practice)
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user != null)
            {
                // TODO: ابعت إيميل حقيقي هنا
                // مثلاً: await _emailService.SendResetEmail(user.Email, token);
            }

            return Ok(new { message = "لو البريد الإلكتروني مسجل، هتوصلك رسالة قريباً" });
        }

        // POST: api/auth/reset-password
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            // TODO: تحقق من الـ token وغيّر الباسورد
            // دلوقتي placeholder بس
            return Ok(new { message = "تم إعادة تعيين كلمة المرور" });
        }

        // ── Helper ──────────────────────────────────────────
        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email,          user.Email),
                new Claim("fullName",                user.FullName),
                new Claim(ClaimTypes.Role,           user.Role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(
                                       double.Parse(_config["Jwt:ExpireHours"]!)),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // ── Request DTOs ─────────────────────────────────────────
    public class RegisterRequest
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? Phone { get; set; }
        public string Role { get; set; } = "patient";
    }

    public class LoginRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = null!;
    }

    public class ResetPasswordRequest
    {
        public string Token { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}