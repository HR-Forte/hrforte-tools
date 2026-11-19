import { MigrationInterface } from 'mongo-migrate-ts';
import prisma from '@/lib/prisma/prismaClient';

const SUPER_ADMIN_ROLE = 'Super Admin';
const SUPER_ADMIN_EMAIL = 'admin@zigvy.com';

export class AddSuperAdminRole1795061866417 implements MigrationInterface {
  public async up(): Promise<void | never> {
    console.info('[AddSuperAdminRole1795061866417] Starting migration...');

    const role = await prisma.role.upsert({
      where: { name: SUPER_ADMIN_ROLE },
      create: { name: SUPER_ADMIN_ROLE, description: 'Super Admin Role (hidden)' },
      update: { description: 'Super Admin Role (hidden)', isDeleted: false },
    });

    const user = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });
    if (!user) {
      throw new Error(`User ${SUPER_ADMIN_EMAIL} not found`);
    }

    const existing = await prisma.roleAssignment.findFirst({
      where: { userId: user.id, roleId: role.id, isDeleted: false },
    });

    if (!existing) {
      await prisma.roleAssignment.create({ data: { userId: user.id, roleId: role.id } });
    }

    console.info('[AddSuperAdminRole1795061866417] Migration completed');
  }

  public async down(): Promise<void | never> {
    console.info('[AddSuperAdminRole1795061866417] Rolling back migration...');

    const role = await prisma.role.findUnique({ where: { name: SUPER_ADMIN_ROLE } });
    if (role) {
      await prisma.roleAssignment.deleteMany({ where: { roleId: role.id } });
      await prisma.role.delete({ where: { id: role.id } });
    }

    console.info('[AddSuperAdminRole1795061866417] Rolling back migration completed');
  }
}
