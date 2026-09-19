import type { SessionUser } from './auth';
import { canAccessAllLeads, canManageUsers, canManageHotels, canManageSuppliers, canManageDrivers, canViewReports, canManageSettings, canArchiveRecords } from './auth';

export function canViewLead( session: SessionUser, tripAssignedTo: number | null): boolean {
  if (session.role === 'admin') return true;
  return tripAssignedTo === session.id;
}

export function canEditLead(session: SessionUser, tripAssignedTo: number | null, isOwner: boolean = false): boolean {
  if (session.role === 'admin') return true;
  return tripAssignedTo === session.id || isOwner;
}

export function canDeleteLead(session: SessionUser): boolean {
  return session.role === 'admin';
}

export function canArchiveLead(session: SessionUser): boolean {
  return canArchiveRecords(session.role);
}

export function canViewCustomer(session: SessionUser): boolean {
  return true;
}

export function canEditCustomer(session: SessionUser): boolean {
  return session.role === 'admin' || session.role === 'employee';
}

export function canDeleteCustomer(session: SessionUser): boolean {
  return session.role === 'admin';
}

export function canViewQuotation(session: SessionUser): boolean {
  return true;
}

export function canEditQuotation(session: SessionUser): boolean {
  return session.role === 'admin' || session.role === 'employee';
}

export function canDeleteQuotation(session: SessionUser): boolean {
  return session.role === 'admin';
}

export function canViewPayment(session: SessionUser): boolean {
  return session.role === 'admin' || session.role === 'employee';
}

export function canRecordPayment(session: SessionUser): boolean {
  return session.role === 'admin' || session.role === 'employee';
}

export function canDeletePayment(session: SessionUser): boolean {
  return session.role === 'admin';
}

export function canViewFollowUp(session: SessionUser): boolean {
  return true;
}

export function canCreateFollowUp(session: SessionUser): boolean {
  return session.role === 'admin' || session.role === 'employee';
}

export function canCompleteFollowUp(session: SessionUser, assignedTo: number | null): boolean {
  if (session.role === 'admin') return true;
  return assignedTo === session.id;
}

export function canViewTask(session: SessionUser): boolean {
  return true;
}

export function canCreateTask(session: SessionUser): boolean {
  return session.role === 'admin' || session.role === 'employee';
}

export function canCompleteTask(session: SessionUser, assignedTo: number | null): boolean {
  if (session.role === 'admin') return true;
  return assignedTo === session.id;
}

export function canViewDocument(session: SessionUser): boolean {
  return session.role === 'admin' || session.role === 'employee';
}

export function canUploadDocument(session: SessionUser): boolean {
  return session.role === 'admin' || session.role === 'employee';
}

export function canDeleteDocument(session: SessionUser): boolean {
  return session.role === 'admin';
}

export function canViewHotel(session: SessionUser): boolean {
  return canManageHotels(session.role);
}

export function canManageHotel(session: SessionUser): boolean {
  return canManageHotels(session.role);
}

export function canViewSupplier(session: SessionUser): boolean {
  return canManageSuppliers(session.role);
}

export function canManageSupplier(session: SessionUser): boolean {
  return canManageSuppliers(session.role);
}

export function canViewDriver(session: SessionUser): boolean {
  return canManageDrivers(session.role);
}

export function canManageDriver(session: SessionUser): boolean {
  return canManageDrivers(session.role);
}

export function canViewReport(session: SessionUser): boolean {
  return canViewReports(session.role);
}

export function canManageSetting(session: SessionUser): boolean {
  return canManageSettings(session.role);
}

export type PermissionCheck = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

export function getLeadPermissions(session: SessionUser, tripAssignedTo: number | null): PermissionCheck {
  return {
    view: canViewLead(session, tripAssignedTo),
    create: true,
    edit: canEditLead(session, tripAssignedTo),
    delete: canDeleteLead(session),
  };
}

export function getCustomerPermissions(session: SessionUser): PermissionCheck {
  return {
    view: canViewCustomer(session),
    create: true,
    edit: canEditCustomer(session),
    delete: canDeleteCustomer(session),
  };
}

export function getQuotationPermissions(session: SessionUser): PermissionCheck {
  return {
    view: canViewQuotation(session),
    create: true,
    edit: canEditQuotation(session),
    delete: canDeleteQuotation(session),
  };
}

export function getPaymentPermissions(session: SessionUser): PermissionCheck {
  return {
    view: canViewPayment(session),
    create: canRecordPayment(session),
    edit: false,
    delete: canDeletePayment(session),
  };
}

export function getFollowUpPermissions(session: SessionUser, assignedTo: number | null): PermissionCheck {
  return {
    view: canViewFollowUp(session),
    create: canCreateFollowUp(session),
    edit: canCompleteFollowUp(session, assignedTo),
    delete: session.role === 'admin',
  };
}

export function getTaskPermissions(session: SessionUser, assignedTo: number | null): PermissionCheck {
  return {
    view: canViewTask(session),
    create: canCreateTask(session),
    edit: canCompleteTask(session, assignedTo),
    delete: session.role === 'admin',
  };
}
