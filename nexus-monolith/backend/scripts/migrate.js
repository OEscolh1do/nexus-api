require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

// 1. Target Prisma Client (Supabase PostgreSQL - The modern one we just generated)
const prismaTarget = new PrismaClient();

// 2. Source MySQL Connection (Direct connection to bypass typing issues of old Prisma version)
const sourceConfig = {
    uri: process.env.MYSQL_DATABASE_URL
};

async function createSourceConnection() {
    const connection = await mysql.createConnection(sourceConfig.uri);
    return connection;
}

async function migrateData() {
    console.log('🚀 Starting Data Migration (ETL) from MySQL to Supabase PostgreSQL...');
    const sourceDb = await createSourceConnection();

    try {
        // ---- 1. OrgUnits ----
        console.log('📦 Migrating OrgUnits...');
        const [orgUnits] = await sourceDb.execute('SELECT * FROM OrgUnit');
        for (const row of orgUnits) {
            await prismaTarget.orgUnit.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    name: row.name,
                    type: row.type,
                    parentId: row.parentId,
                    config: row.config,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }
            });
        }
        console.log(`✅ ${orgUnits.length} OrgUnits migrated.`);

        // ---- 2. Users ----
        console.log('👤 Migrating Users...');
        const [users] = await sourceDb.execute('SELECT * FROM User');
        for (const row of users) {
            await prismaTarget.user.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    username: row.username,
                    password: row.password,
                    fullName: row.fullName,
                    role: row.role,
                    orgUnitId: row.orgUnitId,
                    badgeId: row.badgeId,
                    jobTitle: row.jobTitle,
                    hierarchyLevel: row.hierarchyLevel,
                    employmentType: row.employmentType,
                    supervisorId: row.supervisorId,
                    birthDate: row.birthDate,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    tenantId: row.tenantId,
                }
            });
        }
        console.log(`✅ ${users.length} Users migrated.`);

        // ---- 3. Pipelines & Stages ----
        console.log('🛤️ Migrating Pipelines and Stages...');
        const [pipelines] = await sourceDb.execute('SELECT * FROM Pipeline');
        for (const row of pipelines) {
            await prismaTarget.pipeline.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    name: row.name,
                    type: row.type,
                    orgUnitId: row.orgUnitId,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }
            });
        }
        console.log(`✅ ${pipelines.length} Pipelines migrated.`);

        const [stages] = await sourceDb.execute('SELECT * FROM Stage');
        for (const row of stages) {
            await prismaTarget.stage.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    pipelineId: row.pipelineId,
                    name: row.name,
                    order: row.order,
                    createdAt: row.createdAt,
                    color: row.color,
                    helpText: row.helpText
                }
            });
        }
        console.log(`✅ ${stages.length} Stages migrated.`);


        // ---- 4. Missions ----
        console.log('🎯 Migrating Missions...');
        const [missions] = await sourceDb.execute('SELECT * FROM Mission');
        for (const row of missions) {
            await prismaTarget.mission.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    region: row.region,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    status: row.status,
                    stats: row.stats,
                    coordinatorId: row.coordinatorId,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    name: row.name,
                    regionPolygon: row.regionPolygon,
                    tenantId: row.tenantId,
                }
            });
        }
        console.log(`✅ ${missions.length} Missions migrated.`);

        // ---- 5. Leads ----
        console.log('👥 Migrating Leads...');
        const [leads] = await sourceDb.execute('SELECT * FROM Lead');
        for (const row of leads) {
            await prismaTarget.lead.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    phone: row.phone,
                    status: row.status,
                    source: row.source,
                    notes: row.notes,
                    ownerId: row.ownerId,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    academyOrigin: row.academyOrigin,
                    city: row.city,
                    engagementScore: row.engagementScore,
                    missionId: row.missionId,
                    state: row.state,
                    technicalProfile: row.technicalProfile,
                    energyBillUrl: row.energyBillUrl,
                    academyScore: row.academyScore,
                    tenantId: row.tenantId,
                }
            });
        }
        console.log(`✅ ${leads.length} Leads migrated.`);

        // ---- 6. Opportunities ----
        console.log('💰 Migrating Opportunities...');
        const [opportunities] = await sourceDb.execute('SELECT * FROM Opportunity');
        for (const row of opportunities) {
            // Manual string conversion check to conform with Prisma Decimal type requirements in postgres
            const parsedValue = row.estimatedValue ? parseFloat(row.estimatedValue) : 0;

            await prismaTarget.opportunity.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    title: row.title,
                    leadId: row.leadId,
                    missionId: row.missionId,
                    status: row.status,
                    estimatedValue: parsedValue,
                    probability: row.probability,
                    technicalProposalId: row.technicalProposalId,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    tenantId: row.tenantId,
                }
            });
        }
        console.log(`✅ ${opportunities.length} Opportunities migrated.`);

        // ---- 7. Navigation & Workflow ----
        console.log('🧭 Migrating Navigation & Workflow...');
        const [navGroups] = await sourceDb.execute('SELECT * FROM NavigationGroup');
        for (const row of navGroups) {
            await prismaTarget.navigationGroup.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    orgUnitId: row.orgUnitId,
                    module: row.module,
                    title: row.title,
                    order: row.order,
                    isVisible: row.isVisible === 1,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }
            });
        }

        const [navItems] = await sourceDb.execute('SELECT * FROM NavigationItem');
        for (const row of navItems) {
            await prismaTarget.navigationItem.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    groupId: row.groupId,
                    label: row.label,
                    path: row.path,
                    icon: row.icon,
                    order: row.order,
                    isVisible: row.isVisible === 1,
                    requiredRoles: row.requiredRoles,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }
            });
        }

        const [workflowRules] = await sourceDb.execute('SELECT * FROM WorkflowRule');
        for (const row of workflowRules) {
            await prismaTarget.workflowRule.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    orgUnitId: row.orgUnitId,
                    name: row.name,
                    condition: row.condition,
                    action: row.action,
                    isActive: row.isActive === 1,
                    createdAt: row.createdAt,
                }
            });
        }

        const [programs] = await sourceDb.execute('SELECT * FROM Program');
        for (const row of programs) {
            await prismaTarget.program.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    orgUnitId: row.orgUnitId,
                    config: row.config,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }
            });
        }
        console.log(`✅ Navigation and Workflows migrated.`);

        // ---- 8. Assets & HR ----
        console.log('🏢 Migrating Assets and HR Leaves...');
        const [assets] = await sourceDb.execute('SELECT * FROM Asset');
        for (const row of assets) {
            await prismaTarget.asset.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    name: row.name,
                    type: row.type,
                    status: row.status,
                    serialNumber: row.serialNumber,
                    location: row.location,
                    notes: row.notes,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }
            });
        }

        const [leaves] = await sourceDb.execute('SELECT * FROM HRLeave');
        for (const row of leaves) {
            await prismaTarget.hRLeave.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    type: row.type,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    status: row.status,
                    reason: row.reason,
                    description: row.description,
                    destination: row.destination,
                    requesterId: row.requesterId,
                    approverId: row.approverId,
                    createdAt: row.createdAt,
                }
            });
        }
        console.log(`✅ Assets and HR Leaves migrated.`);

        // ---- 9. Projects, Strategies & Tasks ----
        console.log('🏗️ Migrating Strategies and Projects...');
        const [strategies] = await sourceDb.execute('SELECT * FROM Strategy');
        for (const row of strategies) {
            await prismaTarget.strategy.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    code: row.code,
                    title: row.title,
                    description: row.description,
                    colorCode: row.colorCode,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    isActive: row.isActive === 1,
                    type: row.type,
                    parentId: row.parentId,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }
            });
        }

        const [projects] = await sourceDb.execute('SELECT * FROM Project');
        for (const row of projects) {
            await prismaTarget.project.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    strategyId: row.strategyId,
                    managerId: row.managerId,
                    title: row.title,
                    description: row.description,
                    progressPercentage: row.progressPercentage,
                    status: row.status,
                    type: row.type,
                    details: row.details,
                    quoteId: row.quoteId,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    proposalId: row.proposalId,
                }
            });
        }

        const [tasks] = await sourceDb.execute('SELECT * FROM OperationalTask');
        for (const row of tasks) {
            await prismaTarget.operationalTask.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    projectId: row.projectId,
                    title: row.title,
                    description: row.description,
                    status: row.status,
                    assignedTo: row.assignedTo,
                    completionPercent: row.completionPercent,
                    isMilestone: row.isMilestone === 1,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    dueDate: row.dueDate,
                    versionId: row.versionId,
                    isRecurring: row.isRecurring === 1,
                    recurrencePattern: row.recurrencePattern,
                    nextRunAt: row.nextRunAt,
                    parentTemplateId: row.parentTemplateId,
                    isTemplate: row.isTemplate === 1,
                    lastSpawnedAt: row.lastSpawnedAt,
                    tags: row.tags,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }
            });
        }
        console.log(`✅ Strategies, Projects and ${tasks.length} Tasks migrated.`);

        // ---- 10. Peripheral Data (Interactions, Proposals, Logs) ----
        console.log('📝 Migrating Proposals and Interactions...');
        const [interactions] = await sourceDb.execute('SELECT * FROM LeadInteraction');
        for (const row of interactions) {
            await prismaTarget.leadInteraction.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    leadId: row.leadId,
                    type: row.type,
                    content: row.content,
                    authorId: row.authorId,
                    createdAt: row.createdAt,
                }
            });
        }

        const [techProposals] = await sourceDb.execute('SELECT * FROM TechnicalProposal');
        for (const row of techProposals) {
            await prismaTarget.technicalProposal.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    kitData: row.kitData,
                    consumptionAvg: row.consumptionAvg,
                    infrastructurePhotos: row.infrastructurePhotos,
                    paybackData: row.paybackData,
                    validatedByEng: row.validatedByEng === 1,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    tenantId: row.tenantId,
                }
            });
        }

        const [solarProposals] = await sourceDb.execute('SELECT * FROM SolarProposal');
        for (const row of solarProposals) {
            await prismaTarget.solarProposal.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    leadId: row.leadId,
                    name: row.name,
                    status: row.status,
                    totalValue: row.totalValue,
                    systemSize: row.systemSize,
                    paybackYears: row.paybackYears,
                    monthlySavings: row.monthlySavings,
                    proposalData: row.proposalData,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }
            });
        }

        const [sessions] = await sourceDb.execute('SELECT * FROM Session');
        for (const row of sessions) {
            await prismaTarget.session.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    userId: row.userId,
                    token: row.token,
                    expiresAt: row.expiresAt,
                    createdAt: row.createdAt,
                }
            });
        }

        const [events] = await sourceDb.execute('SELECT * FROM Event');
        for (const row of events) {
            await prismaTarget.event.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    type: row.type,
                    location: row.location,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    date: row.date,
                }
            });
        }

        console.log('📜 Migrating Audit Logs (this might take a while)...');
        const [auditLogs] = await sourceDb.execute('SELECT * FROM AuditLog');
        for (const row of auditLogs) {
            await prismaTarget.auditLog.upsert({
                where: { id: row.id },
                update: {},
                create: {
                    id: row.id,
                    userId: row.userId,
                    action: row.action,
                    entity: row.entity,
                    resourceId: row.resourceId,
                    details: row.details,
                    timestamp: row.timestamp,
                    eventId: row.eventId,
                    after: row.after,
                    before: row.before,
                    ipAddress: row.ipAddress,
                    userAgent: row.userAgent,
                }
            });
        }
        console.log(`✅ ${auditLogs.length} Audit Logs migrated.`);

        console.log('🎉 Full Migration Completed Successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await prismaTarget.$disconnect();
        await sourceDb.end();
    }
}

migrateData();
