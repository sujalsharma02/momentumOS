# Momentum OS cloud setup

Add these as server-side Vercel Environment Variables. Never prefix them with `VITE_`.

- `DATABASE_URL`: rotated Neon Postgres connection string.
- `MOMENTUM_LOGIN_USERNAME`: cloud login username (default suggestion: `sujalsharma02`).
- `MOMENTUM_LOGIN_PASSWORD`: a long unique cloud password; use the same username/password in the app's lock screen.
- `AWS_ENDPOINT_URL_S3`: exact S3-compatible endpoint shown by Neon Object Storage.
- `AWS_REGION`: region shown in storage settings.
- `AWS_S3_BUCKET`: exact bucket name.
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: rotated storage credentials.

Select Production and Preview if needed, then redeploy. The API creates `momentum_login_sessions` when login is attempted and `momentum_user_data` when cloud sync runs; see `db/schema.sql`.

Successful logins create a database-backed session valid for 14 days. The browser receives only an opaque, HttpOnly cookie; Neon stores a SHA-256 hash of the token, the username, created/last-seen/expiry timestamps, and a revocation timestamp. Logging out revokes that session in Neon. Existing stateless cookies are not migrated, so sign in again after this update deploys.

After cloud sign-in, existing local data is uploaded only if the cloud database is empty. If cloud data already exists, it is downloaded into the browser and the page reloads. Changes to the app's supported local data keys sync periodically.

The helper `uploadMomentumFile(file)` in `src/lib/cloudStorage.ts` uploads supported files through a five-minute signed URL. Store the returned object key in the relevant app record.

Rotate any credentials exposed in screenshots before using them. The browser lock controls the UI; cloud APIs independently validate the server-side session record.
