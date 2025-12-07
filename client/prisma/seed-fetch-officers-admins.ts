import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed script to fetch all users with officer and admin roles
 * 
 * This script queries the database and displays all accounts with:
 * - role: 'officer'
 * - role: 'admin'
 */

interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  officerRole: string | null;
  adminRole: string | null;
  department: string | null;
  employeeId: string | null;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  complaintsCount: number;
  assignedComplaints: number;
  resolvedComplaints: number;
}

async function fetchOfficersAndAdmins() {
  console.log("🔍 Fetching all officers and admins...\n");

  try {
    // Fetch all officers
    const officers = await prisma.account.findMany({
      where: {
        role: UserRole.officer,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        officerRole: true,
        adminRole: true,
        department: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        complaintsCount: true,
        assignedComplaints: true,
        resolvedComplaints: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });

    // Fetch all admins
    const admins = await prisma.account.findMany({
      where: {
        role: UserRole.admin,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        officerRole: true,
        adminRole: true,
        department: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        complaintsCount: true,
        assignedComplaints: true,
        resolvedComplaints: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });

    // Display results
    console.log("=".repeat(80));
    console.log("📊 OFFICERS");
    console.log("=".repeat(80));
    console.log(`Total Officers: ${officers.length}\n`);

    if (officers.length === 0) {
      console.log("   No officers found in the database.\n");
    } else {
      officers.forEach((officer, index) => {
        console.log(`${index + 1}. ${officer.fullName}`);
        console.log(`   📧 Email: ${officer.email}`);
        console.log(`   🆔 ID: ${officer.id}`);
        console.log(`   👤 Employee ID: ${officer.employeeId || "N/A"}`);
        console.log(`   🏢 Department: ${officer.department || "N/A"}`);
        console.log(`   🎭 Officer Role: ${officer.officerRole || "N/A"}`);
        console.log(`   ✅ Active: ${officer.isActive ? "Yes" : "No"}`);
        console.log(`   📈 Complaints Count: ${officer.complaintsCount}`);
        console.log(`   📋 Assigned Complaints: ${officer.assignedComplaints}`);
        console.log(`   ✅ Resolved Complaints: ${officer.resolvedComplaints}`);
        console.log(`   📅 Created: ${officer.createdAt.toLocaleDateString()}`);
        console.log(`   🔐 Last Login: ${officer.lastLoginAt ? officer.lastLoginAt.toLocaleDateString() : "Never"}`);
        console.log("");
      });
    }

    console.log("=".repeat(80));
    console.log("👑 ADMINS");
    console.log("=".repeat(80));
    console.log(`Total Admins: ${admins.length}\n`);

    if (admins.length === 0) {
      console.log("   No admins found in the database.\n");
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.fullName}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   🆔 ID: ${admin.id}`);
        console.log(`   👤 Employee ID: ${admin.employeeId || "N/A"}`);
        console.log(`   🏢 Department: ${admin.department || "N/A"}`);
        console.log(`   🎭 Admin Role: ${admin.adminRole || "N/A"}`);
        console.log(`   ✅ Active: ${admin.isActive ? "Yes" : "No"}`);
        console.log(`   📈 Complaints Count: ${admin.complaintsCount}`);
        console.log(`   📋 Assigned Complaints: ${admin.assignedComplaints}`);
        console.log(`   ✅ Resolved Complaints: ${admin.resolvedComplaints}`);
        console.log(`   📅 Created: ${admin.createdAt.toLocaleDateString()}`);
        console.log(`   🔐 Last Login: ${admin.lastLoginAt ? admin.lastLoginAt.toLocaleDateString() : "Never"}`);
        console.log("");
      });
    }

    // Summary
    console.log("=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total Officers: ${officers.length}`);
    console.log(`Total Admins: ${admins.length}`);
    console.log(`Total Staff (Officers + Admins): ${officers.length + admins.length}`);
    console.log("=".repeat(80));

    // Return the data for potential programmatic use
    return {
      officers,
      admins,
      total: officers.length + admins.length,
    };
  } catch (error) {
    console.error("❌ Error fetching officers and admins:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fetch function
fetchOfficersAndAdmins()
  .then((result) => {
    console.log("\n✅ Script completed successfully!");
    console.log(`   Found ${result.officers.length} officers and ${result.admins.length} admins`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });

