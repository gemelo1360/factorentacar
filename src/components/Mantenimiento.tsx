import { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Alert, Row, Col, Table, Badge, Dropdown, Modal } from 'react-bootstrap';
import { logAction } from '../utils/logService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Mantenimiento as MantenimientoType } from '../types';
import { generateClientQRCode } from '../utils/qrCodeGenerator';

// Lista de vehículos disponibles con imágenes
const tiposVehiculos = [
  {
    nombre: "Nissan Frontier NB",
    imagen: "https://factorentacar.com/carros/frontier.png",
    disponible: true
  },
  {
    nombre: "Toyota Rush Café",
    imagen: "https://factorentacar.com/carros/rushcafe.png",
    disponible: true
  },
  {
    nombre: "Toyota Rush Silver",
    imagen: "https://factorentacar.com/carros/rsilver.png",
    disponible: true
  },
  {
    nombre: "Toyota Yaris",
    imagen: "https://factorentacar.com/carros/yaris.png",
    disponible: true
  },
  {
    nombre: "Hyundai Tucson",
    imagen: "https://factorentacar.com/carros/tucson.png",
    disponible: true
  },
  {
    nombre: "Hyundai Elantra Blanco",
    imagen: "https://factorentacar.com/carros/elantrab.png",
    disponible: true
  },
  {
    nombre: "Hyundai Elantra Gris",
    imagen: "https://factorentacar.com/carros/elantrap.png",
    disponible: true
  },
  {
    nombre: "Hyundai Starex",
    imagen: "https://factorentacar.com/carros/starex.png",
    disponible: true
  },
  {
    nombre: "Chevrolet Beat",
    imagen: "https://factorentacar.com/carros/beat.png",
    disponible: true
  }
];

// Tipos de mantenimiento
const tiposMantenimiento = [
  "Cambio de Aceite",
  "Reparación",
  "Pintura",
  "Apartado",
  "Decka",
  "Aire Acond",
  "Llantas",
  "Lavado"
];

