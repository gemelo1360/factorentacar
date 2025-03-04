import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Alert, Badge, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Cliente, OrdenMantenimiento } from '../types';
import { isReservasCalendarEnabled } from '../utils/featureFlags';

// Lista de vehículos disponibles con imágenes
const tiposVehiculos = [
  {
    nombre: "Nissan Frontier NB",
    imagen: "https://factorentacar.com/carros/frontier.png",
    icono: "🚙",
    modelo: "Frontier"
  },
  {
    nombre: "Toyota Rush Café",
    imagen: "https://factorentacar.com/carros/rushcafe.png",
    icono: "🚗",
    modelo: "Rush Café"
  },
  {
    nombre: "Toyota Rush Silver",
    imagen: "https://factorentacar.com/carros/rsilver.png",
    icono: "🚗",
    modelo: "Rush Silver"
  },
  {
    nombre: "Toyota Yaris",
    imagen: "https://factorentacar.com/carros/yaris.png",
    icono: "🚘",
    modelo: "Yaris"
  },
  {
    nombre: "Hyundai Tucson",
    imagen: "https://factorentacar.com/carros/tucson.png",
    icono: "🚙",
    modelo: "Tucson"
  },
  {
    nombre: "Hyundai Elantra Blanco",
    imagen: "https://factorentacar.com/carros/elantrab.png",
    icono: "🚗",
    modelo: "Elantra Blanco"
  },
  {
    nombre: "Hyundai Elantra Gris",
    imagen: "https://factorentacar.com/carros/elantrap.png",
    icono: "🚗",
    modelo: "Elantra Gris"
  },
  {
    nombre: "Hyundai Starex",
    imagen: "https://factorentacar.com/carros/starex.png",
    icono: "🚐",
    modelo: "Starex"
  },
  {
    nombre: "Chevrolet Beat",
    imagen: "https://factorentacar.com/carros/beat.png",
    icono: "🚘",
    modelo: "Beat"
  }
];

interface ReservasProps {
  ordenes: OrdenMantenimiento[];
  clientes: Cliente[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  reservas: {
    orden: OrdenMantenimiento;
    cliente: Cliente | null;
    vehiculo: typeof tiposVehiculos[0] | null;
  }[];
}

export default function Reservas({ ordenes, clientes }: ReservasProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [filtroVehiculo, setFiltroVehiculo] = useState<string>('');
  const [calendarEnabled, setCalendarEnabled] = useState<boolean>(isReservasCalendarEnabled());
  const [ordenesVisibles, setOrdenesVisibles] = useState<OrdenMantenimiento[]>([]);

  // Generar días del calendario cuando cambia el mes o las órdenes
  useEffect(() => {
    if (calendarEnabled) {
      const days = generateCalendarDays(currentDate, ordenes, clientes);
      setCalendarDays(days);
    }
    
    // Filtrar órdenes para la vista de lista
    const ordenesDelMes = filtrarOrdenesPorMes(ordenes, currentDate);
    const ordenesFiltradas = filtroVehiculo 
      ? ordenesDelMes.filter(orden => orden.tipoVehiculo === filtroVehiculo)
      : ordenesDelMes;
    setOrdenesVisibles(ordenesFiltradas);
  }, [currentDate, ordenes, clientes, filtroVehiculo, calendarEnabled]);

  // Filtrar órdenes por mes
  const filtrarOrdenesPorMes = (ordenes: OrdenMantenimiento[], fecha: Date): OrdenMantenimiento[] => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    
    return ordenes.filter(orden => {
      if (!orden.fechaInicio || !orden.fechaFin) return false;
      
      const fechaInicio = new Date(orden.fechaInicio);
      const fechaFin = new Date(orden.fechaFin);
      
      // Verificar si el rango de fechas de la orden se solapa con el mes actual
      const inicioMes = new Date(año, mes, 1);
      const finMes = new Date(año, mes + 1, 0);
      
      return (
        (fechaInicio <= finMes && fechaFin >= inicioMes) || // Se solapa con el mes
        (fechaInicio.getMonth() === mes && fechaInicio.getFullYear() === año) || // Inicia en el mes
        (fechaFin.getMonth() === mes && fechaFin.getFullYear() === año) // Termina en el mes
      );
    });
  };

