const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data...");

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", description: "Administrator" },
  });

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { email: "admin@rightway.com" },
    update: {},
    create: {
      email: "admin@rightway.com",
      fullName: "Super Admin",
      passwordHash: adminPassword,
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  const companies = [
    { name: "Phương Trang", logo: "phuongtrang.jpg", rating: 4.8 },
    { name: "Thành Bưởi", logo: "thanhbuoi.jpg", rating: 4.5 },
    { name: "Hạnh Cafe", logo: "hanhcafe.jpg", rating: 4.2 },
    { name: "Thaco", logo: "thaco.jpg", rating: 4.0 },
  ];

  const createdCompanies = [];
  for (const c of companies) {
    const comp = await prisma.busCompany.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    createdCompanies.push(comp);
  }

  for (const comp of createdCompanies) {
    await prisma.bus.create({
      data: {
        name: `Bus ${comp.name} 01`,
        type: "Giường nằm 40 chỗ",
        totalSeats: 40,
        companyId: comp.id,
      },
    });
  }

  const routeNames = [
    { origin: "Hà Nội", destination: "Đà Nẵng", distance: 766 },
    { origin: "TP.HCM", destination: "Đà Lạt", distance: 300 },
    { origin: "Hà Nội", destination: "Sapa", distance: 320 },
    { origin: "Đà Nẵng", destination: "Huế", distance: 100 },
    { origin: "TP.HCM", destination: "Nha Trang", distance: 430 },
  ];

  for (const r of routeNames) {
    await prisma.route.upsert({
      where: { origin_destination: { origin: r.origin, destination: r.destination } },
      update: {},
      create: r,
    });
  }

  await prisma.promotion.createMany({
    data: [
      { title: "Giảm 50% vé mới", discount: 50, isActive: true },
      { title: "Ưu đãi sinh viên", discount: 20, isActive: true },
      { title: "Đặt sớm giảm 10%", discount: 10, isActive: true },
      { title: "Khuyến mãi Tết", discount: 30, isActive: true },
    ],
  });

  await prisma.news.createMany({
    data: [
      { title: "Khai trương tuyến mới", isPublished: true },
      { title: "Cập nhật giá vé 2024", isPublished: true },
      { title: "Hướng dẫn đặt vé online", isPublished: true },
      { title: "An toàn mùa dịch", isPublished: true },
    ],
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
