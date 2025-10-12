import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.orderAudit.deleteMany(),
    prisma.riskHit.deleteMany(),
    prisma.walletLedger.deleteMany(),
    prisma.payout.deleteMany(),
    prisma.kycCase.deleteMany(),
    prisma.order.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const [alice, bob, carol] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: 'alice.chan@example.com',
        name: 'Alice Chan',
        phone: '13800000001',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob.li@example.com',
        name: 'Bob Li',
        phone: '13900000002',
      },
    }),
    prisma.user.create({
      data: {
        email: 'carol.wang@example.com',
        name: 'Carol Wang',
        phone: '13700000003',
      },
    }),
  ]);

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-202501-0001',
      status: 'PENDING',
      amount: new Prisma.Decimal('199.90'),
      currency: 'CNY',
      userId: alice.id,
      riskHits: {
        create: [
          {
            ruleCode: 'ADDR_MISMATCH',
            severity: 'MEDIUM',
            message: 'Shipping address differs from billing address',
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-202501-0002',
      status: 'APPROVED',
      amount: new Prisma.Decimal('520.00'),
      currency: 'CNY',
      userId: bob.id,
    },
  });

  await prisma.orderAudit.createMany({
    data: [
      {
        orderId: order1.id,
        reviewerId: carol.id,
        status: 'PENDING',
        note: 'Awaiting additional documents',
      },
      {
        orderId: order2.id,
        reviewerId: carol.id,
        status: 'APPROVED',
        note: 'Auto-approved via policy',
      },
    ],
  });

  await prisma.walletLedger.createMany({
    data: [
      {
        userId: alice.id,
        type: 'CREDIT',
        amount: new Prisma.Decimal('1000.00'),
        balanceAfter: new Prisma.Decimal('1000.00'),
        reference: 'INITIAL_TOPUP',
      },
      {
        userId: alice.id,
        type: 'DEBIT',
        amount: new Prisma.Decimal('199.90'),
        balanceAfter: new Prisma.Decimal('800.10'),
        reference: order1.orderNumber,
      },
    ],
  });

  await prisma.payout.create({
    data: {
      userId: bob.id,
      amount: new Prisma.Decimal('320.00'),
      status: 'PROCESSING',
    },
  });

  await prisma.kycCase.create({
    data: {
      userId: carol.id,
      status: 'REVIEW',
      riskScore: 72,
    },
  });

  // Return created entities for optional debugging
  return { alice, bob, carol, order1, order2 };
}

main()
  .then((data) => {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log('Database seeded successfully', data);
    }
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to seed database', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
