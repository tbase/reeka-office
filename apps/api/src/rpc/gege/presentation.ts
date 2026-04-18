import type {
  AgentProfile,
  TeamMemberBaseItem,
} from "@reeka-office/domain-agent";
import { getDesignationName } from "@reeka-office/domain-agent";
import {
  createEmptyPerformanceMetrics,
  type CurrentPerformanceMetricItem,
  type PerformanceMetrics,
} from "@reeka-office/domain-performance";
import type {
  GegeSortDirection,
  GegeTeamMemberSortField,
} from "./shared";

export type RelationLabel = "直属" | "非直属";

export interface PresentedAgentProfile extends AgentProfile {
  designationName: string | null;
}

export interface PresentedTeamMember extends TeamMemberBaseItem {
  designationName: string | null;
  relationLabel: RelationLabel;
  nsc: number;
  netCase: number;
  isQualified: boolean;
  qualifiedGap: number | null;
  isQualifiedNextMonth: boolean | null;
  qualifiedGapNextMonth: number | null;
  nscSum: number;
  netCaseSum: number;
}

export interface TeamSummary {
  memberCount: number;
  nsc: number;
  nscSum: number;
  netCase: number;
  netCaseSum: number;
  qualifiedCount: number;
}

export interface TeamMemberSort {
  field: GegeTeamMemberSortField;
  direction: GegeSortDirection;
}

export function getRelationLabel(hierarchy: number): RelationLabel {
  return hierarchy === 1 ? "直属" : "非直属";
}

export function presentAgentProfile(agent: AgentProfile): PresentedAgentProfile {
  return {
    ...agent,
    designationName: getDesignationName(agent.designation),
  };
}

export function createMetricsMap(items: CurrentPerformanceMetricItem[]): Map<string, PerformanceMetrics> {
  return new Map(
    items.map((item) => [
      item.agentCode,
      {
        nsc: item.nsc,
        nscSum: item.nscSum,
        netCase: item.netCase,
        netCaseSum: item.netCaseSum,
        isQualified: item.isQualified,
        qualifiedGap: item.qualifiedGap,
        netAfyp: item.netAfyp,
        netAfypSum: item.netAfypSum,
        netAfycSum: item.netAfycSum,
        nscHp: item.nscHp,
        nscHpSum: item.nscHpSum,
        netAfypHp: item.netAfypHp,
        netAfypHpSum: item.netAfypHpSum,
        netAfypH: item.netAfypH,
        netAfypHSum: item.netAfypHSum,
        netCaseH: item.netCaseH,
        netCaseHSum: item.netCaseHSum,
        renewalRateTeam: item.renewalRateTeam,
        isQualifiedNextMonth: item.isQualifiedNextMonth,
        qualifiedGapNextMonth: item.qualifiedGapNextMonth,
      },
    ]),
  );
}

export function getMetrics(
  metricsMap: Map<string, PerformanceMetrics>,
  agentCode: string,
): PerformanceMetrics {
  return metricsMap.get(agentCode) ?? createEmptyPerformanceMetrics();
}

export function presentTeamMembers(
  members: TeamMemberBaseItem[],
  metricsMap: Map<string, PerformanceMetrics>,
): PresentedTeamMember[] {
  return members.map((member) => {
    const metrics = getMetrics(metricsMap, member.agentCode);

    return {
      ...member,
      designationName: getDesignationName(member.designation),
      relationLabel: getRelationLabel(member.hierarchy),
      nsc: metrics.nsc,
      netCase: metrics.netCase,
      isQualified: metrics.isQualified,
      qualifiedGap: metrics.qualifiedGap,
      isQualifiedNextMonth: metrics.isQualifiedNextMonth,
      qualifiedGapNextMonth: metrics.qualifiedGapNextMonth,
      nscSum: metrics.nscSum,
      netCaseSum: metrics.netCaseSum,
    };
  });
}

function compareByDirection(
  left: number,
  right: number,
  direction: GegeSortDirection,
): number {
  return direction === "asc"
    ? left - right
    : right - left;
}

function compareNullableNumber(
  left: number | null,
  right: number | null,
  direction: GegeSortDirection,
): number {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  return compareByDirection(left, right, direction);
}

export function sortPresentedTeamMembersByDefault(
  members: PresentedTeamMember[],
): PresentedTeamMember[] {
  return [...members].sort((left, right) => {
    if (Number(left.isQualified) !== Number(right.isQualified)) {
      return Number(left.isQualified) - Number(right.isQualified);
    }

    if (left.nsc !== right.nsc) {
      return right.nsc - left.nsc;
    }

    if (left.netCase !== right.netCase) {
      return right.netCase - left.netCase;
    }

    return left.agentCode.localeCompare(right.agentCode);
  });
}

export function sortPresentedTeamMembers(
  members: PresentedTeamMember[],
  sort: TeamMemberSort,
): PresentedTeamMember[] {
  return [...members].sort((left, right) => {
    const primaryComparison = sort.field === "designation"
      ? compareNullableNumber(left.designation, right.designation, sort.direction)
      : sort.field === "nsc"
        ? compareByDirection(left.nsc, right.nsc, sort.direction)
        : sort.field === "nscSum"
          ? compareByDirection(left.nscSum, right.nscSum, sort.direction)
          : sort.field === "netCase"
            ? compareByDirection(left.netCase, right.netCase, sort.direction)
            : compareByDirection(left.netCaseSum, right.netCaseSum, sort.direction);

    if (primaryComparison !== 0) {
      return primaryComparison;
    }

    return left.agentCode.localeCompare(right.agentCode);
  });
}

export function summarizeTeamMembers(members: PresentedTeamMember[]): TeamSummary {
  return members.reduce<TeamSummary>((summary, member) => ({
    memberCount: summary.memberCount + 1,
    nsc: summary.nsc + member.nsc,
    nscSum: summary.nscSum + member.nscSum,
    netCase: summary.netCase + member.netCase,
    netCaseSum: summary.netCaseSum + member.netCaseSum,
    qualifiedCount: summary.qualifiedCount + (member.isQualified ? 1 : 0),
  }), {
    memberCount: 0,
    nsc: 0,
    nscSum: 0,
    netCase: 0,
    netCaseSum: 0,
    qualifiedCount: 0,
  });
}

export function resolveYear(
  availableYears: number[],
  requestedYear: number | undefined,
  fallbackPeriod: { year: number } | null,
): number {
  if (
    typeof requestedYear === "number"
    && Number.isInteger(requestedYear)
    && availableYears.includes(requestedYear)
  ) {
    return requestedYear;
  }

  return availableYears[0] ?? fallbackPeriod?.year ?? new Date().getFullYear();
}
