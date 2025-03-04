import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import ClienteForm from './components/ClienteForm';
import ClienteList from './components/ClienteList';
import OrdenForm from './components/OrdenForm';
import OrdenList from './components/OrdenList';
import Login from './components/Login';
import Navbar from './components/Navbar';
import MainMenu from './components/MainMenu';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './components/Unauthorized';
import UserManagement from './components/UserManagement';
import ConfiguracionGeneral from './components/ConfiguracionGeneral';
import Reportes from './components/Reportes';
import Estadisticas from './components/Estadisticas';
import Reservas from './components/Reservas';
import Mantenimiento from './components/Mantenimiento';
import Notificaciones from './components/Notificaciones';
import { AuthProvider } from './context/AuthContext';
import { Cliente, OrdenMantenimiento, Mantenimiento as MantenimientoType } from './types';
import { PRODUCTION_MODE } from './config';

function App() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenMantenimiento[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);
  const [ordenEditar, setOrdenEditar] = useState<OrdenMantenimiento | null>(null);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [showOrdenForm, setShowOrdenForm] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar datos de ejemplo al iniciar la aplicación
  useEffect(() => {
    // Verificar si ya hay datos cargados en localStorage
    const clientesGuardados = localStorage.getItem('clientes');
    const ordenesGuardadas = localStorage.getItem('ordenes');

    if (!clientesGuardados) {
      // Crear cliente de ejemplo
      const clienteEjemplo: Cliente = {
        id: '1',
        codigo: 'FAA01',
        nombre: 'Ronald Rojas Castro',
        cedula: '123456789',
        telefono: '88781108',
        email: 'ronaldrojascastro@gmail.com',
        referidoPor: 'Página Web' };
      
      setClientes([clienteEjemplo]);
      localStorage.setItem('clientes', JSON.stringify([clienteEjemplo]));
    } else {
      setClientes(JSON.parse(clientesGuardados));
    }

    if (!ordenesGuardadas) {
      // Crear orden de ejemplo
      const fechaInicio = new Date('2025-01-01T12:00:00');
      const fechaFin = new Date('2025-01-02T12:00:00');
      
      const ordenEjemplo: OrdenMantenimiento = {
        id: 'frontier-20250101-20250102',
        clienteId: '1',
        descripcion: 'Alquiler de Nissan Frontier NB para viaje a la playa',
        fechaCreacion: new Date(),
        estado: 'pendiente',
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        montoPorDia: 45000,
        montoTotal: 45000,
        tipoVehiculo: 'Nissan Frontier NB',
        agente: 'Gerardo Espinoza'
      };
      
      setOrdenes([ordenEjemplo]);
      localStorage.setItem('ordenes', JSON.stringify([ordenEjemplo]));
    } else {
      // Convertir las fechas de string a Date
      const ordenesParseadas = JSON.parse(ordenesGuardadas).map((orden: any) => ({
        ...orden,
        fechaCreacion: new Date(orden.fechaCreacion),
        fechaInicio: orden.fechaInicio ? new Date(orden.fechaInicio) : undefined,
        fechaFin: orden.fechaFin ? new Date(orden.fechaFin) : undefined,
        correAPartir: orden.correAPartir ? new Date(orden.correAPartir) : undefined
      }));
      
      setOrdenes(ordenesParseadas);
    }
  }, []);

  // Escuchar el evento personalizado para mostrar el formulario de cliente
  useEffect(() => {
    const handleShowClienteFormEvent = () => {
      setShowClienteForm(true);
      setClienteEditar(null);
      
      // Desplazarse al formulario
      setTimeout(() => {
        document.getElementById('clienteFormSection')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
    
    document.addEventListener('showClienteForm', handleShowClienteFormEvent);
    
    return () => {
      document.removeEventListener('showClienteForm', handleShowClienteFormEvent);
    };
  }, []);

  // Escuchar el evento personalizado para mostrar el formulario de orden
  useEffect(() => {
    const handleShowOrdenFormEvent = () => {
      setShowOrdenForm(true);
      setOrdenEditar(null);
      
      // Desplazarse al formulario
      setTimeout(() => {
        document.getElementById('ordenFormSection')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
    
    document.addEventListener('showOrdenForm', handleShowOrdenFormEvent);
    
    return () => {
      document.removeEventListener('showOrdenForm', handleShowOrdenFormEvent);
    };
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (clientes.length > 0) {
      localStorage.setItem('clientes', JSON.stringify(clientes));
    }
  }, [clientes]);

  useEffect(() => {
    if (ordenes.length > 0) {
      localStorage.setItem('ordenes', JSON.stringify(ordenes));
    }
  }, [ordenes]);

  const handleGuardarCliente = (nuevoCliente: Omit<Cliente, 'id'>) => {
    // Verificar si ya existe un cliente con la misma cédula
    const clienteExistente = clientes.find(
      cliente => cliente.cedula === nuevoCliente.cedula && 
      (!clienteEditar || cliente.id !== clienteEditar.id)
    );
    
    if (clienteExistente) {
      alert(`Ya existe un cliente con la cédula ${nuevoCliente.cedula}: ${clienteExistente.nombre}`);
      return;
    }
    
    if (clienteEditar) {
      // Actualizar cliente existente
      setClientes(clientes.map(cliente => 
        cliente.id === clienteEditar.id 
          ? { ...nuevoCliente, id: clienteEditar.id } 
          : cliente
      ));
      setClienteEditar(null);
    } else {
      // Crear nuevo cliente
      const cliente: Cliente = {
        ...nuevoCliente,
        id: Date.now().toString()
      };
      setClientes([...clientes, cliente]);
    }
    
    // Ocultar el formulario después de guardar
    setShowClienteForm(false);
    
    // Mostrar mensaje de éxito
    setSuccessMessage('Cliente guardado exitosamente');
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleSeleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteEditar(cliente);
    setShowClienteForm(true);
    
    // Desplazarse al formulario
    setTimeout(() => {
      document.getElementById('clienteFormSection')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCancelarEdicion = () => {
    setClienteEditar(null);
    setShowClienteForm(false);
  };

  const handleEliminarCliente = (id: string) => {
    // Verificar si el cliente tiene órdenes asociadas
    const tieneOrdenes = ordenes.some(orden => orden.clienteId === id);
    
    if (tieneOrdenes) {
      alert('No se puede eliminar el cliente porque tiene alquileres asociados');
      return;
    }
    
    if (window.confirm('¿Está seguro que desea eliminar este cliente?')) {
      setClientes(clientes.filter(cliente => cliente.id !== id));
      
      // Si el cliente eliminado es el seleccionado, deseleccionarlo
      if (clienteSeleccionado && clienteSeleccionado.id === id) {
        setClienteSeleccionado(null);
      }
    }
  };

  const handleGuardarOrden = (nuevaOrden: Omit<OrdenMantenimiento, 'id' | 'fechaCreacion'>) => {
    // Verificar disponibilidad del vehículo
    if (!verificarDisponibilidadVehiculo(nuevaOrden)) {
      alert(`El vehículo ${nuevaOrden.tipoVehiculo} no está disponible en el período seleccionado.`);
      return;
    }
    
    if (ordenEditar) {
      // Actualizar orden existente
      const ordenActualizada: OrdenMantenimiento = {
        ...nuevaOrden,
        id: ordenEditar.id, // Use the existing ID
        fechaCreacion: ordenEditar.fechaCreacion
      };
      
      setOrdenes(ordenes.map(orden => 
        orden.id === ordenEditar.id ? ordenActualizada : orden
      ));
      setOrdenEditar(null);
    } else {
      // Crear nueva orden
      const orden: OrdenMantenimiento = {
        ...nuevaOrden,
        id: Date.now().toString(),
        fechaCreacion: new Date()
      };
      setOrdenes([...ordenes, orden]);
      
      // Mostrar alerta de éxito
      setSuccessMessage('Orden creada exitosamente');
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }
    
    // Ocultar el formulario después de guardar
    setShowOrdenForm(false);
  };

  const verificarDisponibilidadVehiculo = (nuevaOrden: Omit<OrdenMantenimiento, 'id' | 'fechaCreacion'>) => {
    if (!nuevaOrden.tipoVehiculo || !nuevaOrden.fechaInicio || !nuevaOrden.fechaFin) {
      return true; // Si no hay vehículo o fechas, no hay conflicto
    }
    
    // Filtrar órdenes que no sean la que estamos editando
    const ordenesAComparar = ordenEditar 
      ? ordenes.filter(orden => orden.id !== ordenEditar.id) 
      : ordenes;
    
    // Buscar si hay alguna orden con el mismo vehículo y fechas que se solapan
    const conflicto = ordenesAComparar.some(orden => {
      // Si no es el mismo vehículo, no hay conflicto
      if (orden.tipoVehiculo !== nuevaOrden.tipoVehiculo) {
        return false;
      }
      
      // Si no tiene fechas, no hay conflicto
      if (!orden.fechaInicio || !orden.fechaFin) {
        return false;
      }
      
      // Verificar si hay solapamiento de fechas
      const inicioA = new Date(orden.fechaInicio).getTime();
      const finA = new Date(orden.fechaFin).getTime();
      const inicioB = nuevaOrden.fechaInicio ? new Date(nuevaOrden.fechaInicio).getTime() : 0;
      const finB = nuevaOrden.fechaFin ? new Date(nuevaOrden.fechaFin).getTime() : 0;
      
      // Hay conflicto si:
      // - El inicio de B está entre el inicio y fin de A
      // - El fin de B está entre el inicio y fin de A
      // - B contiene completamente a A
      return (inicioB >= inicioA && inicioB < finA) || 
             (finB > inicioA && finB <= finA) ||
             (inicioB <= inicioA && finB >= finA);
    });
    
    // También verificar si hay conflicto con mantenimientos
    const mantenimientosGuardados = localStorage.getItem('mantenimientos');
    if (mantenimientosGuardados) {
      try {
        const mantenimientos = JSON.parse(mantenimientosGuardados).map((mant: MantenimientoType) => ({
          ...mant,
          fechaInicio: new Date(mant.fechaInicio),
          fechaFin: new Date(mant.fechaFin)
        }));
        
        // Verificar si hay algún mantenimiento para el mismo vehículo en las mismas fechas
        const conflictoMantenimiento = mantenimientos.some((mant: MantenimientoType) => {
          // Si no es el mismo vehículo, no hay conflicto
          if (mant.tipoVehiculo !== nuevaOrden.tipoVehiculo) {
            return false;
          }
          
          // Si el mantenimiento está completado, no hay conflicto
          if (mant.estado === 'completado') {
            return false;
          }
          
          // Verificar si hay solapamiento de fechas
          const inicioA = new Date(mant.fechaInicio).getTime();
          const finA = new Date(mant.fechaFin).getTime();
          const inicioB = nuevaOrden.fechaInicio ? new Date(nuevaOrden.fechaInicio).getTime() : 0;
          const finB = nuevaOrden.fechaFin ? new Date(nuevaOrden.fechaFin).getTime() : 0;
          
          return (inicioB >= inicioA && inicioB < finA) || 
                 (finB > inicioA && finB <= finA) ||
                 (inicioB <= inicioA && finB >= finA);
        });
        
        if (conflictoMantenimiento) {
          return false;
        }
      } catch (error) {
        console.error('Error checking maintenance conflicts:', error);
      }
    }
    
    return !conflicto;
  };

  const handleEditarOrden = (orden: OrdenMantenimiento) => {
    setOrdenEditar(orden);
    setShowOrdenForm(true);
    
    // Si la orden tiene un cliente, seleccionarlo
    if (orden.clienteId) {
      const cliente = clientes.find(c => c.id === orden.clienteId);
      if (cliente) {
        setClienteSeleccionado(cliente);
      }
    }
    
    // Desplazarse al formulario
    setTimeout(() => {
      document.getElementById('ordenFormSection')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCancelarEdicionOrden = () => {
    setOrdenEditar(null);
    setShowOrdenForm(false);
  };

  const handleCambiarEstadoOrden = (id: string, nuevoEstado: OrdenMantenimiento['estado']) => {
    setOrdenes(ordenes.map(orden => 
      orden.id === id ? { ...orden, estado: nuevoEstado } : orden
    ));
  };

  // Componente para la página de inicio
  const Home = () => (
    <Container>
      <MainMenu clientes={clientes} />
    </Container>
  );

  // Componente para la página de clientes
  const ClientesPage = () => (
    <Container>
      <h1 className="mb-4 text-white">Gestión de Clientes</h1>
      {showSuccessAlert && (
        <Alert variant="success" onClose={() => setShowSuccessAlert(false)} dismissible>
          {successMessage}
        </Alert>
      )}
      <Row>
        <Col lg={12}>
          <div id="clienteFormSection" style={{ display: showClienteForm ? 'block' : 'none' }}>
            <ClienteForm 
              onGuardarCliente={handleGuardarCliente} 
              clienteEditar={clienteEditar}
              onCancelarEdicion={handleCancelarEdicion}
              clientes={clientes}
              ordenes={ordenes}
            />
          </div>
          <ClienteList 
            clientes={clientes} 
            onSeleccionarCliente={handleSeleccionarCliente}
            onEditarCliente={handleEditarCliente}
            onEliminarCliente={handleEliminarCliente}
          />
        </Col>
      </Row>
    </Container>
  );

  // Componente para la página de órdenes
  const OrdenesPage = () => (
    <Container>
      <h1 className="mb-4 text-white">Gestión de Alquileres</h1>
      {showSuccessAlert && (
        <Alert variant="success" onClose={() => setShowSuccessAlert(false)} dismissible>
          {successMessage}
        </Alert>
      )}
      <Row>
        <Col lg={12}>
          <div id="ordenFormSection" style={{ display: showOrdenForm ? 'block' : 'none' }}>
            <OrdenForm 
              cliente={clienteSeleccionado} 
              clientes={clientes}
              onGuardarOrden={handleGuardarOrden}
              ordenEditar={ordenEditar}
              onCancelarEdicion={handleCancelarEdicionOrden}
            />
          </div>
          <OrdenList 
            ordenes={ordenes} 
            clientes={clientes} 
            onCambiarEstado={handleCambiarEstadoOrden}
            onEditarOrden={handleEditarOrden}
          />
        </Col>
      </Row>
    </Container>
  );

  // Componente para la página de gestión de usuarios
  const UsuariosPage = () => (
    <Container>
      <h1 className="mb-4 text-white">Gestión de Usuarios</h1>
      <Row>
        <Col lg={12}>
          <UserManagement />
        </Col>
      </Row>
    </Container>
  );

  // Componente para la página de configuración general
  const ConfiguracionPage = () => (
    <Container>
      <h1 className="mb-4 text-white">Configuración General</h1>
      <Row>
        <Col lg={12}>
          <ConfiguracionGeneral />
        </Col>
      </Row>
    </Container>
  );

  // Componente para la página de reportes
  const ReportesPage = () => (
    <Container>
      <h1 className="mb-4 text-white">Reportes</h1>
      <Row>
        <Col lg={12}>
          <Reportes 
            ordenes={ordenes}
            clientes={clientes}
          />
        </Col>
      </Row>
    </Container>
  );

  // Componente para la página de estadísticas
  const EstadisticasPage = () => (
    <Container>
      <h1 className="mb-4 text-white">Estadísticas</h1>
      <Row>
        <Col lg={12}>
          <Estadisticas 
            ordenes={ordenes}
          />
        </Col>
      </Row>
    </Container>
  );

  // Componente para la página de reservas
  const ReservasPage = () => (
    <Container>
      <h1 className="mb-4 text-white">Calendario de Reservas</h1>
      <Row>
        <Col lg={12}>
          <Reservas 
            ordenes={ordenes}
            clientes={clientes}
          />
        </Col>
      </Row>
    </Container>
  );

  // Componente para la página de mantenimiento
  const MantenimientoPage = () => (
    <Container>
      <Mantenimiento />
    </Container>
  );

  // Componente para la página de notificaciones
  const NotificacionesPage = () => (
    <Container>
      <Notificaciones />
    </Container>
  );

  // Redirect from login to home page if not in production mode
  const LoginRedirect = () => <Navigate to="/" replace />;

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {PRODUCTION_MODE ? (
            <Route path="/login" element={<Login />} />
          ) : (
            <Route path="/login" element={<LoginRedirect />} />
          )}
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Home />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/clientes" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <ClientesPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/ordenes" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <OrdenesPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/usuarios" element={
            <ProtectedRoute requireAdmin={true}>
              <>
                <Navbar />
                <UsuariosPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/configuracion" element={
            <ProtectedRoute requireAdmin={true}>
              <>
                <Navbar />
                <ConfiguracionPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/reportes" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <ReportesPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/estadisticas" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <EstadisticasPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/reservas" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <ReservasPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/mantenimiento" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <MantenimientoPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/notificaciones" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <NotificacionesPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;