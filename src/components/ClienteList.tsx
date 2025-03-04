import { useState, useEffect } from 'react';
import { Table, Button, Card, Badge, OverlayTrigger, Tooltip, Modal, Form, InputGroup, Row, Col, Dropdown } from 'react-bootstrap';
import { Cliente } from '../types';
import { generateClientQRCode } from '../utils/qrCodeGenerator';
import { isQrCodesEnabled } from '../utils/featureFlags';

interface ClienteListProps {
  clientes: Cliente[];
  onSeleccionarCliente: (cliente: Cliente) => void;
  onEditarCliente: (cliente: Cliente) => void;
  onEliminarCliente: (id: string) => void;
}

export default function ClienteList({ 
  clientes, 
  onSeleccionarCliente, 
  onEditarCliente,
  onEliminarCliente 
}: ClienteListProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>(clientes);
  const [filterCriteria, setFilterCriteria] = useState<'todos' | 'codigo' | 'nombre' | 'cedula'>('todos');
  const [sortBy, setSortBy] = useState<'nombre' | 'codigo' | 'cedula'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Update filtered clients when search term or clients change
  useEffect(() => {
    filterClientes();
  }, [searchTerm, clientes, filterCriteria, sortBy, sortDirection]);

  const filterClientes = () => {
    let filtered = [...clientes];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      
      if (filterCriteria === 'todos') {
        filtered = filtered.filter(cliente => 
          (cliente.codigo && cliente.codigo.toLowerCase().includes(term)) ||
          cliente.nombre.toLowerCase().includes(term) ||
          (cliente.cedula && cliente.cedula.toLowerCase().includes(term))
        );
      } else if (filterCriteria === 'codigo') {
        filtered = filtered.filter(cliente => 
          cliente.codigo && cliente.codigo.toLowerCase().includes(term)
        );
      } else if (filterCriteria === 'nombre') {
        filtered = filtered.filter(cliente => 
          cliente.nombre.toLowerCase().includes(term)
        );
      } else if (filterCriteria === 'cedula') {
        filtered = filtered.filter(cliente => 
          cliente.cedula && cliente.cedula.toLowerCase().includes(term)
        );
      }
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: string;
      let valueB: string;
      
      if (sortBy === 'codigo') {
        valueA = a.codigo || '';
        valueB = b.codigo || '';
      } else if (sortBy === 'cedula') {
        valueA = a.cedula || '';
        valueB = b.cedula || '';
      } else {
        valueA = a.nombre;
        valueB = b.nombre;
      }
      
      if (sortDirection === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
    
    setFilteredClientes(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (criteria: 'todos' | 'codigo' | 'nombre' | 'cedula') => {
    setFilterCriteria(criteria);
  };

  const handleSortChange = (field: 'nombre' | 'codigo' | 'cedula') => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCriteria('todos');
    setSortBy('nombre');
    setSortDirection('asc');
  };

  const handleShowQR = (cliente: Cliente) => {
    // Verificar si los códigos QR están habilitados
    if (!isQrCodesEnabled()) {
      alert('La generación de códigos QR está deshabilitada. Puede habilitarla en Configuración General.');
      return;
    }
    
    setSelectedCliente(cliente);
    setShowQRModal(true);
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setSelectedCliente(null);
  };

  if (clientes.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <div>Lista de Clientes</div>
          <Button 
            variant="success" 
            onClick={() => document.dispatchEvent(new CustomEvent('showClienteForm'))}
          >
            Crear Cliente
          </Button>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">No hay clientes registrados.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <div>
            Lista de Clientes
            <Badge bg="primary" className="ms-2">{clientes.length}</Badge>
          </div>
          <Button 
            variant="success" 
            onClick={() => document.dispatchEvent(new CustomEvent('showClienteForm'))}
          >
            Crear Cliente
          </Button>
        </Card.Header>
        <Card.Body>
          {/* Search and Filter Controls */}
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-filter">
                    {filterCriteria === 'todos' ? 'Todos los campos' : 
                     filterCriteria === 'codigo' ? 'Código' : 
                     filterCriteria === 'nombre' ? 'Nombre' : 'Cédula'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleFilterChange('todos')}>Todos los campos</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleFilterChange('codigo')}>Código</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleFilterChange('nombre')}>Nombre</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleFilterChange('cedula')}>Cédula</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>Ordenar por</InputGroup.Text>
                <Form.Select 
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as 'nombre' | 'codigo' | 'cedula')}
                >
                  <option value="nombre">Nombre</option>
                  <option value="codigo">Código</option>
                  <option value="cedula">Cédula</option>
                </Form.Select>
                <Button 
                  variant="outline-secondary"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? <i className="bi bi-sort-alpha-down"></i> : <i className="bi bi-sort-alpha-up"></i>}
                </Button>
              </InputGroup>
            </Col>
            <Col md={2} className="d-flex align-items-center justify-content-end">
              <Button 
                variant="outline-secondary" 
                onClick={clearFilters}
                className="w-100"
              >
                Limpiar Filtros
              </Button>
            </Col>
          </Row>

          {/* Results count */}
          <div className="mb-3">
            <small className="text-muted">
              Mostrando {filteredClientes.length} de {clientes.length} clientes
              {searchTerm && ` para la búsqueda "${searchTerm}"`}
            </small>
          </div>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Referido por</th>
                <th>Contratos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.codigo || 'N/A'}</td>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.cedula}</td>
                  <td>{cliente.telefono}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.referidoPor || 'N/A'}</td>
                  <td>
                    {cliente.contratos && cliente.contratos.length > 0 ? (
                      <div className="d-flex gap-1">
                        {cliente.contratos.map((contrato, index) => (
                          <OverlayTrigger
                            key={index}
                            placement="top"
                            overlay={
                              <Tooltip id={`tooltip-${cliente.id}-${index}`}>
                                Ver contrato
                              </Tooltip>
                            }
                          >
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => {
                                window.open(contrato, '_blank');
                              }}
                            >
                              <i className="bi bi-file-pdf"></i>
                            </Button>
                          </OverlayTrigger>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">Sin contratos</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Seleccionar</Tooltip>}
                      >
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => onSeleccionarCliente(cliente)}
                        >
                          <i className="bi bi-check-circle"></i>
                        </Button>
                      </OverlayTrigger>
                      
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Editar</Tooltip>}
                      >
                        <Button 
                          variant="warning" 
                          size="sm" 
                          onClick={() => onEditarCliente(cliente)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                      </OverlayTrigger>
                      
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Eliminar</Tooltip>}
                      >
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => onEliminarCliente(cliente.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </OverlayTrigger>
                      
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Ver código QR</Tooltip>}
                      >
                        <Button 
                          variant="info" 
                          size="sm" 
                          onClick={() => handleShowQR(cliente)}
                        >
                          <i className="bi bi-qr-code"></i>
                        </Button>
                      </OverlayTrigger>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal para mostrar código QR */}
      <Modal show={showQRModal} onHide={handleCloseQRModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Código QR - Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedCliente && (
            <>
              <div className="mb-3">
                <img 
                  src={generateClientQRCode(selectedCliente.codigo, 200)} 
                  alt="Código QR" 
                  className="img-fluid"
                />
              </div>
              <div className="mb-3">
                <h5>{selectedCliente.nombre}</h5>
                <p className="mb-1"><strong>Código:</strong> {selectedCliente.codigo}</p>
                <p className="mb-1"><strong>Cédula:</strong> {selectedCliente.cedula}</p>
                <p className="mb-1"><strong>Teléfono:</strong> {selectedCliente.telefono}</p>
              </div>
              <p className="text-muted small">
                Escanee este código para acceder a la información del cliente.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseQRModal}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (selectedCliente) {
                const qrCodeUrl = generateClientQRCode(selectedCliente.codigo, 300);
                const link = document.createElement('a');
                link.href = qrCodeUrl;
                link.download = `qr_${selectedCliente.codigo}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }}
          >
            Descargar QR
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}