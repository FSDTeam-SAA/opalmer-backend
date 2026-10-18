# opalmer-backend

Create an admin account in the database configured by `MONGO_URI` in `.env`:

```sh
npm run create:admin
```

The command defaults to Admin Id `admin`, generates a random password, and prints
the credentials after creation. Store the password securely. Optional environment
variables `ADMIN_ID`, `ADMIN_NAME`, and `ADMIN_PASSWORD` override these defaults;
supplied passwords must contain at least 12 characters. Existing accounts are
never overwritten. Use these credentials in the dashboard login form.
