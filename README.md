# 크로스보더 (CrossBorder)

한-중 크로스보더 정산 플랫폼 - 빠르고 안전한 거래 기반 정산 서비스

## 프로젝트 개요

- **이름**: 크로스보더 (CrossBorder / 跨境通)
- **목표**: 한국-중국 간 개인, 프리랜서, 법인의 거래 기반 정산을 안전하고 효율적으로 중개
- **주요 특징**:
  - 다국어 지원 (한국어/영어/중국어)
  - 실시간 환율 계산 및 수수료 투명성
  - FAQ 챗봇을 통한 24시간 자동 고객 응대
  - 에스크로 기반 안전 정산
  - AML/KYC 규제 준수

## 공개 URL

- **개발 환경**: https://3000-iot2t2120ya3es4o3igia-cc2fbc16.sandbox.novita.ai
- **GitHub**: (추후 업데이트)
- **Production**: (Cloudflare Pages 배포 후 업데이트)

## 완료된 기능

### ✅ 핵심 기능
1. **다국어 시스템**
   - 한국어/영어/중국어 완벽 지원
   - 실시간 언어 전환 (헤더 및 챗봇)
   - 모든 UI 요소 번역 적용

2. **메인 랜딩 페이지**
   - 히어로 섹션 (서비스 소개)
   - 주요 특징 3가지 (신속/안전/합리적)
   - 이용 사례 4가지 (프리랜서/상품공급/유학생/법인)
   - 반응형 디자인 (모바일/태블릿/데스크톱)

3. **수수료 계산기**
   - 실시간 금액 입력 및 계산
   - 사용자 유형별 수수료 체계:
     - 개인: 1.5% + 0.5% (총 2%)
     - 프리랜서: 3% + 1% (총 4%)
     - 법인: 1% + 0.5% (총 1.5%)
   - KRW → CNY 환율 자동 변환
   - 수취 예상액 표시

4. **FAQ 챗봇 시스템**
   - 우측 하단 고정 챗봇 버튼
   - 25개 FAQ 항목 (10개씩 페이지네이션)
   - 아코디언 방식 질문/답변
   - 다국어 독립 언어 선택
   - 카테고리별 분류:
     - 서비스 이해 (4개)
     - 한도 관련 (5개)
     - 수수료·환율 (4개)
     - 지급 방식 (3개)
     - 규제·보안 (4개)
     - 책임 소재 (3개)
     - 확장·운영 (2개)

5. **API 엔드포인트**
   - `GET /api/exchange-rate`: 실시간 환율 조회
   - `POST /api/calculate`: 수수료 및 수취액 계산

