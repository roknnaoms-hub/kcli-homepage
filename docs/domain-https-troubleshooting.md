# KCLI 대표 도메인 HTTPS 트러블슈팅

대상은 수강생이 접속하는 `www.kcli.ai.kr`입니다. 홈페이지 담당자는 변경 때마다 이 문서 하단의 이력을 갱신하고, 도메인 관리자는 가비아 DNS 변경 전후 값을 보관합니다.

## 장애 이력

| 확인일 (한국시간) | 증상과 측정 결과 | 조치 및 상태 |
|---|---|---|
| 2026-11-17 | 대표 도메인으로 접속할 때 보안 경고와 로그인 문제가 보고됐습니다. 가비아 포워딩을 변경했다는 운영자 기록이 있습니다. | 당시 대표 주소의 HTTPS 인증서와 한글·영문 로그인 경로를 함께 통과한 기록은 없습니다. |
| 2026-11-20 | 공개 DNS에서 `www` A가 `121.254.178.231`(TTL 600초)로 응답했고 CNAME·AAAA 응답은 없었습니다. HTTP는 상태 200인 HTML의 즉시 이동 태그로 GitHub Pages 원본을 열었습니다. HTTPS 직접 요청은 이번 점검망에서 503을 반환했습니다. 원본 한글·영문 홈페이지는 각각 200이었습니다. | **미복구.** 가비아 포워딩으로는 대표 주소의 HTTPS를 제공할 수 없습니다. 매일 08:00(한국시간) 대표 도메인 점검을 등록했습니다. DNS 변경, 인증서 발급 및 아래 복구 검증이 남아 있습니다. |

## 증상별 확인 및 조치

| 증상 | 먼저 확인할 항목 | 조치 및 판정 |
|---|---|---|
| HTTP로만 접속됨 | `www`의 A·AAAA·CNAME, HTTP 첫 응답의 Location 또는 HTML 이동 태그, HTTPS 첫 응답 | 포워딩 IP가 응답하면 GitHub Pages 사용자 지정 도메인으로 전환합니다. 원본 홈페이지가 열리는 것만으로 장애를 종결하지 않습니다. |
| DNS를 바꿨는데 이전 화면이 열림 | 가비아 권한 네임서버와 두 공개 DNS의 `www` CNAME 및 TTL | 권한 서버부터 변경값을 확인하고 캐시가 갱신된 후 재검사합니다. 다른 가비아 네임서버·공개 DNS 결과도 기록합니다. |
| CNAME이 맞으나 인증서 경고 또는 404 | Pages의 도메인 연결·배포 상태, 인증서 이름·만료일, 충돌하는 `www` 레코드, 제한적 CAA가 있을 때 발급기관 허용 여부 | Pages에 도메인이 등록되어 있는지 확인합니다. DNS 검사 및 인증서 발급이 끝나면 Enforce HTTPS를 켜고 대표 주소를 직접 엽니다. 오류 페이지를 정상으로 기록하지 않습니다. |
| 한글은 열리나 영문·로그인에서 실패 | `/`, `/en/` 응답과 화면 언어, 수강생 로그인 링크의 목적지, 로그인 페이지의 언어 | 두 경로 모두 아래 운영 LMS로 연결되는지 확인합니다. 개발 강의실이나 HTTP 프레임이 열리면 홈페이지 링크 또는 포워딩을 바로잡습니다. |
| 교육 직전 장애 | 원본 홈페이지 및 운영 LMS의 독립 접속 | 실제로 열린 주소만 임시 공지합니다. 전환 중에는 GitHub 기본 주소도 대표 주소로 이동할 수 있으므로 운영 LMS 직접 주소를 별도로 검사합니다. |

## 전환 순서

