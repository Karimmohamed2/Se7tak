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
        Task<List<ReviewDto>> GetDoctorReviewsAsync(Guid doctorId); //  جديد
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

            if (request.SpecialtyId.HasValue)
                query = query.Where(d => d.SpecialtyId == request.SpecialtyId.Value);

            if (request.CityId.HasValue)
                query = query.Where(d => d.CityId == request.CityId.Value);

            if (request.MaxPrice.HasValue)
                query = query.Where(d => d.Price <= request.MaxPrice.Value);

            if (request.MinExperience.HasValue)
                query = query.Where(d => d.YearsOfExperience >= request.MinExperience.Value);

            if (!string.IsNullOrWhiteSpace(request.SearchName))
            {
                var search = request.SearchName.Trim().ToLower();
                query = query.Where(d =>
                    d.User.FullName.ToLower().Contains(search) ||
                    d.Specialty.NameAr.Contains(search) ||
                    d.Specialty.NameEn.ToLower().Contains(search)
                );
            }

            query = query.Where(d => d.IsApproved);

            var doctors = await query.ToListAsync();

            // حساب متوسط التقييمات وعددها (يمكن تحسين الأداء)
            var result = new List<DoctorListDto>();
            foreach (var d in doctors)
            {
                var reviews = await _context.Reviews
                    .Where(r => r.Appointment.DoctorId == d.Id)
                    .ToListAsync();
                var avgRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;
                result.Add(new DoctorListDto
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
                    AverageRating = avgRating,
                    ReviewsCount = reviews.Count
                });
            }
            return result;
        }

        public async Task<DoctorDetailDto?> GetDoctorByIdAsync(Guid id)
        {
            var doctor = await _context.DoctorProfiles
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .Include(d => d.City)
                .FirstOrDefaultAsync(d => d.Id == id && d.IsApproved);

            if (doctor == null) return null;

            var reviews = await _context.Reviews
                .Where(r => r.Appointment.DoctorId == id)
                .ToListAsync();
            var avgRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;

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
                AverageRating = avgRating,
                ReviewsCount = reviews.Count
            };
        }

        public async Task<List<AvailabilitySlotDto>> GetDoctorSlotsAsync(Guid doctorId, DateTime? date)
        {
            var query = _context.AvailabilitySlots
                .Where(s => s.DoctorId == doctorId)
                .AsQueryable();

            if (date.HasValue)
            {
                var startOfDay = date.Value.Date;
                var endOfDay = startOfDay.AddDays(1);
                query = query.Where(s => s.StartTime >= startOfDay && s.StartTime < endOfDay);
            }
            else
            {
                var now = DateTime.Now;
                query = query.Where(s => s.StartTime >= now);
            }

            var slots = await query.OrderBy(s => s.StartTime).ToListAsync();

            var bookedSlotIds = await _context.Appointments
                .Where(a => slots.Select(s => s.Id).Contains(a.SlotId) && a.Status != AppointmentStatus.Cancelled)
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

        //  جلب تقييمات الطبيب
        public async Task<List<ReviewDto>> GetDoctorReviewsAsync(Guid doctorId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Patient)
                    .ThenInclude(p => p.User)
                .Where(r => r.Appointment.DoctorId == doctorId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDto
                {
                    Id = r.Id,
                    PatientName = r.Appointment.Patient.User.FullName,
                    Rating = r.Rating,
                    Text = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return reviews;
        }
    }
}