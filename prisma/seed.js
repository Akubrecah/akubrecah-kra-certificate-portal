const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const services = [
    {
      serviceKey: 'register-kra',
      serviceName: 'Register KRA PIN',
      isActive: true,
      description: 'New KRA PIN registration for individuals and businesses.'
    },
    {
      serviceKey: 'renew-kra',
      serviceName: 'Renew KRA Password',
      isActive: true,
      description: 'Reset or renew your KRA iTax password.'
    },
    {
      serviceKey: 'change-kra-email',
      serviceName: 'Change KRA Email',
      isActive: true,
      description: 'Update the email address associated with your KRA PIN.'
    },
    {
      serviceKey: 'file-nil-returns',
      serviceName: 'File Nil Returns',
      isActive: true,
      description: 'Easy and fast filing of KRA Nil returns.'
    },
    {
      serviceKey: 'register-nssf',
      serviceName: 'Register NSSF',
      isActive: true,
      description: 'Social security fund registration for employees.'
    },
    {
      serviceKey: 'register-shif',
      serviceName: 'Register SHIF',
      isActive: true,
      description: 'Health insurance fund registration.'
    },
    {
      serviceKey: 'custom-filing',
      serviceName: 'Custom Tax Filing',
      isActive: true,
      description: 'Specialized tax compliance services tailored for your needs.'
    }
  ]

  console.log('Seeding service settings...')

  for (const service of services) {
    await prisma.serviceSetting.upsert({
      where: { serviceKey: service.serviceKey },
      update: {},
      create: service
    })
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
