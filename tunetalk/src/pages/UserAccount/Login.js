import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../authentication/UserState";
import axios from "axios"; 
import "../../css/App.css"; 

export const Login = () => {

    const [userLogin, setUserLogin] = useState(""); // Will accept either login or sign up
    const [loginPassword, setLoginPassword] = useState("");
    const [alertMessage, setAlertMessage] = useState(""); // Variable that stores message at the bottom of page depending on whether user input.
    const [user, setUser] = useUser();

    // Vairiable to store import useNavigate 
    const navigate = useNavigate();

    // Function that handles what happens login button is clicked.
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        console.log(userLogin, loginPassword);

        // Connect to tunetalklogin api to see whether the input matches in mongodb
        axios.post("http://localhost:8082/api/tunetalklogin", {
            userLogin: userLogin,
            password: loginPassword,
        })
        .then((res) => {
            const data = res.data;
            console.log(data, "userLogin"); // when the user is logged in creates a variable called userLogin and sets the value to true
            localStorage.setItem("userlogin", userLogin);
            if (data.status === "ok") {
                setAlertMessage("Logged in successfully!");
                setUser ({
                    email: data.user.email,
                    username: data.user.username,
                    bio: data.user.bio,
                    profileImage: data.user.profileImage,
                    isAuthenticated: false // make false because user should only be authenticated once spotify login is successful.
                });
                console.log("user login authenticated in TuneTalk");
            } 
            else if (data.error === "user_not_found") {
                setAlertMessage("User not found. Please check your email address or username again.");
            } 
            else if (data.error === "incorrect_password") {
                setAlertMessage("Incorrect password. Please check password again.");
            } 
            else {
                setAlertMessage("Cannot login. Please check details again.");
            }
        });
    }

    // When user email and username is ok, will prompt them to the spotify account page
    useEffect (() => {
        if (user && user?.email && user?.username) {
            navigate("/account/spotify"); 
        }
    }, [navigate, user, user?.email, user?.username]);

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>Welcome back</h1>
                <h4>Please enter your details to log in.</h4><br/><br/>
                <label>Email or Username:</label><br/>
                <input value={userLogin} onChange={(e) => setUserLogin(e.target.value)} id="userLogin" placeholder="email@gmail.com or username" required/><br/>
                <label>Password:</label><br/>
                <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} type="password" id="loginPassword" placeholder="********" required/>
                <br/>
                <br/><button type="submit" className="login-button">Log In</button><br/>
                <br/>
                { alertMessage && (
                    <div className="alert">{ alertMessage }</div>
                )} <br/>
                <button className="link-btn" type ="button" onClick={() => navigate('/account/register')}>Don't have an account with TuneTalk? Register here.</button><br/>
            </form>
        </div>  
    )
}