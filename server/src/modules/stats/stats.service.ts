import { prisma } from "../../lib/prisma";

export async function getDashboardStats() {
  const [niches, products, orders, paidOrders, revenue, recentOrders] =
    await Promise.all([
      prisma.niche.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: true },
      }),
    ]);

  return {
    niches,
    products,
    orders,
    paidOrders,
    revenue: revenue._sum.total ?? 0,
    recentOrders,
  };
}
