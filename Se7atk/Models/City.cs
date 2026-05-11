namespace Se7atk.Models
{
    public class City
    {
        public int Id { get; set; }
        public int GovernorateId { get; set; }
        public string NameAr { get; set; } = null!;
        public string NameEn { get; set; } = null!;

        // Navigation
        public Governorate Governorate { get; set; } = null!;
        public ICollection<DoctorProfile> DoctorProfiles { get; set; } = new List<DoctorProfile>();
        public ICollection<PatientProfile> PatientProfiles { get; set; } = new List<PatientProfile>();
        public ICollection<Pharmacy> Pharmacies { get; set; } = new List<Pharmacy>();
    }
}
