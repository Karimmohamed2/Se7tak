using Microsoft.EntityFrameworkCore;

namespace Se7atk.Models
{
   
    
        public class Se7atkDbContext : DbContext
        {
            public Se7atkDbContext(DbContextOptions<Se7atkDbContext> options) : base(options) { }

            // IDENTITY
            public DbSet<User> Users => Set<User>();

            // LOCATION
            public DbSet<Governorate> Governorates => Set<Governorate>();
            public DbSet<City> Cities => Set<City>();

            // USERS
            public DbSet<DoctorProfile> DoctorProfiles => Set<DoctorProfile>();
            public DbSet<PatientProfile> PatientProfiles => Set<PatientProfile>();
            public DbSet<Specialty> Specialties => Set<Specialty>();

            // BOOKING
            public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
            public DbSet<Appointment> Appointments => Set<Appointment>();
            public DbSet<Review> Reviews => Set<Review>();

            // PAYMENTS
            public DbSet<Payment> Payments => Set<Payment>();
           

            // PHARMACY
            public DbSet<Pharmacy> Pharmacies => Set<Pharmacy>();
            public DbSet<PharmacyReview> PharmacyReviews => Set<PharmacyReview>();
            public DbSet<Medicine> Medicines => Set<Medicine>();
            public DbSet<PharmacyInventory> PharmacyInventory => Set<PharmacyInventory>();

            protected override void OnModelCreating(ModelBuilder mb)
            {
                // ── User ──────────────────────────────────────
                mb.Entity<User>(e =>
                {
                    e.HasKey(x => x.Id);
                    e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
                    e.Property(x => x.Email).HasMaxLength(256).IsRequired();
                    e.HasIndex(x => x.Email).IsUnique();
                    e.Property(x => x.Phone).HasMaxLength(20);

                   
                    e.Property(x => x.Role)
                     .HasConversion<string>();
                });

                // ── DoctorProfile ─────────────────────────────
                mb.Entity<DoctorProfile>(e =>
                {
                    e.HasKey(x => x.Id);

                    e.HasOne(x => x.User)
                     .WithOne(u => u.DoctorProfile)
                     .HasForeignKey<DoctorProfile>(x => x.Id)
                     .OnDelete(DeleteBehavior.Cascade);

                    e.Property(x => x.Price).HasColumnType("decimal(18,2)");
                    e.Property(x => x.Latitude).HasColumnType("decimal(10,8)");
                    e.Property(x => x.Longitude).HasColumnType("decimal(11,8)");

                    e.HasOne(x => x.Specialty)
                     .WithMany(s => s.DoctorProfiles)
                     .HasForeignKey(x => x.SpecialtyId)
                     .OnDelete(DeleteBehavior.Restrict);

                    e.HasOne(x => x.City)
                     .WithMany(c => c.DoctorProfiles)
                     .HasForeignKey(x => x.CityId)
                     .OnDelete(DeleteBehavior.SetNull);
                });

                // ── PatientProfile ────────────────────────────
                mb.Entity<PatientProfile>(e =>
                {
                    e.HasKey(x => x.Id);

                    e.HasOne(x => x.User)
                     .WithOne(u => u.PatientProfile)
                     .HasForeignKey<PatientProfile>(x => x.Id)
                     .OnDelete(DeleteBehavior.Cascade);

                    e.Property(x => x.BloodType).HasMaxLength(5);
                    e.Property(x => x.EmergencyPhone).HasMaxLength(20);

                    e.HasOne(x => x.City)
                     .WithMany(c => c.PatientProfiles)
                     .HasForeignKey(x => x.CityId)
                     .OnDelete(DeleteBehavior.SetNull);
                });

                // ── City ──────────────────────────────────────
                mb.Entity<City>(e =>
                {
                    e.HasOne(x => x.Governorate)
                     .WithMany(g => g.Cities)
                     .HasForeignKey(x => x.GovernorateId)
                     .OnDelete(DeleteBehavior.Restrict);
                });

                // ── Appointment ───────────────────────────────
                mb.Entity<Appointment>(e =>
                {
                    // بدل العلاقة مع AppointmentStatus
                    e.Property(x => x.Status)
                     .HasConversion<string>();

                    e.HasOne(x => x.Patient)
                     .WithMany(p => p.Appointments)
                     .HasForeignKey(x => x.PatientId)
                     .OnDelete(DeleteBehavior.Restrict);

                    e.HasOne(x => x.Doctor)
                     .WithMany()
                     .HasForeignKey(x => x.DoctorId)
                     .OnDelete(DeleteBehavior.Restrict);

                    e.HasOne(x => x.Slot)
                     .WithMany(s => s.Appointments)
                     .HasForeignKey(x => x.SlotId)
                     .OnDelete(DeleteBehavior.Restrict);

                    // شيلنا علاقة Status لأنها بقت Enum
                });

                // ── Review ────────────────────────────────────
                mb.Entity<Review>(e =>
                {
                    e.HasOne(x => x.Appointment)
                     .WithOne(a => a.Review)
                     .HasForeignKey<Review>(x => x.AppointmentId)
                     .OnDelete(DeleteBehavior.Cascade);
                });

                // ── Payment ───────────────────────────────────
                mb.Entity<Payment>(e =>
                {
                    e.Property(x => x.Amount).HasColumnType("decimal(18,2)");
                    e.Property(x => x.Method).HasMaxLength(50);

                    
                    e.Property(x => x.Status)
                     .HasConversion<string>();

                    e.HasOne(x => x.Appointment)
                     .WithOne(a => a.Payment)
                     .HasForeignKey<Payment>(x => x.AppointmentId)
                     .OnDelete(DeleteBehavior.Cascade);

                    //  شيلنا علاقة Status لأنها بقت Enum
                });

                // ── Pharmacy ──────────────────────────────────
                mb.Entity<Pharmacy>(e =>
                {
                    e.Property(x => x.Latitude).HasColumnType("decimal(10,8)");
                    e.Property(x => x.Longitude).HasColumnType("decimal(11,8)");

                    e.HasOne(x => x.City)
                     .WithMany(c => c.Pharmacies)
                     .HasForeignKey(x => x.CityId)
                     .OnDelete(DeleteBehavior.SetNull);
                });

                // ── PharmacyInventory ─────────────────────────
                mb.Entity<PharmacyInventory>(e =>
                {
                    e.Property(x => x.Price).HasColumnType("decimal(18,2)");

                    e.HasOne(x => x.Pharmacy)
                     .WithMany(p => p.Inventory)
                     .HasForeignKey(x => x.PharmacyId)
                     .OnDelete(DeleteBehavior.Cascade);

                    e.HasOne(x => x.Medicine)
                     .WithMany(m => m.Inventory)
                     .HasForeignKey(x => x.MedicineId)
                     .OnDelete(DeleteBehavior.Cascade);

                    e.HasIndex(x => new { x.PharmacyId, x.MedicineId }).IsUnique();
                });

                // ── PharmacyReview ────────────────────────────
                mb.Entity<PharmacyReview>(e =>
                {
                    e.HasOne(x => x.Patient)
                     .WithMany(p => p.PharmacyReviews)
                     .HasForeignKey(x => x.PatientId)
                     .OnDelete(DeleteBehavior.Restrict);

                    e.HasOne(x => x.Pharmacy)
                     .WithMany(p => p.Reviews)
                     .HasForeignKey(x => x.PharmacyId)
                     .OnDelete(DeleteBehavior.Cascade);
                });
            }
        }
    
}
