# Portfolio entry — Scrolloop AI 개발 파이프라인

zaewc.site에 붙이기 위한 짧은 형식과, 클릭해서 들어갈 수 있는 deep dive 두 가지 포함.

---

## 짧은 버전 (site의 사이드 프로젝트 항목에 그대로)

### Scrolloop — Multi-Agent AI 개발 자동화 파이프라인

자체 OSS 라이브러리에 GitHub 이슈 라벨링만으로 AI(Gemini)가 plan 생성 → 코드 수정 → 자체 평가까지 자동화하는 파이프라인을 구축. n8n과 GitHub Actions를 분리해 trust boundary를 명시적으로 설계.

- **n8n (오케스트레이션) + GitHub Actions (격리 실행) 분리 설계** — n8n은 webhook 수신·검증·dispatch만, 코드 수정은 격리된 Actions 컨테이너에서. `workflow_dispatch`가 두 시스템의 신뢰 경계.
- **3-agent harness (Planner / Generator / Evaluator)** — 각 단계가 단일 책임, 산출물은 `.harness/<issue>/plan.md`·`review.md`로 PR diff에 commit해서 AI 결정 과정 전부 traceable.
- **다층 보안** — `X-Hub-Signature-256` 검증, author `OWNER`/`MEMBER`/`COLLABORATOR` 화이트리스트, 봇 재귀 가드, secret 파일 패턴 차단, 워크플로우에서 `NPM_TOKEN` / `id-token` 격리.
- **MTU mismatch root-cause 디버깅** — 학교 NAT(1400) + Tailscale(1280) + Docker bridge(1500) 충돌로 큰 POST 패킷이 silent drop, n8n → GitHub API 호출이 "connection timed out"으로 발현. Docker bridge MTU 1280 고정으로 해결, 워크플로우에 WHY 주석으로 보존.
- **Free tier API 한도 우회 설계** — gemini-2.5-flash / lite / 2.0-flash-lite 3-model CLI fallback + REST API 직접 호출 fallback. composite GitHub Action(`.github/actions/gemini`)으로 plan·implement·evaluate 3 job이 동일 로직 재사용.

