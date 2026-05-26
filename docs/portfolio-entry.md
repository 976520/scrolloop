### 0. tl;dr

- **목표**: GitHub 이슈에 라벨만 달면 AI가 plan(계획) → 코드 수정 → 자체 평가까지 끝낸 PR을 자동으로 만들어두는 시스템을 구축하는 것입니다.
- **제약**: 안전해야 합니다(AI에게 무한 권한 X). 무료여야 합니다(학생 프로젝트). 격리되어야 합니다(n8n 자체를 임의 코드 실행 환경으로 신뢰하지 않습니다).
- **결과**: n8n 워크플로우 3종 + GitHub Actions 3-agent harness + composite action + Tailscale Funnel로 공개 endpoint를 구성했습니다. 모든 컴포넌트가 무료 티어 안에서 동작하며, 실제 GitHub 이슈에 라벨을 다는 것만으로 자동 PR이 생성되는 end-to-end 흐름까지 검증을 완료했습니다.

---

### 1. 출발점 — 왜 만들었나

scrolloop은 직접 만든 windowing 기반 가상 스크롤 OSS 라이브러리입니다. windowing이란 화면에 실제로 보이는 항목만 DOM에 그리고 나머지는 placeholder로 두는 렌더링 기법으로, 수천 개 항목이 있는 리스트도 부드럽게 표시할 수 있게 해줍니다[^windowing]. turborepo[^turborepo] 모노레포 구조로 React / React Native / Preact / Vue / Svelte 5개 프레임워크 어댑터를 동시에 지원하다 보니, 작은 변경 하나에도 5곳을 살펴봐야 하는 구조였습니다. 누적 다운로드 2,000+ 건을 기록하고 있지만, 이슈 백로그 처리 속도가 느려져 답답함을 느끼고 있었습니다.

그래서 다음과 같은 가설을 세웠습니다. _"이슈에 `ai:ready` + `ai:fix` 같은 라벨을 다는 것만으로 AI가 plan + 코드 수정 + 자체 검증까지 마친 PR을 자동으로 올려두면, 사람은 리뷰만 하면 된다."_

하지만 단순히 "n8n에 AI를 시키기"로는 안 됩니다. AI가 직접 코드를 수정한다는 것은 다음과 같은 위험을 동반합니다.

- **secret 노출 위험**: AI가 자신이 받은 토큰 / API 키를 prompt에 그대로 노출할 가능성
- **scope creep**: AI가 지시받은 범위를 벗어나 다른 파일까지 수정하는 가능성
- **무한 루프**: AI가 만든 PR에 AI 봇이 코멘트를 달고, 그 코멘트로 또 AI가 트리거되는 재귀 가능성
- **fork PR 공격**: 외부인이 PR 코멘트로 AI 트리거를 호출해 저장소 secret을 외부로 빼돌리는 가능성

그래서 _"n8n에 코드 시키기"_ 가 아니라, **trust boundary**(신뢰 경계 — "어디까지를 신뢰할 수 있는 영역이고 어디서부터는 격리해야 하는가"를 명시적으로 그은 선)가 설계의 출발점이 되었습니다.

