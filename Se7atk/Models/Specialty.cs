namespace Se7atk.Models
{
    public class Specialty
    {
        public int Id { get; set; }
        public string NameAr { get; set; } = null!;  // varchar(100)
        public string NameEn { get; set; } = null!;

        public ICollection<DoctorProfile> DoctorProfiles { get; set; } = new List<DoctorProfile>();
    }
}
