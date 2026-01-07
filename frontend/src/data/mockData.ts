import type { Folder } from '../types'

export const mockData: Folder[] = [
  {
    id: '1',
    name: 'Production',
    color: '#ef4444',
    servers: [
      { id: '1', name: 'API Main', ip: '185.234.72.14', status: 'online', provider: 'Hetzner', price: 15.99, currency: 'EUR', paymentDate: '15', lastPing: 24 },
      { id: '2', name: 'Database Master', ip: '185.234.72.15', status: 'online', provider: 'Hetzner', price: 29.99, currency: 'EUR', paymentDate: '15', lastPing: 18 },
      { id: '3', name: 'CDN Edge 1', ip: '45.89.127.8', status: 'offline', provider: 'Vultr', price: 6, currency: 'USD', paymentDate: '1' },
    ]
  },
  {
    id: '2',
    name: 'Development',
    color: '#3b82f6',
    servers: [
      { id: '4', name: 'Dev Server', ip: '192.168.1.100', status: 'online', provider: 'Local', price: 0, currency: 'USD', paymentDate: '-', lastPing: 2 },
      { id: '5', name: 'Staging', ip: '167.235.50.22', status: 'online', provider: 'Hetzner', price: 4.99, currency: 'EUR', paymentDate: '22', lastPing: 45 },
    ]
  },
  {
    id: '3',
    name: 'Clients',
    color: '#10b981',
    servers: [
      { id: '6', name: 'Client A - Shop', ip: '95.217.134.88', status: 'online', provider: 'Hetzner', price: 8.99, currency: 'EUR', paymentDate: '5', lastPing: 31 },
      { id: '7', name: 'Client B - API', ip: '178.128.99.12', status: 'unknown', provider: 'DigitalOcean', price: 12, currency: 'USD', paymentDate: '10' },
      { id: '8', name: 'Client C - Full', ip: '134.209.88.45', status: 'online', provider: 'DigitalOcean', price: 24, currency: 'USD', paymentDate: '18', lastPing: 89 },
      { id: '9', name: 'Client D - Legacy', ip: '51.15.127.200', status: 'online', provider: 'Scaleway', price: 5.99, currency: 'EUR', paymentDate: '25', lastPing: 52 },
    ]
  }
]
