# 한국사이버리터러시연구원 홈페이지

홈페이지 공개 배포 전용 저장소입니다. 연구 코드, 내부 문서 및 기존 저장소 이력을 포함하지 않습니다.

HTML, CSS, JavaScript와 홈페이지에서 연결하는 이미지·안내자료로 구성됩니다.

## 운영

GitHub Pages: main 브랜치 / (root).
문의는 전화 및 이메일로 연결됩니다. 홈페이지에서 신청정보를 수집하거나 저장하지 않습니다.

교육 일정과 비용, 자격 등록 조건은 담당자 및 관련 기관의 최신 안내를 확인하십시오.

## ISO 19011 온라인 강의 영상 등록

`iso-19011-classroom/lessons.json`에서 등록할 교시의 `title`과 `videoUrl`을 입력합니다. `id`는 교시 번호(1~14)입니다. 교시 제목을 비워 두면 번호만 표시되고 `videoUrl`이 비어 있으면 강의실에서 ‘영상 준비 중’으로 표시됩니다.

- 작은 영상은 `iso-19011-classroom/videos/`에 올리고 `videoUrl`에 `./videos/01.mp4`와 같이 상대 경로를 입력합니다.
- 큰 영상은 영상 호스팅 또는 파일 서버에 올리고 브라우저에서 열 수 있는 MP4·WebM 파일의 직접 HTTPS URL을 입력합니다. 아직 내려받지 않은 구간까지 탐색하려면 호스팅에서 HTTP 범위 요청을 지원해야 합니다. GitHub는 100 MiB를 초과하는 파일을 차단하며 GitHub Pages 공개 사이트의 크기 상한은 1 GB입니다. [GitHub 파일 제한](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github) · [GitHub Pages 제한](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- `main`에 반영한 뒤 공개 강의실에서 해당 교시의 재생과 탐색이 동작하는지 확인합니다. 다른 영상으로 교체할 때는 새 파일 주소를 사용해 새 영상의 수강 기록이 시작되도록 합니다.

공개 강의실의 **수강생 로그인**은 [계정으로 수강하는 강의실](https://kcli-iso19011-records.roknaoms.chatgpt.site/classroom)에 연결됩니다. KCLI 관리자가 사이트 공유 설정에서 수강생의 ChatGPT 계정 이메일을 초대하면, 수강생은 그 계정으로 로그인해 교시별 진도와 마지막 시청 위치를 계정에 저장할 수 있습니다. 실제 재생 구간의 합집합이 영상 길이의 90% 이상이면 완료로 표시됩니다.

[관리자 수강 기록 관리](https://kcli-iso19011-records.roknaoms.chatgpt.site/)에서 이메일 또는 수강생 번호로 검색하고 요약과 교시별 기록을 엑셀로 저장할 수 있습니다. 공개 강의실의 브라우저 기록은 기존 방식대로 수강생 번호를 입력해 JSON 파일로 저장하고 관리자에게 제출합니다.

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
