import { type PreviewTableColumn } from "@/components/preview-table"
import { type SalesMonthRow } from "@/lib/pru"

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

function formatAssignedMoney(value: number, assigned: number) {
  const base = formatMoney(value)

  if (!assigned) {
    return base
  }

  return `${base} +${formatMoney(assigned)}`
}

function formatAssignedCount(value: number, assigned: number) {
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  const base = formatter.format(value / 100)

  if (!assigned) {
    return base
  }

  return `${base} +${formatter.format(assigned / 100)}`
}

function formatRate(value: number) {
  return `${(value / 100).toFixed(2)}%`
}

const SALES_TABLE_COLUMNS: PreviewTableColumn<SalesMonthRow>[] = [
  { key: "month", label: "MONTH" },
  { key: "agent_code", label: "AGENT CODE" },
  {
    key: "nsc",
    label: "NSC",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp",
    label: "AFYP",
    format: (value, row) => formatAssignedMoney(value as number, row.net_afyp_assigned),
  },
  {
    key: "nsc_hp",
    label: "NSC HP",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_hp",
    label: "AFYP HP",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_h",
    label: "AFYP H",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_case",
    label: "Case",
    format: (value, row) => formatAssignedMoney(value as number, row.net_case_assigned),
  },
  {
    key: "net_case_h",
    label: "CASE H",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "is_qualified",
    label: "QHC",
    format: (value, row) => formatAssignedCount(value as number, row.is_qualified_assigned),
  },
  {
    key: "nsc_sum",
    label: "NSC Sum",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_sum",
    label: "AFYP SUM",
    format: (value, row) => formatAssignedMoney(value as number, row.net_afyp_assigned_sum),
  },
  {
    key: "nsc_hp_sum",
    label: "NSC HP SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_hp_sum",
    label: "AFYP HP SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_h_sum",
    label: "AFYP H SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_case_sum",
    label: "CASE SUM",
    format: (value, row) => formatAssignedMoney(value as number, row.net_case_assigned_sum),
  },
  {
    key: "net_case_h_sum",
    label: "CASE H SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyc_sum",
    label: "AFYC SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "renewal_rate_team",
    label: "RENEWAL RATE TEAM",
    format: (value) => formatRate(value as number),
  },
]

function serializeSalesMonthRow(row: SalesMonthRow) {
  return {
    month: row.month,
    year: row.year,
    agent_code: row.agent_code,
    pinyin: row.pinyin,
    net_afyp: row.net_afyp,
    net_afyp_assigned: row.net_afyp_assigned,
    net_case: row.net_case,
    net_case_assigned: row.net_case_assigned,
    nsc: row.nsc,
    is_qualified: row.is_qualified,
    is_qualified_assigned: row.is_qualified_assigned,
    net_afyp_sum: row.net_afyp_sum,
    net_afyp_assigned_sum: row.net_afyp_assigned_sum,
    net_case_sum: row.net_case_sum,
    net_case_assigned_sum: row.net_case_assigned_sum,
    nsc_sum: row.nsc_sum,
    net_afyc_sum: row.net_afyc_sum,
    nsc_hp: row.nsc_hp,
    nsc_hp_sum: row.nsc_hp_sum,
    net_afyp_hp: row.net_afyp_hp,
    net_afyp_hp_sum: row.net_afyp_hp_sum,
    net_afyp_h: row.net_afyp_h,
    net_afyp_h_sum: row.net_afyp_h_sum,
    net_case_h: row.net_case_h,
    net_case_h_sum: row.net_case_h_sum,
    renewal_rate_team: row.renewal_rate_team,
  }
}

export { SALES_TABLE_COLUMNS, serializeSalesMonthRow }
