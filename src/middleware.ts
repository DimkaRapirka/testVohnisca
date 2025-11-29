export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/companies/:path*', '/encounters/:path*', '/characters/:path*', '/profile/:path*'],
};
