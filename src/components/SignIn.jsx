import React from 'react';
import { ReactComponent as GoogleIcon } from '../assets/icons/googleicon.svg';
import { auth, provider, signInWithPopup, signInAnonymously } from "../lib/firebaseConfig";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from '../ThemeContext';

function SignIn() {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

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
            localStorage.setItem("authToken", idToken);
            const response = await axios.post('http://localhost:5000/auth/authentication', {}, {
                headers: {
                    Authorization: `Bearer ${idToken}`
                }
            });

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

        <div className={`${theme === 'light' ? 'bg-[#e6e6e6]' : 'bg-black'} w-screen h-screen text-white flex justify-center items-center`}>


            <div className={`w-[50vw] h-[70vh] flex flex-col justify-center items-center border-4 ${theme === 'dark' ? 'border-[#1E1E1E]' : 'border-gray-100 shadow-md'} rounded-lg p-8`} style={{
                background: `${theme === 'dark'?'linear-gradient(145deg, #1b1b1b, #0e0e0e)':'#f4f4f4'}`,
                // boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.3)'
            }}>
            <div className={`${theme==='light'?'text-black':'text-[#f0f0f0'} text-4xl font-extrabold mb-10`} style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0px 4px 8px rgba(255, 255, 255, 0.1)' }}>WELCOME!</div>
            <button className={`flex items-center justify-center font-semibold p-4 w-[280px] rounded-md ${theme==='dark'?'bg-[#2b2b2b] hover:bg-[#3a3a3a]':'bg-white shadow-md hover:bg-[#cbcbcb] text-black'}  mb-6`} onClick={handleGoogleSignIn} style={{
                // border: '2px solid rgba(255, 0, 85, 0.5)',
                // boxShadow: '0px 0px 10px rgba(255, 0, 85, 0.5)'
            }}>
                <GoogleIcon className="w-6 h-6 mr-4" />
                Continue with Google
            </button>
            <div className={`${theme==='light'?'text-black':'text-white'}`} style={{ fontFamily: 'Orbitron', marginBottom: '12px' }}>
                OR
            </div>
            <button className={`font-semibold p-4 w-[280px] rounded-md ${theme==='dark'?'bg-[#2b2b2b] hover:bg-[#3a3a3a]':'text-white'} bg-indigo-600 hover:bg-indigo-800`} onClick={handleGuestSignIn} style={{
                // border: '2px solid rgba(0, 85, 255, 0.5)',
                // boxShadow: '0px 0px 10px rgba(0, 85, 255, 0.5)'
            }}>Guest login</button>
        </div>
        </div >

    );
}

export default SignIn;
