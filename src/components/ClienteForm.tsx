import { useState, useEffect, useRef } from 'react';
import { Button, Form, Card, Spinner, Row, Col, Modal, Alert, Nav, Tab, Accordion } from 'react-bootstrap';
import { Cliente, ContratoFile, OrdenMantenimiento } from '../types';
import { logAction } from '../utils/logService';

interface ClienteFormProps {
  onGuardarCliente: (cliente: Omit<Cliente, 'id'>) => void;
  clienteEditar: Cliente | null;
  onCancelarEdicion: () => void;
  clientes: Cliente[]; // Added to check for next available code
  ordenes: OrdenMantenimiento[]; // Added to show client history
}

export default function ClienteForm({ onGuardarCliente, clienteEditar, onCancelarEdicion, clientes, ordenes }: ClienteFormProps) {
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [tipoCedula, setTipoCedula] = useState<'física' | 'jurídica' | ''>('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [referidoPor, setReferidoPor] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contratos, setContratos] = useState<ContratoFile[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<ContratoFile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('datos');
  const [clienteHistorial, setClienteHistorial] = useState<OrdenMantenimiento[]>([]);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedClientName, setSavedClientName] = useState('');
  const [accordionActiveKey, setAccordionActiveKey] = useState<string>('0');
  const [notas, setNotas] = useState<{id: string; texto: string; fecha: Date; color: string}[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [notaEditando, setNotaEditando] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState('');
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [notaSeleccionada, setNotaSeleccionada] = useState<{id: string; texto: string; fecha: Date; color: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const colores = ['#4CAF50', '#FFC107', '#9C27B0']; // verde, amarillo, morado

  // Cargar datos del cliente a editar cuando cambia
  useEffect(() => {
    if (clienteEditar) {
      setNombre(clienteEditar.nombre);
      setCedula(clienteEditar.cedula || '');
      setTelefono(clienteEditar.telefono);
      setEmail(clienteEditar.email);
      setCodigo(clienteEditar.codigo || '');
      setReferidoPor(clienteEditar.referidoPor || '');
      
      // Determinar tipo de cédula
      if (clienteEditar.cedula) {
        detectarTipoCedula(clienteEditar.cedula);
      }
      
      // Cargar contratos si existen
      if (clienteEditar.contratos && clienteEditar.contratos.length > 0) {
        const contratoFiles = clienteEditar.contratos.map((url, index) => {
          // Extract filename from URL or use a default name
          const fileName = url.split('/').pop() || `Contrato ${index + 1}.pdf`;
          return {
            name: fileName,
            type: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
            size: 0, // Size unknown for existing files
            url: url
          };
        });
        setContratos(contratoFiles);
      } else {
        setContratos([]);
      }

      // Cargar historial de reservas
      const historialCliente = ordenes.filter(orden => orden.clienteId === clienteEditar.id);
      setClienteHistorial(historialCliente);
      
      // Cargar notas si existen
      if (clienteEditar.notas) {
        setNotas(clienteEditar.notas);
      } else {
        setNotas([]);
      }
    } else {
      // Limpiar formulario si no hay cliente a editar
      setNombre('');
      setCedula('');
      setTipoCedula('');
      setTelefono('');
      setEmail('');
      setReferidoPor('');
      setContratos([]);
      setClienteHistorial([]);
      setClienteEncontrado(false);
      setNotas([]);
      
      // Generate next available code
      generateNextCode();
    }
  }, [clienteEditar, ordenes]);

  // Generate next available client code
  const generateNextCode = () => {
    // Get all existing codes
    const existingCodes = clientes
      .map(cliente => cliente.codigo || '')
      .filter(code => code.startsWith('FAA'))
      .sort();
    
    // Find the highest number
    let highestNum = 0;
    existingCodes.forEach(code => {
      const numPart = code.substring(3); // Extract the number part
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > highestNum) {
        highestNum = num;
      }
    });
    
    // Generate next code
    const nextNum = highestNum + 1;
    const nextCode = `FAA${nextNum.toString().padStart(2, '0')}`;
    setCodigo(nextCode);
  };

  // Detectar tipo de cédula basado en el formato
  const detectarTipoCedula = (cedula: string) => {
    // Limpiar la cédula de espacios y guiones
    const cedulaLimpia = cedula.replace(/[\s-]/g, '');
    
    // Cédula física: 9 dígitos, comienza con 1-9
    if (/^[1-9]\d{8}$/.test(cedulaLimpia)) {
      setTipoCedula('física');
      return;
    }
    
    // Cédula jurídica: 10 dígitos, comienza con 3
    if (/^3\d{9}$/.test(cedulaLimpia)) {
      setTipoCedula('jurídica');
      return;
    }
    
    // No se pudo determinar el tipo
    setTipoCedula('');
  };

  const consultarCedula = async (cedula: string) => {
    if (!cedula || cedula.length < 9) return;
    
    setCargando(true);
    setError(null);
    
    try {
      // Verificar si ya existe un cliente con esta cédula
      const clienteExistente = clientes.find(c => 
        c.cedula === cedula && (!clienteEditar || c.id !== clienteEditar.id)
      );
      
      if (clienteExistente) {
        setError(`Ya existe un cliente con la cédula ${cedula}: ${clienteExistente.nombre}`);
        setCargando(false);
        return;
      }
      
      // Detectar tipo de cédula
      detectarTipoCedula(cedula);
      
      // Simulación para prueba interna con cédula específica
      if (cedula === '112610049') {
        setNombre('Ronald Alberto Rojas Castro');
        setClienteEncontrado(true);
        setTipoCedula('física');
        setSuccessMessage(`Información obtenida correctamente. Tipo de cédula: física`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Registrar acción en el log
        logAction('CLIENTE', 'Consulta de cédula exitosa (simulación)', {
          cedula,
          nombre: 'Ronald Alberto Rojas Castro',
          tipoCedula: 'física'
        });
        
        setCargando(false);
        return;
      }
      
      // Usar API de Hacienda para consultar la cédula
      const response = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cedula}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('No se pudo obtener la información del contribuyente');
      }
      
      const data = await response.json();
      
      if (data && data.nombre) {
        setNombre(data.nombre);
        setClienteEncontrado(true);
        
        // Determinar tipo de cédula basado en la respuesta de la API
        if (data.tipoIdentificacion === 'Cedula Fisica') {
          setTipoCedula('física');
        } else if (data.tipoIdentificacion === 'Cedula Juridica') {
          setTipoCedula('jurídica');
        }
        
        setSuccessMessage(`Información obtenida correctamente. Tipo de cédula: ${tipoCedula || 'No determinado'}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Registrar acción en el log
        logAction('CLIENTE', 'Consulta de cédula exitosa', {
          cedula,
          nombre: data.nombre,
          tipoCedula
        });
      } else {
        setError('No se encontró información para esta cédula');
        
        // Registrar acción en el log
        logAction('CLIENTE', 'Consulta de cédula fallida', {
          cedula,
          error: 'No se encontró información'
        });
      }
    } catch (err) {
      console.error('Error al consultar la cédula:', err);
      setError('Error al consultar la información. Intente nuevamente.');
      
      // Registrar acción en el log
      logAction('CLIENTE', 'Error en consulta de cédula', {
        cedula,
        error: err instanceof Error ? err.message : 'Error desconocido'
      });
    } finally {
      setCargando(false);
    }
  };

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaCedula = e.target.value;
    setCedula(nuevaCedula);
    setClienteEncontrado(false);
    
    // Detectar tipo de cédula al escribir
    detectarTipoCedula(nuevaCedula);
    
    // Si estamos editando un cliente, no consultamos automáticamente
    if (clienteEditar) return;
    
    // Si la cédula tiene al menos 9 dígitos, consultamos
    if (nuevaCedula.length >= 9) {
      consultarCedula(nuevaCedula);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El tamaño máximo permitido es 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const newContrato: ContratoFile = {
            name: file.name,
            type: file.type,
            size: file.size,
            url: event.target.result
          };
          
          setContratos(prevContratos => [...prevContratos, newContrato]);
          setSuccessMessage('Contrato subido exitosamente');
          setTimeout(() => setSuccessMessage(null), 3000);
          
          // Registrar acción en el log
          logAction('CLIENTE', 'Contrato subido', {
            nombreArchivo: file.name,
            tamaño: file.size,
            cliente: clienteEditar?.nombre || nombre
          });
        }
      };
      
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveContrato = (index: number) => {
    const contratoEliminado = contratos[index];
    setContratos(prevContratos => prevContratos.filter((_, i) => i !== index));
    
    // Registrar acción en el log
    logAction('CLIENTE', 'Contrato eliminado', {
      nombreArchivo: contratoEliminado.name,
      cliente: clienteEditar?.nombre || nombre
    });
  };

  const handlePreviewContrato = (contrato: ContratoFile) => {
    setPreviewFile(contrato);
    setShowPreviewModal(true);
    
    // Registrar acción en el log
    logAction('CLIENTE', 'Contrato visualizado', {
      nombreArchivo: contrato.name,
      cliente: clienteEditar?.nombre || nombre
    });
  };

  // Funciones para manejar notas
  const handleAgregarNota = () => {
    if (!nuevaNota.trim()) return;
    
    const colorIndex = notas.length % colores.length;
    const nuevaNotaObj = {
      id: Date.now().toString(),
      texto: nuevaNota,
      fecha: new Date(),
      color: colores[colorIndex]
    };
    
    setNotas(prevNotas => [...prevNotas, nuevaNotaObj]);
    setNuevaNota('');
    
    // Registrar acción en el log
    logAction('CLIENTE', 'Nota agregada', {
      cliente: clienteEditar?.nombre || nombre,
      nota: nuevaNota
    });
  };

  const handleEditarNota = (id: string) => {
    const nota = notas.find(n => n.id === id);
    if (nota) {
      setNotaEditando(id);
      setTextoEditado(nota.texto);
    }
  };

  const handleGuardarEdicionNota = () => {
    if (!notaEditando || !textoEditado.trim()) return;
    
    setNotas(prevNotas => prevNotas.map(nota => 
      nota.id === notaEditando ? { ...nota, texto: textoEditado } : nota
    ));
    
    setNotaEditando(null);
    setTextoEditado('');
    
    // Registrar acción en el log
    logAction('CLIENTE', 'Nota editada', {
      cliente: clienteEditar?.nombre || nombre,
      notaId: notaEditando
    });
  };

  const handleEliminarNota = (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar esta nota?')) {
      setNotas(prevNotas => prevNotas.filter(nota => nota.id !== id));
      
      // Registrar acción en el log
      logAction('CLIENTE', 'Nota eliminada', {
        cliente: clienteEditar?.nombre || nombre,
        notaId: id
      });
    }
  };

  const handleVerNota = (nota: {id: string; texto: string; fecha: Date; color: string}) => {
    setNotaSeleccionada(nota);
    setShowNotaModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim() || !cedula.trim() || !telefono.trim() || !email.trim() || !codigo.trim()) {
      alert('Por favor complete todos los campos');
      return;
    }
    
    // Verificar si ya existe un cliente con esta cédula
    const clienteExistente = clientes.find(c => 
      c.cedula === cedula && (!clienteEditar || c.id !== clienteEditar.id)
    );
    
    if (clienteExistente) {
      setError(`Ya existe un cliente con la cédula ${cedula}: ${clienteExistente.nombre}`);
      return;
    }
    
    // Mostrar alerta de confirmación con el tipo de cédula
    const tipoTexto = tipoCedula ? `cédula ${tipoCedula}` : 'cédula';
    if (!window.confirm(`¿Está seguro de guardar el cliente con ${tipoTexto} ${cedula}?`)) {
      return;
    }
    
    onGuardarCliente({
      nombre,
      cedula,
      telefono,
      email,
      codigo,
      referidoPor,
      contratos: contratos.map(contrato => contrato.url),
      notas: notas
    });
    
    // Registrar acción en el log
    logAction('CLIENTE', clienteEditar ? 'Cliente actualizado' : 'Cliente creado', {
      codigo,
      nombre,
      cedula,
      telefono,
      email,
      referidoPor,
      contratos: contratos.length,
      notas: notas.length,
      id: clienteEditar?.id
    });
    
    // Guardar el nombre del cliente para mostrarlo en el modal de éxito
    setSavedClientName(nombre);
    
    // Mostrar el modal de éxito
    setShowSuccessModal(true);
    
    // Limpiar formulario
    if (!clienteEditar) {
      setNombre('');
      setCedula('');
      setTipoCedula('');
      setTelefono('');
      setEmail('');
      setReferidoPor('');
      setContratos([]);
      setNotas([]);
      generateNextCode();
    }
    
    setError(null);
    setSuccessMessage('Cliente guardado exitosamente');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Formatear fecha para mostrar
  const formatFecha = (fecha: Date) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener estado con badge
  const getEstadoBadge = (estado: OrdenMantenimiento['estado']) => {
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
    
    return <span className={`badge bg-${badgeMap[estado]}`}>{estadoMap[estado]}</span>;
  };

  // Cerrar el modal de éxito
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">
        {clienteEditar ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      </Card.Header>
      <Card.Body>
        <Tab.Container id="cliente-tabs" activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="datos">Datos del Cliente</Nav.Link>
            </Nav.Item>
            {clienteEditar && (
              <Nav.Item>
                <Nav.Link eventKey="historial">
                  Historial de Reservas
                  {clienteHistorial.length > 0 && (
                    <span className="badge bg-primary ms-2">{clienteHistorial.length}</span>
                  )}
                </Nav.Link>
              </Nav.Item>
            )}
            <Nav.Item>
              <Nav.Link eventKey="notas">
                Notas del Cliente
                {notas.length > 0 && (
                  <span className="badge bg-primary ms-2">{notas.length}</span>
                )}
              </Nav.Link>
            </Nav.Item>
          </Nav>
          
          <Tab.Content>
            <Tab.Pane eventKey="datos">
              {error && <Alert variant="danger">{error}</Alert>}
              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Accordion activeKey={accordionActiveKey}>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header onClick={() => setAccordionActiveKey(accordionActiveKey === '0' ? '' : '0')}>
                      Información Básica
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="codigo">
                            <Form.Label>Código de Cliente</Form.Label>
                            <Form.Control
                              type="text"
                              value={codigo}
                              onChange={(e) => setCodigo(e.target.value)}
                              required
                              placeholder="Código automático"
                              disabled={true}
                            />
                            <Form.Text className="text-muted">
                              Código único asignado automáticamente.
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="cedula">
                            <Form.Label>Cédula</Form.Label>
                            <div className="d-flex">
                              <Form.Control
                                type="text"
                                value={cedula}
                                onChange={handleCedulaChange}
                                required
                                placeholder="Ingrese el número de cédula"
                                disabled={cargando}
                              />
                              {!clienteEditar && (
                                <Button 
                                  variant="outline-primary" 
                                  className="ms-2" 
                                  onClick={() => consultarCedula(cedula)}
                                  disabled={!cedula || cedula.length < 9 || cargando}
                                >
                                  {cargando ? <Spinner animation="border" size="sm" /> : 'Consultar'}
                                </Button>
                              )}
                            </div>
                            <div className="d-flex align-items-center mt-1">
                              <Form.Text className="text-muted me-2">
                                Ingrese la cédula y se consultará automáticamente.
                              </Form.Text>
                              {tipoCedula && (
                                <span className={`badge bg-${tipoCedula === 'física' ? 'info' : 'secondary'} ms-2`}>
                                  Cédula {tipoCedula}
                                </span>
                              )}
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3" controlId="nombre">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                          type="text"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          required
                          placeholder="Ingrese el nombre completo"
                          disabled={cargando}
                          className={clienteEncontrado ? "bg-success text-white" : ""}
                        />
                      </Form.Group>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="telefono">
                            <Form.Label>Teléfono</Form.Label>
                            <Form.Control
                              type="tel"
                              value={telefono}
                              onChange={(e) => setTelefono(e.target.value)}
                              required
                              placeholder="Ingrese el número de teléfono"
                              disabled={cargando}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="email">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              placeholder="Ingrese el correo electrónico"
                              disabled={cargando}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3" controlId="referidoPor">
                        <Form.Label>Referido por</Form.Label>
                        <Form.Control
                          type="text"
                          value={referidoPor}
                          onChange={(e) => setReferidoPor(e.target.value)}
                          placeholder="¿Quién refirió a este cliente? (opcional)"
                          disabled={cargando}
                        />
                        <Form.Text className="text-muted">
                          Indique quién refirió a este cliente a Facto Rent a Car.
                        </Form.Text>
                      </Form.Group>
                    </Accordion.Body>
                  </Accordion.Item>
                  
                  <Accordion.Item eventKey="1">
                    <Accordion.Header onClick={() => setAccordionActiveKey(accordionActiveKey === '1' ? '' : '1')}>
                      Documentos y Contratos
                    </Accordion.Header>
                    <Accordion.Body>
                      <Form.Group className="mb-3" controlId="contratos">
                        <Form.Label>Contratos</Form.Label>
                        <div className="d-flex">
                          <Form.Control
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={cargando}
                            className="me-2"
                          />
                          <Button 
                            variant="outline-primary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={cargando}
                          >
                            Adjuntar Contrato
                          </Button>
                        </div>
                        <Form.Text className="text-muted">
                          Adjunte los contratos en formato PDF (máximo 5MB por archivo).
                        </Form.Text>
                      </Form.Group>
                      
                      {contratos.length > 0 && (
                        <div className="mb-3">
                          <h6>Contratos Adjuntos:</h6>
                          <div className="list-group">
                            {contratos.map((contrato, index) => (
                              <div key={index} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                                  <div>
                                    <div>{contrato.name}</div>
                                    <small className="text-muted">
                                      {contrato.type} - {contrato.size > 0 ? `${Math.round(contrato.size / 1024)} KB` : 'Tamaño desconocido'}
                                    </small>
                                  </div>
                                </div>
                                <div>
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="me-2"
                                    onClick={() => handlePreviewContrato(contrato)}
                                  >
                                    Ver
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => handleRemoveContrato(index)}
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
                
                <div className="d-flex gap-2 mt-3">
                  <Button variant="primary" type="submit" disabled={cargando}>
                    {clienteEditar ? 'Actualizar' : 'Guardar'}
                  </Button>
                  
                  {clienteEditar && (
                    <Button variant="secondary" onClick={onCancelarEdicion} disabled={cargando}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </Form>
            </Tab.Pane>
            
            <Tab.Pane eventKey="historial">
              {clienteHistorial.length === 0 ? (
                <Alert variant="info">
                  Este cliente no tiene reservas registradas.
                </Alert>
              ) : (
                <>
                  <h6 className="mb-3">Historial de Reservas</h6>
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Vehículo</th>
                          <th>Fecha Inicio</th>
                          <th>Fecha Fin</th>
                          <th>Monto</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clienteHistorial.map((orden) => (
                          <tr key={orden.id}>
                            <td>{orden.id}</td>
                            <td>{orden.tipoVehiculo || 'No especificado'}</td>
                            <td>{orden.fechaInicio ? formatFecha(orden.fechaInicio) : 'N/A'}</td>
                            <td>{orden.fechaFin ? formatFecha(orden.fechaFin) : 'N/A'}</td>
                            <td>₡{orden.montoTotal?.toLocaleString('es-CR') || 'N/A'}</td>
                            <td>{getEstadoBadge(orden.estado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-3">
                    <h6>Resumen</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="card bg-light mb-3">
                          <div className="card-body">
                            <h6 className="card-title">Total de Reservas</h6>
                            <p className="card-text fs-4">{clienteHistorial.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-light mb-3">
                          <div className="card-body">
                            <h6 className="card-title">Monto Total</h6>
                            <p className="card-text fs-4">
                              ₡{clienteHistorial.reduce((total, orden) => total + (orden.montoTotal || 0), 0).toLocaleString('es-CR')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-light mb-3">
                          <div className="card-body">
                            <h6 className="card-title">Última Reserva</h6>
                            <p className="card-text">
                              {clienteHistorial.length > 0 
                                ? formatFecha(clienteHistorial.sort((a, b) => 
                                    new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
                                  )[0].fechaCreacion)
                                : 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Tab.Pane>
            
            <Tab.Pane eventKey="notas">
              <div className="mb-3">
                <h6>Notas del Cliente</h6>
                <div className="d-flex mb-3">
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Escriba una nueva nota..."
                    className="me-2"
                  />
                  <Button 
                    variant="primary" 
                    onClick={handleAgregarNota}
                    disabled={!nuevaNota.trim()}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Guardar
                  </Button>
                </div>
                
                {notas.length === 0 ? (
                  <Alert variant="info">
                    No hay notas registradas para este cliente.
                  </Alert>
                ) : (
                  <div className="list-group">
                    {notas.map((nota) => (
                      <div 
                        key={nota.id} 
                        className="list-group-item list-group-item-action mb-2"
                        style={{ borderLeft: `5px solid ${nota.color}` }}
                      >
                        {notaEditando === nota.id ? (
                          <div className="d-flex mb-2">
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={textoEditado}
                              onChange={(e) => setTextoEditado(e.target.value)}
                              className="me-2"
                            />
                            <div className="d-flex flex-column">
                              <Button 
                                variant="success" 
                                size="sm" 
                                className="mb-1"
                                onClick={handleGuardarEdicionNota}
                              >
                                Guardar
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => {
                                  setNotaEditando(null);
                                  setTextoEditado('');
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div 
                              className="mb-2 nota-texto" 
                              onClick={() => handleVerNota(nota)}
                              style={{ cursor: 'pointer' }}
                            >
                              {nota.texto.length > 100 
                                ? `${nota.texto.substring(0, 100)}...` 
                                : nota.texto
                              }
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {formatFecha(nota.fecha)}
                              </small>
                              <div>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  className="me-2"
                                  onClick={() => handleEditarNota(nota.id)}
                                >
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleEliminarNota(nota.id)}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Card.Body>

      {/* Modal para previsualizar contratos */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {previewFile?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewFile && (
            <div className="ratio ratio-16x9">
              <iframe 
                src={previewFile.url} 
                title={previewFile.name}
                style={{ width: '100%', height: '500px' }}
              ></iframe>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (previewFile) {
                const link = document.createElement('a');
                link.href = previewFile.url;
                link.download = previewFile.name;
                link.click();
                
                // Registrar acción en el log
                logAction('CLIENTE', 'Contrato descargado', {
                  nombreArchivo: previewFile.name,
                  cliente: clienteEditar?.nombre || nombre
                });
              }
            }}
          >
            Descargar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para ver nota completa */}
      <Modal
        show={showNotaModal}
        onHide={() => setShowNotaModal(false)}
        centered
      >
        <Modal.Header closeButton style={{ borderBottom: notaSeleccionada ? `5px solid ${notaSeleccionada.color}` : 'none' }}>
          <Modal.Title>
            Nota del Cliente
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notaSeleccionada && (
            <>
              <p style={{ whiteSpace: 'pre-wrap' }}>{notaSeleccionada.texto}</p>
              <small className="text-muted">
                Creada el {formatFecha(notaSeleccionada.fecha)}
              </small>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotaModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de éxito */}
      <Modal
        show={showSuccessModal}
        onHide={handleCloseSuccessModal}
        centered
        backdrop="static"
      >
        <Modal.Header className="bg-success text-white">
          <Modal.Title>
            <i className="bi bi-check-circle me-2"></i>
            Cliente guardado con éxito
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-4">
            <i className="bi bi-person-check-fill text-success" style={{ fontSize: '4rem' }}></i>
          </div>
          <h4 className="mb-3">¡Operación completada!</h4>
          <p className="mb-0">
            El cliente <strong>{savedClientName}</strong> ha sido {clienteEditar ? 'actualizado' : 'registrado'} exitosamente en el sistema.
          </p>
          {!clienteEditar && (
            <p className="mt-2">
              Código asignado: <strong>{codigo}</strong>
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="success" onClick={handleCloseSuccessModal}>
            Aceptar
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}