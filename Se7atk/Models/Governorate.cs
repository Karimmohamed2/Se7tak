namespace Se7atk.Models
{
    public class Governorate
    {
        public int Id { get; set; }
        public string NameAr { get; set; } = null!;  // varchar(100)
        public string NameEn { get; set; } = null!;

        public ICollection<City> Cities { get; set; } = new List<City>();
    }
}
