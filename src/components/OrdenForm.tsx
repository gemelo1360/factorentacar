import { useState, useEffect, useRef } from 'react';
import { Button, Form, Card, Alert, Row, Col, Modal, Image, Dropdown } from 'react-bootstrap';
import { Cliente, OrdenMantenimiento } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { logAction } from '../utils/logService';
import { generateClientQRCode } from '../utils/qrCodeGenerator';

// Lista de vehículos disponibles con imágenes
const tiposVehiculos = [
  {
    nombre: "Nissan Frontier NB",
    imagen: "https://factorentacar.com/carros/frontier.png"
  },
  {
    nombre: "Toyota Rush Café",
    imagen: "https://factorentacar.com/carros/rushcafe.png"
  },
  {
    nombre: "Toyota Rush Silver",
    imagen: "https://factorentacar.com/carros/rsilver.png"
  },
  {
    nombre: "Toyota Yaris",
    imagen: "https://factorentacar.com/carros/yaris.png"
  },
  {
    nombre: "Hyundai Tucson",
    imagen: "https://factorentacar.com/carros/tucson.png"
  },
  {
    nombre: "Hyundai Elantra Blanco",
    imagen: "https://factorentacar.com/carros/elantrab.png"
  },
  {
    nombre: "Hyundai Elantra Gris",
    imagen: "https://factorentacar.com/carros/elantrap.png"
  },
  {
    nombre: "Hyundai Starex",
    imagen: "https://factorentacar.com/carros/starex.png"
  },
  {
    nombre: "Chevrolet Beat",
    imagen: "https://factorentacar.com/carros/beat.png"
  }
];

// Lista de métodos de pago disponibles
const metodosPago = [
  "Efectivo",
  "Tarjeta de Crédito",
  "Tarjeta de Débito",
  "Transferencia Bancaria",
  "Sinpe Móvil",
  "Otro"
];

// Lista de agentes disponibles
const agentesDisponibles = [
  {
    nombre: "Jose Edgardo",
    email: "edgardo@factorentacar.com"
  },
  {
    nombre: "Ronald Rojas",
    email: "ronald@factorentacar.com"
  },
  {
    nombre: "Gerardo Espinoza",
    email: "gespinoza@factorentacar.com"
  },
  {
    nombre: "Christian Castro",
    email: "ccastro@factorentacar.com"
  }
];

interface OrdenFormProps {
  cliente: Cliente | null;
  clientes: Cliente[];
  onGuardarOrden: (orden: Omit<OrdenMantenimiento, 'id' | 'fechaCreacion'>) => void;
  ordenEditar: OrdenMantenimiento | null;
  onCancelarEdicion: () => void;
}

