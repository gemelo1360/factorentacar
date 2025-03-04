import { useState, useEffect } from 'react';
import { Table, Button, Card, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'operador'>('operador');
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener perfiles directamente (no requiere permisos de admin)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role');
        
      if (error) {
        throw error;
      }
      
      setUsers(data || []);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setError('No se pudieron cargar los usuarios. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Usar el endpoint de signup en lugar del admin.createUser
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }
      
      // Actualizar el rol en la tabla de perfiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newUserRole })
        .eq('id', authData.user.id);
        
      if (profileError) {
        throw profileError;
      }
      
      // Limpiar formulario
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('operador');
      setSuccessMessage('Usuario creado exitosamente');
      
      // Recargar lista de usuarios
      fetchUsers();
    } catch (err) {
      console.error('Error al crear usuario:', err);
      setError('No se pudo crear el usuario. Por favor, intente nuevamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'operador') => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      // Actualizar la lista de usuarios
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setSuccessMessage('Rol actualizado exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      setError('No se pudo actualizar el rol. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Gestión de Usuarios</Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}
        
        <Form onSubmit={handleCreateUser} className="mb-4">
          <h6 className="mb-3">Crear Nuevo Usuario</h6>
          <Form.Group className="mb-3" controlId="newUserEmail">
            <Form.Label>Correo Electrónico</Form.Label>
            <Form.Control
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
              placeholder="Ingrese el correo electrónico"
              disabled={isCreating}
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="newUserPassword">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              placeholder="Ingrese la contraseña"
              disabled={isCreating}
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="newUserRole">
            <Form.Label>Rol</Form.Label>
            <Form.Select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'operador')}
              disabled={isCreating}
            >
              <option value="admin">Administrador</option>
              <option value="operador">Operador</option>
            </Form.Select>
          </Form.Group>
          
          <Button variant="primary" type="submit" disabled={isCreating}>
            {isCreating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creando...
              </>
            ) : (
              'Crear Usuario'
            )}
          </Button>
        </Form>
        
        <h6 className="mb-3">Usuarios Registrados</h6>
        {loading ? (
          <div className="text-center my-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted">No hay usuarios registrados.</p>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <Badge bg={user.role === 'admin' ? 'danger' : 'info'}>
                      {user.role === 'admin' ? 'Administrador' : 'Operador'}
                    </Badge>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value as 'admin' | 'operador')}
                      disabled={loading}
                    >
                      <option value="admin">Administrador</option>
                      <option value="operador">Operador</option>
                    </Form.Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}