// LPR动态配置 - 房贷计算器
// 集中管理商业贷款和公积金贷款的利率配置
// 更新此文件即可修改全站默认利率

window.RATE_CONFIG = {
  // 当前利率配置
  commercial_rate: 3.25,      // 商业贷款基准利率 (%)
  paf_rate: 2.6,           // 公积金贷款基准利率 (%)

  // 提示文案
  commercial_hint: "最新基准: 3.25%",
  paf_hint: "最新基准: 2.6%",

  // 元数据
  last_updated: "2026-04-11",
  source: "manual-config",

  // 说明
  note: "数据仅供参考，实际利率以银行审批为准。当前默认参考值按首套5年以上个人住房公积金贷款利率设置"
};