/**
 * Database seed: creates the dental_msp_us vertical pack and default settings.
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding ProofSignal Labs database...");

  // ── Dental MSP vertical ──────────────────────────────────────────────────

  const vertical = await db.vertical.upsert({
    where: { key: "dental_msp_us" },
    update: { active: true },
    create: {
      key: "dental_msp_us",
      label: "Dental Clinic Leads → Dental-Focused MSPs / MSSPs (US)",
      active: true,
    },
  });

  console.log(`Vertical: ${vertical.key} (${vertical.id})`);

  await db.verticalConfig.upsert({
    where: { verticalId: vertical.id },
    update: {},
    create: {
      verticalId: vertical.id,

      defaultKeywords: [
        "dental clinic",
        "dental group",
        "family dentistry",
        "dental associates",
        "dental care",
        "general dentistry",
        "dental studio",
      ],

      defaultPageTargets: [
        "homepage",
        "about",
        "contact",
        "locations",
        "careers",
      ],

      buyerSearchKeywords: [
        "dental IT support",
        "dental MSP",
        "dental managed IT",
        "dental cybersecurity",
        "HIPAA managed services dental",
        "dental practice technology",
      ],

      scoringWeights: JSON.stringify({
        sourceAvailability: 15,
        sourceConsistency: 15,
        fieldCompleteness: 20,
        contactQuality: 20,
        geographyCertainty: 10,
        nicheCertainty: 10,
        triggerStrength: 10,
      }),

      extractionSchema: JSON.stringify({
        dentalSpecific: [
          "practice_software",       // Dentrix, Eaglesoft, Carestream, etc.
          "patient_portal_active",   // HIPAA patient portal detected
          "provider_count_clue",     // "our team of 5 dentists"
          "multi_location_hint",     // footer lists multiple addresses
          "specialty_type",          // general, pediatric, ortho, oral surgery
          "accepts_new_patients",    // "accepting new patients" indicator
        ],
      }),

      classificationPrompt: `You are classifying a web page to determine if the business is a dental clinic.
A dental clinic: provides direct dental care to patients, has dentists or dental hygienists on staff,
offers services like cleanings, fillings, extractions, orthodontics, or oral surgery.
NOT a dental clinic: dental labs, dental supply companies, dental software vendors, dental schools (unless also a practice).
Respond with JSON: {"is_dental_clinic": boolean, "confidence": 0-100, "reason": "one sentence"}.`,

      extractionPrompt: `Extract structured data from this dental clinic web page.
For each field, provide the extracted value AND the exact text evidence from the page.
If a field is not present, return null — do not invent values.
Be precise. Extract verbatim quotes as evidence.`,

      adjudicationPrompt: `You are adjudicating a borderline dental clinic lead record.
Review the evidence items and decide: approve or reject.
A borderline record should be approved only if the evidence clearly supports dental clinic classification,
a viable contact exists, and geography is confirmed.
Respond with JSON: {"decision": "approved"|"rejected", "reason": "two sentences max", "missing": ["list of missing evidence"]}.`,

      outreachTemplate: `Subject: Exclusive dental clinic leads – {{territory}} batch preview

Hi {{contact_name}},

I run ProofSignal Labs — we build exclusive, evidence-backed dental clinic lead lists for dental-focused MSPs.

I have a small batch of validated dental clinic prospects in {{territory}} that aren't spoken for yet. Each lead includes confirmed location count, practice software signals, HIPAA portal status, a verified owner contact, and a reason to call now.

Would it be useful to see 3–5 leads from your market? No cost, no commitment — just a preview to see if the quality matches what you need.

{{sender_name}}
{{sender_email}}

--
ProofSignal Labs · {{sender_address}}
Unsubscribe: {{unsubscribe_url}}`,

      followupTemplate: `Subject: Re: Exclusive dental clinic leads – {{territory}}

Hi {{contact_name}},

Just following up on the dental leads note from last week.

If the timing isn't right, no problem — just let me know and I won't follow up again. If you're still building your dental pipeline, I'm happy to share the sample batch.

{{sender_name}}`,

      endCustomerIcp: "Active dental clinic or dental group in the US. Multi-location preferred. Running practice management software (Dentrix, Eaglesoft, Carestream). HIPAA-compliant patient portal active or planned. No current MSP relationship evident from public site.",

      buyerIcp: "MSP or MSSP that specializes in dental practices or is actively building a dental vertical. Serves at least one US state or metro. Has dental-specific language on their website (HIPAA, practice management software, dental IT). Owner or BDR is accessible.",

      contactRolePriority: [
        "owner",
        "practice owner",
        "founder",
        "practice administrator",
        "office manager",
        "operations manager",
        "practice manager",
        "IT manager",
      ],

      buyerRolePriority: [
        "founder",
        "owner",
        "business development",
        "sales director",
        "partnerships",
        "marketing",
      ],

      defaultLockDays: 180,
      lockByTerritory: "state",
    },
  });

  console.log("VerticalConfig created for dental_msp_us");

  // ── Default settings ──────────────────────────────────────────────────────

  const defaultSettings = [
    {
      key: "scoring.approve_above",
      value: "90",
    },
    {
      key: "scoring.borderline_above",
      value: "75",
    },
    {
      key: "per_run.max_companies",
      value: "500",
    },
    {
      key: "per_run.max_pages",
      value: "2000",
    },
    {
      key: "per_run.max_haiku_calls",
      value: "2000",
    },
    {
      key: "per_run.max_sonnet_calls",
      value: "100",
    },
    {
      key: "per_run.sonnet_fallback_enabled",
      value: "true",
    },
    {
      key: "exclusivity.default_window_days",
      value: "180",
    },
    {
      key: "exclusivity.lock_by",
      value: "state",
    },
    {
      key: "sender.email",
      value: "outreach@proofsignallabs.com",
    },
    {
      key: "sender.name",
      value: "ProofSignal Labs",
    },
    {
      key: "sender.address",
      value: "123 Main St, Austin, TX 78701",
    },
    {
      key: "active_vertical",
      value: vertical.id,
    },
  ];

  for (const setting of defaultSettings) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`Settings: ${defaultSettings.length} defaults created`);
  console.log("\nSeed complete.");
  console.log(`\nVertical ID to use in .env.local or admin: ${vertical.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
