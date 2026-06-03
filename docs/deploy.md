# Deployment

This app is a static Vite build (`dist/`). Two targets ship from one workflow
([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)), each as an
independent job so a failure on one doesn't block the other:

1. **GitHub Pages** (worldwide entry) — <https://anois.github.io/tarot/>
2. **Aliyun OSS** (China-domestic mirror) — served at the bucket root — <https://tarotj.oss-cn-beijing.aliyuncs.com/>

> **Why two builds?** The targets need different Vite `base` paths. GitHub Pages
> serves a project site under `/<repo>/`, so it builds with `BASE_PATH=/tarot/`.
> An OSS bucket serves at its **root**, so it builds with `BASE_PATH=/`. Each job
> runs its own `pnpm build` with the right base. `BASE_PATH` feeds Vite `base`,
> which in turn drives `BrowserRouter` basename, `cardImageUrl`, and share links.

SPA routing on both hosts relies on `dist/404.html` (a copy of `index.html`
emitted by the `spaFallback` plugin in `vite.config.ts`); GitHub Pages serves it
for unknown paths, and OSS uses it as the static-website "not found" document.
We intentionally use `BrowserRouter` (not `HashRouter`) because the BYOK
**share links** encode config in the URL `#fragment` — a hash router would
collide with them.

## GitHub Pages (default, $0)

One-time: **Settings → Pages → Source = GitHub Actions** (already enabled for
this repo). Every push to `main` rebuilds and republishes.

## China-domestic mirror via Aliyun OSS

GitHub Pages is intermittently slow/unreachable from mainland China. The same
build is synced to an Aliyun OSS bucket (mainland region, no ICP filing needed
for a direct OSS URL). The `deploy-oss` job is **opt-in**: it only runs when the
repo variable `ENABLE_OSS_DEPLOY=true` and the four `ALIYUN_*` secrets exist.

### One-time Aliyun setup

#### 1. Create the bucket

OSS Console → **Create Bucket**:

- **Region**: e.g. `oss-cn-hangzhou` (any mainland region; or `oss-cn-hongkong` — see caveats)
- **ACL**: `public-read`
- **Static Website**: default homepage `index.html`, default 404 page `404.html`
  (the deploy action also sets these automatically)

#### 2. Create a least-privilege RAM sub-user

RAM Console → Users → **Create user** `tarot-deploy` with **OpenAPI access**
(no console login). Attach a custom policy scoped to this bucket only — replace
`tarot` with your bucket name:

```json
{
  "Version": "1",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["oss:PutObject", "oss:DeleteObject", "oss:GetObject", "oss:ListObjects", "oss:GetBucketWebsite", "oss:PutBucketWebsite"],
    "Resource": ["acs:oss:*:*:tarot", "acs:oss:*:*:tarot/*"]
  }]
}
```

Save the **AccessKey ID** and **AccessKey Secret** (the secret is shown once).

#### 3. Add GitHub repo secrets

Settings → Secrets and variables → Actions → **Secrets**:

| Secret | Value |
|---|---|
| `ALIYUN_ACCESS_KEY_ID` | the RAM user's AccessKey ID |
| `ALIYUN_ACCESS_KEY_SECRET` | the RAM user's AccessKey Secret |
| `ALIYUN_OSS_BUCKET` | e.g. `tarot` |
| `ALIYUN_OSS_ENDPOINT` | e.g. `oss-cn-hangzhou.aliyuncs.com` |

#### 4. Enable the OSS job

Settings → Secrets and variables → Actions → **Variables** → add
`ENABLE_OSS_DEPLOY = true`. (Or, from a machine with `gh` auth:
`gh variable set ENABLE_OSS_DEPLOY --body true --repo anois/tarot`.)

Then push to `main` (or re-run the workflow). The site lands at
`https://<bucket>.oss-cn-<region>.aliyuncs.com/`.

### Caveats with direct OSS URLs

Mainland-region direct OSS URLs (`*.oss-cn-<region>.aliyuncs.com`) can show a
security-check page or get rate-limited as a user-facing endpoint because the
domain isn't ICP-filed. For low-volume personal use this usually works. Fallbacks:

| Option | Trade-off |
|---|---|
| **HK region** (`oss-cn-hongkong.aliyuncs.com`) | No filing, no security page; slightly slower to the mainland |
| **Custom domain + Aliyun CDN** | Best long-term CN performance; requires ICP filing |

## Known limitation: CSP isn't enforced on these hosts

`public/_headers` (the CSP/security headers) is only honored by Netlify /
Cloudflare Pages — GitHub Pages and OSS ignore it, so the `connect-src`
allowlist is **not** enforced there. The app still functions (BYOK only ever
calls the user's chosen provider); if you need CSP on these hosts, add a
`<meta http-equiv="Content-Security-Policy">` to `index.html` or front the site
with a CDN that supports response headers.

## Local preview

```bash
pnpm build && pnpm preview      # serves dist/ at base "/"
BASE_PATH=/tarot/ pnpm build && pnpm preview   # mimic the Pages base path
```
