import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    // Match all pathnames except for
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: [
        // - … if they start with `/_next`, `/_vercel` or `monitoring`
        '/((?!_next|_vercel|monitoring|.*\\..*).*)',
        // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
        '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
        // Match all pathnames within `{/:locale}/users`
        '/([\\w-]+)?/users/(.+)',
    ]
};
