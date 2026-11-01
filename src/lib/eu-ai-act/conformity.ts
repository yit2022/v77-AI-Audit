export type ConformityStepStatus = "not_started" | "in_progress" | "done" | "blocked";

export type ConformityStep = {
  id: string;
  title: string;
  article: string;
  detail: string;
};

export const CONFORMITY_STEPS: ConformityStep[] = [
  {
    id: "c_classify",
    title: "Confirm risk classification",
    article: "Arts. 5–6 / Annex III",
    detail: "Document why the system is high-risk (or out of scope) with questionnaire evidence.",
  },
  {
    id: "c_qms",
    title: "Quality management system evidence",
    article: "Art. 17",
    detail: "QMS procedures covering design, testing, post-market monitoring and serious-incident handling.",
  },
  {
    id: "c_techdoc",
    title: "Annex IV technical documentation complete",
    article: "Art. 11 / Annex IV",
    detail: "All Annex IV sections drafted, reviewed and version-controlled.",
  },
  {
    id: "c_dataset",
    title: "Data governance pack",
    article: "Art. 10",
    detail: "Dataset cards, bias testing and representativeness analysis attached as evidence.",
  },
  {
    id: "c_assessment_route",
    title: "Select conformity assessment route",
    article: "Art. 43",
    detail: "Internal control (Annex VI) or notified-body involvement (Annex VII) as applicable.",
  },
  {
    id: "c_eu_doi",
    title: "EU declaration of conformity drafted",
    article: "Art. 47",
    detail: "Declaration drawn up and retained; CE marking plan agreed.",
  },
  {
    id: "c_registration",
    title: "EU database registration",
    article: "Art. 49",
    detail: "Register the system in the EU database before placing on the market / putting into service where required.",
  },
  {
    id: "c_postmarket",
    title: "Post-market monitoring plan",
    article: "Art. 72",
    detail: "Post-market monitoring system documented and scheduled.",
  },
];
