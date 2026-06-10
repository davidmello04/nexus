import { Prisma } from '@prisma/client';

export const orderInclude = {
  customer: true,
  quote: {
    select: {
      id: true,
      code: true,
    },
  },
  items: {
    include: {
      product: true,
      productVariant: true,
    },
  },
} satisfies Prisma.OrderInclude;
