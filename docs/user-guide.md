# EcoTek R&D Portal — User Guide

Use this guide to understand how the EcoTek portal is structured, what each page does, and the exact workflow for entering new scientific data. All URLs below assume the site is running at `http://localhost:3000`, but they behave the same in production.

---

## 1. Access & Roles

| Role        | Capabilities                                                                                                      |
|-------------|-------------------------------------------------------------------------------------------------------------------|
| **ADMIN**   | Full read/write, can approve users, assign roles, archive/restore data, delete files, manage standards and settings, review deletion requests, and use the view‑mode switcher. |
| **RESEARCHER** | Create/edit formulations, batches, binder tests, and upload documents. Cannot delete data, but can submit deletion requests. |
| **VIEWER**  | Read-only access to dashboards, analytics, and records. Cannot edit data or download restricted files unless the admin enables that feature flag. |

When an admin is logged in they can simulate other roles using the **View Mode Switcher** in the top navigation. This only changes the UI; backend authorization always enforces the real role.

---

## 2. Signing In / Up

1. Visit `/login` and enter your credentials.  
2. First-time users can request access at `/signup`. These accounts land in **PENDING** status until an admin approves them under `/admin/users`.
3. Suspended accounts are blocked at login with a clear message.

---

## 3. Global Navigation

The top navigation (visible on every authenticated page) exposes:

- **Dashboard** (`/dashboard`): high-level metrics, trends, and pending approvals.
- **Formulations** (`/formulations`): list + detail views for EcoCap formulations.
- **Batches** (`/batches`): batch list, batch detail (mixing conditions, test summaries, files).
- **Analytics** (`/analytics`): multi-formulation comparison charts and radar compliance views.
- **Settings** (`/settings`): portal preferences (Admin only).
- **Admin** (`/admin` + subpages): user management, deletion requests, standards, system settings (Admin only).
- **Account menu**: access `/account`, toggle view mode (Admin), and sign out.

Use the **Active / Archived** toggle chips on the Formulations and Batches pages to hide or reveal archived records. Only admins can archive/restore, and detail pages display an “Archived” badge with the timestamp.

---

## 4. Core R&D Workflows

### 4.1 Create a Formulation
1. Go to `/formulations`.
2. Click **Create New Formulation** (visible to Admins and Researchers when not in Viewer mode).
3. Fill in the formulation fields (code, EcoCap %, reagent %, grade, notes). The app currently uses mocked create UI—extend the form/actions when ready to persist new formulations.
4. Once saved, the new formulation appears in the table and can receive batches.

### 4.2 Create a Batch
1. Navigate to `/batches/new` or press **New Batch** on the batches list (Admins/Researchers only).
2. Complete the batch form: formulation, batch code, mix date, operator, RPM, temperatures, duration, notes.
3. Submit the form; you are redirected to `/batches/[slug]`, and the dashboard/analytics caches are revalidated automatically.
4. Batch detail pages let you review mixing conditions, the synthesized temperature curve, latest binder metrics, and uploaded files.

### 4.3 Add a Binder Test
1. Open the relevant batch detail (`/batches/[slug]`).
2. Click **Add binder test** (Admins/Researchers). The link passes the batch ID into `/tests/new`.
3. Fill the test form with MSCR, DSR, BBR, and physical measurements.
4. Submit to trigger:
   - Creation of the `BinderTest` record.
   - Compliance evaluation against the Korean PG82-22 standard.
   - Revalidation of batch, dashboard, and analytics pages.
   - Redirect to `/tests/[id]` for full review.

### 4.4 Attach Documents & Submit Deletion Requests
- Batch/test detail pages include an **Attachments** card:
  - Admins/Researchers can upload PDFs, DOCX, XLSX, CSV, PNG, or JPG (≤ 20 MB). Files are stored per record with metadata in `FileAttachment`.
  - Admins can delete files immediately; researchers can request deletion (stored as `DeletionRequest`) which an admin must approve under `/admin/deletion-requests`.

### 4.5 Archive / Restore Data (Admin)
- Formulations, batches, and binder tests each have an **Archive** button (and **Restore** when viewing archived items).
- Archiving hides the record from all default lists/analytics but preserves the data. Timestamps are recorded in `archivedAt`.
- Use the Active/Archived tabs on list pages to audit the hidden data when needed.

---

## 5. Analytics & Dashboard Insights

- **Dashboard**: Shows current MSCR metrics, storability, Jnr, pending approvals, and trend charts. Admins see the count of pending users with a quick link to `/admin/users`.
- **Analytics**: Multi-line comparison charts for recovery/storability, a radar chart overlay, and insights placeholders for future automated analysis. Use the multi-select controls to focus on specific formulations or batches.

---

## 6. Admin Responsibilities

### 6.1 User Management (`/admin/users`)
- Filter by status (All/Pending/Active/Suspended).
- Approve, suspend, delete users.
- Change roles via the inline role selector.
- Copy the signup link for distribution.

### 6.2 Standards & Markets (`/admin/standards`)
- Manage regulatory standards (KR/JP/CN, etc.) and threshold requirements. Updates feed directly into compliance calculations.

### 6.3 Deletion Requests (`/admin/deletion-requests`)
- Review researcher-generated deletion requests for files/data. Approve or reject; audit trail captures who requested/reviewed and timestamps.

### 6.4 Settings (`/admin/settings`)
- Placeholder for feature toggles (e.g., enabling viewer downloads of sensitive files). Extend as requirements evolve.

---

## 7. Appendix

- **Seed Data**: The `prisma/seed.ts` script provisions the PG82-22 standard and a default admin (`admin@ecotek.com` / `ChangeMeNow!2024`). Run `DATABASE_URL=… npm run db:seed` after migrations.
- **Environment**: Provide `DATABASE_URL` and `NEXTAUTH_SECRET` in `.env.local`. Local dev uses `npm run dev`; production uses `npm run build && npm run start`.
- **Support**: If you notice hydration/type errors during development, restart `npm run dev` to clear Turbopack’s cache. Archive actions and Prisma schema changes require running `npx prisma migrate dev` against your database.

---

With these steps, Admins can maintain a clean, compliant dataset; researchers can add new experiments end-to-end; and viewers can safely monitor EcoTek’s performance without touching sensitive controls. Reach out to the platform team if you need deeper automation or integration hooks. Happy testing!
