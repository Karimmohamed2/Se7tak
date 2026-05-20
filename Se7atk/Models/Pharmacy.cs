namespace Se7atk.Models
{
    public class Pharmacy
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;   // varchar(200)
        public string? Phone { get; set; }           // varchar(20)
        public int? CityId { get; set; }
        public string? AddressDetail { get; set; }
        public bool IsOpen24h { get; set; }
        public decimal? Latitude { get; set; }       // decimal(10,8)
        public decimal? Longitude { get; set; }      // decimal(11,8)

        // Navigation
        public City? City { get; set; }
        public ICollection<PharmacyReview> Reviews { get; set; } = new List<PharmacyReview>();
        public ICollection<PharmacyInventory> Inventory { get; set; } = new List<PharmacyInventory>();
    }
}
