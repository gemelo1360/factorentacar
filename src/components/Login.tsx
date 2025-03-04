import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('123456789');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Create a demo user if needed
  useEffect(() => {
    const createDemoUser = async () => {
      try {
        // Check if user exists first
        const { data } = await supabase.auth.signInWithPassword({
          email: 'admin@admin.com',
          password: '123456789'
        });
        
        if (!data.user) {
          // User doesn't exist, create it
          await supabase.auth.signUp({
            email: 'admin@admin.com',
            password: '123456789'
          });
          console.log('Demo user created');
        }
      } catch (error) {
        console.error('Error checking/creating demo user:', error);
      }
    };
    
    createDemoUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Use direct Supabase auth instead of context for initial login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        throw authError;
      }
      
      if (data.user) {
        setLoginSuccess(true);
        // Short delay to show success message
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setError('No se pudo iniciar sesión. Por favor, intente nuevamente.');
      }
    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      setError('Credenciales incorrectas. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="bg-dark min-vh-100 d-flex justify-content-center align-items-center">
      <Row className="justify-content-center w-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="shadow-lg">
            <Card.Header className="text-center bg-primary text-white py-3">
              <h4>Facto Rent a Car</h4>
              <p className="mb-0">Sistema de Alquiler de Vehículos</p>
            </Card.Header>
            <Card.Body className="px-4 py-5">
              <h5 className="text-center mb-4">Iniciar Sesión</h5>
              
              {error && (
                <Alert variant="danger">{error}</Alert>
              )}
              
              {loginSuccess && (
                <Alert variant="success">
                  Inicio de sesión exitoso. Redirigiendo...
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Correo Electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Ingrese su correo electrónico"
                    disabled={isLoading || loginSuccess}
                    autoFocus
                  />
                </Form.Group>
                
                <Form.Group className="mb-4" controlId="password">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Ingrese su contraseña"
                    disabled={isLoading || loginSuccess}
                  />
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 py-2" 
                  disabled={isLoading || loginSuccess}
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </Form>
              
              <div className="mt-4 text-center">
                <p className="text-muted small">
                  Credenciales por defecto:<br />
                  Email: admin@admin.com<br />
                  Contraseña: 123456789
                </p>
              </div>
            </Card.Body>
            <Card.Footer className="text-center text-muted py-3">
              <small>© 2025 Facto Rent a Car - Todos los derechos reservados</small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}