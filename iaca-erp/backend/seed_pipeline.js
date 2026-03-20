const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Commercial Pipeline...");

  // 1. Get or Create Lead OrgUnit
  const orgUnit = await prisma.orgUnit.upsert({
    where: { id: "sales-unit-01" }, // Fixed ID for dev
    update: {},
    create: {
      id: "sales-unit-01",
      name: "Departamento Comercial",
      type: "SALES"
    }
  });

  // 2. Create Solar Pipeline
  const pipeline = await prisma.pipeline.create({
    data: {
      name: "Solar Sales (Padrao)",
      type: "SOLAR",
      orgUnitId: orgUnit.id,
      stages: {
        create: [
          { name: "Novo Lead Academy", order: 1, color: "bg-blue-500", helpText: "Validar dados básicos" },
          { name: "Qualificado", order: 2, color: "bg-indigo-500", helpText: "Solicitar Fatura" },
          { name: "Visita Agendada", order: 3, color: "bg-purple-500", helpText: "Geo-Clustering" },
          { name: "Proposta", order: 4, color: "bg-orange-500", helpText: "Apresentar ROI" },
          { name: "Contrato", order: 5, color: "bg-green-600", helpText: "Coletar Assinatura" }
        ]
      }
    }
  });

  console.log("✅ Pipeline created with 5 stages.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
