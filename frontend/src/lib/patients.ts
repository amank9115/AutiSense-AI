import type { ChildProfile } from "@/services/api/screeningApi";

/** A child profile enriched with screening history, as shown in the patient list. */
export interface PatientRecord extends ChildProfile {
  screeningSessions?: {
    id: string;
    status: string;
    createdAt: string;
    results?: {
      riskLevel: string;
    };
  }[];
  parent?: {
    name: string;
  };
}

export interface PatientFilters {
  searchTerm: string;
  /** Risk level or "All". */
  riskFilter: string;
  /** Status or "All". */
  statusFilter: string;
}

/**
 * Filters patient records by free-text search, risk level and status.
 *
 * Pure function — extracted from the patients page so the matching rules can be
 * unit tested without rendering the component.
 */
export function filterPatients(
  patients: PatientRecord[],
  { searchTerm, riskFilter, statusFilter }: PatientFilters,
): PatientRecord[] {
  const term = searchTerm.toLowerCase();

  return patients.filter((patient) => {
    const latestSession = patient.screeningSessions?.[0];
    const riskLevel = latestSession?.results?.riskLevel || "none";
    const status = latestSession?.status || "none";

    const matchesSearch =
      patient.name.toLowerCase().includes(term) ||
      patient.parent?.name?.toLowerCase().includes(term) ||
      patient.id.toLowerCase().includes(term);

    const matchesRisk =
      riskFilter === "All" || riskLevel.toLowerCase() === riskFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "All" || status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRisk && matchesStatus;
  });
}
