import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/faq-data.json', serveStatic({ root: './public' }))

// API routes
app.get('/api/exchange-rate', (c) => {
  // Mock exchange rate API - replace with real API in production
  const rate = 0.0055 // 1 KRW = 0.0055 CNY (approximate)
  return c.json({
    success: true,
    rate: rate,
    timestamp: new Date().toISOString(),
    base: 'KRW',
    target: 'CNY'
  })
})

app.post('/api/calculate', async (c) => {
  try {
    const { amount, type } = await c.req.json()
    
    // Exchange rate
    const rate = 0.0055 // 1 KRW = 0.0055 CNY
    
    // Fee calculation based on user type
    let platformFee = 0
    let spreadFee = 0
    
    if (type === 'individual') {
      platformFee = amount * 0.015 // 1.5%
      spreadFee = amount * 0.005 // 0.5%
    } else if (type === 'freelancer') {
      platformFee = amount * 0.03 // 3%
      spreadFee = amount * 0.01 // 1%
    } else if (type === 'corporate') {
      platformFee = amount * 0.01 // 1%
      spreadFee = amount * 0.005 // 0.5%
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
          }
          
          .hero-gradient {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          }
          
          .card-hover {
            transition: all 0.3s ease;
          }
          
          .card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.1);
          }
          
          .chatbot-button {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: var(--color-accent);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(255, 122, 0, 0.4);
            transition: all 0.3s ease;
            z-index: 1000;
          }
          
          .chatbot-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(255, 122, 0, 0.5);
          }
          
          .chatbot-panel {
            position: fixed;
            bottom: 0;
            right: 0;
            width: 100%;
            max-width: 420px;
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
          
          @media (min-width: 768px) {
            .chatbot-panel {
              bottom: 100px;
              right: 24px;
              border-radius: 16px;
              height: 600px;
            }
          }
          
          .faq-item {
            border-bottom: 1px solid var(--border-default);
            cursor: pointer;
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
          
          .language-selector {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="hero-gradient text-white py-6 sticky top-0 z-50">
            <div class="container mx-auto px-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-exchange-alt text-3xl text-orange-400"></i>
                        <h1 class="text-2xl font-bold" id="headerTitle">크로스보더</h1>
                    </div>
                    <div>
                        <select id="globalLang" class="bg-gray-700 text-white px-4 py-2 rounded-lg cursor-pointer language-selector">
                            <option value="ko">한국어</option>
                            <option value="en">English</option>
                            <option value="zh">中文</option>
                        </select>
                    </div>
                </div>
            </div>
        </header>

        <!-- Hero Section -->
        <section class="hero-gradient text-white py-20">
            <div class="container mx-auto px-4 text-center">
                <h2 class="text-4xl md:text-5xl font-bold mb-6" id="heroTitle">한중 정산의 새로운 기준</h2>
                <p class="text-xl md:text-2xl mb-8 opacity-90" id="heroSubtitle">빠르고 안전한 크로스보더 결제 서비스</p>
                <button onclick="scrollToCalculator()" class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition" id="heroButton">
                    지금 시작하기
                </button>
            </div>
        </section>

        <!-- Features Section -->
        <section class="py-16 bg-white">
            <div class="container mx-auto px-4">
                <h3 class="text-3xl font-bold text-center mb-12 text-gray-800" id="featuresTitle">서비스 특징</h3>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="card-hover bg-gray-50 p-8 rounded-xl">
                        <div class="text-orange-500 text-4xl mb-4">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <h4 class="text-xl font-bold mb-3 text-gray-800" id="feature1Title">신속한 처리</h4>
                        <p class="text-gray-600" id="feature1Desc">에스크로 기반 자동 정산으로 빠른 지급 처리</p>
                    </div>
                    <div class="card-hover bg-gray-50 p-8 rounded-xl">
                        <div class="text-orange-500 text-4xl mb-4">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h4 class="text-xl font-bold mb-3 text-gray-800" id="feature2Title">안전한 거래</h4>
                        <p class="text-gray-600" id="feature2Desc">AML/KYC 인증 및 거래 모니터링 시스템</p>
                    </div>
                    <div class="card-hover bg-gray-50 p-8 rounded-xl">
                        <div class="text-orange-500 text-4xl mb-4">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <h4 class="text-xl font-bold mb-3 text-gray-800" id="feature3Title">합리적 수수료</h4>
                        <p class="text-gray-600" id="feature3Desc">투명한 수수료 체계와 실시간 환율 적용</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Calculator Section -->
        <section class="py-16 bg-gray-50" id="calculator">
            <div class="container mx-auto px-4 max-w-2xl">
                <h3 class="text-3xl font-bold text-center mb-12 text-gray-800" id="calcTitle">수수료 계산기</h3>
                <div class="bg-white p-8 rounded-xl shadow-lg">
                    <div class="mb-6">
                        <label class="block text-gray-700 font-semibold mb-2" id="calcAmountLabel">송금 금액 (KRW)</label>
                        <input type="number" id="amount" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="1000000" min="0">
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 font-semibold mb-2" id="calcTypeLabel">이용자 유형</label>
                        <select id="userType" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            <option value="individual">개인 (1.5% + 0.5%)</option>
                            <option value="freelancer">프리랜서 (3% + 1%)</option>
                            <option value="corporate">법인 (1% + 0.5%)</option>
                        </select>
                    </div>
                    <button onclick="calculate()" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition" id="calcButton">
                        계산하기
                    </button>
                    
                    <div id="result" class="mt-6 hidden">
                        <div class="bg-gray-50 p-6 rounded-lg space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600" id="resultAmount">송금액</span>
                                <span class="font-semibold" id="resultAmountValue">0 KRW</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600" id="resultFee">총 수수료</span>
                                <span class="font-semibold text-orange-600" id="resultFeeValue">0 KRW</span>
                            </div>
                            <div class="border-t border-gray-300 pt-3 flex justify-between">
                                <span class="text-gray-800 font-bold" id="resultReceive">수취 예상액</span>
                                <span class="font-bold text-lg text-green-600" id="resultReceiveValue">0 CNY</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Use Cases Section -->
        <section class="py-16 bg-white">
            <div class="container mx-auto px-4">
                <h3 class="text-3xl font-bold text-center mb-12 text-gray-800" id="useCasesTitle">이용 사례</h3>
                <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div class="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg">
                        <i class="fas fa-briefcase text-orange-500 text-2xl mt-1"></i>
                        <div>
                            <h4 class="font-bold text-lg mb-2 text-gray-800" id="useCase1Title">프리랜서 정산</h4>
                            <p class="text-gray-600" id="useCase1Desc">한중 간 프리랜서 용역비 안전하게 정산</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg">
                        <i class="fas fa-shopping-cart text-orange-500 text-2xl mt-1"></i>
                        <div>
                            <h4 class="font-bold text-lg mb-2 text-gray-800" id="useCase2Title">상품 공급 대금</h4>
                            <p class="text-gray-600" id="useCase2Desc">쇼핑몰 공급업체 정산 자동화</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg">
                        <i class="fas fa-graduation-cap text-orange-500 text-2xl mt-1"></i>
                        <div>
                            <h4 class="font-bold text-lg mb-2 text-gray-800" id="useCase3Title">유학생 생활비</h4>
                            <p class="text-gray-600" id="useCase3Desc">학비 및 생활비 정기 송금</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg">
                        <i class="fas fa-handshake text-orange-500 text-2xl mt-1"></i>
                        <div>
                            <h4 class="font-bold text-lg mb-2 text-gray-800" id="useCase4Title">법인 거래</h4>
                            <p class="text-gray-600" id="useCase4Desc">계약 기반 대규모 정산</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white py-8">
            <div class="container mx-auto px-4 text-center">
                <p id="footerText">&copy; 2026 크로스보더. 모든 권리 보유.</p>
                <p class="text-gray-400 mt-2 text-sm" id="footerDisclaimer">본 서비스는 외국환 송금이 아닌 거래 기반 정산 플랫폼입니다.</p>
            </div>
        </footer>

        <!-- Chatbot Button -->
        <div class="chatbot-button" onclick="toggleChatbot()">
            <i class="fas fa-comments text-2xl"></i>
        </div>

        <!-- Chatbot Panel -->
        <div class="chatbot-panel" id="chatbotPanel">
            <div class="bg-orange-500 text-white p-4 flex items-center justify-between rounded-t-2xl">
                <h3 class="font-bold text-lg" id="chatbotTitle">환전·정산 자동 안내</h3>
                <div class="flex items-center space-x-3">
                    <select id="chatLang" class="bg-orange-600 text-white px-3 py-1 rounded cursor-pointer text-sm language-selector">
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                    </select>
                    <button onclick="toggleChatbot()" class="text-white hover:bg-orange-600 rounded p-1">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4" id="faqContainer">
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-spinner fa-spin text-3xl"></i>
                    <p class="mt-2">Loading...</p>
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
              heroButton: '지금 시작하기',
              featuresTitle: '서비스 특징',
              feature1Title: '신속한 처리',
              feature1Desc: '에스크로 기반 자동 정산으로 빠른 지급 처리',
              feature2Title: '안전한 거래',
              feature2Desc: 'AML/KYC 인증 및 거래 모니터링 시스템',
              feature3Title: '합리적 수수료',
              feature3Desc: '투명한 수수료 체계와 실시간 환율 적용',
              calcTitle: '수수료 계산기',
              calcAmountLabel: '송금 금액 (KRW)',
              calcTypeLabel: '이용자 유형',
              calcButton: '계산하기',
              resultAmount: '송금액',
              resultFee: '총 수수료',
              resultReceive: '수취 예상액',
              useCasesTitle: '이용 사례',
              useCase1Title: '프리랜서 정산',
              useCase1Desc: '한중 간 프리랜서 용역비 안전하게 정산',
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
              heroSubtitle: 'Fast and Secure Cross-Border Payment Service',
              heroButton: 'Get Started',
              featuresTitle: 'Service Features',
              feature1Title: 'Fast Processing',
              feature1Desc: 'Quick payment processing with escrow-based automated settlement',
              feature2Title: 'Secure Transactions',
              feature2Desc: 'AML/KYC verification and transaction monitoring system',
              feature3Title: 'Reasonable Fees',
              feature3Desc: 'Transparent fee structure and real-time exchange rates',
              calcTitle: 'Fee Calculator',
              calcAmountLabel: 'Transfer Amount (KRW)',
              calcTypeLabel: 'User Type',
              calcButton: 'Calculate',
              resultAmount: 'Transfer Amount',
              resultFee: 'Total Fee',
              resultReceive: 'Expected Received',
              useCasesTitle: 'Use Cases',
              useCase1Title: 'Freelancer Settlement',
              useCase1Desc: 'Secure settlement of freelance service fees between Korea and China',
              useCase2Title: 'Product Supply Payment',
              useCase2Desc: 'Automated settlement for shopping mall suppliers',
              useCase3Title: 'Student Living Expenses',
              useCase3Desc: 'Regular transfers for tuition and living expenses',
              useCase4Title: 'Corporate Transactions',
              useCase4Desc: 'Large-scale contract-based settlement',
              footerText: '© 2026 CrossBorder. All rights reserved.',
              footerDisclaimer: 'This service is a transaction-based settlement platform, not foreign exchange remittance.',
              chatbotTitle: 'Exchange & Settlement Auto-Guide',
              userTypeIndividual: 'Individual (1.5% + 0.5%)',
              userTypeFreelancer: 'Freelancer (3% + 1%)',
              userTypeCorporate: 'Corporate (1% + 0.5%)'
            },
            zh: {
              headerTitle: '跨境通',
              heroTitle: '韩中结算的新标准',
              heroSubtitle: '快速安全的跨境支付服务',
              heroButton: '立即开始',
              featuresTitle: '服务特点',
              feature1Title: '快速处理',
              feature1Desc: '基于托管的自动结算快速支付处理',
              feature2Title: '安全交易',
              feature2Desc: 'AML/KYC认证和交易监控系统',
              feature3Title: '合理费用',
              feature3Desc: '透明的费用结构和实时汇率',
              calcTitle: '费用计算器',
              calcAmountLabel: '转账金额 (KRW)',
              calcTypeLabel: '用户类型',
              calcButton: '计算',
              resultAmount: '转账金额',
              resultFee: '总费用',
              resultReceive: '预计收到',
              useCasesTitle: '使用案例',
              useCase1Title: '自由职业者结算',
              useCase1Desc: '韩中自由职业服务费的安全结算',
              useCase2Title: '商品供应付款',
              useCase2Desc: '购物中心供应商的自动结算',
              useCase3Title: '留学生生活费',
              useCase3Desc: '学费和生活费的定期转账',
              useCase4Title: '企业交易',
              useCase4Desc: '基于合同的大规模结算',
              footerText: '© 2026 跨境通。保留所有权利。',
              footerDisclaimer: '本服务是基于交易的结算平台，而非外汇汇款。',
              chatbotTitle: '兑换·结算自动指南',
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
              document.getElementById('faqContainer').innerHTML = '<p class="text-center text-red-500 py-8">Failed to load FAQ data</p>';
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
                <div class="faq-item py-4" onclick="toggleFAQ('\${item.id}')">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 pr-4">
                      <h4 class="font-semibold text-gray-800 mb-2">▶ \${item.title[lang]}</h4>
                      <div class="faq-content text-gray-600 text-sm" id="content-\${item.id}">
                        <p class="mt-2 pb-2">\${item.content[lang]}</p>
                      </div>
                    </div>
                  </div>
                </div>
              \`;
            });
            
            // Pagination
            if (faqData.faq.length > itemsPerPage) {
              const totalPages = Math.ceil(faqData.faq.length / itemsPerPage);
              html += '<div class="flex justify-center space-x-2 mt-4 pb-4">';
              for (let i = 0; i < totalPages; i++) {
                const activeClass = i === currentPage ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700';
                html += \`<button onclick="changePage(\${i})" class="\${activeClass} px-3 py-1 rounded">\${i + 1}</button>\`;
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
            
            // Update all text elements
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
            document.getElementById('globalLang').value = defaultLang;
            document.getElementById('chatLang').value = defaultLang;
          });
        </script>
    </body>
    </html>
  `)
})

export default app
