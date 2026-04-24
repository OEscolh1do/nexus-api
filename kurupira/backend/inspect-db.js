const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const design = await prisma.technicalDesign.findFirst({
    where: { designData: { not: null } },
    orderBy: { updatedAt: 'desc' }
  });

  if (!design) {
    console.log('No design found with designData');
    return;
  }

  const data = typeof design.designData === 'string' ? JSON.parse(design.designData) : design.designData;

  console.log('=== RAW DESIGN DATA STRUCTURE ===');
  console.log('Top level keys:', Object.keys(data));
  if (data.solar) {
    console.log('solar keys:', Object.keys(data.solar));
    if (data.solar.project) {
        console.log('solar.project keys:', Object.keys(data.solar.project));
        if (data.solar.project.placedModules) {
            console.log('placedModules count:', data.solar.project.placedModules.length);
        } else {
            console.log('NO placedModules in solar.project');
        }
    } else {
        console.log('NO solar.project');
    }
    
    if (data.solar.modules) {
        console.log('solar.modules type:', typeof data.solar.modules);
        if (data.solar.modules.ids) {
            console.log('solar.modules.ids:', data.solar.modules.ids.length);
        }
    }
  } else {
      console.log('NO solar key');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
