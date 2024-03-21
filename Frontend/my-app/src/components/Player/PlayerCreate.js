import React, { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from 'react-redux';
import { createPlayerFalse } from "../../slices/ShowMasterSlice"
import "../../layout/forms.css";
const server = process.env.REACT_APP_API_SERVER;

function PlayerCreate() { // bei onCancel das neuladen der benutzer hinzufügen
    // console.log("PlayerCreate")
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState({
        CreateUserComponentEditUserID: "",
        CreateUserComponentEditPassword: "",
        CreateUserComponentEditIsHost: false,
    });
    const token = useSelector(state => state.loginPlayer.token);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        // console.log('Changing:', id, 'Value:', type === "checkbox" ? checked : value);
        setUserData((prevData) => ({
            ...prevData,
            [id]: type === "checkbox" ? checked : value,
        }));
    };
    const goBackButton = () => {
        dispatch(createPlayerFalse())

    }

    const createUser = () => {
        setLoading(true)
        const { CreateUserComponentEditUserID,
            CreateUserComponentEditPassword,
            CreateUserComponentEditIsHost } = userData;

        const requestBody = JSON.stringify({
            "userID": CreateUserComponentEditUserID,
            "password": CreateUserComponentEditPassword,
            "isHost": CreateUserComponentEditIsHost,
        });
        fetch("http://" + server + ':8080/api/players', {
            method: 'Post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: requestBody
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json()
            })
            .then(data => {
                // Verarbeitung der Serverantwort, falls erforderlich

            })
            .catch(error => {
                console.error('Fehler bei der Anmeldung:', error);
            })
            .finally(
                setLoading(false),
                goBackButton()
            );
        // onCancel()
    };

    return (
        <div>
            <div>
                <Button variant="primary" onClick={goBackButton}>
                    zurück
                </Button>
            </div>
            <Form id="UserManagementPageCreateComponent" className="custom-form">
                <Form.Group className="mb-3">
                    <Form.Label>UserID</Form.Label>
                    <Form.Control
                        id="CreateUserComponentEditUserID"
                        type="text"
                        placeholder="UserID eingeben"
                        value={userData.CreateUserComponentEditUserID}
                        onChange={handleChange}
                    />
                    <Form.Text className="text-muted">
                        Die UserID darf nur einmal vorhanden sein.
                    </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        id="CreateUserComponentEditPassword"
                        type="password"
                        placeholder="Password eingeben"
                        value={userData.CreateUserComponentEditPassword}
                        onChange={handleChange}
                    />
                </Form.Group>

                <Form.Group className="mb-2">
                    <Form.Label>Host?</Form.Label>
                    <Form.Check
                        id="CreateUserComponentEditIsHost"
                        type="checkbox"
                        label="Administrator?"
                        checked={userData.CreateUserComponentEditIsHost}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Button id="CreateUserComponentCreateUserButton"
                    variant="primary"
                    type="button"
                    onClick={createUser}>
                    Create
                </Button>
            </Form>
            <div>
                {loading ? (
                    <Spinner animation="border" size="xl" role="status" className="me-2">
                        <span className="sr-only" variant="light"></span>
                    </Spinner>) : null
                }</div>
        </div>
    );
}

export default PlayerCreate;
