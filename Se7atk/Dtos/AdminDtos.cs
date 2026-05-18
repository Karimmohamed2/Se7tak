
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

    // إحصائيات لوحة التحكم
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

    // مستخدم في الليستة
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
}