
using System;

namespace Se7atk.Dtos
{
    // طلب حجز جديد
    public class BookingRequest
    {
        public Guid SlotId { get; set; }
        public string? Notes { get; set; }
    }

    // رد بعد الحجز
    public class BookingResponse
    {
        public Guid AppointmentId { get; set; }
        public string Status { get; set; } = null!;
        public string Message { get; set; } = null!;
    }

    // موعد في الليستة
    public class AppointmentListDto
    {
        public Guid Id { get; set; }
        public string DoctorName { get; set; } = null!;
        public string? PatientName { get; set; }
        public string Specialty { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
        public decimal Price { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // تفاصيل الموعد
    public class AppointmentDetailDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = null!;
        public string? PatientName { get; set; }
        public string Specialty { get; set; } = null!;
        public Guid SlotId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
        public decimal Price { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}