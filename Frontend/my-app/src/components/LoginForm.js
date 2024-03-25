import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { setPlayer } from '../slices/LoginPlayerSlice';
import { jwtDecode } from "jwt-decode";
const server = process.env.REACT_APP_API_SERVER;

const LoginForm = () => {
  const dispatch = useDispatch();
  const [userID, setuserID] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const base64 = btoa(`${userID}:${password}`);
  const handleLogin = () => {
    setLoading(true);
    console.log("server: " + server)
    fetch("http://"+server + ':8080/api/authenticate', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${base64}`,
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok or password or userID was wrong');
        }
        // console.log(response.headers.get('Authorization'))
        // Hier kannst du auf den Authorization-Header zugreifen
        const token = response.headers.get('Authorization');
        // console.log("token: " + token)
        const decodedToken = jwtDecode(token);
        const isHost = decodedToken.isHost;
        // console.log("isHost? " + isHost)
        //setzt im redux store die states
        dispatch(setPlayer({
          token: token,
          userID: userID,
          isHost: isHost,
          loggedIn: true
        }))
        return response.json();
      })
      .then(data => {
        // Handle die erfolgreiche Antwort hier
        // console.log("data:", JSON.stringify(data));
      })
      .catch(error => {
        // Handle den Fehler hier
        console.error('Fehler bei der Anmeldung:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  function LoginDialog() {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    useEffect(() => {
      if (show) {
        handleShow();
      }
    }, [show]);
    const customCloseButton = (
      <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>
    );

    return (
      <>
        <Button variant="primary"
          id="OpenLoginDialogButton"
          onClick={handleShow}
          style={{ fontSize: '2.5rem', padding: '25px 100px' }}>
          Login
        </Button>

        <Modal show={show} onHide={handleClose} id="LoginDialog">
          <Modal.Header closeButton={customCloseButton}>
            <Modal.Title>LoginDialog</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>UserID</Form.Label>
                < Form.Control
                  
                  type="text"
                  value={userID}
                  placeholder='UserID'
                  onChange={(e) => setuserID(e.target.value)}
                  autoFocus
                />
              </Form.Group>
              <Form.Group
                className="mb-3"
              >
                <Form.Label>Password:</Form.Label>
                <Form.Control
                  id="LoginDialogPasswordText"
                  type="password"
                  value={password}
                  placeholder='Password'
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button
              variant="light"
              id="PerformLoginButton"
              onClick={handleLogin}
            >
              Login
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {LoginDialog()}

      </div>
      <div style={{ marginLeft: '95%', marginTop: "35%" }}>
        {loading?(
          <Spinner animation="border" size="xl" role="status" className="me-2">
            <span className="sr-only" variant="light"></span>
          </Spinner>):null
        }
      </div>
    </>

  )
};

export default LoginForm;
