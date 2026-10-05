# GIT_FLOW.md

## Git & Collaboration Workflow

### 1. Branching Strategy (Trunk-based)

Đây là dev base: mọi thay đổi commit thẳng lên `main`. Không dùng `develop`,
`feature/*`, `release/*` hay `hotfix/*`. Chỉ tạo branch ngắn hạn khi có chỉ
định riêng (ví dụ PR cần review hoặc Dependabot).

`main` luôn phải qua `npm run verify`; mỗi release là một tag trên `main`.

---

### 2. Release Flow

1. Bump version bằng `npm version <x.y.z> --no-git-tag-version` (cập nhật
   `package.json` và `package-lock.json`), cập nhật `sdkVersion` trong
   `src/internal/version.ts` và `CHANGELOG.md`.
2. Commit các file dự định phát hành
   (`chore(release): bump version to x.y.z`) trước khi chạy artifact gate:
   gate này quan sát đúng `HEAD` thông qua `git archive`, không phải working
   tree.
3. Chạy `npm run verify`, `npm run ci`, và
   `npm run packaged-example -- --platform android`.
4. Push lên `main`, chờ GitHub packaged-consumer matrix (Android và iOS) xanh.
5. Đánh tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z" && git push origin vX.Y.Z`.

Sửa lỗi khẩn cấp đi cùng luồng trên với version PATCH mới.

---

### 3. Commit Message Standards (Conventional Commits)

Format:
```text
<type>(<scope>): <short description>

[body - optional]
```

- **Allowed types:**
  - `feat`: A new SDK capability or public feature.
  - `fix`: A bug fix.
  - `refactor`: Code restructuring without changing behavior.
  - `perf`: Code optimization to improve performance.
  - `chore`: Tooling, dependencies, or configuration changes.
  - `ci`: Continuous-integration configuration or gates.
  - `docs`: Documentation updates.
  - `test`: Adding or modifying tests.
  - `revert`: Reverting a previous commit.

- **Rules:**
  - Tiếng Anh, câu mệnh lệnh, viết thường.
  - Dòng đầu tối đa 72 ký tự, **không** có dấu chấm ở cuối.
  - Nhóm commit logic (Atomic commits), không tạo commit rác blob.

---

### 4. Collaboration Rules

1. **Rebase First:** Luôn `git pull --rebase origin main` trước khi push để giữ git graph tuyến tính, tránh merge commit thừa.
2. **NO Co-author Metadata:** Không đính kèm co-author (`Co-authored-by: ...`) vào commit message.
3. **Pre-push Checklist:**
   - [ ] `npm run verify` chạy thành công (0 lint warnings, tests pass 100%).
   - [ ] `npm run ci` chạy thành công cho thay đổi liên quan CI, packaging hoặc release.
   - [ ] `npm run packaged-example -- --platform android` chạy thành công từ committed `HEAD` cho thay đổi native, packaging hoặc `exports`.
   - [ ] Nếu đổi public API: các report trong `etc/` đã được review và commit.
   - [ ] Không có secret, credential hoặc log debug thừa.
   - [ ] Không tự tạo git worktrees nếu không có chỉ định riêng.
