// Se7atk/Services/AdminService.cs
using Microsoft.EntityFrameworkCore;
using Se7atk.Dtos;
using Se7atk.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Se7atk.Services
{
    public interface IAdminService
    {
        Task<List<PendingDoctorDto>> GetPendingDoctorsAsync();
        Task<List<PendingDoctorDto>> GetApprovedDoctorsAsync();
        Task<bool> ApproveDoctorAsync(Guid doctorId);
        Task<bool> RejectDoctorAsync(Guid doctorId);
        Task<AdminDashboardStats> GetDashboardStatsAsync();
        Task<List<UserListDto>> GetAllUsersAsync();
        Task<bool> ToggleUserActiveAsync(Guid userId);
    }

    public class AdminService : IAdminService
    {
        private readonly Se7atkDbContext _context;

        public AdminService(Se7atkDbContext context)
        {
            _context = context;
        }

        public async Task<List<PendingDoctorDto>> GetPendingDoctorsAsync()
        {
            var doctors = await _context.DoctorProfiles
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .Where(d => !d.IsApproved)
                .OrderByDescending(d => d.User.CreatedAt)
                .ToListAsync();

            return doctors.Select(d => new PendingDoctorDto
            {
                Id = d.Id,
                FullName = d.User.FullName,
                Phone = d.User.Phone,
                Email = d.User.Email,
                SpecialtyName = d.Specialty.NameAr,
                Price = d.Price,
                YearsOfExperience = d.YearsOfExperience ?? 0,
                Bio = d.Bio,
                ClinicAddress = d.ClinicAddress,
                CreatedAt = d.User.CreatedAt
            }).ToList();
        }

        public async Task<List<PendingDoctorDto>> GetApprovedDoctorsAsync()
        {
            var doctors = await _context.DoctorProfiles
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .Where(d => d.IsApproved)
                .OrderByDescending(d => d.User.CreatedAt)
                .Take(100)
                .ToListAsync();

            return doctors.Select(d => new PendingDoctorDto
            {
                Id = d.Id,
                FullName = d.User.FullName,
                Phone = d.User.Phone,
                Email = d.User.Email,
                SpecialtyName = d.Specialty.NameAr,
                Price = d.Price,
                YearsOfExperience = d.YearsOfExperience ?? 0,
                Bio = d.Bio,
                ClinicAddress = d.ClinicAddress,
                CreatedAt = d.User.CreatedAt
            }).ToList();
        }

        public async Task<bool> ApproveDoctorAsync(Guid doctorId)
        {
            var doctor = await _context.DoctorProfiles.FindAsync(doctorId);
            if (doctor == null) return false;

            doctor.IsApproved = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RejectDoctorAsync(Guid doctorId)
        {
            var doctor = await _context.DoctorProfiles.FindAsync(doctorId);
            if (doctor == null) return false;

            // ممكن نحذف أو نعلم عليه مرفوض
            doctor.IsApproved = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<AdminDashboardStats> GetDashboardStatsAsync()
        {
            var totalDoctors = await _context.DoctorProfiles.CountAsync(d => d.IsApproved);
            var pendingDoctors = await _context.DoctorProfiles.CountAsync(d => !d.IsApproved);
            var totalPatients = await _context.PatientProfiles.CountAsync();
            var totalAppointments = await _context.Appointments.CountAsync();
            var totalPharmacies = await _context.Pharmacies.CountAsync();
            var totalMedicines = await _context.Medicines.CountAsync();

            // حساب الإيرادات من المواعيد المكتملة
            var revenue = await _context.Appointments
                .Where(a => a.Status == AppointmentStatus.Completed)
                .Include(a => a.Doctor)
                .SumAsync(a => a.Doctor.Price);

            return new AdminDashboardStats
            {
                TotalDoctors = totalDoctors,
                PendingDoctors = pendingDoctors,
                TotalPatients = totalPatients,
                TotalAppointments = totalAppointments,
                TotalPharmacies = totalPharmacies,
                TotalMedicines = totalMedicines,
                TotalRevenue = revenue
            };
        }

        public async Task<List<UserListDto>> GetAllUsersAsync()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return users.Select(u => new UserListDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            }).ToList();
        }

        public async Task<bool> ToggleUserActiveAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}