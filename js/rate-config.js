// LPR动态配置 - 房贷计算器
// 集中管理商业贷款和公积金贷款的利率配置
// 此文件由自动化脚本生成

window.RATE_CONFIG = {
  // 当前利率配置
  commercial_rate: 3.5,      // 商业贷款基准利率 (%)
  paf_rate: 3.25,           // 公积金贷款基准利率 (%)

  // 提示文案
  commercial_hint: "最新基准: 3.5%",
  paf_hint: "最新基准: 3.25%",

  // 元数据
  last_updated: "2026-03-20",
  source: "tushare-auto",
  // LPR原始数据（仅供调试）
  lpr_5y: 3.5,      // 5年期LPR原始值
  lpr_1y: 3.0,      // 1年期LPR原始值

  // 说明
  note: "数据仅供参考，实际利率以银行审批为准"
};
