import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { CustomerProductPricesModule } from './customer-product-prices/customer-product-prices.module';
import { PricingModule } from './pricing/pricing.module';
import { OrdersModule } from './orders/orders.module';
import { ProductImagesModule } from './product-images/product-images.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { CompanySettingsModule } from './company-settings/company-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CustomersModule,
    CategoriesModule,
    ProductsModule,
    ProductVariantsModule,
    CustomerProductPricesModule,
    PricingModule,
    OrdersModule,
    ProductImagesModule,
    DashboardModule,
    ReportsModule,
    CompanySettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
