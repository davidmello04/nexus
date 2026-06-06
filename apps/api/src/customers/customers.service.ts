import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddressType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCustomerDto,
  CustomerAddressDto,
} from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createCustomerDto: CreateCustomerDto) {
    const { address, ...customerData } = createCustomerDto;
    const addressData = this.getAddressData(address);

    return this.prisma.customer.create({
      data: {
        ...customerData,
        addresses: addressData
          ? {
              create: {
                ...addressData,
                type: AddressType.MAIN,
                isDefault: true,
              },
            }
          : undefined,
      },
      include: {
        addresses: true,
      },
    });
  }

  findAll() {
    return this.prisma.customer.findMany({
      include: {
        addresses: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);
    const { address, ...customerData } = updateCustomerDto;

    return this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: customerData,
      });

      if (address !== undefined) {
        const addressData = this.getAddressData(address) ?? {};
        const existingAddress = await tx.address.findFirst({
          where: {
            customerId: id,
            type: AddressType.MAIN,
            isDefault: true,
          },
          select: {
            id: true,
          },
        });

        if (existingAddress) {
          await tx.address.update({
            where: {
              id: existingAddress.id,
            },
            data: {
              ...addressData,
              type: AddressType.MAIN,
              isDefault: true,
            },
          });
        } else {
          await tx.address.create({
            data: {
              ...addressData,
              customerId: id,
              type: AddressType.MAIN,
              isDefault: true,
            },
          });
        }
      }

      return tx.customer.findUniqueOrThrow({
        where: { id },
        include: {
          addresses: true,
        },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const ordersCount = await this.prisma.order.count({
      where: {
        customerId: id,
      },
    });

    if (ordersCount > 0) {
      throw new BadRequestException(
        'Este cliente possui pedidos vinculados e não pode ser excluído.',
      );
    }

    return this.prisma.customer.delete({
      where: { id },
    });
  }

  private getAddressData(address?: CustomerAddressDto) {
    if (!address) {
      return undefined;
    }

    const addressData = {
      zipCode: this.optionalString(address.zipCode),
      street: this.optionalString(address.street),
      number: this.optionalString(address.number),
      neighborhood: this.optionalString(address.neighborhood),
      city: this.optionalString(address.city),
      state: this.optionalString(address.state),
      complement: this.optionalString(address.complement),
      reference: this.optionalString(address.reference),
    };
    const hasFilledField = Object.values(addressData).some(
      (value) => value !== undefined,
    );

    return hasFilledField ? addressData : undefined;
  }

  private optionalString(value?: string) {
    if (!value?.trim()) {
      return undefined;
    }

    return value.trim();
  }
}
