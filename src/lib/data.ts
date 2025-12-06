export interface TimelineEvent {
  time: string;
  title: string;
  detail: string;
  state: "on-track" | "at-risk" | "complete";
}

export const gatewayTimeline: TimelineEvent[] = [
  {
    time: "08:30",
    title: "Materials payload → Procurement Cloud",
    detail: "1,642 rows transformed · cycle id #PN-4416",
    state: "complete",
  },
  {
    time: "10:05",
    title: "Payroll hours → EcoTek Staffing",
    detail: "In-flight · 14 mins remaining",
    state: "on-track",
  },
  {
    time: "12:40",
    title: "Safety audits → Analytics Lakehouse",
    detail: "Schema drift detected on field `inspector_notes`",
    state: "at-risk",
  },
];

export interface SpotlightTask {
  title: string;
  detail: string;
  eta: string;
  badge: string;
}

export const spotlightTasks: SpotlightTask[] = [
  {
    title: "Gateway tenant provisioning",
    detail: "Issuing credentials for Lumen Design’s sandbox environment.",
    eta: "Due today · 17:30 CST",
    badge: "High priority",
  },
  {
    title: "Secure webhook rotation",
    detail: "Rotate keys for upstream asset tracker before public launch.",
    eta: "Scheduled · Tomorrow 09:00",
    badge: "Change window",
  },
];

export const analyticsInsights = [
  "F-11B improves elastic recovery by +3% vs F-12A at the same EcoCap loading.",
  "Storability deviations on F-10C exceed the Korean 5% limit in several batches.",
  "Reducing reagent to 1.2% retains recovery performance while improving solubility.",
];
