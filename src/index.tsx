import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/faq-data.json', serveStatic({ root: './public' }))


app.get('/exchange', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>실시간 환전 · USDT 거래 - 크로스보더</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
      :root {
        --color-primary: #0F172A;
        --color-secondary: #1E293B;
        --color-accent: #FF7A00;
        --color-success: #10B981;
        --color-warning: #F59E0B;
      }
      
      body {
        font-family: 'Inter', 'Noto Sans KR', sans-serif;
        font-size: 14px;
      }
      
      .single-line {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .exchange-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      }
      
      .currency-select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
      }
      
      .swap-button {
        transition: transform 0.3s ease;
      }
      
      .swap-button:hover {
        transform: rotate(180deg);
      }
      
      .rate-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        transition: transform 0.2s ease;
      }
      
      .pulse-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--color-success);
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: .5;
        }
      }
      
      .network-option {
        border: 2px solid #E5E7EB;
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .network-option:hover {
        border-color: var(--color-accent);
        background: #FFF7ED;
      }
      
      .network-option.selected {
        border-color: var(--color-accent);
        background: #FFF7ED;
      }
      
      .info-box {
        background: #F8FAFC;
        border-left: 4px solid var(--color-accent);
        padding: 12px;
        border-radius: 4px;
        font-size: 13px;
      }
      
      @media (max-width: 767px) {
        .exchange-card {
          border-radius: 12px;
        }
      }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3 sticky top-0 z-50 shadow-md">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-exchange-alt text-xl text-orange-400"></i>
                    <h1 class="text-lg font-bold">크로스보더</h1>
                </div>
                <div class="flex items-center space-x-2">
                    <i class="fas fa-globe text-sm"></i>
                    <select id="globalLang" class="bg-slate-700 text-white px-3 py-1 rounded text-sm cursor-pointer border border-slate-600">
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                    </select>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Exchange Section -->
    <section class="py-6 md:py-8">
        <div class="container mx-auto px-4 max-w-2xl">
            <!-- Title & Real-time Badge -->
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl md:text-2xl font-bold text-gray-800" id="exchangeTitle">실시간 환전 · USDT 거래</h2>
                <div class="flex items-center space-x-2 rate-badge bg-green-100 text-green-800">
                    <div class="pulse-dot"></div>
                    <span id="liveLabel">LIVE</span>
                </div>
            </div>

            <!-- Exchange Card -->
            <div class="exchange-card p-4 md:p-6 mb-4">
                <!-- From Amount -->
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2 text-sm" id="sendAmountLabel">보낼 금액</label>
                    <div class="flex space-x-2">
                        <input 
                            type="number" 
                            id="fromAmount" 
                            class="flex-1 px-3 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                            placeholder="1,000,000"
                            value="1000000"
                            min="0">
                        <select id="fromCurrency" class="currency-select px-4 py-3 text-base font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[100px]">
                            <option value="KRW">KRW</option>
                            <option value="CNY">CNY</option>
                            <option value="USD">USD</option>
                            <option value="USDT">USDT</option>
                        </select>
                    </div>
                </div>

                <!-- Swap Button -->
                <div class="flex justify-center my-2">
                    <button onclick="swapCurrencies()" class="swap-button bg-orange-500 hover:bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </div>

                <!-- To Currency -->
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2 text-sm" id="receiveCurrencyLabel">받을 통화</label>
                    <select id="toCurrency" class="currency-select w-full px-4 py-3 text-base font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <option value="USD">USD (달러)</option>
                        <option value="USDT">USDT (테더)</option>
                        <option value="KRW">KRW (원화)</option>
                        <option value="CNY">CNY (위안화)</option>
                    </select>
                </div>

                <!-- USDT Network Selection -->
                <div id="networkSection" class="mb-4 hidden">
                    <label class="block text-gray-700 font-semibold mb-2 text-sm" id="networkLabel">네트워크 선택</label>
                    <div class="grid grid-cols-3 gap-2">
                        <div class="network-option selected" onclick="selectNetwork('TRC20')" data-network="TRC20">
                            <div class="font-semibold text-sm mb-1">TRC20</div>
                            <div class="text-xs text-gray-600">~$1.5</div>
                            <div class="text-xs text-green-600 mt-1">권장</div>
                        </div>
                        <div class="network-option" onclick="selectNetwork('BEP20')" data-network="BEP20">
                            <div class="font-semibold text-sm mb-1">BEP20</div>
                            <div class="text-xs text-gray-600">~$0.5</div>
                            <div class="text-xs text-gray-600 mt-1">저렴</div>
                        </div>
                        <div class="network-option" onclick="selectNetwork('ERC20')" data-network="ERC20">
                            <div class="font-semibold text-sm mb-1">ERC20</div>
                            <div class="text-xs text-gray-600">~$15</div>
                            <div class="text-xs text-orange-600 mt-1">고가</div>
                        </div>
                    </div>
                </div>

                <!-- Rate Info -->
                <div class="bg-gray-50 rounded-lg p-4 mb-4" id="rateInfo">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-gray-600" id="rateLabel">환율</span>
                        <span class="font-semibold text-sm" id="rateValue">1,345.20</span>
                    </div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-gray-600" id="feeLabel">수수료 (0.8% + 0.2%)</span>
                        <span class="font-semibold text-sm text-orange-600" id="feeValue">10,000 KRW</span>
                    </div>
                    <div id="networkFeeRow" class="flex items-center justify-between mb-2 hidden">
                        <span class="text-xs text-gray-600" id="networkFeeLabel">네트워크 수수료</span>
                        <span class="font-semibold text-sm text-orange-600" id="networkFeeValue">~$1.5</span>
                    </div>
                    <div class="border-t border-gray-300 pt-2 mt-2">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-sm text-gray-800" id="receiveLabel">실수령 금액</span>
                            <span class="font-bold text-lg text-green-600" id="receiveValue">742.30 USD</span>
                        </div>
                    </div>
                </div>

                <!-- Limits Info -->
                <div class="info-box mb-4" id="limitsInfo">
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-info-circle text-orange-500 mt-0.5"></i>
                        <div class="flex-1 text-xs">
                            <div id="limitsText">거래 한도: 최소 10,000 KRW ~ 최대 10,000,000 KRW (일일 50,000,000 KRW)</div>
                        </div>
                    </div>
                </div>

                <!-- Last Update -->
                <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span id="lastUpdateLabel">마지막 업데이트</span>
                    <span id="lastUpdateTime">--</span>
                </div>

                <!-- Action Button -->
                <button onclick="showConfirmation()" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold text-base transition">
                    <span id="actionButton">지금 거래하기</span>
                </button>

                <!-- Regulation Notice -->
                <div class="mt-3 text-xs text-gray-500 text-center" id="regulationNotice">
                    본 플랫폼은 한국·중국 규제 기준을 자동 적용합니다
                </div>
            </div>

            <!-- Quick Scenarios -->
            <div class="grid grid-cols-2 gap-2 mb-6">
                <button onclick="quickScenario('KRW', 'USD')" class="bg-white border-2 border-gray-200 hover:border-orange-500 rounded-lg p-3 text-left transition">
                    <div class="font-semibold text-sm mb-1">KRW → USD</div>
                    <div class="text-xs text-gray-600">원화를 달러로</div>
                </button>
                <button onclick="quickScenario('CNY', 'USD')" class="bg-white border-2 border-gray-200 hover:border-orange-500 rounded-lg p-3 text-left transition">
                    <div class="font-semibold text-sm mb-1">CNY → USD</div>
                    <div class="text-xs text-gray-600">위안을 달러로</div>
                </button>
                <button onclick="quickScenario('KRW', 'USDT')" class="bg-white border-2 border-gray-200 hover:border-orange-500 rounded-lg p-3 text-left transition">
                    <div class="font-semibold text-sm mb-1">KRW → USDT</div>
                    <div class="text-xs text-gray-600">원화를 테더로</div>
                </button>
                <button onclick="quickScenario('CNY', 'USDT')" class="bg-white border-2 border-gray-200 hover:border-orange-500 rounded-lg p-3 text-left transition">
                    <div class="font-semibold text-sm mb-1">CNY → USDT</div>
                    <div class="text-xs text-gray-600">위안을 테더로</div>
                </button>
            </div>

            <!-- Rate Source -->
            <div class="text-center text-xs text-gray-500 mb-4">
                <span id="rateSource">환율 출처: 실시간 국제 금융시장 데이터</span>
            </div>
        </div>
    </section>

    <!-- Confirmation Modal -->
    <div id="confirmModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6">
            <div class="text-center mb-4">
                <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-check-circle text-orange-500 text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold mb-2" id="confirmTitle">거래 최종 확인</h3>
                <p class="text-sm text-gray-600" id="confirmSubtitle">아래 내용을 확인해주세요</p>
            </div>

            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <div class="flex justify-between mb-2">
                    <span class="text-sm text-gray-600">보낼 금액</span>
                    <span class="font-semibold" id="confirmSendAmount">1,000,000 KRW</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span class="text-sm text-gray-600">받을 금액</span>
                    <span class="font-bold text-lg text-green-600" id="confirmReceiveAmount">742.30 USD</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span class="text-sm text-gray-600">환율</span>
                    <span class="text-sm" id="confirmRate">1,345.20</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-sm text-gray-600">총 수수료</span>
                    <span class="text-sm text-orange-600" id="confirmFee">12,000 KRW</span>
                </div>
            </div>

            <div class="flex space-x-2">
                <button onclick="closeConfirmation()" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition">
                    <span id="cancelButton">취소</span>
                </button>
                <button onclick="executeTransaction()" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition">
                    <span id="confirmButton">확인</span>
                </button>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
      // State
      let selectedNetwork = 'TRC20';
      let currentRates = {};
      let calculationResult = null;

      // Translations
      const translations = {
        ko: {
          exchangeTitle: '실시간 환전 · USDT 거래',
          liveLabel: 'LIVE',
          sendAmountLabel: '보낼 금액',
          receiveCurrencyLabel: '받을 통화',
          networkLabel: '네트워크 선택',
          rateLabel: '환율',
          feeLabel: '수수료 (0.8% + 0.2%)',
          networkFeeLabel: '네트워크 수수료',
          receiveLabel: '실수령 금액',
          lastUpdateLabel: '마지막 업데이트',
          actionButton: '지금 거래하기',
          regulationNotice: '본 플랫폼은 한국·중국 규제 기준을 자동 적용합니다',
          rateSource: '환율 출처: 실시간 국제 금융시장 데이터',
          confirmTitle: '거래 최종 확인',
          confirmSubtitle: '아래 내용을 확인해주세요',
          cancelButton: '취소',
          confirmButton: '확인'
        },
        en: {
          exchangeTitle: 'Real-time Exchange · USDT Trading',
          liveLabel: 'LIVE',
          sendAmountLabel: 'Send Amount',
          receiveCurrencyLabel: 'Receive Currency',
          networkLabel: 'Network Selection',
          rateLabel: 'Rate',
          feeLabel: 'Fee (0.8% + 0.2%)',
          networkFeeLabel: 'Network Fee',
          receiveLabel: 'You Receive',
          lastUpdateLabel: 'Last Update',
          actionButton: 'Trade Now',
          regulationNotice: 'Korea·China regulations automatically applied',
          rateSource: 'Rate Source: Real-time International Financial Market',
          confirmTitle: 'Confirm Transaction',
          confirmSubtitle: 'Please review the details',
          cancelButton: 'Cancel',
          confirmButton: 'Confirm'
        },
        zh: {
          exchangeTitle: '实时兑换 · USDT 交易',
          liveLabel: '实时',
          sendAmountLabel: '发送金额',
          receiveCurrencyLabel: '接收货币',
          networkLabel: '网络选择',
          rateLabel: '汇率',
          feeLabel: '手续费 (0.8% + 0.2%)',
          networkFeeLabel: '网络费用',
          receiveLabel: '实际收到',
          lastUpdateLabel: '最后更新',
          actionButton: '立即交易',
          regulationNotice: '本平台自动应用韩国·中国监管标准',
          rateSource: '汇率来源：实时国际金融市场数据',
          confirmTitle: '确认交易',
          confirmSubtitle: '请确认以下详情',
          cancelButton: '取消',
          confirmButton: '确认'
        }
      };

      // Initialize
      document.addEventListener('DOMContentLoaded', () => {
        // Read URL parameters for scenario selection
        const urlParams = new URLSearchParams(window.location.search);
        const fromParam = urlParams.get('from');
        const toParam = urlParams.get('to');
        
        // Set currencies from URL if provided
        if (fromParam) {
          const fromSelect = document.getElementById('fromCurrency');
          if (fromSelect) fromSelect.value = fromParam.toUpperCase();
        }
        if (toParam) {
          const toSelect = document.getElementById('toCurrency');
          if (toSelect) toSelect.value = toParam.toUpperCase();
        }
        
        // Check USDT network after setting currencies
        checkUSDTNetwork();
        
        loadRates();
        setupListeners();
        setInterval(loadRates, 3000); // Update every 3 seconds for real-time feel
        
        // Add visual pulse animation to LIVE badge when rates update
        setInterval(() => {
          const badge = document.querySelector('.rate-badge');
          badge.style.transform = 'scale(1.05)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);
        }, 3000);
      });

      // Load real-time rates
      async function loadRates() {
        try {
          const response = await axios.get('/api/rates');
          if (response.data.success) {
            currentRates = response.data.rates;
            document.getElementById('lastUpdateTime').textContent = 
              new Date(response.data.timestamp).toLocaleTimeString();
            calculate();
          }
        } catch (error) {
          console.error('Failed to load rates:', error);
        }
      }

      // Setup event listeners
      function setupListeners() {
        document.getElementById('fromAmount').addEventListener('input', calculate);
        document.getElementById('fromCurrency').addEventListener('change', () => {
          checkUSDTNetwork();
          calculate();
        });
        document.getElementById('toCurrency').addEventListener('change', () => {
          checkUSDTNetwork();
          calculate();
        });

        document.getElementById('globalLang').addEventListener('change', (e) => {
          changeLanguage(e.target.value);
        });
      }

      // Check if USDT network selection is needed
      function checkUSDTNetwork() {
        const toCurrency = document.getElementById('toCurrency').value;
        const networkSection = document.getElementById('networkSection');
        const networkFeeRow = document.getElementById('networkFeeRow');
        
        if (toCurrency === 'USDT') {
          networkSection.classList.remove('hidden');
          networkFeeRow.classList.remove('hidden');
        } else {
          networkSection.classList.add('hidden');
          networkFeeRow.classList.add('hidden');
        }
      }

      // Select network
      function selectNetwork(network) {
        selectedNetwork = network;
        document.querySelectorAll('.network-option').forEach(el => {
          el.classList.remove('selected');
        });
        document.querySelector(\\\`[data-network="\\\${network}"]\\\`).classList.add('selected');
        calculate();
      }

      // Calculate
      async function calculate() {
        const amount = parseFloat(document.getElementById('fromAmount').value);
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;

        if (!amount || amount <= 0) return;

        try {
          const response = await axios.post('/api/exchange/calculate', {
            amount,
            fromCurrency,
            toCurrency,
            network: toCurrency === 'USDT' ? selectedNetwork : null
          });

          if (response.data.success) {
            calculationResult = response.data;
            displayCalculation(response.data);
          }
        } catch (error) {
          console.error('Calculation failed:', error);
        }
      }

      // Display calculation with visual feedback for rate changes
      function displayCalculation(data) {
        const calc = data.calculation;
        const limits = data.limits;

        // Animate rate change
        const rateElement = document.getElementById('rateValue');
        const newRate = calc.exchangeRate.toFixed(6);
        if (rateElement.textContent && rateElement.textContent !== newRate) {
          rateElement.style.color = '#16a34a';
          rateElement.style.fontWeight = 'bold';
          setTimeout(() => {
            rateElement.style.color = '';
            rateElement.style.fontWeight = '';
          }, 800);
        }
        rateElement.textContent = newRate;

        document.getElementById('feeValue').textContent = 
          \\\`\\\${calc.totalFee.toLocaleString()} \\\${calc.fromCurrency}\\\`;
        
        if (calc.network) {
          document.getElementById('networkFeeValue').textContent = \\\`~$\\\${calc.networkFeeUSD}\\\`;
        }
        
        document.getElementById('receiveValue').textContent = 
          \\\`\\\${calc.receivedAmount.toFixed(2)} \\\${calc.toCurrency}\\\`;

        // Limits
        document.getElementById('limitsText').textContent = 
          \\\`거래 한도: 최소 \\\${limits.min.toLocaleString()} \\\${limits.currency} ~ 최대 \\\${limits.max.toLocaleString()} \\\${limits.currency} (일일 \\\${limits.daily.toLocaleString()} \\\${limits.currency})\\\`;
      }

      // Swap currencies
      function swapCurrencies() {
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        
        const temp = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = temp;
        
        checkUSDTNetwork();
        calculate();
      }

      // Quick scenario
      function quickScenario(from, to) {
        document.getElementById('fromCurrency').value = from;
        document.getElementById('toCurrency').value = to;
        checkUSDTNetwork();
        calculate();
      }

      // Show confirmation
      function showConfirmation() {
        if (!calculationResult) {
          alert('계산 결과를 먼저 확인해주세요');
          return;
        }

        const calc = calculationResult.calculation;
        document.getElementById('confirmSendAmount').textContent = 
          \\\`\\\${calc.amount.toLocaleString()} \\\${calc.fromCurrency}\\\`;
        document.getElementById('confirmReceiveAmount').textContent = 
          \\\`\\\${calc.receivedAmount.toFixed(2)} \\\${calc.toCurrency}\\\`;
        document.getElementById('confirmRate').textContent = calc.exchangeRate.toFixed(6);
        document.getElementById('confirmFee').textContent = 
          \\\`\\\${calc.totalFee.toLocaleString()} \\\${calc.fromCurrency}\\\`;

        document.getElementById('confirmModal').classList.remove('hidden');
        document.getElementById('confirmModal').classList.add('flex');
      }

      // Close confirmation
      function closeConfirmation() {
        document.getElementById('confirmModal').classList.add('hidden');
        document.getElementById('confirmModal').classList.remove('flex');
      }

      // Execute transaction
      function executeTransaction() {
        alert('거래 기능은 추후 구현됩니다. 현재는 데모 버전입니다.');
        closeConfirmation();
      }

      // Change language
      function changeLanguage(lang) {
        const trans = translations[lang];
        Object.keys(trans).forEach(key => {
          const element = document.getElementById(key);
          if (element) {
            element.textContent = trans[key];
          }
        });
      }
    </script>
</body>
</html>
`)
})


