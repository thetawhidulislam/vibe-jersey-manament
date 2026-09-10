import { prisma } from "@/lib/prisma";

export async function getSettlementSummary() {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const [collected, deposited] = await Promise.all([
    prisma.order.groupBy({ by: ["assignedToId"], where: { returnedAt: null }, _sum: { total: true } }),
    prisma.deposit.groupBy({ by: ["memberId"], _sum: { amount: true } }),
  ]);
  const collectedByMember = new Map(collected.map((entry) => [entry.assignedToId, Number(entry._sum.total ?? 0)]));
  const depositedByMember = new Map(deposited.map((entry) => [entry.memberId, Number(entry._sum.amount ?? 0)]));
  return members.map((member) => {
    const totalCollected = collectedByMember.get(member.id) ?? 0;
    const totalDeposited = depositedByMember.get(member.id) ?? 0;
    return { ...member, totalCollected, totalDeposited, currentBalance: totalCollected - totalDeposited };
  });
}