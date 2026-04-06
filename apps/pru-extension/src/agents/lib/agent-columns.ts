import { type CsvColumn } from "@/lib/csv"
import { type AgentRow } from "@/lib/pru"

const AGENT_COLUMNS: Array<CsvColumn<AgentRow> & { label: string }> = [
  { key: "agent_code", header: "agent_code", label: "代理编码" },
  { key: "pinyin", header: "pinyin", label: "拼音" },
  { key: "designation", header: "designation", label: "级别" },
  { key: "leader_code", header: "leader_code", label: "上级编码" },
  { key: "join_date", header: "join_date", label: "加入日期" },
  { key: "agency", header: "agency", label: "Agency" },
  { key: "division", header: "division", label: "Division" },
  { key: "branch", header: "branch", label: "Branch" },
  { key: "unit", header: "unit", label: "Unit" },
]

export { AGENT_COLUMNS }
