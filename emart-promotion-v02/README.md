# 11월 프로모션 페이지 · 이번 구현본

- `site/`: 빌드가 완료된 정적 사이트입니다. 별도 설치 없이 정적 호스팅할 수 있습니다.
- `source/`: 수정 가능한 React·TypeScript 소스입니다.
- 저장소의 `downloads/`에서 사이트 업로드용 ZIP과 소스 ZIP을 받을 수 있습니다.

## 수정 및 검증

```sh
cd emart-promotion-v02/source
npm ci
npm run dev
npm test
npm run test:e2e
npm run build
```

Node.js 24와 시스템 Chromium에서 검증했습니다. 테스트 브라우저 경로는 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`로 지정할 수 있습니다.

## GitHub Pages

이 저장소에서 Pages를 `main` 브랜치 `/(root)`로 운영한다면, 이번 버전은 `emart-promotion-v02/site/` 경로에서 열 수 있습니다. 기존 루트 페이지와 `emart-november/`의 파일은 보존했습니다. Pages 설정은 이 커밋에서 변경하지 않습니다.

사이트 ZIP만 새 저장소 루트에 풀어 올리는 경우에는 ZIP 안의 `UPLOAD-GUIDE.md`를 따르세요.

## 검증 및 확인할 내용

일정 로직 테스트 13개, 데스크톱·모바일·자동 접근성 검사 38개, TypeScript·Vite 빌드가 통과했습니다. 저장소 하위 경로에서 이미지·폰트·점포 필터·상세 조건이 동작하는 것도 확인했습니다.

일부 행사 조건과 점포 정보는 확인 중인 검토용 시안입니다. 공식 로고 서버 접근이 제한되면 일반 텍스트로 대체합니다. 고래·상품 이미지는 예시 일러스트입니다. 폰트 이용 조건은 사이트의 `FONT-LICENSE.txt`를 확인하세요.
