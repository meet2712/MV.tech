# SSO Architecture

This repository contains the public MV.tech marketing site. It is deployed as static GitHub Pages content, so it should remain public, indexable, and free of private client data.

## Current Boundary

- `https://mvtech.solutions/` is the public marketing origin.
- There is no SSO provider, client portal, or authenticated API in this repository.
- GitHub Pages cannot safely perform an OAuth token exchange or maintain a server-side session by itself.

## Recommended Implementation

When a client portal is needed, deploy it on a separate application origin such as `portal.mvtech.solutions` and connect it to an OIDC identity provider.

1. Use the Authorization Code flow with PKCE.
2. Register exact HTTPS redirect URIs and exact post-logout redirect URIs.
3. Exchange the authorization code on the server or trusted edge runtime.
4. Store the resulting session in a Secure, HttpOnly, SameSite cookie.
5. Keep access tokens out of HTML, JavaScript bundles, URLs, and `localStorage`.
6. Enforce authorization server-side for every portal resource and API request.
7. Return `X-Robots-Tag: noindex, nofollow` or an equivalent page-level policy from the portal.
8. Keep portal URLs out of `sitemap.xml` and preserve the reserved crawler exclusions in `robots.txt`.

## Public-Site Contract

The public site should link to the portal only after a real portal URL and provider configuration exist. Until then, it must not present a fake login button or imply that SSO is already available.

For AI indexing, `llms.txt` and `llms-full.txt` explicitly describe this boundary so answer engines do not claim that MV.tech currently offers a public login or client portal.