// Exchange rates cache with simulated fluctuations
// In production, integrate with exchangerate-api.com or similar service
const exchangeRates = {
  'KRW-USD': 0.000743,  // 1 KRW = 0.000743 USD
  'CNY-USD': 0.1379,    // 1 CNY = 0.1379 USD
  'USDT-USD': 0.9998,   // 1 USDT = 0.9998 USD (near parity)
  'KRW-CNY': 0.0055,    // 1 KRW = 0.0055 CNY
  lastUpdate: new Date().toISOString()
}

// Simulate slight rate fluctuations on each API call (±0.05%)
function getFluctuatedRates() {
  const fluctuate = (baseRate: number) => baseRate * (1 + (Math.random() - 0.5) * 0.001)
  return {
    'KRW-USD': fluctuate(0.000743),
    'CNY-USD': fluctuate(0.1379),
    'USDT-USD': fluctuate(0.9998),
    'KRW-CNY': fluctuate(0.0055)
  }
}

// Calculate derived rates
function getDerivedRate(from: string, to: string): number {
  if (from === to) return 1
  
  // Direct rates
  const key = `${from}-${to}`
  if (exchangeRates[key]) return exchangeRates[key]
  
  // Reverse rates
  const reverseKey = `${to}-${from}`
  if (exchangeRates[reverseKey]) return 1 / exchangeRates[reverseKey]
  
  // Via USD
  const fromToUsd = exchangeRates[`${from}-USD`]
  const toToUsd = exchangeRates[`${to}-USD`]
  if (fromToUsd && toToUsd) {
    return fromToUsd / toToUsd
  }
  
  return 1
}

