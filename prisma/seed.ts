import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de prueba para Amigo Invisible...');

  // Reset database
  await prisma.message.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('1234', 10);

  // 1. Crear usuarios
  const alicia = await prisma.user.create({
    data: { name: 'Alicia', phone: '600111222', passwordHash },
  });
  const bob = await prisma.user.create({
    data: { name: 'Bob', phone: '600333444', passwordHash },
  });
  const carlos = await prisma.user.create({
    data: { name: 'Carlos', phone: '600555666', passwordHash },
  });
  const diana = await prisma.user.create({
    data: { name: 'Diana', phone: '600777888', passwordHash },
  });

  // 2. Crear Grupo
  const group = await prisma.group.create({
    data: {
      name: 'Cena de Navidad 2026 🎄',
      description: 'Presupuesto aproximado de 20€. Se abrirán los regalos en la cena del día 24.',
      budget: '20€',
      eventDate: new Date('2026-12-24T21:00:00Z'),
      status: 'DRAWN',
      organizerId: alicia.id,
      inviteCode: 'navidad2026',
    },
  });

  // Asignaciones circulares: Alicia -> Bob -> Carlos -> Diana -> Alicia
  await prisma.groupMember.createMany({
    data: [
      {
        groupId: group.id,
        userId: alicia.id,
        targetUserId: bob.id,
        wishlist: 'Me encantan las bufandas, el café de especialidad y los libros de suspense.',
      },
      {
        groupId: group.id,
        userId: bob.id,
        targetUserId: carlos.id,
        wishlist: 'Talla M de camiseta, calcetines frikis o cosas de tecnología.',
      },
      {
        groupId: group.id,
        userId: carlos.id,
        targetUserId: diana.id,
        wishlist: 'Novelas históricas, puzzles o té verde matcha.',
      },
      {
        groupId: group.id,
        userId: diana.id,
        targetUserId: alicia.id,
        wishlist: 'Plantas de interior, libretas bonitas o velas aromáticas.',
      },
    ],
  });

  // Mensajes de prueba entre Alicia (Santa de Bob) y Bob (Víctima de Alicia)
  await prisma.message.create({
    data: {
      groupId: group.id,
      senderId: alicia.id,
      receiverId: bob.id,
      isAnonymous: true,
      content: '¡Hola Bob! Soy tu Amigo Invisible 🎅. He visto que te gusta la tecnología, ¿hay algo específico que tengas en tu lista de deseos?',
      createdAt: new Date(Date.now() - 3600 * 1000 * 2),
    },
  });

  await prisma.message.create({
    data: {
      groupId: group.id,
      senderId: bob.id,
      receiverId: alicia.id,
      isAnonymous: false,
      content: '¡Hola Santa! Una alfombrilla para el ratón o un organizador de cables me vendría de lujo 😄',
      createdAt: new Date(Date.now() - 3600 * 1000),
    },
  });

  // 3. Crear segundo grupo en borrador para probar exclusiones en vivo
  const draftGroup = await prisma.group.create({
    data: {
      name: 'Amigo Invisible Oficina 2026 🏢',
      description: 'Presupuesto 15€. Alicia y Carlos no pueden regalarse (regla mutua).',
      budget: '15€',
      status: 'DRAFT',
      organizerId: alicia.id,
      inviteCode: 'oficina2026',
    },
  });

  await prisma.groupMember.createMany({
    data: [
      {
        groupId: draftGroup.id,
        userId: alicia.id,
        exclusions: JSON.stringify([carlos.id]),
      },
      {
        groupId: draftGroup.id,
        userId: bob.id,
        exclusions: '[]',
      },
      {
        groupId: draftGroup.id,
        userId: carlos.id,
        exclusions: JSON.stringify([alicia.id]),
      },
      {
        groupId: draftGroup.id,
        userId: diana.id,
        exclusions: '[]',
      },
    ],
  });

  console.log('✅ Base de datos sembrada con éxito:');
  console.log('Usuarios de prueba (Contraseña para todos: "1234"):');
  console.log('  - Alicia (Organizadora, le regala a Bob): 600111222');
  console.log('  - Bob (Le regala a Carlos, recibe de Alicia): 600333444');
  console.log('  - Carlos (Le regala a Diana): 600555666');
  console.log('  - Diana (Le regala a Alicia): 600777888');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
