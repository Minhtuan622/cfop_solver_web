# Checklist chủ repo (không phải code)

Tài liệu này liệt kê các biện pháp bảo vệ kho chứa `Minhtuan622/cfop_solver_web`
trên nhánh `main`. Không phải mã nguồn — chỉ là quy định vận hành cho chủ kho
(và những ai có quyền quản lý kho).

## 1. Branch protection cho `main`

**Đã bật** trên nhánh `main` với các điều kiện sau:

- **Require a pull request before merging**: PR là bắt buộc (không cần review
  duyệt, 0 approval).
- **Require status checks to pass before merge**: các check bắt buộc sau phải xanh
  trước khi merge:
  - `Rust solver (fmt, clippy, test)` (cargo fmt/clippy/test cho `packages/solver`)
  - `check-test-build` (build bộ giải WASM + typecheck + unit tests + e2e + build + audit)
  - `Solver benchmark (WASM)` (bộ đo bộ giải ở chế độ kiểm tra ngưỡng thời
    gian, xem mục 2.1)
- **Require branches to be up to date before merging** (`strict`): đây là điều
  kiện quan trọng nhất cho Dependabot — một nhánh Dependabot tạo từ `main` cũ sẽ
  không được merge cho tới khi được cập nhật, nên không thể vô tình đè lên thay
  đổi mới (đúng cái đã xảy ra với PR #23, làm mất các thay đổi D1).
- **Require conversation resolution before merge**: mọi bình luận trên PR phải
  được giải quyết trước khi merge.
- Không cho force push và không cho xoá nhánh.
- **Do not allow bypassing**: đang để `enforce_admins` tắt, nên chủ kho vẫn push
  trực tiếp được khi cần (giữ nguyên thói quen làm việc). Muốn siết hơn thì
  bật "Do not allow bypassing the above settings" trong Settings → Branches.

Quy trình merge: PR → CI xanh toàn bộ check bắt buộc → merge.

## 2.1. Các check của bộ giải trong branch protection

Từ khi bộ giải chuyển sang Rust/WebAssembly, branch protection của `main`
phải yêu cầu đúng ba check:

- `Rust solver (fmt, clippy, test)` (cargo fmt/clippy/test cho `packages/solver`)
- `check-test-build` (build bộ giải WASM + typecheck + unit test + e2e + build + audit)
- `Solver benchmark (WASM)` (bộ đo bộ giải ở chế độ kiểm tra ngưỡng thời
  gian)

**Việc của chủ kho khi chuyển đổi:** trong Settings → Branches → `main`, gỡ hai
check cũ không còn chạy (`Solver tests (pytest)` và check `Solver benchmark`
của engine cũ) rồi thêm `Rust solver (fmt, clippy, test)` và `Solver benchmark
(WASM)`. Nếu còn giữ check cũ, mọi PR sẽ đứng ở trạng thái "Expected —
Waiting for status to be reported" và không merge được.

Kiểm tra lại bằng:

```bash
gh api repos/Minhtuan622/cfop_solver_web/branches/main/protection
```

Job `Solver benchmark (WASM)` trong `.github/workflows/ci.yml` build bộ giải
ra WebAssembly rồi chạy bộ đo ở chế độ kiểm tra: job đỏ khi bộ giải giải sai,
khi một đề chậm hơn `PER_SCRAMBLE_LIMIT_SEC`, hoặc khi tổng thời gian vượt
`TOTAL_LIMIT_SEC`. Job này **chạy song song** với `Rust solver (fmt, clippy,
test)` và `check-test-build`.

Nếu sau này thêm hoặc đổi tên job, phải cập nhật lại danh sách check bắt
buộc ở mục 1. Tên check phải khớp **chính xác** với `name:` trong
`.github/workflows/ci.yml` — GitHub hiển thị tên job (`Solver benchmark
(WASM)`), không phải tên key (`solver-benchmark`).

### Bật `enforce_admins` (tùy chọn, việc của chủ kho)

Branch protection đang để `enforce_admins` **tắt**, nên chủ kho vẫn push
trực tiếp được khi cần (giữ nguyên thói quen làm việc). Hệ quả: khi CI đỏ,
admin vẫn có thể merge nếu cố ý.

Nếu muốn CI thật sự chặn được cả admin thì bật **Do not allow bypassing the
above settings** trong Settings → Branches. Quyết định này thuộc về chủ kho —
tài liệu này chỉ ghi nhận trạng thái hiện tại.

## 2. Dependabot automerge chỉ khi check xánh

Nếu bật Dependabot automerge, chỉ cho phép automerge khi:

- Tất cả check bắt buộc trên `main` đều xanh (`rust`, `check-test-build` và
  `solver-benchmark`).
- PR Dependabot không gâyfail kiểm tra bảo mật (`pnpm audit --prod
  --audit-level=high` phải xanh).
- Có ít nhất một review từ thành viên cốt lõi nếu thay đổi dependency lớn
  (thay đổi phiên bản chính thức).

Cách cấu hình: trong file `.github/dependabot.yml`, đặt
`automerge: true` chỉ cho group update non-major và đồng thời bật
`rebase-strategy` hoặc `commit-message` tùy nhu cầu, đồng thời bảo đảm các
check bắt buộc trong CI đã được thêm vào branch protection như mục 1.

## 3. Bật Private Vulnerability Reporting

Bật tính năng **Private Vulnerability Reporting** cho kho chứa trên GitHub:

- Vào **Settings → Security → Code scanning and alerts → Private vulnerability
  reporting** (hoặc đường dẫn tương đương trên GitHub).
- Bật tính năng để các nhà nghiên cứu bảo mật có thể báo cáo lỗ hổng riêng
  tư, không công khai trên issue công khai.
- Thêm liên kết hoặc hướng dẫn trong `SECURITY.md` (nếu có) hướng dẫn
  người dùng báo cáo lỗ hổng qua kênh riêng.

## 4. Ghi nhớ cho chủ repo

- Trước khi merge bất kỳ PR nào vào `main`, hãy đảm bảo toàn bộ CI xanh
  trên cả ba job: `rust`, `check-test-build` và `solver-benchmark`.
- Không bật automerge cho dependency nếu kiểm tra bảo mật (`pnpm audit`)
  chưa xanh.
- Giữ danh sách biến môi trường trong `.env.example` đồng bộ với code
  (xem `docs/development/project-guide.md`).
- Khi nâng cấp phiên bản lớn của dependency, hãy chạy toàn bộ test suite
  và audit trước khi merge.