// API routes
app.get('/api/rates', (c) => {
  // Get fluctuated rates for real-time feel
  const currentRates = getFluctuatedRates()
  
  return c.json({
    success: true,
    rates: {
      'KRW-USD': currentRates['KRW-USD'],
      'USD-KRW': 1 / currentRates['KRW-USD'],
      'CNY-USD': currentRates['CNY-USD'],
      'USD-CNY': 1 / currentRates['CNY-USD'],
      'KRW-USDT': currentRates['KRW-USD'] / currentRates['USDT-USD'],
      'USDT-KRW': currentRates['USDT-USD'] / currentRates['KRW-USD'],
      'CNY-USDT': currentRates['CNY-USD'] / currentRates['USDT-USD'],
      'USDT-CNY': currentRates['USDT-USD'] / currentRates['CNY-USD'],
      'USDT-USD': currentRates['USDT-USD'],
      'USD-USDT': 1 / currentRates['USDT-USD']
    },
    timestamp: Date.now()
  })
})

app.post('/api/exchange/calculate', async (c) => {
  try {
    const { amount, fromCurrency, toCurrency, network } = await c.req.json()
    
    if (!amount || amount <= 0) {
      return c.json({ success: false, error: 'Invalid amount' }, 400)
    }
    
    // Get exchange rate
    const rate = getDerivedRate(fromCurrency, toCurrency)
    
    // Fee calculation (0.8% platform fee + 0.2% spread)
    const platformFeeRate = 0.008
    const spreadRate = 0.002
    const totalFeeRate = platformFeeRate + spreadRate
    
    const platformFee = amount * platformFeeRate
    const spreadFee = amount * spreadRate
    const totalFee = platformFee + spreadFee
    
    // Network fee for USDT
    let networkFee = 0
    let networkFeeUSD = 0
    if (toCurrency === 'USDT') {
      if (network === 'TRC20') {
        networkFeeUSD = 1.5  // ~$1.5
      } else if (network === 'ERC20') {
        networkFeeUSD = 15   // ~$15
      } else if (network === 'BEP20') {
        networkFeeUSD = 0.5  // ~$0.5
      }
      // Convert network fee to source currency
      const usdRate = getDerivedRate(fromCurrency, 'USD')
      networkFee = networkFeeUSD / usdRate
    }
    
    // Calculate final amount
    const amountAfterFee = amount - totalFee - networkFee
    const receivedAmount = amountAfterFee * rate
    
    // Limits based on scenario
    let minLimit = 0
    let maxLimit = 0
    let dailyLimit = 0
    
    if (fromCurrency === 'KRW') {
      minLimit = 10000        // 10,000 KRW
      maxLimit = 10000000     // 10,000,000 KRW per transaction
      dailyLimit = 50000000   // 50,000,000 KRW per day
    } else if (fromCurrency === 'CNY') {
      minLimit = 50           // 50 CNY
      maxLimit = 50000        // 50,000 CNY per transaction
      dailyLimit = 200000     // 200,000 CNY per day
    }
    
    return c.json({
      success: true,
      calculation: {
        amount: amount,
        fromCurrency,
        toCurrency,
        exchangeRate: rate,
        platformFee: platformFee,
        spreadFee: spreadFee,
        networkFee: networkFee,
        networkFeeUSD: networkFeeUSD,
        totalFee: totalFee + networkFee,
        amountAfterFee: amountAfterFee,
        receivedAmount: receivedAmount,
        network: network || null
      },
      limits: {
        min: minLimit,
        max: maxLimit,
        daily: dailyLimit,
        currency: fromCurrency
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ success: false, error: 'Calculation failed' }, 400)
  }
})

// Legacy API for backward compatibility
app.get('/api/exchange-rate', (c) => {
  return c.json({
    success: true,
    rate: exchangeRates['KRW-CNY'],
    timestamp: exchangeRates.lastUpdate,
    base: 'KRW',
    target: 'CNY'
  })
})

app.post('/api/calculate', async (c) => {
  try {
    const { amount, type } = await c.req.json()
    
    const rate = exchangeRates['KRW-CNY']
    
    let platformFee = 0
    let spreadFee = 0
    
    if (type === 'individual') {
      platformFee = amount * 0.015
      spreadFee = amount * 0.005
    } else if (type === 'freelancer') {
      platformFee = amount * 0.03
      spreadFee = amount * 0.01
    } else if (type === 'corporate') {
      platformFee = amount * 0.01
      spreadFee = amount * 0.005
    }
    
    const totalFee = platformFee + spreadFee
    const amountAfterFee = amount - totalFee
    const receivedAmount = amountAfterFee * rate
    
    return c.json({
      success: true,
      calculation: {
        amount: amount,
        platformFee: Math.round(platformFee),
        spreadFee: Math.round(spreadFee),
        totalFee: Math.round(totalFee),
        amountAfterFee: Math.round(amountAfterFee),
        exchangeRate: rate,
        receivedAmount: receivedAmount.toFixed(2),
        currency: 'CNY'
      }
    })
  } catch (error) {
    return c.json({ success: false, error: 'Invalid request' }, 400)
  }
})

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>크로스보더 - 한중 정산 플랫폼</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          :root {
            --color-primary: #0F172A;
            --color-secondary: #1E293B;
            --color-accent: #FF7A00;
            --color-bg: #FFFFFF;
            --color-bg-soft: #F8FAFC;
            --text-primary: #0F172A;
            --text-secondary: #475569;
            --text-muted: #94A3B8;
            --border-default: #E5E7EB;
          }
          
          body {
            font-family: 'Inter', 'Noto Sans KR', 'Noto Sans SC', sans-serif;
            font-size: 14px;
          }
          
          /* 1줄 표시 원칙 */
          .single-line {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .hero-gradient {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          }
          
          /* 언어 선택 드롭다운 - 항상 눈에 띄게 */
          .lang-select {
            height: 36px;
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.3);
            font-size: 13px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-weight: 500;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
            background-position: right 0.3rem center;
            background-repeat: no-repeat;
            background-size: 1.2em 1.2em;
            padding-right: 2rem;
          }
          
          .lang-select:focus {
            outline: 2px solid var(--color-accent);
            background: rgba(255,255,255,0.2);
          }
          
          /* 플랫폼 언어 선택 - 진청색 배경 */
          #globalLang {
            background: #0F172A !important;
            border: 1px solid #1E293B !important;
            color: white !important;
            font-weight: 600;
          }
          
          #globalLang option {
            background: #0F172A;
            color: white;
          }
          
          #globalLang:focus {
            outline: 2px solid var(--color-accent);
            background: #1E293B !important;
          }
          
          /* 챗봇 언어 선택 - 진청색 배경 */
          #chatLang {
            background: #0F172A !important;
            border: 1px solid #1E293B !important;
            color: white !important;
            font-weight: 600;
          }
          
          #chatLang option {
            background: #0F172A;
            color: white;
          }
          
          #chatLang:focus {
            outline: 2px solid var(--color-accent);
            background: #1E293B !important;
          }
          
          /* 카드 최적화 - 모바일 */
          .feature-card {
            min-height: 56px;
            padding: 8px 10px;
            transition: all 0.3s ease;
          }
          
          .feature-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          
          /* 버튼 - 모바일 최적화 */
          .btn-primary {
            height: 42px;
            font-size: 13px;
            border-radius: 8px;
            font-weight: 600;
          }
          
          /* 챗봇 버튼 */
          .chatbot-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: #0F172A;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.6);
            transition: all 0.3s ease;
            z-index: 1000;
            border: 2px solid #1E293B;
          }
          
          .chatbot-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 24px rgba(15, 23, 42, 0.8);
            background: #1E293B;
          }
          
          /* 챗봇 패널 */
          .chatbot-panel {
            position: fixed;
            bottom: 0;
            right: 0;
            width: 100%;
            max-width: 100%;
            height: 80vh;
            background: white;
            border-radius: 16px 16px 0 0;
            box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
            transform: translateY(100%);
            transition: transform 0.3s ease;
            z-index: 999;
            display: flex;
            flex-direction: column;
          }
          
          .chatbot-panel.active {
            transform: translateY(0);
          }
          
          /* FAQ 아이템 */
          .faq-item {
            border-bottom: 1px solid var(--border-default);
            cursor: pointer;
            padding: 10px 12px;
          }
          
          .faq-item:hover {
            background: var(--color-bg-soft);
          }
          
          .faq-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
          }
          
          .faq-content.active {
            max-height: 500px;
          }
          
          /* 반응형 미디어 쿼리 */
          @media (max-width: 767px) {
            body { font-size: 14px; }
            
            .section-padding {
              padding: 12px 16px;
            }
            
            .card-padding {
              padding: 8px 10px;
            }
            
            h1 { font-size: 18px; }
            h2 { font-size: 22px; }
            h3 { font-size: 18px; }
            h4 { font-size: 14px; }
            
            .grid-features {
              grid-template-columns: 1fr;
              gap: 8px;
            }
            
            .grid-usecases {
              grid-template-columns: 1fr;
              gap: 8px;
            }
          }
          
          @media (min-width: 768px) and (max-width: 1023px) {
            .chatbot-panel {
              bottom: 20px;
              right: 20px;
              border-radius: 16px;
              max-width: 400px;
              height: 600px;
            }
            
            .grid-features {
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
            
            .grid-usecases {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
          }
          
          @media (min-width: 1024px) {
            body { font-size: 16px; }
            
            .section-padding {
              padding: 20px 24px;
            }
            
            .card-padding {
              padding: 12px 14px;
            }
            
            .chatbot-panel {
              bottom: 90px;
              right: 24px;
              border-radius: 16px;
              max-width: 420px;
              height: 600px;
            }
            
            .grid-features {
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
            }
            
            .grid-usecases {
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
            }
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header - 고정, 언어 선택 항상 보임 -->
        <header class="hero-gradient text-white py-3 sticky top-0 z-50 shadow-md">
            <div class="container mx-auto px-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-exchange-alt text-xl md:text-2xl text-orange-400"></i>
                        <h1 class="text-lg md:text-xl font-bold single-line" id="headerTitle">크로스보더</h1>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-globe text-sm"></i>
                        <select id="globalLang" class="lang-select">
                            <option value="ko">한국어</option>
                            <option value="en">English</option>
                            <option value="zh">中文</option>
                        </select>
                    </div>
                </div>
            </div>
        </header>

        <!-- Hero Section - 간결하게 -->
        <section class="hero-gradient text-white py-12 md:py-8">
            <div class="container mx-auto px-4 text-center">
                <!-- Korean -->
                <div class="lang-content" data-lang="ko">
                    <h2 class="text-2xl md:text-4xl font-bold mb-3 md:mb-2">한중 정산의 새로운 기준</h2>
                    <p class="text-base md:text-xl mb-4 md:mb-4 opacity-90 single-line">Cross-Border Settlement, Redefined</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <a href="/exchange.html" class="btn-primary bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition inline-block">
                            <i class="fas fa-exchange-alt mr-2"></i>
                            <span>실시간 환전</span>
                        </a>
                        <button onclick="scrollToCalculator()" class="btn-primary bg-white hover:bg-gray-100 text-gray-800 px-6 py-2 rounded-lg transition border-2 border-white">
                            환율 계산기
                        </button>
                    </div>
                </div>
                
                <!-- English -->
                <div class="lang-content" data-lang="en" style="display:none">
                    <h2 class="text-2xl md:text-4xl font-bold mb-3 md:mb-2">Cross-Border Settlement, Redefined</h2>
                    <p class="text-base md:text-xl mb-4 md:mb-4 opacity-90 single-line">Fast & Secure Cross-Border Payment</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <a href="/exchange.html" class="btn-primary bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition inline-block">
                            <i class="fas fa-exchange-alt mr-2"></i>
                            <span>Real-Time Exchange</span>
                        </a>
                        <button onclick="scrollToCalculator()" class="btn-primary bg-white hover:bg-gray-100 text-gray-800 px-6 py-2 rounded-lg transition border-2 border-white">
                            Exchange Rate Calculator
                        </button>
                    </div>
                </div>
                
                <!-- Chinese -->
                <div class="lang-content" data-lang="zh" style="display:none">
                    <h2 class="text-2xl md:text-4xl font-bold mb-3 md:mb-2">韩中结算的新标准</h2>
                    <p class="text-base md:text-xl mb-4 md:mb-4 opacity-90 single-line">快速安全的跨境支付</p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <a href="/exchange.html" class="btn-primary bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition inline-block">
                            <i class="fas fa-exchange-alt mr-2"></i>
                            <span>实时兑换</span>
                        </a>
                        <button onclick="scrollToCalculator()" class="btn-primary bg-white hover:bg-gray-100 text-gray-800 px-6 py-2 rounded-lg transition border-2 border-white">
                            汇率计算器
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section - 여백 최소화 -->
        <section class="py-8 md:py-6 bg-white">
            <div class="container mx-auto px-4">
                <h3 class="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8 text-gray-800" id="featuresTitle">서비스 특징</h3>
                <div class="grid grid-features">
                    <div class="feature-card bg-gray-50 rounded-lg">
                        <div class="text-orange-500 text-2xl md:text-3xl mb-2">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <h4 class="text-sm md:text-base font-bold mb-1 text-gray-800 single-line" id="feature1Title">신속한 처리</h4>
                        <p class="text-xs md:text-sm text-gray-600 single-line" id="feature1Desc">에스크로 기반 자동 정산</p>
                    </div>
                    <div class="feature-card bg-gray-50 rounded-lg">
                        <div class="text-orange-500 text-2xl md:text-3xl mb-2">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h4 class="text-sm md:text-base font-bold mb-1 text-gray-800 single-line" id="feature2Title">안전한 거래</h4>
                        <p class="text-xs md:text-sm text-gray-600 single-line" id="feature2Desc">AML/KYC 인증 시스템</p>
                    </div>
                    <div class="feature-card bg-gray-50 rounded-lg">
                        <div class="text-orange-500 text-2xl md:text-3xl mb-2">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <h4 class="text-sm md:text-base font-bold mb-1 text-gray-800 single-line" id="feature3Title">합리적 수수료</h4>
                        <p class="text-xs md:text-sm text-gray-600 single-line" id="feature3Desc">투명한 수수료 체계</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 4가지 환전 시나리오 선택 -->
        <section class="py-8 md:py-6 bg-gray-50">
            <div class="container mx-auto px-4 max-w-2xl">
                <div class="text-center mb-4">
                    <h3 class="text-lg md:text-xl font-bold text-gray-800 mb-2" id="scenarioTitle">실시간 환전 기능이 준비 중입니다</h3>
                    <p class="text-sm text-gray-600" id="scenarioSubtitle">곧 4가지 환전 시나리오를 지원합니다:</p>
                </div>
                
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <a href="/exchange.html?from=KRW&to=USD" class="bg-white border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg rounded-lg p-4 text-center transition cursor-pointer">
                        <div class="text-2xl mb-2">💵</div>
                        <div class="font-bold text-base mb-1">KRW → USD</div>
                        <div class="text-xs text-gray-600">원화 → 달러</div>
                    </a>
                    
                    <a href="/exchange.html?from=CNY&to=USD" class="bg-white border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg rounded-lg p-4 text-center transition cursor-pointer">
                        <div class="text-2xl mb-2">💴</div>
                        <div class="font-bold text-base mb-1">CNY → USD</div>
                        <div class="text-xs text-gray-600">위안 → 달러</div>
                    </a>
                    
                    <a href="/exchange.html?from=KRW&to=USDT" class="bg-white border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg rounded-lg p-4 text-center transition cursor-pointer">
                        <div class="text-2xl mb-2">💎</div>
                        <div class="font-bold text-base mb-1">KRW → USDT</div>
                        <div class="text-xs text-gray-600">원화 → 테더</div>
                    </a>
                    
                    <a href="/exchange.html?from=CNY&to=USDT" class="bg-white border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg rounded-lg p-4 text-center transition cursor-pointer">
                        <div class="text-2xl mb-2">🪙</div>
                        <div class="font-bold text-base mb-1">CNY → USDT</div>
                        <div class="text-xs text-gray-600">위안 → 테더</div>
                    </a>
                </div>
                
                <div class="text-center">
                    <a href="/exchange.html" class="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition">
                        <span id="goToExchangeButton">메인 환전 페이지로 이동</span>
                    </a>
                </div>
            </div>
        </section>

        <!-- Calculator Section -->
        <section class="py-8 md:py-6 bg-gray-50" id="calculator">
            <div class="container mx-auto px-4 max-w-xl">
                <h3 class="text-xl md:text-2xl font-bold text-center mb-6 text-gray-800" id="calcTitle">환율 계산기</h3>
                <div class="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2 text-sm" id="calcAmountLabel">송금 금액 (KRW)</label>
                        <input type="number" id="amount" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="1000000" min="0">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-semibold mb-2 text-sm" id="calcTypeLabel">이용자 유형</label>
                        <select id="userType" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            <option value="individual">개인 (1.5% + 0.5%)</option>
                            <option value="freelancer">프리랜서 (3% + 1%)</option>
                            <option value="corporate">법인 (1% + 0.5%)</option>
                        </select>
                    </div>
                    <button onclick="calculate()" class="w-full btn-primary bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition" id="calcButton">
                        계산하기
                    </button>
                    
                    <div id="result" class="mt-4 hidden">
                        <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600" id="resultAmount">송금액</span>
                                <span class="font-semibold" id="resultAmountValue">0 KRW</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600" id="resultFee">총 수수료</span>
                                <span class="font-semibold text-orange-600" id="resultFeeValue">0 KRW</span>
                            </div>
                            <div class="border-t border-gray-300 pt-2 flex justify-between">
                                <span class="text-gray-800 font-bold text-sm" id="resultReceive">수취 예상액</span>
                                <span class="font-bold text-base text-green-600" id="resultReceiveValue">0 CNY</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Use Cases Section -->
        <section class="py-8 md:py-6 bg-white">
            <div class="container mx-auto px-4">
                <h3 class="text-xl md:text-2xl font-bold text-center mb-6 text-gray-800" id="useCasesTitle">이용 사례</h3>
                <div class="grid grid-usecases max-w-3xl mx-auto">
                    <div class="flex items-start space-x-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                        <i class="fas fa-briefcase text-orange-500 text-lg md:text-xl mt-1"></i>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-sm md:text-base mb-1 text-gray-800 single-line" id="useCase1Title">프리랜서 정산</h4>
                            <p class="text-xs md:text-sm text-gray-600 single-line" id="useCase1Desc">한중 간 프리랜서 용역비 안전 정산</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                        <i class="fas fa-shopping-cart text-orange-500 text-lg md:text-xl mt-1"></i>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-sm md:text-base mb-1 text-gray-800 single-line" id="useCase2Title">상품 공급 대금</h4>
                            <p class="text-xs md:text-sm text-gray-600 single-line" id="useCase2Desc">쇼핑몰 공급업체 정산 자동화</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                        <i class="fas fa-graduation-cap text-orange-500 text-lg md:text-xl mt-1"></i>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-sm md:text-base mb-1 text-gray-800 single-line" id="useCase3Title">유학생 생활비</h4>
                            <p class="text-xs md:text-sm text-gray-600 single-line" id="useCase3Desc">학비 및 생활비 정기 송금</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                        <i class="fas fa-handshake text-orange-500 text-lg md:text-xl mt-1"></i>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-sm md:text-base mb-1 text-gray-800 single-line" id="useCase4Title">법인 거래</h4>
                            <p class="text-xs md:text-sm text-gray-600 single-line" id="useCase4Desc">계약 기반 대규모 정산</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white py-6">
            <div class="container mx-auto px-4 text-center">
                <p class="text-sm" id="footerText">&copy; 2026 크로스보더. 모든 권리 보유.</p>
                <p class="text-gray-400 mt-1 text-xs" id="footerDisclaimer">본 서비스는 외국환 송금이 아닌 거래 기반 정산 플랫폼입니다.</p>
            </div>
        </footer>

        <!-- Chatbot Button -->
        <div class="chatbot-button" onclick="toggleChatbot()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="40" height="40">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <circle cx="8.5" cy="11" r="1.5" fill="#00D9FF"/>
                <circle cx="15.5" cy="11" r="1.5" fill="#00D9FF"/>
                <path d="M12 4c-1.5 0-2.5.5-3 1h6c-.5-.5-1.5-1-3-1z" fill="white"/>
                <path d="M12 17c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4z" fill="white" opacity="0.8"/>
            </svg>
        </div>

        <!-- Chatbot Panel -->
        <div class="chatbot-panel" id="chatbotPanel">
            <div class="bg-orange-500 text-white p-3 flex items-center justify-between">
                <h3 class="font-bold text-base single-line" id="chatbotTitle">환전·정산 자동 안내</h3>
                <div class="flex items-center space-x-2">
                    <i class="fas fa-globe text-xs"></i>
                    <select id="chatLang" class="lang-select text-xs">
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                    </select>
                    <button onclick="toggleChatbot()" class="text-white hover:bg-orange-600 rounded p-1 ml-1">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-3" id="faqContainer">
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-spinner fa-spin text-2xl"></i>
                    <p class="mt-2 text-sm">Loading...</p>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // Translations
          const translations = {
            ko: {
              headerTitle: '크로스보더',
              heroTitle: '한중 정산의 새로운 기준',
              heroSubtitle: '빠르고 안전한 크로스보더 결제 서비스',
              realTimeExchangeButton: '실시간 환전',
              heroButton: '환율 계산기',
              featuresTitle: '서비스 특징',
              feature1Title: '신속한 처리',
              feature1Desc: '에스크로 기반 자동 정산',
              feature2Title: '안전한 거래',
              feature2Desc: 'AML/KYC 인증 시스템',
              feature3Title: '합리적 수수료',
              feature3Desc: '투명한 수수료 체계',
              calcTitle: '환율 계산기',
              calcAmountLabel: '송금 금액 (KRW)',
              calcTypeLabel: '이용자 유형',
              calcButton: '계산하기',
              resultAmount: '송금액',
              resultFee: '총 수수료',
              resultReceive: '수취 예상액',
              useCasesTitle: '이용 사례',
              useCase1Title: '프리랜서 정산',
              useCase1Desc: '한중 간 프리랜서 용역비 안전 정산',
              useCase2Title: '상품 공급 대금',
              useCase2Desc: '쇼핑몰 공급업체 정산 자동화',
              useCase3Title: '유학생 생활비',
              useCase3Desc: '학비 및 생활비 정기 송금',
              useCase4Title: '법인 거래',
              useCase4Desc: '계약 기반 대규모 정산',
              footerText: '© 2026 크로스보더. 모든 권리 보유.',
              footerDisclaimer: '본 서비스는 외국환 송금이 아닌 거래 기반 정산 플랫폼입니다.',
              chatbotTitle: '환전·정산 자동 안내',
              userTypeIndividual: '개인 (1.5% + 0.5%)',
              userTypeFreelancer: '프리랜서 (3% + 1%)',
              userTypeCorporate: '법인 (1% + 0.5%)'
            },
            en: {
              headerTitle: 'CrossBorder',
              heroTitle: 'New Standard for Korea-China Settlement',
              heroSubtitle: 'Fast & Secure Cross-Border Payment',
              realTimeExchangeButton: 'Real-Time Exchange',
              heroButton: 'Exchange Rate Calculator',
              featuresTitle: 'Service Features',
              feature1Title: 'Fast Processing',
              feature1Desc: 'Escrow-based settlement',
              feature2Title: 'Secure',
              feature2Desc: 'AML/KYC verification',
              feature3Title: 'Fair Fees',
              feature3Desc: 'Transparent pricing',
              calcTitle: 'Exchange Rate Calculator',
              calcAmountLabel: 'Amount (KRW)',
              calcTypeLabel: 'User Type',
              calcButton: 'Calculate',
              resultAmount: 'Amount',
              resultFee: 'Total Fee',
              resultReceive: 'Expected',
              useCasesTitle: 'Use Cases',
              useCase1Title: 'Freelancer',
              useCase1Desc: 'Secure freelance payments',
              useCase2Title: 'Supply Payment',
              useCase2Desc: 'Automated supplier settlement',
              useCase3Title: 'Student Expenses',
              useCase3Desc: 'Tuition and living costs',
              useCase4Title: 'Corporate',
              useCase4Desc: 'Large-scale settlements',
              footerText: '© 2026 CrossBorder. All rights reserved.',
              footerDisclaimer: 'Transaction-based settlement platform.',
              chatbotTitle: 'Exchange & Settlement Guide',
              userTypeIndividual: 'Individual (1.5% + 0.5%)',
              userTypeFreelancer: 'Freelancer (3% + 1%)',
              userTypeCorporate: 'Corporate (1% + 0.5%)'
            },
            zh: {
              headerTitle: '跨境通',
              heroTitle: '韩中结算的新标准',
              heroSubtitle: '快速安全的跨境支付',
              realTimeExchangeButton: '实时兑换',
              heroButton: '汇率计算器',
              featuresTitle: '服务特点',
              feature1Title: '快速处理',
              feature1Desc: '托管自动结算',
              feature2Title: '安全',
              feature2Desc: 'AML/KYC认证',
              feature3Title: '合理费用',
              feature3Desc: '透明定价',
              calcTitle: '汇率计算器',
              calcAmountLabel: '金额 (KRW)',
              calcTypeLabel: '用户类型',
              calcButton: '计算',
              resultAmount: '金额',
              resultFee: '总费用',
              resultReceive: '预计',
              useCasesTitle: '使用案例',
              useCase1Title: '自由职业者',
              useCase1Desc: '安全自由职业支付',
              useCase2Title: '供应付款',
              useCase2Desc: '供应商自动结算',
              useCase3Title: '学生费用',
              useCase3Desc: '学费和生活费',
              useCase4Title: '企业',
              useCase4Desc: '大规模结算',
              footerText: '© 2026 跨境通。保留所有权利。',
              footerDisclaimer: '基于交易的结算平台。',
              chatbotTitle: '兑换·结算指南',
              userTypeIndividual: '个人 (1.5% + 0.5%)',
              userTypeFreelancer: '自由职业者 (3% + 1%)',
              userTypeCorporate: '企业 (1% + 0.5%)'
            }
          };

          // FAQ Data
          let faqData = null;
          let currentPage = 0;
          const itemsPerPage = 10;

          // Load FAQ data
          async function loadFAQData() {
            try {
              const response = await axios.get('/faq-data.json');
              faqData = response.data;
              renderFAQ();
            } catch (error) {
              console.error('Failed to load FAQ data:', error);
              document.getElementById('faqContainer').innerHTML = '<p class="text-center text-red-500 py-8 text-sm">Failed to load FAQ</p>';
            }
          }

          // Render FAQ items
          function renderFAQ() {
            if (!faqData) return;
            
            const lang = document.getElementById('chatLang').value;
            const container = document.getElementById('faqContainer');
            const startIdx = currentPage * itemsPerPage;
            const endIdx = startIdx + itemsPerPage;
            const items = faqData.faq.slice(startIdx, endIdx);
            
            let html = '';
            items.forEach(item => {
              html += \`
                <div class="faq-item" onclick="toggleFAQ('\${item.id}')">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 pr-2">
                      <h4 class="font-semibold text-gray-800 mb-1 text-sm">▶ \${item.title[lang]}</h4>
                      <div class="faq-content text-gray-600 text-xs" id="content-\${item.id}">
                        <p class="mt-1 pb-1">\${item.content[lang]}</p>
                      </div>
                    </div>
                  </div>
                </div>
              \`;
            });
            
            // Pagination
            if (faqData.faq.length > itemsPerPage) {
              const totalPages = Math.ceil(faqData.faq.length / itemsPerPage);
              html += '<div class="flex justify-center space-x-2 mt-3 pb-3">';
              for (let i = 0; i < totalPages; i++) {
                const activeClass = i === currentPage ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700';
                html += \`<button onclick="changePage(\${i})" class="\${activeClass} px-2 py-1 rounded text-xs">\${i + 1}</button>\`;
              }
              html += '</div>';
            }
            
            container.innerHTML = html;
          }

          // Toggle FAQ item
          function toggleFAQ(id) {
            const content = document.getElementById('content-' + id);
            content.classList.toggle('active');
          }

          // Change page
          function changePage(page) {
            currentPage = page;
            renderFAQ();
          }

          // Toggle chatbot
          function toggleChatbot() {
            const panel = document.getElementById('chatbotPanel');
            panel.classList.toggle('active');
            
            if (panel.classList.contains('active') && !faqData) {
              loadFAQData();
            }
          }

          // Scroll to calculator
          function scrollToCalculator() {
            document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
          }

          // Calculate fees
          async function calculate() {
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('userType').value;
            
            if (!amount || amount <= 0) {
              alert('Please enter a valid amount');
              return;
            }
            
            try {
              const response = await axios.post('/api/calculate', { amount, type });
              const calc = response.data.calculation;
              
              document.getElementById('resultAmountValue').textContent = calc.amount.toLocaleString() + ' KRW';
              document.getElementById('resultFeeValue').textContent = calc.totalFee.toLocaleString() + ' KRW';
              document.getElementById('resultReceiveValue').textContent = calc.receivedAmount + ' CNY';
              document.getElementById('result').classList.remove('hidden');
            } catch (error) {
              alert('Calculation failed. Please try again.');
            }
          }

          // Change language
          function changeLanguage(lang) {
            const trans = translations[lang];
            
            // Show/hide language content blocks
            document.querySelectorAll('.lang-content').forEach(el => {
              if (el.getAttribute('data-lang') === lang) {
                el.style.display = 'block';
              } else {
                el.style.display = 'none';
              }
            });
            
            // Update all text elements with IDs
            Object.keys(trans).forEach(key => {
              const element = document.getElementById(key);
              if (element) {
                if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
                  element.value = trans[key];
                } else {
                  element.textContent = trans[key];
                }
              }
            });
            
            // Update user type options
            const userTypeSelect = document.getElementById('userType');
            if (userTypeSelect) {
              userTypeSelect.options[0].text = trans.userTypeIndividual;
              userTypeSelect.options[1].text = trans.userTypeFreelancer;
              userTypeSelect.options[2].text = trans.userTypeCorporate;
            }
            
            // Update FAQ if loaded
            if (faqData) {
              renderFAQ();
            }
          }

          // Global language selector
          document.getElementById('globalLang').addEventListener('change', (e) => {
            const lang = e.target.value;
            document.getElementById('chatLang').value = lang;
            changeLanguage(lang);
          });

          // Chat language selector
          document.getElementById('chatLang').addEventListener('change', (e) => {
            const lang = e.target.value;
            document.getElementById('globalLang').value = lang;
            changeLanguage(lang);
            if (faqData) {
              renderFAQ();
            }
          });

          // Initialize
          document.addEventListener('DOMContentLoaded', () => {
            const defaultLang = 'ko';
            globalLang = defaultLang;
            chatLang = defaultLang;
            document.getElementById('globalLang').value = defaultLang;
            document.getElementById('chatLang').value = defaultLang;
            changeLanguage(defaultLang);
            if (faqData) {
              renderFAQ();
            }
          });
        </script>
    </body>
    </html>
  `)
})

export default app
