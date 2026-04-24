import api from './api'

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data.data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile').then(r => r.data.data),
  updateProfile: (data: any) => api.put('/auth/profile', data).then(r => r.data.data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
}

export const clientsService = {
  getAll: (params?: any) => api.get('/clients', { params }).then(r => r.data.data),
  getById: (id: number) => api.get(`/clients/${id}`).then(r => r.data.data),
  search: (term: string) => api.get('/clients/search', { params: { term } }).then(r => r.data.data),
  create: (data: any) => api.post('/clients', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/clients/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/clients/${id}`),
  restore: (id: number) => api.post(`/clients/${id}/restore`),
}

export const suppliersService = {
  getAll: (params?: any) => api.get('/suppliers', { params }).then(r => r.data.data),
  getById: (id: number) => api.get(`/suppliers/${id}`).then(r => r.data.data),
  search: (term: string) => api.get('/suppliers/search', { params: { term } }).then(r => r.data.data),
  create: (data: any) => api.post('/suppliers', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/suppliers/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
  restore: (id: number) => api.post(`/suppliers/${id}/restore`),
}

export const productsService = {
  getAll: (params?: any) => api.get('/products', { params }).then(r => r.data.data),
  getById: (id: number) => api.get(`/products/${id}`).then(r => r.data.data),
  search: (term: string) => api.get('/products/search', { params: { term } }).then(r => r.data.data),
  create: (data: any) => api.post('/products', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/products/${id}`),
  restore: (id: number) => api.post(`/products/${id}/restore`),
  getPhotos: (id: number) => api.get(`/products/${id}/photos`).then(r => r.data.data),
  uploadPhoto: (id: number, file: File) => { const fd = new FormData(); fd.append('file', file); return api.post(`/products/${id}/photos`, fd).then(r => r.data.data) },
  deletePhoto: (id: number, photoId: number) => api.delete(`/products/${id}/photos/${photoId}`),
  setDefaultPhoto: (id: number, photoId: number) => api.post(`/products/${id}/photos/${photoId}/default`),
  getDocuments: (id: number) => api.get(`/products/${id}/documents`).then(r => r.data.data),
  uploadDocument: (id: number, file: File, description?: string) => { const fd = new FormData(); fd.append('file', file); if (description) fd.append('description', description); return api.post(`/products/${id}/documents`, fd).then(r => r.data.data) },
  deleteDocument: (id: number, docId: number) => api.delete(`/products/${id}/documents/${docId}`),
}

export const clientDocsService = {
  getDocuments: (id: number) => api.get(`/clients/${id}/documents`).then(r => r.data.data),
  uploadDocument: (id: number, file: File, description?: string) => { const fd = new FormData(); fd.append('file', file); if (description) fd.append('description', description); return api.post(`/clients/${id}/documents`, fd).then(r => r.data.data) },
  deleteDocument: (id: number, docId: number) => api.delete(`/clients/${id}/documents/${docId}`),
}

export const priceListsService = {
  getAll: (params?: any) => api.get('/price-lists', { params }).then(r => r.data.data),
  getById: (id: number) => api.get(`/price-lists/${id}`).then(r => r.data.data),
  create: (data: any) => api.post('/price-lists', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/price-lists/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/price-lists/${id}`),
  upsertItem: (id: number, data: any) => api.put(`/price-lists/${id}/items`, data),
  removeItem: (id: number, productId: number) => api.delete(`/price-lists/${id}/items/${productId}`),
  bulkUpdate: (id: number, data: any) => api.post(`/price-lists/${id}/bulk-update`, data),
  recalculate: (id: number) => api.post(`/price-lists/${id}/recalculate`),
}

export const salesService = {
  getAll: (params?: any) => api.get('/sales-invoices', { params }).then(r => r.data.data),
  getById: (id: number) => api.get(`/sales-invoices/${id}`).then(r => r.data.data),
  create: (data: any) => api.post('/sales-invoices', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/sales-invoices/${id}`, data).then(r => r.data.data),
  confirm: (id: number) => api.post(`/sales-invoices/${id}/confirm`),
  cancel: (id: number) => api.post(`/sales-invoices/${id}/cancel`),
  delete: (id: number) => api.delete(`/sales-invoices/${id}`),
  getPdf: (id: number) => api.get(`/sales-invoices/${id}/pdf`, { responseType: 'blob' }),
}

