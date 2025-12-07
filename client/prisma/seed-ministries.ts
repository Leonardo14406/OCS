import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed script to associate ministries with users based on email and ministry codes
 * 
 * Maps:
 * - emmanuelleosamuel2003@gmail.com -> MOAFS
 * - baimbaemmanuel2003@gmail.com -> MOD
 * - edemby757@gmail.com -> MOE
 * - leonardeuler64@gmail.com -> MOECC
 */

interface UserMinistryMapping {
  email: string;
  ministryCode: string;
}

const userMinistryMappings: UserMinistryMapping[] = [
  { email: "emmanuelleosamuel2003@gmail.com", ministryCode: "MOAFS" },
  { email: "baimbaemmanuel2003@gmail.com", ministryCode: "MOD" },
  { email: "edemby757@gmail.com", ministryCode: "MOE" },
  { email: "leonardeuler64@gmail.com", ministryCode: "MOECC" },
];

async function seedMinistriesToUsers() {
  console.log("🌱 Starting ministry seeding process...\n");

  try {
    for (const mapping of userMinistryMappings) {
      const { email, ministryCode } = mapping;

      console.log(`📧 Processing: ${email} -> ${ministryCode}`);

      // Find the ministry by code
      const ministry = await prisma.ministry.findUnique({
        where: { code: ministryCode },
      });

      if (!ministry) {
        console.error(`❌ Ministry with code "${ministryCode}" not found in database`);
        console.log(`   Please ensure the ministry exists before running this script.`);
        continue;
      }

      console.log(`   ✓ Found ministry: ${ministry.name} (${ministry.code})`);

      // Find the user by email
      const user = await prisma.account.findUnique({
        where: { email },
      });

      if (!user) {
        console.error(`❌ User with email "${email}" not found in database`);
        console.log(`   Please ensure the user account exists before running this script.`);
        continue;
      }

      console.log(`   ✓ Found user: ${user.fullName} (${user.email})`);

      // Update the user's department field with the ministry name
      const updatedUser = await prisma.account.update({
        where: { email },
        data: {
          department: ministry.name,
        },
      });

      console.log(`   ✅ Successfully associated ministry "${ministry.name}" with user "${user.fullName}"`);
      console.log(`   📝 Updated department field: ${updatedUser.department}\n`);
    }

    console.log("✨ Ministry seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedMinistriesToUsers()
  .then(() => {
    console.log("\n🎉 Seed script finished!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed script failed:", error);
    process.exit(1);
  });

