namespace Se7atk.Models
{
    public class PharmacyInventory
    {
        public Guid Id { get; set; }
        public Guid PharmacyId { get; set; }
        public Guid MedicineId { get; set; }
        public decimal Price { get; set; }           // decimal(18,2)
        public int StockQuantity { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public Pharmacy Pharmacy { get; set; } = null!;
        public Medicine Medicine { get; set; } = null!;
    }
}