링크: [github.com/zaewc/scrolloop](https://github.com/zaewc/scrolloop) · 워크플로우 [ai-dev.yml](https://github.com/zaewc/scrolloop/blob/develop/.github/workflows/ai-dev.yml) · 설계 문서 [docs/ai-pipeline.md](https://github.com/zaewc/scrolloop/blob/develop/docs/ai-pipeline.md)

스택: n8n · GitHub Actions · Gemini API · Tailscale Funnel · Docker Compose · TypeScript

---

## 깊이 들어가는 버전 (블로그/케이스 스터디 페이지용)

### 문제 정의

scrolloop는 직접 만든 가상 스크롤 OSS 라이브러리(React/Vue/Svelte 등 어댑터 6종). 새 기능·버그 처리 속도를 올리고 싶지만 모든 PR에 사람의 시간이 필요했음.

"GitHub 이슈에 라벨만 달면 AI가 plan + 코드 + 검증까지 끝낸 PR을 자동으로 만들어두면, 사람은 리뷰만 하면 된다"는 가설로 시작.

다만 **AI가 직접 코드를 수정**한다는 건 보안 모델이 복잡해진다. 그래서 단순한 "n8n에 코드 시키기"가 아니라, **trust boundary가 명시적으로 설계된 시스템**이 목표.

### 아키텍처 — 두 시스템의 분리

```
GitHub Event ──▶ n8n (검증 · 분류 · dispatch)
                       │
                       ▼
              GitHub Actions (격리된 코드 실행)
                       │
                       ▼
              ai/issue-N branch ──▶  Pull Request → develop
```

| 시스템         | 책임                                                                      | 권한                                     |
| -------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| n8n            | webhook 수신, 라벨 검증, 작성자 권한 확인, prompt 합성, workflow_dispatch | GitHub PAT (PR/issue/actions 쓰기)       |
| GitHub Actions | git checkout, AI 호출, 코드 수정, 검증, commit, push, PR 생성             | repo scoped GITHUB_TOKEN, NPM_TOKEN 없음 |

**핵심 원칙**: n8n은 코드 수정 권한 자체가 없음. 오케스트레이션 도구로서 편리하지만 임의 코드 실행 환경으로 신뢰하지 않음. 모든 코드 변경은 ephemeral Actions 컨테이너에서, 격리된 secret 범위로 실행.

### Harness 엔지니어링 — 3-agent 구조

AI 한 번에 "이슈 → PR"을 끝내는 단일 호출은 환각 위험이 크고 결과를 검증하기 어렵다. Planner / Generator / Evaluator로 책임 분리:

| Agent     | 역할                                                | 입력                   | 출력                          |
| --------- | --------------------------------------------------- | ---------------------- | ----------------------------- |
| Planner   | 이슈 분석 → 구체 계획 (코드 수정 금지)              | seed prompt            | `plan.md` (artifact + commit) |
| Generator | plan 그대로 구현 + 검증 (typecheck/lint/test/build) | `plan.md`              | 코드 변경, 검증 로그, PR      |
| Evaluator | plan vs diff 비교, verdict                          | `plan.md` + `git diff` | `review.md` (PR 코멘트)       |

각 산출물이 PR diff에 commit되므로 리뷰어가 "AI가 뭘 계획했고, 뭘 했고, 자기 평가는 어땠는지" PR 한 곳에서 추적 가능.

Verdict가 `BLOCKED`이면 워크플로우 자체를 실패시키고, `NEEDS_CHANGES`는 코멘트만 남기고 통과 — 리뷰어가 결정.

### 인프라 deployment

- **n8n 셀프호스팅** — Ubuntu 22.04 + Docker Compose + SQLite 영속화 + 기본 인증
- **Tailscale Funnel로 공개 HTTPS** — 학교 NAT가 80/443 표준 포트를 막아 Let's Encrypt 불가, 도메인 마이그레이션 없이 `*.ts.net`으로 outbound 터널 → GitHub Webhook이 도달 가능한 공개 HTTPS endpoint 확보
- **idempotent setup 스크립트** — Docker 설치, 시크릿 생성(`openssl rand`), 컨테이너 부팅, healthcheck 대기까지 한 줄

### 인상적인 버그 — MTU mismatch

n8n이 GitHub workflow_dispatch에 POST 보낼 때 마다 "connection timed out". 작은 GET (rate_limit 등)은 통과. 일관성 없는 실패 패턴이 의심스러웠음.

원인 추적:

- 호스트 `eth0` MTU **1400** (학교 NAT 환경)
- Docker bridge MTU **1500** (기본값)
- Tailscale `tailscale0` MTU **1280**
- n8n 컨테이너가 1500-byte 프레임으로 응답 → eth0 통과 못 함 → fragmentation 후 drop

수정 한 줄:

```yaml
networks:
  default:
    driver_opts:
      com.docker.network.driver.mtu: "1280"
```

근본 원인 + 수정 의도를 워크플로우에 WHY 주석으로 보존:

```yaml
# MTU pinned to 1280 because (a) the school NAT's eth0 only carries 1400-byte
# frames and (b) Tailscale's tailscale0 interface is 1280. Without this,
# Docker's default 1500-byte bridge fragments large outbound POSTs (e.g.
# n8n -> api.github.com workflow_dispatch) and they get silently dropped...
```

### Free tier API 한도 — fallback 체인 설계

Google AI Studio 무료 티어는 `gemini-2.5-flash` 일일 20 requests. CLI 내부에서 routing/summarization 용도로 같은 모델을 호출하기 때문에 우리가 `--model`로 다른 걸 지정해도 영향받음.

해결: composite action에서 다단계 fallback

1. CLI 시도 (모델 N개 순서대로) — 429 quota → next
2. (옵션) REST API 직접 호출 — CLI의 내부 fallback 회피

`.github/actions/gemini/action.yml`로 분리해서 plan/implement/evaluate 3 job이 같은 로직 재사용.

### 보안 모델

n8n과 Actions 양쪽에 적용되는 정책:

- **fork PR 절대 거부** — secret 노출 방지
- **작성자 화이트리스트** — `OWNER` / `MEMBER` / `COLLABORATOR`만 트리거 가능
- **봇 재귀 가드** — `[bot]` 작성자 코멘트는 무시 (자기 자신이 만든 코멘트로 다시 트리거되지 않게)
- **시크릿 분리** — n8n credentials store(`N8N_ENCRYPTION_KEY`로 암호화)에만, `.env` 안 둠
- **보호 파일 패턴** — `.github/workflows/cd.yml`, `.env*`, `*.pem`, `*.key`, `secrets.yml`, npm 토큰/리소스 등 AI 수정 금지 목록
- **publish 권한 자체 제거** — Actions 워크플로우에 `id-token` 없음, `NPM_TOKEN` env 없음 → AI가 npm 배포 시도 자체 불가
- **자동 머지 금지** — 모든 PR은 사람 검토 후 수동 머지

### 결과

- **GitHub 이슈에 `ai:ready` + `ai:plan|fix|test|docs` + `area:*` 라벨 → 자동 PR 생성** end-to-end 검증 완료
- 운영 비용 **\$0** (모든 컴포넌트 free tier 안에서 동작)
- n8n 워크플로우 3개, GitHub Actions 워크플로우 1개 + composite action 1개
- README/설계 문서 4개 (`docs/ai-pipeline.md`, `docs/ai-dev-prompt-template.md`, `infra/n8n/README.md`, 본 portfolio entry)
- 코드/설계 모두 [public repository](https://github.com/zaewc/scrolloop)에 공개

### 사용 기술

n8n · GitHub Actions · GitHub Webhooks · Gemini API (CLI + REST) · Tailscale Funnel · Docker Compose · Ubuntu · TypeScript · pnpm · turborepo
