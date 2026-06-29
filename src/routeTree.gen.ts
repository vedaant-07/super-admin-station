// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as ResetPasswordRouteImport } from './routes/reset-password'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as AdminRouteImport } from './routes/admin'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AdminIndexRouteImport } from './routes/admin.index'
import { Route as AdminAnalyticsRouteImport } from './routes/admin.analytics'
import { Route as AdminAppRouteImport } from './routes/admin.app'
import { Route as AdminContentRouteImport } from './routes/admin.content'
import { Route as AdminGymsRouteImport } from './routes/admin.gyms'
import { Route as AdminLogsRouteImport } from './routes/admin.logs'
import { Route as AdminNotificationsRouteImport } from './routes/admin.notifications'
import { Route as AdminPaymentsRouteImport } from './routes/admin.payments'
import { Route as AdminRolesRouteImport } from './routes/admin.roles'
import { Route as AdminSettingsRouteImport } from './routes/admin.settings'
import { Route as AdminSupportRouteImport } from './routes/admin.support'
import { Route as AdminSupportIdRouteImport } from './routes/admin.support.$id'
import { Route as AdminUsersRouteImport } from './routes/admin.users'
import { Route as AdminWebsiteRouteImport } from './routes/admin.website'

const ResetPasswordRoute = ResetPasswordRouteImport.update({ id: '/reset-password', path: '/reset-password', getParentRoute: () => rootRouteImport } as any)
const AuthRoute = AuthRouteImport.update({ id: '/auth', path: '/auth', getParentRoute: () => rootRouteImport } as any)
const AdminRoute = AdminRouteImport.update({ id: '/admin', path: '/admin', getParentRoute: () => rootRouteImport } as any)
const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const AdminIndexRoute = AdminIndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => AdminRoute } as any)
const AdminAnalyticsRoute = AdminAnalyticsRouteImport.update({ id: '/analytics', path: '/analytics', getParentRoute: () => AdminRoute } as any)
const AdminAppRoute = AdminAppRouteImport.update({ id: '/app', path: '/app', getParentRoute: () => AdminRoute } as any)
const AdminContentRoute = AdminContentRouteImport.update({ id: '/content', path: '/content', getParentRoute: () => AdminRoute } as any)
const AdminGymsRoute = AdminGymsRouteImport.update({ id: '/gyms', path: '/gyms', getParentRoute: () => AdminRoute } as any)
const AdminLogsRoute = AdminLogsRouteImport.update({ id: '/logs', path: '/logs', getParentRoute: () => AdminRoute } as any)
const AdminNotificationsRoute = AdminNotificationsRouteImport.update({ id: '/notifications', path: '/notifications', getParentRoute: () => AdminRoute } as any)
const AdminPaymentsRoute = AdminPaymentsRouteImport.update({ id: '/payments', path: '/payments', getParentRoute: () => AdminRoute } as any)
const AdminRolesRoute = AdminRolesRouteImport.update({ id: '/roles', path: '/roles', getParentRoute: () => AdminRoute } as any)
const AdminSettingsRoute = AdminSettingsRouteImport.update({ id: '/settings', path: '/settings', getParentRoute: () => AdminRoute } as any)
const AdminSupportRoute = AdminSupportRouteImport.update({ id: '/support', path: '/support', getParentRoute: () => AdminRoute } as any)
const AdminSupportIdRoute = AdminSupportIdRouteImport.update({ id: '/$id', path: '/$id', getParentRoute: () => AdminSupportRoute } as any)
const AdminUsersRoute = AdminUsersRouteImport.update({ id: '/users', path: '/users', getParentRoute: () => AdminRoute } as any)
const AdminWebsiteRoute = AdminWebsiteRouteImport.update({ id: '/website', path: '/website', getParentRoute: () => AdminRoute } as any)

const AdminSupportRouteWithChildren = AdminSupportRoute._addFileChildren({ AdminSupportIdRoute })
const AdminRouteWithChildren = AdminRoute._addFileChildren({ AdminAnalyticsRoute, AdminAppRoute, AdminContentRoute, AdminGymsRoute, AdminLogsRoute, AdminNotificationsRoute, AdminPaymentsRoute, AdminRolesRoute, AdminSettingsRoute, AdminSupportRoute: AdminSupportRouteWithChildren, AdminUsersRoute, AdminWebsiteRoute, AdminIndexRoute })
export const routeTree = rootRouteImport._addFileChildren({ IndexRoute, AdminRoute: AdminRouteWithChildren, AuthRoute, ResetPasswordRoute })
