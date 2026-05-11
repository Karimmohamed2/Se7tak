namespace Se7atk.Models
{
    public class PatientProfile
    {
        public Guid Id { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? BloodType { get; set; }       // varchar(5)
        public string? EmergencyPhone { get; set; }  // varchar(20)
        public int? CityId { get; set; }
        public string? AddressDetail { get; set; }

        // Navigation
        public User User { get; set; } = null!;
        public City? City { get; set; }
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<PharmacyReview> PharmacyReviews { get; set; } = new List<PharmacyReview>();
    }
}