export default function Mantenimiento() {
  const [tipoVehiculo, setTipoVehiculo] = useState<string>('');
  const [imagenVehiculo, setImagenVehiculo] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
  const [fechaFin, setFechaFin] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Una semana después
  const [horaInicio, setHoraInicio] = useState<string>('12:00');
  const [horaFin, setHoraFin] = useState<string>('12:00');
  const [ampmInicio, setAmpmInicio] = useState<string>('PM');
  const [ampmFin, setAmpmFin] = useState<string>('PM');
  const [tipoMantenimiento, setTipoMantenimiento] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [precio, setPrecio] = useState<number>(0);
  const [showVehiculoDropdown, setShowVehiculoDropdown] = useState(false);
  const [mantenimientos, setMantenimientos] = useState<MantenimientoType[]>([]);
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<typeof tiposVehiculos>(tiposVehiculos);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<'success' | 'danger'>('success');
  const [mantenimientoEditar, setMantenimientoEditar] = useState<MantenimientoType | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState<MantenimientoType | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Referencias para los campos del formulario
  const tipoVehiculoRef = useRef<HTMLDivElement>(null);
  const fechaInicioRef = useRef<HTMLInputElement>(null);
  const horaInicioRef = useRef<HTMLInputElement>(null);
  const ampmInicioRef = useRef<HTMLSelectElement>(null);
  const fechaFinRef = useRef<HTMLInputElement>(null);
  const horaFinRef = useRef<HTMLInputElement>(null);
  const ampmFinRef = useRef<HTMLSelectElement>(null);
  const tipoMantenimientoRef = useRef<HTMLSelectElement>(null);
  const precioRef = useRef<HTMLInputElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Cargar mantenimientos guardados
  useEffect(() => {
    const mantenimientosGuardados = localStorage.getItem('mantenimientos');
    if (mantenimientosGuardados) {
      try {
        const parsed = JSON.parse(mantenimientosGuardados).map((mant: any) => ({
          ...mant,
          fechaCreacion: new Date(mant.fechaCreacion),
          fechaInicio: new Date(mant.fechaInicio),
          fechaFin: new Date(mant.fechaFin)
        }));
        setMantenimientos(parsed);
      } catch (error) {
        console.error('Error parsing mantenimientos:', error);
      }
    }
  }, []);

  // Actualizar vehículos disponibles
  useEffect(() => {
    // Marcar vehículos como no disponibles si están en mantenimiento
    const vehiculosActualizados = tiposVehiculos.map(vehiculo => {
      const enMantenimiento = mantenimientos.some(mant => 
        mant.tipoVehiculo === vehiculo.nombre && 
        mant.estado !== 'completado' &&
        new Date(mant.fechaFin) > new Date()
      );
      
      return {
        ...vehiculo,
        disponible: !enMantenimiento
      };
    });
    
    setVehiculosDisponibles(vehiculosActualizados);
  }, [mantenimientos]);

  // Cargar datos del mantenimiento a editar
  useEffect(() => {
    if (mantenimientoEditar) {
      setTipoVehiculo(mantenimientoEditar.tipoVehiculo);
      const vehiculo = tiposVehiculos.find(v => v.nombre === mantenimientoEditar.tipoVehiculo);
      if (vehiculo) {
        setImagenVehiculo(vehiculo.imagen);
      }
      
      setFechaInicio(new Date(mantenimientoEditar.fechaInicio));
      setFechaFin(new Date(mantenimientoEditar.fechaFin));
      
      // Extraer hora y AM/PM para inicio
      const horasInicio = mantenimientoEditar.fechaInicio.getHours();
      const minutosInicio = mantenimientoEditar.fechaInicio.getMinutes();
      const esPMInicio = horasInicio >= 12;
      const hora12Inicio = horasInicio % 12 || 12;
      setHoraInicio(`${hora12Inicio.toString().padStart(2, '0')}:${minutosInicio.toString().padStart(2, '0')}`);
      setAmpmInicio(esPMInicio ? 'PM' : 'AM');
      
      // Extraer hora y AM/PM para fin
      const horasFin = mantenimientoEditar.fechaFin.getHours();
      const minutosFin = mantenimientoEditar.fechaFin.getMinutes();
      const esPMFin = horasFin >= 12;
      const hora12Fin = horasFin % 12 || 12;
      setHoraFin(`${hora12Fin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`);
      setAmpmFin(esPMFin ? 'PM' : 'AM');
      
      setTipoMantenimiento(mantenimientoEditar.tipoMantenimiento);
      setPrecio(mantenimientoEditar.precio || 0);
      setDescripcion(mantenimientoEditar.descripcion);
    }
  }, [mantenimientoEditar]);

  // Formatear fecha para mostrar en el input
  const formatDateForInput = (date: Date): string => {
    try {
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error al formatear fecha para input:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // Manejar selección de vehículo
  const handleTipoVehiculoChange = (vehiculo: typeof tiposVehiculos[0]) => {
    setTipoVehiculo(vehiculo.nombre);
    setImagenVehiculo(vehiculo.imagen);
    setShowVehiculoDropdown(false);
    
    // Auto-tabbing: mover al siguiente campo
    setTimeout(() => {
      fechaInicioRef.current?.focus();
    }, 10);
  };

  // Manejar cambio de fecha de inicio
  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const date = new Date(e.target.value);
      if (!isNaN(date.getTime())) {
        setFechaInicio(date);
      }
    } catch (error) {
      console.error('Error al cambiar fecha de inicio:', error);
    }
  };

  // Manejar cambio de fecha de fin
  const handleFechaFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const date = new Date(e.target.value);
      if (!isNaN(date.getTime())) {
        setFechaFin(date);
      }
    } catch (error) {
      console.error('Error al cambiar fecha de fin:', error);
    }
  };

  // Manejar el evento de tecla para auto-tabbing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, nextRef: React.RefObject<HTMLElement>) => {
    // Solo si se presiona Enter, mover al siguiente campo
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  // Formatear número con separadores de miles y decimales
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tipoVehiculo) {
      setAlertMessage('Por favor seleccione un vehículo');
      setAlertVariant('danger');
      return;
    }
    
    if (!tipoMantenimiento) {
      setAlertMessage('Por favor seleccione un tipo de mantenimiento');
      setAlertVariant('danger');
      return;
    }
    
    if (!descripcion.trim()) {
      setAlertMessage('Por favor ingrese una descripción');
      setAlertVariant('danger');
      return;
    }
    
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
    
    if (fechaInicioConHora >= fechaFinConHora) {
      setAlertMessage('La fecha de fin debe ser posterior a la fecha de inicio');
      setAlertVariant('danger');
      return;
    }
    
    // Verificar si el vehículo está disponible (no en mantenimiento)
    if (!mantenimientoEditar) {
      const vehiculo = vehiculosDisponibles.find(v => v.nombre === tipoVehiculo);
      if (vehiculo && !vehiculo.disponible) {
        setAlertMessage(`El vehículo ${tipoVehiculo} no está disponible para mantenimiento en este momento`);
        setAlertVariant('danger');
        return;
      }
    }
    
    // Crear o actualizar mantenimiento
    if (mantenimientoEditar) {
      // Actualizar mantenimiento existente
      const mantenimientosActualizados = mantenimientos.map(mant => 
        mant.id === mantenimientoEditar.id ? {
          ...mant,
          tipoVehiculo,
          fechaInicio: fechaInicioConHora,
          fechaFin: fechaFinConHora,
          tipoMantenimiento,
          precio,
          descripcion
        } : mant
      );
      
      setMantenimientos(mantenimientosActualizados);
      localStorage.setItem('mantenimientos', JSON.stringify(mantenimientosActualizados));
      
      setAlertMessage('Mantenimiento actualizado exitosamente');
      setAlertVariant('success');
      
      // Registrar acción en el log
      logAction('MANTENIMIENTO', 'Mantenimiento actualizado', {
        id: mantenimientoEditar.id,
        tipoVehiculo,
        tipoMantenimiento,
        precio,
        fechaInicio: fechaInicioConHora.toISOString(),
        fechaFin: fechaFinConHora.toISOString()
      });
    } else {
      // Crear nuevo mantenimiento
      const nuevoMantenimiento: MantenimientoType = {
        id: Date.now().toString(),
        tipoVehiculo,
        fechaInicio: fechaInicioConHora,
        fechaFin: fechaFinConHora,
        tipoMantenimiento,
        precio,
        descripcion,
        estado: 'pendiente',
        fechaCreacion: new Date()
      };
      
      const nuevosMantenimientos = [...mantenimientos, nuevoMantenimiento];
      setMantenimientos(nuevosMantenimientos);
      localStorage.setItem('mantenimientos', JSON.stringify(nuevosMantenimientos));
      
      setAlertMessage('Mantenimiento creado exitosamente');
      setAlertVariant('success');
      
      // Registrar acción en el log
      logAction('MANTENIMIENTO', 'Mantenimiento creado', {
        id: nuevoMantenimiento.id,
        tipoVehiculo,
        tipoMantenimiento,
        precio,
        fechaInicio: fechaInicioConHora.toISOString(),
        fechaFin: fechaFinConHora.toISOString()
      });
      
      // Enviar notificación por email a las 7:00 AM
      programarNotificacionEmail(nuevoMantenimiento);
      
      // Mostrar modal de compartir
      setSelectedMantenimiento(nuevoMantenimiento);
      setShowShareModal(true);
    }
    
    // Limpiar formulario
    setTipoVehiculo('');
    setImagenVehiculo('');
    setFechaInicio(new Date());
    setFechaFin(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setHoraInicio('12:00');
    setHoraFin('12:00');
    setAmpmInicio('PM');
    setAmpmFin('PM');
    setTipoMantenimiento('');
    setPrecio(0);
    setDescripcion('');
    setMantenimientoEditar(null);
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      setAlertMessage(null);
    }, 3000);
  };

  // Programar notificación por email
  const programarNotificacionEmail = (mantenimiento: MantenimientoType) => {
    // Esta función simularía la programación de un email para las 7:00 AM
    console.log(`Email programado para las 7:00 AM: Mantenimiento de ${mantenimiento.tipoVehiculo}`);
    
    // En un entorno real, aquí se programaría el envío del email
    // usando un servicio como cron o un worker
  };

  // Manejar cambio de estado de mantenimiento
  const handleCambiarEstado = (id: string, nuevoEstado: MantenimientoType['estado']) => {
    const mantenimientosActualizados = mantenimientos.map(mant => 
      mant.id === id ? { ...mant, estado: nuevoEstado } : mant
    );
    
    setMantenimientos(mantenimientosActualizados);
    localStorage.setItem('mantenimientos', JSON.stringify(mantenimientosActualizados));
    
    // Registrar acción en el log
    logAction('MANTENIMIENTO', 'Estado de mantenimiento actualizado', {
      id,
      nuevoEstado
    });
  };

  // Manejar edición de mantenimiento
  const handleEditarMantenimiento = (mantenimiento: MantenimientoType) => {
    setMantenimientoEditar(mantenimiento);
    
    // Desplazarse al formulario
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Manejar eliminación de mantenimiento
  const handleEliminarMantenimiento = (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este mantenimiento?')) {
      const mantenimientosActualizados = mantenimientos.filter(mant => mant.id !== id);
      setMantenimientos(mantenimientosActualizados);
      localStorage.setItem('mantenimientos', JSON.stringify(mantenimientosActualizados));
      
      // Registrar acción en el log
      logAction('MANTENIMIENTO', 'Mantenimiento eliminado', { id });
      
      setAlertMessage('Mantenimiento eliminado exitosamente');
      setAlertVariant('success');
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setAlertMessage(null);
      }, 3000);
    }
  };

  // Formatear fecha para mostrar
  const formatFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Obtener badge para el estado
  const getEstadoBadge = (estado: MantenimientoType['estado']) => {
    const badgeMap = {
      pendiente: 'warning',
      en_proceso: 'info',
      completado: 'success'
    };
    
    const estadoMap = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado'
    };
    
    return <Badge bg={badgeMap[estado]}>{estadoMap[estado]}</Badge>;
  };

  // Cancelar edición
  const handleCancelarEdicion = () => {
    setMantenimientoEditar(null);
    
    // Limpiar formulario
    setTipoVehiculo('');
    setImagenVehiculo('');
    setFechaInicio(new Date());
    setFechaFin(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setHoraInicio('12:00');
    setHoraFin('12:00');
    setAmpmInicio('PM');
    setAmpmFin('PM');
    setTipoMantenimiento('');
    setPrecio(0);
    setDescripcion('');
  };

  // Generar PDF para mantenimiento
  const handleGenerarPDF = (mantenimiento: MantenimientoType) => {
    setSelectedMantenimiento(mantenimiento);
    setShowPdfModal(true);
  };

  // Descargar PDF
  const handleDownloadPDF = () => {
    if (!selectedMantenimiento) return;
    
    try {
      // Crear un nuevo documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Cargar fuente Arial
      doc.setFont('helvetica', 'normal');
      
      // Agregar color de fondo al encabezado
      doc.setFillColor(9, 38, 66); // #092642
      doc.rect(0, 0, 210, 40, 'F');
      
      // Obtener el logo guardado en localStorage
      const logoEmpresa = localStorage.getItem('logoEmpresa');
      
      if (logoEmpresa) {
        try {
          // Agregar el logo al PDF con tamaño proporcional
          doc.addImage(logoEmpresa, 'PNG', 10, 5, 30, 30);
        } catch (error) {
          console.error('Error al agregar logo al PDF:', error);
          // Espacio para logo (fallback si no se puede cargar)
          doc.setFillColor(255, 255, 255);
          doc.rect(10, 5, 30, 30, 'F');
          doc.setFontSize(8);
          doc.setTextColor(9, 38, 66);
          doc.text('LOGO', 25, 20, { align: 'center' });
        }
      } else {
        // Si no hay logo, mostrar un espacio en blanco
        doc.setFillColor(255, 255, 255);
        doc.rect(10, 5, 30, 30, 'F');
        doc.setFontSize(8);
        doc.setTextColor(9, 38, 66);
        doc.text('LOGO', 25, 20, { align: 'center' });
      }
      
      // Título
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('ORDEN DE MANTENIMIENTO', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text('FACTO RENT A CAR', 105, 30, { align: 'center' });
      
      // Resetear color de texto
      doc.setTextColor(0, 0, 0);
      
      // Información del vehículo
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 45, 190, 60, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL VEHÍCULO', 14, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Información del vehículo en formato vertical
      const lineHeight = 7;
      let yPos = 65;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Vehículo:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedMantenimiento.tipoVehiculo, 50, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Tipo de Mantenimiento:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedMantenimiento.tipoMantenimiento, 50, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Estado:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      const estadoMap = {
        pendiente: 'Pendiente',
        en_proceso: 'En Proceso',
        completado: 'Completado'
      };
      doc.text(estadoMap[selectedMantenimiento.estado], 50, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Precio:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`₡${formatNumber(selectedMantenimiento.precio || 0)}`, 50, yPos);
      
      // Información del mantenimiento
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 110, 190, 70, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DEL MANTENIMIENTO', 14, 120);
      
      // Número de orden
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Número de Orden: ${selectedMantenimiento.id}`, 14, 130);
      
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
      
      doc.text(`Fecha de Inicio: ${formatFechaHora(selectedMantenimiento.fechaInicio)}`, 14, 140);
      doc.text(`Fecha de Fin: ${formatFechaHora(selectedMantenimiento.fechaFin)}`, 14, 150);
      
      // Calcular días totales
      const diffTime = Math.abs(selectedMantenimiento.fechaFin.getTime() - selectedMantenimiento.fechaInicio.getTime());
      const diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      doc.text(`Días Totales: ${diasTotales}`, 14, 160);
      
      // Descripción y QR Code en la misma línea
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 185, 100, 60, 'F'); // Descripción a la izquierda
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPCIÓN DEL MANTENIMIENTO', 14, 195);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Dividir la descripción en líneas para que quepa en el PDF
      const splitDescription = doc.splitTextToSize(selectedMantenimiento.descripcion, 90);
      doc.text(splitDescription, 14, 205);
      
      // Código QR a la derecha
      doc.setFillColor(240, 240, 240);
      doc.rect(115, 185, 85, 60, 'F');
      
      // Generar código QR para el mantenimiento
      try {
        const qrCodeUrl = generateClientQRCode(selectedMantenimiento.id, 100);
        doc.addImage(qrCodeUrl, 'PNG', 137, 195, 40, 40);
        doc.setFontSize(8);
        doc.text(`Código Mantenimiento: ${selectedMantenimiento.id}`, 157, 240, { align: 'center' });
      } catch (error) {
        console.error('Error al generar código QR:', error);
      }
      
      // Firmas
      doc.setFontSize(10);
      doc.text('_______________________', 40, 260);
      doc.text('Firma del Técnico', 50, 265);
      
      doc.text('_______________________', 140, 260);
      doc.text('Firma del Supervisor', 150, 265);
      
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
      
      // Si estamos en el modal de compartir, guardar el PDF como URL para compartir
      if (showShareModal) {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setPdfGenerated(true);
      } else {
        // Guardar el PDF
        doc.save(`mantenimiento_${selectedMantenimiento.id}.pdf`);
        
        // Cerrar el modal
        setShowPdfModal(false);
      }
      
      // Registrar acción en el log
      logAction('MANTENIMIENTO', 'PDF de mantenimiento generado', {
        id: selectedMantenimiento.id,
        tipoVehiculo: selectedMantenimiento.tipoVehiculo,
        tipoMantenimiento: selectedMantenimiento.tipoMantenimiento
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Manejar compartir
  const handleShareClick = (mantenimiento: MantenimientoType) => {
    setSelectedMantenimiento(mantenimiento);
    setPdfGenerated(false);
    setPdfUrl(null);
    setShowShareModal(true);
    
    // Generar PDF automáticamente al abrir el modal de compartir
    setTimeout(() => {
      if (mantenimiento) {
        handleDownloadPDF();
      }
    }, 100);
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    if (!selectedMantenimiento) return;
    
    // Crear mensaje con formato mejorado
    const mensaje = `*FACTO RENT A CAR - ORDEN DE MANTENIMIENTO*\n\n` +
      `*Orden:* ${selectedMantenimiento.id}\n` +
      `*Vehículo:* ${selectedMantenimiento.tipoVehiculo}\n` +
      `*Tipo:* ${selectedMantenimiento.tipoMantenimiento}\n` +
      `*Período:* ${formatFecha(selectedMantenimiento.fechaInicio)} - ${formatFecha(selectedMantenimiento.fechaFin)}\n` +
      `*Precio:* ₡${selectedMantenimiento.precio ? formatNumber(selectedMantenimiento.precio) : '0,00'}\n\n` +
      `Para más detalles, por favor contacte a Facto Rent a Car al 4070-0485.`;
    
    // Codificar el mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    // Si tenemos un PDF generado, compartir el PDF
    if (pdfGenerated && pdfUrl) {
      // Crear un elemento <a> para descargar el PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `mantenimiento_${selectedMantenimiento.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Luego abrir WhatsApp Web con el mensaje
      window.open(`https://web.whatsapp.com/send?text=${mensajeCodificado}`, '_blank');
    } else {
      // Solo abrir WhatsApp Web con el mensaje
      window.open(`https://web.whatsapp.com/send?text=${mensajeCodificado}`, '_blank');
    }
    
    // Cerrar el modal después de 2 segundos
    setTimeout(() => {
      setShowShareModal(false);
    }, 2000);
  };

  // Enviar por email
  const handleEnviarEmail = () => {
    if (!selectedMantenimiento) return;
    
    // Aquí iría la lógica para enviar el email
    // Por ahora, solo mostramos un mensaje
    alert(`Se enviaría un email con los detalles del mantenimiento ${selectedMantenimiento.id}`);
    
    // Cerrar el modal
    setShowShareModal(false);
  };

  return (
    <div className="container">
      <h1 className="mb-4 text-white">Gestión de Mantenimiento</h1>
      
      {alertMessage && (
        <Alert variant={alertVariant} onClose={() => setAlertMessage(null)} dismissible>
          {alertMessage}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header as="h5">
          {mantenimientoEditar ? 'Editar Mantenimiento' : 'Registrar Mantenimiento'}
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="tipoVehiculo">
                  <Form.Label>Vehículo</Form.Label>
                  <div 
                    className="position-relative"
                    ref={tipoVehiculoRef}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setShowVehiculoDropdown(!showVehiculoDropdown);
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
                            className={`d-flex align-items-center p-2 border-bottom hover-bg-light ${!vehiculo.disponible && !mantenimientoEditar ? 'opacity-50' : ''}`}
                            onClick={() => vehiculo.disponible || mantenimientoEditar ? handleTipoVehiculoChange(vehiculo) : null}
                            style={{ cursor: vehiculo.disponible || mantenimientoEditar ? 'pointer' : 'not-allowed' }}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (vehiculo.disponible || mantenimientoEditar)) {
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
                            <div>
                              <span>{vehiculo.nombre}</span>
                              {!vehiculo.disponible && !mantenimientoEditar && (
                                <div className="text-danger small">En mantenimiento</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="tipoMantenimiento">
                  <Form.Label>Tipo de Mantenimiento</Form.Label>
                  <Form.Select
                    ref={tipoMantenimientoRef}
                    value={tipoMantenimiento}
                    onChange={(e) => setTipoMantenimiento(e.target.value)}
                    required
                    onKeyDown={(e) => handleKeyDown(e, precioRef)}
                  >
                    <option value="">Seleccione un tipo</option>
                    {tiposMantenimiento.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
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
            
            {/* Fechas en formato horizontal */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3" controlId="fechaInicio">
                  <Form.Label>Fecha de Inicio</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      ref={fechaInicioRef}
                      type="date"
                      value={formatDateForInput(fechaInicio)}
                      onChange={handleFechaInicioChange}
                      required
                      onKeyDown={(e) => handleKeyDown(e, horaInicioRef)}
                      className="me-2"
                    />
                    <Form.Control
                      ref={horaInicioRef}
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      required
                      onKeyDown={(e) => handleKeyDown(e, ampmInicioRef)}
                      style={{ width: '100px' }}
                      className="me-2"
                    />
                    <Form.Select
                      ref={ampmInicioRef}
                      value={ampmInicio}
                      onChange={(e) => setAmpmInicio(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, fechaFinRef)}
                      style={{ width: '80px' }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="fechaFin">
                  <Form.Label>Fecha de Fin</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      ref={fechaFinRef}
                      type="date"
                      value={formatDateForInput(fechaFin)}
                      onChange={handleFechaFinChange}
                      min={formatDateForInput(fechaInicio)}
                      required
                      onKeyDown={(e) => handleKeyDown(e, horaFinRef)}
                      className="me-2"
                    />
                    <Form.Control
                      ref={horaFinRef}
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      required
                      onKeyDown={(e) => handleKeyDown(e, ampmFinRef)}
                      style={{ width: '100px' }}
                      className="me-2"
                    />
                    <Form.Select
                      ref={ampmFinRef}
                      value={ampmFin}
                      onChange={(e) => setAmpmFin(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, tipoMantenimientoRef)}
                      style={{ width: '80px' }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="precio">
                  <Form.Label>Precio (₡)</Form.Label>
                  <Form.Control
                    ref={precioRef}
                    type="number"
                    value={precio || ''}
                    onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1000"
                    onKeyDown={(e) => handleKeyDown(e, descripcionRef)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="descripcion">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                ref={descripcionRef}
                as="textarea"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitButtonRef.current?.focus();
                  }
                }}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              {mantenimientoEditar && (
                <Button variant="secondary" onClick={handleCancelarEdicion}>
                  Cancelar
                </Button>
              )}
              <Button 
                ref={submitButtonRef}
                variant="primary" 
                type="submit"
              >
                {mantenimientoEditar ? 'Guardar Cambios' : 'Crear Mantenimiento'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <div>
            Lista de Mantenimientos
            <Badge bg="primary" className="ms-2">{mantenimientos.length}</Badge>
          </div>
        </Card.Header>
        <Card.Body>
          {mantenimientos.length === 0 ? (
            <p className="text-muted">No hay mantenimientos registrados.</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Precio</th>
                  <th>Descripción</th>
                   <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientos.map((mantenimiento) => (
                  <tr key={mantenimiento.id}>
                    <td>{mantenimiento.tipoVehiculo}</td>
                    <td>{mantenimiento.tipoMantenimiento}</td>
                    <td>{formatFecha(mantenimiento.fechaInicio)}</td>
                    <td>{formatFecha(mantenimiento.fechaFin)}</td>
                    <td>₡{mantenimiento.precio ? formatNumber(mantenimiento.precio) : '0,00'}</td>
                    <td>{mantenimiento.descripcion}</td>
                    <td>{getEstadoBadge(mantenimiento.estado)}</td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={mantenimiento.estado}
                        onChange={(e) => handleCambiarEstado(mantenimiento.id, e.target.value as MantenimientoType['estado'])}
                        className="mb-2"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="completado">Completado</option>
                      </Form.Select>
                      
                      <Dropdown>
                        <Dropdown.Toggle variant="primary" size="sm" id={`dropdown-${mantenimiento.id}`} className="w-100">
                          Acciones
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleEditarMantenimiento(mantenimiento)}>
                            <i className="bi bi-pencil me-2"></i> Editar
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleShareClick(mantenimiento)}>
                            <i className="bi bi-share me-2"></i> Compartir
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleGenerarPDF(mantenimiento)}>
                            <i className="bi bi-file-pdf me-2"></i> Descargar PDF
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => handleEliminarMantenimiento(mantenimiento.id)}
                            className="text-danger"
                          >
                            <i className="bi bi-trash me-2"></i> Eliminar
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal para descargar PDF */}
      <Modal show={showPdfModal} onHide={() => setShowPdfModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Descargar PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMantenimiento && (
            <div className="mb-4">
              <div className="border p-3 rounded bg-light">
                <h5 className="mb-3" style={{ color: '#333333' }}>Resumen del Mantenimiento</h5>
                <div className="text-dark" style={{ color: '#333333' }}>
                  <p><strong>Vehículo:</strong> {selectedMantenimiento.tipoVehiculo}</p>
                  <p><strong>Tipo:</strong> {selectedMantenimiento.tipoMantenimiento}</p>
                  <p>
                    <strong>Período:</strong>{' '}
                    {formatFecha(selectedMantenimiento.fechaInicio)} - {formatFecha(selectedMantenimiento.fechaFin)}
                  </p>
                  <p><strong>Precio:</strong> ₡{selectedMantenimiento.precio ? formatNumber(selectedMantenimiento.precio) : '0,00'}</p>
                </div>
              </div>
            </div>
          )}
          <div className="text-center">
            <p>Haga clic en el botón para descargar el PDF del mantenimiento.</p>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleDownloadPDF}
              className="mt-3"
            >
              Descargar PDF
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal para compartir */}
      <Modal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Compartir Orden de Mantenimiento</Modal.Title>
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
          {selectedMantenimiento && (
            <>
              <div className="mb-4">
                <div className="d-inline-block p-3 bg-success text-white rounded-circle mb-3">
                  <i className="bi bi-check-lg" style={{ fontSize: '3rem' }}></i>
                </div>
                <h4>¡Mantenimiento creado con éxito!</h4>
                <p className="text-muted">
                  La orden de mantenimiento ha sido creada y se está descargando el PDF automáticamente.
                </p>
              </div>

              <div className="border rounded p-3 mb-4 bg-light">
                <h5 className="mb-3">Detalles del Mantenimiento</h5>
                <p><strong>Vehículo:</strong> {selectedMantenimiento.tipoVehiculo}</p>
                <p><strong>Tipo:</strong> {selectedMantenimiento.tipoMantenimiento}</p>
                <p><strong>Período:</strong> {formatFecha(selectedMantenimiento.fechaInicio)} - {formatFecha(selectedMantenimiento.fechaFin)}</p>
                <p><strong>Precio:</strong> ₡{selectedMantenimiento.precio ? formatNumber(selectedMantenimiento.precio) : '0,00'}</p>
              </div>
              
              <h6 className="mb-3">Opciones para compartir</h6>
              
              <div className="d-grid gap-3 mt-4">
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={handleShareWhatsApp}
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="bi bi-whatsapp me-2" style={{ fontSize: '1.5rem' }}></i>
                  {pdfGenerated ? 'Compartir PDF por WhatsApp' : 'Compartir por WhatsApp'}
                </Button>
                
                <Button 
                  variant="info" 
                  size="lg" 
                  onClick={handleEnviarEmail}
                  className="d-flex align-items-center justify-content-center text-white"
                >
                  <i className="bi bi-envelope me-2" style={{ fontSize: '1.5rem' }}></i>
                  Enviar por Email
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}