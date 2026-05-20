using System;

namespace Se7atk.Dtos
{
    public class PendingDoctorDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string SpecialtyName { get; set; } = null!;
        public decimal Price { get; set; }
        public int YearsOfExperience { get; set; }
        public string? Bio { get; set; }
        public string? ClinicAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AdminDashboardStats
    {
        public int TotalDoctors { get; set; }
        public int PendingDoctors { get; set; }
        public int TotalPatients { get; set; }
        public int TotalAppointments { get; set; }
        public int TotalPharmacies { get; set; }
        public int TotalMedicines { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class UserListDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Phone { get; set; }
        public string Role { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    //  DTO للمواعيد في لوحة تحكم الأدمن
    public class AdminAppointmentDto
    {
        public Guid Id { get; set; }
        public string DoctorName { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public string Specialty { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
    }
}