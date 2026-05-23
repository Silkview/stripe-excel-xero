/** Stripe login with force_login so OAuth does not reuse the platform Dashboard session. */
export function wrapStripeForceLogin(authorizeUrl: string): string {
  const login = new URL('https://connect.stripe.com/login');
  login.searchParams.set('redirect', authorizeUrl);
  login.searchParams.set('force_login', 'true');
  return login.toString();
}

export function buildStripeAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  flow: 'register' | 'login';
  forceFreshLogin?: boolean;
}): string {
  const search = new URLSearchParams({
    response_type: 'code',
    client_id: params.clientId,
    scope: 'read_write',
    redirect_uri: params.redirectUri,
    state: params.state,
    stripe_landing: params.flow,
    'stripe_user[country]': 'US',
  });
  const authorizeUrl = `https://connect.stripe.com/oauth/authorize?${search.toString()}`;
  return params.forceFreshLogin ? wrapStripeForceLogin(authorizeUrl) : authorizeUrl;
}
