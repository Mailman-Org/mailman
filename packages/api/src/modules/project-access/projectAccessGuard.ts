import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectAccessService } from './projectAccess.service';

const MethodPermission = {
  GET: 'read',
  POST: 'create',
  PUT: 'update',
  DELETE: 'delete',
};

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private projectAccessService: ProjectAccessService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const method = request.method;
    const feature = request.originalUrl.split('/').at(1);
    const project_id =
      request.headers['x-project-id'] || request.body.project_id;
    try {
      const projectAccess = await this.projectAccessService.getProjectAccess(
        project_id as string,
        request.user.id,
      );

      if (!projectAccess) throw new ForbiddenException();

      const requiredPermissions = [
        `${feature}:manage`,
        `${feature}:${MethodPermission[method]}`,
      ];

      let hasPermission = false;

      for (let i = 0; i < projectAccess.permissions.length; i++) {
        const permission = projectAccess.permissions[i];
        if (requiredPermissions.includes(permission)) {
          hasPermission = true;
          break;
        }
      }

      if (!hasPermission) {
        throw new NotFoundException();
      }
      return true;
    } catch (error) {
      throw new ForbiddenException();
    }
  }
}
