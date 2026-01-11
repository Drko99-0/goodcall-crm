import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SalesModule } from './modules/sales/sales.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { SaleStatusesModule } from './modules/sale-statuses/sale-statuses.module';
import { TechnologiesModule } from './modules/technologies/technologies.module';
import { GoalsModule } from './modules/goals/goals.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SalesModule,
    CompaniesModule,
    SaleStatusesModule,
    TechnologiesModule,
    GoalsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
