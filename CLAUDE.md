# RoutineLog 개발 가이드

## 개요
일상의 루틴을 기록하고 관리하는 웹 애플리케이션. React + TypeScript + Firebase + Tailwind CSS로 구축.

## 빌드 방법

### 환경 설정
1. Node.js 18+ 설치 확인
2. 프로젝트 폴더에서 의존성 설치:
```bash
npm install
```

3. `.env` 파일 생성 (Firebase 설정):
```
VITE_FIREBASE_API_KEY=<your-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-domain>
VITE_FIREBASE_PROJECT_ID=<your-project>
VITE_FIREBASE_STORAGE_BUCKET=<your-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저: http://localhost:5173

### 프로덕션 빌드
```bash
npm run build
```
결과: `dist/` 폴더에 정적 파일 생성

## 테스트 방법

### TypeScript 타입 체크
```bash
npx tsc --noEmit
```

### 수동 테스트 (권장)
1. dev 서버 실행 후 브라우저에서 테스트
2. **핵심 플로우:**
   - 로그인/회원가입
   - to-do 추가/수정/삭제/완료
   - 메모 추가/수정/삭제
   - 태그 관리 및 적용
   - 템플릿 저장/적용
   - 설정 변경 (정렬, 완료 모드 등)
3. **각 변경 후 새로고침** → 데이터 유지 확인

### 배포 확인
```bash
npm run build
npx vercel --prod
```

## 코딩 스타일 규칙

### TypeScript
- `types.ts`에 모든 타입/인터페이스 정의
- 컴포넌트 파일 상단에 `interface Props` 정의
- 암묵적 `any` 금지 → `npx tsc --noEmit`으로 검증

### 파일 구조
```
src/
├── App.tsx           # 루트 컴포넌트
├── auth.ts          # Firebase 인증 로직
├── firebase.ts      # Firebase 초기화
├── store.ts         # 상태 관리 (useStore hook)
├── types.ts         # 타입 정의
├── index.css        # 전역 스타일
├── main.tsx         # 엔트리포인트
└── components/
    ├── AuthScreen.tsx
    ├── ParentCard.tsx
    ├── SubTodoItem.tsx
    ├── DailyMemoSection.tsx
    ├── Calendar.tsx
    ├── AddTodoModal.tsx
    ├── TemplateModal.tsx
    ├── SettingsModal.tsx
    └── TagManageModal.tsx
```

### 컴포넌트 네이밍
- PascalCase (예: `ParentCard`, `DailyMemoSection`)
- 역할을 명확히 (Card, Item, Section, Modal, Screen)

### Tailwind CSS
- 인라인 클래스 사용 (BEM, CSS-in-JS 금지)
- 반응형: `text-[14px]`, `w-full` 등 명시적 값 사용
- 색상: `src/index.css`에 정의된 Tailwind config 값 사용
  - `bg-teal`, `text-error`, `border-border-def` 등

### Firebase Firestore
- `stripUndefined()` 함수로 undefined 필드 제거 후 저장
- 모든 save 실패 시 `setSaveError()` 호출 (UI에 오류 표시)
- 컬렉션 구조:
  ```
  users/{uid}/data/
    ├── parents (ParentTodo[])
    ├── subs (SubTodo[])
    ├── memos (MemoItem[])
    ├── templates (Template[])
    ├── settings (UserSettings)
    └── meta (tagList, tagColors)
  phones/{normalized} (전화번호 중복 확인)
  ```

### 함수/변수 네이밍
- camelCase (예: `addParent`, `updateSub`, `getMemosForDate`)
- 상태 업데이터: `set` 접두사 (예: `setParents`, `setLoading`)
- 이벤트 핸들러: `on` 접두사 (예: `onToggle`, `onDelete`, `onUpdate`)
- 상수: UPPER_SNAKE_CASE (예: `DEFAULT_SETTINGS`)

### 코드 스타일
- 줄 길이: 100자 이내 권장
- 들여쓰기: 2칸
- 세미콜론: 필수
- 따옴표: 싱글 또는 백틱 (템플릿 리터럴)

### 주석
- 주석 최소화 (코드가 자명해야 함)
- WHY가 명백하지 않은 경우에만 작성
- 예: `// Firestore는 undefined 값을 허용하지 않으므로 제거`

### UI/UX
- 모바일 우선 설계 (max-width: 480px 기준)
- 터치 친화적: 클릭 영역 최소 44px × 44px
- 드래그 가능 항목: `useSortable` 사용
- 오류 시 사용자 친화적 메시지 표시

## 배포

### Vercel
```bash
npx vercel --prod
```
- 자동 빌드 (vercel.json 참고)
- 환경 변수: Vercel 프로젝트 설정에서 `.env` 값 추가

### Firebase 규칙
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /phones/{phone} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 주의사항
- `localStorage` 사용: `rl_phone`, `rl_uid` 키만 사용
- 보안: Firebase 설정값(.env)은 절대 커밋 금지
- 새로고침 후에도 데이터 유지되는지 항상 확인
- 아이콘 크기 수정 시 전체 일관성 확인

## 개발 팁
- **dev 서버 항상 켜두기**: HMR로 즉시 반영
- **new Date() 시간대**: 항상 `.toISOString()` 사용 (UTC 표준)
- **드래그 핸들**: `dragHandleProps` 있을 때만 표시
- **모달 닫히고 고스트 클릭 방지**: `setBlockAddBtn` 사용