export const purchasesService = {
  getAll: (params?: any) => api.get('/purchase-invoices', { params }).then(r => r.data.data),
  getById: (id: number) => api.get(`/purchase-invoices/${id}`).then(r => r.data.data),
  create: (data: any) => api.post('/purchase-invoices', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/purchase-invoices/${id}`, data).then(r => r.data.data),
  confirm: (id: number) => api.post(`/purchase-invoices/${id}/confirm`),
  cancel: (id: number) => api.post(`/purchase-invoices/${id}/cancel`),
  delete: (id: number) => api.delete(`/purchase-invoices/${id}`),
  getPdf: (id: number) => api.get(`/purchase-invoices/${id}/pdf`, { responseType: 'blob' }),
}

export const stockService = {
  getStatus: (params?: any) => api.get('/stock', { params }).then(r => r.data.data),
  getLocations: () => api.get('/stock/locations').then(r => r.data.data),
  getMovements: (params?: any) => api.get('/stock/movements', { params }).then(r => r.data.data),
  getAdjustments: (params?: any) => api.get('/stock/adjustments', { params }).then(r => r.data.data),
  createAdjustment: (data: any) => api.post('/stock/adjustments', data).then(r => r.data.data),
  confirmAdjustment: (id: number) => api.post(`/stock/adjustments/${id}/confirm`),
  createLocation: (data: any) => api.post('/stock/locations', data).then(r => r.data.data),
  updateLocation: (id: number, data: any) => api.put(`/stock/locations/${id}`, data).then(r => r.data.data),
  deleteLocation: (id: number) => api.delete(`/stock/locations/${id}`),
}

export const paramsService = {
  getClientTypes: () => api.get('/params/client-types').then(r => r.data.data),
  createClientType: (data: any) => api.post('/params/client-types', data),
  updateClientType: (id: number, data: any) => api.put(`/params/client-types/${id}`, data),
  deleteClientType: (id: number) => api.delete(`/params/client-types/${id}`),
  getZones: () => api.get('/params/zones').then(r => r.data.data),
  createZone: (data: any) => api.post('/params/zones', data),
  updateZone: (id: number, data: any) => api.put(`/params/zones/${id}`, data),
  deleteZone: (id: number) => api.delete(`/params/zones/${id}`),
  getVatConditions: () => api.get('/params/vat-conditions').then(r => r.data.data),
  createVatCondition: (data: any) => api.post('/params/vat-conditions', data),
  updateVatCondition: (id: number, data: any) => api.put(`/params/vat-conditions/${id}`, data),
  getPaymentConditions: () => api.get('/params/payment-conditions').then(r => r.data.data),
  createPaymentCondition: (data: any) => api.post('/params/payment-conditions', data),
  updatePaymentCondition: (id: number, data: any) => api.put(`/params/payment-conditions/${id}`, data),
  getCategories: () => api.get('/params/categories').then(r => r.data.data),
  createCategory: (data: any) => api.post('/params/categories', data),
  updateCategory: (id: number, data: any) => api.put(`/params/categories/${id}`, data),
  getInvoiceTypes: () => api.get('/params/invoice-types').then(r => r.data.data),
  createInvoiceType: (data: any) => api.post('/params/invoice-types', data),
  updateInvoiceType: (id: number, data: any) => api.put(`/params/invoice-types/${id}`, data),
  deleteInvoiceType: (id: number) => api.delete(`/params/invoice-types/${id}`),
  getSystemConfig: () => api.get('/params/system-config').then(r => r.data.data),
  updateSystemConfig: (data: any) => api.put('/params/system-config', data),
  getBranding: () => api.get('/params/branding').then(r => r.data.data),
  uploadLogo: (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/params/system-config/logo', fd).then(r => r.data.data)
  },
  getVatRates: () => api.get('/params/vat-rates').then(r => r.data.data),
  createVatRate: (data: any) => api.post('/params/vat-rates', data),
  updateVatRate: (id: number, data: any) => api.put(`/params/vat-rates/${id}`, data),
  deleteVatRate: (id: number) => api.delete(`/params/vat-rates/${id}`),
}

export const usersService = {
  getAll: (params?: any) => api.get('/users', { params }).then(r => r.data.data),
  getById: (id: number) => api.get(`/users/${id}`).then(r => r.data.data),
  create: (data: any) => api.post('/users', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/users/${id}`),
  restore: (id: number) => api.post(`/users/${id}/restore`),
  resetPassword: (id: number, newPassword: string) => api.post(`/users/${id}/reset-password`, { newPassword }),
  searchSellers: (term: string) => api.get('/users/sellers', { params: { term } }).then(r => r.data.data),
}

export const rolesService = {
  getAll: () => api.get('/roles').then(r => r.data.data),
  getById: (id: number) => api.get(`/roles/${id}`).then(r => r.data.data),
  create: (data: any) => api.post('/roles', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/roles/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/roles/${id}`),
  getPermissions: () => api.get('/roles/permissions').then(r => r.data.data),
}

export const paymentMethodsService = {
  getAll: (includeInactive = false) => api.get('/payment-methods', { params: { includeInactive } }).then(r => r.data.data),
  create: (data: any) => api.post('/payment-methods', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/payment-methods/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/payment-methods/${id}`),
}

export const salesPaymentsService = {
  getByInvoice: (invoiceId: number) => api.get(`/sales-invoices/${invoiceId}/payments`).then(r => r.data.data),
  create: (invoiceId: number, data: any) => api.post(`/sales-invoices/${invoiceId}/payments`, data).then(r => r.data.data),
  delete: (invoiceId: number, paymentId: number) => api.delete(`/sales-invoices/${invoiceId}/payments/${paymentId}`),
}

