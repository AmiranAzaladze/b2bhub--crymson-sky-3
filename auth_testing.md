# Auth Testing Playbook (for testing agent)

## Credentials
- Email: `admin@swiftformations.io`
- Password: `Admin@12345`

## Token usage
Login returns `{ token, user }`. Use the token as either:
- `Authorization: Bearer <token>` header, OR
- `access_token` cookie

## Sanity checks
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)

# Login
TOKEN=$(curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@swiftformations.io","password":"Admin@12345"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

echo "Token: $TOKEN"

# Me
curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN"

# Countries list (should return 5 seeded countries)
curl -s "$API/api/admin/countries" -H "Authorization: Bearer $TOKEN"

# Public landing for UK
curl -s "$API/api/public/landing?tenant=uk"
```

## Notes
- bcrypt 4.x is used; admin seeding is idempotent.
- 5 failed logins (per ip+email) → 15-min lockout.
- All admin routes require auth; 401 returned otherwise.
