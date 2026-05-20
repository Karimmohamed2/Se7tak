namespace Se7atk.Models
{
    public class Appointment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public Guid SlotId { get; set; }
        public AppointmentStatus Status { get; set; }  
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }

        public PatientProfile Patient { get; set; } = null!;
        public DoctorProfile Doctor { get; set; } = null!;
        public AvailabilitySlot Slot { get; set; } = null!;
        public Review? Review { get; set; }
        public Payment? Payment { get; set; }
    }

    public enum AppointmentStatus
    {
        Pending = 1,
        Confirmed = 2,
        Cancelled = 3,
        Completed = 4
    }
}
