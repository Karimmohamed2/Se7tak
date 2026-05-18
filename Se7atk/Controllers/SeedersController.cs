using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Se7atk.Models;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedersController : ControllerBase
    {
        private readonly Se7atkDbContext _context;

        public SeedersController(Se7atkDbContext context)
        {
            _context = context;
        }

        // POST: api/seeders/seed-all
        [HttpPost("seed-all")]
        public async Task<IActionResult> SeedAll()
        {
            var result = new List<string>();

            if (!await _context.Governorates.AnyAsync())
            {
                await SeedGovernorates();
                result.Add("Governorates seeded");
            }
            else result.Add("Governorates already exist");

            if (!await _context.Cities.AnyAsync())
            {
                await SeedCities();
                result.Add("Cities seeded");
            }
            else result.Add("Cities already exist");

            if (!await _context.Specialties.AnyAsync())
            {
                await SeedSpecialties();
                result.Add("Specialties seeded");
            }
            else result.Add("Specialties already exist");

            if (!await _context.Medicines.AnyAsync())
            {
                await SeedMedicines();
                result.Add("Medicines seeded");
            }
            else result.Add("Medicines already exist");

            return Ok(new { message = "Seeding completed", details = result });
        }

        private async Task SeedGovernorates()
        {
            var governorates = new[]
            {
                new Governorate { NameAr = "القاهرة", NameEn = "Cairo" },
                new Governorate { NameAr = "الإسكندرية", NameEn = "Alexandria" },
                new Governorate { NameAr = "الجيزة", NameEn = "Giza" },
                new Governorate { NameAr = "الدقهلية", NameEn = "Dakahlia" },
                new Governorate { NameAr = "الغربية", NameEn = "Gharbia" },
                new Governorate { NameAr = "أسيوط", NameEn = "Assiut" },
                new Governorate { NameAr = "الفيوم", NameEn = "Fayoum" },
                new Governorate { NameAr = "الشرقية", NameEn = "Sharqia" }
            };

            _context.Governorates.AddRange(governorates);
            await _context.SaveChangesAsync();
        }

        private async Task SeedCities()
        {
            var cairo = await _context.Governorates.FirstAsync(g => g.NameEn == "Cairo");
            var alex = await _context.Governorates.FirstAsync(g => g.NameEn == "Alexandria");
            var giza = await _context.Governorates.FirstAsync(g => g.NameEn == "Giza");
            var dakahlia = await _context.Governorates.FirstAsync(g => g.NameEn == "Dakahlia");

            var cities = new[]
            {
                // Cairo
                new City { GovernorateId = cairo.Id, NameAr = "مدينة نصر", NameEn = "Nasr City" },
                new City { GovernorateId = cairo.Id, NameAr = "المعادي", NameEn = "Maadi" },
                new City { GovernorateId = cairo.Id, NameAr = "مصر الجديدة", NameEn = "Heliopolis" },
                new City { GovernorateId = cairo.Id, NameAr = "الدقي", NameEn = "Dokki" },
                new City { GovernorateId = cairo.Id, NameAr = "وسط البلد", NameEn = "Downtown" },

                // Alexandria
                new City { GovernorateId = alex.Id, NameAr = "سموحة", NameEn = "Smouha" },
                new City { GovernorateId = alex.Id, NameAr = "المنتزه", NameEn = "Montaza" },
                new City { GovernorateId = alex.Id, NameAr = "العجمي", NameEn = "Agami" },

                // Giza
                new City { GovernorateId = giza.Id, NameAr = "الدقي", NameEn = "Dokki" },
                new City { GovernorateId = giza.Id, NameAr = "الهرم", NameEn = "Haram" },
                new City { GovernorateId = giza.Id, NameAr = "6 أكتوبر", NameEn = "6th of October" },

                // Dakahlia (Mansoura)
                new City { GovernorateId = dakahlia.Id, NameAr = "المنصورة", NameEn = "Mansoura" },
                new City { GovernorateId = dakahlia.Id, NameAr = "طلخا", NameEn = "Talkha" }
            };

            _context.Cities.AddRange(cities);
            await _context.SaveChangesAsync();
        }

        private async Task SeedSpecialties()
        {
            var specialties = new[]
            {
                new Specialty { NameAr = "القلب", NameEn = "Cardiology" },
                new Specialty { NameAr = "الجلدية", NameEn = "Dermatology" },
                new Specialty { NameAr = "الأطفال", NameEn = "Pediatrics" },
                new Specialty { NameAr = "العظام", NameEn = "Orthopedics" },
                new Specialty { NameAr = "العيون", NameEn = "Ophthalmology" },
                new Specialty { NameAr = "الأسنان", NameEn = "Dentistry" },
                new Specialty { NameAr = "الباطنية", NameEn = "Internal Medicine" },
                new Specialty { NameAr = "النفسية", NameEn = "Psychiatry" },
                new Specialty { NameAr = "جراحة عامة", NameEn = "General Surgery" },
                new Specialty { NameAr = "أنف وأذن وحنجرة", NameEn = "ENT" }
            };

            _context.Specialties.AddRange(specialties);
            await _context.SaveChangesAsync();
        }

        private async Task SeedMedicines()
        {
            var medicines = new[]
            {
                new Medicine { NameAr = "بنادول أدفانس", NameEn = "Panadol Advance", Brand = "Panadol", Category = "مسكنات الألم", RequiresPrescription = false },
                new Medicine { NameAr = "فولتارين جل", NameEn = "Voltaren Gel", Brand = "Voltaren", Category = "مسكنات الألم", RequiresPrescription = false },
                new Medicine { NameAr = "بنادول إكسترا", NameEn = "Panadol Extra", Brand = "Panadol", Category = "مسكنات الألم", RequiresPrescription = false },
                new Medicine { NameAr = "فيتامين سي 1000", NameEn = "Vitamin C 1000mg", Brand = "Vitamin C", Category = "الفيتامينات", RequiresPrescription = false },
                new Medicine { NameAr = "بيتادين", NameEn = "Betadine", Brand = "Betadine", Category = "المطهرات", RequiresPrescription = false },
                new Medicine { NameAr = "أموكسيل", NameEn = "Amoxicillin", Brand = "Amoxil", Category = "المضادات الحيوية", RequiresPrescription = true },
                new Medicine { NameAr = "زيثروماكس", NameEn = "Azithromycin", Brand = "Zithromax", Category = "المضادات الحيوية", RequiresPrescription = true },
                new Medicine { NameAr = "نوروفين", NameEn = "Nurofen", Brand = "Nurofen", Category = "مسكنات الألم", RequiresPrescription = false },
                new Medicine { NameAr = "جافيسكون", NameEn = "Gaviscon", Brand = "Gaviscon", Category = "المعدة والهضم", RequiresPrescription = false },
                new Medicine { NameAr = "واقي شمس", NameEn = "Sunscreen SPF50", Brand = "La Roche-Posay", Category = "العناية بالبشرة", RequiresPrescription = false }
            };

            _context.Medicines.AddRange(medicines);
            await _context.SaveChangesAsync();
        }
    }
}