export default function OrdenForm({ 
  cliente: clienteSeleccionado, 
  clientes, 
  onGuardarOrden, 
  ordenEditar, 
  onCancelarEdicion 
}: OrdenFormProps) {
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
  const [fechaFin, setFechaFin] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Una semana después
  const [clienteId, setClienteId] = useState<string>('');
  const [montoPorDia, setMontoPorDia] = useState<number>(0);
  const [montoTotal, setMontoTotal] = useState<number>(0);
  const [correAPartir, setCorreAPartir] = useState<boolean>(false);
  const [fechaHoraInicio, setFechaHoraInicio] = useState<Date>(new Date());
  const [horaInicio, setHoraInicio] = useState<string>('12:00');
  const [horaFin, setHoraFin] = useState<string>('12:00');
  const [ampmInicio, setAmpmInicio] = useState<string>('PM');
  const [ampmFin, setAmpmFin] = useState<string>('PM');
  const [diasTotales, setDiasTotales] = useState<number>(0);
  const [tipoVehiculo, setTipoVehiculo] = useState<string>('');
  const [imagenVehiculo, setImagenVehiculo] = useState<string>('');
  const [showVehiculoDropdown, setShowVehiculoDropdown] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<'success' | 'danger'>('success');
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<typeof tiposVehiculos>(tiposVehiculos);
  const [metodoPago, setMetodoPago] = useState<string>('');
  const [otroMetodoPago, setOtroMetodoPago] = useState<string>('');
  const [agente, setAgente] = useState<string>('');
  const [showEmailReminderModal, setShowEmailReminderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Estado para el modal de edición de cliente
  const [showEditModal, setShowEditModal] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [cedulaCliente, setCedulaCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');

  // Referencias para los campos del formulario (para auto-tabbing)
  const clienteIdRef = useRef<HTMLSelectElement>(null);
  const tipoVehiculoRef = useRef<HTMLDivElement>(null);
  const fechaInicioRef = useRef<HTMLInputElement>(null);
  const horaInicioRef = useRef<HTMLInputElement>(null);
  const ampmInicioRef = useRef<HTMLSelectElement>(null);
  const fechaFinRef = useRef<HTMLInputElement>(null);
  const horaFinRef = useRef<HTMLInputElement>(null);
  const ampmFinRef = useRef<HTMLSelectElement>(null);
  const montoPorDiaRef = useRef<HTMLInputElement>(null);
  const metodoPagoRef = useRef<HTMLSelectElement>(null);
  const otroMetodoPagoRef = useRef<HTMLInputElement>(null);
  const agenteRef = useRef<HTMLSelectElement>(null);
  const correAPartirRef = useRef<HTMLInputElement>(null);
  const fechaHoraInicioRef = useRef<HTMLInputElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Actualizar el cliente seleccionado cuando cambia
  useEffect(() => {
    if (clienteSeleccionado && !ordenEditar) {
      setClienteId(clienteSeleccionado.id);
      
      // Enfocar el siguiente campo después de seleccionar cliente
      setTimeout(() => {
        tipoVehiculoRef.current?.focus();
      }, 100);
    }
  }, [clienteSeleccionado, ordenEditar]);

  // Cargar datos de la orden a editar
  useEffect(() => {
    if (ordenEditar) {
      setClienteId(ordenEditar.clienteId);
      setDescripcion(ordenEditar.descripcion);
      
      if (ordenEditar.fechaInicio) {
        setFechaInicio(new Date(ordenEditar.fechaInicio));
        
        // Extraer hora y AM/PM
        const horas = ordenEditar.fechaInicio.getHours();
        const minutos = ordenEditar.fechaInicio.getMinutes();
        const esPM = horas >= 12;
        const hora12 = horas % 12 || 12;
        
        setHoraInicio(`${hora12.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
        setAmpmInicio(esPM ? 'PM' : 'AM');
      }
      
      if (ordenEditar.fechaFin) {
        setFechaFin(new Date(ordenEditar.fechaFin));
        
        // Extraer hora y AM/PM
        const horas = ordenEditar.fechaFin.getHours();
        const minutos = ordenEditar.fechaFin.getMinutes();
        const esPM = horas >= 12;
        const hora12 = horas % 12 || 12;
        
        setHoraFin(`${hora12.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
        setAmpmFin(esPM ? 'PM' : 'AM');
      }
      
      setMontoPorDia(ordenEditar.montoPorDia || 0);
      setMontoTotal(ordenEditar.montoTotal || 0);
      
      if (ordenEditar.correAPartir) {
        setCorreAPartir(true);
        setFechaHoraInicio(new Date(ordenEditar.correAPartir));
      } else {
        setCorreAPartir(false);
      }
      
      if (ordenEditar.tipoVehiculo) {
        setTipoVehiculo(ordenEditar.tipoVehiculo);
        const vehiculo = tiposVehiculos.find(v => v.nombre === ordenEditar.tipoVehiculo);
        if (vehiculo) {
          setImagenVehiculo(vehiculo.imagen);
        }
      }
      
      // Establecer método de pago
      if (ordenEditar.metodoPago) {
        setMetodoPago(ordenEditar.metodoPago);
        if (ordenEditar.metodoPago === 'Otro' && ordenEditar.otroMetodoPago) {
          setOtroMetodoPago(ordenEditar.otroMetodoPago);
        }
      }
      
      // Establecer agente
      if (ordenEditar.agente) {
        setAgente(ordenEditar.agente);
      }
    }
  }, [ordenEditar]);

  // Calcular días totales y monto total cuando cambian las fechas o el monto por día
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDiasTotales(diffDays);
      setMontoTotal(diffDays * montoPorDia);
    } else {
      setDiasTotales(0);
      setMontoTotal(0);
    }
  }, [fechaInicio, fechaFin, montoPorDia]);

  // Verificar disponibilidad de vehículos cuando cambian las fechas
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      // Obtener órdenes del localStorage
      const ordenesGuardadas = localStorage.getItem('ordenes');
      if (!ordenesGuardadas) return;
      
      // Convertir las fechas de string a Date
      let ordenes = JSON.parse(ordenesGuardadas).map((orden: any) => ({
        ...orden,
        fechaCreacion: new Date(orden.fechaCreacion),
        fechaInicio: orden.fechaInicio ? new Date(orden.fechaInicio) : undefined,
        fechaFin: orden.fechaFin ? new Date(orden.fechaFin) : undefined,
        correAPartir: orden.correAPartir ? new Date(orden.correAPartir) : undefined
      }));
      
      // Si estamos editando, excluir la orden actual
      if (ordenEditar) {
        ordenes = ordenes.filter((orden: OrdenMantenimiento) => orden.id !== ordenEditar.id);
      }
      
      // Verificar disponibilidad de cada vehículo
      const vehiculosNoDisponibles = new Set<string>();
      
      ordenes.forEach((orden: OrdenMantenimiento) => {
        if (!orden.tipoVehiculo || !orden.fechaInicio || !orden.fechaFin) return;
        
        // Verificar si hay solapamiento de fechas
        const inicioA = new Date(orden.fechaInicio).getTime();
        const finA = new Date(orden.fechaFin).getTime();
        const inicioB = fechaInicio.getTime();
        const finB = fechaFin.getTime();
        
        // Hay conflicto si:
        // - El inicio de B está entre el inicio y fin de A
        // - El fin de B está entre el inicio y fin de A
        // - B contiene completamente a A
        const hayConflicto = (inicioB >= inicioA && inicioB < finA) || 
                             (finB > inicioA && finB <= finA) ||
                             (inicioB <= inicioA && finB >= finA);
        
        if (hayConflicto) {
          vehiculosNoDisponibles.add(orden.tipoVehiculo);
        }
      });
      
      // Filtrar vehículos disponibles
      const vehiculosDisponiblesFiltrados = tiposVehiculos.filter(
        vehiculo => !vehiculosNoDisponibles.has(vehiculo.nombre)
      );
      
      setVehiculosDisponibles(vehiculosDisponiblesFiltrados);
      
      // Si el vehículo seleccionado ya no está disponible, mostrar alerta
      if (tipoVehiculo && vehiculosNoDisponibles.has(tipoVehiculo)) {
        setAlertMessage(`El vehículo ${tipoVehiculo} no está disponible en el período seleccionado.`);
        setAlertVariant('danger');
      } else if (alertMessage && alertVariant === 'danger') {
        setAlertMessage(null);
      }
    }
  }, [fechaInicio, fechaFin, ordenEditar, tipoVehiculo, alertMessage, alertVariant]);

  // Formatear número con separadores de miles y decimales
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Formatear fecha para el ID de la orden
  const formatFechaParaId = (fecha: Date): string => {
    try {
      return fecha.toISOString().split('T')[0].replace(/-/g, '');
    } catch (error) {
      console.error('Error al formatear fecha para ID:', error);
      return new Date().toISOString().split('T')[0].replace(/-/g, '');
    }
  };

  // Generar ID para la orden con el formato vehiculo-fechaInicio-fechaFin
  const generarOrdenId = (): string => {
    if (!tipoVehiculo) return `alquiler-${Date.now()}`;
    
    const vehiculoAbrev = tipoVehiculo.split(' ')[0].toLowerCase();
    const fechaInicioStr = formatFechaParaId(fechaInicio);
    const fechaFinStr = formatFechaParaId(fechaFin);
    return `${vehiculoAbrev}-${fechaInicioStr}-${fechaFinStr}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteId) {
      alert('Por favor seleccione un cliente');
      clienteIdRef.current?.focus();
      return;
    }
    
    if (montoPorDia <= 0) {
      alert('El monto por día debe ser mayor a cero');
      montoPorDiaRef.current?.focus();
      return;
    }
    
    if (!descripcion.trim()) {
      alert('Por favor ingrese una descripción');
      descripcionRef.current?.focus();
      return;
    }
    
    if (!tipoVehiculo) {
      alert('Por favor seleccione un tipo de vehículo');
      tipoVehiculoRef.current?.focus();
      return;
    }
    
    if (!metodoPago) {
      alert('Por favor seleccione un método de pago');
      metodoPagoRef.current?.focus();
      return;
    }
    
    if (metodoPago === 'Otro' && !otroMetodoPago.trim()) {
      alert('Por favor especifique el método de pago');
      otroMetodoPagoRef.current?.focus();
      return;
    }
    
    if (!agente) {
      alert('Por favor seleccione un agente');
      agenteRef.current?.focus();
      return;
    }
    
    // Verificar si el vehículo está disponible
    if (!vehiculosDisponibles.some(v => v.nombre === tipoVehiculo) && !ordenEditar) {
      alert(`El vehículo ${tipoVehiculo} no está disponible en el período seleccionado.`);
      return;
    }
    
    // Verificar si la licencia del cliente está por vencer
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente && cliente.fechaVencimientoLicencia) {
      const fechaVencimiento = new Date(cliente.fechaVencimientoLicencia);
      const fechaFinReserva = new Date(fechaFin);
      
      // Si la licencia vence durante el período de alquiler o antes
      if (fechaVencimiento <= fechaFinReserva) {
        setShowEmailReminderModal(true);
        return;
      }
    }
    
    // Generar ID con formato vehiculo-fechaInicio-fechaFin
    const ordenId = generarOrdenId();
    
    // Crear fechas con horas específicas
    const fechaInicioConHora = new Date(fechaInicio);
    let [horasInicio, minutosInicio] = horaInicio.split(':').map(Number);
    if (ampmInicio === 'PM' && horasInicio < 12) horasInicio += 12;
    if (ampmInicio === 'AM' && horasInicio === 12) horasInicio = 0;
    fechaInicioConHora.setHours(horasInicio, minutosInicio, 0);
    
    const fechaFinConHora = new Date(fechaFin);
    let [horasFin, minutosFin] = horaFin.split(':').map(Number);
    if (ampmFin === 'PM' && horasFin < 12) horasFin += 12;
    if (ampmFin === 'AM' && horasFin === 12) horasFin = 0;
    fechaFinConHora.setHours(horasFin, minutosFin, 0);
    
    // Crear fecha para "corre a partir de"
    let correAPartirFecha = null;
    if (correAPartir) {
      try {
        // Usar la fecha y hora seleccionadas
        correAPartirFecha = new Date(fechaHoraInicio);
      } catch (error) {
        console.error('Error al crear fecha "corre a partir de":', error);
        // Usar la fecha actual como fallback
        correAPartirFecha = new Date();
      }
    }
    
    const nuevaOrden = {
      clienteId,
      descripcion,
      estado: ordenEditar ? ordenEditar.estado : 'pendiente' as const,
      fechaInicio: fechaInicioConHora,
      fechaFin: fechaFinConHora,
      montoPorDia,
      montoTotal,
      correAPartir: correAPartirFecha,
      tipoVehiculo,
      metodoPago,
      otroMetodoPago: metodoPago === 'Otro' ? otroMetodoPago : undefined,
      agente,
      id: ordenId // Asignar el ID generado
    };
    
    onGuardarOrden(nuevaOrden);
    
    // Registrar acción en el log
    logAction('ORDEN', ordenEditar ? 'Orden actualizada' : 'Orden creada', {
      id: ordenId,
      clienteId,
      tipoVehiculo,
      fechaInicio: fechaInicioConHora.toISOString(),
      fechaFin: fechaFinConHora.toISOString(),
      montoTotal,
      agente
    });
    
    // Mostrar mensaje de éxito
    if (ordenEditar) {
      setAlertMessage('Variación Exitosa');
    } else {
      setAlertMessage('Orden creada exitosamente');
      setShowShareModal(true);
    }
    setAlertVariant('success');
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      setAlertMessage(null);
    }, 3000);
    
    // Limpiar formulario si no estamos editando
    if (!ordenEditar) {
      setDescripcion('');
      setFechaInicio(new Date());
      setFechaFin(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      setMontoPorDia(0);
      setMontoTotal(0);
      setCorreAPartir(false);
      setFechaHoraInicio(new Date());
      setHoraInicio('12:00');
      setHoraFin('12:00');
      setAmpmInicio('PM');
      setAmpmFin('PM');
      setTipoVehiculo('');
      setImagenVehiculo('');
      setMetodoPago('');
      setOtroMetodoPago('');
      setAgente('');
      
      // Si no hay cliente seleccionado, limpiar el clienteId
      if (!clienteSeleccionado) {
        setClienteId('');
      }
      
      // Enfocar el primer campo después de enviar
      setTimeout(() => {
        clienteIdRef.current?.focus();
      }, 100);
    }
  };

  const handleDescargarPDF = () => {
    if (!clienteId) {
      alert('Por favor seleccione un cliente');
      clienteIdRef.current?.focus();
      return;
    }
    
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) {
      alert('Cliente no encontrado');
      return;
    }
    
    // Crear un nuevo documento PDF
    const doc = new jsPDF();
    
    // Agregar color de fondo al encabezado
    doc.setFillColor(9, 38, 66); // #092642
    doc.rect(0, 0, 210, 40, 'F');
    
    // Obtener el logo guardado en localStorage
    const logoEmpresa = localStorage.getItem('logoEmpresa');
    
    if (logoEmpresa) {
      try {
        // Agregar el logo al PDF
        doc.addImage(logoEmpresa, 'PNG', 14, 10, 30, 20);
      } catch (error) {
        console.error('Error al agregar logo al PDF:', error);
        // Espacio para logo (fallback si no se puede cargar)
        doc.setFillColor(255, 255, 255);
        doc.rect(14, 10, 30, 20, 'F');
        doc.setFontSize(8);
        doc.setTextColor(9, 38, 66);
        doc.text('LOGO', 29, 20, { align: 'center' });
      }
    } else {
      // Si no hay logo, mostrar un espacio en blanco
      doc.setFillColor(255, 255, 255);
      doc.rect(14, 10, 30, 20, 'F');
      doc.setFontSize(8);
      doc.setTextColor(9, 38, 66);
      doc.text('LOGO', 29, 20, { align: 'center' });
    }
    
    // Título
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('CONTRATO DE ALQUILER', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('FACTO RENT A CAR', 105, 30, { align: 'center' });
    
    // Resetear color de texto
    doc.setTextColor(0, 0, 0);
    
    // Información del cliente (formato vertical)
    doc.setFillColor(240, 240, 240);
    doc.rect(10, 45, 190, 60, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 14, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Información del cliente en formato vertical
    const lineHeight = 7;
    let yPos = 65;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Cédula:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente.cedula, 50, yPos);
    yPos += lineHeight;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente.nombre, 50, yPos);
    yPos += lineHeight;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente.telefono, 50, yPos);
    yPos += lineHeight;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente.email, 50, yPos);
    
    // Información del alquiler
    doc.setFillColor(240, 240, 240);
    doc.rect(10, 110, 190, 70, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DEL ALQUILER', 14, 120);
    
    // Número de orden con formato vehiculo-fechaInicio-fechaFin
    const ordenId = generarOrdenId();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Número de Orden: ${ordenId}`, 14, 130);
    
    // Agregar tipo de vehículo en los detalles del alquiler
    doc.setFont('helvetica', 'bold');
    doc.text(`Vehículo: ${tipoVehiculo || 'No especificado'}`, 14, 140);
    
    // Formatear fechas con hora en formato 12 horas con AM/PM
    const formatFechaHora = (fecha: Date): string => {
      try {
        return fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString('es-CR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } catch (error) {
        console.error('Error al formatear fecha y hora:', error);
        return new Date().toLocaleDateString() + ' 12:00 PM';
      }
    };
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Fecha de Inicio: ${formatFechaHora(fechaInicio)}`, 14, 150);
    doc.text(`Fecha de Fin: ${formatFechaHora(fechaFin)}`, 14, 160);
    
    // Calcular días totales
    let diasTotales = 0;
    if (fechaInicio && fechaFin) {
      const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
      diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    doc.text(`Días Totales: ${diasTotales}`, 14, 170);
    
    // Montos en formato vertical con símbolo de colones
    doc.setFont('helvetica', 'bold');
    doc.text(`Monto por Día: ${formatNumber(montoPorDia || 0)} colones`, 120, 150);
    doc.text(`Monto Total: ${formatNumber(montoTotal || 0)} colones`, 120, 160);
    
    if (correAPartir) {
      try {
        doc.setFont('helvetica', 'normal');
        doc.text(`Corre a partir de: ${formatFechaHora(fechaHoraInicio)}`, 14, 180);
      } catch (error) {
        console.error('Error al formatear "corre a partir de":', error);
      }
    }
    
    // Método de pago y agente
    if (agente) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Agente: ${agente}`, 120, 170);
    }
    
    // Descripción y QR Code en la misma línea
    doc.setFillColor(240, 240, 240);
    doc.rect(10, 185, 100, 60, 'F'); // Descripción a la izquierda
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPCIÓN DEL ALQUILER', 14, 195);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Dividir la descripción en líneas para que quepa en el PDF
    const splitDescription = doc.splitTextToSize(descripcion, 90);
    doc.text(splitDescription, 14, 205);
    
    // Código QR a la derecha
    doc.setFillColor(240, 240, 240);
    doc.rect(115, 185, 85, 60, 'F');
    
    // Generar código QR para el cliente
    try {
      const qrCodeUrl = generateClientQRCode(cliente.codigo || cliente.id, 100);
      doc.addImage(qrCodeUrl, 'PNG', 137, 195, 40, 40);
      doc.setFontSize(8);
      doc.text(`Código Cliente: ${cliente.codigo || cliente.id}`, 157, 240, { align: 'center' });
    } catch (error) {
      console.error('Error al generar código QR:', error);
    }
    
    // Firmas
    doc.setFontSize(10);
    doc.text('_______________________', 40, 260);
    doc.text('Firma del Cliente', 50, 265);
    
    doc.text('_______________________', 140, 260);
    doc.text('Firma del Representante', 150, 265);
    
    // Pie de página
    doc.setFillColor(9, 38, 66); // #092642
    doc.rect(0, 280, 210, 17, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Facto Rent a Car', 105, 285, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Tel: 4070-0485 | www.factorentacar.com | San Ramón, Alajuela, Costa Rica', 105, 292, { align: 'center' });
    
    // Agregar segunda página con las condiciones generales
    doc.addPage();
    
    // Título de la segunda página
    doc.setFillColor(9, 38, 66); // #092642
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDICIONES GENERALES', 105, 20, { align: 'center' });
    
    // Resetear color de texto
    doc.setTextColor(0, 0, 0);
    
    // Obtener las condiciones generales del localStorage
    const rentalConditions = localStorage.getItem('rentalConditions') || 'No se han configurado las condiciones generales.';
    
    // Dividir las condiciones en líneas para que quepan en el PDF
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitConditions = doc.splitTextToSize(rentalConditions, 190);
    doc.text(splitConditions, 10, 40);
    
    // Pie de página en la segunda página
    doc.setFillColor(9, 38, 66); // #092642
    doc.rect(0, 280, 210, 17, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Facto Rent a Car', 105, 285, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Tel: 4070-0485 | www.factorentacar.com | San Ramón, Alajuela, Costa Rica', 105, 292, { align: 'center' });
    
    // Guardar el PDF
    doc.save(`${ordenId}.pdf`);
  };

  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const date = new Date(e.target.value);
      if (!isNaN(date.getTime())) {
        setFechaInicio(date);
        
        // Auto-tabbing: mover al siguiente campo
        setTimeout(() => {
          horaInicioRef.current?.focus();
        }, 10);
      }
    } catch (error) {
      console.error('Error al cambiar fecha de inicio:', error);
    }
  };

  const handleFechaFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const date = new Date(e.target.value);
      if (!isNaN(date.getTime())) {
        setFechaFin(date);
        
        // Auto-tabbing: mover al siguiente campo
        setTimeout(() => {
          horaFinRef.current?.focus();
        }, 10);
      }
    } catch (error) {
      console.error('Error al cambiar fecha de fin:', error);
    }
  };

  const handleHoraInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHoraInicio(e.target.value);
    
    // Auto-tabbing: mover al siguiente campo
    if (e.target.value.length === 5) {
      setTimeout(() => {
        ampmInicioRef.current?.focus();
      }, 10);
    }
  };

  const handleHoraFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHoraFin(e.target.value);
    
    // Auto-tabbing: mover al siguiente campo
    if (e.target.value.length === 5) {
      setTimeout(() => {
        ampmFinRef.current?.focus();
      }, 10);
    }
  };

  const handleAmpmInicioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAmpmInicio(e.target.value);
    
    // Auto-tabbing: mover al siguiente campo
    setTimeout(() => {
      fechaFinRef.current?.focus();
    }, 10);
  };

  const handleAmpmFinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAmpmFin(e.target.value);
    
    // Auto-tabbing: mover al siguiente campo
    setTimeout(() => {
      montoPorDiaRef.current?.focus();
    }, 10);
  };

  const handleMontoPorDiaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = parseFloat(e.target.value) || 0;
    setMontoPorDia(valor);
    
    // Auto-tabbing: mover al siguiente campo si el valor es mayor que 0
    if (valor > 0) {
      setTimeout(() => {
        metodoPagoRef.current?.focus();
      }, 500); // Esperar un poco más para que el usuario vea el monto total calculado
    }
  };

  const handleMetodoPagoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    setMetodoPago(valor);
    
    // Auto-tabbing: mover al siguiente campo
    if (valor === 'Otro') {
      setTimeout(() => {
        otroMetodoPagoRef.current?.focus();
      }, 10);
    } else {
      setTimeout(() => {
        agenteRef.current?.focus();
      }, 10);
    }
  };

  const handleOtroMetodoPagoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtroMetodoPago(e.target.value);
    
    // Auto-tabbing: mover al siguiente campo si hay texto
    if (e.target.value.trim().length > 0) {
      setTimeout(() => {
        agenteRef.current?.focus();
      }, 500);
    }
  };

  const handleAgenteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAgente(e.target.value);
    
    // Auto-tabbing: mover al siguiente campo
    setTimeout(() => {
      correAPartirRef.current?.focus();
    }, 10);
  };

  const handleFechaHoraInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const dateTimeStr = e.target.value;
      if (dateTimeStr) {
        const date = new Date(dateTimeStr);
        if (!isNaN(date.getTime())) {
          setFechaHoraInicio(date);
          
          // Auto-tabbing: mover al siguiente campo
          setTimeout(() => {
            descripcionRef.current?.focus();
          }, 10);
        }
      }
    } catch (error) {
      console.error('Error al cambiar fecha y hora de inicio:', error);
    }
  };

  const handleClienteIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClienteId(e.target.value);
    
    // Auto-tabbing: mover al siguiente campo si se seleccionó un cliente
    if (e.target.value) {
      setTimeout(() => {
        tipoVehiculoRef.current?.focus();
      }, 10);
    }
  };

  const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescripcion(e.target.value);
    
    // Auto-tabbing: mover al botón de enviar si la descripción tiene al menos 10 caracteres
    if (e.target.value.length >= 10) {
      setTimeout(() => {
        submitButtonRef.current?.focus();
      }, 1000); // Esperar un segundo para que el usuario termine de escribir
    }
  };

  // Función para manejar el cambio de vehículo
  const handleTipoVehiculoChange = (vehiculo: typeof tiposVehiculos[0]) => {
    setTipoVehiculo(vehiculo.nombre);
    setImagenVehiculo(vehiculo.imagen);
    setShowVehiculoDropdown(false);
    
    // Auto-tabbing: mover al siguiente campo
    setTimeout(() => {
      fechaInicioRef.current?.focus();
    }, 10);
  };

  // Función para abrir el modal de edición de cliente
  const handleEditarCliente = () => {
    if (!clienteId) {
      alert('Por favor seleccione un cliente primero');
      clienteIdRef.current?.focus();
      return;
    }
    
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) {
      alert('Cliente no encontrado');
      return;
    }
    
    setClienteEditando(cliente);
    setNombreCliente(cliente.nombre);
    setCedulaCliente(cliente.cedula || '');
    setTelefonoCliente(cliente.telefono);
    setEmailCliente(cliente.email);
    setShowEditModal(true);
  };

  // Función para guardar los cambios del cliente
  const handleGuardarCambiosCliente = () => {
    if (!clienteEditando) return;
    
    // Aquí deberíamos actualizar el cliente en la lista de clientes
    // Esto debería ser manejado por una función que se pase desde App.tsx
    // Por ahora, solo cerramos el modal
    
    // Simulación de actualización (esto debería ser reemplazado por una función real)
    alert(`Los cambios en el cliente ${nombreCliente} se guardarían aquí.`);
    
    setShowEditModal(false);
  };

  // Obtener el cliente actual seleccionado
  const clienteActual = clientes.find(c => c.id === clienteId);

  // Formatear fecha para mostrar en el input
  const formatDateForInput = (date: Date): string => {
    try {
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error al formatear fecha para input:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // Formatear fecha y hora para mostrar en el input
  const formatDateTimeForInput = (date: Date): string => {
    try {
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error al formatear fecha y hora para input:', error);
      return new Date().toISOString().slice(0, 16);
    }
  };

  // Manejar el evento de tecla para auto-tabbing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, nextRef: React.RefObject<HTMLElement>) => {
    // Si se presiona Tab o Enter, mover al siguiente campo
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  // Función para enviar recordatorio por correo
  const handleSendEmailReminder = () => {
    if (!clienteActual) return;
    
    // Aquí iría la lógica para enviar el correo
    // Por ahora, solo mostramos un mensaje
    alert(`Se enviaría un recordatorio a ${clienteActual.email} sobre el vencimiento de su licencia.`);
    
    // Cerrar el modal
    setShowEmailReminderModal(false);
    
    // Continuar con la creación de la orden
    handleSubmit(new Event('submit') as React.FormEvent);
  };

  // Función para compartir por WhatsApp
  const handleShareWhatsApp = () => {
    if (!clienteActual) return;
    
    // Crear mensaje con formato mejorado
    const mensaje = `*FACTO RENT A CAR - RECORDATORIO*\n\n` +
      `Estimado(a) ${clienteActual.nombre},\n\n` +
      `Le recordamos que su licencia de conducir con cédula ${clienteActual.cedula} vence el ${clienteActual.fechaVencimientoLicencia ? new Date(clienteActual.fechaVencimientoLicencia).toLocaleDateString() : 'fecha no registrada'}.\n\n` +
      `Por favor, renueve su licencia antes de la fecha de vencimiento para evitar inconvenientes.\n\n` +
      `Saludos cordiales,\n` +
      `Equipo de Facto Rent a Car\n` +
      `Tel: 4070-0485`;
    
    // Codificar el mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    // Abrir WhatsApp Web con el mensaje
    window.open(`https://web.whatsapp.com/send?phone=${clienteActual.telefono.replace(/\D/g, '')}&text=${mensajeCodificado}`, '_blank');
    
    // Cerrar el modal
    setShowEmailReminderModal(false);
    
    // Continuar con la creación de la orden
    handleSubmit(new Event('submit') as React.FormEvent);
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{ordenEditar ? 'Editar Alquiler de Vehículo' : 'Nuevo Alquiler de Vehículo'}</h5>
        <Button 
          variant="outline-primary" 
          onClick={ handleDescargarPDF}
          disabled={!clienteId || montoPorDia <= 0 || !tipoVehiculo}
        >
          Descargar PDF
        </Button>
      </Card.Header>
      <Card.Body>
        {alertMessage && (
          <Alert variant={alertVariant} onClose={() => setAlertMessage(null)} dismissible>
            {alertMessage}
          </Alert>
        )}
        
        {clienteSeleccionado && !ordenEditar && (
          <Alert variant="success" className="mb-3">
            <strong>Cliente seleccionado:</strong> {clienteSeleccionado.nombre}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="clienteId">
                <Form.Label>Cliente</Form.Label>
                <div className="d-flex">
                  <Form.Select
                    ref={clienteIdRef}
                    value={clienteId}
                    onChange={handleClienteIdChange}
                    required
                    className="me-2"
                    onKeyDown={(e) => handleKeyDown(e, tipoVehiculoRef)}
                    autoFocus
                  >
                    <option value="">Seleccione un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} - {cliente.cedula}
                      </option>
                    ))}
                  </Form.Select>
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleEditarCliente}
                    disabled={!clienteId}
                  >
                    Editar
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="tipoVehiculo">
                <Form.Label>Tipo de Vehículo</Form.Label>
                <div 
                  className="position-relative"
                  ref={tipoVehiculoRef}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setShowVehiculoDropdown(!showVehiculoDropdown);
                    } else if (e.key === 'Tab') {
                      fechaInicioRef.current?.focus();
                    }
                  }}
                >
                  <div 
                    className="form-control d-flex align-items-center justify-content-between"
                    onClick={() => setShowVehiculoDropdown(!showVehiculoDropdown)}
                    style={{ cursor: 'pointer' }}
                  >
                    {tipoVehiculo ? (
                      <div className="d-flex align-items-center">
                        <img 
                          src={imagenVehiculo} 
                          alt={tipoVehiculo}
                          style={{ width: '50px', height: '50px', objectFit: 'contain', marginRight: '10px' }}
                        />
                        <span>{tipoVehiculo}</span>
                      </div>
                    ) : (
                      <span>Seleccione un vehículo</span>
                    )}
                    <span>▼</span>
                  </div>
                  
                  {showVehiculoDropdown && (
                    <div 
                      className="position-absolute w-100 bg-white border rounded shadow-sm z-index-dropdown"
                      style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}
                    >
                      {vehiculosDisponibles.map((vehiculo) => (
                        <div 
                          key={vehiculo.nombre}
                          className="d-flex align-items-center p-2 border-bottom hover-bg-light"
                          onClick={() => handleTipoVehiculoChange(vehiculo)}
                          style={{ cursor: 'pointer' }}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleTipoVehiculoChange(vehiculo);
                            }
                          }}
                        >
                          <img 
                            src={vehiculo.imagen} 
                            alt={vehiculo.nombre}
                            style={{ width: '50px', height: '50px', objectFit: 'contain', marginRight: '10px' }}
                          />
                          <span>{vehiculo.nombre}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {vehiculosDisponibles.length < tiposVehiculos.length && (
                  <Form.Text className="text-warning">
                    Algunos vehículos no están disponibles en el período seleccionado.
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>
          
          {clienteActual && (
            <Row className="mb-3">
              <Col md={12}>
                <Card className="bg-light">
                  <Card.Body>
                    <h6>Información del Cliente</h6>
                    <Row>
                      <Col md={3}>
                        <p className="mb-1"><strong>Nombre:</strong></p>
                        <p>{clienteActual.nombre}</p>
                      </Col>
                      <Col md={3}>
                        <p className="mb-1"><strong>Cédula:</strong></p>
                        <p>{clienteActual.cedula}</p>
                      </Col>
                      <Col md={3}>
                        <p className="mb-1"><strong>Teléfono:</strong></p>
                        <p>{clienteActual.telefono}</p>
                      </Col>
                      <Col md={3}>
                        <p className="mb-1"><strong>Email:</strong></p>
                        <p>{clienteActual.email}</p>
                      </Col>
                    </Row>
                    {clienteActual.fechaVencimientoLicencia && (
                      <Row className="mt-2">
                        <Col md={12}>
                          <p className="mb-1">
                            <strong>Vencimiento de Licencia:</strong> 
                            <span className={new Date(clienteActual.fechaVencimientoLicencia) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-danger fw-bold ms-2' : 'ms-2'}>
                              {new Date(clienteActual.fechaVencimientoLicencia).toLocaleDateString()}
                            </span>
                          </p>
                        </Col>
                      </Row>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          {/* Mostrar imagen del vehículo seleccionado */}
          {imagenVehiculo && (
            <Row className="mb-3">
              <Col md={12}>
                <Card className="bg-light">
                  <Card.Body>
                    <h6>Vehículo Seleccionado: {tipoVehiculo}</h6>
                    <div className="text-center">
                      <img 
                        src={imagenVehiculo} 
                        alt={tipoVehiculo}
                        style={{ maxHeight: '150px', objectFit: 'contain' }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3" controlId="fechaInicio">
                <Form.Label>Fecha de Inicio</Form.Label>
                <Form.Control
                  ref={fechaInicioRef}
                  type="date"
                  value={formatDateForInput(fechaInicio)}
                  onChange={handleFechaInicioChange}
                  required
                  onKeyDown={(e) => handleKeyDown(e, horaInicioRef)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3" controlId="horaInicio">
                <Form.Label>Hora de Inicio</Form.Label>
                <Form.Control
                  ref={horaInicioRef}
                  type="time"
                  value={horaInicio}
                  onChange={handleHoraInicioChange}
                  required
                  onKeyDown={(e) => handleKeyDown(e, ampmInicioRef)}
                />
              </Form.Group>
            </Col>
            <Col md={1}>
              <Form.Group className="mb-3" controlId="ampmInicio">
                <Form.Label>AM/PM</Form.Label>
                <Form.Select
                  ref={ampmInicioRef}
                  value={ampmInicio}
                  onChange={handleAmpmInicioChange}
                  onKeyDown={(e) => handleKeyDown(e, fechaFinRef)}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3" controlId="fechaFin">
                <Form.Label>Fecha de Fin</Form.Label>
                <Form.Control
                  ref={fechaFinRef}
                  type="date"
                  value={formatDateForInput(fechaFin)}
                  onChange={handleFechaFinChange}
                  min={formatDateForInput(fechaInicio)}
                  required
                  onKeyDown={(e) => handleKeyDown(e, horaFinRef)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3" controlId="horaFin">
                <Form.Label>Hora de Fin</Form.Label>
                <Form.Control
                  ref={horaFinRef}
                  type="time"
                  value={horaFin}
                  onChange={handleHoraFinChange}
                  required
                  onKeyDown={(e) => handleKeyDown(e, ampmFinRef)}
                />
              </Form.Group>
            </Col>
            <Col md={1}>
              <Form.Group className="mb-3" controlId="ampmFin">
                <Form.Label>AM/PM</Form.Label>
                <Form.Select
                  ref={ampmFinRef}
                  value={ampmFin}
                  onChange={handleAmpmFinChange}
                  onKeyDown={(e) => handleKeyDown(e, montoPorDiaRef)}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="montoPorDia">
                <Form.Label>Monto por Día (₡)</Form.Label>
                <Form.Control
                  ref={montoPorDiaRef}
                  type="number"
                  value={montoPorDia || ''}
                  onChange={handleMontoPorDiaChange}
                  required
                  min="0"
                  step="1000"
                  onKeyDown={(e) => handleKeyDown(e, metodoPagoRef)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="montoTotal">
                <Form.Label>Monto Total (₡)</Form.Label>
                <Form.Control
                  type="text"
                  value={montoTotal ? `₡${formatNumber(montoTotal)}` : ''}
                  readOnly
                  disabled
                />
                <Form.Text className="text-muted">
                  {diasTotales} día(s) x ₡{montoPorDia ? formatNumber(montoPorDia) : '0,00'} = ₡{montoTotal ? formatNumber(montoTotal) : '0,00'}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="metodoPago">
                <Form.Label>Método de Pago</Form.Label>
                <Form.Select
                  ref={metodoPagoRef}
                  value={metodoPago}
                  onChange={handleMetodoPagoChange}
                  required
                  onKeyDown={(e) => handleKeyDown(e, metodoPago === 'Otro' ? otroMetodoPagoRef : agenteRef)}
                >
                  <option value="">Seleccione un método</option>
                  {metodosPago.map((metodo) => (
                    <option key={metodo} value={metodo}>{metodo}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              {metodoPago === 'Otro' && (
                <Form.Group className="mb-3" controlId="otroMetodoPago">
                  <Form.Label>Especifique el método de pago</Form.Label>
                  <Form.Control
                    ref={otroMetodoPagoRef}
                    type="text"
                    value={otroMetodoPago}
                    onChange={handleOtroMetodoPagoChange}
                    required
                    onKeyDown={(e) => handleKeyDown(e, agenteRef)}
                  />
                </Form.Group>
              )}
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="agente">
                <Form.Label>Agente</Form.Label>
                <Form.Select
                  ref={agenteRef}
                  value={agente}
                  onChange={handleAgenteChange}
                  required
                  onKeyDown={(e) => handleKeyDown(e, correAPartirRef)}
                >
                  <option value="">Seleccione un agente</option>
                  {agentesDisponibles.map((ag) => (
                    <option key={ag.email} value={ag.nombre}>{ag.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="correAPartir">
                <Form.Label>¿Corre a partir de otra fecha?</Form.Label>
                <Form.Check
                  ref={correAPartirRef}
                  type="checkbox"
                  checked={correAPartir}
                  onChange={(e) => {
                    setCorreAPartir(e.target.checked);
                    if (e.target.checked) {
                      setTimeout(() => fechaHoraInicioRef.current?.focus(), 10);
                    } else {
                      setTimeout(() => descripcionRef.current?.focus(), 10);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, correAPartir ? fechaHoraInicioRef : descripcionRef)}
                />
              </Form.Group>
              {correAPartir && (
                <Form.Group className="mb-3" controlId="fechaHoraInicio">
                  <Form.Label>Fecha y Hora de Inicio</Form.Label>
                  <Form.Control
                    ref={fechaHoraInicioRef}
                    type="datetime-local"
                    value={formatDateTimeForInput(fechaHoraInicio)}
                    onChange={handleFechaHoraInicioChange}
                    required
                    onKeyDown={(e) => handleKeyDown(e, descripcionRef)}
                  />
                </Form.Group>
              )}
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="descripcion">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              ref={descripcionRef}
              as="textarea"
              rows={3}
              value={descripcion}
              onChange={handleDescripcionChange}
              required
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  submitButtonRef.current?.focus();
                }
              }}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            {ordenEditar && (
              <Button variant="secondary" onClick={onCancelarEdicion}>
                Cancelar
              </Button>
            )}
            <Button 
              ref={submitButtonRef}
              variant="primary" 
              type="submit"
            >
              {ordenEditar ? 'Guardar Cambios' : 'Crear Orden'}
            </Button>
          </div>
        </Form>

        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Editar Cliente</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3" controlId="nombreCliente">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="cedulaCliente">
                <Form.Label>Cédula</Form.Label>
                <Form.Control
                  type="text"
                  value={cedulaCliente}
                  onChange={(e) => setCedulaCliente(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="telefonoCliente">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  type="tel"
                  value={telefonoCliente}
                  onChange={(e) => setTelefonoCliente(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="emailCliente">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={emailCliente}
                  onChange={(e) => setEmailCliente(e.target.value)}
                  required
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleGuardarCambiosCliente}>
              Guardar Cambios
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal para recordatorio por correo */}
        <Modal 
          show={showEmailReminderModal} 
          onHide={() => setShowEmailReminderModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Recordatorio de Vencimiento de Licencia</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {clienteActual && (
              <div>
                <Alert variant="warning">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <strong>Atención:</strong> La licencia de conducir de {clienteActual.nombre} con cédula {clienteActual.cedula} vence el <span className="text-danger fw-bold">{clienteActual.fechaVencimientoLicencia ? new Date(clienteActual.fechaVencimientoLicencia).toLocaleDateString() : 'fecha no registrada'}</span>.
                </Alert>
                
                <p className="mt-3">
                  Seleccione una opción para recordarle al cliente que debe renovar su licencia:
                </p>
                
                <div className="d-grid gap-3 mt-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={handleSendEmailReminder}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <i className="bi bi-envelope me-2" style={{ fontSize: '1.2rem' }}></i>
                    Enviar Recordatorio por Correo
                  </Button>
                  
                  <Button 
                    variant="success" 
                    size="lg" 
                    onClick={handleShareWhatsApp}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <i className="bi bi-whatsapp me-2" style={{ fontSize: '1.2rem' }}></i>
                    Compartir por WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEmailReminderModal(false)}>
              Cancelar
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal para compartir */}
        <Modal
          show={showShareModal}
          onHide={() => setShowShareModal(false)}
          centered
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>Orden Creada Exitosamente</Modal.Title>
            <Button 
              variant="link" 
              className="ms-auto p-0 border-0" 
              onClick={() => setShowShareModal(false)}
              style={{ fontSize: '1.5rem', lineHeight: 1 }}
            >
              <i className="bi bi-x"></i>
            </Button>
          </Modal.Header>
          <Modal.Body className="text-center">
            <div className="mb-4">
              <div className="d-inline-block p-3 bg-success text-white rounded-circle mb-3">
                <i className="bi bi-check-lg" style={{ fontSize: '3rem' }}></i>
              </div>
              <h4>¡Orden creada con éxito!</h4>
              <p className="text-muted">
                La orden de alquiler ha sido creada y se está descargando el PDF automáticamente.
              </p>
            </div>

            {clienteActual && (
              <div className="border rounded p-3 mb-4 bg-light">
                <h5 className="mb-3">Detalles del Alquiler</h5>
                <p><strong>Cliente:</strong> {clienteActual.nombre}</p>
                <p><strong>Vehículo:</strong> {tipoVehiculo}</p>
                <p><strong>Período:</strong> {formatDateForInput(fechaInicio)} - {formatDateForInput(fechaFin)}</p>
                <p><strong>Monto Total:</strong> ₡{formatNumber(montoTotal)}</p>
              </div>
            )}
            
            <h6 className="mb-3">Opciones para compartir</h6>
            
            <div className="d-grid gap-3 mt-4">
              <Button 
                variant="success" 
                size="lg" 
                onClick={handleShareWhatsApp}
                className="d-flex align-items-center justify-content-center"
              >
                <i className="bi bi-whatsapp me-2" style={{ fontSize: '1.5rem' }}></i>
                Compartir por WhatsApp
              </Button>
              
              <Button 
                variant="info" 
                size="lg" 
                onClick={handleSendEmailReminder}
                className="d-flex align-items-center justify-content-center text-white"
              >
                <i className="bi bi-envelope me-2" style={{ fontSize: '1.5rem' }}></i>
                Enviar por Email
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      </Card.Body>
    </Card>
  );
}