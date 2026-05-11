namespace Se7atk.Models
{
    public class Medicine
    {
        public Guid Id { get; set; }
        public string NameAr { get; set; } = null!; // varchar(200)
        public string NameEn { get; set; } = null!;
        public string? Brand { get; set; }           // varchar(100)
        public string? Category { get; set; }        // varchar(100)
        public bool RequiresPrescription { get; set; }

        public ICollection<PharmacyInventory> Inventory { get; set; } = new List<PharmacyInventory>();
    }
}
