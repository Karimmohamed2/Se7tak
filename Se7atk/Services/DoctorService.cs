// Se7atk/Services/DoctorService.cs
using Microsoft.EntityFrameworkCore;
using Se7atk.Dtos;
using Se7atk.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Se7atk.Services
{
    public interface IDoctorService
    {
        Task<List<DoctorListDto>> SearchDoctorsAsync(DoctorSearchRequest request);
        Task<DoctorDetailDto?> GetDoctorByIdAsync(Guid id);
        Task<List<AvailabilitySlotDto>> GetDoctorSlotsAsync(Guid doctorId, DateTime? date);
    }

    public class DoctorService : IDoctorService
    {
        private readonly Se7atkDbContext _context;

        public DoctorService(Se7atkDbContext context)
        {
            _context = context;
        }

        public async Task<List<DoctorListDto>> SearchDoctorsAsync(DoctorSearchRequest request)
        {
            var query = _context.DoctorProfiles
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .Include(d => d.City)
                .AsQueryable();

            // فلترة بالتخصص
            if (request.SpecialtyId.HasValue)
                query = query.Where(d => d.SpecialtyId == request.SpecialtyId.Value);

            // فلترة بالمدينة
            if (request.CityId.HasValue)
                query = query.Where(d => d.CityId == request.CityId.Value);

            // فلترة بالسعر الأقصى
            if (request.MaxPrice.HasValue)
                query = query.Where(d => d.Price <= request.MaxPrice.Value);

            // فلترة بسنوات الخبرة
            if (request.MinExperience.HasValue)
                query = query.Where(d => d.YearsOfExperience >= request.MinExperience.Value);

            // بحث بالاسم
            if (!string.IsNullOrWhiteSpace(request.SearchName))
            {
                var search = request.SearchName.Trim().ToLower();
                query = query.Where(d =>
                    d.User.FullName.ToLower().Contains(search) ||
                    d.Specialty.NameAr.Contains(search) ||
                    d.Specialty.NameEn.ToLower().Contains(search)
                );
            }

            // بس اللي معتمدين
            query = query.Where(d => d.IsApproved);

            var doctors = await query.ToListAsync();

            return doctors.Select(d => new DoctorListDto
            {
                Id = d.Id,
                FullName = d.User.FullName,
                SpecialtyName = d.Specialty.NameAr,
                CityName = d.City?.NameAr,
                Price = d.Price,
                YearsOfExperience = d.YearsOfExperience ?? 0,
                ClinicAddress = d.ClinicAddress,
                Bio = d.Bio,
                IsApproved = d.IsApproved,
                AverageRating = 0,
                ReviewsCount = 0
            }).ToList();
        }

        public async Task<DoctorDetailDto?> GetDoctorByIdAsync(Guid id)
        {
            var doctor = await _context.DoctorProfiles
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .Include(d => d.City)
                .FirstOrDefaultAsync(d => d.Id == id && d.IsApproved);

            if (doctor == null) return null;

            return new DoctorDetailDto
            {
                Id = doctor.Id,
                FullName = doctor.User.FullName,
                Email = doctor.User.Email,
                Phone = doctor.User.Phone,
                SpecialtyName = doctor.Specialty.NameAr,
                SpecialtyId = doctor.SpecialtyId,
                CityName = doctor.City?.NameAr,
                CityId = doctor.CityId,
                Price = doctor.Price,
                YearsOfExperience = doctor.YearsOfExperience ?? 0,
                ClinicAddress = doctor.ClinicAddress,
                Bio = doctor.Bio,
                Latitude = doctor.Latitude,
                Longitude = doctor.Longitude,
                IsApproved = doctor.IsApproved,
                AverageRating = 0,
                ReviewsCount = 0
            };
        }

        public async Task<List<AvailabilitySlotDto>> GetDoctorSlotsAsync(Guid doctorId, DateTime? date)
        {
            var query = _context.AvailabilitySlots
                .Where(s => s.DoctorId == doctorId)
                .AsQueryable();

            // لو محدد تاريخ، جيب المواعيد من اليوم ده
            if (date.HasValue)
            {
                var startOfDay = date.Value.Date;
                var endOfDay = startOfDay.AddDays(1);
                query = query.Where(s => s.StartTime >= startOfDay && s.StartTime < endOfDay);
            }
            else
            {
                // لو مش محدد، جيب من النهارده ورايح
                var now = DateTime.Now;
                query = query.Where(s => s.StartTime >= now);
            }

            var slots = await query
                .OrderBy(s => s.StartTime)
                .ToListAsync();

            // نشوف أي مواعيد محجوزة
            var bookedSlotIds = await _context.Appointments
                .Where(a => slots.Select(s => s.Id).Contains(a.SlotId))
                .Select(a => a.SlotId)
                .ToListAsync();

            return slots.Select(s => new AvailabilitySlotDto
            {
                Id = s.Id,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                IsBooked = bookedSlotIds.Contains(s.Id)
            }).ToList();
        }
    }
}