import React from 'react';
import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Cliente, OrdenMantenimiento } from '../types';
import ClienteSearchModal from './ClienteSearchModal';
import { isClientSearchEnabled } from '../utils/featureFlags';
import './MainMenu.css';

interface MenuOption {
  title: string;
  path: string;
  icon: string;
}

interface MainMenuProps {
  clientes?: Cliente[];
}

export default function MainMenu({ clientes = [] }: MainMenuProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [searchEnabled] = useState<boolean>(isClientSearchEnabled());
  const [currentDate, setCurrentDate] = useState(new Date());

  // Update current date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const menuOptions: MenuOption[] = [
    { title: 'Inicio', path: '/', icon: '🏠' },
    { title: 'Clientes', path: '/clientes', icon: '👥' },
    { title: 'Alquileres', path: '/ordenes', icon: '🚗' },
    { title: 'Reservas', path: '/reservas', icon: '📅' },
    { title: 'Reportes', path: '/reportes', icon: '📊' },
    { title: 'Estadísticas', path: '/estadisticas', icon: '📈' },
    { title: 'Usuarios', path: '/usuarios', icon: '👤' },
    { title: 'Configuración General', path: '/configuracion', icon: '⚙️' }
  ];

  const handleSearch = () => {
    if (!searchEnabled) {
      alert('La búsqueda de clientes está deshabilitada. Puede habilitarla en Configuración General.');
      return;
    }
    
    if (!searchTerm.trim() || !clientes.length) {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    
    // Buscar por ID de alquiler
    const ordenes = getOrdenes();
    const ordenesMatchingId = ordenes.filter(orden => 
      generarOrdenId(orden).toLowerCase().includes(term)
    );
    
    if (ordenesMatchingId.length > 0) {
      // Si encontramos órdenes, buscar los clientes correspondientes
      const clientesDeOrdenes = ordenesMatchingId.map(orden => 
        clientes.find(cliente => cliente.id === orden.clienteId)
      ).filter(Boolean) as Cliente[];
      
      // Eliminar duplicados
      const uniqueClientes = Array.from(new Set(clientesDeOrdenes.map(c => c.id)))
        .map(id => clientesDeOrdenes.find(c => c.id === id))
        .filter(Boolean) as Cliente[];
      
      setSearchResults(uniqueClientes);
      setShowSearchResults(true);
      return;
    }

    // Si no encontramos órdenes, buscar por nombre, cédula o referido
    const results = clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(term) || 
      cliente.cedula.toLowerCase().includes(term) ||
      (cliente.referidoPor && cliente.referidoPor.toLowerCase().includes(term))
    );

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCloseModal = () => {
    setShowSearchResults(false);
    setSearchTerm('');
  };
  
  // Obtener órdenes del localStorage
  const getOrdenes = (): OrdenMantenimiento[] => {
    const ordenesGuardadas = localStorage.getItem('ordenes');
    if (!ordenesGuardadas) return [];
    
    try {
      return JSON.parse(ordenesGuardadas).map((orden: any) => ({
        ...orden,
        fechaCreacion: new Date(orden.fechaCreacion),
        fechaInicio: orden.fechaInicio ? new Date(orden.fechaInicio) : undefined,
        fechaFin: orden.fechaFin ? new Date(orden.fechaFin) : undefined,
        correAPartir: orden.correAPartir ? new Date(orden.correAPartir) : undefined
      }));
    } catch (error) {
      console.error('Error parsing orders:', error);
      return [];
    }
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

  // Format current date as "Día de Mes Año"
  const formatCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    // Capitalize first letter
    const dateStr = currentDate.toLocaleDateString('es-ES', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  return (
    <Container className="main-menu-container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-center text-white mb-0">Menú Principal</h2>
        <p className="text-white small mb-0">{formatCurrentDate()}</p>
      </div>
      
      {searchEnabled && (
        <div className="search-container mb-4">
          <InputGroup>
            <Form.Control
              placeholder="Buscar por nombre, cédula, referido o ID de alquiler..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="search-input"
            />
            <Button 
              variant="primary" 
              onClick={handleSearch}
              className="search-button"
            >
              🔍 Buscar
            </Button>
          </InputGroup>
        </div>
      )}
      
      <Row className="g-4 justify-content-center">
        {menuOptions.map((option, index) => (
          <Col key={index} xs={12} sm={6} md={4} lg={3}>
            <Link to={option.path} className="text-decoration-none">
              <Button 
                variant="custom" 
                className="main-menu-button w-100 py-4 d-flex flex-column align-items-center justify-content-center"
              >
                <span className="menu-icon mb-2">{option.icon}</span>
                <span className="menu-title">{option.title}</span>
              </Button>
            </Link>
          </Col>
        ))}
      </Row>

      {searchEnabled && (
        <ClienteSearchModal 
          show={showSearchResults}
          onHide={handleCloseModal}
          clientes={searchResults}
        />
      )}
    </Container>
  );
}