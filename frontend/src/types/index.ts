export type ServerStatus = 'online' | 'offline' | 'unknown'

export interface Server {
  id: string
  name: string
  ip: string
  status: ServerStatus
  provider: string
  price: number
  currency: string
  paymentDate: string
  lastPing?: number
}

export interface Folder {
  id: string
  name: string
  color: string
  servers: Server[]
}
