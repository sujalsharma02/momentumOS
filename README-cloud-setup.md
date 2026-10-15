# Momentum OS cloud setup

Add these as server-side Vercel Environment Variables. Never prefix them with `VITE_`.

- `DATABASE_URL`: rotated Neon Postgres connection string.
- `MOMENTUM_LOGIN_USERNAME`: cloud login username (default suggestion: `sujalsharma02`).
- `MOMENTUM_LOGIN_PASSWORD`: a long unique cloud password; use the same username/password in the app's lock screen.
- `MOMENTUM_SESSION_SECRET`: at least 32 random characters for signing an HttpOnly session cookie.
- `AWS_ENDPOINT_URL_S3`: exact S3-compatible endpoint shown by Neon Object Storage.
- `AWS_REGION`: region shown in storage settings.
- `AWS_S3_BUCKET`: exact bucket name.
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: rotated storage credentials.

Select Production and Preview if needed, then redeploy. The API creates `momentum_user_data` on first authenticated request; see `db/schema.sql`.

After cloud sign-in, existing local data is uploaded only if the cloud database is empty. If cloud data already exists, it is downloaded into the browser and the page reloads. Changes to the app's supported local data keys sync periodically.

The helper `uploadMomentumFile(file)` in `src/lib/cloudStorage.ts` uploads supported files through a five-minute signed URL. Store the returned object key in the relevant app record.

Rotate any credentials exposed in screenshots before using them. The existing browser lock remains a local UI gate; cloud APIs separately validate a signed HttpOnly session cookie.
