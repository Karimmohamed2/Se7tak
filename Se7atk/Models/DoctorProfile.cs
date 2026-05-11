namespace Se7atk.Models
{
    public class DoctorProfile
    {
        public Guid Id { get; set; }
        public int SpecialtyId { get; set; }
        public string? Bio { get; set; }
        public decimal Price { get; set; }           // decimal(18,2)
        public int? YearsOfExperience { get; set; }
        public string? ClinicAddress { get; set; }
        public int? CityId { get; set; }
        public decimal? Latitude { get; set; }       // decimal(10,8)
        public decimal? Longitude { get; set; }      // decimal(11,8)
        public bool IsApproved { get; set; }

        // Navigation
        public User User { get; set; } = null!;
        public Specialty Specialty { get; set; } = null!;
        public City? City { get; set; }
        public ICollection<AvailabilitySlot> AvailabilitySlots { get; set; } = new List<AvailabilitySlot>();
    }
}
