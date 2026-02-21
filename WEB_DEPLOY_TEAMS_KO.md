# 웹접속 배포 가이드 (Teams 공유용)

현재 프로젝트는 정적 사이트(`index.html`, `styles.css`, `script.js`, `assets/`)라서
**MS Teams 전용 앱 연동 없이 URL 공유**가 가장 빠릅니다.

## 1) GitHub에 업로드
1. 새 GitHub 저장소 생성 (예: `fun-office`)
2. 현재 폴더를 `main` 브랜치로 push

## 2) GitHub Pages 자동배포 켜기
이 프로젝트에는 이미 워크플로우가 포함되어 있습니다.
- 파일: `.github/workflows/deploy-pages.yml`
- 동작: `main`에 push 시 자동 배포

GitHub 저장소에서 확인:
1. `Settings` -> `Pages`
2. `Build and deployment` 소스가 `GitHub Actions`인지 확인
3. `Actions` 탭에서 `Deploy Static Site To GitHub Pages` 성공 여부 확인

배포 URL 형식:
- `https://<github-username>.github.io/<repository-name>/`

현재 저장소 기준 실행 주소:
- `https://gitarcman101.github.io/fun-office/`

## 3) Teams에 공유
1. Teams 채널에 배포 URL 메시지로 공유
2. 채널 상단 `+` -> `Website` 추가
3. URL 입력 후 탭 이름(예: `에이전트 오피스`) 지정

이렇게 하면 팀원은 Teams 안에서 바로 웹 페이지를 열 수 있습니다.

## 4) 운영 시 권장사항
1. 배포는 `main` 브랜치만 사용
2. 변경 전 백업은 `backups/` 유지
3. 페이지 공개 범위 확인 (공개/비공개 정책)
4. URL이 바뀌면 Teams 탭 URL도 갱신
