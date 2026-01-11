import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();

    // Middleware para soft deletes automáticos
    this['$use'](async (params, next) => {
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
        // Solo aplicar si el modelo tiene el campo deletedAt (User, Sale, etc.)
        if (this.hasDeletedAt(params.model)) {
          params.action = 'findFirst';
          params.args.where = {
            ...params.args.where,
            deletedAt: null,
          };
        }
      }
      
      if (params.action === 'findMany') {
        if (this.hasDeletedAt(params.model)) {
          // Solo agregar filtro si no se especificó deletedAt explícitamente
          if (params.args.where) {
            if (params.args.where.deletedAt === undefined) {
              params.args.where['deletedAt'] = null;
            }
          } else {
            params.args['where'] = { deletedAt: null };
          }
        }
      }
      
      // Actualizar también en count
      if (params.action === 'count') {
        if (this.hasDeletedAt(params.model)) {
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

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper para saber si un modelo tiene soft delete
  private hasDeletedAt(model: string | undefined): boolean {
    if (!model) return false;
    const modelsWithSoftDelete = ['User', 'Sale', 'Company', 'SaleStatus', 'Technology'];
    return modelsWithSoftDelete.includes(model);
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
