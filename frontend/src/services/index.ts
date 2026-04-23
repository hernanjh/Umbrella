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
}

export const purchasesService = {
  getAll: (params?: any) => api.get('/purchase-invoices', { params }).then(r => r.data.data),
  getById: (id: number) => api.get(`/purchase-invoices/${id}`).then(r => r.data.data),
  create: (data: any) => api.post('/purchase-invoices', data).then(r => r.data.data),
  update: (id: number, data: any) => api.put(`/purchase-invoices/${id}`, data).then(r => r.data.data),
  confirm: (id: number) => api.post(`/purchase-invoices/${id}/confirm`),
  cancel: (id: number) => api.post(`/purchase-invoices/${id}/cancel`),
  delete: (id: number) => api.delete(`/purchase-invoices/${id}`),
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
  getSystemConfig: () => api.get('/params/system-config').then(r => r.data.data),
  updateSystemConfig: (data: any) => api.put('/params/system-config', data),
}

export const reportsService = {
  salesByPeriod: (params: any) => api.get('/reports/sales-by-period', { params }).then(r => r.data.data),
  salesBySeller: (params: any) => api.get('/reports/sales-by-seller', { params }).then(r => r.data.data),
  salesByClient: (params: any) => api.get('/reports/sales-by-client', { params }).then(r => r.data.data),
  stock: (params: any) => api.get('/reports/stock', { params }).then(r => r.data.data),
  exportExcel: (type: string, params: any) => api.get(`/reports/${type}/excel`, { params, responseType: 'blob' }),
  exportPdf: (type: string, params: any) => api.get(`/reports/${type}/pdf`, { params, responseType: 'blob' }),
}
