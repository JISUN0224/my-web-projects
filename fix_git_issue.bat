@echo off
echo "Git 캐시에서 .env 파일 제거 중..."

cd "C:\Users\jisun\Desktop\MyProjectWeb_doctor\my-web-projects"

git rm --cached -r Shadowing/.env
git rm --cached -r shadowing/.env 2>nul

echo "변경사항 커밋 중..."
git add .
git commit -m "Remove API keys from repository and secure environment variables"

echo "강제 푸시 중..."
git push origin main --force

echo "완료! API 키가 제거되었습니다."
pause
