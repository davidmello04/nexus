import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanySettings, Prisma, QuoteStatus } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteItemDto } from './dto/quote-item.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

type PdfQuoteItem = {
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
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly companySettingsService: CompanySettingsService,
  ) {}

  async create(createQuoteDto: CreateQuoteDto) {
    await this.ensureCustomerExists(createQuoteDto.customerId);
    this.ensureItems(createQuoteDto.items);

    const totals = await this.calculateTotals(
      createQuoteDto.customerId,
      createQuoteDto.items,
      createQuoteDto.discount,
    );

    return this.prisma.quote.create({
      data: {
        customerId: createQuoteDto.customerId,
        status: createQuoteDto.status,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        notes: createQuoteDto.notes,
        validUntil: createQuoteDto.validUntil
          ? new Date(`${createQuoteDto.validUntil}T00:00:00`)
          : undefined,
        items: {
          create: totals.items,
        },
      },
      include: this.quoteInclude,
    });
  }

  findAll() {
    return this.prisma.quote.findMany({
      include: this.quoteInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: this.quoteInclude,
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado.');
    }

    return quote;
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto) {
    const currentQuote = await this.findOne(id);

    if (updateQuoteDto.customerId) {
      await this.ensureCustomerExists(updateQuoteDto.customerId);
    }

    if (updateQuoteDto.items) {
      this.ensureItems(updateQuoteDto.items);

      return this.prisma.$transaction(async (tx) => {
        const customerId = updateQuoteDto.customerId ?? currentQuote.customerId;
        const totals = await this.calculateTotals(
          customerId,
          updateQuoteDto.items ?? [],
          updateQuoteDto.discount ?? this.toNumber(currentQuote.discount),
        );

        await tx.quoteItem.deleteMany({
          where: { quoteId: id },
        });

        await tx.quote.update({
          where: { id },
          data: {
            customerId,
            status: updateQuoteDto.status,
            subtotal: totals.subtotal,
            discount: totals.discount,
            total: totals.total,
            notes: updateQuoteDto.notes,
            validUntil:
              updateQuoteDto.validUntil !== undefined
                ? this.parseOptionalDate(updateQuoteDto.validUntil)
                : undefined,
            items: {
              create: totals.items,
            },
          },
        });

        return tx.quote.findUniqueOrThrow({
          where: { id },
          include: this.quoteInclude,
        });
      });
    }

    const subtotal = this.toNumber(currentQuote.subtotal);
    const discount =
      updateQuoteDto.discount !== undefined
        ? updateQuoteDto.discount
        : this.toNumber(currentQuote.discount);

    this.ensureDiscountIsValid(subtotal, discount);

    return this.prisma.quote.update({
      where: { id },
      data: {
        customerId: updateQuoteDto.customerId,
        status: updateQuoteDto.status,
        discount,
        total: subtotal - discount,
        notes: updateQuoteDto.notes,
        validUntil:
          updateQuoteDto.validUntil !== undefined
            ? this.parseOptionalDate(updateQuoteDto.validUntil)
            : undefined,
      },
      include: this.quoteInclude,
    });
  }

  async updateStatus(id: string, status: QuoteStatus) {
    await this.findOne(id);

    return this.prisma.quote.update({
      where: { id },
      data: { status },
      include: this.quoteInclude,
    });
  }

  async remove(id: string) {
    const quote = await this.findOne(id);

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        'Somente orçamentos em rascunho podem ser excluídos.',
      );
    }

    return this.prisma.quote.delete({
      where: { id },
    });
  }

  async convertToOrder(id: string) {
    const quote = await this.findOne(id);

    if (quote.status !== QuoteStatus.APPROVED) {
      throw new BadRequestException(
        'Somente orçamentos aprovados podem ser convertidos em pedido.',
      );
    }

    return this.prisma.order.create({
      data: {
        customerId: quote.customerId,
        subtotal: quote.subtotal,
        discount: quote.discount,
        total: quote.total,
        notes: quote.notes,
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            notes: item.notes,
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });
  }

  async generatePdf(id: string) {
    const quote = await this.findOne(id);
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

    this.drawPdfHeader(document, `Orçamento #${quote.code}`, companySettings);

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
      .text('Dados do orçamento')
      .moveDown(0.5)
      .fontSize(10)
      .fillColor('#334155')
      .text(`Cliente: ${quote.customer?.name ?? '-'}`)
      .text(`Status: ${this.getStatusLabel(quote.status)}`)
      .text(`Data do orçamento: ${quote.createdAt.toLocaleString('pt-BR')}`);

    if (quote.validUntil) {
      document.text(`Válido até: ${quote.validUntil.toLocaleDateString('pt-BR')}`);
    }

    document.moveDown(1);
    this.drawItemsTable(document, quote.items);
    document.moveDown(1);
    this.drawTotals(document, {
      subtotal: this.toNumber(quote.subtotal),
      discount: this.toNumber(quote.discount),
      total: this.toNumber(quote.total),
    });

    if (quote.notes) {
      document.moveDown(1.5);
      document
        .fontSize(12)
        .fillColor('#0f172a')
        .text('Observações')
        .moveDown(0.5)
        .fontSize(10)
        .fillColor('#334155')
        .text(quote.notes, { lineGap: 3 });
    }

    document.end();

    return {
      buffer: await finished,
      filename: `orcamento-${quote.code}.pdf`,
    };
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

  private ensureItems(items?: QuoteItemDto[]) {
    if (!items?.length) {
      throw new BadRequestException('Orçamento deve ter pelo menos um item.');
    }
  }

  private async calculateTotals(
    customerId: string,
    items: QuoteItemDto[],
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

  private parseOptionalDate(value?: string) {
    return value ? new Date(`${value}T00:00:00`) : null;
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
      : 'Gestão de orçamentos';
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
      .text(contactInfo, 48, 76, { width: contentWidth });

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
    if (!logoUrl) return;

    const logoPath = this.getLocalUploadPath(logoUrl);
    if (!logoPath || !existsSync(logoPath)) return;

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
    return uploadPath && uploadPath !== url
      ? join(process.cwd(), 'uploads', uploadPath)
      : '';
  }

  private drawItemsTable(document: PDFKit.PDFDocument, items: PdfQuoteItem[]) {
    const columns = { product: 48, variant: 188, quantity: 310, unitPrice: 370, total: 460 };
    const rowHeight = 28;

    document.fontSize(12).fillColor('#0f172a').text('Itens do orçamento');
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
        .text(item.product?.name ?? '-', columns.product, rowY, { width: 128 })
        .text(this.formatVariant(item), columns.variant, rowY, { width: 110 })
        .text(String(item.quantity), columns.quantity, rowY, { width: 45, align: 'right' })
        .text(this.formatCurrency(this.toNumber(item.unitPrice)), columns.unitPrice, rowY, { width: 74, align: 'right' })
        .text(this.formatCurrency(this.toNumber(item.total)), columns.total, rowY, { width: 74, align: 'right' });

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
    columns: { product: number; variant: number; quantity: number; unitPrice: number; total: number },
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
      .text('Valor unit.', columns.unitPrice, headerY, { width: 74, align: 'right' })
      .text('Total', columns.total, headerY, { width: 74, align: 'right' });
    document.y = headerY + 28;
  }

  private drawTotals(document: PDFKit.PDFDocument, totals: { subtotal: number; discount: number; total: number }) {
    const labelX = 360;
    const valueX = 456;
    document
      .fontSize(10)
      .fillColor('#475569')
      .text('Subtotal', labelX, document.y, { width: 80 })
      .text(this.formatCurrency(totals.subtotal), valueX, document.y - 12, { width: 88, align: 'right' })
      .moveDown(0.5)
      .text('Desconto', labelX, document.y, { width: 80 })
      .text(this.formatCurrency(totals.discount), valueX, document.y - 12, { width: 88, align: 'right' })
      .moveDown(0.75)
      .fontSize(12)
      .fillColor('#0f172a')
      .text('Total', labelX, document.y, { width: 80 })
      .text(this.formatCurrency(totals.total), valueX, document.y - 14, { width: 88, align: 'right' });
  }

  private formatVariant(item: PdfQuoteItem) {
    const variant = item.productVariant;
    if (!variant) return '-';
    return [variant.size, variant.color, variant.type, variant.material]
      .filter(Boolean)
      .join(' / ') || '-';
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
      SENT: 'Enviado',
      APPROVED: 'Aprovado',
      REJECTED: 'Rejeitado',
      EXPIRED: 'Expirado',
    };
    return labels[status] ?? status;
  }

  private readonly quoteInclude = {
    customer: true,
    items: {
      include: {
        product: true,
        productVariant: true,
      },
    },
  } satisfies Prisma.QuoteInclude;
}
