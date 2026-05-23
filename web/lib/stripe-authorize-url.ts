export function buildStripeAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  flow: 'register' | 'login';
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
  return `https://connect.stripe.com/oauth/authorize?${search.toString()}`;
}
