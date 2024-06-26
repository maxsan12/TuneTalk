import React, { useState } from "react";
import "./../css/About.css";

export const About = () => {
    const [modalOpen, setModalOpen] = useState(false);

    const Modal = ({ isOpen, onClose, title, children }) => {
        if (!isOpen) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                zIndex: 1000,
            }}>
                <div style={{
                    padding: 20,
                    background: '#fff',
                    borderRadius: 5,
                    maxWidth: '600px',
                    width: '80%', // Adjusted for responsive width
                    position: 'relative',
                    margin: 'auto', // Helps with further centering if needed
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)' // Optional shadow for better focus
                }}>
                    <h2 style={{ marginBottom: '20px' }}>{title}</h2>
                    <div>{children}</div>
                    <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10 }}>Close</button>
                </div>
            </div>
        );
    };

    return (
        <div className="about-page">
            <h1>About TuneTalk</h1>
            <p>Welcome to TuneTalk! This platform is designed to connect music FREAKS from all around the world. Share your favorite tunes, connect with friends, and explore new music together.</p>
            <p>Our mission is to create a vibrant community where music FREAKS can share their passion and discover new artists, albums, and genres.</p>
            <p>Thank you for being a part of our community!</p>
            <br></br><br></br>
            <button className="link-btn" onClick={() => setModalOpen(true)}>View Terms and Conditions</button>
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Terms and Conditions"
            >
                <br></br>
                WARNING!! WARNING!!!
                <br></br><br></br>
                IF YOU'RE NOT A FREAKAZOID,
                <br></br><br></br>
                PLEASE LEAVE FOR UR OWN GOOD.
                <br></br>
                    
            </Modal>
        </div>
    );
}