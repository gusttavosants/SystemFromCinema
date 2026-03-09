import { AppDataSource } from './data-source';
import { Session } from './entities/session.entity';
import { Seat } from './entities/seat.entity';

export async function seedDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const sessionRepository = AppDataSource.getRepository(Session);
  const seatRepository = AppDataSource.getRepository(Seat);

  // Check if data already exists
  const existingSessions = await sessionRepository.find();
  if (existingSessions.length > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Create test sessions
  const now = new Date();
  const sessions = [
    {
      movieTitle: 'Avatar: The Way of Water',
      showTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      room: 'Sala 1',
      totalSeats: 20,
      price: 25.0,
      description: 'Epic sci-fi film',
    },
    {
      movieTitle: 'The Matrix Resurrections',
      showTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
      room: 'Sala 2',
      totalSeats: 20,
      price: 25.0,
      description: 'The Matrix returns',
    },
    {
      movieTitle: 'Inception',
      showTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
      room: 'Sala 3',
      totalSeats: 20,
      price: 25.0,
      description: 'A mind-bending thriller',
    },
  ];

  // Save sessions
  const savedSessions = await sessionRepository.save(
    sessions.map((s) => sessionRepository.create(s)),
  );

  console.log(`Created ${savedSessions.length} sessions`);

  // Create seats for each session
  let totalSeats = 0;
  for (const session of savedSessions) {
    const seats: Seat[] = [];
    for (let i = 1; i <= session.totalSeats; i++) {
      seats.push(
        seatRepository.create({
          sessionId: session.id,
          seatNumber: i,
          status: 'available',
        }),
      );
    }
    await seatRepository.save(seats);
    totalSeats += seats.length;
  }

  console.log(`Created ${totalSeats} seats`);
  console.log('Database seeding completed successfully!');
}

// Run seed if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
