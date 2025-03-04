import { Navbar as BootstrapNavbar, Container, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PRODUCTION_MODE } from '../config';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsBlinking, setNotificationsBlinking] = useState(false);
  const [mantenimientosCount, setMantenimientosCount] = useState(0);

  // Check for maintenance notifications
  useEffect(() => {
    const checkMaintenanceNotifications = () => {
      try {
        const mantenimientos = JSON.parse(localStorage.getItem('mantenimientos') || '[]');
        const today = new Date();
        
        // Count maintenance orders that have ended
        const count = mantenimientos.filter((mant: any) => {
          if (!mant.fechaFin) return false;
          const fechaFin = new Date(mant.fechaFin);
          return fechaFin <= today;
        }).length;
        
        setNotificationCount(count);
        
        // Set blinking if there are notifications
        if (count > 0) {
          setNotificationsBlinking(true);
          setTimeout(() => setNotificationsBlinking(false), 500);
          setTimeout(() => {
            if (count > 0) setNotificationsBlinking(true);
            setTimeout(() => setNotificationsBlinking(false), 500);
          }, 1000);
        }
        
        // Count total maintenance orders
        setMantenimientosCount(mantenimientos.length);
      } catch (error) {
        console.error('Error checking maintenance notifications:', error);
      }
    };
    
    // Check immediately
    checkMaintenanceNotifications();
    
    // Check every minute
    const interval = setInterval(checkMaintenanceNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCreateClient = () => {
    document.dispatchEvent(new CustomEvent('showClienteForm'));
    navigate('/clientes');
  };

  const handleCreateOrder = () => {
    document.dispatchEvent(new CustomEvent('showOrdenForm'));
    navigate('/ordenes');
  };

  const handleCreateReport = () => {
    navigate('/reportes');
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">Facto Rent a Car</BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Inicio</Nav.Link>
            
            {/* Dropdown menu for Create actions */}
            <NavDropdown title="Crear" id="create-dropdown">
              <NavDropdown.Item onClick={handleCreateClient}>
                <i className="bi bi-person-plus me-2"></i>Cliente
              </NavDropdown.Item>
              <NavDropdown.Item onClick={handleCreateOrder}>
                <i className="bi bi-car-front me-2"></i>Alquiler
              </NavDropdown.Item>
              <NavDropdown.Item onClick={handleCreateReport}>
                <i className="bi bi-file-earmark-text me-2"></i>Reporte
              </NavDropdown.Item>
            </NavDropdown>
            
            <Nav.Link as={Link} to="/reservas">Calendario</Nav.Link>
            <Nav.Link as={Link} to="/estadisticas">Estadísticas</Nav.Link>
            <Nav.Link as={Link} to="/mantenimiento">
              <span className="me-1">Mant</span>
              <Badge bg="secondary" pill>{mantenimientosCount}</Badge>
            </Nav.Link>
            {isAdmin() && (
              <>
                <Nav.Link as={Link} to="/usuarios">Gestión de Usuarios</Nav.Link>
                <Nav.Link as={Link} to="/configuracion">Configuración General</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {/* Notifications bell */}
            <Nav.Link as={Link} to="/notificaciones" className="position-relative me-3">
              <i 
                className={`bi bi-bell-fill fs-5 ${notificationsBlinking ? 'text-warning' : 'text-secondary'}`}
                style={{ animation: notificationsBlinking ? 'bell-blink 1s infinite' : 'none' }}
              ></i>
              {notificationCount > 0 && (
                <Badge 
                  bg="danger" 
                  pill 
                  className="position-absolute top-0 start-100 translate-middle"
                >
                  {notificationCount}
                </Badge>
              )}
            </Nav.Link>
            
            {PRODUCTION_MODE ? (
              <NavDropdown title={user?.email || 'Usuario'} id="user-dropdown">
                <NavDropdown.Item onClick={handleSignOut}>Cerrar Sesión</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link onClick={handleSignOut}>
                Usuario Temporal
              </Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
      <style>
        {`
          @keyframes bell-blink {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </BootstrapNavbar>
  );
}