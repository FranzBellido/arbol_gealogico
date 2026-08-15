import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ApprovedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Admins are always approved, others must have isApproved: true
    if (user.systemRole === 'ADMIN' || user.isApproved === true) {
      return true;
    }

    throw new ForbiddenException(
      'Tu cuenta está pendiente de aprobación por un administrador. Por favor, espera a los permisos correspondientes.'
    );
  }
}
