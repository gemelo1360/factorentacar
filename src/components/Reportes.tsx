import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Form, Alert, Table, Badge, InputGroup, Dropdown } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Cliente, OrdenMantenimiento } from '../types';

// Lista de vehículos disponibles
const tiposVehiculos = [
  "Nissan Frontier NB",
  "Toyota Rush Café",
  "Toyota Rush Silver",
  "Toyota Yaris",
  "Hyundai Tucson",
  "Hyundai Elantra Blanco",
  "Hyundai Elantra Gris",
  "Hyundai Starex",
  "Chevrolet Beat"
];

interface ReportesProps {
  ordenes: OrdenMantenimiento[];
  clientes: Cliente[];
}

export default function Reportes({ ordenes, clientes }: ReportesProps) {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<'success' | 'danger'>('success');
  const [filtroCedula, setFiltroCedula] = useState<string>('');
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  const [filtroVehiculo, setFiltroVehiculo] = useState<string>('');
  const [ordenesVisibles, setOrdenesVisibles] = useState<OrdenMantenimiento[]>([]);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState<boolean>(true);
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [vehiculosEnOrdenes, setVehiculosEnOrdenes] = useState<string[]>([]);
  const [showVehiculoDropdown, setShowVehiculoDropdown] = useState<boolean>(false);

  // Establecer fechas por defecto (del 1 del mes anterior al día actual)
  useEffect(() => {
    const hoy = new Date();
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    setFechaInicio(mesAnterior.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  }, []);

  // Obtener lista de vehículos únicos de las órdenes
  useEffect(() => {
    const vehiculosUnicos = Array.from(
      new Set(
        ordenes
          .filter(orden => orden.tipoVehiculo)
          .map(orden => orden.tipoVehiculo as string)
      )
    ).sort();
    
    // Asegurarse de que todos los vehículos predefinidos estén en la lista
    const todosLosVehiculos = Array.from(
      new Set([...vehiculosUnicos, ...tiposVehiculos])
    ).sort();
    
    setVehiculosEnOrdenes(todosLosVehiculos);
  }, [ordenes]);

  // Actualizar órdenes visibles cuando cambian los filtros
  useEffect(() => {
    const ordenesEnRango = filtrarOrdenesPorFecha();
    const ordenesFiltradasPorCliente = filtrarOrdenesPorCliente(ordenesEnRango);
    const ordenesFiltradasPorVehiculo = filtrarOrdenesPorVehiculo(ordenesFiltradasPorCliente);
    setOrdenesVisibles(ordenesFiltradasPorVehiculo);
  }, [fechaInicio, fechaFin, filtroCliente, filtroVehiculo, ordenes]);

  // Buscar cliente por cédula cuando cambia filtroCedula
  useEffect(() => {
    if (filtroCedula.length >= 9) {
      const cliente = clientes.find(c => c.cedula === filtroCedula);
      if (cliente) {
        setClienteEncontrado(cliente);
        setFiltroCliente(cliente.nombre);
      } else {
        setClienteEncontrado(null);
        // No limpiamos filtroCliente para permitir búsqueda manual
      }
    } else {
      setClienteEncontrado(null);
    }
  }, [filtroCedula, clientes]);

  // Formatear número con separadores de miles y decimales
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Obtener el nombre del cliente por ID
  const getClienteNombre = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Cliente desconocido';
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

  // Filtrar órdenes por rango de fechas
  const filtrarOrdenesPorFecha = () => {
    if (!fechaInicio || !fechaFin) {
      return ordenes;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59); // Incluir todo el día final

    return ordenes.filter(orden => {
      const fechaCreacion = new Date(orden.fechaCreacion);
      return fechaCreacion >= inicio && fechaCreacion <= fin;
    });
  };

  // Filtrar órdenes por cliente
  const filtrarOrdenesPorCliente = (ordenesAFiltrar: OrdenMantenimiento[]) => {
    if (!filtroCliente) {
      return ordenesAFiltrar;
    }

    return ordenesAFiltrar.filter(orden => {
      const cliente = clientes.find(c => c.id === orden.clienteId);
      if (!cliente) return false;
      
      return cliente.nombre.toLowerCase().includes(filtroCliente.toLowerCase()) ||
             cliente.cedula.toLowerCase().includes(filtroCliente.toLowerCase());
    });
  };

  // Filtrar órdenes por vehículo
  const filtrarOrdenesPorVehiculo = (ordenesAFiltrar: OrdenMantenimiento[]) => {
    if (!filtroVehiculo) {
      return ordenesAFiltrar;
    }

    return ordenesAFiltrar.filter(orden => {
      if (!orden.tipoVehiculo) return false;
      return orden.tipoVehiculo === filtroVehiculo;
    });
  };

  // Generar reporte en PDF
  const generarReportePDF = () => {
    if (ordenesVisibles.length === 0) {
      setMensaje('No hay datos para generar el reporte con los filtros seleccionados');
      setTipoMensaje('danger');
      return;
    }

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
    doc.text('REPORTE DE ALQUILERES', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('FACTO RENT A CAR', 105, 30, { align: 'center' });
    
    // Resetear color de texto
    doc.setTextColor(0, 0, 0);
    
    // Información del reporte
    doc.setFontSize(12);
    doc.text(`Periodo: ${new Date(fechaInicio).toLocaleDateString()} al ${new Date(fechaFin).toLocaleDateString()}`, 14, 50);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString('es-CR', { hour12: true })}`, 14, 58);
    doc.text(`Total de alquileres: ${ordenesVisibles.length}`, 14, 66);
    
    // Información de filtros
    if (clienteEncontrado) {
      doc.text(`Cliente: ${clienteEncontrado.nombre} (${clienteEncontrado.cedula})`, 14, 74);
    } else if (filtroCliente) {
      doc.text(`Filtro de cliente: ${filtroCliente}`, 14, 74);
    }
    if (filtroVehiculo) {
      doc.text(`Filtro de vehículo: ${filtroVehiculo}`, (clienteEncontrado || filtroCliente) ? 105 : 14, (clienteEncontrado || filtroCliente) ? 74 : 74);
    }
    
    // Calcular monto total
    const montoTotal = ordenesVisibles.reduce((total, orden) => total + (orden.montoTotal || 0), 0);
    doc.text(`Monto total: ₡${formatNumber(montoTotal)}`, 14, (clienteEncontrado || filtroCliente || filtroVehiculo) ? 82 : 74);
    
    // Tabla de alquileres
    const tableColumn = ["ID", "Cliente", "Vehículo", "Fecha Inicio", "Fecha Fin", "Monto Total", "Estado"];
    const tableRows = ordenesVisibles.map(orden => [
      generarOrdenId(orden),
      getClienteNombre(orden.clienteId),
      orden.tipoVehiculo || 'No especificado',
      orden.fechaInicio ? formatFecha(orden.fechaInicio).split(',')[0] : 'N/A',
      orden.fechaFin ? formatFecha(orden.fechaFin).split(',')[0] : 'N/A',
      orden.montoTotal ? `₡${formatNumber(orden.montoTotal)}` : 'N/A',
      mapEstado(orden.estado)
    ]);
    
    // Agregar tabla al PDF
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: (clienteEncontrado || filtroCliente || filtroVehiculo) ? 90 : 80,
      theme: 'striped',
      headStyles: { fillColor: [9, 38, 66], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 80 }
    });
    
    // Pie de página
    const finalY = (doc as any).lastAutoTable.finalY || 250;
    
    doc.setFillColor(9, 38, 66); // #092642
    doc.rect(0, 270, 210, 27, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Facto Rent a Car', 105, 280, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Tel: 4070-0485 | www.factorentacar.com', 105, 285, { align: 'center' });
    doc.text('San Ramón, Alajuela, Costa Rica', 105, 290, { align: 'center' });
    
    // Guardar el PDF
    const nombreArchivo = `reporte_alquileres_${fechaInicio}_${fechaFin}${clienteEncontrado ? '_cliente_' + clienteEncontrado.cedula : filtroCliente ? '_cliente_' + filtroCliente.replace(/\s+/g, '_') : ''}${filtroVehiculo ? '_vehiculo_' + filtroVehiculo.replace(/\s+/g, '_') : ''}.pdf`;
    doc.save(nombreArchivo);
    
    setMensaje('Reporte PDF generado exitosamente');
    setTipoMensaje('success');
  };

  // Generar reporte en Excel
  const generarReporteExcel = () => {
    if (ordenesVisibles.length === 0) {
      setMensaje('No hay datos para generar el reporte con los filtros seleccionados');
      setTipoMensaje('danger');
      return;
    }
    
    // Crear datos para Excel
    const headers = ['ID', 'Cliente', 'Vehículo', 'Descripción', 'Fecha Creación', 'Fecha Inicio', 'Fecha Fin', 'Monto por Día', 'Monto Total', 'Estado'];
    
    let csvContent = headers.join(',') + '\n';
    
    ordenesVisibles.forEach(orden => {
      const row = [
        `"${generarOrdenId(orden)}"`,
        `"${getClienteNombre(orden.clienteId)}"`,
        `"${orden.tipoVehiculo || 'No especificado'}"`,
        `"${orden.descripcion.replace(/"/g, '""')}"`,
        `"${formatFecha(orden.fechaCreacion).split(',')[0]}"`,
        `"${orden.fechaInicio ? formatFecha(orden.fechaInicio).split(',')[0] : 'N/A'}"`,
        `"${orden.fechaFin ? formatFecha(orden.fechaFin).split(',')[0] : 'N/A'}"`,
        `"₡${orden.montoPorDia ? formatNumber(orden.montoPorDia) : '0,00'}"`,
        `"₡${orden.montoTotal ? formatNumber(orden.montoTotal) : '0,00'}"`,
        `"${mapEstado(orden.estado)}"`
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    // Crear un blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const nombreArchivo = `reporte_alquileres_${fechaInicio}_${fechaFin}${clienteEncontrado ? '_cliente_' + clienteEncontrado.cedula : filtroCliente ? '_cliente_' + filtroCliente.replace(/\s+/g, '_') : ''}${filtroVehiculo ? '_vehiculo_' + filtroVehiculo.replace(/\s+/g, '_') : ''}.csv`;
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMensaje('Reporte Excel generado exitosamente');
    setTipoMensaje('success');
  };

  // Mapear estado a texto
  const mapEstado = (estado: OrdenMantenimiento['estado']): string => {
    const estadoMap = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado'
    };
    return estadoMap[estado];
  };

  // Obtener badge para el estado
  const getEstadoBadge = (estado: OrdenMantenimiento['estado']) => {
    const badgeMap = {
      pendiente: 'warning',
      en_proceso: 'info',
      completado: 'success'
    };
    
    return <Badge bg={badgeMap[estado]}>{mapEstado(estado)}</Badge>;
  };

  // Formatear fecha para el ID de la orden
  const formatFechaParaId = (fecha: Date): string => {
    return fecha.toISOString().split('T')[0].replace(/-/g, '');
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

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroCedula('');
    setFiltroCliente('');
    setFiltroVehiculo('');
    setClienteEncontrado(null);
    
    const hoy = new Date();
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    setFechaInicio(mesAnterior.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
    
    setMensaje('Filtros limpiados');
    setTipoMensaje('success');
    setTimeout(() => setMensaje(null), 3000);
  };

  // Manejar cambio de cédula
  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cedula = e.target.value;
    setFiltroCedula(cedula);
    
    // Si se borra la cédula, limpiar el filtro de cliente
    if (!cedula) {
      setFiltroCliente('');
      setClienteEncontrado(null);
    }
  };

  // Manejar selección de vehículo
  const handleVehiculoSelect = (vehiculo: string) => {
    setFiltroVehiculo(vehiculo);
    setShowVehiculoDropdown(false);
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Reportes</Card.Header>
      <Card.Body>
        {mensaje && (
          <Alert variant={tipoMensaje} onClose={() => setMensaje(null)} dismissible>
            {mensaje}
          </Alert>
        )}
        
        <Form>
          <Row className="mb-4">
            <Col md={3}>
              <Form.Group controlId="fechaInicio">
                <Form.Label>Fecha de Inicio</Form.Label>
                <Form.Control
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="fechaFin">
                <Form.Label>Fecha de Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  min={fechaInicio}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="filtroCedula">
                <Form.Label>Buscar por Cédula</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingrese la cédula"
                  value={filtroCedula}
                  onChange={handleCedulaChange}
                />
                {clienteEncontrado && (
                  <Form.Text className="text-success">
                    Cliente encontrado: {clienteEncontrado.nombre}
                  </Form.Text>
                )}
                {filtroCedula.length >= 9 && !clienteEncontrado && (
                  <Form.Text className="text-danger">
                    No se encontró cliente con esta cédula
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="filtroCliente">
                <Form.Label>Filtrar por Cliente</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre del cliente"
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={3}>
              <Form.Group controlId="filtroVehiculo">
                <Form.Label>Filtrar por Vehículo</Form.Label>
                <div className="position-relative">
                  <div 
                    className="form-control d-flex align-items-center justify-content-between"
                    onClick={() => setShowVehiculoDropdown(!showVehiculoDropdown)}
                    style={{ cursor: 'pointer' }}
                  >
                    {filtroVehiculo ? (
                      <span>{filtroVehiculo}</span>
                    ) : (
                      <span className="text-muted">Seleccione un vehículo</span>
                    )}
                    <span>▼</span>
                  </div>
                  
                  {showVehiculoDropdown && (
                    <div 
                      className="position-absolute w-100 bg-white border rounded shadow-sm"
                      style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}
                    >
                      <div 
                        className="p-2 border-bottom text-primary"
                        onClick={() => {
                          setFiltroVehiculo('');
                          setShowVehiculoDropdown(false);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <strong>Mostrar todos</strong>
                      </div>
                      {vehiculosEnOrdenes.map((vehiculo) => (
                        <div 
                          key={vehiculo}
                          className={`p-2 border-bottom ${filtroVehiculo === vehiculo ? 'bg-light' : ''}`}
                          onClick={() => handleVehiculoSelect(vehiculo)}
                          style={{ cursor: 'pointer' }}
                        >
                          {vehiculo}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Form.Group>
            </Col>
            <Col md={9} className="d-flex align-items-end">
              <div className="d-flex gap-2 w-100 justify-content-between">
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    onClick={generarReportePDF}
                    disabled={ordenesVisibles.length === 0}
                  >
                    Generar PDF
                  </Button>
                  <Button 
                    variant="success" 
                    onClick={generarReporteExcel}
                    disabled={ordenesVisibles.length === 0}
                  >
                    Generar Excel
                  </Button>
                </div>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-secondary" 
                    onClick={limpiarFiltros}
                  >
                    Limpiar Filtros
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)}
                  >
                    {mostrarVistaPrevia ? 'Ocultar Vista Previa' : 'Mostrar Vista Previa'}
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
          
          {/* Resumen de resultados */}
          <Card className="mb-4 bg-light">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <h6>Total de Alquileres:</h6>
                  <h3>{ordenesVisibles.length}</h3>
                </Col>
                <Col md={4}>
                  <h6>Monto Total:</h6>
                  <h3>₡{formatNumber(ordenesVisibles.reduce((total, orden) => total + (orden.montoTotal || 0), 0))}</h3>
                </Col>
                <Col md={4}>
                  <h6>Filtros Aplicados:</h6>
                  <p className="mb-0">
                    {clienteEncontrado && (
                      <Badge bg="success" className="me-1">Cliente: {clienteEncontrado.nombre} ({clienteEncontrado.cedula})</Badge>
                    )}
                    {!clienteEncontrado && filtroCliente && (
                      <Badge bg="info" className="me-1">Cliente: {filtroCliente}</Badge>
                    )}
                    {filtroVehiculo && <Badge bg="info" className="me-1">Vehículo: {filtroVehiculo}</Badge>}
                    {!clienteEncontrado && !filtroCliente && !filtroVehiculo && <span className="text-muted">Ninguno</span>}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {/* Vista previa de resultados */}
          {mostrarVistaPrevia && (
            <div className="mb-4">
              <h6 className="mb-3">Vista Previa de Resultados</h6>
              {ordenesVisibles.length === 0 ? (
                <Alert variant="info">
                  No hay alquileres que coincidan con los criterios de búsqueda.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Vehículo</th>
                      <th>Periodo</th>
                      <th>Monto Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesVisibles.map((orden) => (
                      <tr key={orden.id}>
                        <td>{generarOrdenId(orden)}</td>
                        <td>{getClienteNombre(orden.clienteId)}</td>
                        <td>{orden.tipoVehiculo || 'No especificado'}</td>
                        <td>
                          {orden.fechaInicio && orden.fechaFin ? (
                            `${formatFecha(orden.fechaInicio).split(',')[0]} - ${formatFecha(orden.fechaFin).split(',')[0]}`
                          ) : (
                            'No especificado'
                          )}
                        </td>
                        <td>₡{orden.montoTotal ? formatNumber(orden.montoTotal) : '0,00'}</td>
                        <td>{getEstadoBadge(orden.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
          
          <hr className="my-4" />
          
          <h6 className="mb-3">Reportes Predefinidos</h6>
          <div className="d-flex flex-wrap gap-2">
            <Button 
              variant="outline-primary"
              onClick={() => {
                const hoy = new Date();
                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                setFechaInicio(inicioMes.toISOString().split('T')[0]);
                setFechaFin(hoy.toISOString().split('T')[0]);
                setTimeout(() => generarReportePDF(), 100);
              }}
            >
              Reporte Mes Actual
            </Button>
            <Button 
              variant="outline-primary"
              onClick={() => {
                const hoy = new Date();
                const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
                setFechaInicio(inicioAnio.toISOString().split('T')[0]);
                setFechaFin(hoy.toISOString().split('T')[0]);
                setTimeout(() => generarReportePDF(), 100);
              }}
            >
              Reporte Anual
            </Button>
            <Button 
              variant="outline-primary"
              onClick={() => {
                const hoy = new Date();
                const ayer = new Date(hoy);
                ayer.setDate(hoy.getDate() - 1);
                setFechaInicio(ayer.toISOString().split('T')[0]);
                setFechaFin(ayer.toISOString().split('T')[0]);
                setTimeout(() => generarReportePDF(), 100);
              }}
            >
              Reporte de Ayer
            </Button>
            <Button 
              variant="outline-primary"
              onClick={() => {
                const hoy = new Date();
                const inicioSemana = new Date(hoy);
                inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                setFechaInicio(inicioSemana.toISOString().split('T')[0]);
                setFechaFin(hoy.toISOString().split('T')[0]);
                setTimeout(() => generarReportePDF(), 100);
              }}
            >
              Reporte Semana Actual
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}