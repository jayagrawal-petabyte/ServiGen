# Supabase database certificate

`supabase-prod-ca-2021.crt` is Supabase's public root CA, downloaded over HTTPS from:

https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

SHA-256 certificate fingerprint:

`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`

It expires on 26 April 2031. This is a public trust certificate, not a password or
private key. The backend uses it only for Supabase PostgreSQL hosts, with
`sslmode=require` and `sslaccept=strict`. An explicit `sslcert` URL parameter takes
precedence. Local PostgreSQL and other providers retain their existing settings.

Supabase documents its CA under Database Settings / SSL Configuration:
https://supabase.com/docs/guides/platform/ssl-enforcement

Replace the certificate from that trusted source when Supabase rotates its root;
update the fingerprint assertion in `src/config/database-url.test.js` after
verifying the replacement. Do not obtain trust certificates from an unverified
database handshake.
