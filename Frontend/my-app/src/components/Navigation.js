import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button, Navbar, Container, Nav, Row, Col, Offcanvas } from 'react-bootstrap';
import "../layout/navbar.css"

const Navigation = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const handleLogoutButton = (event) => {
        event.preventDefault();
        // dispatch(deleteUser());
        navigate('/');
    }
    

    return (
        <>
            <Button variant="primary" onClick={handleShow} className="me-2" style={{marginTop: "40vh"}}>
                öffne mich
            </Button>
            <Offcanvas show={show} onHide={handleClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Offcanvas</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                <Navbar expand="lg" className='bg-dark navbar-dark'>
                <Container>
                    <Navbar.Brand as={Link} to="/">Buzzer</Navbar.Brand>
                    <Navbar.Brand as={Link} to="/stream">StreamingPage</Navbar.Brand>
                    <Button variant="danger" onClick={handleLogoutButton}> Logout </Button>
                    {/* Weitere Links hier */}
                </Container>
            </Navbar>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default Navigation;
