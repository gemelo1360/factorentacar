export interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  contratos?: string[]; // URLs or base64 strings of contract files
  referidoPor?: string; // New field for referral tracking
  notas?: {id: string; texto: string; fecha: Date; color: string}[]; // New field for client notes
}

export interface OrdenMantenimiento {
  id: string;
  clienteId: string;
  descripcion: string;
  fechaCreacion: Date;
  estado: 'pendiente' | 'en_proceso' | 'completado';
  fechaInicio?: Date;
  fechaFin?: Date;
  montoPorDia?: number;
  montoTotal?: number;
  correAPartir?: Date | null;
  tipoVehiculo?: string;
  agente?: string; // New field for agent selection
  metodoPago?: string; // New field for payment method
  otroMetodoPago?: string; // Details for "Otro" payment method
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'operador';
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}

export interface ContratoFile {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Mantenimiento {
  id: string;
  tipoVehiculo: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipoMantenimiento: string;
  precio?: number;
  descripcion: string;
  estado: 'pendiente' | 'en_proceso' | 'completado';
  fechaCreacion: Date;
}