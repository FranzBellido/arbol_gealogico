import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async developerLogin(email: string, name: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const userCount = await this.prisma.user.count();
      const isFirst = userCount === 0;

      user = await this.prisma.user.create({
        data: {
          email,
          name,
          provider: AuthProvider.DEV,
          providerId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          systemRole: isFirst ? 'ADMIN' : 'USER',
          isApproved: isFirst ? true : false,
        },
      });
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async oauthLogin(reqUser: any, provider: AuthProvider) {
    let user = await this.prisma.user.findUnique({
      where: { providerId: reqUser.id },
    });

    if (!user) {
      const userCount = await this.prisma.user.count();
      const isFirst = userCount === 0;

      user = await this.prisma.user.create({
        data: {
          email: reqUser.email,
          name: reqUser.displayName || `${reqUser.name.givenName} ${reqUser.name.familyName}`,
          avatar: reqUser.photos?.[0]?.value || null,
          provider,
          providerId: reqUser.id,
          systemRole: isFirst ? 'ADMIN' : 'USER',
          isApproved: isFirst ? true : false,
        },
      });
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
