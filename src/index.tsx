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
            width: 56px;
            height: 56px;
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
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(255, 122, 0, 0.5);
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
        <section class="hero-gradient text-white py-12 md:py-16">
            <div class="container mx-auto px-4 text-center">
                <h2 class="text-2xl md:text-4xl font-bold mb-3 md:mb-4" id="heroTitle">한중 정산의 새로운 기준</h2>
                <p class="text-base md:text-xl mb-4 md:mb-6 opacity-90 single-line" id="heroSubtitle">빠르고 안전한 크로스보더 결제 서비스</p>
                <button onclick="scrollToCalculator()" class="btn-primary bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition" id="heroButton">
                    지금 시작하기
                </button>
            </div>
        </section>

        <!-- Features Section - 여백 최소화 -->
        <section class="py-8 md:py-12 bg-white">
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

        <!-- Calculator Section -->
        <section class="py-8 md:py-12 bg-gray-50" id="calculator">
            <div class="container mx-auto px-4 max-w-xl">
                <h3 class="text-xl md:text-2xl font-bold text-center mb-6 text-gray-800" id="calcTitle">수수료 계산기</h3>
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
        <section class="py-8 md:py-12 bg-white">
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
            <i class="fas fa-comments text-xl"></i>
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
              heroButton: '지금 시작하기',
              featuresTitle: '서비스 특징',
              feature1Title: '신속한 처리',
              feature1Desc: '에스크로 기반 자동 정산',
              feature2Title: '안전한 거래',
              feature2Desc: 'AML/KYC 인증 시스템',
              feature3Title: '합리적 수수료',
              feature3Desc: '투명한 수수료 체계',
              calcTitle: '수수료 계산기',
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
              heroButton: 'Get Started',
              featuresTitle: 'Service Features',
              feature1Title: 'Fast Processing',
              feature1Desc: 'Escrow-based settlement',
              feature2Title: 'Secure',
              feature2Desc: 'AML/KYC verification',
              feature3Title: 'Fair Fees',
              feature3Desc: 'Transparent pricing',
              calcTitle: 'Fee Calculator',
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
              heroButton: '立即开始',
              featuresTitle: '服务特点',
              feature1Title: '快速处理',
              feature1Desc: '托管自动结算',
              feature2Title: '安全',
              feature2Desc: 'AML/KYC认证',
              feature3Title: '合理费用',
              feature3Desc: '透明定价',
              calcTitle: '费用计算器',
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
