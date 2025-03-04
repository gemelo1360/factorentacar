import { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { logAction } from '../utils/logService';
import { Mantenimiento } from '../types';

export default function Notificaciones() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [notificaciones, setNotificaciones] = useState<Mantenimiento[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<'success' | 'danger'>('success');

  // Cargar mantenimientos guardados
  useEffect(() => {
    const mantenimientosGuardados = localStorage.getItem('mantenimientos');
    if (mantenimientosGuardados) {
      try {
        const parsed = JSON.parse(mantenimientosGuardados).map((mant: any) => ({
          ...mant,
          fechaCreacion: new Date(mant.fechaCreacion),
          fechaInicio: new Date(mant.fechaInicio),
          fechaFin: new Date(mant.fechaFin)
        }));
        setMantenimientos(parsed);
      } catch (error) {
        console.error('Error parsing mantenimientos:', error);
      }
    }
  }, []);

  // Filtrar notificaciones (mantenimientos que han finalizado)
  useEffect(() => {
    const today = new Date();
    const notificacionesFiltradas = mantenimientos.filter(mant => {
      const fechaFin = new Date(mant.fechaFin);
      return fechaFin <= today && mant.estado !== 'completado';
    });
    
    setNotificaciones(notificacionesFiltradas);
  }, [mantenimientos]);

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

  // Formatear número con separadores de miles y decimales
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Obtener badge para el estado
  const getEstadoBadge = (estado: Mantenimiento['estado']) => {
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
    
    return <Badge bg={badgeMap[estado]}>{estadoMap[estado]}</Badge>;
  };

  // Marcar como completado
  const handleMarcarCompletado = (id: string) => {
    const mantenimientosActualizados = mantenimientos.map(mant => 
      mant.id === id ? { ...mant, estado: 'completado' as const } : mant
    );
    
    setMantenimientos(mantenimientosActualizados);
    localStorage.setItem('mantenimientos', JSON.stringify(mantenimientosActualizados));
    
    // Registrar acción en el log
    logAction('NOTIFICACION', 'Mantenimiento marcado como completado', { id });
    
    setAlertMessage('Mantenimiento marcado como completado');
    setAlertVariant('success');
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      setAlertMessage(null);
    }, 3000);
  };

  // Marcar todos como completados
  const handleMarcarTodosCompletados = () => {
    if (notificaciones.length === 0) return;
    
    if (window.confirm('¿Está seguro que desea marcar todos los mantenimientos como completados?')) {
      const mantenimientosActualizados = mantenimientos.map(mant => {
        const fechaFin = new Date(mant.fechaFin);
        const today = new Date();
        
        if (fechaFin <= today && mant.estado !== 'completado') {
          return { ...mant, estado: 'completado' as const };
        }
        
        return mant;
      });
      
      setMantenimientos(mantenimientosActualizados);
      localStorage.setItem('mantenimientos', JSON.stringify(mantenimientosActualizados));
      
      // Registrar acción en el log
      logAction('NOTIFICACION', 'Todos los mantenimientos marcados como completados');
      
      setAlertMessage('Todos los mantenimientos han sido marcados como completados');
      setAlertVariant('success');
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setAlertMessage(null);
      }, 3000);
    }
  };

  return (
    <div className="container">
      <h1 className="mb-4 text-white">Notificaciones de Mantenimiento</h1>
      
      {alertMessage && (
        <Alert variant={alertVariant} onClose={() => setAlertMessage(null)} dismissible>
          {alertMessage}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            Mantenimientos Finalizados
            <Badge bg="danger" className="ms-2">{notificaciones.length}</Badge>
          </h5>
          {notificaciones.length > 0 && (
            <Button 
              variant="success" 
              size="sm"
              onClick={handleMarcarTodosCompletados}
            >
              Marcar Todos como Completados
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {notificaciones.length === 0 ? (
            <p className="text-muted">No hay notificaciones pendientes.</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Fecha Fin</th>
                  <th>Precio</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {notificaciones.map((notificacion) => (
                  <tr key={notificacion.id} className="table-warning">
                    <td>{notificacion.tipoVehiculo}</td>
                    <td>{notificacion.tipoMantenimiento}</td>
                    <td>{formatFecha(notificacion.fechaFin)}</td>
                    <td>₡{notificacion.precio ? formatNumber(notificacion.precio) : '0,00'}</td>
                    <td>{notificacion.descripcion}</td>
                    <td>{getEstadoBadge(notificacion.estado)}</td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleMarcarCompletado(notificacion.id)}
                      >
                        Marcar como Completado
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Información</h5>
        </Card.Header>
        <Card.Body>
          <p>
            Las notificaciones muestran los mantenimientos que han llegado a su fecha de finalización
            pero que aún no han sido marcados como completados.
          </p>
          <p>
            Cuando un mantenimiento llega a su fecha de finalización, aparecerá una notificación en
            la campanita del menú superior. Al hacer clic en la campanita, se mostrará esta página
            con la lista de mantenimientos pendientes.
          </p>
          <p>
            Para marcar un mantenimiento como completado, haga clic en el botón "Marcar como Completado"
            en la fila correspondiente. También puede marcar todos los mantenimientos como completados
            haciendo clic en el botón "Marcar Todos como Completados" en la parte superior.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}