[^windowing]: [React Virtual / TanStack Virtual의 windowing 설명](https://tanstack.com/virtual/latest/docs/introduction)

[^turborepo]: [Turborepo 공식 문서](https://turborepo.com/docs)

---

### 2. 시스템 아키텍처 — trust boundary 명시 설계

![](https://velog.velcdn.com/images/haensol/post/7d1298cd-71ae-4513-b6b0-5bff92a9f4ca/image.png)

> **n8n[^n8n] 이란?** Zapier와 비슷한 시각적 워크플로우 자동화 도구이지만, 오픈소스에 셀프호스트가 가능합니다. HTTP 요청 / 조건 분기 / 데이터 변환 같은 작은 노드들을 캔버스에서 선으로 잇는 방식으로 자동화를 구성합니다.
>
> **workflow_dispatch[^workflow-dispatch] 란?** GitHub Actions 워크플로우를 외부 API 호출로 트리거하는 메커니즘입니다. `POST /repos/{owner}/{repo}/actions/workflows/{file}/dispatches` 한 번이면 워크플로우가 시작됩니다.

|                    | 책임                                                                                           | 권한                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **n8n**            | webhook 수신, 라벨 / 권한 검증, prompt 합성, workflow_dispatch 호출                            | GitHub PAT (issues / PR / actions 쓰기)                           |
| **GitHub Actions** | git checkout, AI 호출, 코드 수정, 검증(typecheck / lint / test / build), commit, push, PR 생성 | repo-scoped `GITHUB_TOKEN`, **`NPM_TOKEN` 없음**, `id-token` 없음 |

**핵심 원칙**: n8n은 *임의 코드 실행 환경*으로 신뢰하지 않습니다. 오케스트레이션 도구로서는 편리하지만, 보안적으로는 "이벤트를 받고 → 검증하고 → GitHub Actions에 위임"하는 read / dispatch-only 역할만 부여했습니다. 모든 코드 변경은 ephemeral한(워크플로우가 끝나면 즉시 삭제되는) Actions 컨테이너 안에서, 격리된 secret 범위로만 실행됩니다.

> _"n8n에 AI 시키면 안 되나요?"_ — n8n 자체가 외부 노출 endpoint이고, 한 번 침해되면 영향 범위가 전체로 퍼집니다. 코드 실행을 GitHub Actions로 분리하면 침해 표면(attack surface)이 줄어들고, secret이 Actions 쪽에만 존재하므로 n8n 침해와 무관하게 보호됩니다. supply chain 공격을 줄이는 일반적인 정석[^supply-chain] 을 따른 결과이기도 합니다.

[^n8n]: [n8n 공식 사이트](https://n8n.io/)

[^workflow-dispatch]: [GitHub Actions — workflow_dispatch 이벤트](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)

[^supply-chain]: [SLSA — Supply chain Levels for Software Artifacts](https://slsa.dev/) — 빌드 / 배포 단계별로 신뢰 경계를 분리하는 업계 표준 프레임워크입니다.

---

### 3. n8n 워크플로우 — webhook receiver 3종

GitHub 이벤트를 받는 n8n 워크플로우 3개를 만들었습니다. 각각이 다른 트리거에 반응합니다.

> **n8n 노드 기초** — 각 노드는 위쪽 핀(입력) / 오른쪽 핀(출력)을 가집니다. `Webhook` 노드는 HTTP 요청을 받고, `If` 노드는 조건 분기로 true / false 두 출력을 가지며, `Set` 노드는 데이터를 변환하고, `HTTP Request` 노드는 외부 API를 호출합니다.

#### 3.1 Issue 워크플로우

![](https://velog.velcdn.com/images/haensol/post/6b885438-d4ad-4d41-bd59-7a871110f645/image.png)

이슈에 라벨이 달리는 순간 시작됩니다. 노드 순서는 다음과 같습니다.

1. **Webhook** (POST `/webhook/scrolloop-issues`) — GitHub의 `issues` 이벤트를 수신합니다.
2. **Label gate (If)** — 다음 세 조건을 한 표현식으로 한 번에 검사합니다.
   - `ai:ready` 라벨이 있는지
   - `ai:blocked` 라벨이 없는지
   - `ai:dangerous` 라벨이 없는지
3. **Author check (If)** — 이슈 작성자의 `author_association`이 `OWNER` / `MEMBER` / `COLLABORATOR` 중 하나인지[^author-association] 검사합니다. `CONTRIBUTOR`(이전에 PR 한 번 올린 적 있는 외부인)는 의도적으로 제외합니다.
4. **Build dispatch payload (Set)** — 라벨로 `task_type`을 분류하고, 이슈 제목 + 본문 + 영역 라벨로 prompt를 합성합니다.
   - `ai:plan` → `task_type = plan`
   - `ai:fix` → `task_type = bugfix`
   - `ai:test` / `ai:docs` → 그대로
5. **Dispatch ai-dev.yml (HTTP Request)** — GitHub API `workflow_dispatch` POST를 호출합니다. JSON body는 `JSON.stringify(...)`로 prompt의 `\n`을 안전하게 인코딩합니다(따옴표 / 줄바꿈이 그대로 들어가면 JSON 파싱이 깨집니다).

각 노드는 false branch로 빠지는 경우 조용히 종료됩니다. 잘못된 이벤트(다른 라벨 / 외부인 / 봇 작성)는 거기서 흐름이 끝나며 GitHub Actions로 전달되지 않습니다.

[^author-association]: [GitHub `author_association` 값 종류](https://docs.github.com/en/graphql/reference/enums#commentauthorassociation) — OWNER / MEMBER / COLLABORATOR / CONTRIBUTOR / FIRST_TIME_CONTRIBUTOR / FIRST_TIMER / MANNEQUIN / NONE이 있습니다.

#### 3.2 PR 코멘트 워크플로우

![](https://velog.velcdn.com/images/haensol/post/9fbc755a-f8ca-451d-b2e4-c446dedc559b/image.png)

PR에 슬래시 커맨드 코멘트가 달리면 시작됩니다.

- 허용 커맨드: `/ai-plan`, `/ai-fix`, `/ai-test`, `/ai-docs`, `/ai-review` 5종
- 그 외 자연어 코멘트는 전부 무시합니다(자연어 명령은 prompt injection 위험이 크므로 화이트리스트 방식으로 차단합니다[^prompt-injection]).

1. **Webhook** (POST `/webhook/scrolloop-pr-comments`) — `issue_comment` 이벤트를 수신합니다.
2. **PR slash command (If)** — 정규식 `^\/ai-(plan|fix|test|docs|review)\b` 매치와 `issue.pull_request` 객체 존재 여부를 함께 검사합니다(GitHub은 일반 이슈 코멘트도 `issue_comment` 이벤트로 보내기 때문에 PR 코멘트만 골라내야 합니다).
3. **Comment author check (If)** — 코멘트 작성자 권한을 검증합니다.
4. **Build dispatch payload (Set)** — 커맨드를 `task_type`으로 매핑하고(`/ai-fix` → `bugfix`, `/ai-review` → `plan`), 코멘트 본문 + PR 컨텍스트로 prompt를 합성합니다.
5. **Dispatch ai-dev.yml (HTTP Request)** — 동일한 endpoint를 호출합니다.

[^prompt-injection]: [OWASP LLM Top 10 — LLM01: Prompt Injection](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — LLM 보안의 가장 일반적인 위협으로, 사용자 입력을 system instruction과 섞지 않는 것이 기본 방어책입니다.

#### 3.3 Apply review 워크플로우 (실험적)

![](https://velog.velcdn.com/images/haensol/post/16873e5f-5877-43e0-a2ce-cb32a9eea657/image.png)

`/ai-apply-review` 커맨드 전용입니다. 일반 슬래시 커맨드와 다른 점은 **PR에 달린 다른 사람 / 다른 AI 봇(Gemini Code Assist, CodeRabbit 등)의 코멘트까지 모두 수집**해서 한 번에 코드에 반영한다는 점입니다.

1. **Webhook** + **Trigger gate (If)** — `/ai-apply-review` 매치 + 작성자 권한 + 봇 재귀 가드(`[bot]` 접미사가 붙은 작성자는 무시)를 한 번에 검사합니다.
2. **Get PR (HTTP GET)** — `GET /repos/{owner}/{repo}/pulls/{n}` — PR의 `head.ref`(브랜치 이름)와 base 브랜치를 획득합니다.
3. **Get comments (HTTP GET)** — `GET /repos/{owner}/{repo}/issues/{n}/comments` — PR에 달린 모든 코멘트(사람 + 봇 모두)를 수집합니다.
4. (이후) Code 노드로 prompt를 합성하고, `head_branch` 입력을 포함해 `ai-dev.yml`로 dispatch합니다. 이때 원래 PR 브랜치에 commit이 추가되며 PR이 자동 업데이트되는 구조입니다.

핵심은 `head_branch` 입력입니다. `ai-dev.yml`에 idempotent[^idempotent] 한 checkout 로직을 추가해서, 같은 이름의 브랜치가 이미 원격에 있으면 거기에 이어서 commit하고, 없으면 새로 만드는 방식으로 동작하도록 했습니다. 즉 같은 이슈를 여러 번 처리해도 매번 새 브랜치를 만들지 않고 기존 PR을 업데이트합니다.

```bash
# ai-dev.yml의 idempotent checkout 로직
git fetch origin "$BRANCH_NAME" 2>/dev/null || true
if git rev-parse --verify "origin/$BRANCH_NAME" >/dev/null 2>&1; then
  git checkout -B "$BRANCH_NAME" "origin/$BRANCH_NAME"
  echo "Continuing on existing branch $BRANCH_NAME"
else
  git checkout -B "$BRANCH_NAME"
  echo "Created new branch $BRANCH_NAME from develop"
fi
```

[^idempotent]: 같은 입력으로 여러 번 실행해도 결과가 같은 성질입니다. CI / 배포 자동화에서는 "한 번 더 돌렸을 때 망가지지 않는다"는 의미로 매우 중요한 속성입니다.

---

### 4. GitHub Actions ai-dev.yml — 3-agent harness

처음에는 단일 Gemini 호출 한 번으로 "이슈 → PR"을 끝내려고 했지만, 두 가지 문제가 보였습니다.

- **환각(hallucination)**: AI가 plan을 세우는 동시에 코드를 수정하다 보니 plan에 없는 변경이 슬쩍 들어가는 경우가 있었습니다.
- **검증 불가**: AI가 만들어낸 결과물이 좋은지 나쁜지 판단하려면 사람이 모든 PR을 정독해야 했습니다.

[브런치에서 본 _harness engineering_ 글](https://brunch.co.kr/@aimuse/84)이 인상적이었습니다. AI 한 명에게 모든 책임을 맡기지 말고 Planner / Generator / Evaluator 세 역할로 나누면 각 단계가 명확한 입출력을 가지게 되고, 산출물이 파일로 남아 추적 가능하다는 아이디어였습니다. 사람 팀의 PM / 개발자 / QA 구조를 그대로 AI에 옮긴 셈입니다. 이 패턴을 그대로 적용해봤습니다.

> **agent loop / agentic CLI 란?** AI 모델이 한 번의 응답을 생성하고 끝나는 것이 아니라, 도구(파일 읽기 / 쓰기 / 명령 실행)를 호출하고 그 결과를 다시 입력으로 받아 다음 행동을 결정하는 반복 루프를 말합니다. Gemini CLI의 `--yolo` 모드는 이 도구 호출을 자동 승인하는 옵션입니다.

#### 4.1 Job 1 — Planner

```yaml
- name: Run Planner (Gemini)
  uses: ./.github/actions/gemini
  with:
    api_key: ${{ secrets.GEMINI_API_KEY }}
    prompt_file: .ai/prompt.txt
    output_file: .harness/${{ inputs.issue_number }}/plan.md
    models: ${{ vars.GEMINI_MODELS || 'gemini-2.5-flash,...' }}
    allow_rest_fallback: "true"
```

Planner의 prompt는 read-only를 명확히 강제합니다.

> You are the PLANNER agent. ... DO NOT modify any files. If you call any file-edit tool, you fail.

출력 형식도 사람이 다음 단계에서 따라가기 쉬운 구조로 enforce합니다.

```markdown
# Plan

## Goal (한 단락)

## Affected files (예상 경로 bullet)

## Steps (번호 매긴 구체 단계, 파일 경로 명시)

## Test plan (실행할 기존 테스트 + Generator가 추가할 새 테스트)

## Risks / unknowns

## Out of scope
```

산출물 `.harness/<n>/plan.md`는 `actions/upload-artifact`[^artifact] 로 업로드해서 다음 job에 전달합니다.

[^artifact]: [GitHub Actions — artifact를 통한 job 간 데이터 공유](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts) — Actions 컨테이너는 job마다 새로 만들어지기 때문에 디스크가 공유되지 않습니다. artifact는 그 사이의 파일을 전달하는 공식 메커니즘입니다.

#### 4.2 Job 2 — Generator

`needs: plan`으로 Planner 완료 후 시작합니다. artifact를 다운로드해서 plan.md 내용을 prompt에 inject합니다.

> You are the GENERATOR agent. Implement EXACTLY the plan at `.harness/<n>/plan.md`. ... If the plan is ambiguous, do the MINIMAL safe interpretation and leave a TODO comment. Do not invent new scope.

이후 다음 순서로 진행합니다.

- `--yolo` 모드로 Gemini가 도구 호출(파일 읽기 / 쓰기)을 자동 승인합니다.
- 코드 수정이 끝나면 verify step에서 `pnpm typecheck` / `lint` / `test` / `build`를 순차 실행하고, 하나라도 실패하면 워크플로우 전체를 fail 처리합니다.
- plan.md를 commit에 포함시켜서 코드 변경분과 함께 push합니다.
- `gh pr create`로 PR을 새로 만들거나(이미 PR이 있으면 `gh pr edit`로 본문만 갱신) 처리합니다.

`task_type = plan` 모드일 때는 Generator가 코드 수정 단계를 건너뛰고 plan.md만 commit해서 PR을 엽니다. 즉 "이번 이슈는 일단 계획만 제출하고 검토받자"는 흐름을 지원합니다.

#### 4.3 Job 3 — Evaluator

`needs: [plan, implement]`로 두 job이 모두 끝난 뒤에 시작하며, `task_type = plan`이면 skip합니다.

```yaml
- name: Compute diff vs develop
  run: |
    git fetch origin develop
    git diff origin/develop...HEAD > .ai/diff.patch
```

Evaluator는 plan.md + diff.patch를 prompt에 inject받아 평가만 수행합니다.

> You are the EVALUATOR agent. ... Compare implementation to plan. ...
>
> Required output:
>
> ## Verdict (PASS | NEEDS_CHANGES | BLOCKED)
>
> ## Plan vs implementation
>
> ## Concerns
>
> ## Verification observations

Verdict별로 동작이 갈립니다.

- `PASS` → 워크플로우 success로 끝나고, PR 코멘트에 review.md를 게시합니다.
- `NEEDS_CHANGES` → 코멘트만 게시하고 워크플로우는 success로 둡니다. 사람 리뷰어가 보고 결정하게 합니다.
- `BLOCKED` → 워크플로우를 실패 처리해서 GitHub UI에서 빨간 X로 즉시 인지할 수 있도록 합니다.

Evaluator도 도구를 잘못 호출해서 코드 파일을 수정하려고 시도할 수 있으니, Gemini 실행 직후 `git checkout -- .` + `git clean -fd`로 부수 효과를 전부 되돌리고 review.md만 남겨둡니다. 그 다음 `.harness/<n>/review.md`를 commit + push합니다.

#### 4.4 산출물 traceability

PR diff에 모든 산출물이 그대로 보입니다.

```
+ .harness/42/plan.md     ← Planner가 만든 계획
+ packages/core/src/...   ← Generator가 만든 코드 변경
+ .harness/42/review.md   ← Evaluator의 평가
```

리뷰어는 한 PR에서 _"AI가 무엇을 하려고 했고 → 실제로 무엇을 했고 → 자기 평가는 어땠는지"_ 를 시간 순으로 추적할 수 있습니다. 단일 호출 방식이었다면 결과만 보고 "맞나? 틀렸나?"를 추측해야 했을 부분입니다.

---

### 5. Composite GitHub Action — Gemini fallback chain

3개 job 모두 Gemini를 호출하지만 호출 패턴(인자, fallback 로직)이 같으니 [.github/actions/gemini/action.yml](../.github/actions/gemini/action.yml)로 분리했습니다. 이것을 composite action[^composite] 이라고 합니다.

```yaml
jobs:
  plan:
    steps:
      - uses: ./.github/actions/gemini
        with:
          prompt_file: .ai/prompt.txt
          output_file: .harness/<n>/plan.md
          models: gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash-lite
          allow_rest_fallback: "true"
```

action 내부 동작은 다음과 같습니다.

1. `npm install -g @google/gemini-cli`[^gemini-cli] — CLI를 설치합니다(자동 캐싱).
2. `MODELS_CSV`를 순회하면서 CLI 시도합니다.
   - HTTP 429 (quota 초과) → 다음 모델로 넘어갑니다.
   - 그 외 에러 → 즉시 중단합니다(반복해도 통과하지 않을 에러이므로).
3. CLI 전부 실패 + `allow_rest_fallback = true`이면 REST API 직접 호출을 시도해서 CLI 자체를 우회합니다.

Planner와 Evaluator는 read-only 텍스트 생성이라 REST fallback에 의미가 있지만, Generator는 agentic하게 파일을 수정해야 하므로 REST fallback이 의미가 없어서 끕니다(REST 한 번 호출로 끝나는 응답으로는 다중 파일 수정을 할 수 없습니다).

[^composite]: [GitHub Actions — composite action 만들기](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-composite-action) — 여러 step을 한 묶음으로 재사용 가능하게 만든 GitHub Actions의 작은 패키지입니다.

[^gemini-cli]: [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) — Google이 공식 출시한 Gemini CLI로, 파일 시스템 접근 / 명령 실행 / Git 통합 같은 도구들을 갖춘 agentic CLI입니다.

---

### 6. 인프라 — n8n 셀프호스팅 + 공개 endpoint

#### 6.1 환경

- Ubuntu 22.04 머신(학교 네트워크 안쪽)
- Docker Compose로 n8n 단일 컨테이너 + SQLite 영속화
- Basic Auth + `N8N_BLOCK_FILE_ACCESS_TO_N8N_FILES=true`로 기본 보안 적용
- secret은 `.env`(`N8N_ENCRYPTION_KEY`)에만 두고, GitHub PAT은 n8n credential store에 별도로 등록합니다. credential store는 `N8N_ENCRYPTION_KEY`로 암호화되므로 워크플로우 JSON을 export해도 토큰이 평문으로 노출되지 않습니다.

#### 6.2 공개 HTTPS — Tailscale Funnel 선택

처음에는 Caddy[^caddy] 로 Let's Encrypt[^lets-encrypt] 인증서를 발급받으려 했지만, 학교 NAT가 표준 80 / 443 포트를 차단하고 30000 ~ 39999 범위 비표준 포트만 외부 매핑을 허용했습니다. Let's Encrypt의 HTTP-01 챌린지[^http-01]는 도메인의 80 포트로 도달 가능해야 하는데 그게 불가능한 환경이었습니다.

대안을 다음과 같이 검토했습니다.

- **Cloudflare Tunnel**[^cloudflare-tunnel]: 가비아에 등록된 zaewc.site DNS를 Cloudflare로 NS 이전해야 합니다. 다른 서비스(Vercel에 호스팅된 메인 사이트)에 영향이 갈 가능성이 있어 제외했습니다.
- **Tailscale Funnel**[^tailscale-funnel]: DNS 이전 없이 `*.ts.net` 도메인으로 즉시 가능합니다. 도메인 모양이 다르지만 GitHub Webhook은 URL만 보고 호출하므로 무관합니다.

Tailscale Funnel을 선택했습니다. 별도 컨테이너 없이 호스트에서 `tailscale funnel --bg 5678` 한 줄로 공개 HTTPS endpoint(`https://n8n-scrolloop.taila4171b.ts.net`)를 확보했습니다. 동작 원리는 다음과 같습니다.

1. 서버에서 tailscaled가 Tailscale 클라우드로 outbound 연결을 만듭니다.
2. Cloudflare가 발급한 인증서로 Tailscale의 엣지에서 TLS를 종단합니다.
3. 평문 트래픽은 tailscale tunnel을 통해 서버로 들어옵니다.
4. 서버에 inbound 포트는 단 하나도 열려 있지 않아도 됩니다.

즉 학교 NAT가 표준 포트를 막아도, 비표준 포트를 막아도 영향 받지 않습니다. outbound만 살아있으면 동작합니다.

[^caddy]: [Caddy 공식 사이트](https://caddyserver.com/) — Go로 만든 reverse proxy로 Let's Encrypt 자동 발급이 기본 기능입니다.

[^lets-encrypt]: [Let's Encrypt](https://letsencrypt.org/) — 무료 TLS 인증서를 발급해주는 비영리 CA입니다.

[^http-01]: [Let's Encrypt — HTTP-01 챌린지](https://letsencrypt.org/docs/challenge-types/#http-01-challenge) — 도메인 소유권을 증명하기 위해 도메인의 80 포트 특정 경로에 임시 파일을 두고 Let's Encrypt가 그것을 fetch해서 확인합니다.

[^cloudflare-tunnel]: [Cloudflare Tunnel 공식 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — 서버에서 cloudflared 데몬을 띄워 Cloudflare로 outbound 연결을 만들고, 그 위에 공개 HTTPS endpoint를 노출하는 서비스입니다.

[^tailscale-funnel]: [Tailscale Funnel 공식 문서](https://tailscale.com/kb/1223/funnel) — Tailscale의 mesh VPN 위에 만든 공개 HTTPS 노출 기능으로, 개인 사용 무료입니다.

#### 6.3 Idempotent setup script

`infra/n8n/setup.sh`로 호스트 셋업을 자동화했습니다.

- Docker가 없으면 `get.docker.com` 공식 설치 스크립트로 설치합니다.
- `.env`가 없으면 `openssl rand`로 `N8N_ENCRYPTION_KEY`를 생성하고 Basic Auth password를 자동 생성합니다(1회만 출력해서 사용자가 옮겨 적도록).
- `docker compose up -d` 실행 + healthcheck 폴링까지 한 번에 처리합니다.

이 스크립트 한 줄로 호스트 셋업이 끝나며, 재실행해도 안전합니다(이미 있는 파일은 건드리지 않습니다).

---

### 7. 디버깅 — root-cause 추적

#### 7.1 MTU mismatch — "connection timed out"

**증상**: n8n에서 GitHub의 `workflow_dispatch`로 POST를 보내면 매번 _"connection timed out"_ 에러가 발생했습니다. 같은 컨테이너에서 `wget https://api.github.com/rate_limit` 같은 작은 GET 요청은 정상이었습니다.

*일관성 없는 실패 패턴*이 첫 번째 단서였습니다. 어떤 요청은 통과하고 어떤 요청은 막히는 패턴이 보이면 ▶ 페이로드 크기가 의심됩니다.

> **MTU(Maximum Transmission Unit)란?** 네트워크에서 한 번에 보낼 수 있는 패킷의 최대 크기입니다(보통 이더넷에서 1500 bytes). MTU보다 큰 데이터는 작은 조각(fragment)으로 쪼개서 보내야 합니다. 경로 중간의 어느 한 곳이라도 MTU가 작으면 거기서 fragmentation이 일어나거나, DF(Don't Fragment) 플래그가 켜져 있으면 그냥 drop됩니다[^pmtud].

확인한 결과:

```
host eth0    MTU 1400   ← 학교 NAT 환경 제한
docker0      MTU 1500   ← Docker 기본값
tailscale0   MTU 1280   ← Tailscale Funnel
```

n8n 컨테이너가 1500-byte 프레임으로 데이터를 보내면 호스트 eth0(1400)을 통과하지 못하고, DF 플래그가 켜진 모던 TCP 환경에서는 그대로 silent drop됩니다. 작은 GET은 패킷이 작아서 우연히 통과하고, 큰 POST(prompt가 들어간 workflow_dispatch body는 수 KB)는 항상 막힙니다.

수정은 한 줄로 끝났습니다.

```yaml
networks:
  default:
    driver_opts:
      com.docker.network.driver.mtu: "1280"
```

근본 원인을 워크플로우 주석에 보존해서 미래의 나(또는 다른 협업자)가 _"왜 1280?"_ 하고 다시 물어보지 않도록 했습니다.

```yaml
# MTU pinned to 1280 because (a) the school NAT's eth0 only carries 1400-byte
# frames and (b) Tailscale's tailscale0 interface is 1280. Without this,
# Docker's default 1500-byte bridge fragments large outbound POSTs (e.g.
# n8n -> api.github.com workflow_dispatch) and they get silently dropped...
```

[^pmtud]: [RFC 1191 — Path MTU Discovery](https://datatracker.ietf.org/doc/html/rfc1191) — 두 호스트 사이의 가장 좁은 통로 MTU를 자동으로 찾아내는 표준입니다. 중간 라우터의 ICMP 메시지가 차단되면 PMTUD가 깨져서 우리 사례 같은 silent drop으로 이어집니다.

#### 7.2 Gemini CLI 내부 모델 routing

**증상**: `GEMINI_MODEL = gemini-2.5-flash-lite`로 설정했는데도 에러 메시지에는 `gemini-2.5-flash`의 일일 한도(20 RPD = Requests Per Day) 초과가 표시되었습니다.

추론: Gemini CLI가 내부 라우팅 / 요약 / context 압축 용도로 `gemini-2.5-flash`를 항상 호출하는 것으로 보입니다. `--model` 인자는 메인 응답 모델에만 적용되고 내부 호출에는 영향이 없습니다.

해결: composite action에서 두 단계 fallback을 만들었습니다. CLI가 전부 실패하면 REST API 직접 호출로 CLI 자체를 우회합니다. Plan / Evaluate처럼 텍스트 생성만 필요한 phase는 REST로 충분히 대체 가능합니다.

#### 7.3 Actions PR 생성 권한 차단

**증상**: `ai-dev.yml`에서 `gh pr create` 호출 시 _"GitHub Actions is not permitted to create or approve pull requests"_ 에러가 발생했습니다.

**원인**: 저장소 Settings → Actions → Workflow permissions의 _"Allow GitHub Actions to create and approve pull requests"_ 토글이 기본적으로 OFF입니다[^actions-permissions]. 보안 기본값으로, 명시적으로 활성화해야 합니다.

**수정**: API 한 줄로 활성화했습니다.

```bash
gh api -X PUT repos/zaewc/scrolloop/actions/permissions/workflow \
  -f default_workflow_permissions=write \
  -F can_approve_pull_request_reviews=true
```

다만 같은 토글이 _"approve"_ 권한도 함께 켜는 점은 주의해야 합니다. 우리 워크플로우 코드에 `gh pr review` / `gh pr merge`를 절대 넣지 않는 것으로 우회했습니다 — AI가 자기 PR을 자기가 approve / merge할 수 있는 권한 자체를 코드 레벨에서 사용하지 않습니다.

[^actions-permissions]: [GitHub Docs — Workflow permissions in a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#preventing-github-actions-from-creating-or-approving-pull-requests)

---

### 8. 보안 모델

위협 / 정책을 한 표로 정리했습니다.

| 영역                | 위협                                        | 정책                                                                                          |
| ------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| fork PR             | 외부인이 secret 유출 노릴 수 있음           | 절대 거부 (`pull_request.head.repo.fork === true` 체크)                                       |
| 작성자              | 임의 외부인 트리거                          | `OWNER` / `MEMBER` / `COLLABORATOR` 화이트리스트, `CONTRIBUTOR` 제외                          |
| 봇 재귀             | AI 코멘트로 AI 트리거 → 무한 루프           | `[bot]` 접미사가 붙은 작성자 코멘트는 무시                                                    |
| webhook 위변조      | 누군가가 GitHub인 척 webhook 흉내내기       | `X-Hub-Signature-256` HMAC 검증[^webhook-hmac] (구현 예정 — TODO)                             |
| 시크릿 저장         | export / log에 평문 누출                    | n8n credentials store(`N8N_ENCRYPTION_KEY`로 암호화)에만 두고 `.env`에는 안 둠                |
| 보호 파일           | AI가 CI / 시크릿 / 배포 설정 수정           | `.github/workflows/cd.yml`, `.env*`, `*.pem`, `*.key`, `secrets.yml`, npm 토큰 관련 모두 차단 |
| publish 권한        | AI가 npm에 임의 패키지 publish 시도         | Actions에 `id-token` 없음, `NPM_TOKEN` env 안 줌 → AI가 publish 명령 자체를 실행 불가         |
| 자동 머지           | AI가 자기 PR을 자기 머지                    | 절대 금지. 모든 PR은 사람 검토 후 수동 머지                                                   |
| 자연어 명령         | prompt injection으로 정책 우회              | 거부. 슬래시 커맨드 화이트리스트만 인식                                                       |
| AI 출력 → 코드 수정 | Planner / Evaluator가 의도치 않게 코드 수정 | Generator만 가능. Planner / Evaluator는 출력 후 `git checkout -- .`로 부수 효과 revert        |

[^webhook-hmac]: [GitHub Docs — Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) — `X-Hub-Signature-256` 헤더의 HMAC-SHA256 서명을 비밀 토큰으로 검증하는 표준 방식입니다. timing attack을 피하기 위해 constant-time 비교 함수(`crypto.timingSafeEqual`)를 써야 합니다.

---

### 9. 결과 + 검증

end-to-end 라벨 트리거 검증을 GitHub 이슈 #22로 수행했습니다.

1. `gh issue edit 22 --add-label ai:ready --add-label ai:plan` 실행
2. GitHub Webhook → n8n production URL로 200 OK 응답
3. n8n에서 라벨 / 권한 / 봇 필터 통과 → `workflow_dispatch` 호출
4. GitHub Actions `ai-dev.yml`에서 Planner 실행 → Gemini 호출 → `plan.md` 생성 → 워크플로우 끝까지 진행
5. (Gemini quota 회복 후) PR #50 plan-mode 검증 완료, Planner 산출물 품질을 직접 확인

**운영 비용**:

- Tailscale Funnel: **\$0** (개인용 무료)
- Gemini API: **\$0** (Google AI Studio 무료 티어, `gemini-2.5-flash` + `lite` + `gemini-2.0-flash-lite`)
- GitHub Actions: **\$0** (public repo 무료 분량 안에서 충분)
- 호스트: **\$0** (학교에서 제공)

**규모**:

- n8n 워크플로우: **3개** (Issue / PR comment / Apply review)
- GitHub Actions: **1개 workflow + 1 composite action**
- 설계 / 운영 문서: **4개** (`docs/ai-pipeline.md`, `docs/ai-dev-prompt-template.md`, `infra/n8n/README.md`, 본 portfolio entry)
- 코드 / 설계 모두 [public repository](https://github.com/zaewc/scrolloop)에 공개

---

### 10. 회고

- **trust boundary 명시 설계**: n8n과 GitHub Actions를 처음부터 분리했더니, 이후 _"어디까지 신뢰하나?"_ 같은 의사결정이 자명해졌습니다. 보안 리뷰가 쉬워졌고, 새로운 워크플로우를 추가할 때도 _"이 작업은 어느 쪽에 두는 게 맞는가?"_ 가 단번에 결정됐습니다.
- **3-agent harness**: 책임 분리로 환각이 줄어들었고, 산출물이 PR diff에 남아서 사람 리뷰가 빨라졌습니다. 단순 단일 호출 대비 큰 가치를 확인했습니다.
- **composite action으로 재사용**: 처음에는 3 job에 Gemini fallback 로직을 복붙해뒀다가 분리했습니다. 다음에 비슷한 패턴(예: CI 실패 요약 워크플로우)을 만들 때 한 줄(`uses: ./.github/actions/gemini`)로 끝납니다.
- **MTU 디버깅**: 초반에는 "GitHub 토큰 문제 아닐까" 같은 표면적 의심으로 한참 헤맸지만, 결국 *일관성 없는 실패 패턴*이 결정적인 단서가 됐습니다. 표면 증상에서 멈추지 않고 root cause(MTU mismatch)까지 추적한 경험이 재미있었습니다.

**다음에 다르게 할 것 / TODO**

- **webhook HMAC 검증**: 현재는 작성자 화이트리스트만 있는데, GitHub Secret을 webhook에 설정하고 n8n에서 `X-Hub-Signature-256`을 검증하는 노드를 추가하면 더 안전해집니다.
- **CI 실패 자동 코멘트 워크플로우**: n8n에 webhook 등록 + log 요약 + PR 코멘트하는 4번째 워크플로우를 만드는 것이 다음 작업입니다.
- **모니터링 / 알림**: dispatch 실패 시(예: Gemini quota 소진) 알림이 없습니다. Discord webhook으로 알림 보내는 노드를 추가하면 좋을 듯합니다.
- **검증 자동화**: 매일 한 번 자동 dispatch + PR 생성까지 가는 smoke test가 있으면 좋겠습니다. 현재는 수동입니다.
- **n8n credential 대신 OIDC**: GitHub PAT 대신 GitHub App + OIDC[^oidc] 로 가면 토큰 회전을 신경 쓰지 않아도 됩니다.

[^oidc]: [GitHub Actions — OIDC를 통한 시크릿 없는 클라우드 배포](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect) — 장기 secret을 워크플로우에 두지 않고 매번 short-lived 토큰을 발급받는 방식입니다.

---

### 11. 사용 기술

**오케스트레이션**: n8n 2.21 · GitHub Webhooks · GitHub Actions (`workflow_dispatch`, composite actions, artifact share)
**AI**: Google Gemini API (CLI + REST) · `gemini-2.5-flash` / `-lite` / `gemini-2.0-flash-lite` fallback chain
**인프라**: Ubuntu 22.04 · Docker Compose · Tailscale Funnel · SQLite
**언어 / 빌드**: TypeScript · pnpm · turborepo · vitest · Playwright
**보안**: HMAC 서명, author allowlist, secret 분리, MTU 고정, 봇 재귀 가드
