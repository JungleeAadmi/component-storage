import axios from 'axios'

const API_BASE = '/api' // matches backend API prefix

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10_000
})

export default {
  listStorages: () => client.get('/storage/'),
  createStorage: (payload) => client.post('/storage/', payload),
  getStorage: (id) => client.get(`/storage/${id}`),
  listTrays: (storageId) => client.get(`/trays/storage/${storageId}`),
  addComponent: (trayId, payload) => client.post(`/components/tray/${trayId}`, payload),
  search: (q) => client.get('/search/', { params: { q } })
}
