using Microsoft.EntityFrameworkCore;
using Se7atk.Dtos;
using Se7atk.Models;

namespace Se7atk.Services
{
    public interface IBookingService
    {
        Task<BookingResponse> BookAppointmentAsync(Guid patientId, BookingRequest request);
        Task<List<AppointmentListDto>> GetPatientAppointmentsAsync(Guid patientId);
        Task<List<AppointmentListDto>> GetDoctorAppointmentsAsync(Guid doctorId);
        Task<bool> CancelAppointmentAsync(Guid appointmentId, Guid userId);
        Task<AppointmentDetailDto?> GetAppointmentByIdAsync(Guid id);
    }

    public class BookingService : IBookingService
    {
        private readonly Se7atkDbContext _context;

        public BookingService(Se7atkDbContext context)
        {
            _context = context;
        }

        // ── Book ─────────────────────────────────────────────
        public async Task<BookingResponse> BookAppointmentAsync(
            Guid patientId, BookingRequest request)
        {
            var slot = await _context.AvailabilitySlots
                .Include(s => s.Doctor)
                .ThenInclude(d => d.Specialty)
                .FirstOrDefaultAsync(s => s.Id == request.SlotId);

            if (slot == null)
                return new BookingResponse { Message = "الموعد غير موجود" };

            var existingBooking = await _context.Appointments
                .AnyAsync(a => a.SlotId == request.SlotId
                            && a.Status != AppointmentStatus.Cancelled);

            if (existingBooking)
                return new BookingResponse { Message = "الموعد محجوز بالفعل" };

            var patient = await _context.PatientProfiles
                .FirstOrDefaultAsync(p => p.Id == patientId);

            if (patient == null)
                return new BookingResponse { Message = "لم يتم العثور على ملف المريض" };

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                PatientId = patientId,
                DoctorId = slot.DoctorId,
                SlotId = request.SlotId,
                Status = AppointmentStatus.Pending,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return new BookingResponse
            {
                AppointmentId = appointment.Id,
                Status = appointment.Status.ToString(),
                Message = "تم الحجز بنجاح! في انتظار تأكيد الطبيب"
            };
        }

        // ── Patient Appointments ──────────────────────────────
        public async Task<List<AppointmentListDto>> GetPatientAppointmentsAsync(Guid patientId)
        {
            var appointments = await _context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.User)
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.Specialty)
                .Include(a => a.Slot)
                .Where(a => a.PatientId == patientId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return appointments.Select(a => new AppointmentListDto
            {
                Id = a.Id,
                DoctorName = a.Doctor.User.FullName,
                Specialty = a.Doctor.Specialty.NameAr,
                StartTime = a.Slot.StartTime,
                EndTime = a.Slot.EndTime,
                Status = a.Status.ToString(),
                Notes = a.Notes,
                Price = a.Doctor.Price,
                CreatedAt = a.CreatedAt
            }).ToList();
        }

        // ── Doctor Appointments ───────────────────────────────
        public async Task<List<AppointmentListDto>> GetDoctorAppointmentsAsync(Guid doctorId)
        {
            var appointments = await _context.Appointments
                .Include(a => a.Patient)
                    .ThenInclude(p => p.User)
                .Include(a => a.Doctor)          // ← كان ناقص
                    .ThenInclude(d => d.User)    // ← كان ناقص
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.Specialty)
                .Include(a => a.Slot)
                .Where(a => a.DoctorId == doctorId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return appointments.Select(a => new AppointmentListDto
            {
                Id = a.Id,
                DoctorName = a.Doctor.User.FullName,
                PatientName = a.Patient.User.FullName,
                Specialty = a.Doctor.Specialty.NameAr,
                StartTime = a.Slot.StartTime,
                EndTime = a.Slot.EndTime,
                Status = a.Status.ToString(),
                Notes = a.Notes,
                Price = a.Doctor.Price,
                CreatedAt = a.CreatedAt
            }).ToList();
        }

        // ── Cancel ───────────────────────────────────────────
        public async Task<bool> CancelAppointmentAsync(Guid appointmentId, Guid userId)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == appointmentId);

            if (appointment == null) return false;

            if (appointment.PatientId != userId && appointment.DoctorId != userId)
                return false;

            if (appointment.Status == AppointmentStatus.Completed)
                return false;

            appointment.Status = AppointmentStatus.Cancelled;
            await _context.SaveChangesAsync();
            return true;
        }

        // ── Get By Id ────────────────────────────────────────
        public async Task<AppointmentDetailDto?> GetAppointmentByIdAsync(Guid id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.User)
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.Specialty)
                .Include(a => a.Patient)
                    .ThenInclude(p => p.User)
                .Include(a => a.Slot)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null) return null;

            return new AppointmentDetailDto
            {
                Id = appointment.Id,
                PatientId = appointment.PatientId,
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.Doctor.User.FullName,
                PatientName = appointment.Patient.User.FullName,
                Specialty = appointment.Doctor.Specialty.NameAr,
                SlotId = appointment.SlotId,
                StartTime = appointment.Slot.StartTime,
                EndTime = appointment.Slot.EndTime,
                Status = appointment.Status.ToString(),
                Notes = appointment.Notes,
                Price = appointment.Doctor.Price,
                CreatedAt = appointment.CreatedAt
            };
        }
    }
}