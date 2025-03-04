import { Container, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <Container className="mt-5">
      <Alert variant="danger">
        <Alert.Heading>Acceso No Autorizado</Alert.Heading>
        <p>
          No tiene los permisos necesarios para acceder a esta página. Esta sección está reservada para administradores.
        </p>
        <hr />
        <div className="d-flex justify-content-end">
          <Link to="/">
            <Button variant="outline-danger">
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </Alert>
    </Container>
  );
}