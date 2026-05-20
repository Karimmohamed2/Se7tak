namespace Se7atk.Models
{
    public class Payment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AppointmentId { get; set; }
        public decimal Amount { get; set; }
        public string? Method { get; set; }
        public PaymentStatus Status { get; set; }  
        public DateTime? PaidAt { get; set; }

        // Navigation
        public Appointment Appointment { get; set; } = null!;
    }

    public enum PaymentStatus
    {
        Pending = 1,
        Paid = 2,
        Failed = 3,
        Refunded = 4
    }
}
