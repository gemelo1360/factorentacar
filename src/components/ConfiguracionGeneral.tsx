import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Accordion, Modal } from 'react-bootstrap';
import { logAction } from '../utils/logService';

export default function ConfiguracionGeneral() {
  const [emailHabilitado, setEmailHabilitado] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [emailRemitente, setEmailRemitente] = useState('');
  const [nombreRemitente, setNombreRemitente] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('ronaldrojascastro@gmail.com');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estado para el logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Estados para habilitar/deshabilitar componentes
  const [qrCodesEnabled, setQrCodesEnabled] = useState(true);
  const [pdfGenerationEnabled, setPdfGenerationEnabled] = useState(true);
  const [clientSearchEnabled, setClientSearchEnabled] = useState(true);
  const [logServiceEnabled, setLogServiceEnabled] = useState(true);
  const [reservasCalendarEnabled, setReservasCalendarEnabled] = useState(true);
  
  // Estado para las condiciones de alquiler
  const [showConditionsModal, setShowConditionsModal] = useState(false);
  const [rentalConditions, setRentalConditions] = useState<string>('');

  // Cargar configuración guardada
  useEffect(() => {
    const savedEmailHabilitado = localStorage.getItem('emailHabilitado') === 'true';
    const savedApiKey = localStorage.getItem('sendgridApiKey') || '';
    const savedEmailRemitente = localStorage.getItem('emailRemitente') || '';
    const savedNombreRemitente = localStorage.getItem('nombreRemitente') || '';
    const savedEmailAdmin = localStorage.getItem('emailAdmin') || 'ronaldrojascastro@gmail.com';
    const savedLogo = localStorage.getItem('logoEmpresa') || null;
    const savedRentalConditions = localStorage.getItem('rentalConditions') || getDefaultRentalConditions();
    
    // Cargar estados de componentes
    const savedQrCodesEnabled = localStorage.getItem('qrCodesEnabled') !== 'false';
    const savedPdfGenerationEnabled = localStorage.getItem('pdfGenerationEnabled') !== 'false';
    const savedClientSearchEnabled = localStorage.getItem('clientSearchEnabled') !== 'false';
    const savedLogServiceEnabled = localStorage.getItem('logServiceEnabled') !== 'false';
    const savedReservasCalendarEnabled = localStorage.getItem('reservasCalendarEnabled') !== 'false';
    
    setEmailHabilitado(savedEmailHabilitado);
    setApiKey(savedApiKey);
    setEmailRemitente(savedEmailRemitente);
    setNombreRemitente(savedNombreRemitente);
    setEmailAdmin(savedEmailAdmin);
    setRentalConditions(savedRentalConditions);
    
    setQrCodesEnabled(savedQrCodesEnabled);
    setPdfGenerationEnabled(savedPdfGenerationEnabled);
    setClientSearchEnabled(savedClientSearchEnabled);
    setLogServiceEnabled(savedLogServiceEnabled);
    setReservasCalendarEnabled(savedReservasCalendarEnabled);
    
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      // Validar campos si el email está habilitado
      if (emailHabilitado) {
        if (!apiKey.trim()) {
          throw new Error('La API Key de SendGrid es requerida');
        }
        
        if (!emailRemitente.trim()) {
          throw new Error('El email del remitente es requerido');
        }
        
        if (!nombreRemitente.trim()) {
          throw new Error('El nombre del remitente es requerido');
        }
        
        if (!emailAdmin.trim()) {
          throw new Error('El email del administrador es requerido');
        }
      }
      
      // Guardar configuración
      localStorage.setItem('emailHabilitado', emailHabilitado.toString());
      localStorage.setItem('sendgridApiKey', apiKey);
      localStorage.setItem('emailRemitente', emailRemitente);
      localStorage.setItem('nombreRemitente', nombreRemitente);
      localStorage.setItem('emailAdmin', emailAdmin);
      
      // Guardar estados de componentes
      localStorage.setItem('qrCodesEnabled', qrCodesEnabled.toString());
      localStorage.setItem('pdfGenerationEnabled', pdfGenerationEnabled.toString());
      localStorage.setItem('clientSearchEnabled', clientSearchEnabled.toString());
      localStorage.setItem('logServiceEnabled', logServiceEnabled.toString());
      localStorage.setItem('reservasCalendarEnabled', reservasCalendarEnabled.toString());
      
      // Si hay un nuevo logo, guardarlo
      if (logoPreview) {
        localStorage.setItem('logoEmpresa', logoPreview);
      }
      
      // Registrar acción en el log
      if (logServiceEnabled) {
        logAction('CONFIGURACION', 'Configuración actualizada', {
          emailHabilitado,
          emailRemitente,
          nombreRemitente,
          emailAdmin,
          logoActualizado: !!logoFile,
          componentesActualizados: {
            qrCodesEnabled,
            pdfGenerationEnabled,
            clientSearchEnabled,
            logServiceEnabled,
            reservasCalendarEnabled
          }
        });
      }
      
      setSuccessMessage('Configuración guardada exitosamente');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Error al guardar la configuración');
      }
    }
  };

  const handleTestEmail = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      // Validar campos
      if (!apiKey.trim()) {
        throw new Error('La API Key de SendGrid es requerida');
      }
      
      if (!emailRemitente.trim()) {
        throw new Error('El email del remitente es requerido');
      }
      
      if (!nombreRemitente.trim()) {
        throw new Error('El nombre del remitente es requerido');
      }
      
      if (!emailAdmin.trim()) {
        throw new Error('El email del administrador es requerido');
      }
      
      // Aquí iría la lógica para enviar un email de prueba
      // Por ahora, solo mostramos un mensaje de éxito simulado
      setSuccessMessage('Email de prueba enviado exitosamente. Verifique su bandeja de entrada.');
      
      // Registrar acción en el log
      if (logServiceEnabled) {
        logAction('EMAIL', 'Email de prueba enviado', {
          destinatario: emailAdmin
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Error al enviar el email de prueba');
      }
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validar tipo de archivo
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      setErrorMessage('Solo se permiten archivos JPG o PNG');
      return;
    }
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('El tamaño máximo permitido es 2MB');
      return;
    }
    
    setLogoFile(file);
    
    // Crear una vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        // Verificar dimensiones usando un elemento de imagen HTML
        const imgElement = document.createElement('img');
        imgElement.onload = () => {
          // Verificar dimensiones (100x100 px aproximadamente)
          if (imgElement.width > 200 || imgElement.height > 200) {
            setErrorMessage('La imagen debe ser aproximadamente de 100x100 píxeles');
            setLogoPreview(null);
            return;
          }
          
          setLogoPreview(e.target?.result as string);
          setErrorMessage(null);
          setSuccessMessage('¡Su logo fue un éxito! El logo se utilizará en todos los PDF generados.');
          
          // Registrar acción en el log
          if (logServiceEnabled) {
            logAction('CONFIGURACION', 'Logo actualizado', {
              tamaño: file.size,
              tipo: file.type
            });
          }
        };
        imgElement.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    localStorage.removeItem('logoEmpresa');
    setSuccessMessage('Logo eliminado exitosamente');
    
    // Registrar acción en el log
    if (logServiceEnabled) {
      logAction('CONFIGURACION', 'Logo eliminado');
    }
  };
  
  const handleDownloadLog = () => {
    try {
      // Obtener el log del localStorage
      const logData = localStorage.getItem('systemLog') || '[]';
      const logEntries = JSON.parse(logData);
      
      // Formatear el log para que sea legible
      let logText = "FACTO RENT A CAR - REGISTRO DE ACTIVIDADES DEL SISTEMA\n";
      logText += "=======================================================\n\n";
      
      // Agrupar por tipo de acción
      const groupedLogs: Record<string, any[]> = {};
      
      logEntries.forEach((entry: any) => {
        if (!groupedLogs[entry.type]) {
          groupedLogs[entry.type] = [];
        }
        groupedLogs[entry.type].push(entry);
      });
      
      // Generar texto para cada grupo
      Object.keys(groupedLogs).forEach(type => {
        logText += `## ${type.toUpperCase()}\n\n`;
        
        groupedLogs[type].forEach((entry: any) => {
          const date = new Date(entry.timestamp).toLocaleString();
          logText += `- [${date}] ${entry.action}\n`;
          
          if (entry.details) {
            logText += `  Detalles: ${JSON.stringify(entry.details, null, 2)}\n`;
          }
          
          if (entry.user) {
            logText += `  Usuario: ${entry.user}\n`;
          }
          
          logText += "\n";
        });
        
        logText += "\n";
      });
      
      // Crear un blob con el texto
      const blob = new Blob([logText], { type: 'text/plain' });
      
      // Crear un enlace para descargar el archivo
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facto_log_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      setSuccessMessage('Registro de actividades descargado exitosamente');
      
      // Registrar la acción de descarga en el log
      if (logServiceEnabled) {
        logAction('SISTEMA', 'Descarga de registro de actividades');
      }
    } catch (error) {
      console.error('Error al descargar el log:', error);
      setErrorMessage('Error al descargar el registro de actividades');
    }
  };

  const handleResetComponentSettings = () => {
    if (window.confirm('¿Está seguro que desea restablecer la configuración de componentes a sus valores predeterminados?')) {
      setQrCodesEnabled(true);
      setPdfGenerationEnabled(true);
      setClientSearchEnabled(true);
      setLogServiceEnabled(true);
      setReservasCalendarEnabled(true);
      
      localStorage.setItem('qrCodesEnabled', 'true');
      localStorage.setItem('pdfGenerationEnabled', 'true');
      localStorage.setItem('clientSearchEnabled', 'true');
      localStorage.setItem('logServiceEnabled', 'true');
      localStorage.setItem('reservasCalendarEnabled', 'true');
      
      setSuccessMessage('Configuración de componentes restablecida a valores predeterminados');
      
      if (logServiceEnabled) {
        logAction('CONFIGURACION', 'Configuración de componentes restablecida');
      }
    }
  };

  // Función para mostrar el modal de condiciones
  const handleShowConditionsModal = () => {
    setShowConditionsModal(true);
  };

  // Función para guardar las condiciones
  const handleSaveConditions = () => {
    localStorage.setItem('rentalConditions', rentalConditions);
    setShowConditionsModal(false);
    setSuccessMessage('Condiciones de alquiler guardadas exitosamente');
    
    // Registrar acción en el log
    if (logServiceEnabled) {
      logAction('CONFIGURACION', 'Condiciones de alquiler actualizadas');
    }
  };

  // Función para restablecer las condiciones por defecto
  const handleResetConditions = () => {
    const defaultConditions = getDefaultRentalConditions();
    setRentalConditions(defaultConditions);
    localStorage.setItem('rentalConditions', defaultConditions);
    setSuccessMessage('Condiciones de alquiler restablecidas a valores predeterminados');
    
    // Registrar acción en el log
    if (logServiceEnabled) {
      logAction('CONFIGURACION', 'Condiciones de alquiler restablecidas');
    }
  };

  // Obtener condiciones por defecto
  const getDefaultRentalConditions = (): string => {
    return `CONDICIONES GENERALES DE ALQUILER

1. ENTREGA Y DEVOLUCIÓN DEL VEHÍCULO
   El arrendatario recibe el vehículo en perfectas condiciones de funcionamiento, con todos sus documentos, neumáticos, herramientas y accesorios, y se compromete a devolverlo en el mismo estado.

2. CONDUCTOR AUTORIZADO
   El vehículo solo podrá ser conducido por el arrendatario o por los conductores autorizados expresamente en el contrato.

3. PROHIBICIONES
   Está prohibido:
   - Conducir bajo los efectos del alcohol, drogas u otras sustancias.
   - Transportar personas o bienes mediante remuneración.
   - Participar en competiciones o pruebas deportivas.
   - Transportar más pasajeros de los permitidos según la tarjeta de circulación.
   - Conducir fuera de las vías públicas o en condiciones no aptas para el vehículo.

4. MANTENIMIENTO Y REPARACIONES
   El arrendatario debe verificar regularmente los niveles de aceite, agua y presión de los neumáticos. Cualquier avería debe ser comunicada inmediatamente a Facto Rent a Car.

5. COMBUSTIBLE
   El vehículo se entrega con el tanque lleno y debe devolverse en las mismas condiciones. En caso contrario, se facturará el combustible faltante más un cargo por servicio.

6. ACCIDENTES
   En caso de accidente, el arrendatario debe:
   - Obtener los datos completos del otro vehículo y conductor.
   - Notificar inmediatamente a Facto Rent a Car.
   - No abandonar el vehículo sin tomar medidas para protegerlo.
   - Obtener un informe policial si hay heridos o daños significativos.

7. SEGUROS
   El seguro incluye:
   - Responsabilidad civil obligatoria.
   - No incluye daños personales al conductor ni a sus pertenencias.
   - El arrendatario es responsable de los daños no cubiertos por el seguro.

8. CANCELACIONES Y MODIFICACIONES
   - Cancelación con más de 48 horas: reembolso completo.
   - Cancelación entre 24-48 horas: cargo del 50% del alquiler.
   - Cancelación con menos de 24 horas: cargo del 100% del alquiler.

9. JURISDICCIÓN
   Para cualquier litigio derivado de este contrato, las partes se someten a los tribunales de Costa Rica.

10. PROTECCIÓN DE DATOS
    Los datos personales serán tratados conforme a la legislación vigente en materia de protección de datos.

Facto Rent a Car
Tel: 4070-0485 | www.factorentacar.com
San Ramón, Alajuela, Costa Rica`;
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Configuración General</Card.Header>
      <Card.Body>
        {successMessage && <Alert variant="success">{successMessage}</Alert>}
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Row className="mb-4">
            <Col md={12}>
              <Card className="bg-light">
                <Card.Body>
                  <h6 className="mb-3">Logo de la Empresa</h6>
                  
                  <Row className="align-items-center">
                    <Col md={4}>
                      <div 
                        className="border d-flex justify-content-center align-items-center mb-3" 
                        style={{ width: '150px', height: '150px', background: '#f8f9fa' }}
                      >
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo de la empresa" 
                            style={{ maxWidth: '100%', maxHeight: '100%' }} 
                          />
                        ) : (
                          <span className="text-muted">Sin logo</span>
                        )}
                      </div>
                    </Col>
                    <Col md={8}>
                      <Form.Group controlId="logoEmpresa" className="mb-3">
                        <Form.Label>Subir Logo (PNG o JPG, aprox. 100x100 px)</Form.Label>
                        <Form.Control 
                          type="file" 
                          accept=".jpg,.jpeg,.png" 
                          onChange={handleLogoChange}
                        />
                        <Form.Text className="text-muted">
                          El logo se mostrará en los reportes y documentos generados.
                        </Form.Text>
                      </Form.Group>
                      
                      {logoPreview && (
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={handleRemoveLogo}
                        >
                          Eliminar Logo
                        </Button>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={12}>
              <Card className="bg-light">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Condiciones de Alquiler</h6>
                    <Button 
                      variant="primary" 
                      onClick={handleShowConditionsModal}
                    >
                      Editar Condiciones
                    </Button>
                  </div>
                  <p className="text-muted">
                    Configure las condiciones generales que aparecerán en los contratos de alquiler.
                    Estas condiciones se mostrarán en la segunda página de los PDF generados.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={12}>
              <Card className="bg-light">
                <Card.Body>
                  <h6 className="mb-3">Configuración de Email (SendGrid)</h6>
                  
                  <Form.Group className="mb-3" controlId="emailHabilitado">
                    <Form.Check
                      type="switch"
                      label="Habilitar envío de emails"
                      checked={emailHabilitado}
                      onChange={(e) => setEmailHabilitado(e.target.checked)}
                    />
                    <Form.Text className="text-muted">
                      Active esta opción para permitir el envío de emails desde la aplicación.
                    </Form.Text>
                  </Form.Group>
                  
                  <div className={emailHabilitado ? '' : 'opacity-50'}>
                    <Form.Group className="mb-3" controlId="apiKey">
                      <Form.Label>API Key de SendGrid</Form.Label>
                      <Form.Control
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Ingrese su API Key de SendGrid"
                        disabled={!emailHabilitado}
                      />
                      <Form.Text className="text-muted">
                        Puede obtener su API Key en el panel de SendGrid.
                      </Form.Text>
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="emailRemitente">
                          <Form.Label>Email del Remitente</Form.Label>
                          <Form.Control
                            type="email"
                            value={emailRemitente}
                            onChange={(e) => setEmailRemitente(e.target.value)}
                            placeholder="ejemplo@factorentacar.com"
                            disabled={!emailHabilitado}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="nombreRemitente">
                          <Form.Label>Nombre del Remitente</Form.Label>
                          <Form.Control
                            type="text"
                            value={nombreRemitente}
                            onChange={(e) => setNombreRemitente(e.target.value)}
                            placeholder="Facto Rent a Car"
                            disabled={!emailHabilitado}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3" controlId="emailAdmin">
                      <Form.Label>Email del Administrador</Form.Label>
                      <Form.Control
                        type="email"
                        value={emailAdmin}
                        onChange={(e) => setEmailAdmin(e.target.value)}
                        placeholder="admin@factorentacar.com"
                        disabled={!emailHabilitado}
                      />
                      <Form.Text className="text-muted">
                        Este correo recibirá una copia de todas las notificaciones de órdenes.
                      </Form.Text>
                    </Form.Group>
                    
                    <Button 
                      variant="outline-primary" 
                      onClick={handleTestEmail}
                      disabled={!emailHabilitado}
                      className="mb-3"
                    >
                      Enviar Email de Prueba
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={12}>
              <Card className="bg-light">
                <Card.Body>
                  <h6 className="mb-3">Control de Componentes</h6>
                  <p className="text-muted mb-3">
                    Habilite o deshabilite componentes del sistema para evitar errores durante actualizaciones o mantenimiento.
                    <strong className="ms-2 text-danger">Precaución: Deshabilitar componentes puede afectar la funcionalidad del sistema.</strong>
                  </p>
                  
                  <Accordion defaultActiveKey="0" className="mb-3">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>Componentes Principales</Accordion.Header>
                      <Accordion.Body>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="switch"
                                id="pdfGenerationEnabled"
                                label="Generación de PDF"
                                checked={pdfGenerationEnabled}
                                onChange={(e) => setPdfGenerationEnabled(e.target.checked)}
                              />
                              <Form.Text className="text-muted">
                                Habilita la generación de documentos PDF para contratos y reportes.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="switch"
                                id="qrCodesEnabled"
                                label="Códigos QR"
                                checked={qrCodesEnabled}
                                onChange={(e) => setQrCodesEnabled(e.target.checked)}
                              />
                              <Form.Text className="text-muted">
                                Habilita la generación de códigos QR para clientes y órdenes.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="switch"
                                id="clientSearchEnabled"
                                label="Búsqueda de Clientes"
                                checked={clientSearchEnabled}
                                onChange={(e) => setClientSearchEnabled(e.target.checked)}
                              />
                              <Form.Text className="text-muted">
                                Habilita la funcionalidad de búsqueda avanzada de clientes.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="switch"
                                id="logServiceEnabled"
                                label="Servicio de Registro (Log)"
                                checked={logServiceEnabled}
                                onChange={(e) => setLogServiceEnabled(e.target.checked)}
                              />
                              <Form.Text className="text-muted">
                                Habilita el registro de actividades del sistema.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="switch"
                                id="reservasCalendarEnabled"
                                label="Calendario de Reservas"
                                checked={reservasCalendarEnabled}
                                onChange={(e) => setReservasCalendarEnabled(e.target.checked)}
                              />
                              <Form.Text className="text-muted">
                                Habilita el calendario visual en el módulo de Reservas.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                        <div className="d-flex justify-content-end">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={handleResetComponentSettings}
                          >
                            Restablecer Valores Predeterminados
                          </Button>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                  
                  <Alert variant="info">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Si experimenta errores después de una actualización, intente deshabilitar los componentes problemáticos y vuelva a habilitarlos gradualmente.
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={12}>
              <Card className="bg-light">
                <Card.Body>
                  <h6 className="mb-3">Registro del Sistema</h6>
                  <p>
                    El sistema mantiene un registro de todas las acciones importantes realizadas, 
                    como la creación de clientes, órdenes, cambios de configuración, etc.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={handleDownloadLog}
                    disabled={!logServiceEnabled}
                  >
                    Descargar Registro de Actividades
                  </Button>
                  {!logServiceEnabled && (
                    <Form.Text className="text-danger d-block mt-2">
                      El servicio de registro está deshabilitado. Habilítelo en la sección de Control de Componentes.
                    </Form.Text>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Button variant="primary" type="submit">
            Guardar Configuración
          </Button>
        </Form>
      </Card.Body>

      {/* Modal para editar condiciones de alquiler */}
      <Modal 
        show={showConditionsModal} 
        onHide={() => setShowConditionsModal(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Condiciones Generales de Alquiler</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Edite las condiciones generales que aparecerán en la segunda página de los contratos de alquiler.
            Puede utilizar formato de texto plano con saltos de línea para organizar el contenido.
          </p>
          <Form.Group controlId="rentalConditions">
            <Form.Control
              as="textarea"
              rows={20}
              value={rentalConditions}
              onChange={(e) => setRentalConditions(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConditionsModal(false)}>
            Cancelar
          </Button>
          <Button variant="warning" onClick={handleResetConditions}>
            Restablecer Valores Predeterminados
          </Button>
          <Button variant="primary" onClick={handleSaveConditions}>
            Guardar Condiciones
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}