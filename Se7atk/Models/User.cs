namespace Se7atk.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = null!;       // varchar(200)
        public string Email { get; set; } = null!;           // varchar(256)
        public string PasswordHash { get; set; } = null!;
        public string? Phone { get; set; }                   // varchar(20)
        public int RoleId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public UserRole Role { get; set; } 
        public DoctorProfile? DoctorProfile { get; set; }
        public PatientProfile? PatientProfile { get; set; }
    }

    public enum UserRole
    {
        Patient = 1,
        Doctor = 2,
        Admin = 3
    }
}
