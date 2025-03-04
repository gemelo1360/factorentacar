import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Alert } from 'react-bootstrap';
import { OrdenMantenimiento } from '../types';
import { logAction } from '../utils/logService';

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

interface EstadisticasProps {
  ordenes: OrdenMantenimiento[];
}

export default function Estadisticas({ ordenes }: EstadisticasProps) {
  const [año, setAño] = useState<number>(new Date().getFullYear());
  const [periodoInicio, setPeriodoInicio] = useState<string>('');
  const [periodoFin, setPeriodoFin] = useState<string>('');
  const [filtroVehiculo, setFiltroVehiculo] = useState<string>('');
  const [datosMensuales, setDatosMensuales] = useState<DatosMensuales[]>([]);
  const [datosVehiculos, setDatosVehiculos] = useState<DatosVehiculo[]>([]);
  const [vehiculosMasDemandados, setVehiculosMasDemandados] = useState<DatosVehiculo[]>([]);
  const [showVehiculoDropdown, setShowVehiculoDropdown] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<'success' | 'danger'>('success');

  interface DatosMensuales {
    mes: string;
    ingresos: number;
    cantidad: number;
  }

  interface DatosVehiculo {
    vehiculo: string;
    ingresos: number;
    cantidad: number;
  }

  // Establecer fechas por defecto (inicio y fin del año actual)
  useEffect(() => {
    const hoy = new Date();
    const inicioAño = new Date(hoy.getFullYear(), 0, 1);
    const finAño = new Date(hoy.getFullYear(), 11, 31);
    
    setPeriodoInicio(inicioAño.toISOString().split('T')[0]);
    setPeriodoFin(finAño.toISOString().split('T')[0]);
  }, []);

  // Calcular datos mensuales cuando cambian las órdenes o el año
  useEffect(() => {
    calcularDatosMensuales();
    calcularDatosVehiculos();
  }, [ordenes, año, periodoInicio, periodoFin, filtroVehiculo]);

  // Formatear número con separadores de miles y decimales
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calcular datos mensuales
  const calcularDatosMensuales = () => {
    // Filtrar órdenes por periodo
    const ordenesEnPeriodo = filtrarOrdenesPorPeriodo();
    
    // Filtrar por vehículo si hay filtro
    const ordenesFiltradas = filtroVehiculo 
      ? ordenesEnPeriodo.filter(orden => orden.tipoVehiculo === filtroVehiculo)
      : ordenesEnPeriodo;
    
    // Inicializar array de datos mensuales
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const datos: DatosMensuales[] = meses.map(mes => ({
      mes,
      ingresos: 0,
      cantidad: 0
    }));
    
    // Calcular ingresos y cantidad por mes
    ordenesFiltradas.forEach(orden => {
      const fechaCreacion = new Date(orden.fechaCreacion);
      const mesIndex = fechaCreacion.getMonth();
      
      datos[mesIndex].ingresos += orden.montoTotal || 0;
      datos[mesIndex].cantidad += 1;
    });
    
    setDatosMensuales(datos);
  };

  // Calcular datos por vehículo
  const calcularDatosVehiculos = () => {
    // Filtrar órdenes por periodo
    const ordenesEnPeriodo = filtrarOrdenesPorPeriodo();
    
    // Inicializar mapa de datos por vehículo
    const mapaVehiculos = new Map<string, DatosVehiculo>();
    
    // Inicializar con todos los tipos de vehículos
    tiposVehiculos.forEach(vehiculo => {
      mapaVehiculos.set(vehiculo, {
        vehiculo,
        ingresos: 0,
        cantidad: 0
      });
    });
    
    // Calcular ingresos y cantidad por vehículo
    ordenesEnPeriodo.forEach(orden => {
      if (!orden.tipoVehiculo) return;
      
      const datosVehiculo = mapaVehiculos.get(orden.tipoVehiculo) || {
        vehiculo: orden.tipoVehiculo,
        ingresos: 0,
        cantidad: 0
      };
      
      datosVehiculo.ingresos += orden.montoTotal || 0;
      datosVehiculo.cantidad += 1;
      
      mapaVehiculos.set(orden.tipoVehiculo, datosVehiculo);
    });
    
    // Convertir mapa a array y ordenar por ingresos (mayor a menor)
    const datosArray = Array.from(mapaVehiculos.values())
      .filter(datos => datos.cantidad > 0) // Solo incluir vehículos con alquileres
      .sort((a, b) => b.ingresos - a.ingresos);
    
    setDatosVehiculos(datosArray);
    
    // Ordenar por cantidad (mayor a menor) para vehículos más demandados
    const vehiculosDemandados = [...datosArray].sort((a, b) => b.cantidad - a.cantidad);
    setVehiculosMasDemandados(vehiculosDemandados);
  };

  // Filtrar órdenes por periodo
  const filtrarOrdenesPorPeriodo = () => {
    if (!periodoInicio || !periodoFin) {
      return ordenes;
    }

    const inicio = new Date(periodoInicio);
    const fin = new Date(periodoFin);
    fin.setHours(23, 59, 59); // Incluir todo el día final

    return ordenes.filter(orden => {
      const fechaCreacion = new Date(orden.fechaCreacion);
      return fechaCreacion >= inicio && fechaCreacion <= fin;
    });
  };

  // Aplicar filtro de periodo personalizado
  const aplicarFiltroPeriodo = () => {
    if (!periodoInicio || !periodoFin) {
      setMensaje('Por favor seleccione un rango de fechas válido');
      setTipoMensaje('danger');
      return;
    }
    
    const inicio = new Date(periodoInicio);
    const fin = new Date(periodoFin);
    
    if (inicio > fin) {
      setMensaje('La fecha de inicio debe ser anterior a la fecha de fin');
      setTipoMensaje('danger');
      return;
    }
    
    setMensaje('Filtro de periodo aplicado');
    setTipoMensaje('success');
    setTimeout(() => setMensaje(null), 3000);
    
    // Registrar acción en el log
    logAction('ESTADISTICAS', 'Filtro de periodo aplicado', { 
      inicio: periodoInicio, 
      fin: periodoFin 
    });
  };

  // Aplicar filtro de mes actual
  const aplicarFiltroMesActual = () => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    setAño(hoy.getFullYear());
    setPeriodoInicio(inicioMes.toISOString().split('T')[0]);
    setPeriodoFin(finMes.toISOString().split('T')[0]);
    
    setMensaje('Filtro de mes actual aplicado');
    setTipoMensaje('success');
    setTimeout(() => setMensaje(null), 3000);
    
    // Registrar acción en el log
    logAction('ESTADISTICAS', 'Filtro de mes actual aplicado', {
      mes: hoy.getMonth(),
      año: hoy.getFullYear(),
      nombreMes: hoy.toLocaleString('es-ES', { month: 'long' })
    });
  };

  // Aplicar filtro de año actual
  const aplicarFiltroAñoActual = () => {
    const hoy = new Date();
    const inicioAño = new Date(hoy.getFullYear(), 0, 1);
    const finAño = new Date(hoy.getFullYear(), 11, 31);
    
    setAño(hoy.getFullYear());
    setPeriodoInicio(inicioAño.toISOString().split('T')[0]);
    setPeriodoFin(finAño.toISOString().split('T')[0]);
    
    setMensaje('Filtro de año actual aplicado');
    setTipoMensaje('success');
    setTimeout(() => setMensaje(null), 3000);
    
    // Registrar acción en el log
    logAction('ESTADISTICAS', 'Filtro de año actual aplicado', { año: hoy.getFullYear() });
  };

  // Manejar selección de vehículo
  const handleVehiculoSelect = (vehiculo: string) => {
    setFiltroVehiculo(vehiculo);
    setShowVehiculoDropdown(false);
    
    // Registrar acción en el log
    logAction('ESTADISTICAS', 'Filtro por vehículo', { vehiculo });
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    const hoy = new Date();
    const inicioAño = new Date(hoy.getFullYear(), 0, 1);
    const finAño = new Date(hoy.getFullYear(), 11, 31);
    
    setAño(hoy.getFullYear());
    setFiltroVehiculo('');
    setPeriodoInicio(inicioAño.toISOString().split('T')[0]);
    setPeriodoFin(finAño.toISOString().split('T')[0]);
    
    setMensaje('Filtros limpiados');
    setTipoMensaje('success');
    setTimeout(() => setMensaje(null), 3000);
    
    // Registrar acción en el log
    logAction('ESTADISTICAS', 'Filtros limpiados');
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Estadísticas</Card.Header>
      <Card.Body>
        {mensaje && (
          <Alert variant={tipoMensaje} onClose={() => setMensaje(null)} dismissible>
            {mensaje}
          </Alert>
        )}
        
        {/* Filtros */}
        <Card className="mb-4 bg-light">
          <Card.Body>
            <h6 className="mb-3">Filtros</h6>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Group controlId="periodoInicio">
                  <Form.Label>Fecha de Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="periodoFin">
                  <Form.Label>Fecha de Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={periodoFin}
                    onChange={(e) => setPeriodoFin(e.target.value)}
                    min={periodoInicio}
                  />
                </Form.Group>
              </Col>
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
                        <span className="text-muted">Todos los vehículos</span>
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
                          <strong>Todos los vehículos</strong>
                        </div>
                        {tiposVehiculos.map((vehiculo) => (
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
              <Col md={3} className="d-flex align-items-end">
                <div className="d-flex gap-2 w-100">
                  <Button 
                    variant="primary" 
                    onClick={aplicarFiltroPeriodo}
                    className="flex-grow-1"
                  >
                    Aplicar Filtros
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={limpiarFiltros}
                  >
                    Limpiar
                  </Button>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={aplicarFiltroMesActual}
                  >
                    Mes Actual
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={aplicarFiltroAñoActual}
                  >
                    Año Actual
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => {
                      const hoy = new Date();
                      const inicioTrimestre = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1);
                      const finTrimestre = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3 + 3, 0);
                      
                      setPeriodoInicio(inicioTrimestre.toISOString().split('T')[0]);
                      setPeriodoFin(finTrimestre.toISOString().split('T')[0]);
                      
                      // Registrar acción en el log
                      logAction('ESTADISTICAS', 'Filtro de trimestre actual aplicado', {
                        año: hoy.getFullYear(),
                        trimestre: Math.floor(hoy.getMonth() / 3) + 1
                      });
                    }}
                  >
                    Trimestre Actual
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Resumen */}
        <Card className="mb-4 bg-light">
          <Card.Body>
            <h6 className="mb-3">Resumen</h6>
            <Row>
              <Col md={3}>
                <div className="border rounded p-3 bg-white">
                  <h6 className="text-muted mb-1">Total de Alquileres</h6>
                  <h3>{datosMensuales.reduce((total, dato) => total + dato.cantidad, 0)}</h3>
                </div>
              </Col>
              <Col md={3}>
                <div className="border rounded p-3 bg-white">
                  <h6 className="text-muted mb-1">Ingresos Totales</h6>
                  <h3>₡{formatNumber(datosMensuales.reduce((total, dato) => total + dato.ingresos, 0))}</h3>
                </div>
              </Col>
              <Col md={3}>
                <div className="border rounded p-3 bg-white">
                  <h6 className="text-muted mb-1">Vehículo más Rentable</h6>
                  <h3>{datosVehiculos.length > 0 ? datosVehiculos[0].vehiculo : 'N/A'}</h3>
                  {datosVehiculos.length > 0 && (
                    <small className="text-muted">₡{formatNumber(datosVehiculos[0].ingresos)}</small>
                  )}
                </div>
              </Col>
              <Col md={3}>
                <div className="border rounded p-3 bg-white">
                  <h6 className="text-muted mb-1">Vehículo más Demandado</h6>
                  <h3>{vehiculosMasDemandados.length > 0 ? vehiculosMasDemandados[0].vehiculo : 'N/A'}</h3>
                  {vehiculosMasDemandados.length > 0 && (
                    <small className="text-muted">{vehiculosMasDemandados[0].cantidad} alquileres</small>
                  )}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Datos en formato tabular */}
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">Datos Estadísticos</h6>
          </Card.Header>
          <Card.Body>
            <h6 className="mt-3 mb-2">Ingresos Mensuales</h6>
            <Table striped bordered hover responsive className="mb-4">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Cantidad de Alquileres</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {datosMensuales.map((dato) => (
                  <tr key={dato.mes}>
                    <td>{dato.mes}</td>
                    <td>{dato.cantidad}</td>
                    <td>₡{formatNumber(dato.ingresos)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        
        {/* Tabla de Vehículos */}
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">Detalle por Vehículo</h6>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Cantidad de Alquileres</th>
                  <th>Ingresos Totales</th>
                  <th>Ingreso Promedio</th>
                </tr>
              </thead>
              <tbody>
                {datosVehiculos.map((dato) => (
                  <tr key={dato.vehiculo}>
                    <td>{dato.vehiculo}</td>
                    <td>{dato.cantidad}</td>
                    <td>₡{formatNumber(dato.ingresos)}</td>
                    <td>₡{formatNumber(dato.cantidad > 0 ? dato.ingresos / dato.cantidad : 0)}</td>
                  </tr>
                ))}
                {datosVehiculos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center">No hay datos disponibles</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Card.Body>
    </Card>
  );
}