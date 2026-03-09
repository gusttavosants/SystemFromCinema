import { SetMetadata } from '@nestjs/common';
import type { LockOptions } from '@infrastructure/cache';

export const WITH_LOCK_METADATA = 'WITH_LOCK_METADATA';

export interface WithLockMetadata {
  resourceTemplate: string;
  options: LockOptions;
}

/**
 * Decorator para automatizar lock/unlock de recursos
 * Suporta template variables usando {{variableName}} syntax
 *
 * Exemplo:
 * @WithLock('reservation:{{sessionId}}:{{seatNumber}}', { ttl: 30000 })
 * async createReservation(sessionId: string, seatNumber: number) {
 *   // Código executado com lock automático
 * }
 */
export function WithLock(
  resourceTemplate: string,
  options: LockOptions = {},
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    descriptor: PropertyDescriptor,
  ) => {
    if (propertyKey === undefined) {
      throw new Error('WithLock decorator can only be used on methods');
    }

    SetMetadata(WITH_LOCK_METADATA, {
      resourceTemplate,
      options,
    } as WithLockMetadata)(target, propertyKey, descriptor);

    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      // Obter argumentos nomeados usando reflection
      const argNames = getArgumentNames(originalMethod);
      const argMap = new Map<string, unknown>();

      argNames.forEach((name, index) => {
        argMap.set(name, args[index]);
      });

      // Substituir template variables na resource key
      const resource = replaceTemplateVariables(resourceTemplate, argMap);

      // Obter DistributedLockService via DI (será injetado no interceptor)
      const lockService = (this as unknown as Record<string, unknown>)
        .distributedLockService as {
        executeWithLock: <T>(
          resource: string,
          callback: () => Promise<T>,
          options: LockOptions,
        ) => Promise<T>;
      };

      if (!lockService) {
        throw new Error(
          'DistributedLockService not found - ensure @WithLock is used in a NestJS service',
        );
      }

      return await lockService.executeWithLock(
        resource,
        () => originalMethod.apply(this, args) as Promise<unknown>,
        options,
      );
    };

    return descriptor;
  };
}

/**
 * Extrai nomes de argumentos de uma função
 */
function getArgumentNames(
  fn: (...args: unknown[]) => Promise<unknown>,
): string[] {
  const fnStr = fn.toString();
  // Match async function pattern
  const asyncMatch = fnStr.match(/async\s+\w+\s*\(\s*([^)]*)\s*\)/);
  const match = asyncMatch || fnStr.match(/\(\s*([^)]*)\s*\)/);

  if (!match || !match[1]) {
    return [];
  }

  return match[1]
    .split(',')
    .map((param) => param.trim().split(':')[0].trim())
    .filter((param) => param.length > 0);
}

/**
 * Substitui template variables na resource key
 * Exemplo: 'reservation:{{sessionId}}:{{seatNumber}}' => 'reservation:123:456'
 */
function replaceTemplateVariables(
  template: string,
  variables: Map<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName: string) => {
    const value = variables.get(varName);
    if (value === undefined || value === null) {
      throw new Error(
        `Template variable ${varName} not found in function arguments`,
      );
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value);
  });
}
