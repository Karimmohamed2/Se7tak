namespace Se7atk.Models
{
    public class Review
    {
        public Guid Id { get; set; }
        public Guid AppointmentId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation
        public Appointment Appointment { get; set; } = null!;
    }
}
