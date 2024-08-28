import React from 'react';
import { ReactComponent as GoogleIcon } from '../assets/icons/googleicon.svg';
import { auth, provider, signInWithPopup, signInAnonymously } from "../lib/firebaseConfig";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SignIn() {
    const navigate = useNavigate();

    // Inside SignIn.js after successful sign-in
    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            console.log("Google ID Token:", idToken);
            localStorage.setItem('authToken', idToken);

            const response = await axios.post('http://localhost:5000/auth/authentication', {}, {
                headers: {
                    Authorization: `Bearer ${idToken}`
                }
            });
            console.log(response.data.isSignedIn);
            if (response.data.isSignedIn) {
                navigate("/main");
            }
            else {
                navigate("/newuserinfo");
            }
        } catch (error) {
            console.error("Google Sign-In Error:", error);
        }
    };


    const handleGuestSignIn = async () => {
        try {
            const result = await signInAnonymously(auth);
            const idToken = await result.user.getIdToken();
            console.log("Anonymous User ID Token:", idToken);

            const response = await axios.post('http://localhost:5000/auth/authentication', {}, {
                headers: {
                    Authorization: `Bearer ${idToken}`
                }
            });
            console.log(response.data + " THISISISISISR EPSONSE")
            if (response.data.success) {
                console.log('ky vishy nyi ghe')
                navigate("/main");
            }
            else {
                console.log("Fail vhyaily")
                alert("Login failed");
            }

        } catch (error) {
            console.error("Anonymous Sign-In Error:", error);
        }
    };

    return (
        <div className='bg-[#0a0a0a] w-screen h-screen text-white flex justify-center items-center'>
            <div className="w-[50vw] h-[70vh] flex flex-col justify-center items-center border-4 border-[#1E1E1E] rounded-lg p-8" style={{
                background: 'linear-gradient(145deg, #1b1b1b, #0e0e0e)',
                boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.3)'
            }}>
                <div className="text-4xl font-extrabold mb-10" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0px 4px 8px rgba(255, 255, 255, 0.1)' }}>WELCOME</div>
                <button className='flex items-center justify-center font-semibold p-4 w-[280px] rounded-md bg-[#2b2b2b] hover:bg-[#3a3a3a] mb-6' onClick={handleGoogleSignIn} style={{
                    // border: '2px solid rgba(255, 0, 85, 0.5)',
                    // boxShadow: '0px 0px 10px rgba(255, 0, 85, 0.5)'
                }}>
                    <GoogleIcon className="w-6 h-6 mr-4" />
                    Continue with Google
                </button>
                <div style={{ fontFamily: 'Orbitron', marginBottom: '12px' }}>
                    OR
                </div>
                <button className='font-semibold p-4 w-[280px] rounded-md bg-[#2b2b2b] hover:bg-[#3a3a3a] ' onClick={handleGuestSignIn} style={{
                    // border: '2px solid rgba(0, 85, 255, 0.5)',
                    // boxShadow: '0px 0px 10px rgba(0, 85, 255, 0.5)'
                }}>Guest login</button>
            </div>
        </div>
    );
}

export default SignIn;