  // Generar los días del calendario para el mes actual
  const generateCalendarDays = (date: Date, ordenes: OrdenMantenimiento[], clientes: Cliente[]): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Primer día del mes
    const firstDayOfMonth = new Date(year, month, 1);
    // Último día del mes
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calcular el primer día a mostrar (puede ser del mes anterior)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    // Calcular el último día a mostrar (puede ser del mes siguiente)
    const endDate = new Date(lastDayOfMonth);
    const daysToAdd = 6 - lastDayOfMonth.getDay();
    endDate.setDate(endDate.getDate() + daysToAdd);
    
    // Generar array de días
    const days: CalendarDay[] = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= endDate) {
      const isCurrentMonth = currentDay.getMonth() === month;
      
      // Filtrar órdenes para este día
      const reservasDelDia = ordenes.filter(orden => {
        if (!orden.fechaInicio || !orden.fechaFin) return false;
        
        // Filtrar por vehículo si hay filtro
        if (filtroVehiculo && orden.tipoVehiculo !== filtroVehiculo) return false;
        
        const fechaInicio = new Date(orden.fechaInicio);
        const fechaFin = new Date(orden.fechaFin);
        
        // Verificar si el día actual está dentro del rango de la reserva
        const currentDayTime = new Date(currentDay).setHours(0, 0, 0, 0);
        const fechaInicioTime = new Date(fechaInicio).setHours(0, 0, 0, 0);
        const fechaFinTime = new Date(fechaFin).setHours(0, 0, 0, 0);
        
        return currentDayTime >= fechaInicioTime && currentDayTime <= fechaFinTime;
      }).map(orden => {
        const cliente = clientes.find(c => c.id === orden.clienteId) || null;
        const vehiculo = orden.tipoVehiculo 
          ? tiposVehiculos.find(v => v.nombre === orden.tipoVehiculo) || null 
          : null;
        
        return { orden, cliente, vehiculo };
      });
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth,
        reservas: reservasDelDia
      });
      
      // Avanzar al siguiente día
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Cambiar al mes anterior
  const prevMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
    setSelectedDay(null);
  };

  // Cambiar al mes siguiente
  const nextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setSelectedDay(null);
  };

  // Ir al mes actual
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  // Formatear fecha para mostrar
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatear hora para mostrar
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Obtener nombre del mes y año
  const getMonthYearString = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Manejar clic en un día
  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
  };

  // Obtener color de estado
  const getEstadoColor = (estado: OrdenMantenimiento['estado']): string => {
    const colorMap = {
      pendiente: 'warning',
      en_proceso: 'info',
      completado: 'success'
    };
    
    return colorMap[estado];
  };

  // Obtener nombre de estado
  const getEstadoNombre = (estado: OrdenMantenimiento['estado']): string => {
    const nombreMap = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado'
    };
    
    return nombreMap[estado];
  };

  // Obtener el modelo del vehículo con detalles adicionales cuando sea necesario
  const getModeloVehiculo = (vehiculoCompleto: string | undefined): string => {
    if (!vehiculoCompleto) return 'Vehículo';
    
    const vehiculo = tiposVehiculos.find(v => v.nombre === vehiculoCompleto);
    return vehiculo ? vehiculo.modelo : vehiculoCompleto.split(' ').pop() || 'Vehículo';
  };

  // Generar ID para la orden con el formato vehiculo-fechaInicio-fechaFin
  const generarOrdenId = (orden: OrdenMantenimiento): string => {
    if (orden.id && orden.id.includes('-')) {
      // Si ya tiene formato vehiculo-fechaInicio-fechaFin, devolverlo
      return orden.id;
    }
    
    // Si no tiene el formato correcto, generarlo
    const vehiculoAbrev = orden.tipoVehiculo ? orden.tipoVehiculo.split(' ')[0].toLowerCase() : 'alquiler';
    const fechaInicioStr = orden.fechaInicio ? formatFechaParaId(orden.fechaInicio) : formatFechaParaId(new Date());
    const fechaFinStr = orden.fechaFin ? formatFechaParaId(orden.fechaFin) : formatFechaParaId(new Date());
    return `${vehiculoAbrev}-${fechaInicioStr}-${fechaFinStr}`;
  };

  // Formatear fecha para el ID de la orden
  const formatFechaParaId = (fecha: Date): string => {
    return fecha.toISOString().split('T')[0].replace(/-/g, '');
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Calendario de Reservas</Card.Header>
      <Card.Body>
        {!calendarEnabled && (
          <Alert variant="warning" className="mb-3">
            <strong>Calendario deshabilitado</strong>
            <p className="mb-0">El calendario visual está deshabilitado. Puede habilitarlo en la sección de Configuración General.</p>
          </Alert>
        )}
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Button variant="outline-primary" onClick={prevMonth} className="me-2">
              &lt; Anterior
            </Button>
            <Button variant="outline-primary" onClick={nextMonth}>
              Siguiente &gt;
            </Button>
            <Button variant="outline-secondary" onClick={goToToday} className="ms-2">
              Hoy
            </Button>
          </div>
          <h4 className="mb-0 text-capitalize">{getMonthYearString(currentDate)}</h4>
          <Form.Group controlId="filtroVehiculo" style={{ width: '250px' }}>
            <Form.Select
              value={filtroVehiculo}
              onChange={(e) => setFiltroVehiculo(e.target.value)}
              className="form-select-sm"
            >
              <option value="">Todos los vehículos</option>
              {tiposVehiculos.map((vehiculo) => (
                <option key={vehiculo.nombre} value={vehiculo.nombre}>
                  {vehiculo.icono} {vehiculo.modelo}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
        
        {calendarEnabled ? (
          <div className="calendar">
            {/* Días de la semana */}
            <Row className="mb-2">
              {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, index) => (
                <Col key={index} className="text-center fw-bold">
                  {day}
                </Col>
              ))}
            </Row>
            
            {/* Días del calendario */}
            <div className="calendar-grid">
              {calendarDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`calendar-day ${day.isCurrentMonth ? '' : 'text-muted'} ${
                    selectedDay && day.date.getTime() === selectedDay.date.getTime() ? 'selected' : ''
                  } ${day.reservas.length > 0 ? 'has-reservas' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="day-number">{day.date.getDate()}</div>
                  <div className="reservas-container">
                    {day.reservas.slice(0, 3).map((reserva, i) => (
                      <OverlayTrigger
                        key={i}
                        placement="top"
                        overlay={
                          <Tooltip id={`tooltip-${index}-${i}`}>
                            <div className="text-start">
                              <strong>ID:</strong> {generarOrdenId(reserva.orden)}<br />
                              <strong>Cliente:</strong> {reserva.cliente?.nombre || 'No especificado'}<br />
                              <strong>Vehículo:</strong> {reserva.vehiculo?.nombre || 'No especificado'}<br />
                              <strong>Estado:</strong> {getEstadoNombre(reserva.orden.estado)}
                            </div>
                          </Tooltip>
                        }
                      >
                        <div className="reserva-item">
                          {reserva.vehiculo?.icono || '🚗'} {getModeloVehiculo(reserva.vehiculo?.nombre)}
                        </div>
                      </OverlayTrigger>
                    ))}
                    {day.reservas.length > 3 && (
                      <div className="more-reservas">+{day.reservas.length - 3} más</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <h5 className="mb-3">Reservas del Mes</h5>
            {ordenesVisibles.length === 0 ? (
              <Alert variant="info">No hay reservas para este mes.</Alert>
            ) : (
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Vehículo</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesVisibles.map(orden => {
                    const cliente = clientes.find(c => c.id === orden.clienteId);
                    return (
                      <tr key={orden.id}>
                        <td>{generarOrdenId(orden)}</td>
                        <td>{cliente?.nombre || 'Cliente no encontrado'}</td>
                        <td>{orden.tipoVehiculo || 'No especificado'}</td>
                        <td>{orden.fechaInicio ? formatDate(orden.fechaInicio) : 'N/A'}</td>
                        <td>{orden.fechaFin ? formatDate(orden.fechaFin) : 'N/A'}</td>
                        <td>₡{orden.montoTotal?.toLocaleString('es-CR') || 'N/A'}</td>
                        <td>
                          <Badge bg={getEstadoColor(orden.estado)}>
                            {getEstadoNombre(orden.estado)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
        
        {/* Detalles del día seleccionado */}
        {calendarEnabled && selectedDay && (
          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Reservas para el {formatDate(selectedDay.date)}</h5>
            </Card.Header>
            <Card.Body>
              {selectedDay.reservas.length === 0 ? (
                <Alert variant="info">No hay reservas para este día.</Alert>
              ) : (
                <div className="reservas-list">
                  {selectedDay.reservas.map((reserva, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="me-2">{reserva.vehiculo?.icono || '🚗'}</span>
                          <strong>{getModeloVehiculo(reserva.vehiculo?.nombre)}</strong>
                        </div>
                        <Badge bg={getEstadoColor(reserva.orden.estado)}>
                          {getEstadoNombre(reserva.orden.estado)}
                        </Badge>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <p><strong>Cliente:</strong> {reserva.cliente?.nombre || 'Cliente no encontrado'}</p>
                            <p><strong>Teléfono:</strong> {reserva.cliente?.telefono || 'N/A'}</p>
                            <p><strong>Email:</strong> {reserva.cliente?.email || 'N/A'}</p>
                            <p><strong>ID Orden:</strong> {generarOrdenId(reserva.orden)}</p>
                          </Col>
                          <Col md={6}>
                            <p>
                              <strong>Período:</strong> {reserva.orden.fechaInicio && formatDate(reserva.orden.fechaInicio)} {reserva.orden.fechaInicio && formatTime(reserva.orden.fechaInicio)} - 
                              {reserva.orden.fechaFin && formatDate(reserva.orden.fechaFin)} {reserva.orden.fechaFin && formatTime(reserva.orden.fechaFin)}
                            </p>
                            <p><strong>Monto Total:</strong> ₡{reserva.orden.montoTotal?.toLocaleString('es-CR') || 'N/A'}</p>
                            <p><strong>Descripción:</strong> {reserva.orden.descripcion}</p>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </Card.Body>
      <style>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
        }
        
        .calendar-day {
          min-height: 100px;
          border: 1px solid #ddd;
          padding: 5px;
          cursor: pointer;
          position: relative;
          background-color: #fff;
        }
        
        .calendar-day:hover {
          background-color: #f8f9fa;
        }
        
        .calendar-day.selected {
          background-color: #e9f5ff;
          border-color: #007bff;
        }
        
        .calendar-day.text-muted {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        
        .calendar-day.has-reservas {
          background-color: #f0f8ff;
        }
        
        .day-number {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .reservas-container {
          font-size: 0.8rem;
        }
        
        .reserva-item {
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 2px 4px;
          background-color: #e9ecef;
          border-radius: 3px;
        }
        
        .more-reservas {
          font-size: 0.7rem;
          color: #6c757d;
          text-align: center;
          margin-top: 2px;
        }
        
        .reservas-list {
          max-height: 500px;
          overflow-y: auto;
        }
      `}</style>
    </Card>
  );
}