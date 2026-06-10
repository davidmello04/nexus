import { Prisma } from '@prisma/client';

export const orderInclude = {
  customer: true,
  items: {
    include: {
      product: true,
      productVariant: true,
    },
  },
} satisfies Prisma.OrderInclude;