export const purchasePaymentsService = {
  getByInvoice: (invoiceId: number) => api.get(`/purchase-invoices/${invoiceId}/payments`).then(r => r.data.data),
  create: (invoiceId: number, data: any) => api.post(`/purchase-invoices/${invoiceId}/payments`, data).then(r => r.data.data),
  delete: (invoiceId: number, paymentId: number) => api.delete(`/purchase-invoices/${invoiceId}/payments/${paymentId}`),
}

export const clientAccountService = {
  get: (clientId: number) => api.get(`/clients/${clientId}/account`).then(r => r.data.data),
  exportExcel: (clientId: number) => api.get(`/clients/${clientId}/account/excel`, { responseType: 'blob' }),
  exportPdf: (clientId: number) => api.get(`/clients/${clientId}/account/pdf`, { responseType: 'blob' }),
}

export const supplierAccountService = {
  get: (supplierId: number) => api.get(`/suppliers/${supplierId}/account`).then(r => r.data.data),
  exportExcel: (supplierId: number) => api.get(`/suppliers/${supplierId}/account/excel`, { responseType: 'blob' }),
  exportPdf: (supplierId: number) => api.get(`/suppliers/${supplierId}/account/pdf`, { responseType: 'blob' }),
}

export const installmentPlansService = {
  getByInvoice: (invoiceId: number) => api.get(`/sales-invoices/${invoiceId}/installment-plan`).then(r => r.data.data),
  create: (invoiceId: number, data: any) => api.post(`/sales-invoices/${invoiceId}/installment-plan`, data).then(r => r.data.data),
  updateInstallment: (invoiceId: number, installmentId: number, data: any) =>
    api.put(`/sales-invoices/${invoiceId}/installment-plan/installments/${installmentId}`, data).then(r => r.data.data),
  delete: (invoiceId: number) => api.delete(`/sales-invoices/${invoiceId}/installment-plan`),
  pay: (invoiceId: number, installmentId: number, data: any) =>
    api.post(`/sales-invoices/${invoiceId}/installment-plan/installments/${installmentId}/pay`, data).then(r => r.data.data),
  getAll: (status?: string) => api.get('/installment-plans', { params: status ? { status } : undefined }).then(r => r.data.data),
}

export const cashService = {
  getCurrent: () => api.get('/cash/current').then(r => r.data.data),
  getSessions: (params?: any) => api.get('/cash/sessions', { params }).then(r => r.data.data),
  getSession: (id: number) => api.get(`/cash/sessions/${id}`).then(r => r.data.data),
  open: (data: any) => api.post('/cash/sessions/open', data).then(r => r.data.data),
  close: (id: number, data: any) => api.post(`/cash/sessions/${id}/close`, data).then(r => r.data.data),
  addMovement: (id: number, data: any) => api.post(`/cash/sessions/${id}/movements`, data).then(r => r.data.data),
  deleteMovement: (id: number) => api.delete(`/cash/movements/${id}`),
}

export const alertsService = {
  getAll: () => api.get('/alerts').then(r => r.data.data),
  markRead: (keys: string[]) => api.post('/alerts/mark-read', { keys }).then(r => r.data),
  markAllRead: () => api.post('/alerts/mark-all-read').then(r => r.data),
}

export const reportsService = {
  salesByPeriod: (params: any) => api.get('/reports/sales-by-period', { params }).then(r => r.data.data),
  salesBySeller: (params: any) => api.get('/reports/sales-by-seller', { params }).then(r => r.data.data),
  salesByClient: (params: any) => api.get('/reports/sales-by-client', { params }).then(r => r.data.data),
  stock: (params: any) => api.get('/reports/stock', { params }).then(r => r.data.data),
  payments: (params: any) => api.get('/reports/payments', { params }).then(r => r.data.data),
  receivables: () => api.get('/reports/receivables').then(r => r.data.data),
  payables: () => api.get('/reports/payables').then(r => r.data.data),
  cash: (params: any) => api.get('/reports/cash', { params }).then(r => r.data.data),
  dashboardSummary: () => api.get('/reports/dashboard-summary').then(r => r.data.data),
  overdueInstallments: () => api.get('/reports/overdue-installments').then(r => r.data.data),
  detailedSales: (params: any) => api.get('/reports/detailed-sales', { params }).then(r => r.data.data),
  dailyCollections: (params: { zoneId?: number | null; date?: string }) =>
    api.get('/reports/daily-collections', { params }).then(r => r.data.data),
  dailyCollectionsExcel: (params: { zoneId?: number | null; date?: string }) =>
    api.get('/reports/daily-collections/excel', { params, responseType: 'blob' }),
  dailyCollectionsPdf: (params: { zoneId?: number | null; date?: string }) =>
    api.get('/reports/daily-collections/pdf', { params, responseType: 'blob' }),
  exportExcel: (type: string, params: any) => api.get(`/reports/${type}/excel`, { params, responseType: 'blob' }),
  exportPdf: (type: string, params: any) => api.get(`/reports/${type}/pdf`, { params, responseType: 'blob' }),
}