### 🎨 디자인 시스템
- **메인 색상**: Deep Navy (#0F172A) - 신뢰감
- **보조 색상**: Midnight Blue (#1E293B) - 전문성
- **포인트 색상**: Orange (#FF7A00) - 행동 유도
- **폰트**: Inter + Noto Sans (다국어 최적화)
- **아이콘**: Font Awesome 6.4.0
- **CSS Framework**: Tailwind CSS (CDN)

## 데이터 구조

### FAQ 데이터
- **위치**: `/public/faq-data.json`
- **구조**:
  - `meta`: 기본 언어, 지원 언어, 페이지 크기
  - `faq[]`: 25개 FAQ 항목
    - `id`: 고유 식별자
    - `category`: 카테고리 분류
    - `title`: 다국어 제목 객체
    - `content`: 다국어 내용 객체

### 환율 및 수수료
- **기준 환율**: 1 KRW = 0.0055 CNY (Mock)
- **개인 사용자**: 플랫폼 수수료 1.5% + 환율 스프레드 0.5%
- **프리랜서**: 플랫폼 수수료 3% + 환율 스프레드 1%
- **법인**: 플랫폼 수수료 1% + 환율 스프레드 0.5%

## 한도 정책

### 개인 사용자
- 1회 한도: 100만 원
- 월 한도: 300~500만 원
- KYC 인증 시 상향 가능

### 프리랜서
- 1건당: 300~1,000만 원
- 월 한도: 3,000만 원

### 법인
- 계약 기반, 별도 승인 절차

## 아직 구현되지 않은 기능

### 🚧 백엔드 기능
1. **실제 환율 API 연동** (현재: Mock 데이터)
2. **사용자 인증 시스템** (KYC/AML)
3. **데이터베이스 연동** (Cloudflare D1)
4. **결제 게이트웨이 연동**
5. **에스크로 정산 로직**
6. **관리자 대시보드**

### 📱 프론트엔드 기능
1. **회원가입/로그인 페이지**
2. **마이페이지** (거래 내역, 한도 확인)
3. **실제 송금 신청 폼**
4. **거래 추적 시스템**
5. **알림 시스템**

## 권장 다음 단계

### 1단계: 데이터베이스 구축 (우선순위: 높음)
```bash
# Cloudflare D1 데이터베이스 생성
wrangler d1 create crossborder-production

# 마이그레이션 파일 생성
mkdir migrations
# users, transactions, wallets 테이블 설계
```

### 2단계: 인증 시스템 (우선순위: 높음)
- JWT 기반 인증
- KYC 단계별 인증 (기본/1단계/2단계)
- 세션 관리

### 3단계: 실제 API 연동 (우선순위: 중간)
- 환율 API: exchangerate-api.com 또는 Fixer.io
- PG 연동: Toss Payments, Stripe 등
- 중국 지급 파트너 API 연동

### 4단계: 관리 기능 (우선순위: 중간)
- 관리자 대시보드
- 거래 모니터링 (AML/FDS)
- 리포트 생성

### 5단계: Cloudflare Pages 배포 (우선순위: 높음)
```bash
# 배포 준비
npm run build

# Cloudflare Pages 프로젝트 생성
wrangler pages project create crossborder --production-branch main

# 배포
wrangler pages deploy dist --project-name crossborder
```

## 사용 가이드

### 로컬 개발 환경 실행

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 개발 서버 시작 (PM2)
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npm run dev:sandbox

# 테스트
curl http://localhost:3000
```

### 챗봇 사용 방법
1. 우측 하단의 주황색 챗봇 버튼 클릭
2. 상단에서 원하는 언어 선택
3. 질문 제목 클릭하면 답변이 아코디언으로 펼쳐짐
4. 하단 페이지네이션으로 추가 FAQ 확인

### 수수료 계산기 사용
1. 송금 금액 입력 (KRW)
2. 사용자 유형 선택 (개인/프리랜서/법인)
3. "계산하기" 버튼 클릭
4. 수수료와 수취 예상액 확인 (CNY)

## 배포 상태

- **플랫폼**: Cloudflare Pages
- **상태**: 🟡 로컬 개발 완료, 프로덕션 배포 대기
- **기술 스택**:
  - Frontend: HTML/CSS/JavaScript + Tailwind CSS
  - Backend: Hono (Cloudflare Workers)
  - Build: Vite
  - Runtime: Cloudflare Pages
- **마지막 업데이트**: 2026-01-05

## 기술적 특징

### Cloudflare Pages 최적화
- ✅ `serveStatic` from `hono/cloudflare-workers` (Node.js API 미사용)
- ✅ 정적 파일 서빙 (`/faq-data.json`)
- ✅ API 라우트 분리 (`/api/*`)
- ✅ SSR 렌더링 via Hono JSX
- ✅ Edge Runtime 호환

### 보안 및 규제 준수
- 외국환 송금이 아닌 **거래 기반 정산 플랫폼**
- 소액 한도 설정으로 AML 리스크 최소화
- 거래 목적 명시 필수
- 에스크로 기반 안전 정산

## 라이선스

© 2026 크로스보더. 모든 권리 보유.

본 서비스는 외국환 송금이 아닌 거래 기반 정산 플랫폼입니다.

---

**개발자**: GenSpark AI Assistant  
**프로젝트 코드명**: webapp → crossborder  
**버전**: MVP v1.0
