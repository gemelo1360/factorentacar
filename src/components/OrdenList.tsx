import { useState } from 'react';
import { Table, Button, Card, Badge, Form, Alert, OverlayTrigger, Tooltip, Modal, Dropdown } from 'react-bootstrap';
import { Cliente, OrdenMantenimiento } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { generateClientQRCode } from '../utils/qrCodeGenerator';

// Lista de vehículos disponibles con imágenes
const tiposVehiculos = [
  {
    nombre: "Nissan Frontier NB",
    imagen: "https://factorentacar.com/carros/frontier.png"
  },
  {
    nombre: "Toyota Rush Café",
    imagen: "https://factorentacar.com/carros/rushcafe.png"
  },
  {
    nombre: "Toyota Rush Silver",
    imagen: "https://factorentacar.com/carros/rsilver.png"
  },
  {
    nombre: "Toyota Yaris",
    imagen: "https://factorentacar.com/carros/yaris.png"
  },
  {
    nombre: "Hyundai Tucson",
    imagen: "https://factorentacar.com/carros/tucson.png"
  },
  {
    nombre: "Hyundai Elantra Blanco",
    imagen: "https://factorentacar.com/carros/elantrab.png"
  },
  {
    nombre: "Hyundai Elantra Gris",
    imagen: "https://factorentacar.com/carros/elantrap.png"
  },
  {
    nombre: "Hyundai Starex",
    imagen: "https://factorentacar.com/carros/starex.png"
  },
  {
    nombre: "Chevrolet Beat",
    imagen: "https://factorentacar.com/carros/beat.png"
  }
];

interface OrdenListProps {
  ordenes: OrdenMantenimiento[];
  clientes: Cliente[];
  onCambiarEstado: (id: string, nuevoEstado: OrdenMantenimiento['estado']) => void;
  onEditarOrden: (orden: OrdenMantenimiento) => void;
}

