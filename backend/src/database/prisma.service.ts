import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private middlewareSetup = false;

  async onModuleInit() {
    await this.$connect();

    // Setup middleware solo una vez después de conectar
    if (!this.middlewareSetup) {
      this.setupMiddleware();
      this.middlewareSetup = true;
    }
  }

  private setupMiddleware() {
    // Middleware para soft deletes automáticos
    const modelsWithSoftDelete = ['User', 'Sale', 'Company', 'SaleStatus', 'Technology'];
    const hasDeletedAt = (model: string | undefined): boolean => {
      if (!model) return false;
      return modelsWithSoftDelete.includes(model);
    };

    const client = this as any;
    if (typeof client.$use === 'function') {
      client.$use(async (params: any, next: (params: any) => Promise<any>) => {
        // Convertir DELETE en UPDATE con deletedAt
        if (params.action === 'delete') {
          params.action = 'update';
          params.args['data'] = { deletedAt: new Date() };
        }

        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args.data !== undefined) {
            params.args.data['deletedAt'] = new Date();
          } else {
            params.args['data'] = { deletedAt: new Date() };
          }
        }

        // Filtrar registros eliminados en queries de lectura
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          if (hasDeletedAt(params.model)) {
            params.action = 'findFirst';
            params.args.where = {
              ...params.args.where,
              deletedAt: null,
            };
          }
        }

        if (params.action === 'findMany') {
          if (hasDeletedAt(params.model)) {
            if (params.args.where) {
              if (params.args.where.deletedAt === undefined) {
                params.args.where['deletedAt'] = null;
              }
            } else {
              params.args['where'] = { deletedAt: null };
            }
          }
        }

        if (params.action === 'count') {
          if (hasDeletedAt(params.model)) {
            if (params.args.where) {
              if (params.args.where.deletedAt === undefined) {
                params.args.where['deletedAt'] = null;
              }
            } else {
              params.args['where'] = { deletedAt: null };
            }
          }
        }

        return next(params);
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Método helper para incluir eliminados
  async findManyWithDeleted<T>(model: string, args?: any): Promise<T[]> {
    return (this as any)[model].findMany({
      ...args,
      where: {
        ...args?.where,
        // No filtrará por deletedAt: null
      },
    });
  }

  // Método para restaurar registros eliminados
  async restore(model: string, id: string) {
    return (this as any)[model].update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
