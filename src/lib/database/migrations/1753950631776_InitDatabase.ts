import { MigrationInterface } from 'mongo-migrate-ts';
import prisma from '@/lib/prisma/prismaClient';
import bcrypt from 'bcryptjs';

export class InitDatabase1753950631776 implements MigrationInterface {
  public async up(): Promise<void | never> {
    console.info('[InitDatabase1753950631776] Starting migration...');

    // Create Role
    const [adminRole, userRole] = await Promise.all([
      prisma.role.upsert({
        where: { name: 'Admin' },
        create: { name: 'Admin', description: 'Admin Role' },
        update: { name: 'Admin', description: 'Admin Role' },
      }),
      prisma.role.upsert({
        where: { name: 'User' },
        create: { name: 'User', description: 'User Role' },
        update: { name: 'User', description: 'User Role' },
      }),
    ]);

    console.info('\n\nRoles created:', adminRole, userRole);

    // Create User
    const MASTER_PASSWORD = 'Z!gvy@123';

    const hashedPassword = await bcrypt.hash(MASTER_PASSWORD, 10);

    let user = await prisma.user.findUnique({
      where: {
        email: 'admin@zigvy.com',
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@zigvy.com',
          password: hashedPassword,
          name: 'Admin',
        },
      });
    }

    console.info('\n\nUser created:', user);

    // Create Role Assignment
    const roleAssignment = await prisma.roleAssignment.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    console.info('\n\nRole assignment created:', roleAssignment);
    console.info('[InitDatabase1753950631776] Migration completed');
  }

  public async down(): Promise<void | never> {
    console.info('[InitDatabase1753950631776] Rolling back migration...');
    await prisma.role.deleteMany({ where: { name: { in: ['Admin', 'User'] } } });

    const user = await prisma.user.findUnique({
      where: {
        email: 'admin@zigvy.com',
      },
    });

    if (user) {
      await prisma.roleAssignment.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }

    console.info('[InitDatabase1753950631776] Rolling back migration completed');
  }
}
