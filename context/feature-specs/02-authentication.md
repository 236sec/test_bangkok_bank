# Authentication

## Frontend Authentication

### Dependencies

- install `@auth0/auth0-react`

#### Implementation

- add `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID` and `VITE_AUTH0_AUDIENCE` to `.env.example` file in `frontend`
- add environment variables for validation at `frontend/src/env.ts`
- add `Auth0Provider` to `frontend/src/main.tsx` to wrap the `App` component with the `Auth0Provider` and pass the `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` from the environment variables
- create a `LoginButton` and `LogoutButton` components in `frontend/src/components/auth/` to handle login and logout functionality using the `useAuth0` hook from `@auth0/auth0-react`
- add protected routes for a react router
- try to using `getAccessTokenSilently` get token to call protected API endpoints
- create a custom hook for common authentication logic
- add temporary `/profile` route to display user information after login

## Backend Authentication

### Dependencies

- install `jwks-rsa`
- install `passport-jwt`
- install `@nestjs/passport`

### Implementation

- add `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID` and `VITE_AUTH0_AUDIENCE` to `.env.example` file in `backend`
- create a `JwtStrategy` class in `backend/src/auth/jwt.strategy.ts` to handle JWT validation using the `passport-jwt` and `jwks-rsa` libraries
- create a `JwtAuthGuard` class in `backend/src/auth/jwt-auth.guard.ts` to protect routes using the `JwtStrategy`
- add `JwtAuthGuard` to the `AppController` in `backend/src/app.controller.ts` to protect the `/api` route
- add `/api/me` route to return the user information from the token

## Success Criteria

- User can login and logout at frontend
- Can using token to call protected API endpoints at backend
- Backend can validate the token and extract user information from the token
- Backend can return user information from the token at `/api/me` route
- Frontend can display user information at `/profile` route after login
- After login, user must redirect to `/profile` route and display user information
