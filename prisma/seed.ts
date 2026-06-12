import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const universities = [
    "University of Lagos",
    "University of Ibadan",
    "Obafemi Awolowo University",
    "Covenant University",
    "Lagos State University",
    "University of Nigeria Nsukka",
    "Ahmadu Bello University",
    "Federal University of Technology Akure",
    "Babcock University",
    "University of Benin",
    "Nnamdi Azikiwe University",
    "Redeemer's University",
  ];

  const amenitiesPool = [
    "WiFi",
    "Security",
    "Water",
    "Electricity",
    "Parking",
    "Laundry",
    "Kitchen",
    "Study Room",
    "Air Conditioning",
    "CCTV",
  ];

  const passwordHash = await bcrypt.hash("password123", 12);

  // Create Hosts
  const hosts = [];

  for (let i = 1; i <= 5; i++) {
    const host = await prisma.user.create({
      data: {
        name: `Host ${i}`,
        email: `host${i}@uninest.com`,
        passwordHash,
        role: "HOST",
        phone: `0800000000${i}`,
        businessName: `Campus Homes ${i}`,
      },
    });

    hosts.push(host);
  }

  // Create Students
  const students = [];

  for (let i = 1; i <= 10; i++) {
    const student = await prisma.user.create({
      data: {
        name: `Student ${i}`,
        email: `student${i}@uninest.com`,
        passwordHash,
        role: "STUDENT",
        phone: `0900000000${i}`,
        university:
          universities[Math.floor(Math.random() * universities.length)],
      },
    });

    students.push(student);
  }

  // Create Listings
  const listings = [];

  for (let i = 1; i <= 20; i++) {
    const host = hosts[Math.floor(Math.random() * hosts.length)];

    const listing = await prisma.listing.create({
      data: {
        title: `Student Apartment ${i}`,
        description:
          "Comfortable and affordable student accommodation close to campus.",
        propertyType: ["SELF_CON", "HOSTEL", "APARTMENT"][
          Math.floor(Math.random() * 3)
        ],
        numberOfRooms: Math.ceil(Math.random() * 4),
        address: `${Math.ceil(Math.random() * 100)} Campus Road`,
        nearestUniversity:
          universities[Math.floor(Math.random() * universities.length)],
        distanceToCampus: `${Math.ceil(Math.random() * 15)} mins walk`,
        pricePerSemester: Math.floor(Math.random() * 400000) + 100000,
        amenities: JSON.stringify(
          amenitiesPool.sort(() => 0.5 - Math.random()).slice(0, 5),
        ),
        hostId: host.id,
      },
    });

    listings.push(listing);
  }

  // Create Bookings
  const bookings = [];

  for (let i = 1; i <= 15; i++) {
    const student = students[Math.floor(Math.random() * students.length)];

    const listing = listings[Math.floor(Math.random() * listings.length)];

    const booking = await prisma.booking.create({
      data: {
        moveInDate: new Date(),
        status: ["PENDING", "CONFIRMED", "REJECTED"][
          Math.floor(Math.random() * 3)
        ],
        paymentStatus: ["PENDING", "PAID"][Math.floor(Math.random() * 2)],
        amount: listing.pricePerSemester,
        semester: "2025/2026 First Semester",
        studentId: student.id,
        listingId: listing.id,
        hostId: listing.hostId,
      },
    });

    bookings.push(booking);
  }

  // Create Reviews
  for (let i = 1; i <= 30; i++) {
    const student = students[Math.floor(Math.random() * students.length)];

    const listing = listings[Math.floor(Math.random() * listings.length)];

    await prisma.review.create({
      data: {
        rating: Math.ceil(Math.random() * 5),
        comment: "Nice place, good environment and close to school.",
        studentId: student.id,
        listingId: listing.id,
      },
    });
  }

  // Create Conversations + Messages
  for (let i = 1; i <= 10; i++) {
    const student = students[Math.floor(Math.random() * students.length)];

    const listing = listings[Math.floor(Math.random() * listings.length)];

    const conversation = await prisma.conversation.create({
      data: {
        listingId: listing.id,
        studentId: student.id,
        hostId: listing.hostId,
      },
    });

    await prisma.message.createMany({
      data: [
        {
          body: "Hello, is this apartment still available?",
          conversationId: conversation.id,
          senderId: student.id,
        },
        {
          body: "Yes, it is available.",
          conversationId: conversation.id,
          senderId: listing.hostId,
        },
      ],
    });
  }

  console.log("✅ Database seeded successfully");
  console.log("👤 Demo password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
