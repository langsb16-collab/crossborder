#!/bin/bash
cd /home/user/webapp

# Python으로 exchange.html을 TypeScript template literal로 변환
python3 << 'PYEOF' > /tmp/exchange-route.ts
with open('/home/user/webapp/public/exchange.html', 'r') as f:
    html = f.read()
# Escape for template literal
html = html.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
print(f'''
app.get('/exchange', (c) => {{
  return c.html(`{html}`)
}})
''')
PYEOF

# index.tsx에서 /exchange 라우트 부분만 교체
sed -i '/^\/\/ Exchange rates cache/,$!d' src/index.tsx
cat > src/index.tsx.new << 'EOF'
import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/faq-data.json', serveStatic({ root: './public' }))

EOF

cat /tmp/exchange-route.ts >> src/index.tsx.new
echo "" >> src/index.tsx.new
cat src/index.tsx >> src/index.tsx.new
mv src/index.tsx.new src/index.tsx

# 빌드
npm run build

# PM2 재시작
pm2 restart crossborder

echo "✅ 완료"
