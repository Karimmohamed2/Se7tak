
using System;

namespace Se7atk.Dtos
{
    public class DoctorListDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = null!;
        public string SpecialtyName { get; set; } = null!;
        public string? CityName { get; set; }
        public decimal Price { get; set; }
        public int YearsOfExperience { get; set; }
        public string? ClinicAddress { get; set; }
        public string? Bio { get; set; }
        public bool IsApproved { get; set; }
        public double AverageRating { get; set; }
        public int ReviewsCount { get; set; }
    }

    public class DoctorDetailDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Phone { get; set; }
        public string SpecialtyName { get; set; } = null!;
        public int SpecialtyId { get; set; }
        public string? CityName { get; set; }
        public int? CityId { get; set; }
        public decimal Price { get; set; }
        public int YearsOfExperience { get; set; }
        public string? ClinicAddress { get; set; }
        public string? Bio { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public bool IsApproved { get; set; }
        public double AverageRating { get; set; }
        public int ReviewsCount { get; set; }
    }

    public class AvailabilitySlotDto
    {
        public Guid Id { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsBooked { get; set; }
    }

    public class DoctorSearchRequest
    {
        public int? SpecialtyId { get; set; }
        public int? CityId { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? MinExperience { get; set; }
        public string? SearchName { get; set; }
    }
}