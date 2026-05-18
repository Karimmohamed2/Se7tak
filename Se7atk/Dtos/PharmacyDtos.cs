namespace Se7atk.Dtos
{
    public class PharmacyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Phone { get; set; }
        public int? CityId { get; set; }
        public string? CityNameAr { get; set; }
        public string? CityNameEn { get; set; }
        public string? AddressDetail { get; set; }
        public bool IsOpen24h { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public double AverageRating { get; set; }
        public int ReviewsCount { get; set; }
    }

    public class CreatePharmacyDto
    {
        public string Name { get; set; } = null!;
        public string? Phone { get; set; }
        public int? CityId { get; set; }
        public string? AddressDetail { get; set; }
        public bool IsOpen24h { get; set; } = false;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }

    public class UpdatePharmacyDto
    {
        public string Name { get; set; } = null!;
        public string? Phone { get; set; }
        public int? CityId { get; set; }
        public string? AddressDetail { get; set; }
        public bool IsOpen24h { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }

    public class PharmacyInventoryDto
    {
        public Guid Id { get; set; }
        public Guid PharmacyId { get; set; }
        public string? PharmacyName { get; set; }
        public Guid MedicineId { get; set; }
        public string? MedicineNameAr { get; set; }
        public string? MedicineNameEn { get; set; }
        public string? Brand { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreatePharmacyInventoryDto
    {
        public Guid PharmacyId { get; set; }
        public Guid MedicineId { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
    }

    public class UpdatePharmacyInventoryDto
    {
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
    }

    public class PharmacyReviewDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public string? PatientName { get; set; }
        public Guid PharmacyId { get; set; }
        public string? PharmacyName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePharmacyReviewDto
    {
        public Guid PatientId { get; set; }
        public Guid PharmacyId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class UpdatePharmacyReviewDto
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}