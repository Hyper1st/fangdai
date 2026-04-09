// 房贷计算器 - 现代交互层 v1.0
// 使用 Zepto 和原始计算器逻辑

(function() {
  'use strict';

  // 全局状态
  const App = {
    // 从原始计算器继承的全局变量
    loanType: 0, // 0=商业, 1=公积金, 2=组合
    loanPeriods: 240, // 贷款期数（月）
    businessPeriodType: 4,
    PAFPeriodType: 1,
    businessRateType: 12,
    PAFRateType: 12,
    businessDiscount: 1,
    simpleDataTableMaxLines: 10,

    // 当前还款方式：1=等额本息, 2=等额本金
    repayMethod: 1,

    // DOM 元素缓存
    elements: {},

    // 利率数组（从原始文件复制，确保一致性）
    businessShortRateArr6: [5.1, 5.35, 5.6, 5.85, 6.1, 5.85, 5.6, 5.6, 5.35, 5.1, 4.85, 4.6, 3.45],
    businessShortRateArr12: [5.56, 5.81, 6.06, 6.31, 6.56, 6.31, 6, 5.6, 5.35, 5.1, 4.85, 4.6, 3.45],
    businessShortRateArr36: [5.6, 5.85, 6.1, 6.4, 6.65, 6.4, 6.15, 6, 5.75, 5.5, 5.25, 5, 3.45],
    businessShortRateArr60: [5.96, 6.22, 6.45, 6.65, 6.9, 6.65, 6.4, 6, 5.75, 5.5, 5.25, 5, 4.2],
    businessLongRateArr: [6.14, 6.4, 6.6, 6.8, 7.05, 6.8, 6.55, 6.15, 5.9, 5.65, 5.4, 5.15, 4.2],
    PAFShortRateArr: [3.5, 3.75, 4, 4.2, 4.45, 4.2, 4, 3.75, 3.5, 3.25, 3, 2.75, 2.75],
    PAFLongRateArr: [4.05, 4.3, 4.5, 4.7, 4.45, 4.7, 4.5, 4.25, 4, 3.75, 3.5, 3.25, 3.25],

    // 初始化
    init: function() {
      this.cacheElements();
      this.bindEvents();
      this.updateUI();
      this.calculate();
    },

    // 缓存DOM元素
    cacheElements: function() {
      this.elements = {
        // 贷款类型
        loanTypeBtns: document.querySelectorAll('.loan-type-btn'),

        // 输入字段
        businessAmount: document.getElementById('business-amount'),
        pafAmount: document.getElementById('paf-amount'),
        loanYears: document.getElementById('loan-years'),
        businessRate: document.getElementById('business-rate'),
        pafRate: document.getElementById('paf-rate'),

        // 还款方式
        repayBtns: document.querySelectorAll('.repayment-btn'),

        // 结果区域
        monthlyPayment: document.getElementById('monthly-payment'),
        totalInterest: document.getElementById('total-interest'),
        totalRepayment: document.getElementById('total-repayment'),
        interestRate: document.getElementById('interest-rate'),

        // 详细结果
        resultBusinessInterest: document.getElementById('result-business-interest'),
        resultPafInterest: document.getElementById('result-paf-interest'),
        resultDetailsBody: document.getElementById('result-details-body'),

        // 状态消息
        statusMessage: document.getElementById('status-message')
      };
    },

    // 绑定事件
    bindEvents: function() {
      // 贷款类型切换
      this.elements.loanTypeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.setLoanType(parseInt(e.target.dataset.type));
        });
      });

      // 还款方式切换
      this.elements.repayBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.setRepayMethod(parseInt(e.target.dataset.method));
        });
      });

      // 输入变化实时计算
      const inputs = [
        this.elements.businessAmount,
        this.elements.pafAmount,
        this.elements.loanYears,
        this.elements.businessRate,
        this.elements.pafRate
      ];

      inputs.forEach(input => {
        if (input) {
          input.addEventListener('input', () => this.calculate());
          input.addEventListener('change', () => this.calculate());
        }
      });

      // 贷款年限变化时更新利率
      if (this.elements.loanYears) {
        this.elements.loanYears.addEventListener('change', () => this.updateRateByTerm());
      }
    },

    // 设置贷款类型
    setLoanType: function(type) {
      this.loanType = type;

      // 更新按钮状态
      this.elements.loanTypeBtns.forEach(btn => {
        const btnType = parseInt(btn.dataset.type);
        if (btnType === type) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // 更新输入字段显示
      this.updateUI();
      this.calculate();
    },

    // 设置还款方式
    setRepayMethod: function(method) {
      this.repayMethod = method;

      // 更新按钮状态
      this.elements.repayBtns.forEach(btn => {
        const btnMethod = parseInt(btn.dataset.method);
        if (btnMethod === method) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      this.calculate();
    },

    // 更新UI显示/隐藏相关字段
    updateUI: function() {
      // 根据贷款类型显示/隐藏字段
      const businessFields = document.querySelectorAll('.business-field');
      const pafFields = document.querySelectorAll('.paf-field');

      switch (this.loanType) {
        case 0: // 商业贷款
          businessFields.forEach(field => field.style.display = 'block');
          pafFields.forEach(field => field.style.display = 'none');
          break;
        case 1: // 公积金贷款
          businessFields.forEach(field => field.style.display = 'none');
          pafFields.forEach(field => field.style.display = 'block');
          break;
        case 2: // 组合贷款
          businessFields.forEach(field => field.style.display = 'block');
          pafFields.forEach(field => field.style.display = 'block');
          break;
      }
    },

    // 根据贷款年限更新利率
    updateRateByTerm: function() {
      if (!this.elements.loanYears || !this.elements.businessRate) return;

      const years = parseInt(this.elements.loanYears.value);
      let rate = 4.2; // 默认值

      // 简单逻辑：根据年限设置基准利率
      if (years <= 5) {
        rate = 4.2;
      } else if (years <= 10) {
        rate = 4.5;
      } else {
        rate = 4.8;
      }

      this.elements.businessRate.value = rate;
      this.calculate();
    },

    // 验证输入
    validateInputs: function() {
      let isValid = true;
      const errors = [];

      // 验证商业贷款金额
      if (this.loanType === 0 || this.loanType === 2) {
        const businessAmount = parseFloat(this.elements.businessAmount.value);
        if (isNaN(businessAmount) || businessAmount <= 0 || businessAmount > 10000) {
          isValid = false;
          errors.push('商业贷款金额需在1-10000万元之间');
          this.elements.businessAmount.classList.add('invalid');
        } else {
          this.elements.businessAmount.classList.remove('invalid');
        }

        // 验证商业贷款利率
        const businessRate = parseFloat(this.elements.businessRate.value);
        if (isNaN(businessRate) || businessRate < 0 || businessRate > 20) {
          isValid = false;
          errors.push('商业贷款利率需在0-20%之间');
          this.elements.businessRate.classList.add('invalid');
        } else {
          this.elements.businessRate.classList.remove('invalid');
        }
      }

      // 验证公积金贷款金额
      if (this.loanType === 1 || this.loanType === 2) {
        const pafAmount = parseFloat(this.elements.pafAmount.value);
        if (isNaN(pafAmount) || pafAmount <= 0 || pafAmount > 10000) {
          isValid = false;
          errors.push('公积金贷款金额需在1-10000万元之间');
          this.elements.pafAmount.classList.add('invalid');
        } else {
          this.elements.pafAmount.classList.remove('invalid');
        }

        // 验证公积金利率
        const pafRate = parseFloat(this.elements.pafRate.value);
        if (isNaN(pafRate) || pafRate <= 0 || pafRate > 10) {
          isValid = false;
          errors.push('公积金贷款利率需在0.01-10%之间');
          this.elements.pafRate.classList.add('invalid');
        } else {
          this.elements.pafRate.classList.remove('invalid');
        }
      }

      // 验证贷款年限
      const loanYears = parseInt(this.elements.loanYears.value);
      if (isNaN(loanYears) || loanYears < 1 || loanYears > 30) {
        isValid = false;
        errors.push('贷款年限需在1-30年之间');
        this.elements.loanYears.classList.add('invalid');
      } else {
        this.elements.loanYears.classList.remove('invalid');
      }

      // 更新状态消息
      this.updateStatusMessage(isValid, errors);

      return isValid;
    },

    // 更新状态消息
    updateStatusMessage: function(isValid, errors) {
      if (!this.elements.statusMessage) return;

      if (isValid) {
        this.elements.statusMessage.className = 'status-message info';
        this.elements.statusMessage.innerHTML = '输入有效，实时计算中...';
      } else {
        this.elements.statusMessage.className = 'status-message warning';
        this.elements.statusMessage.innerHTML = errors.join('<br>');
      }
    },

    // 主要计算函数
    calculate: function() {
      // 验证输入
      if (!this.validateInputs()) {
        this.showEmptyState();
        return;
      }

      // 获取输入值
      const businessAmount = this.loanType !== 1 ? parseFloat(this.elements.businessAmount.value) * 10000 : 0;
      const pafAmount = this.loanType !== 0 ? parseFloat(this.elements.pafAmount.value) * 10000 : 0;
      const loanYears = parseInt(this.elements.loanYears.value);
      const businessRate = this.loanType !== 1 ? parseFloat(this.elements.businessRate.value) / 100 / 12 : 0;
      const pafRate = this.loanType !== 0 ? parseFloat(this.elements.pafRate.value) / 100 / 12 : 0;
      const months = loanYears * 12;

      // 更新全局变量（与旧计算器兼容）
      window.loanType = this.loanType;
      window.loanPeriods = months;

      let result = {};

      if (this.repayMethod === 1) {
        // 等额本息
        result = this.calculateDebx(businessAmount, businessRate, pafAmount, pafRate, months);
      } else {
        // 等额本金
        result = this.calculateDebj(businessAmount, businessRate, pafAmount, pafRate, months);
      }

      // 更新结果显示
      this.updateResults(result);
    },

    // 等额本息计算
    calculateDebx: function(businessAmount, businessRate, pafAmount, pafRate, months) {
      let result = {
        monthlyPayment: 0,
        totalInterest: 0,
        totalRepayment: 0,
        businessInterest: 0,
        pafInterest: 0,
        details: []
      };

      // 计算商业贷款部分
      if (businessAmount > 0) {
        let monthly, totalRepay, interest;

        if (businessRate > 0) {
          // 正常利率计算
          monthly = businessAmount * businessRate * Math.pow(1 + businessRate, months) /
                   (Math.pow(1 + businessRate, months) - 1);
          totalRepay = monthly * months;
          interest = totalRepay - businessAmount;
        } else {
          // 0利率特殊情况：月供 = 本金 / 月数，利息为0
          monthly = businessAmount / months;
          totalRepay = businessAmount;
          interest = 0;
        }

        result.businessInterest = Math.round(interest * 100) / 100;
        result.monthlyPayment += monthly;
        result.totalInterest += interest;
        result.totalRepayment += totalRepay;
      }

      // 计算公积金贷款部分
      if (pafAmount > 0) {
        let monthly, totalRepay, interest;

        if (pafRate > 0) {
          // 正常利率计算
          monthly = pafAmount * pafRate * Math.pow(1 + pafRate, months) /
                   (Math.pow(1 + pafRate, months) - 1);
          totalRepay = monthly * months;
          interest = totalRepay - pafAmount;
        } else {
          // 0利率特殊情况：月供 = 本金 / 月数，利息为0
          monthly = pafAmount / months;
          totalRepay = pafAmount;
          interest = 0;
        }

        result.pafInterest = Math.round(interest * 100) / 100;
        result.monthlyPayment += monthly;
        result.totalInterest += interest;
        result.totalRepayment += totalRepay;
      }

      // 计算详细还款表（前12期）
      result.details = this.generateRepaymentDetails(
        businessAmount, businessRate, pafAmount, pafRate, months,
        result.monthlyPayment, 'debx'
      );

      // 四舍五入到2位小数
      result.monthlyPayment = Math.round(result.monthlyPayment * 100) / 100;
      result.totalInterest = Math.round(result.totalInterest * 100) / 100;
      result.totalRepayment = Math.round(result.totalRepayment * 100) / 100;

      return result;
    },

    // 等额本金计算
    calculateDebj: function(businessAmount, businessRate, pafAmount, pafRate, months) {
      let result = {
        monthlyPayment: 0,
        totalInterest: 0,
        totalRepayment: 0,
        businessInterest: 0,
        pafInterest: 0,
        details: []
      };

      // 计算商业贷款部分
      if (businessAmount > 0 && businessRate > 0) {
        const monthlyPrincipal = businessAmount / months;
        // 使用公式计算总利息：本金 × 月利率 × (还款月数 + 1) ÷ 2
        const totalInterest = businessAmount * businessRate * (months + 1) / 2;
        // 首月月供 = 每月应还本金 + (贷款总额 × 月利率)
        const firstMonthPayment = monthlyPrincipal + businessAmount * businessRate;

        result.businessInterest = Math.round(totalInterest * 100) / 100;
        result.monthlyPayment += firstMonthPayment; // 等额本金显示第一个月还款
        result.totalInterest += totalInterest;
        result.totalRepayment += businessAmount + totalInterest;
      }

      // 计算公积金贷款部分
      if (pafAmount > 0 && pafRate > 0) {
        const monthlyPrincipal = pafAmount / months;
        // 使用公式计算总利息：本金 × 月利率 × (还款月数 + 1) ÷ 2
        const totalInterest = pafAmount * pafRate * (months + 1) / 2;
        // 首月月供 = 每月应还本金 + (贷款总额 × 月利率)
        const firstMonthPayment = monthlyPrincipal + pafAmount * pafRate;

        result.pafInterest = Math.round(totalInterest * 100) / 100;
        result.monthlyPayment += firstMonthPayment;
        result.totalInterest += totalInterest;
        result.totalRepayment += pafAmount + totalInterest;
      }

      // 计算详细还款表（前12期）
      result.details = this.generateRepaymentDetails(
        businessAmount, businessRate, pafAmount, pafRate, months,
        0, 'debj'
      );

      // 四舍五入到2位小数
      result.monthlyPayment = Math.round(result.monthlyPayment * 100) / 100;
      result.totalInterest = Math.round(result.totalInterest * 100) / 100;
      result.totalRepayment = Math.round(result.totalRepayment * 100) / 100;

      return result;
    },

    // 生成还款明细表
    generateRepaymentDetails: function(businessAmount, businessRate, pafAmount, pafRate, months, monthlyPayment, method) {
      const details = [];
      const showMonths = Math.min(12, months);

      for (let i = 1; i <= showMonths; i++) {
        let monthDetail = {
          month: i,
          principal: 0,
          interest: 0,
          total: 0,
          remaining: 0
        };

        // 商业贷款部分
        if (businessAmount > 0 && businessRate > 0) {
          if (method === 'debx') {
            // 等额本息
            const interest = businessAmount * businessRate *
                           (Math.pow(1 + businessRate, months) - Math.pow(1 + businessRate, i - 1)) /
                           (Math.pow(1 + businessRate, months) - 1);
            const principal = (businessAmount * businessRate * Math.pow(1 + businessRate, months) /
                            (Math.pow(1 + businessRate, months) - 1)) - interest;
            const remaining = businessAmount * (Math.pow(1 + businessRate, months) - Math.pow(1 + businessRate, i)) /
                            (Math.pow(1 + businessRate, months) - 1);

            monthDetail.interest += Math.round(interest * 100) / 100;
            monthDetail.principal += Math.round(principal * 100) / 100;
            monthDetail.remaining += Math.round(remaining * 100) / 100;
          } else {
            // 等额本金
            const monthlyPrincipal = businessAmount / months;
            const interest = (businessAmount - (i - 1) * monthlyPrincipal) * businessRate;

            monthDetail.principal += Math.round(monthlyPrincipal * 100) / 100;
            monthDetail.interest += Math.round(interest * 100) / 100;
            monthDetail.remaining += Math.round((businessAmount - i * monthlyPrincipal) * 100) / 100;
          }
        }

        // 公积金贷款部分
        if (pafAmount > 0 && pafRate > 0) {
          if (method === 'debx') {
            // 等额本息
            const interest = pafAmount * pafRate *
                           (Math.pow(1 + pafRate, months) - Math.pow(1 + pafRate, i - 1)) /
                           (Math.pow(1 + pafRate, months) - 1);
            const principal = (pafAmount * pafRate * Math.pow(1 + pafRate, months) /
                            (Math.pow(1 + pafRate, months) - 1)) - interest;
            const remaining = pafAmount * (Math.pow(1 + pafRate, months) - Math.pow(1 + pafRate, i)) /
                            (Math.pow(1 + pafRate, months) - 1);

            monthDetail.interest += Math.round(interest * 100) / 100;
            monthDetail.principal += Math.round(principal * 100) / 100;
            monthDetail.remaining += Math.round(remaining * 100) / 100;
          } else {
            // 等额本金
            const monthlyPrincipal = pafAmount / months;
            const interest = (pafAmount - (i - 1) * monthlyPrincipal) * pafRate;

            monthDetail.principal += Math.round(monthlyPrincipal * 100) / 100;
            monthDetail.interest += Math.round(interest * 100) / 100;
            monthDetail.remaining += Math.round((pafAmount - i * monthlyPrincipal) * 100) / 100;
          }
        }

        monthDetail.total = Math.round((monthDetail.principal + monthDetail.interest) * 100) / 100;
        details.push(monthDetail);
      }

      return details;
    },

    // 更新结果显示
    updateResults: function(result) {
      // 更新主要结果卡片
      if (this.elements.monthlyPayment) {
        const paymentLabel = this.repayMethod === 1 ? '月供' : '首月月供';
        this.elements.monthlyPayment.innerHTML = `
          <div class="value">${result.monthlyPayment.toLocaleString('zh-CN')} 元</div>
          <div class="label">${paymentLabel}</div>
        `;
      }

      if (this.elements.totalInterest) {
        this.elements.totalInterest.innerHTML = `
          <div class="value">${result.totalInterest.toLocaleString('zh-CN')} 元</div>
          <div class="label">总利息</div>
        `;
      }

      if (this.elements.totalRepayment) {
        this.elements.totalRepayment.innerHTML = `
          <div class="value">${result.totalRepayment.toLocaleString('zh-CN')} 元</div>
          <div class="label">总还款额</div>
        `;
      }

      // 更新分项利息（组合贷款时显示）
      if (this.loanType === 2) {
        if (this.elements.resultBusinessInterest) {
          this.elements.resultBusinessInterest.textContent = `${result.businessInterest.toLocaleString('zh-CN')} 元`;
          this.elements.resultBusinessInterest.parentElement.style.display = 'block';
        }
        if (this.elements.resultPafInterest) {
          this.elements.resultPafInterest.textContent = `${result.pafInterest.toLocaleString('zh-CN')} 元`;
          this.elements.resultPafInterest.parentElement.style.display = 'block';
        }
      } else {
        if (this.elements.resultBusinessInterest) {
          this.elements.resultBusinessInterest.parentElement.style.display = 'none';
        }
        if (this.elements.resultPafInterest) {
          this.elements.resultPafInterest.parentElement.style.display = 'none';
        }
      }

      // 更新详细还款表
      if (this.elements.resultDetailsBody) {
        let html = '';
        result.details.forEach(detail => {
          html += `
            <tr>
              <td>第${detail.month}期</td>
              <td>${detail.total.toLocaleString('zh-CN')}</td>
              <td>${detail.interest.toLocaleString('zh-CN')}</td>
              <td>${detail.principal.toLocaleString('zh-CN')}</td>
              <td>${detail.remaining.toLocaleString('zh-CN')}</td>
            </tr>
          `;
        });
        this.elements.resultDetailsBody.innerHTML = html;
      }

      // 更新状态消息
      if (this.elements.statusMessage) {
        this.elements.statusMessage.className = 'status-message info';
        this.elements.statusMessage.innerHTML = `计算完成。贷款期限：${parseInt(this.elements.loanYears.value)}年（${window.loanPeriods}期），还款方式：${this.repayMethod === 1 ? '等额本息' : '等额本金'}`;
      }
    },

    // 显示空状态
    showEmptyState: function() {
      // 清空结果
      const resultElements = [
        this.elements.monthlyPayment,
        this.elements.totalInterest,
        this.elements.totalRepayment,
        this.elements.resultDetailsBody
      ];

      resultElements.forEach(el => {
        if (el) el.innerHTML = '';
      });

      // 清空分项利息显示
      if (this.elements.resultBusinessInterest) {
        this.elements.resultBusinessInterest.parentElement.style.display = 'none';
      }
      if (this.elements.resultPafInterest) {
        this.elements.resultPafInterest.parentElement.style.display = 'none';
      }
    }
  };

  // 页面加载完成后初始化应用
  document.addEventListener('DOMContentLoaded', function() {
    // 确保Zepto已加载
    if (window.$) {
      App.init();
    } else {
      console.error('Zepto未加载');
    }
  });

  // 暴露App到全局（用于调试）
  window.MortgageCalculator = App;
})();