1. 가비아 DNS 관리툴에서 `www`의 활성 레코드, TTL, 포워딩 대상을 확보합니다. 포워딩 해지가 루트 도메인(`@`)에도 영향을 주는지 확인하고, 이번 전환은 `www`에 한정합니다.
2. 가비아 변경이 가능한 시점에 운영 저장소 Settings → Pages에서 게시 방식을 확인하고 **Custom domain**에 `www.kcli.ai.kr`을 등록합니다. 브랜치 게시에서는 게시 루트의 `CNAME` 파일에 이 호스트명 한 줄을 보존합니다. 사용자 지정 Actions 게시에서는 Pages 설정에서 등록합니다. 원본에서 대표 주소로 리디렉션될 수 있으므로 DNS 전환과 이어서 진행합니다.
3. 가비아에서 `www` 포워딩과 충돌하는 기존 `www` A/AAAA 레코드를 정리하고 **CNAME · 호스트 `www` · 값 `roknnaoms-hub.github.io.`** 를 적용합니다. 다른 호스트, MX 및 TXT는 이 변경 대상에서 제외합니다.
4. GitHub Pages의 DNS 검사와 인증서 발급을 확인하고 **Enforce HTTPS**를 활성화합니다. HTTPS가 먼저 성공한 뒤 HTTP 강제 전환을 확인합니다.
5. 복구 확인표를 실행하고 한국시간, DNS 응답, 인증서 만료일, 양쪽 홈페이지와 LMS 응답을 이력에 추가합니다. 관리자·수강생 비밀번호와 세션 정보는 기록하지 않습니다.

## 복구 확인표

| 검사 | 통과 기준 |
|---|---|
| DNS | 권한 서버와 공개 DNS에서 `www.kcli.ai.kr`의 CNAME이 `roknnaoms-hub.github.io.`로 일치합니다. |
| TLS | 일반 클라이언트가 인증서 검증을 켠 상태에서 연결합니다. 인증서가 `www.kcli.ai.kr`에 유효하고 만료 전입니다. 만료 14일 전부터 경고 대상으로 관리합니다. |
| HTTP 전환 | HTTP 첫 요청이 301·302·307·308로 대표 주소의 HTTPS로 이동합니다. |
| 한글·영문 홈페이지 | HTTPS `/`와 `/en/`가 각각 200이며 KCLI 한글 및 영문 화면이 열립니다. 스타일과 주요 이미지가 로드됩니다. |
| 운영 LMS | 두 홈페이지의 수강생 로그인에서 운영 LMS가 열립니다. 새 세션에서 한글·영문 로그인 화면이 각각 표시돼야 합니다. |

### 점검 명령

```sh
dig @ns.gabia.co.kr www.kcli.ai.kr CNAME +noall +answer
dig @1.1.1.1 www.kcli.ai.kr CNAME +noall +answer
dig @8.8.8.8 www.kcli.ai.kr CNAME +noall +answer
curl -sSI http://www.kcli.ai.kr/
curl -fsSL -o /dev/null -w '%{http_code} %{url_effective}\n' https://www.kcli.ai.kr/
curl -fsSL -o /dev/null -w '%{http_code} %{url_effective}\n' https://www.kcli.ai.kr/en/
openssl s_client -connect www.kcli.ai.kr:443 -servername www.kcli.ai.kr -verify_hostname www.kcli.ai.kr -verify_return_error </dev/null
```

### 복구가 지연될 때

운영 강의실에 직접 접속해 정상임을 확인한 뒤 해당 주소를 안내합니다. DNS가 이미 GitHub로 바뀌었다면 Pages 도메인 등록을 단독으로 해제하지 않습니다. 이전 구성으로 복귀할 때는 가비아에서 저장해 둔 레코드와 포워딩을 복원하고 DNS 전파를 확인한 뒤 Pages 등록을 해제합니다. 이전 포워딩의 복원은 HTTP 임시 경로 복원으로 기록하며 HTTPS 장애는 열린 상태로 둡니다.

[운영 홈페이지 원본](https://roknnaoms-hub.github.io/kcli-homepage/) · [한글 운영 LMS](https://kcli-iso19011-records.roknaoms.chatgpt.site/classroom) · [영문 운영 LMS](https://kcli-iso19011-records.roknaoms.chatgpt.site/classroom?lang=en)

[가비아 포워딩 HTTPS 지원 범위](https://customer.gabia.com/faq/detail/959/6128) · [GitHub Pages 도메인 설정](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) · [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
