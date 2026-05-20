using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Se7atk.Dtos;
using Se7atk.Models;

namespace Se7atk.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PharmacyInventoryController : ControllerBase
    {
        private readonly Se7atkDbContext _context;

        public PharmacyInventoryController(Se7atkDbContext context)
        {
            _context = context;
        }

    
        // جلب كل مخزون الصيدليات مع إمكانية الفلترة
     
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PharmacyInventoryDto>>> GetInventory(
            [FromQuery] Guid? pharmacyId,
            [FromQuery] Guid? medicineId,
            [FromQuery] decimal? maxPrice,
            [FromQuery] bool? inStock,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.PharmacyInventory
                .Include(i => i.Pharmacy)
                .Include(i => i.Medicine)
                .AsQueryable();

            if (pharmacyId.HasValue)
                query = query.Where(i => i.PharmacyId == pharmacyId.Value);

            if (medicineId.HasValue)
                query = query.Where(i => i.MedicineId == medicineId.Value);

            if (maxPrice.HasValue)
                query = query.Where(i => i.Price <= maxPrice.Value);

            if (inStock.HasValue)
                query = inStock.Value
                    ? query.Where(i => i.StockQuantity > 0)
                    : query.Where(i => i.StockQuantity == 0);

            var totalCount = await query.CountAsync();
            var inventory = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new PharmacyInventoryDto
                {
                    Id = i.Id,
                    PharmacyId = i.PharmacyId,
                    PharmacyName = i.Pharmacy != null ? i.Pharmacy.Name : null,
                    MedicineId = i.MedicineId,
                    MedicineNameAr = i.Medicine != null ? i.Medicine.NameAr : null,
                    MedicineNameEn = i.Medicine != null ? i.Medicine.NameEn : null,
                    Brand = i.Medicine != null ? i.Medicine.Brand : null,
                    Price = i.Price,
                    StockQuantity = i.StockQuantity,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            return Ok(inventory);
        }

     
        // جلب عنصر مخزون بالتفصيل

        [HttpGet("{id}")]
        public async Task<ActionResult<PharmacyInventoryDto>> GetInventoryItem(Guid id)
        {
            var item = await _context.PharmacyInventory
                .Include(i => i.Pharmacy)
                .Include(i => i.Medicine)
                .Where(i => i.Id == id)
                .Select(i => new PharmacyInventoryDto
                {
                    Id = i.Id,
                    PharmacyId = i.PharmacyId,
                    PharmacyName = i.Pharmacy != null ? i.Pharmacy.Name : null,
                    MedicineId = i.MedicineId,
                    MedicineNameAr = i.Medicine != null ? i.Medicine.NameAr : null,
                    MedicineNameEn = i.Medicine != null ? i.Medicine.NameEn : null,
                    Brand = i.Medicine != null ? i.Medicine.Brand : null,
                    Price = i.Price,
                    StockQuantity = i.StockQuantity,
                    UpdatedAt = i.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (item == null)
                return NotFound(new { message = "عنصر المخزون غير موجود" });

            return Ok(item);
        }

      
        // البحث عن صيدليات تحتوي على دواء معين
      
        [HttpGet("medicine/{medicineId}/pharmacies")]
        public async Task<ActionResult<IEnumerable<PharmacyInventoryDto>>> GetPharmaciesByMedicine(
            Guid medicineId,
            [FromQuery] int? cityId,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var medicineExists = await _context.Medicines.AnyAsync(m => m.Id == medicineId);
            if (!medicineExists)
                return NotFound(new { message = "الدواء غير موجود" });

            var query = _context.PharmacyInventory
                .Include(i => i.Pharmacy)
                .ThenInclude(p => p.City)
                .Include(i => i.Medicine)
                .Where(i => i.MedicineId == medicineId && i.StockQuantity > 0)
                .AsQueryable();

            if (cityId.HasValue)
                query = query.Where(i => i.Pharmacy.CityId == cityId.Value);

            if (maxPrice.HasValue)
                query = query.Where(i => i.Price <= maxPrice.Value);

            var totalCount = await query.CountAsync();
            var results = await query
                .OrderBy(i => i.Price)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new PharmacyInventoryDto
                {
                    Id = i.Id,
                    PharmacyId = i.PharmacyId,
                    PharmacyName = i.Pharmacy != null ? i.Pharmacy.Name : null,
                    MedicineId = i.MedicineId,
                    MedicineNameAr = i.Medicine != null ? i.Medicine.NameAr : null,
                    MedicineNameEn = i.Medicine != null ? i.Medicine.NameEn : null,
                    Brand = i.Medicine != null ? i.Medicine.Brand : null,
                    Price = i.Price,
                    StockQuantity = i.StockQuantity,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            return Ok(results);
        }

       
        // إضافة دواء لمخزون صيدلية
    
        [HttpPost]
        public async Task<ActionResult<PharmacyInventoryDto>> CreateInventoryItem([FromBody] CreatePharmacyInventoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var pharmacyExists = await _context.Pharmacies.AnyAsync(p => p.Id == dto.PharmacyId);
            if (!pharmacyExists)
                return BadRequest(new { message = "الصيدلية غير موجودة" });

            var medicineExists = await _context.Medicines.AnyAsync(m => m.Id == dto.MedicineId);
            if (!medicineExists)
                return BadRequest(new { message = "الدواء غير موجود" });

            var duplicate = await _context.PharmacyInventory
                .AnyAsync(i => i.PharmacyId == dto.PharmacyId && i.MedicineId == dto.MedicineId);
            if (duplicate)
                return Conflict(new { message = "هذا الدواء موجود بالفعل في مخزون هذه الصيدلية" });

            if (dto.Price < 0)
                return BadRequest(new { message = "السعر لا يمكن أن يكون سالباً" });

            if (dto.StockQuantity < 0)
                return BadRequest(new { message = "الكمية لا يمكن أن تكون سالبة" });

            var item = new PharmacyInventory
            {
                Id = Guid.NewGuid(),
                PharmacyId = dto.PharmacyId,
                MedicineId = dto.MedicineId,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity,
                UpdatedAt = DateTime.UtcNow
            };

            _context.PharmacyInventory.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetInventoryItem),
                new { id = item.Id },
                new PharmacyInventoryDto
                {
                    Id = item.Id,
                    PharmacyId = item.PharmacyId,
                    MedicineId = item.MedicineId,
                    Price = item.Price,
                    StockQuantity = item.StockQuantity,
                    UpdatedAt = item.UpdatedAt
                });
        }

        // تعديل عنصر مخزون (السعر أو الكمية)
     
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInventoryItem(Guid id, [FromBody] UpdatePharmacyInventoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var item = await _context.PharmacyInventory.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "عنصر المخزون غير موجود" });

            if (dto.Price < 0)
                return BadRequest(new { message = "السعر لا يمكن أن يكون سالباً" });

            if (dto.StockQuantity < 0)
                return BadRequest(new { message = "الكمية لا يمكن أن تكون سالبة" });

            item.Price = dto.Price;
            item.StockQuantity = dto.StockQuantity;
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

       
        // حذف عنصر من المخزون
      
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventoryItem(Guid id)
        {
            var item = await _context.PharmacyInventory.FindAsync(id);
            if (item == null)
                return NotFound(new { message = "عنصر المخزون غير موجود" });

            _context.PharmacyInventory.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}