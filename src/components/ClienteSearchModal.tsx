import { Modal, Button, Alert, Card, Badge } from 'react-bootstrap';
import { Cliente, OrdenMantenimiento } from '../types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { generateClientQRCode } from '../utils/qrCodeGenerator';

interface ClienteSearchModalProps {
  show: boolean;
  onHide: () => void;
  clientes: Cliente[];
}

export default function ClienteSearchModal({ show, onHide, clientes }: ClienteSearchModalProps) {
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteOrdenes, setClienteOrdenes] = useState<OrdenMantenimiento[]>([]);
  const [showOrdenesDetail, setShowOrdenesDetail] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenMantenimiento | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Reset selection when modal is closed
    if (!show) {
      setSelectedCliente(null);
      setShowOrdenesDetail(false);
      setSelectedOrden(null);
      setShowPdfModal(false);
    }
  }, [show]);

  const handleClienteSelect = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    
    // Get orders for this client from localStorage
    const ordenesGuardadas = localStorage.getItem('ordenes');
    if (ordenesGuardadas) {
      try {
        const ordenes = JSON.parse(ordenesGuardadas).map((orden: any) => ({
          ...orden,
          fechaCreacion: new Date(orden.fechaCreacion),
          fechaInicio: orden.fechaInicio ? new Date(orden.fechaInicio) : undefined,
          fechaFin: orden.fechaFin ? new Date(orden.fechaFin) : undefined,
          correAPartir: orden.correAPartir ? new Date(orden.correAPartir) : undefined
        }));
        
        const clienteOrdenes = ordenes.filter((orden: OrdenMantenimiento) => 
          orden.clienteId === cliente.id
        );
        
        setClienteOrdenes(clienteOrdenes);
      } catch (error) {
        console.error('Error parsing orders:', error);
        setClienteOrdenes([]);
      }
    }
  };

  const handleShowOrdenes = () => {
    setShowOrdenesDetail(true);
  };

  const handleMoreInfo = () => {
    if (selectedCliente) {
      onHide();
      // Navigate to clients page and somehow highlight this client
      // For now, just navigate to clients page
      navigate('/clientes');
    }
  };

  const formatFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatear número con separadores de miles y decimales
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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

  const handleViewPdf = (orden: OrdenMantenimiento) => {
    setSelectedOrden(orden);
    setShowPdfModal(true);
  };

  const handleDownloadPdf = () => {
    if (!selectedOrden || !selectedCliente) return;
    
    try {
      // Crear un nuevo documento PDF
      const doc = new jsPDF();
      
      // Agregar color de fondo al encabezado
      doc.setFillColor(9, 38, 66); // #092642
      doc.rect(0, 0, 210, 40, 'F');
      
      // Número de orden en la esquina superior derecha
      const ordenId = generarOrdenId(selectedOrden);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100); // Gris oscuro
      doc.setFont('helvetica', 'bold');
      doc.text(`Orden #: ${ordenId}`, 190, 10, { align: 'right' });
      
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
      doc.text(selectedCliente.cedula, 50, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Nombre:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedCliente.nombre, 50, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Teléfono:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedCliente.telefono, 50, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedCliente.email, 50, yPos);
      
      // Información del vehículo
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 110, 190, 50, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DEL VEHÍCULO', 14, 120);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Vehículo: ${selectedOrden.tipoVehiculo || 'No especificado'}`, 14, 130);
      
      // Información del alquiler
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 165, 190, 50, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DEL ALQUILER', 14, 175);
      
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
        doc.text(`Fecha de Inicio: ${formatFechaHora(selectedOrden.fechaInicio)}`, 14, 192);
      }
      
      if (selectedOrden.fechaFin) {
        doc.text(`Fecha de Fin: ${formatFechaHora(selectedOrden.fechaFin)}`, 105, 192);
      }
      
      // Calcular días totales
      let diasTotales = 0;
      if (selectedOrden.fechaInicio && selectedOrden.fechaFin) {
        const diffTime = Math.abs(selectedOrden.fechaFin.getTime() - selectedOrden.fechaInicio.getTime());
        diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      doc.text(`Días Totales: ${diasTotales}`, 14, 199);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Monto por Día: ₡${formatNumber(selectedOrden.montoPorDia || 0)}`, 14, 206);
      doc.text(`Monto Total: ₡${formatNumber(selectedOrden.montoTotal || 0)}`, 105, 206);
      
      // Descripción y QR Code
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 220, 140, 50, 'F'); // Reducido el ancho para dejar espacio al QR
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPCIÓN DEL ALQUILER', 14, 230);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Dividir la descripción en líneas para que quepa en el PDF
      const splitDescription = doc.splitTextToSize(selectedOrden.descripcion, 130); // Reducido el ancho
      doc.text(splitDescription, 14, 240);
      
      // Generar código QR para el código del cliente
      try {
        // Generar código QR usando una API externa
        const qrCodeUrl = generateClientQRCode(selectedCliente.codigo);
        
        // Agregar el código QR al PDF (centrado a la derecha)
        doc.addImage(qrCodeUrl, 'PNG', 155, 220, 40, 40);
        
        // Agregar texto debajo del código QR
        doc.setFontSize(8);
        doc.text(`Código: ${selectedCliente.codigo}`, 175, 265, { align: 'center' });
      } catch (error) {
        console.error('Error al generar código QR:', error);
      }
      
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
      
      // Guardar el PDF
      doc.save(`${ordenId}.pdf`);
      
      // Cerrar el modal
      setShowPdfModal(false);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  return (
    <>
      <Modal 
        show={show} 
        onHide={onHide}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showOrdenesDetail && selectedCliente 
              ? `Órdenes de ${selectedCliente.nombre}` 
              : "Resultados de Búsqueda"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!showOrdenesDetail ? (
            <>
              {clientes.length === 0 ? (
                <Alert variant="info">
                  No se encontraron clientes que coincidan con la búsqueda.
                </Alert>
              ) : (
                <>
                  {selectedCliente ? (
                    <Card className="mb-3">
                      <Card.Body>
                        <Card.Title>{selectedCliente.nombre}</Card.Title>
                        <Card.Text>
                          <strong>Cédula:</strong> {selectedCliente.cedula}<br />
                          <strong>Teléfono:</strong> {selectedCliente.telefono}<br />
                          <strong>Email:</strong> {selectedCliente.email}<br />
                          <strong>Código:</strong> {selectedCliente.codigo}<br />
                          {selectedCliente.referidoPor && (
                            <><strong>Referido por:</strong> {selectedCliente.referidoPor}<br /></>
                          )}
                        </Card.Text>
                        <div className="d-flex gap-2 mt-3">
                          <Button variant="primary" onClick={handleMoreInfo}>
                            Más Información
                          </Button>
                          <Button 
                            variant="success" 
                            onClick={handleShowOrdenes}
                          >
                            Órdenes {clienteOrdenes.length > 0 ? `(${clienteOrdenes.length})` : '(0)'}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  ) : (
                    <div className="cliente-list">
                      {clientes.map(cliente => (
                        <Card 
                          key={cliente.id} 
                          className="mb-2 cliente-card"
                          onClick={() => handleClienteSelect(cliente)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h5 className="mb-1">{cliente.nombre}</h5>
                                <p className="mb-0 text-muted">
                                  {cliente.cedula} | {cliente.telefono}
                                </p>
                              </div>
                              <Badge bg="primary">{cliente.codigo}</Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {clienteOrdenes.length === 0 ? (
                <Alert variant="info">
                  Este cliente no tiene órdenes registradas.
                </Alert>
              ) : (
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
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clienteOrdenes.map(orden => (
                        <tr key={orden.id}>
                          <td>{orden.id}</td>
                          <td>{orden.tipoVehiculo || 'No especificado'}</td>
                          <td>{orden.fechaInicio ? formatFecha(orden.fechaInicio) : 'N/A'}</td>
                          <td>{orden.fechaFin ? formatFecha(orden.fechaFin) : 'N/A'}</td>
                          <td>₡{orden.montoTotal?.toLocaleString('es-CR') || 'N/A'}</td>
                          <td>
                            <Badge 
                              bg={
                                orden.estado === 'completado' ? 'success' : 
                                orden.estado === 'en_proceso' ? 'info' : 
                                'warning'
                              }
                            >
                              {orden.estado === 'completado' ? 'Completado' : 
                               orden.estado === 'en_proceso' ? 'En Proceso' : 
                               'Pendiente'}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleViewPdf(orden)}
                            >
                              <i className="bi bi-file-pdf"></i> PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Button 
                variant="secondary" 
                onClick={() => setShowOrdenesDetail(false)}
                className="mt-3"
              >
                Volver a Detalles del Cliente
              </Button>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para ver PDF */}
      <Modal 
        show={showPdfModal} 
        onHide={() => setShowPdfModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ color: '#333333' }}>Detalles de la Orden</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrden && selectedCliente && (
            <div className="text-center">
              <div className="mb-4 p-3 border rounded bg-light">
                <div style={{ color: '#333333' }}>
                  <p><strong>Cliente:</strong> {selectedCliente.nombre}</p>
                  <p><strong>Vehículo:</strong> {selectedOrden.tipoVehiculo || 'No especificado'}</p>
                  <p><strong>Período:</strong> {selectedOrden.fechaInicio ? formatFecha(selectedOrden.fechaInicio) : 'N/A'} - {selectedOrden.fechaFin ? formatFecha(selectedOrden.fechaFin) : 'N/A'}</p>
                  <p><strong>Monto Total:</strong> ₡{selectedOrden.montoTotal?.toLocaleString('es-CR') || 'N/A'}</p>
                </div>
              </div>
              <Button 
                variant="primary"
                onClick={handleDownloadPdf}
                className="mb-2"
              >
                <i className="bi bi-download"></i> Descargar PDF
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}