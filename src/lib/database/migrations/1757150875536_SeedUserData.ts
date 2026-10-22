import { MigrationInterface } from 'mongo-migrate-ts';
import prisma from '@/lib/prisma/prismaClient';
import bcrypt from 'bcryptjs';

export class SeedUserData1757150875536 implements MigrationInterface {
  public async up(): Promise<void | never> {
    const MASTER_PASSWORD = 'Z!gvy@123';
    const hashedPassword = await bcrypt.hash(MASTER_PASSWORD, 10);

    const userRole = await prisma.role.findUnique({
      where: {
        name: 'User',
      },
    });

    if (!userRole) {
      throw new Error('User role not found');
    }

    const userList = [
      { email: 'haivd@zigvy.com', name: 'Hai' },
      { email: 'vinhlt@zigvy.com', name: 'Vinh' },
      { email: 'hau@zigvy.com', name: 'Hau' },
      { email: 'hienthq@zigvy.com', name: 'Hien' },
      { email: 'chaubtd@zigvy.com', name: 'Chau' },
      { email: 'bientl@zigvy.com', name: 'Bien' },
      { email: 'khangnt@zigvy.com', name: 'Khang' },
      { email: 'thienvq@zigvy.com', name: 'Thien' },
      { email: 'tuanba@zigvy.com', name: 'Tuan' },
      { email: 'phuongnguyen@zigvy.com', name: 'Phuong' },
      { email: 'ngocnt@zigvy.com', name: 'Ngoc' },
      { email: 'tunnm@zigvy.com', name: 'Tu' },
      { email: 'triln@zigvy.com', name: 'Tri' },
      { email: 'tungmm@zigvy.com', name: 'Tri' },
      { email: 'nty@hrforte.com', name: 'Teng Yong Ng' },
    ];

    await Promise.all(
      userList.map(async data => {
        let user = await prisma.user.findUnique({
          where: { email: data.email, isDeleted: false },
        });

        if (!user) {
          user = await prisma.user.upsert({
            where: { email: data.email, isDeleted: false },
            update: { password: hashedPassword, name: data.name, isDeleted: false },
            create: { email: data.email, password: hashedPassword, name: data.name, isDeleted: false },
          });
        }

        await prisma.roleAssignment.create({
          data: { userId: user.id, roleId: userRole.id },
        });
      })
    );
  }

  public async down(): Promise<void | never> {}
}