export default function OrdenList({ ordenes, clientes, onCambiarEstado, onEditarOrden }: OrdenListProps) {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenMantenimiento | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{success: boolean; message: string} | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ordenToDelete, setOrdenToDelete] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const { isAdmin } = useAuth();

  const getClienteNombre = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Cliente desconocido';
  };

  const getClienteById = (clienteId: string) => {
    return clientes.find(c => c.id === clienteId);
  };

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

  // Formatear fecha para el ID de la orden
  const formatFechaParaId = (fecha: Date): string => {
    return fecha.toISOString().split('T')[0].replace(/-/g, '');
  };

  // Formatear número con separadores de miles y decimales
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const mapEstado = (estado: OrdenMantenimiento['estado']): string => {
    const estadoMap = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado'
    };
    return estadoMap[estado];
  };

  const getEstadoBadge = (estado: OrdenMantenimiento['estado']) => {
    const badgeMap = {
      pendiente: 'warning',
      en_proceso: 'info',
      completado: 'success'
    };
    
    return <Badge bg={badgeMap[estado]}>{mapEstado(estado)}</Badge>;
  };

  // Obtener la imagen del vehículo
  const getVehiculoImagen = (tipoVehiculo: string) => {
    const vehiculo = tiposVehiculos.find(v => v.nombre === tipoVehiculo);
    return vehiculo ? vehiculo.imagen : '';
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

  const handleGenerarPDF = (orden: OrdenMantenimiento) => {
    setSelectedOrden(orden);
    setShowPdfModal(true);
  };

  const handleDownloadPDF = () => {
    if (!selectedOrden) return;
    
    try {
      const cliente = getClienteById(selectedOrden.clienteId);
      if (!cliente) {
        alert('Cliente no encontrado');
        return;
      }
      
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
      doc.text('CONTRATO DE ALQUILER', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text('FACTO RENT A CAR', 105, 30, { align: 'center' });
      
      // Resetear color de texto
      doc.setTextColor(0, 0, 0);
      
      // Información del cliente (formato vertical)
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 45, 190, 60, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL CLIENTE', 14, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Información del cliente en formato vertical
      const lineHeight = 7;
      let yPos = 65;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Cédula:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.cedula, 50, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Nombre:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.nombre, 50, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Teléfono:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.telefono, 50, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.email, 50, yPos);
      
      // Información del alquiler
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 110, 190, 70, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DEL ALQUILER', 14, 120);
      
      // Número de orden con formato vehiculo-fechaInicio-fechaFin
      const ordenId = generarOrdenId(selectedOrden);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Número de Orden: ${ordenId}`, 14, 130);
      
      // Agregar tipo de vehículo en los detalles del alquiler
      doc.setFont('helvetica', 'bold');
      doc.text(`Vehículo: ${selectedOrden.tipoVehiculo || 'No especificado'}`, 14, 140);
      
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
      
      if (selectedOrden.fechaInicio) {
        doc.text(`Fecha de Inicio: ${formatFechaHora(selectedOrden.fechaInicio)}`, 14, 150);
      }
      
      if (selectedOrden.fechaFin) {
        doc.text(`Fecha de Fin: ${formatFechaHora(selectedOrden.fechaFin)}`, 14, 160);
      }
      
      // Calcular días totales
      let diasTotales = 0;
      if (selectedOrden.fechaInicio && selectedOrden.fechaFin) {
        const diffTime = Math.abs(selectedOrden.fechaFin.getTime() - selectedOrden.fechaInicio.getTime());
        diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      doc.text(`Días Totales: ${diasTotales}`, 14, 170);
      
      // Montos en formato vertical con símbolo de colones
      doc.setFont('helvetica', 'bold');
      doc.text(`Monto por Día: ${formatNumber(selectedOrden.montoPorDia || 0)} colones`, 120, 150);
      doc.text(`Monto Total: ${formatNumber(selectedOrden.montoTotal || 0)} colones`, 120, 160);
      
      if (selectedOrden.correAPartir) {
        try {
          doc.setFont('helvetica', 'normal');
          doc.text(`Corre a partir de: ${formatFechaHora(selectedOrden.correAPartir)}`, 14, 180);
        } catch (error) {
          console.error('Error al formatear "corre a partir de":', error);
        }
      }
      
      // Método de pago y agente
      if (selectedOrden.agente) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Agente: ${selectedOrden.agente}`, 120, 170);
      }
      
      // Descripción y QR Code en la misma línea
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 185, 100, 60, 'F'); // Descripción a la izquierda
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPCIÓN DEL ALQUILER', 14, 195);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Dividir la descripción en líneas para que quepa en el PDF
      const splitDescription = doc.splitTextToSize(selectedOrden.descripcion, 90);
      doc.text(splitDescription, 14, 205);
      
      // Código QR a la derecha
      doc.setFillColor(240, 240, 240);
      doc.rect(115, 185, 85, 60, 'F');
      
      // Generar código QR para el cliente
      try {
        const qrCodeUrl = generateClientQRCode(cliente.codigo || cliente.id, 100);
        doc.addImage(qrCodeUrl, 'PNG', 137, 195, 40, 40);
        doc.setFontSize(8);
        doc.text(`Código Cliente: ${cliente.codigo || cliente.id}`, 157, 240, { align: 'center' });
      } catch (error) {
        console.error('Error al generar código QR:', error);
      }
      
      // Firmas
      doc.setFontSize(10);
      doc.text('_______________________', 40, 260);
      doc.text('Firma del Cliente', 50, 265);
      
      doc.text('_______________________', 140, 260);
      doc.text('Firma del Representante', 150, 265);
      
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
      
      // Agregar segunda página con las condiciones generales
      doc.addPage();
      
      // Título de la segunda página
      doc.setFillColor(9, 38, 66); // #092642
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('CONDICIONES GENERALES', 105, 20, { align: 'center' });
      
      // Resetear color de texto
      doc.setTextColor(0, 0, 0);
      
      // Obtener las condiciones generales del localStorage
      const rentalConditions = localStorage.getItem('rentalConditions') || 'No se han configurado las condiciones generales.';
      
      // Dividir las condiciones en líneas para que quepan en el PDF
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitConditions = doc.splitTextToSize(rentalConditions, 190);
      doc.text(splitConditions, 10, 40);
      
      // Pie de página en la segunda página
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
        doc.save(`${ordenId}.pdf`);
        
        // Cerrar el modal
        setShowPdfModal(false);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  const handleEnviarEmail = async (orden: OrdenMantenimiento) => {
    const cliente = getClienteById(orden.clienteId);
    if (!cliente) {
      alert('Cliente no encontrado');
      return;
    }
    
    // Verificar si el envío de emails está habilitado
    const emailHabilitado = localStorage.getItem('emailHabilitado') === 'true';
    
    if (!emailHabilitado) {
      alert('El envío de emails no está habilitado. Por favor, active esta función en Configuración General.');
      return;
    }
    
    setEmailSending(true);
    setEmailResult(null);
    
    try {
      // Simulación de envío de email (en una aplicación real, aquí iría la lógica para enviar el email)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular tiempo de envío
      
      setEmailResult({
        success: true,
        message: `Email enviado exitosamente a ${cliente.email}`
      });
    } catch (error) {
      console.error('Error al enviar email:', error);
      setEmailResult({
        success: false,
        message: 'Error al enviar el email. Por favor, intente nuevamente.'
      });
    } finally {
      setEmailSending(false);
    }
  };

  const handleDeleteClick = (ordenId: string) => {
    setOrdenToDelete(ordenId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!ordenToDelete) return;
    
    // Aquí iría la lógica para eliminar la orden
    // Por ahora, solo cerramos el modal
    alert(`La orden ${ordenToDelete} sería eliminada aquí.`);
    
    setShowDeleteModal(false);
    setOrdenToDelete(null);
  };

  const handleShareClick = (orden: OrdenMantenimiento) => {
    setSelectedOrden(orden);
    setPdfGenerated(false);
    setPdfUrl(null);
    setShowShareModal(true);
    
    // Generar PDF automáticamente al abrir el modal de compartir
    setTimeout(() => {
      if (orden) {
        handleDownloadPDF();
      }
    }, 100);
  };

  const handleShareWhatsApp = () => {
    if (!selectedOrden) return;
    
    const cliente = getClienteById(selectedOrden.clienteId);
    if (!cliente) return;
    
    const ordenId = generarOrdenId(selectedOrden);
    
    // Crear mensaje con formato mejorado
    const mensaje = `*FACTO RENT A CAR - CONTRATO DE ALQUILER*\n\n` +
      `*Orden:* ${ordenId}\n` +
      `*Cliente:* ${cliente.nombre}\n` +
      `*Cédula:* ${cliente.cedula}\n` +
      `*Vehículo:* ${selectedOrden.tipoVehiculo || 'No especificado'}\n` +
      `*Período:* ${selectedOrden.fechaInicio ? formatFecha(selectedOrden.fechaInicio) : 'N/A'} - ${selectedOrden.fechaFin ? formatFecha(selectedOrden.fechaFin) : 'N/A'}\n` +
      `*Monto Total:* ₡${selectedOrden.montoTotal ? formatNumber(selectedOrden.montoTotal) : '0,00'}\n\n` +
      `Para más detalles, por favor contacte a Facto Rent a Car al 4070-0485.`;
    
    // Codificar el mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    // Si tenemos un PDF generado, compartir el PDF
    if (pdfGenerated && pdfUrl) {
      // Crear un elemento <a> para descargar el PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${ordenId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Luego abrir WhatsApp Web con el mensaje
      window.open(`https://web.whatsapp.com/send?text=${mensajeCodificado}`, '_blank');
    } else {
      // Solo abrir WhatsApp Web con el mensaje
      window.open(`https://web.whatsapp.com/send?text=${mensajeCodificado}`, '_blank');
    }
    
    // Cerrar el modal
    setShowShareModal(false);
  };

  const handleCrearOrden = () => {
    // Disparar evento para mostrar el formulario de orden
    document.dispatchEvent(new CustomEvent('showOrdenForm'));
  };

  if (ordenes.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <div>Alquileres de Vehículos</div>
          <Button variant="success" onClick={handleCrearOrden}>
            Crear Orden
          </Button>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">No hay alquileres de vehículos registrados.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      {showSuccessAlert && (
        <Alert 
          variant="success" 
          onClose={() => setShowSuccessAlert(false)} 
          dismissible
          className="mb-3"
        >
          Orden creada con éxito
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <div>
            Alquileres de Vehículos
            <Badge bg="primary" className="ms-2">{ordenes.length}</Badge>
          </div>
          <Button variant="success" onClick={handleCrearOrden}>
            Crear Orden
          </Button>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Descripción</th>
                <th>Fecha Creación</th>
                <th>Periodo</th>
                <th>Monto</th>
                <th>Agente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => (
                <tr key={orden.id}>
                  <td>{generarOrdenId(orden)}</td>
                  <td>{getClienteNombre(orden.clienteId)}</td>
                  <td>
                    {orden.tipoVehiculo ? (
                      <div className="d-flex align-items-center">
                        <img 
                          src={getVehiculoImagen(orden.tipoVehiculo)} 
                          alt={orden.tipoVehiculo}
                          style={{ width: '50px', height: '50px', objectFit: 'contain', marginRight: '10px' }}
                        />
                        <span>{orden.tipoVehiculo}</span>
                      </div>
                    ) : (
                      'No especificado'
                    )}
                  </td>
                  <td>{orden.descripcion}</td>
                  <td>{formatFecha(orden.fechaCreacion)}</td>
                  <td>
                    {orden.fechaInicio && orden.fechaFin ? (
                      <>
                        {formatFecha(orden.fechaInicio)} - {formatFecha(orden.fechaFin)}
                        {orden.correAPartir && (
                          <div>
                            <small className="text-muted">
                              Corre a partir de: {formatFecha(orden.correAPartir)}
                            </small>
                          </div>
                        )}
                      </>
                    ) : (
                      'No especificado'
                    )}
                  </td>
                  <td>
                    {orden.montoPorDia ? (
                      <>
                        <div>Por día: ₡{formatNumber(orden.montoPorDia)}</div>
                        {orden.montoTotal && <div>Total: ₡{formatNumber(orden.montoTotal)}</div>}
                      </>
                    ) : (
                      'No especificado'
                    )}
                  </td>
                  <td>{orden.agente || 'No asignado'}</td>
                  <td>{getEstadoBadge(orden.estado)}</td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={orden.estado}
                      onChange={(e) => onCambiarEstado(orden.id, e.target.value as OrdenMantenimiento['estado'])}
                      className="mb-2"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                    </Form.Select>
                    
                    <Dropdown>
                      <Dropdown.Toggle variant="primary" size="sm" id={`dropdown-${orden.id}`} className="w-100">
                        Acciones
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => onEditarOrden(orden)}>
                          <i className="bi bi-pencil me-2"></i> Editar
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleShareClick(orden)}>
                          <i className="bi bi-share me-2"></i> Compartir
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleGenerarPDF(orden)}>
                          <i className="bi bi-file-pdf me-2"></i> Descargar PDF
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleEnviarEmail(orden)}>
                          <i className="bi bi-envelope me-2"></i> Enviar por Email
                        </Dropdown.Item>
                        {isAdmin() && (
                          <Dropdown.Item 
                            onClick={() => handleDeleteClick(orden.id)}
                            className="text-danger"
                          >
                            <i className="bi bi-trash me-2"></i> Eliminar
                          </Dropdown.Item>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal para descargar PDF */}
      <Modal show={showPdfModal} onHide={() => setShowPdfModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Descargar PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrden && (
            <div className="mb-4">
              <div className="border p-3 rounded bg-light">
                <h5 className="mb-3" style={{ color: '#333333' }}>Resumen de la Orden</h5>
                <div className="text-dark" style={{ color: '#333333' }}>
                  <p><strong>Cliente:</strong> {getClienteNombre(selectedOrden.clienteId)}</p>
                  <p><strong>Vehículo:</strong> {selectedOrden.tipoVehiculo || 'No especificado'}</p>
                  <p>
                    <strong>Período:</strong>{' '}
                    {selectedOrden.fechaInicio && selectedOrden.fechaFin ? (
                      <>
                        {formatFecha(selectedOrden.fechaInicio)} - {formatFecha(selectedOrden.fechaFin)}
                      </>
                    ) : (
                      'No especificado'
                    )}
                  </p>
                  {selectedOrden.agente && (
                    <p><strong>Agente:</strong> {selectedOrden.agente}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="text-center">
            <p>Haga clic en el botón para descargar el PDF de la orden.</p>
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

      {/* Modal para mostrar resultado del envío de email */}
      <Modal 
        show={emailSending || emailResult !== null} 
        onHide={() => setEmailResult(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Envío de Email</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {emailSending && (
            <div>
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Enviando...</span>
              </div>
              <p>Enviando email, por favor espere...</p>
            </div>
          )}
          
          {emailResult && (
            <Alert variant={emailResult.success ? 'success' : 'danger'}>
              {emailResult.message}
            </Alert>
          )}
        </Modal.Body>
        {emailResult && (
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setEmailResult(null)}>
              Cerrar
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <Alert.Heading>¡Atención!</Alert.Heading>
            <p>
              ¿Está seguro que desea eliminar esta orden de alquiler? Esta acción no se puede deshacer.
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para compartir */}
      <Modal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        centered
      >
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal.Title style={{ color: '#333333' }}>Compartir Orden</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#f8f9fa' }}>
          {selectedOrden && (
            <div className="text-center">
              <div className="mb-4 p-3 border rounded bg-white">
                <h5 className="mb-3" style={{ color: '#333333', fontWeight: 'bold' }}>Resumen de la Orden</h5>
                <div style={{ color: '#444444' }}>
                  <p><strong style={{ color: '#333333' }}>Cliente:</strong> {getClienteNombre(selectedOrden.clienteId)}</p>
                  <p><strong style={{ color: '#333333' }}>Vehículo:</strong> {selectedOrden.tipoVehiculo || 'No especificado'}</p>
                  <p>
                    <strong style={{ color: '#333333' }}>Período:</strong>{' '}
                    {selectedOrden.fechaInicio && selectedOrden.fechaFin ? (
                      <>
                        {formatFecha(selectedOrden.fechaInicio)} - {formatFecha(selectedOrden.fechaFin)}
                      </>
                    ) : (
                      'No especificado'
                    )}
                  </p>
                  <p><strong style={{ color: '#333333' }}>Monto Total:</strong> ₡{selectedOrden.montoTotal ? formatNumber(selectedOrden.montoTotal) : '0,00'}</p>
                </div>
              </div>
              
              <h6 className="mb-3" style={{ color: '#333333', fontWeight: 'bold' }}>Opciones para compartir</h6>
              
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
                  onClick={() => {
                    handleEnviarEmail(selectedOrden);
                    setShowShareModal(false);
                  }}
                  className="d-flex align-items-center justify-content-center text-white"
                >
                  <i className="bi bi-envelope me-2" style={{ fontSize: '1.5rem' }}></i>
                  Enviar por Email
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
          <Button variant="secondary" onClick={() => setShowShareModal(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}