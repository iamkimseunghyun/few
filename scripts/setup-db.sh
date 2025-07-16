#!/bin/bash

echo "🚀 few 데이터베이스 설정 스크립트"
echo "================================"

# Docker 실행 여부 확인
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker가 실행되고 있지 않습니다. Docker Desktop을 실행해주세요."
    exit 1
fi

# PostgreSQL 컨테이너 시작
echo "📦 PostgreSQL 컨테이너 시작 중..."
docker-compose up -d

# PostgreSQL이 준비될 때까지 대기
echo "⏳ PostgreSQL이 준비될 때까지 대기 중..."
sleep 5

# .env.local 파일 생성
if [ ! -f .env.local ]; then
    echo "📝 .env.local 파일 생성 중..."
    cp .env.local.example .env.local
    echo "✅ .env.local 파일이 생성되었습니다."
    echo "⚠️  Clerk 키를 실제 값으로 교체해주세요!"
else
    echo "✅ .env.local 파일이 이미 존재합니다."
fi

# 데이터베이스 마이그레이션
echo "🔄 데이터베이스 마이그레이션 실행 중..."
npm run db:push

echo ""
echo "✨ 설정 완료!"
echo "다음 명령어로 개발 서버를 실행하세요:"
echo "  npm run dev"
echo ""
echo "📌 Docker 컨테이너 관리:"
echo "  docker-compose stop  # 중지"
echo "  docker-compose start # 재시작"
echo "  docker-compose down  # 삭제"