# 한국사이버리터러시연구원 홈페이지

홈페이지 공개 배포 전용 저장소입니다. 연구 코드, 내부 문서 및 기존 저장소 이력을 포함하지 않습니다.

HTML, CSS, JavaScript와 홈페이지에서 연결하는 이미지·안내자료로 구성됩니다.

## 운영

GitHub Pages: main 브랜치 / (root).
문의는 전화 및 이메일로 연결됩니다. 홈페이지에서 신청정보를 수집하거나 저장하지 않습니다.

교육 일정과 비용, 자격 등록 조건은 담당자 및 관련 기관의 최신 안내를 확인하십시오.

## 검색 노출 관리

- 공개 페이지의 대표 주소는 `https://roknnaoms-hub.github.io/kcli-homepage/`입니다. 공개 페이지 주소가 추가되거나 변경되면 `sitemap.xml`과 각 페이지의 대표 주소를 함께 확인합니다.
- 저장소 루트의 `3bd4ce3f1a1d7b30d0acefab32a9f253.txt`는 IndexNow 요청에 사용하는 공개 확인 파일입니다. 네이버에 갱신을 알릴 때 `keyLocation`에는 `/kcli-homepage/` 아래에 배포된 이 파일의 전체 URL을 지정합니다.

## ISO 조항 이미지 갱신

`index.html`의 연수교육 표준 4~10항을 수정한 경우 SVG와 PNG를 다시 생성합니다. Node.js, Playwright Chromium과 Noto Sans CJK KR 글꼴이 필요합니다.

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node scripts/build-iso-datasheets.cjs
```

생성된 `assets/iso-datasheets/` 파일을 HTML 변경과 함께 커밋합니다. 표준 판 또는 추록 번호가 바뀌면 해당 표준의 이미지 링크 파일명도 바꿉니다.
