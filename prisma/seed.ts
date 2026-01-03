import { prisma } from "@/app/lib/prisma";
import crypto from "crypto";

async function main() {
  console.log("Seeding database...");

  // Create Tenant 1
  const tenant1 = await prisma.tenant.create({
    data: {
      name: "Dummy Org 1",
      apiKey: "sk_test_" + crypto.randomBytes(32).toString("hex"),
    },
  });

  console.log(`Created tenant: ${tenant1.name} (${tenant1.id})`);
  console.log(`API Key: ${tenant1.apiKey}`);

  // Create Tenant 2
  const tenant2 = await prisma.tenant.create({
    data: {
      name: "Dummy Org 2",
      apiKey: "sk_test_" + crypto.randomBytes(32).toString("hex"),
    },
  });

  console.log(`Created tenant: ${tenant2.name} (${tenant2.id})`);
  console.log(`API Key: ${tenant2.apiKey}`);

  // Create Agents for Tenant 1
  const agent1 = await prisma.agent.create({
    data: {
      tenantId: tenant1.id,
      name: "Customer Support Bot",
      primaryProvider: "vendorA",
      fallbackProvider: "vendorB",
      systemPrompt: "You are a helpful customer support assistant. Be friendly and professional.",
      enabledTools: JSON.stringify(["search", "calculator"]),
    },
  });

  const agent2 = await prisma.agent.create({
    data: {
      tenantId: tenant1.id,
      name: "Sales Assistant",
      primaryProvider: "vendorB",
      fallbackProvider: null,
      systemPrompt: "You are a sales assistant. Help customers find the right products.",
      enabledTools: JSON.stringify(["product_search"]),
    },
  });

  // Create Agent for Tenant 2
  const agent3 = await prisma.agent.create({
    data: {
      tenantId: tenant2.id,
      name: "Technical Support",
      primaryProvider: "vendorA",
      fallbackProvider: "vendorB",
      systemPrompt: "You are a technical support specialist. Provide detailed technical assistance.",
      enabledTools: JSON.stringify(["code_analyzer", "documentation_search"]),
    },
  });

  console.log(`Created agent: ${agent1.name} (${agent1.id})`);
  console.log(`Created agent: ${agent2.name} (${agent2.id})`);
  console.log(`Created agent: ${agent3.name} (${agent3.id})`);

  console.log("\n✅ Seeding completed!");
  console.log("\n📝 Summary:");
  console.log(`   - 2 Tenants`);
  console.log(`   - 3 Agents`);
  console.log(`\n🔑 Tenant 1 API Key: ${tenant1.apiKey}`);
  console.log(`🔑 Tenant 2 API Key: ${tenant2.apiKey}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

