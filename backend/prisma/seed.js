import bcrypt from "bcryptjs";
import { PrismaClient, ConversionStage, ProjectStatus, OrgType } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const roles = [
        { code: "ADMIN", name: "Admin" },
        { code: "BIM_MANAGER", name: "BIM Manager" },
        { code: "BIM_ENGINEER", name: "BIM Engineer" },
        { code: "CLIENT", name: "Client" },
        { code: "REVIEWER", name: "Reviewer" },
    ];
    for (const role of roles) {
        await prisma.role.upsert({
            where: { code: role.code },
            update: { name: role.name },
            create: role,
        });
    }
    const permissions = [
        "projects.read",
        "projects.write",
        "files.upload",
        "conversion.submit",
        "conversion.assign",
        "deliverables.review",
        "admin.users.manage",
    ];
    for (const code of permissions) {
        await prisma.permission.upsert({
            where: { code },
            update: {},
            create: { code, description: code },
        });
    }
    const internalOrg = await prisma.organization.upsert({
        where: { code: "TEKSYS_INTERNAL" },
        update: { name: "Teksys BIM Internal" },
        create: {
            code: "TEKSYS_INTERNAL",
            name: "Teksys BIM Internal",
            type: OrgType.INTERNAL,
            contactName: "Teksys BIM Office",
            contactEmail: "bim@teksys.in",
        },
    });
    const clientOrg = await prisma.organization.upsert({
        where: { code: "AISHWARYAM_GROUP" },
        update: { name: "Aishwaryam Group" },
        create: {
            code: "AISHWARYAM_GROUP",
            name: "Aishwaryam Group",
            type: OrgType.CLIENT,
            contactName: "Client Coordination",
            contactEmail: "projects@aishwaryam.com",
        },
    });
    const adminPassword = await bcrypt.hash("Admin@1234", 10);
    const adminUser = await prisma.user.upsert({
        where: { email: "admin@teksys.in" },
        update: {
            fullName: "Teksys BIM Admin",
            passwordHash: adminPassword,
            organizationId: internalOrg.id,
        },
        create: {
            email: "admin@teksys.in",
            fullName: "Teksys BIM Admin",
            passwordHash: adminPassword,
            organizationId: internalOrg.id,
        },
    });
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "ADMIN" } });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
        update: {},
        create: { userId: adminUser.id, roleId: adminRole.id },
    });
    const project = await prisma.project.upsert({
        where: { code: "TKS-BIM-001" },
        update: {
            name: "Aishwaryam Signature - CAD2BIM",
            location: "Hyderabad",
            clientOrgId: clientOrg.id,
            status: ProjectStatus.ACTIVE,
            createdById: adminUser.id,
        },
        create: {
            code: "TKS-BIM-001",
            name: "Aishwaryam Signature - CAD2BIM",
            location: "Hyderabad",
            clientOrgId: clientOrg.id,
            status: ProjectStatus.ACTIVE,
            createdById: adminUser.id,
            description: "Residential high-rise CAD to BIM conversion and coordination workflow.",
        },
    });
    await prisma.projectMember.upsert({
        where: {
            projectId_userId: {
                projectId: project.id,
                userId: adminUser.id,
            },
        },
        update: {},
        create: {
            projectId: project.id,
            userId: adminUser.id,
            title: "Program Admin",
        },
    });
    const request = await prisma.conversionRequest.create({
        data: {
            projectId: project.id,
            title: "Tower-A Architectural CAD2BIM",
            description: "Convert latest architectural DWG package to LOD-300 BIM model.",
            stage: ConversionStage.UNDER_REVIEW,
            createdById: adminUser.id,
        },
    });
    await prisma.task.createMany({
        data: [
            {
                projectId: project.id,
                conversionRequestId: request.id,
                title: "Validate CAD package",
                description: "Check drawing completeness and naming standards.",
            },
            {
                projectId: project.id,
                conversionRequestId: request.id,
                title: "Create base BIM levels and grids",
                description: "Initialize Revit model framework from approved scope.",
            },
        ],
        skipDuplicates: true,
    });
    await prisma.clashReport.create({
        data: {
            projectId: project.id,
            title: "Architectural vs MEP Coordination - Sprint 01",
            disciplineA: "Architectural",
            disciplineB: "MEP",
            totalClashes: 18,
            openClashes: 11,
            resolvedClashes: 7,
            reportDate: new Date(),
            issues: {
                create: [
                    {
                        title: "Duct clash at corridor beam",
                        severity: "HIGH",
                        status: "OPEN",
                        location: "Level 08, Grid A-4",
                    },
                ],
            },
        },
    });
    await prisma.costEstimation.create({
        data: {
            projectId: project.id,
            name: "Tower-A Core and Shell Quantification",
            currency: "INR",
            totalAmount: 54500000,
            quantitySnapshot: {
                concreteM3: 982.4,
                rebarTons: 146.8,
                formworkM2: 3240.5,
            },
            lines: {
                create: [
                    {
                        itemCode: "CONC-M30",
                        description: "M30 Concrete",
                        unit: "m3",
                        quantity: 982.4,
                        rate: 7900,
                        amount: 7760960,
                    },
                    {
                        itemCode: "REBAR-FE500",
                        description: "Rebar Fe500",
                        unit: "ton",
                        quantity: 146.8,
                        rate: 64500,
                        amount: 9468600,
                    },
                ],
            },
        },
    });
    console.log("Seed complete:");
    console.log({
        adminEmail: "admin@teksys.in",
        adminPassword: "Admin@1234",
        projectCode: project.code,
    });
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
