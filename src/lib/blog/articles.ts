export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingMinutes: number;
  tags: string[];
  body: string;
};

/**
 * Editorial notes: content paraphrases publicly available EU AI Act structure
 * (Regulation (EU) 2024/1689). No fabricated market statistics.
 */
export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "eu-ai-act-risk-tiers",
    title: "EU AI Act risk tiers: prohibited, high-risk, limited and minimal",
    description:
      "A practical map of the EU AI Act’s risk-based approach — what each tier means for providers and deployers.",
    publishedAt: "2026-10-15",
    readingMinutes: 8,
    tags: ["EU AI Act", "Risk classification"],
    body: `# EU AI Act risk tiers: prohibited, high-risk, limited and minimal

The EU Artificial Intelligence Act (Regulation (EU) 2024/1689) takes a **risk-based** approach. Obligations scale with the potential impact of an AI system on health, safety and fundamental rights — not with marketing labels.

This article summarises the statutory structure. It is **not legal advice**.

## Prohibited practices (Article 5)

Certain AI practices are banned in the Union market. Examples in the Act include social scoring by public authorities based on social behaviour or personal characteristics, untargeted scraping of facial images to build recognition databases, and emotion recognition in workplaces or educational institutions outside narrow exceptions. If a use case sits in Article 5, the compliance answer is not “add more documentation” — it is to stop or redesign.

## High-risk AI (Annex I and Annex III)

High-risk systems sit mainly in two buckets:

1. **Annex I** — AI used as a safety component of products already covered by Union harmonisation legislation (for example certain machinery or medical devices).
2. **Annex III** — standalone use cases the co-legislators treated as high-risk, including employment and workers’ management, creditworthiness scoring, education admission/assessment, biometrics (where not prohibited), critical infrastructure safety components, law enforcement, migration/asylum/border, and administration of justice.

High-risk providers face a dense set of duties: risk management, data governance, technical documentation, record-keeping, transparency to deployers, human oversight, accuracy/robustness/cybersecurity, and — where applicable — conformity assessment before placing on the market.

## Limited risk and transparency (Article 50)

Some systems are not Annex III high-risk but still trigger **transparency** duties: people must know they are interacting with AI; synthetic audio/image/video content must be labelled in specified cases; emotion recognition and biometric categorisation outside higher-risk contexts carry disclosure rules.

## Minimal risk

Systems that fall outside prohibited practices, high-risk annexes and Article 50 triggers remain largely unregulated under the AI Act’s product rules — though other law (GDPR, consumer, sectoral) still applies. Keeping an inventory helps you notice when a “minimal” chatbot quietly expands into employment screening or credit.

## GPAI models (Chapter V)

General-purpose AI models have their own chapter. Providers face documentation and transparency-oriented duties; models with systemic risk (including those designated by the Commission or meeting compute thresholds described in the Act) attract additional obligations.

## What to do next

1. Inventory systems and intended purposes.
2. Run a structured classification against Articles 5 / Annex III / Article 50 / Chapter V.
3. For high-risk candidates, start evidence and conformity planning early — documentation lags kill go-live dates.

V77 Trust encodes this questionnaire and control crosswalk so teams can move from a slide deck to an auditable record.
`,
  },
  {
    slug: "high-risk-obligations",
    title: "High-risk AI obligations: a deployer and provider checklist",
    description:
      "Who owes what under the EU AI Act when a system is high-risk — roles in the value chain and the core control themes.",
    publishedAt: "2026-10-22",
    readingMinutes: 9,
    tags: ["EU AI Act", "High-risk", "Governance"],
    body: `# High-risk AI obligations: a deployer and provider checklist

Once a system is **high-risk** under the EU AI Act, the hard part is operationalising Chapter III duties across the value chain. Roles matter: **provider**, **deployer**, **importer**, **distributor**, and authorised representatives each carry distinct responsibilities.

This is a practitioner checklist aligned to the Act’s themes. Confirm specifics with counsel for your facts.

## Provider-side themes

- **Risk management system** — iterative identification and mitigation of risks to health, safety and fundamental rights across the lifecycle.
- **Data and data governance** — training, validation and testing data meeting quality criteria appropriate to the intended purpose.
- **Technical documentation** — sufficient for authorities and notified bodies to assess compliance (Annex IV style content).
- **Record-keeping / logs** — automatic logging capabilities to a level that supports post-market monitoring and incident analysis.
- **Transparency to deployers** — instructions for use that enable deployers to meet their duties.
- **Human oversight** — design measures so natural persons can oversee the system effectively.
- **Accuracy, robustness, cybersecurity** — appropriate performance and resilience against errors and attacks.
- **Quality management / conformity** — procedures and, where required, third-party involvement before CE marking and placing on the market.

## Deployer-side themes

Deployers are not passive consumers. Typical expectations include:

- Using the system according to instructions for use.
- Assigning human oversight to competent people.
- Ensuring input data is relevant and sufficiently representative for the use context.
- Monitoring operation and suspending use when risk materialises.
- Keeping logs under their control for an appropriate period.
- Carrying out a **fundamental rights impact assessment** where the Act requires one for certain deployers and use cases.
- Informing workers and their representatives when high-risk AI is used in the workplace, where required.

## Evidence you will be asked for

Auditors and authorities rarely accept narrative alone. Useful artefacts include: intended-purpose statements, data lineage summaries, evaluation reports (fairness, robustness, security), oversight playbooks, change logs, and incident records. Hash-chained evidence storage helps show that artefacts were not silently rewritten after an incident.

## Sequencing that works in practice

1. Freeze intended purpose and role (provider vs deployer).
2. Classify against Annex III / Annex I.
3. Open a conformity / FRIA workstream in parallel with engineering.
4. Attach evidence to each control — not a single PDF dump at the end.
5. Reassess when purpose, model or population shifts.

V77 Trust’s assessment, evidence vault, FRIA/DPIA templates and auditor workspace are built around that sequence.
`,
  },
  {
    slug: "gpai-transparency",
    title: "GPAI and transparency: Chapter V and Article 50 without the noise",
    description:
      "How general-purpose AI model duties relate to system-level transparency rules — and what product teams should document first.",
    publishedAt: "2026-10-29",
    readingMinutes: 7,
    tags: ["EU AI Act", "GPAI", "Transparency"],
    body: `# GPAI and transparency: Chapter V and Article 50 without the noise

Teams often conflate **general-purpose AI (GPAI) model** rules with **AI system** transparency rules. The EU AI Act separates them: Chapter V addresses GPAI **models**; Article 50 addresses certain **systems** that interact with people or generate synthetic content.

## GPAI models (Chapter V)

A GPAI model is trained on broad data at scale and can be adapted to a wide range of distinct tasks. Providers of such models face obligations oriented around:

- Drawing up and keeping up-to-date technical documentation.
- Making information available to AI system providers who integrate the model.
- Putting in place a policy to respect Union copyright law.
- Publishing a sufficiently detailed summary about the content used for training (as specified by the Act and related guidance).

**Systemic-risk** GPAI models — including those designated by the European Commission or meeting the Act’s compute-related criteria — face additional evaluation, risk mitigation, incident reporting and cybersecurity-oriented duties. Exact thresholds and designations evolve through implementing acts and Commission decisions; treat compute cut-offs as regulatory facts to verify, not marketing claims.

## System transparency (Article 50)

Independently of whether a foundation model sits underneath, certain **systems** must:

- Inform people that they are interacting with an AI system (unless obvious).
- Mark synthetic audio, image, video or text content as artificially generated or manipulated in the cases the Act covers.
- Disclose emotion recognition or biometric categorisation systems to the people exposed, outside higher-risk regimes that may prohibit or further regulate those uses.

Deepfake-style content used in contexts such as informing the public on matters of public interest attracts specific labelling rules under the Act.

## Practical documentation starters

1. **Model card / system card** — intended use, out-of-scope uses, evaluation summary, known limitations.
2. **Integration note** — which GPAI model versions power which systems.
3. **Disclosure UX** — where users see “you are chatting with AI” and how synthetic media is labelled.
4. **Change log** — model upgrades that may change behaviour or risk tier of the downstream system.

None of this replaces legal classification. It does give auditors a place to start.

V77 Trust includes model-card editing, vendor questionnaires for third-party model providers, and transparency-oriented control mappings so GPAI and Article 50 work does not live only in slideware.
`,
  },
];

export function getArticle(slug: string) {
  return BLOG_ARTICLES.find((a) => a.slug === slug) || null;
}
