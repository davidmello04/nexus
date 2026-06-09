import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CompanySettings, Prisma } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItemDto } from './dto/order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

type PdfOrderItem = {
  product?: { name: string } | null;
  productVariant?: {
    size?: string | null;
    color?: string | null;
    type?: string | null;
    material?: string | null;
  } | null;
  quantity: number;
  unitPrice: Prisma.Decimal | number;
  total: Prisma.Decimal | number;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly companySettingsService: CompanySettingsService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    await this.ensureCustomerExists(createOrderDto.customerId);
    this.ensureItems(createOrderDto.items);

    const totals = await this.calculateTotals(
      createOrderDto.customerId,
      createOrderDto.items,
      createOrderDto.discount,
    );

    return this.prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,
        status: createOrderDto.status,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        notes: createOrderDto.notes,
        items: {
          create: totals.items,
        },
      },
      include: this.orderInclude,
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      include: this.orderInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    return order;
  }

  async generatePdf(id: string) {
    const order = await this.findOne(id);
    const companySettings = await this.companySettingsService.findFirst();
    const document = new PDFDocument({
      margin: 48,
      size: 'A4',
    });
    const chunks: Buffer[] = [];

    document.on('data', (chunk: Buffer) => chunks.push(chunk));

    const finished = new Promise<Buffer>((resolve) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.drawPdfHeader(document, `Pedido #${order.code}`, companySettings);

    document
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, {
        align: 'right',
      })
      .moveDown(1.5);

    document
      .fontSize(12)
      .fillColor('#0f172a')
      .text('Dados do pedido')
      .moveDown(0.5);

    document
      .fontSize(10)
      .fillColor('#334155')
      .text(`Cliente: ${order.customer?.name ?? '-'}`)
      .text(`Status: ${this.getStatusLabel(order.status)}`)
      .text(`Data do pedido: ${order.createdAt.toLocaleString('pt-BR')}`)
      .moveDown(1);

    this.drawItemsTable(document, order.items);

    document.moveDown(1);
    this.drawTotals(document, {
      subtotal: this.toNumber(order.subtotal),
      discount: this.toNumber(order.discount),
      total: this.toNumber(order.total),
    });

    if (order.notes) {
      document.moveDown(1.5);
      document
        .fontSize(12)
        .fillColor('#0f172a')
        .text('Observações')
        .moveDown(0.5)
        .fontSize(10)
        .fillColor('#334155')
        .text(order.notes, {
          lineGap: 3,
        });
    }

    document.end();

    return {
      buffer: await finished,
      filename: `pedido-${order.code}.pdf`,
    };
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const currentOrder = await this.findOne(id);

    if (updateOrderDto.items) {
      this.ensureItems(updateOrderDto.items);

      return this.prisma.$transaction(async (tx) => {
        const totals = await this.calculateTotals(
          currentOrder.customerId,
          updateOrderDto.items ?? [],
          updateOrderDto.discount ?? this.toNumber(currentOrder.discount),
        );

        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        await tx.order.update({
          where: { id },
          data: {
            status: updateOrderDto.status,
            subtotal: totals.subtotal,
            discount: totals.discount,
            total: totals.total,
            notes: updateOrderDto.notes,
            items: {
              create: totals.items,
            },
          },
        });

        return tx.order.findUniqueOrThrow({
          where: { id },
          include: this.orderInclude,
        });
      });
    }

    const subtotal = this.toNumber(currentOrder.subtotal);
    const discount =
      updateOrderDto.discount !== undefined
        ? updateOrderDto.discount
        : this.toNumber(currentOrder.discount);

    this.ensureDiscountIsValid(subtotal, discount);

    return this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderDto.status,
        discount,
        total: subtotal - discount,
        notes: updateOrderDto.notes,
      },
      include: this.orderInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.order.delete({
      where: { id },
    });
  }

  private async ensureCustomerExists(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }
  }

  private ensureItems(items?: OrderItemDto[]) {
    if (!items?.length) {
      throw new BadRequestException('Pedido deve ter pelo menos um item.');
    }
  }

  private async calculateTotals(
    customerId: string,
    items: OrderItemDto[],
    discount = 0,
  ) {
    const calculatedItems = await Promise.all(
      items.map(async (item) => {
        const resolvedPrice = await this.pricingService.resolvePrice(
          customerId,
          item.productId,
          item.productVariantId,
        );
        const unitPrice = this.toNumber(resolvedPrice.price);
        const total = unitPrice * item.quantity;

        return {
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          unitPrice,
          total,
          notes: item.notes,
        };
      }),
    );
    const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);

    this.ensureDiscountIsValid(subtotal, discount);

    return {
      items: calculatedItems,
      subtotal,
      discount,
      total: subtotal - discount,
    };
  }

  private ensureDiscountIsValid(subtotal: number, discount: number) {
    if (discount > subtotal) {
      throw new BadRequestException('Desconto não pode ser maior que subtotal.');
    }
  }

  private toNumber(value: Prisma.Decimal | number) {
    return Number(value);
  }

  private drawPdfHeader(
    document: PDFKit.PDFDocument,
    title: string,
    companySettings: CompanySettings | null,
  ) {
    const contentWidth = companySettings?.logoUrl ? 380 : 496;
    const companyName = companySettings?.name || 'Nexus';
    const contactInfo = companySettings
      ? [companySettings.phone, companySettings.whatsapp]
          .filter(Boolean)
          .join(' / ')
      : 'Gestão de pedidos';
    const secondaryInfo = companySettings
      ? [
          companySettings.instagram,
          companySettings.address,
          companySettings.document
            ? `Documento: ${companySettings.document}`
            : undefined,
        ]
          .filter(Boolean)
          .join(' | ')
      : '';

    document
      .rect(0, 0, document.page.width, 118)
      .fill('#0f172a')
      .fillColor('#ffffff')
      .fontSize(22)
      .text(title, 48, 34)
      .fontSize(10)
      .fillColor('#cbd5e1')
      .text(companyName, 48, 62)
      .text(contactInfo, 48, 76, {
        width: contentWidth,
      });

    if (secondaryInfo) {
      document.fillColor('#cbd5e1').text(secondaryInfo, 48, 90, {
        width: contentWidth,
        ellipsis: true,
      });
    }

    this.drawCompanyLogo(document, companySettings?.logoUrl);

    document.y = 140;
  }

  private drawCompanyLogo(
    document: PDFKit.PDFDocument,
    logoUrl?: string | null,
  ) {
    if (!logoUrl) {
      return;
    }

    const logoPath = this.getLocalUploadPath(logoUrl);

    if (!logoPath || !existsSync(logoPath)) {
      return;
    }

    try {
      document.image(logoPath, 460, 28, {
        fit: [84, 58],
        align: 'right',
        valign: 'center',
      });
    } catch {
      return;
    }
  }

  private getLocalUploadPath(url: string) {
    const uploadPath = url.replace(/^\/uploads\//, '');

    if (!uploadPath || uploadPath === url) {
      return '';
    }

    return join(process.cwd(), 'uploads', uploadPath);
  }

  private drawItemsTable(document: PDFKit.PDFDocument, items: PdfOrderItem[]) {
    const columns = {
      product: 48,
      variant: 188,
      quantity: 310,
      unitPrice: 370,
      total: 460,
    };
    const rowHeight = 28;

    document.fontSize(12).fillColor('#0f172a').text('Itens do pedido');
    document.moveDown(0.75);

    this.drawTableHeader(document, columns);

    items.forEach((item) => {
      if (document.y > 720) {
        document.addPage();
        this.drawTableHeader(document, columns);
      }

      const rowY = document.y;

      document
        .fontSize(9)
        .fillColor('#334155')
        .text(item.product?.name ?? '-', columns.product, rowY, {
          width: 128,
        })
        .text(this.formatVariant(item), columns.variant, rowY, {
          width: 110,
        })
        .text(String(item.quantity), columns.quantity, rowY, {
          width: 45,
          align: 'right',
        })
        .text(this.formatCurrency(this.toNumber(item.unitPrice)), columns.unitPrice, rowY, {
          width: 74,
          align: 'right',
        })
        .text(this.formatCurrency(this.toNumber(item.total)), columns.total, rowY, {
          width: 74,
          align: 'right',
        });

      document
        .moveTo(48, rowY + rowHeight - 8)
        .lineTo(544, rowY + rowHeight - 8)
        .strokeColor('#e2e8f0')
        .stroke();
      document.y = rowY + rowHeight;
    });
  }

  private drawTableHeader(
    document: PDFKit.PDFDocument,
    columns: {
      product: number;
      variant: number;
      quantity: number;
      unitPrice: number;
      total: number;
    },
  ) {
    const headerY = document.y;

    document
      .rect(48, headerY - 6, 496, 24)
      .fill('#f1f5f9')
      .fontSize(9)
      .fillColor('#0f172a')
      .text('Produto', columns.product, headerY, { width: 128 })
      .text('Variação', columns.variant, headerY, { width: 110 })
      .text('Qtd.', columns.quantity, headerY, { width: 45, align: 'right' })
      .text('Valor unit.', columns.unitPrice, headerY, {
        width: 74,
        align: 'right',
      })
      .text('Total', columns.total, headerY, { width: 74, align: 'right' });

    document.y = headerY + 28;
  }

  private drawTotals(
    document: PDFKit.PDFDocument,
    totals: {
      subtotal: number;
      discount: number;
      total: number;
    },
  ) {
    const labelX = 360;
    const valueX = 456;

    document
      .fontSize(10)
      .fillColor('#475569')
      .text('Subtotal', labelX, document.y, { width: 80 })
      .text(this.formatCurrency(totals.subtotal), valueX, document.y - 12, {
        width: 88,
        align: 'right',
      })
      .moveDown(0.5)
      .text('Desconto', labelX, document.y, { width: 80 })
      .text(this.formatCurrency(totals.discount), valueX, document.y - 12, {
        width: 88,
        align: 'right',
      })
      .moveDown(0.75)
      .fontSize(12)
      .fillColor('#0f172a')
      .text('Total', labelX, document.y, { width: 80 })
      .text(this.formatCurrency(totals.total), valueX, document.y - 14, {
        width: 88,
        align: 'right',
      });
  }

  private formatVariant(item: PdfOrderItem) {
    const variant = item.productVariant;

    if (!variant) {
      return '-';
    }

    return (
      [variant.size, variant.color, variant.type, variant.material]
        .filter(Boolean)
        .join(' / ') || '-'
    );
  }

  private formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      DRAFT: 'Rascunho',
      PENDING: 'Pendente',
      IN_PRODUCTION: 'Em produção',
      DONE: 'Concluído',
      CANCELED: 'Cancelado',
    };

    return labels[status] ?? status;
  }

  private readonly orderInclude = {
    customer: true,
    items: {
      include: {
        product: true,
        productVariant: true,
      },
    },
  } satisfies Prisma.OrderInclude;
}
